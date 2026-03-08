const { classifyCategory } = require('./classify-news-category');
const { cleanupNewsItems } = require('./news-retention');
const { stripEmojis } = require('./text-sanitize');

const WARNING_TTL_HOURS = 2;
const STRIKE_TTL_HOURS = 24;
const INCIDENT_BUCKET_MINUTES = 10;

async function fetchAlertKeywords(supabase) {
  const { data, error } = await supabase
    .from('alert_keywords')
    .select('kind, language, keyword, weight');
  if (error) throw error;

  const byLanguage = {};
  for (const row of data || []) {
    const lang = row.language;
    if (!byLanguage[lang]) byLanguage[lang] = [];
    byLanguage[lang].push(row);
  }
  return byLanguage;
}

async function fetchAllLocations(supabase) {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name_primary, name_ar, name_en, alt_names, point, region_bbox');
  if (error) throw error;
  return data || [];
}

function scoreTextWithKeywords(text, keywords) {
  const normalized = text || '';
  const scores = {
    WARNING: 0,
    STRIKE: 0,
    NEWS_ONLY: 0,
  };
  if (!keywords) return scores;
  for (const row of keywords) {
    if (!row.keyword) continue;
    if (normalized.includes(row.keyword)) {
      scores[row.kind] += Number(row.weight || 1);
    }
  }
  return scores;
}

function classifyFromScores(scores) {
  if (scores.WARNING === 0 && scores.STRIKE === 0) {
    return { type: 'NEWS_ONLY', severity: 0, confidence: 0 };
  }
  if (scores.STRIKE > scores.WARNING) {
    return { type: 'STRIKE', severity: 3, confidence: Math.min(1, scores.STRIKE / 3) };
  }
  return { type: 'WARNING', severity: 2, confidence: Math.min(1, scores.WARNING / 3) };
}

function normalizeArabic(text) {
  if (!text) return '';
  const cleaned = stripEmojis(text);
  return cleaned
    .replace(/^Ø§Ù„/g, '')
    .replace(/\sØ§Ù„/g, ' ')
    .replace(/^[ÙØ¨Ù„Ùˆ]/g, '')
    .replace(/\s[ÙØ¨Ù„Ùˆ]/g, ' ')
    .trim();
}

async function resolveLocationFromText(text, allLocations) {
  if (!text || !allLocations) return null;

  const normalizedText = normalizeArabic(text);
  const sorted = [...allLocations].sort((a, b) => {
    const lenA = (a.name_ar || '').length;
    const lenB = (b.name_ar || '').length;
    return lenB - lenA;
  });

  for (const loc of sorted) {
    const nameAr = loc.name_ar;
    if (nameAr && text.includes(nameAr)) {
      return loc;
    }

    const normNameAr = normalizeArabic(nameAr);
    if (normNameAr && normNameAr.length > 2 && normalizedText.includes(normNameAr)) {
      return loc;
    }
  }

  return null;
}

function computeIncidentBucket(dateUtc) {
  const d = new Date(dateUtc);
  const ms = d.getTime();
  const bucketMs = INCIDENT_BUCKET_MINUTES * 60 * 1000;
  const bucketStart = new Date(Math.floor(ms / bucketMs) * bucketMs);
  return bucketStart.toISOString();
}

function ttlForType(alertType) {
  if (alertType === 'STRIKE') return STRIKE_TTL_HOURS;
  if (alertType === 'WARNING') return WARNING_TTL_HOURS;
  return 1;
}

async function createOrUpdateIncident(supabase, message, classification, location) {
  const bucketStart = computeIncidentBucket(message.date_utc);
  const { data: activeAlerts, error: selectError } = await supabase
    .from('incidents')
    .select('id, alert_type, severity, confidence, started_at')
    .eq('location_id', location.id)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: false });
  if (selectError) throw selectError;

  const now = new Date();
  const hours = ttlForType(classification.type);
  const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
  const existingWarning = activeAlerts?.find((a) => a.alert_type === 'WARNING');
  const sameBucket = activeAlerts?.find((a) => a.alert_type === classification.type);

  if (classification.type === 'STRIKE' && existingWarning) {
    const { data: upgraded, error: upgradeError } = await supabase
      .from('incidents')
      .update({
        alert_type: 'STRIKE',
        last_update_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        severity: 3,
        confidence: classification.confidence,
      })
      .eq('id', existingWarning.id)
      .select('id')
      .single();
    if (upgradeError) throw upgradeError;
    return upgraded.id;
  }

  if (sameBucket) {
    const newSeverity = Math.max(sameBucket.severity, classification.severity);
    const newConfidence = Math.max(Number(sameBucket.confidence), classification.confidence);
    const { data: updated, error: updateError } = await supabase
      .from('incidents')
      .update({
        last_update_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        severity: newSeverity,
        confidence: newConfidence,
      })
      .eq('id', sameBucket.id)
      .select('id')
      .single();
    if (updateError) throw updateError;
    return updated.id;
  }

  const incidentKey = `${classification.type}|${location.id}|${bucketStart}`;
  const { data: inserted, error: insertError } = await supabase
    .from('incidents')
    .insert({
      alert_type: classification.type,
      incident_key: incidentKey,
      location_id: location.id,
      location_name: location.name,
      started_at: message.date_utc,
      last_update_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      severity: classification.severity,
      confidence: classification.confidence,
      status: 'ACTIVE',
      geo_point: location.point,
      geo_region: location.region || null,
    })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return inserted.id;
}

