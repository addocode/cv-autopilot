import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('motivation-letter CSS is bound to the approved golden geometry', () => {
  const css = readFileSync('modules/motivation-letter/styles/motivation-letter.css', 'utf8');
  const renderer = readFileSync('modules/motivation-letter/src/renderer.mjs', 'utf8');
  const template = readFileSync('modules/motivation-letter/src/template.mjs', 'utf8');
  assert.match(css, /font-family:'Arimo';font-style:normal;font-weight:400/);
  assert.match(css, /font-family:'Arimo';font-style:normal;font-weight:700/);
  assert.match(css, /__ROBOTO_SLAB_700_DATA_URL__/);
  assert.match(css, /__ARIMO_400_DATA_URL__/);
  assert.match(css, /__ARIMO_700_DATA_URL__/);
  assert.match(renderer, /@fontsource\/arimo\/files\/arimo-latin-400-normal\.woff2/);
  assert.match(renderer, /@fontsource\/arimo\/files\/arimo-latin-700-normal\.woff2/);
  assert.match(template, /replaceAll\('__ARIMO_400_DATA_URL__', assets\.fonts\.arimo400\)/);
  assert.match(template, /replaceAll\('__ARIMO_700_DATA_URL__', assets\.fonts\.arimo700\)/);
  assert.match(css, /left:10mm;right:10mm;top:15\.525mm;bottom:0/);
  assert.match(css, /left:19\.8mm;right:19\.8mm;top:23\.5mm;bottom:0/);
  assert.match(css, /font:700 18pt\/19pt 'Roboto Slab'/);
  assert.match(css, /font:400 11pt\/14pt Arial/);
  assert.match(css, /font:400 11pt\/14pt Arial,'Arimo','Liberation Sans'/);
  assert.match(css, /left:10\.182mm;top:18\.955mm;width:25\.12mm;height:19\.85mm/);
  assert.match(css, /background:transparent;border:0;outline:0;box-shadow:none;padding:0/);
  assert.doesNotMatch(css, /scaleX|font-stretch|letter-spacing:\s*-/);
});

for (const outputId of ['admin-sachbearbeiter-fk', 'transgourmet-digital-marketing']) {
  const reportPath = `dist/motivation-letter-report-${outputId}.json`;
  test(`rendered golden report passes for ${outputId}`, { skip: !existsSync(reportPath) }, () => {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.success, true);
    assert.equal(report.renderer, 'playwright');
    assert.equal(report.motivationLetterStandard, 'approved-golden-v1');
    assert.equal(report.pageCount, 1);
    assert.equal(report.bodyStartWithinGuides, true);
    assert.equal(report.dateAlignedWithSalutation, true);
    assert.deepEqual(report.overflows, []);
    assert.deepEqual(report.collisions, []);
    assert.deepEqual(report.warnings, []);
    assert.ok(report.emphasis.groupCount >= 2 && report.emphasis.groupCount <= 4);
  });
}
