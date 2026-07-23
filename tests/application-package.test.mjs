import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { buildCvSummaryGreeting, buildSalutation, composePersonalizedSummary, normalizeJobTitle, resolveAddressMode } from '../modules/application-core/src/utils.mjs';
import { buildJobAdArchiveMarkdown } from '../modules/application-core/src/job-ad-archive.mjs';
import { buildApplicationStrategy } from '../modules/application-core/src/strategy.mjs';
import { composeMotivationLetter, validateLetterContent } from '../modules/motivation-letter/src/compose.mjs';
import { generateApplicationEmail } from '../modules/application-email/src/generate.mjs';

function context(overrides = {}) {
  return {
    applicationId: '2026-07-21_transgourmet-schweiz-ag_junior-digital-marketing-manager',
    applicationDate: '2026-07-21',
    generationDate: '2026-07-21',
    employer: 'Transgourmet Schweiz AG',
    jobTitle: '(Junior) Digital Marketing Managerin / Manager 80–100%',
    selectedVariant: 'general',
    addressMode: 'informal',
    applicationContact: {
      fullName: 'Lisa Röthlisberger',
      firstName: 'Lisa',
      lastName: 'Röthlisberger',
      explicitSalutation: 'Frau',
      addressMode: 'informal',
      email: 'lisa.roethlisberger@transgourmet.ch',
    },
    source: { url: 'https://jobs.transgourmet.ch/example' },
    jobAd: {
      sourceId: 'job-ad:transgourmet',
      rawText: 'Digital Marketing, Marketing Automation, Newsletter, Analytics und BSI.',
      workload: { kind: 'range', minPercent: 80, maxPercent: 100, sourceText: '80–100%' },
      reference: { visible: false, value: '' },
    },
    requirements: { must: [], nice: [], tasks: [], systems: [] },
    atsTerms: ['Digital Marketing', 'Marketing Automation'],
    ...overrides,
  };
}

test('normalizes advertised titles without changing neutral roles', () => {
  assert.equal(normalizeJobTitle('(Junior) Digital Marketing Managerin / Manager 80–100%').rendered, 'Junior Digital Marketing Manager');
  assert.equal(normalizeJobTitle('Sachbearbeiter/in Administration (80 %)').rendered, 'Sachbearbeiter Administration');
  assert.equal(normalizeJobTitle('Content Manager:in').rendered, 'Content Manager');
  assert.equal(normalizeJobTitle('Fachperson Kommunikation (m/w/d)').rendered, 'Fachperson Kommunikation');
  assert.equal(normalizeJobTitle('Fachspezialistin / Fachspezialist Marketingkommunikation (a)').rendered, 'Fachspezialist Marketingkommunikation');
});

test('CV summary greeting uses the same safe application contact and distinguishes Sie from du', () => {
  const christoph = {
    fullName: 'Christoph Lüthi',
    firstName: 'Christoph',
    lastName: 'Lüthi',
    explicitSalutation: 'Herr',
    addressMode: 'formal',
    confidence: 1,
    isApplicationContact: true,
    sourceText: 'Fragen zur Bewerbung: Christoph Lüthi',
  };
  const formal = buildCvSummaryGreeting(christoph, 'Wir freuen uns auf Ihre Bewerbung.');
  assert.equal(formal.rendered, true);
  assert.equal(formal.text, 'Guten Tag Herr Lüthi,');
  assert.equal(formal.contactName, 'Christoph Lüthi');
  assert.equal(composePersonalizedSummary(formal.text, 'Mediamatiker EFZ mit Berufsmaturität und Erfahrung in GEVER.').text, 'Guten Tag Herr Lüthi, ich bin Mediamatiker EFZ mit Berufsmaturität und Erfahrung in GEVER.');

  const informal = buildCvSummaryGreeting({ ...christoph, explicitSalutation: '', addressMode: 'unknown' }, 'Wir freuen uns auf dich und deine Bewerbung.');
  assert.equal(informal.rendered, true);
  assert.equal(informal.text, 'Hallo Christoph,');
  assert.equal(informal.addressModeSource, 'job-ad-informal-signal');

  assert.deepEqual(resolveAddressMode({ addressMode: 'unknown' }, 'Ihre Aufgaben und Ihr Profil'), { addressMode: 'formal', source: 'job-ad-formal-signal' });
  assert.equal(buildSalutation({ fullName: 'HR Team' }, 'informal'), 'Guten Tag');
});

