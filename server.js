require('dotenv').config();

const express = require('express');
const ingestRssHandler = require('./api/ingest-rss');
const ingestTelegramHandler = require('./api/ingest-telegram');
const processTelegramHandler = require('./api/process-telegram');
const getNews = require('./api/get-news');
const getIncidents = require('./api/get-incidents');
const translateNews = require('./api/translate-news');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.all('/api/ingest-rss', (req, res) => ingestRssHandler(req, res));
app.post('/api/ingest-telegram', (req, res) => ingestTelegramHandler(req, res));
app.all('/api/process-telegram', (req, res) => processTelegramHandler(req, res));
app.get('/api/news', (req, res) => getNews(req, res));
app.get('/api/incidents', (req, res) => getIncidents(req, res));
app.post('/api/translate-news', (req, res) => translateNews(req, res));
app.get('/api/translate-news', (req, res) => translateNews(req, res));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(port, () => {
  console.log(`Lebanon Monitor backend test server listening on http://localhost:${port}`);
});

