function parseAllowedOrigins() {
  const configured = String(process.env.FRONTEND_ORIGIN || '').trim();
  if (!configured) return ['*'];
  return configured.split(',').map((o) => o.trim()).filter(Boolean);
}

function applyCors(req, res, methods = 'GET,POST,OPTIONS') {
  const allowedOrigins = parseAllowedOrigins();
  const requestOrigin = req.headers.origin;
  const allowAny = allowedOrigins.includes('*');
  const originToSet = allowAny
    ? '*'
    : (requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]);

  if (originToSet) {
    res.setHeader('Access-Control-Allow-Origin', originToSet);
  }
  if (!allowAny) {
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function handleOptions(req, res, methods = 'GET,POST,OPTIONS') {
  applyCors(req, res, methods);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

module.exports = { applyCors, handleOptions };
