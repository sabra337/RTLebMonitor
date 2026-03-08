const { createClient } = require('@supabase/supabase-js');
const { classifyCategory } = require('../lib/classify-news-category');
const { cleanupNewsItems } = require('../lib/news-retention');
const { hasValidCronAuth, rejectCronAuth } = require('../lib/cron-auth');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FETCH_PAGE_SIZE = 200;
const UPSERT_BATCH_SIZE = 200;
const DEFAULT_MAX_ROWS = 5000;
const HARD_MAX_ROWS = 20000;

function parseQuery(req) {
  return req.query || (req.url ? Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams) : {});
}

function rowForNewsItem(row) {
  const sourceRef = row.guid || row.link;
  const title = row.title || null;
  const summary = (row.summary || '').slice(0, 512);
  const sourceMeta = row.rss_sources || null;

  return {
    source: 'RSS',
    source_ref: sourceRef,
    title,
    summary,
    body: row.body || null,
    language: row.language || sourceMeta?.language || null,
    location_name: null,
    alert_type: null,
    incident_id: null,
    published_at: row.published_at || new Date().toISOString(),
    category: classifyCategory(title, summary),
    source_label: sourceMeta?.name || null,
    title_en: null,
    summary_en: null,
  };
}

async function upsertChunk(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from('news_items')
    .upsert(rows, { onConflict: 'source,source_ref', ignoreDuplicates: false });

  if (error) throw error;
}

async function backfillFromRssInbox(maxRows) {
  let offset = 0;
  let processed = 0;
  let attemptedUpserts = 0;

  while (processed < maxRows) {
    const pageLimit = Math.min(FETCH_PAGE_SIZE, maxRows - processed);
    const { data: rows, error } = await supabase
      .from('rss_inbox')
      .select('id, guid, link, title, summary, body, published_at, language, source_id, rss_sources(name, language)')
      .order('published_at', { ascending: false })
      .range(offset, offset + pageLimit - 1);

    if (error) throw error;
    if (!rows || rows.length === 0) break;

    const mapped = rows
      .filter((row) => row.link || row.guid)
      .map(rowForNewsItem);

    for (let i = 0; i < mapped.length; i += UPSERT_BATCH_SIZE) {
      const chunk = mapped.slice(i, i + UPSERT_BATCH_SIZE);
      await upsertChunk(chunk);
      attemptedUpserts += chunk.length;
    }

    processed += rows.length;
    offset += rows.length;
  }

  await cleanupNewsItems(supabase, 200);
  return { processedRssRows: processed, attemptedUpserts };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
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
    const query = parseQuery(req);
    const maxRows = Math.min(Math.max(parseInt(query.maxRows, 10) || DEFAULT_MAX_ROWS, 1), HARD_MAX_ROWS);
    const result = await backfillFromRssInbox(maxRows);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, maxRows, ...result }));
  } catch (e) {
    console.error('backfill-rss-news error', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
};
