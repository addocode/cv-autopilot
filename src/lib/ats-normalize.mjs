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

    const previousX = previous.transform?.[4] ?? 0;
    const previousY = previous.transform?.[5] ?? 0;
    const currentX = item.transform?.[4] ?? 0;
    const currentY = item.transform?.[5] ?? 0;
    const previousHeight = Math.abs(previous.height || previous.transform?.[3] || 10);
    const currentHeight = Math.abs(item.height || item.transform?.[3] || 10);
    const referenceHeight = Math.max(1, Math.min(previousHeight, currentHeight));
    const baselineDelta = Math.abs(currentY - previousY);
    const baselineTolerance = Math.max(1.5, referenceHeight * 0.55);
    const sameVisualLine = baselineDelta <= baselineTolerance;
    const previousEndX = previousX + Math.abs(previous.width || 0);
    const horizontalGap = currentX - previousEndX;
    const significantXReset = currentX < previousX - Math.max(3, referenceHeight * 0.5);
    const realLineBreak = !sameVisualLine || (previous.hasEOL && significantXReset);
    const wordGapThreshold = Math.max(1.2, referenceHeight * 0.16);
    const alreadySeparated = /\s$/.test(output) || /^\s/.test(text);

    if (realLineBreak) {
      output += `\n${text}`;
      stats.insertedLineBreakCount += 1;
    } else if (horizontalGap > wordGapThreshold && !alreadySeparated) {
      output += ` ${text}`;
      stats.insertedSpaceCount += 1;
    } else {
      output += text;
      stats.fragmentJoinCount += 1;
      if (stats.fragmentJoinExamples.length < 12) {
        stats.fragmentJoinExamples.push({
          before: [String(previous.str || ''), text],
          after: `${String(previous.str || '')}${text}`,
          previousHasEOL: Boolean(previous.hasEOL),
          baselineDelta: Number(baselineDelta.toFixed(2)),
          horizontalGap: Number(horizontalGap.toFixed(2)),
        });
      }
    }

    previous = item;
  }

  return output.trim();
}
