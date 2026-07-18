export function normalizeAtsText(value) {
  return String(value)
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/[-‐‑‒–—]\s*\r?\n\s*/g, '-')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('de-CH');
}

export const atsNormalizationConfig = {
  unicode: 'NFKC',
  caseInsensitive: true,
  hyphenatedLineBreaksJoined: true,
  whitespaceCollapsed: true,
};


export function joinPdfTextItems(items) {
  return items
    .map((item) => `${item.str}${item.hasEOL ? '\n' : ' '}`)
    .join('')
    .trim();
}
