const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/incidents
 * Returns: { items: [ { id, text, type, location, time } ] }
 * text is formatted as "Strike on [Location]" or "Warning on [Location]"
 */
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        const { data: incidents, error } = await supabase
            .from('incidents')
            .select('id, alert_type, location_name, started_at, severity')
            .eq('status', 'ACTIVE')
            .order('started_at', { ascending: false });

        if (error) {
            console.error('get-incidents error', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }

        const items = (incidents || []).map(inc => {
            const typeLabel = inc.alert_type === 'STRIKE' ? 'Strike' : 'Warning';
            return {
                id: inc.id,
                text: `${typeLabel} on ${inc.location_name}`,
                type: inc.alert_type,
                location: inc.location_name,
                time: inc.started_at,
                severity: inc.severity
            };
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ items }));
    } catch (e) {
        console.error('get-incidents error', e);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Internal error' }));
    }
};
