const { createClient } = require('@supabase/supabase-js');
const { applyCors, handleOptions } = require('../lib/cors');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseEwkbPoint(ewkbHex) {
    if (!ewkbHex || typeof ewkbHex !== 'string') return null;

    const normalized = ewkbHex.startsWith('\\x') ? ewkbHex.slice(2) : ewkbHex;
    if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length < 42 || normalized.length % 2 !== 0) {
        return null;
    }

    const buffer = Buffer.from(normalized, 'hex');
    const littleEndian = buffer.readUInt8(0) === 1;

    const readUInt32 = littleEndian ? buffer.readUInt32LE.bind(buffer) : buffer.readUInt32BE.bind(buffer);
    const readDouble = littleEndian ? buffer.readDoubleLE.bind(buffer) : buffer.readDoubleBE.bind(buffer);

    let offset = 1;
    const typeWithFlags = readUInt32(offset);
    offset += 4;

    const baseType = typeWithFlags & 0x000000ff;
    const hasSrid = (typeWithFlags & 0x20000000) !== 0;
    if (baseType !== 1) return null;

    if (hasSrid) {
        offset += 4; // SRID
    }

    if (buffer.length < offset + 16) return null;

    const lng = readDouble(offset);
    const lat = readDouble(offset + 8);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
}

/**
 * GET /api/incidents
 * Returns: { items: [ { id, text, type, location, time } ] }
 * text is formatted as "Strike on [Location]" or "Warning on [Location]"
 */
module.exports = async (req, res) => {
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

    try {
        const { data: incidents, error } = await supabase
            .from('incidents')
            .select('id, alert_type, location_name, started_at, severity, geo_point')
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
                severity: inc.severity,
                coordinates: parseEwkbPoint(inc.geo_point)
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
