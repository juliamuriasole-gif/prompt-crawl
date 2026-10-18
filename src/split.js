/**
 * Split markdown/text into clause units.
 * Keeps short headings as units; splits body into sentences.
 * @param {string} text
 * @returns {string[]}
 */
export function splitClauses(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/);
  /** @type {string[]} */
  const units = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    for (const line of lines) {
      if (isHeading(line) || isListItem(line)) {
        const cleaned = cleanUnit(line);
        if (cleaned) units.push(cleaned);
        continue;
      }
      for (const sentence of splitSentences(line)) {
        const cleaned = cleanUnit(sentence);
        if (cleaned) units.push(cleaned);
      }
    }
  }

  return units;
}

/** @param {string} line */
function isHeading(line) {
  return /^#{1,6}\s+\S/.test(line) || (/^[A-Z][A-Za-z0-9 ,/&-]{0,60}$/.test(line) && line.length < 60 && !/[.!?]$/.test(line));
}

/** @param {string} line */
function isListItem(line) {
  return /^[-*+]\s+\S/.test(line) || /^\d+[.)]\s+\S/.test(line);
}

/** @param {string} line */
function splitSentences(line) {
  // Split on sentence terminators followed by space + capital, keep abbreviations crude
  const parts = line.split(/(?<=[.!?])\s+(?=[A-Z"'])/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** @param {string} s */
function cleanUnit(s) {
  return s
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
