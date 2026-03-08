require('dotenv').config();

const express = require('express');
const ingestRssHandler = require('./api/ingest-rss');
const ingestTelegramHandler = require('./api/ingest-telegram');
const processTelegramHandler = require('./api/process-telegram');
const getNews = require('./api/get-news');
const getIncidents = require('./api/get-incidents');
const backfillRssNews = require('./api/backfill-rss-news');
const { isCronAuthConfigured } = require('./lib/cron-auth');
const { isPublicSupabaseConfigured } = require('./lib/supabase-public');

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3001';

if (process.env.NODE_ENV === 'production' && !isCronAuthConfigured()) {
  throw new Error('CRON_SECRET must be configured in production.');
}
if (process.env.NODE_ENV === 'production' && !isPublicSupabaseConfigured()) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY must be configured in production.');
}

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.all('/api/ingest-rss', (req, res) => ingestRssHandler(req, res));
app.post('/api/backfill-rss-news', (req, res) => backfillRssNews(req, res));
app.post('/api/ingest-telegram', (req, res) => ingestTelegramHandler(req, res));
app.all('/api/process-telegram', (req, res) => processTelegramHandler(req, res));
app.get('/api/news', (req, res) => getNews(req, res));
app.get('/api/incidents', (req, res) => getIncidents(req, res));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(port, () => {
  console.log(`Lebanon Monitor backend test server listening on http://localhost:${port}`);
});

