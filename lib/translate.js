/**
 * Translate Arabic text to English.
 * Uses OPENAI_API_KEY (OpenAI) or LIBRE_TRANSLATE_URL (LibreTranslate) when set.
 * Returns null if no provider configured or on failure.
 */
async function translateToEnglish(text) {
  if (!text || typeof text !== 'string' || !text.trim()) return null;

  const trimmed = text.trim().slice(0, 4000);
  if (process.env.OPENAI_API_KEY) {
    return translateWithOpenAI(trimmed);
  }
  if (process.env.LIBRE_TRANSLATE_URL) {
    return translateWithLibre(trimmed);
  }
  return null;
}

async function translateWithOpenAI(text) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Translate the following Arabic text to English. Reply with only the translation, no explanation.\n\n${text}`,
          },
        ],
        max_tokens: 500,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const out = data.choices?.[0]?.message?.content?.trim();
    return out || null;
  } catch (e) {
    console.error('OpenAI translate error', e);
    return null;
  }
}

async function translateWithLibre(text) {
  const base = process.env.LIBRE_TRANSLATE_URL.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'ar',
        target: 'en',
        format: 'text',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.translatedText?.trim() || null;
  } catch (e) {
    console.error('LibreTranslate error', e);
    return null;
  }
}

module.exports = { translateToEnglish };
