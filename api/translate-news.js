const { createClient } = require('@supabase/supabase-js');
const { translateToEnglish } = require('../lib/translate');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BATCH_SIZE = 20;
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/translate-news
 * Finds news_items with language='ar' and (title_en is null or summary_en is null),
 * translates title/summary to English, updates the row.
 * Optional query: limit (default 50).
 */
async function runTranslateNews(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const query = req.query || (req.url ? Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams) : {});
  const limit = Math.min(parseInt(query.limit, 10) || 50, 100);

  if (!process.env.OPENAI_API_KEY && !process.env.LIBRE_TRANSLATE_URL) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: true,
        translated: 0,
        message: 'No translation provider (OPENAI_API_KEY or LIBRE_TRANSLATE_URL) configured',
      })
    );
    return;
  }

  try {
    const { data: rows, error } = await supabase
      .from('news_items')
      .select('id, title, summary, title_en, summary_en')
      .eq('language', 'ar')
      .or('title_en.is.null,summary_en.is.null')
      .limit(limit)
      .order('published_at', { ascending: false });

    if (error) throw error;

    let translated = 0;
    for (const row of rows || []) {
      const titleEn = row.title_en || (row.title ? await translateToEnglish(row.title) : null);
      const summaryEn = row.summary_en || (row.summary ? await translateToEnglish(row.summary) : null);
      if (titleEn || summaryEn) {
        const { error: upErr } = await supabase
          .from('news_items')
          .update({
            ...(titleEn && { title_en: titleEn }),
            ...(summaryEn && { summary_en: summaryEn }),
          })
          .eq('id', row.id);
        if (!upErr) translated += 1;
      }
      await sleep(DELAY_MS);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, translated, processed: (rows || []).length }));
  } catch (e) {
    console.error('translate-news error', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
}

module.exports = runTranslateNews;
