import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRavRecapData, renderRavRecap } from '../modules/rav-recap/src/render.mjs';

for (const fixtureName of ['transgourmet-junior-digital-marketing-manager', 'admin-sachbearbeiter-fk']) {
  test(`renders ${fixtureName} through the canonical mobile template`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'rav-recap-'));
    try {
      const fixture = JSON.parse(readFileSync(`modules/rav-recap/tests/fixtures/${fixtureName}.json`, 'utf8'));
      const result = renderRavRecap(fixture, { outputDir: dir });
      assert.equal(result.report.success, true);
      assert.equal(result.report.requiredFieldsComplete, true);
      assert.equal(result.report.htmlJsonTxtConsistent, true);
      assert.equal(result.report.copyButtonsPresent, true);
      assert.equal(result.report.copyAllPresent, true);
      assert.equal(result.report.offlineCapable, true);
      const html = readFileSync(result.paths.html, 'utf8');
      assert.match(html, /<html lang="de-CH">/);
      assert.match(html, /max-width|width:min\(760px/);
      assert.doesNotMatch(html, /<script[^>]+src=/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('safe fallback keeps every Job-Room field populated and exposes assumptions', () => {
  const data = buildRavRecapData({
    applicationId: '2026-07-20_beispiel_sachbearbeitung',
    applicationDate: '2026-07-20',
    employer: 'Beispiel AG',
    location: 'Bern',
    jobTitle: 'Sachbearbeiter/in 80%',
    contact: { fullName: '', addressMode: 'formal' },
    source: { url: '' },
    jobAd: { workload: { kind: 'single', minPercent: 80, maxPercent: 80, sourceText: '80%' } },
  });
  assert.equal(data.workloadCategory, 'Teilzeit');
  assert.equal(data.company.contactPerson, 'Personalabteilung');
  assert.equal(data.company.poBox, 'Kein Postfach');
  assert.match(data.company.email, /@/);
  assert.ok(data.sources.some((item) => item.status === 'fallback_required_field'));
});
