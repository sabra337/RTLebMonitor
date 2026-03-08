const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');
const { classifyCategory } = require('../lib/classify-news-category');
const { cleanupNewsItems } = require('../lib/news-retention');
const { stripEmojis } = require('../lib/text-sanitize');
const { hasValidCronAuth, rejectCronAuth } = require('../lib/cron-auth');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const parser = new Parser();

const BATCH_SIZE = 50;
const BATCH_CONCURRENCY = 2;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function fetchEnabledSources() {
  const { data, error } = await supabase
    .from('rss_sources')
    .select('id, name, url, language')
    .eq('enabled', true);
  if (error) throw error;
  return data || [];
}

function rowForRssInbox(sourceId, item, languageFallback) {
  const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
  return {
    source_id: sourceId,
    guid: item.guid || null,
    link: item.link,
    title: item.title || null,
    summary: (item.contentSnippet || item.summary || '').slice(0, 512),
    body: null,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
    language: languageFallback || null,
    raw: null,
  };
}

function rowForNewsItem(item, languageFallback, guidOrLink, sourceLabel) {
  const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
  const title = stripEmojis(item.title || '') || null;
  const summary = stripEmojis(item.contentSnippet || item.summary || '').slice(0, 512);
  const normalizedLang = String(languageFallback || '').trim().toLowerCase();
  const category = classifyCategory(title, summary);
  return {
    source: 'RSS',
    source_ref: guidOrLink,
    title,
    summary,
    body: null,
    language: languageFallback || null,
    location_name: null,
    alert_type: null,
    incident_id: null,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    category,
    source_label: sourceLabel || null,
    title_en: null,
    summary_en: null,
    title_ar: normalizedLang === 'ar' ? title : null,
    summary_ar: normalizedLang === 'ar' ? summary : null,
  };
}

function isRetryableError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const details = (error.details || '').toLowerCase();
  const status = error.status || error.code;
  return (
    status === 502 ||
    status === 503 ||
    status === 429 ||
    status === 'ECONNRESET' ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    details.includes('econnreset') ||
    details.includes('fetch failed') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function insertRssInboxBatch(rows) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase.from('rss_inbox').insert(rows);
    if (error) {
      if (error.code === '23505') {
        for (const row of rows) {
          const { error: err } = await supabase.from('rss_inbox').insert(row);
          if (err && err.code !== '23505') throw err;
        }
        return;
      }
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw error;
    }
    return;
  }
}

async function upsertNewsItemsBatch(rows) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase
      .from('news_items')
      .upsert(rows, { onConflict: 'source,source_ref', ignoreDuplicates: false });
    if (error) {
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw error;
    }
    return;
  }
}

async function processOneSource(src, items) {
  if (items.length === 0) return { ingested: 0, insertedNews: 0 };
  const rssRows = items.map((item) => rowForRssInbox(src.id, item, src.language));
  const newsRows = items.map((item) =>
    rowForNewsItem(item, src.language, item.guid || item.link, src.name || null)
  );
  const batches = [];
  for (let i = 0; i < rssRows.length; i += BATCH_SIZE) {
    batches.push({
      rss: rssRows.slice(i, i + BATCH_SIZE),
      news: newsRows.slice(i, i + BATCH_SIZE),
    });
  }
  for (let k = 0; k < batches.length; k += BATCH_CONCURRENCY) {
    const chunk = batches.slice(k, k + BATCH_CONCURRENCY);
    await Promise.all(chunk.map(async ({ rss, news }) => {
      // Write to news_items first, then inbox.
      // This avoids the common mismatch where rss_inbox grows while news upsert fails.
      await upsertNewsItemsBatch(news);
      await insertRssInboxBatch(rss);
    }));
  }
  return { ingested: items.length, insertedNews: newsRows.length };
}

async function processRssSources() {
  const sources = await fetchEnabledSources();

  const feedResults = await Promise.all(
    sources.map(async (src) => {
      try {
        const feed = await parser.parseURL(src.url);
        return { source: src, items: feed.items || [] };
      } catch (e) {
        console.error('Error fetching RSS source', src.url, e);
        return { source: src, items: [] };
      }
    })
  );

  let totalItems = 0;
  let totalNewsRows = 0;
  const errors = [];
  for (const { source, items } of feedResults) {
    try {
      const result = await processOneSource(source, items);
      totalItems += result.ingested;
      totalNewsRows += result.insertedNews;
    } catch (e) {
      const message = e && e.message ? e.message : String(e);
      errors.push({ source: source.name || source.url, error: message });
      console.error('Error processing source rows', source.url, e);
    }
  }

  // Retention cleanup
  await cleanupNewsItems(supabase, 200);

  return {
    sources: sources.length,
    items: totalItems,
    newsRowsAttempted: totalNewsRows,
    failedSources: errors.length,
    errors,
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  if (!hasValidCronAuth(req)) {
    rejectCronAuth(res);
    return;
  }

  try {
    const result = await processRssSources();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, ...result }));
  } catch (e) {
    console.error('ingest-rss error', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
};
