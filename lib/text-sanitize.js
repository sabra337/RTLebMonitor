/**
 * Shared text sanitization for news display/translation pipelines.
 */
function normalizeWhitespace(text) {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim();
}

function stripEmojis(text) {
  if (!text) return '';
  return normalizeWhitespace(
    String(text).replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{23F8}-\u{23FA}]/gu,
      ''
    )
  );
}

module.exports = { normalizeWhitespace, stripEmojis };
