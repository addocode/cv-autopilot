import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const appId = '2026-07-20_beispiel-amt-fur-digitale-dienste_sachbearbeitung-gever';
const appDir = `applications/${appId}`;
const jobAdArchiveRoot = mkdtempSync(`${tmpdir()}/cv-job-ad-archive-`);
const jobAdArchiveFile = `${jobAdArchiveRoot}/${appId}/00_stelleninserat.md`;

function runCreate() {
  rmSync(appDir, { recursive: true, force: true });
  return spawnSync(process.execPath, ['scripts/create-application.mjs', '--job-ad', 'tests/fixtures/fictive-job-ad.txt', '--application-date', '2026-07-20', '--timestamp', '2026-07-20T20:00:00+03:00', '--job-ad-archive-root', jobAdArchiveRoot, '--skip-render-for-tests'], { encoding: 'utf8' });
}
function frontmatter(md) {
  const raw = md.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
  return Object.fromEntries(raw.split('\n').filter(Boolean).map((line) => {
    const [key, ...rest] = line.split(':');
    return [key.trim(), rest.join(':').trim().replace(/^"|"$/g, '')];
  }));
}
function sha(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

test('creates deterministic complete application archive with consistent markdown, json, cv files, and manifest', () => {
  const beforeNeutral = existsSync('dist/Lebenslauf_Adam-Dolinsky_general.pdf') ? sha('dist/Lebenslauf_Adam-Dolinsky_general.pdf') : null;
  const result = runCreate();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, new RegExp(appId));
  for (const file of ['00_stelleninserat.md', '01_application-context.json', '02_cv_administration-gever.pdf', '03_cv_administration-gever-preview.html', '04_manifest.json', '05_render-report.json', '06_application-strategy.json', '07_motivationsschreiben.pdf', '08_motivationsschreiben-preview.html', '09_motivationsschreiben-report.json', '10_mailanschreiben.md', '11_application-package-report.json', '12_rav-recap.html', '13_rav-recap.json', '14_rav-recap.txt', '15_rav-recap-report.json', 'fictive-job-ad.txt']) assert.equal(existsSync(`${appDir}/${file}`), true, file);
  const md = readFileSync(`${appDir}/00_stelleninserat.md`, 'utf8');
  const requiredSections = ['Bewerbungsübersicht','Eckdaten','Kontakte und Ansprache','Aufgaben und Verantwortlichkeiten','Muss-Anforderungen','Wunsch-Anforderungen','Systeme, Methoden und Fachbegriffe','Arbeitgeber, Umfeld und Benefits','Bewerbungsprozess und Fristen','CV-Personalisierung','Belegmatrix: Inserat ↔ Profil','Offene Punkte und Unsicherheiten','Vollständiger Originaltext'];
  for (const section of requiredSections) assert.match(md, new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  const fm = frontmatter(md);
  assert.equal(fm.application_id, appId);
  assert.equal(fm.employer, 'Beispiel Amt für Digitale Dienste');
  assert.equal(fm.selected_cv_variant, 'administration-gever');
  assert.equal(fm.source_content_sha256, sha('tests/fixtures/fictive-job-ad.txt'));
  assert.match(md, /<details>\n<summary>Vollständigen Originaltext anzeigen<\/summary>/);
  assert.match(md, /Digitale Dossiers im GEVER-System bewirtschaften/);
  assert.match(md, /unsupported_rejected/);
  assert.match(md, /Greeting-Kandidat: nur Bewerbungskontakt/);
  assert.match(md, /Ausgewählte CV-Variante: administration-gever/);
  const ctx = JSON.parse(readFileSync(`${appDir}/01_application-context.json`, 'utf8'));
  assert.equal(ctx.applicationId, fm.application_id);
  assert.equal(ctx.employer, fm.employer);
  assert.equal(ctx.jobTitle, fm.job_title);
  assert.equal(ctx.workload, fm.workload);
  assert.equal(ctx.start, fm.start_date);
  assert.equal(ctx.contact.fullName, '');
  assert.equal(ctx.schemaVersion, 3);
  assert.equal(ctx.jobTitleRendered, 'Sachbearbeitung GEVER');
  assert.equal(ctx.applicationDate, '2026-07-20');
  assert.equal(ctx.jobAd.rawText.includes('Arbeitgeber: Beispiel Amt'), true);
  assert.equal(ctx.jobAd.workload.kind, 'range');
  assert.equal(ctx.selectedVariant, fm.selected_cv_variant);
  assert.ok(ctx.requirements.must.length > 0);
  const manifest = JSON.parse(readFileSync(`${appDir}/04_manifest.json`, 'utf8'));
  assert.equal(manifest.validation.markdownJsonConsistent, true);
  assert.equal(manifest.validation.allFilesPresent, true);
  assert.ok(Array.isArray(manifest.validation.unsupportedFacts));
  assert.equal(manifest.archive, undefined);
  assert.equal(manifest.validation.applicationContextContractValid, true);
  assert.equal(manifest.validation.rendererSuccess, true);
  assert.equal(manifest.validation.packageGuardSuccess, true);
  assert.equal(manifest.validation.ravRecapSuccess, true);
  assert.equal(manifest.schemaVersion, 3);
  const out = JSON.parse(result.stdout);
  assert.equal(out.jobAdArchive, jobAdArchiveFile);
  assert.equal(existsSync(jobAdArchiveFile), true);
  const publicArchive = readFileSync(jobAdArchiveFile, 'utf8');
  assert.match(publicArchive, /archive_scope: "public-job-ad-only"/);
  assert.match(publicArchive, /Digitale Dossiers im GEVER-System bewirtschaften/);
  assert.match(publicArchive, new RegExp(sha('tests/fixtures/fictive-job-ad.txt')));
  assert.doesNotMatch(publicArchive, /Belegmatrix|Profilbeleg|Gap-Analyse/);
  assert.equal(existsSync(out.archive), true);
  assert.equal(existsSync(out.sidecar), true);
  assert.equal(readFileSync(out.sidecar, 'utf8').split(/\s+/)[0], sha(out.archive));
  const extractDir = mkdtempSync(`${tmpdir()}/cv-app-`);
  assert.equal(spawnSync('tar', ['-xzf', out.archive, '-C', extractDir], { encoding: 'utf8' }).status, 0);
  assert.equal(readFileSync(`${extractDir}/${appId}/04_manifest.json`, 'utf8'), readFileSync(`${appDir}/04_manifest.json`, 'utf8'));
  for (const file of manifest.files) assert.equal(file.sha256, sha(`${appDir}/${file.path}`), file.path);
  const firstPublicArchive = readFileSync(jobAdArchiveFile, 'utf8');
  const second = spawnSync(process.execPath, ['scripts/create-application.mjs', '--job-ad', 'tests/fixtures/fictive-job-ad.txt', '--application-date', '2026-07-20', '--timestamp', '2026-07-20T20:00:00+03:00', '--job-ad-archive-root', jobAdArchiveRoot, '--skip-render-for-tests'], { encoding: 'utf8' });
  assert.equal(second.status, 0, second.stderr || second.stdout);
  const secondOut = JSON.parse(second.stdout);
  assert.equal(secondOut.applicationId, appId);
  assert.equal(secondOut.archiveSha256, JSON.parse(result.stdout).archiveSha256);
  assert.equal(readFileSync(jobAdArchiveFile, 'utf8'), firstPublicArchive);
  if (beforeNeutral) assert.equal(sha('dist/Lebenslauf_Adam-Dolinsky_general.pdf'), beforeNeutral);
});


test('accepts validated structured extracted context and preserves evidence statuses', () => {
  rmSync(appDir, { recursive: true, force: true });
  const result = spawnSync(process.execPath, ['scripts/create-application.mjs', '--job-ad', 'tests/fixtures/fictive-job-ad.txt', '--extracted-context', 'tests/fixtures/extracted-context-fictive.json', '--application-date', '2026-07-20', '--timestamp', '2026-07-20T20:00:00+03:00', '--job-ad-archive-root', jobAdArchiveRoot, '--skip-render-for-tests'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const ctx = JSON.parse(readFileSync(`${appDir}/01_application-context.json`, 'utf8'));
  assert.equal(ctx.schemaVersion, 3);
  assert.equal(ctx.jobAd.workload.kind, 'single');
  assert.equal(ctx.jobAd.start.isoDate, '2026-09-01');
  assert.equal(ctx.jobAd.contact.lastName, 'Meier');
  assert.equal(ctx.jobAd.rawText, readFileSync('tests/fixtures/fictive-job-ad.txt', 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim());
  const md = readFileSync(`${appDir}/00_stelleninserat.md`, 'utf8');
  assert.match(md, /ACTA NOVA und digitale Geschäftsvorgangsbearbeitung/);
  assert.match(md, /\| Erfahrung mit GEVER \| .* \| cv-2d-p2 \| verified \| Kurzprofil und Skillset Technik & Systeme \|/);
});
