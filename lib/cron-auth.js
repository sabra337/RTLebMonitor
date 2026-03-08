function getCronSecret() {
  return String(process.env.CRON_SECRET || '').trim();
}

function isCronAuthConfigured() {
  return getCronSecret().length > 0;
}

function hasValidCronAuth(req) {
  const cronSecret = getCronSecret();
  if (!cronSecret) return false;
  const auth = String(req.headers.authorization || '');
  return auth === `Bearer ${cronSecret}`;
}

function rejectCronAuth(res) {
  if (!isCronAuthConfigured()) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'CRON_SECRET is not configured' }));
    return;
  }

  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Unauthorized' }));
}

module.exports = { hasValidCronAuth, rejectCronAuth, isCronAuthConfigured };