test('CV summary greeting is omitted only when no safe personal application contact exists', () => {
  const generic = buildCvSummaryGreeting({
    fullName: 'HR Team',
    firstName: '',
    lastName: '',
    addressMode: 'unknown',
    confidence: 0.5,
    isApplicationContact: true,
  }, 'Wir freuen uns auf Ihre Bewerbung.');
  assert.equal(generic.rendered, false);
  assert.equal(generic.omissionReason, 'no-safe-personal-application-contact');
});

test('one strategy drives motivation letter and draft email', () => {
  const ctx = context();
  const strategy = buildApplicationStrategy(ctx, {
    employerMotivation: 'Transgourmet verbindet den Grosshandel mit einer zunehmend digitalen Kundenansprache.',
  });
  const letter = validateLetterContent(composeMotivationLetter(ctx, strategy));
  const email = generateApplicationEmail(ctx, strategy);
  assert.equal(strategy.applicationId, ctx.applicationId);
  assert.equal(strategy.jobTitleRendered, 'Junior Digital Marketing Manager');
  assert.equal(letter.jobTitleRendered, strategy.jobTitleRendered);
  assert.equal(letter.salutation, 'Hallo Lisa');
  assert.ok(letter.selectedEvidenceIds.includes('education-mediamatiker-efz-berufsmaturitaet'));
  assert.ok(letter.emphasisGroups.length >= 2 && letter.emphasisGroups.length <= 4);
  assert.match(email.subject, /^Bewerbung als Junior Digital Marketing Manager/);
  assert.equal(email.status, 'draft');
  assert.equal(email.automaticSend, false);
  assert.equal(email.to.status, 'explicit-or-official');
});

test('public job-ad archive merges duplicate contact purposes without duplicating the person', () => {
  const nicole = {
    fullName: 'Nicole Schneider',
    role: 'Leitung Marketing-Kommunikation',
    email: 'nicole.schneider@bekb.ch',
    phone: '031 666 16 47',
  };
  const markdown = buildJobAdArchiveMarkdown(context({
    applicationId: '2026-07-23_bekb_marketingkommunikation',
    applicationDate: '2026-07-23',
    employer: 'Berner Kantonalbank AG',
    jobTitleOriginal: 'Fachspezialistin / Fachspezialist Marketingkommunikation (a)',
    jobContact: nicole,
    applicationContact: nicole,
    source: {
      url: 'https://jobs.bekb.ch/offene-stellen/example',
      sha256: 'abc123',
    },
  }), 'Vollständiger Inseratstext');
  assert.match(markdown, /\| Fachkontakt \/ Bewerbungskontakt \| Nicole Schneider \|/);
  assert.equal(markdown.match(/Nicole Schneider/g)?.length, 1);
  assert.match(markdown, /Vollständiger Inseratstext/);
  assert.doesNotMatch(markdown, /Belegmatrix|Gap-Analyse/);
});

test('layout lock protects all canonical design files', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-layout-lock.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.success, true);
  assert.ok(report.lockedFiles >= 18);
  const lock = JSON.parse(readFileSync('layout-lock.json', 'utf8'));
  for (const path of ['src/styles/cv.css', 'src/templates/cv.ts', 'modules/motivation-letter/styles/motivation-letter.css', 'modules/rav-recap/mobile-template.html']) assert.match(lock.files[path], /^[a-f0-9]{64}$/);
});

test('root instructions point only to the consolidated production workflow', () => {
  const agents = readFileSync('AGENTS.md', 'utf8');
  const task = readFileSync('CODEX_TASK.md', 'utf8');
  assert.match(agents, /main.*einzige Produktionsquelle/);
  assert.match(task, /integration\/application-package-v1/);
  assert.doesNotMatch(task, /PR #6|verifiziere-icon-hashes|Review Runde 43/);
});
