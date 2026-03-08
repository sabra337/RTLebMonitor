const { applyCors, handleOptions } = require('../lib/cors');
const { createPublicSupabaseClient } = require('../lib/supabase-public');

const VALID_CATEGORIES = ['LEBANON', 'REGIONAL', 'WORLDWIDE'];
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

/**
 * GET /api/news
 * Query params: category (optional) LEBANON | REGIONAL | WORLDWIDE, limit (optional, default 100)
 * Returns: { lebanon: [], regional: [], worldwide: [] } or single list if ?category=X
 * Each item: { id, headline, summary, time, source, category, link, language }
 * headline/summary use stored title/summary.
 */
async function getNews(req, res) {
  if (handleOptions(req, res, 'GET,OPTIONS')) {
    return;
  }
  applyCors(req, res, 'GET,OPTIONS');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const query = req.query || (req.url ? Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams) : {});
  const categoryParam = query.category || '';
  const categoryFilter = String(categoryParam).toUpperCase();
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);

  try {
    const supabase = createPublicSupabaseClient();
    let query = supabase
      .from('news_items')
      .select('id, source, source_ref, source_label, title, summary, published_at, category, language')
      .order('published_at', { ascending: false })
      .limit(limit * 3);

    if (VALID_CATEGORIES.includes(categoryFilter)) {
      query = query.eq('category', categoryFilter);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('get-news error', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Database error' }));
      return;
    }

    const items = (rows || []).map((row) => ({
      id: row.id,
      headline: row.title || row.summary || '',
      summary: row.summary || '',
      time: row.published_at,
      source: row.source_label || (row.source === 'TELEGRAM' ? 'Telegram' : row.source_ref || ''),
      category: row.category || 'WORLDWIDE',
      link: row.source_ref && (row.source_ref.startsWith('http') ? row.source_ref : null),
      language: row.language,
    }));

    if (VALID_CATEGORIES.includes(categoryFilter)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ category: categoryFilter, items }));
      return;
    }

    const byCategory = {
      LEBANON: items.filter((i) => i.category === 'LEBANON'),
      REGIONAL: items.filter((i) => i.category === 'REGIONAL'),
      WORLDWIDE: items.filter((i) => i.category === 'WORLDWIDE'),
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(byCategory));
  } catch (e) {
    console.error('get-news error', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
}

module.exports = getNews;
