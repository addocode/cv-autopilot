import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith('--')) args.set(process.argv[index].slice(2), process.argv[index + 1]);
}
const inputPath = args.get('input');
if (!inputPath) throw new Error('Missing --input');
const data = JSON.parse(readFileSync(inputPath, 'utf8'));

function requiredString(value, path) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${path} must be a non-empty string`);
}
function slug(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'motivation-letter';
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function renderRuns(runs, path) {
  if (!Array.isArray(runs) || !runs.length) throw new Error(`${path}.runs must contain at least one run`);
  return runs.map((run, runIndex) => {
    requiredString(run.text, `${path}.runs[${runIndex}].text`);
    const text = escapeHtml(run.text);
    return run.bold === true ? `<strong>${text}</strong>` : text;
  }).join('');
}

requiredString(data.id, 'id');
if (!Array.isArray(data.titleLines) || data.titleLines.length < 1 || data.titleLines.length > 2) throw new Error('titleLines must contain one or two explicitly reviewed lines');
data.titleLines.forEach((line, index) => requiredString(line, `titleLines[${index}]`));
requiredString(data.salutation, 'salutation');
if (!Array.isArray(data.paragraphs) || !data.paragraphs.length) throw new Error('paragraphs must be a non-empty array');
requiredString(data.signature?.firstName, 'signature.firstName');
requiredString(data.signature?.lastName, 'signature.lastName');
requiredString(data.signature?.domainSuffix, 'signature.domainSuffix');
requiredString(data.signature?.url, 'signature.url');

const plainParagraphs = data.paragraphs.map((paragraph, index) => {
  if (!paragraph || typeof paragraph !== 'object') throw new Error(`paragraphs[${index}] must be an object`);
  return paragraph.runs.map((run) => run.text).join('');
});
const allPlainText = [data.salutation, ...plainParagraphs].join(' ');
const wordCount = allPlainText.trim().split(/\s+/).filter(Boolean).length;
const maxWords = Number(data.maxWords || 300);
if (wordCount > maxWords) throw new Error(`Motivation letter contains ${wordCount} words; maximum is ${maxWords}. Shorten the content instead of reducing the 12 pt reference typography.`);

mkdirSync('dist', { recursive: true });
const outputId = slug(args.get('output-suffix') || data.id);
const previewPath = `dist/motivation-letter-${outputId}-preview.html`;
const pdfPath = `dist/Motivationsschreiben_Adam-Dolinsky_${outputId}.pdf`;
const pngPath = `dist/motivation-letter-${outputId}.png`;
const reportPath = `dist/motivation-letter-report-${outputId}.json`;
const textPath = `dist/motivation-letter-text-${outputId}.txt`;

const titleHtml = data.titleLines.map((line) => `<span class="motivation-letter__title-line">${escapeHtml(line)}</span>`).join('');
const paragraphsHtml = [
  `<p class="motivation-letter__salutation">${escapeHtml(data.salutation)}</p>`,
  ...data.paragraphs.map((paragraph, index) => `<p data-paragraph-index="${index}">${renderRuns(paragraph.runs, `paragraphs[${index}]`)}</p>`),
].join('\n');
const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(data.titleLines.join(' '))}</title>
<link rel="stylesheet" href="../src/styles/motivation-letter.css">
</head>
<body>
<main class="motivation-letter" id="motivation-letter" data-renderer="playwright" data-layout-contract="motivation-letter-v1">
  <div class="motivation-letter__blue-frame" id="blue-frame"></div>
  <div class="motivation-letter__paper" id="paper"></div>
  <div class="motivation-letter__side-label" id="side-label">MOTIVATIONSSCHREIBEN</div>
  <section class="motivation-letter__content" id="content">
    <h1 class="motivation-letter__title" id="letter-title">${titleHtml}</h1>
    <div class="motivation-letter__body" id="letter-body">${paragraphsHtml}</div>
    <div class="motivation-letter__signature" id="signature">
      <p>Freundliche Grüsse</p>
      <p>${escapeHtml(data.signature.firstName)} <a href="${escapeHtml(data.signature.url)}"><span class="motivation-letter__signature-last-name">${escapeHtml(data.signature.lastName)}</span><span class="motivation-letter__signature-domain">${escapeHtml(data.signature.domainSuffix)}</span></a></p>
    </div>
  </section>
</main>
</body>
</html>`;
writeFileSync(previewPath, html);

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(previewPath)).href, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('700 16px "Roboto Slab"', 'Bewerbung'),
      document.fonts.load('400 16px Arial', 'Motivationsschreiben'),
      document.fonts.load('700 16px Arial', 'Marketing Automation'),
    ]);
    await document.fonts.ready;
  });

  const metrics = await page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left,
        scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
        fontFamily: style.fontFamily, fontSizePx: Number.parseFloat(style.fontSize), lineHeightPx: Number.parseFloat(style.lineHeight),
        textAlign: style.textAlign, backgroundImage: style.backgroundImage, backgroundSize: style.backgroundSize,
        backgroundPosition: style.backgroundPosition, transform: style.transform,
      };
    };
    const lastParagraph = document.querySelector('#letter-body p:last-child').getBoundingClientRect();
    const signature = document.querySelector('#signature').getBoundingClientRect();
    return {
      page: box('#motivation-letter'), blueFrame: box('#blue-frame'), paper: box('#paper'), content: box('#content'),
      title: box('#letter-title'), body: box('#letter-body'), signature: box('#signature'), sideLabel: box('#side-label'),
      titleLineCount: document.querySelectorAll('.motivation-letter__title-line').length,
      lastParagraphBottom: lastParagraph.bottom,
      bodySignatureGapPx: signature.top - lastParagraph.bottom,
      loadedImages: [...document.images].map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
      fontChecks: {
        aptos: document.fonts.check('12pt Aptos', 'Adam Dolinsky'),
        arial: document.fonts.check('12pt Arial', 'Adam Dolinsky'),
        robotoSlab: document.fonts.check('700 15.96pt "Roboto Slab"', 'Bewerbung'),
      },
    };
  });

  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.screenshot({ path: pngPath, fullPage: true });

  const pdfInfo = spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  const pageCount = Number((pdfInfo.stdout.match(/^Pages:\s+(\d+)/m) || [])[1] || 0);
  const textResult = spawnSync('pdftotext', ['-layout', pdfPath, textPath], { encoding: 'utf8' });
  const extractedText = textResult.status === 0 ? readFileSync(textPath, 'utf8') : '';
  const normalize = (value) => String(value || '').toLocaleLowerCase('de-CH').replace(/\s+/g, ' ').trim();
  const requiredTerms = [...new Set([...(data.requiredTerms || []), data.salutation, data.signature.lastName, ...data.titleLines])];
  const missingTerms = requiredTerms.filter((term) => !normalize(extractedText).includes(normalize(term)));
  const mm = (value) => value * 96 / 25.4;
  const close = (actual, expected, tolerance = 1.2) => Math.abs(actual - expected) <= tolerance;
  const warnings = [];
  if (!close(metrics.blueFrame.left, mm(10)) || !close(metrics.blueFrame.top, mm(14.5)) || !close(metrics.blueFrame.right, mm(200))) warnings.push('blue-frame-geometry');
  if (!close(metrics.paper.left, mm(20)) || !close(metrics.paper.top, mm(24.5)) || !close(metrics.paper.right, mm(190))) warnings.push('paper-geometry');
  if (!close(metrics.content.left, mm(28)) || !close(metrics.content.right, mm(182)) || !close(metrics.content.top, mm(28.9))) warnings.push('content-geometry');
  if (!close(metrics.title.fontSizePx, 15.96 * 96 / 72, 0.5) || metrics.title.textAlign !== 'right') warnings.push('title-typography');
  if (!close(metrics.body.fontSizePx, 12 * 96 / 72, 0.35) || !close(metrics.body.lineHeightPx, 12 * 1.41 * 96 / 72, 0.7)) warnings.push('body-typography');
  if (metrics.titleLineCount !== data.titleLines.length) warnings.push('title-line-contract');
  if (!/cover/i.test(metrics.page.backgroundSize) || !/bg_img\.jpeg/i.test(metrics.page.backgroundImage)) warnings.push('background-contract');
  if (!metrics.sideLabel.transform || metrics.sideLabel.transform === 'none') warnings.push('side-label-rotation');
  const overflows = [];
  if (metrics.body.scrollHeight > metrics.body.clientHeight + 1) overflows.push({ element: 'letter-body', scrollHeight: metrics.body.scrollHeight, clientHeight: metrics.body.clientHeight });
  if (metrics.lastParagraphBottom > metrics.signature.top - 7) overflows.push({ element: 'body-signature-gap', lastParagraphBottom: metrics.lastParagraphBottom, signatureTop: metrics.signature.top, gapPx: metrics.bodySignatureGapPx });
  const collisions = [];
  if (metrics.title.bottom > metrics.body.top) collisions.push({ elements: ['letter-title', 'letter-body'] });
  if (metrics.bodySignatureGapPx < 7) collisions.push({ elements: ['letter-body', 'signature'], gapPx: metrics.bodySignatureGapPx });
  const report = {
    success: pageCount === 1 && overflows.length === 0 && collisions.length === 0 && warnings.length === 0 && missingTerms.length === 0,
    renderer: 'playwright', layoutContract: 'motivation-letter-v1', input: inputPath, outputId,
    pageCount, wordCount, maxWords, titleLines: data.titleLines,
    overflows, collisions, warnings,
    ats: { textExtractable: extractedText.length > 0, requiredTerms, missingTerms },
    geometry: metrics,
    typography: { titlePt: 15.96, bodyPt: 12, bodyLineHeight: 1.41, titleAlignment: 'right', autoShrinkAllowed: false },
    background: { asset: 'assets/bg_img.jpeg', size: 'cover', position: 'left top' },
    artifacts: { pdfPath, pngPath, previewPath, reportPath, textPath },
    pdfInfo: pdfInfo.stdout,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.success) process.exitCode = 1;
} finally {
  await browser.close();
}
