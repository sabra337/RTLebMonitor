const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INGEST_SECRET = process.env.INGEST_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = async (req, res) => {
    // 1. Validate Method
    if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    // 2. Validate Secret
    const incomingSecret = req.headers['x-ingest-secret'];
    if (!INGEST_SECRET || incomingSecret !== INGEST_SECRET) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    // 3. Simple Ingestion
    const payload = req.body;
    if (!payload || !payload.text) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Missing payload text' }));
    }

    try {
        const { data, error } = await supabase
            .from('telegram_inbox')
            .insert({
                source: payload.source || 'telegram',
                chat_id: payload.chat_id,
                message_id: payload.message_id,
                date_utc: payload.date_utc || new Date().toISOString(),
                text_ar: payload.text,
                dedupe_id: payload.dedupe_id,
                forwarded_from: payload.forwarded_from,
                media_flags: payload.media_flags,
                channel_name: payload.channel_name,
                processing_status: 'PENDING'
            })
            .select('id')
            .single();

        if (error) {
            // Handle unique constraint (idempotency)
            if (error.code === '23505') {
                res.statusCode = 200;
                return res.end(JSON.stringify({ ok: true, status: 'already_exists' }));
            }
            throw error;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, id: data.id }));
    } catch (err) {
        console.error('Ingest error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
};
