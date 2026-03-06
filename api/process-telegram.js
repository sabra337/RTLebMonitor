const { createClient } = require('@supabase/supabase-js');
const { classifyCategory } = require('../lib/classify-news-category');
const { translateToEnglish } = require('../lib/translate');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WARNING_TTL_HOURS = 2;
const STRIKE_TTL_HOURS = 24;
const INCIDENT_BUCKET_MINUTES = 10;

async function fetchAlertKeywords() {
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

function stripEmojis(text) {
  if (!text) return '';
  // Basic emoji regex pattern (covers most common emojis)
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{23F8}-\u{23FA}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeArabic(text) {
  if (!text) return '';
  const cleaned = stripEmojis(text);
  return cleaned
    .replace(/^ال/g, '') // Remove Al- prefix at start of word
    .replace(/\sال/g, ' ') // Remove Al- prefix after space
    .replace(/^[فبلو]/g, '') // Remove common single-letter prefixes (Fa, Bi, Li, Wa)
    .replace(/\s[فبلو]/g, ' ')
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

/**
 * Creates or updates an incident.
 * Conflict resolution:
 * 1. If an existing incident of the same type exists for the location/bucket, update it.
 * 2. If a STRIKE arrives for a location that has an active WARNING, upgrade the warning to STRIKE if it's in a similar time window.
 */
async function createOrUpdateIncident(message, classification, location) {
  const bucketStart = computeIncidentBucket(message.date_utc);

  // Try to find ANY active incident at this location in the last hour or current bucket
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

  // Check for conflict/upgrade: If we have a STRIKE but existing is WARNING
  const existingWarning = activeAlerts?.find(a => a.alert_type === 'WARNING');
  const existingStrike = activeAlerts?.find(a => a.alert_type === 'STRIKE');

  if (classification.type === 'STRIKE' && existingWarning) {
    // RESOLUTION: Upgrade WARNING to STRIKE
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

  // Normal behavior: Update existing same-type incident if in the same bucket
  const sameBucket = activeAlerts?.find(a => a.alert_type === classification.type);
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

  // No active or matching incident found: Create new
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

async function attachMessageToIncident(incidentId, telegramInboxId) {
  const { error } = await supabase.from('incident_messages').insert({
    incident_id: incidentId,
    telegram_message_id: telegramInboxId,
    role: 'FOLLOWUP',
  });
  if (error) throw error;
}

async function createNewsItemFromMessage(message, classification, location, incidentId, textEn) {
  const summaryRaw = message.text_ar || '';
  const summary = stripEmojis(summaryRaw);
  const category = classifyCategory(null, summary);
  const { error } = await supabase.from('news_items').insert({
    source: 'TELEGRAM',
    source_ref: message.dedupe_id,
    title: null,
    summary: summary.slice(0, 512),
    summary_en: textEn ? textEn.slice(0, 512) : null,
    body: null,
    language: 'ar',
    location_name: location ? location.name : null,
    alert_type: classification.type === 'NEWS_ONLY' ? null : classification.type,
    incident_id: incidentId || null,
    published_at: message.date_utc,
    category: category,
  });
  if (error) throw error;
}

async function expireOldIncidents() {
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

async function processPendingBatch(limit = 50) {
  const keywordsByLanguage = await fetchAlertKeywords();

  // Fetch ALL locations once for this batch to avoid N+1 queries
  const { data: allLocations, error: locError } = await supabase
    .from('locations')
    .select('id, name_primary, name_ar, name_en, alt_names, point, region_bbox');

  if (locError) {
    console.error('Error fetching locations:', locError);
    throw locError;
  }

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
    try {
      if (!msg.text_ar || !String(msg.text_ar).trim()) {
        await supabase
          .from('telegram_inbox')
          .update({
            processing_status: 'INVALID',
            processing_error: 'Empty text',
            processed_at: new Date().toISOString()
          })
          .eq('id', msg.id);
        continue;
      }

      // 1. Classification (Incident vs News)
      const scoresAr = scoreTextWithKeywords(msg.text_ar, keywordsByLanguage['ar']);
      const classification = classifyFromScores(scoresAr);

      // 2. Location Extraction
      const locationMatch = await resolveLocationFromText(msg.text_ar, allLocations);
      const location = locationMatch ? {
        id: locationMatch.id,
        name: locationMatch.name_primary || locationMatch.name_en || locationMatch.name_ar,
        point: locationMatch.point,
        region: locationMatch.region_bbox,
      } : null;

      // 3. Incident Logic (Only for STRIKE/WARNING with a location)
      let incidentId = null;
      if (classification.type !== 'NEWS_ONLY' && location) {
        incidentId = await createOrUpdateIncident(msg, classification, location);
        await attachMessageToIncident(incidentId, msg.id);
      }

      // 4. Translation (Async)
      const textEn = await translateToEnglish(msg.text_ar);

      // 5. Create News Item (Always recorded, regardless of mapping)
      await createNewsItemFromMessage(msg, classification, location, incidentId, textEn);

      // 6. Update Inbox
      await supabase
        .from('telegram_inbox')
        .update({
          processing_status: 'PROCESSED',
          processed_at: new Date().toISOString(),
          incident_id: incidentId,
          text_en: textEn,
          processing_error: null
        })
        .eq('id', msg.id);

      processedCount += 1;
    } catch (e) {
      console.error('Error processing telegram_inbox row id=', msg.id, e);
      const errorMessage = e && e.stack ? e.stack : (e && e.message ? e.message : String(e));
      await supabase
        .from('telegram_inbox')
        .update({
          processing_status: 'ERROR',
          processing_error: errorMessage.slice(0, 1000),
          processed_at: new Date().toISOString(),
        })
        .eq('id', msg.id);
    }
  }

  await expireOldIncidents();
  await cleanupNewsItems(supabase, 200);

  return { processed: processedCount };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const result = await processPendingBatch(50);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, ...result }));
  } catch (e) {
    console.error('process-telegram error', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
};

