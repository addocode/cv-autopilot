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

export function joinPdfTextItems(items, stats = {}) {
  let output = '';
  let previous = null;
  stats.fragmentJoinCount ??= 0;
  stats.insertedSpaceCount ??= 0;
  stats.insertedLineBreakCount ??= 0;
  stats.fragmentJoinExamples ??= [];

  for (const item of items) {
    const text = String(item?.str || '');
    if (!text) continue;

    if (!previous) {
      output += text;
      previous = item;
      continue;
    }

    if (previous.hasEOL) {
      output += `\n${text}`;
      stats.insertedLineBreakCount += 1;
      previous = item;
      continue;
    }

    const previousX = previous.transform?.[4] ?? 0;
    const previousY = previous.transform?.[5] ?? 0;
    const currentX = item.transform?.[4] ?? 0;
    const currentY = item.transform?.[5] ?? 0;
    const previousHeight = Math.abs(previous.height || 0);
    const currentHeight = Math.abs(item.height || 0);
    const referenceHeight = Math.max(1, Math.min(previousHeight || 10, currentHeight || 10));
    const sameLine = Math.abs(currentY - previousY) <= referenceHeight * 0.35;
    const previousEndX = previousX + Math.abs(previous.width || 0);
    const horizontalGap = currentX - previousEndX;
    const realWordGap = sameLine && horizontalGap > Math.max(0.8, referenceHeight * 0.12);
    const alreadySeparated = /\s$/.test(output) || /^\s/.test(text);

    if (!sameLine) {
      output += `\n${text}`;
      stats.insertedLineBreakCount += 1;
    } else if (realWordGap && !alreadySeparated) {
      output += ` ${text}`;
      stats.insertedSpaceCount += 1;
    } else {
      output += text;
      if (!alreadySeparated && sameLine && horizontalGap >= -0.5) {
        stats.fragmentJoinCount += 1;
        if (stats.fragmentJoinExamples.length < 8) stats.fragmentJoinExamples.push({ before: [String(previous.str || ''), text], after: `${String(previous.str || '')}${text}` });
      }
    }

    previous = item;
  }

  return output.trim();
}
