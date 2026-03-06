import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TelegramPayload = {
  source?: string;
  chat_id: string;
  message_id: number;
  date_utc: string;
  text: string;
  dedupe_id?: string;
  forwarded_from?: string;
  media_flags?: unknown;
  channel_name?: string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const INGEST_SECRET = Deno.env.get('INGEST_SECRET') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase URL or service role key not set in environment.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = req.headers.get('X-Ingest-Secret');
  if (!INGEST_SECRET || !secret || secret !== INGEST_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: TelegramPayload;
  try {
    payload = (await req.json()) as TelegramPayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!payload.chat_id || !payload.message_id || !payload.date_utc || !payload.text) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const dateUtc = new Date(payload.date_utc);
  if (Number.isNaN(dateUtc.getTime())) {
    return jsonResponse({ error: 'Invalid date_utc' }, 400);
  }

  const dedupeId = payload.dedupe_id ?? `tg:${payload.chat_id}:${payload.message_id}`;

  const { error } = await supabase.from('telegram_inbox').insert({
    source: payload.source ?? 'telegram',
    chat_id: payload.chat_id,
    message_id: payload.message_id,
    date_utc: dateUtc.toISOString(),
    text_ar: payload.text,
    text_en: null,
    dedupe_id: dedupeId,
    forwarded_from: payload.forwarded_from ?? null,
    media_flags: payload.media_flags ?? null,
    channel_name: payload.channel_name ?? null,
    processing_status: 'PENDING',
  });

  if (error) {
    // Unique violation (duplicate dedupe_id) should be treated as success (idempotent ingestion)
    if ((error as any).code === '23505') {
      return jsonResponse({ ok: true, deduped: true });
    }

    console.error('Error inserting telegram_inbox row', error);
    return jsonResponse({ error: 'Database error' }, 500);
  }

  return jsonResponse({ ok: true });
});

