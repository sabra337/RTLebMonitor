function hasValidCronAuth(req) {
  const cronSecret = String(process.env.CRON_SECRET || '').trim();
  if (!cronSecret) {
    return true;
  }
  const auth = String(req.headers.authorization || '');
  return auth === `Bearer ${cronSecret}`;
}

function rejectCronAuth(res) {
  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Unauthorized' }));
}

module.exports = { hasValidCronAuth, rejectCronAuth };
