/**
 * Classify news into LEBANON | REGIONAL | WORLDWIDE from title and summary.
 * Used at ingest time so the API can filter by category.
 */
const LEBANON_KEYWORDS = [
  'lebanon', 'lebanese', 'beirut', 'tyre', 'sidon', 'tripoli', 'baalbek',
  'lebanon24', 'lbc', 'al jadeed', 'almanar', 'دولة لبنان', 'لبنان', 'بيروت', 'صيدا', 'صور', 'طرابلس'
];

const REGIONAL_KEYWORDS = [
  'syria', 'syrian', 'israel', 'israeli', 'gaza', 'palestine', 'palestinian',
  'iran', 'iranian', 'iraq', 'iraqi', 'jordan', 'jordanian', 'egypt', 'egyptian',
  'turkey', 'turkish', 'hezbollah', 'hamas', 'idf', 'tel aviv', 'damascus',
  'سوريا', 'إسرائيل', 'غزة', 'فلسطين', 'إيران', 'حزب الله', 'حماس'
];

function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

function containsAny(text, keywords) {
  const n = normalize(text);
  return keywords.some((kw) => n.includes(kw.toLowerCase()));
}

/**
 * @param {string} title
 * @param {string} summary
 * @returns {'LEBANON'|'REGIONAL'|'WORLDWIDE'}
 */
function classifyCategory(title, summary) {
  const combined = [title, summary].filter(Boolean).join(' ');
  if (containsAny(combined, LEBANON_KEYWORDS)) return 'LEBANON';
  if (containsAny(combined, REGIONAL_KEYWORDS)) return 'REGIONAL';
  return 'WORLDWIDE';
}

module.exports = { classifyCategory };
