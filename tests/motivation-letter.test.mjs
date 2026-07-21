import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const outputId = 'transgourmet-digital-marketing';
const reportPath = `dist/motivation-letter-report-${outputId}.json`;
const pdfPath = `dist/Motivationsschreiben_Adam-Dolinsky_${outputId}.pdf`;
const pngPath = `dist/motivation-letter-${outputId}.png`;
const previewPath = `dist/motivation-letter-${outputId}-preview.html`;

test('canonical motivation letter render passes the reference-layout contract', () => {
  for (const path of [reportPath, pdfPath, pngPath, previewPath]) assert.equal(existsSync(path), true, path);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert.equal(report.success, true);
  assert.equal(report.renderer, 'playwright');
  assert.equal(report.layoutContract, 'motivation-letter-v1');
  assert.equal(report.pageCount, 1);
  assert.equal(report.overflows.length, 0);
  assert.equal(report.collisions.length, 0);
  assert.equal(report.warnings.length, 0);
  assert.equal(report.ats.missingTerms.length, 0);
  assert.equal(report.typography.titlePt, 15.96);
  assert.equal(report.typography.bodyPt, 12);
  assert.equal(report.typography.bodyLineHeight, 1.41);
  assert.equal(report.typography.titleAlignment, 'right');
  assert.equal(report.typography.autoShrinkAllowed, false);
  assert.equal(report.background.asset, 'assets/bg_img.jpeg');
  assert.equal(report.background.size, 'cover');
  assert.equal(report.background.position, 'left top');
  assert.ok(report.geometry.bodySignatureGapPx >= 7);
  assert.equal(report.geometry.titleLineCount, 2);
});

test('layout CSS keeps the reference dimensions and forbids the failed ad-hoc layout', () => {
  const css = readFileSync('src/styles/motivation-letter.css', 'utf8');
  assert.match(css, /left:10mm;right:10mm;top:14\.5mm;bottom:0/);
  assert.match(css, /left:20mm;right:20mm;top:24\.5mm;bottom:0/);
  assert.match(css, /left:28mm;right:28mm;top:28\.9mm;bottom:14\.8mm/);
  assert.match(css, /font-size:15\.96pt/);
  assert.match(css, /text-align:right/);
  assert.match(css, /font-size:12pt;line-height:1\.41/);
  assert.match(css, /background-size:cover/);
  assert.match(css, /background-position:left top/);
  assert.doesNotMatch(css, /motivation-letter__title[^}]*text-align:center/s);
});

test('renderer rejects shrinking typography and requires explicit title line breaks', () => {
  const source = readFileSync('scripts/render-motivation-letter.mjs', 'utf8');
  assert.match(source, /Shorten the content instead of reducing the 12 pt reference typography/);
  assert.match(source, /titleLines must contain one or two explicitly reviewed lines/);
  assert.match(source, /autoShrinkAllowed: false/);
  assert.doesNotMatch(source, /ReportLab|reportlab|canvas\.Canvas/);
});