async function attachMessageToIncident(supabase, incidentId, telegramInboxId) {
  const { error } = await supabase.from('incident_messages').insert({
    incident_id: incidentId,
    telegram_message_id: telegramInboxId,
    role: 'FOLLOWUP',
  });
  if (error) throw error;
}

async function createNewsItemFromMessage(supabase, message, classification, location, incidentId) {
  const summaryRaw = message.text_ar || '';
  const summary = stripEmojis(summaryRaw);
  const category = classifyCategory(null, summary);
  const { error } = await supabase.from('news_items').insert({
    source: 'TELEGRAM',
    source_ref: message.dedupe_id,
    title: null,
    summary: summary.slice(0, 512),
    summary_en: null,
    title_ar: null,
    summary_ar: summary.slice(0, 512),
    body: null,
    language: 'ar',
    location_name: location ? location.name : null,
    alert_type: classification.type === 'NEWS_ONLY' ? null : classification.type,
    incident_id: incidentId || null,
    published_at: message.date_utc,
    category,
  });
  if (error) throw error;
}

async function expireOldIncidents(supabase) {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('incidents')
    .update({ status: 'EXPIRED' })
    .lt('expires_at', nowIso)
    .eq('status', 'ACTIVE');
  if (error) {
    console.error('Error expiring incidents', error);
  }
}

function buildLocation(locationMatch) {
  if (!locationMatch) return null;
  return {
    id: locationMatch.id,
    name: locationMatch.name_primary || locationMatch.name_en || locationMatch.name_ar,
    point: locationMatch.point,
    region: locationMatch.region_bbox,
  };
}

async function markInboxRow(supabase, id, patch) {
  await supabase
    .from('telegram_inbox')
    .update(patch)
    .eq('id', id);
}

async function processTelegramInboxRow(supabase, msg, context) {
  try {
    if (!msg.text_ar || !String(msg.text_ar).trim()) {
      await markInboxRow(supabase, msg.id, {
        processing_status: 'INVALID',
        processing_error: 'Empty text',
        processed_at: new Date().toISOString(),
      });
      return { status: 'INVALID', incidentId: null };
    }

    const scoresAr = scoreTextWithKeywords(msg.text_ar, context.keywordsByLanguage.ar);
    const classification = classifyFromScores(scoresAr);
    const location = buildLocation(await resolveLocationFromText(msg.text_ar, context.allLocations));

    let incidentId = null;
    if (classification.type !== 'NEWS_ONLY' && location) {
      incidentId = await createOrUpdateIncident(supabase, msg, classification, location);
      await attachMessageToIncident(supabase, incidentId, msg.id);
    }

    await createNewsItemFromMessage(supabase, msg, classification, location, incidentId);
    await markInboxRow(supabase, msg.id, {
      processing_status: 'PROCESSED',
      processed_at: new Date().toISOString(),
      incident_id: incidentId,
      text_en: null,
      processing_error: null,
    });
    return { status: 'PROCESSED', incidentId };
  } catch (e) {
    console.error('Error processing telegram_inbox row id=', msg.id, e);
    const errorMessage = e && e.stack ? e.stack : (e && e.message ? e.message : String(e));
    await markInboxRow(supabase, msg.id, {
      processing_status: 'ERROR',
      processing_error: errorMessage.slice(0, 1000),
      processed_at: new Date().toISOString(),
    });
    return { status: 'ERROR', incidentId: null };
  }
}

async function createProcessingContext(supabase) {
  const [keywordsByLanguage, allLocations] = await Promise.all([
    fetchAlertKeywords(supabase),
    fetchAllLocations(supabase),
  ]);
  return { keywordsByLanguage, allLocations };
}

async function processPendingBatch(supabase, limit = 50) {
  const context = await createProcessingContext(supabase);
  const { data: messages, error } = await supabase
    .from('telegram_inbox')
    .select('*')
    .eq('processing_status', 'PENDING')
    .order('date_utc', { ascending: true })
    .limit(limit);
  if (error) throw error;
  if (!messages || messages.length === 0) {
    return { processed: 0 };
  }

  let processedCount = 0;
  for (const msg of messages) {
    const result = await processTelegramInboxRow(supabase, msg, context);
    if (result.status === 'PROCESSED') {
      processedCount += 1;
    }
  }

  await expireOldIncidents(supabase);
  await cleanupNewsItems(supabase, 200);
  return { processed: processedCount };
}

module.exports = {
  createProcessingContext,
  processPendingBatch,
  processTelegramInboxRow,
};
