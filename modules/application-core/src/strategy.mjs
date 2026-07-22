import { readFileSync } from 'node:fs';
import { detectRoleFamily, normalizeJobTitle } from './utils.mjs';

const DEFAULT_EVIDENCE_BY_ROLE = {
  'administration-gever': [
    'bullet-rs-acta-nova',
    'bullet-rs-quality',
    'bullet-rs-doc-management',
    'bullet-rs-coordination',
    'bullet-kunz-process-handover',
  ],
  'digital-marketing-automation': [
    'bullet-kunz-campaigns',
    'bullet-kunz-websites-landing',
    'bullet-kunz-online-campaigns-monitoring',
    'bullet-kunz-external-partners',
    'skill-google-analytics',
    'tool-html-css',
  ],
  'communication-content': [
    'bullet-kunz-guegg',
    'bullet-kunz-campaigns',
    'bullet-kunz-photo-video-social-ci',
    'bullet-freelance-content-print-web',
  ],
  'cms-web-process': [
    'bullet-kunz-websites-landing',
    'bullet-kunz-online-campaigns-monitoring',
    'bullet-kunz-process-handover',
    'bullet-kunz-external-partners',
    'tool-html-css',
  ],
  'adjacent-digital': [
    'bullet-kunz-process-handover',
    'bullet-kunz-external-partners',
    'bullet-rs-quality',
    'bullet-freelance-self-organization',
  ],
  initiative: [
    'bullet-kunz-websites-landing',
    'bullet-kunz-campaigns',
    'bullet-kunz-process-handover',
  ],
};

function evidenceCatalogue(master) {
  const records = [];
  for (const experience of master.experiences || []) {
    for (const item of [...(experience.bullets || []), ...(experience.optionalBullets || [])]) {
      records.push({
        id: item.id,
        text: item.text,
        status: item.status || item.evidenceStatus || 'verified',
        sourceIds: item.sources || item.sourceIds || experience.sources || [],
        kind: 'experience',
        parentId: experience.id,
      });
    }
  }
  for (const section of master.skillSections || []) {
    for (const item of section.items || []) {
      records.push({
        id: item.id,
        text: item.text,
        status: item.status || 'verified',
        sourceIds: item.sources || [],
        kind: 'skill',
        parentId: section.id,
      });
    }
  }
  for (const item of master.tools || []) {
    records.push({
      id: item.id,
      text: item.name,
      status: item.status || 'verified',
      sourceIds: item.sources || [],
      kind: 'tool',
      parentId: item.category || 'tools',
    });
  }
  records.push({
    id: 'education-mediamatiker-efz-berufsmaturitaet',
    text: master.positioning?.credential || 'Mediamatiker EFZ mit Berufsmaturität',
    status: 'verified',
    sourceIds: ['cv-2d-p1', 'cv-2d-p2'],
    kind: 'credential',
    parentId: 'education',
  });
  return new Map(records.map((record) => [record.id, record]));
}

function roleDefaults(roleFamily) {
  if (roleFamily === 'administration-gever') return {
    positioning: 'Digitale Administration mit Mediamatik-, GEVER- und Prozesserfahrung',
    motivationAngle: 'Bewusste Hin-zu-Entwicklung in strukturierte, verlässliche und gesellschaftlich sinnvolle Verwaltungsarbeit',
    valueProposition: 'Digitale Geschäftsvorgänge sorgfältig bearbeiten, Informationen nachvollziehbar dokumentieren und Prozesse mit hoher Systemaffinität unterstützen',
    longTermSignal: { use: true, reason: 'Die Rolle passt zur bewussten langfristigen Entwicklung in strukturierte digitale Administration.' },
  };
  if (roleFamily === 'digital-marketing-automation') return {
    positioning: 'Mediamatiker mit Praxis in Digital Marketing, Web, Newsletter, Kampagnen und Analyse',
    motivationAngle: 'Messbare digitale Kundenansprache mit technischer Umsetzung und systematischer Kampagnenentwicklung verbinden',
    valueProposition: 'Operative Kampagnenpraxis, Webverständnis, Datenbezug und Stakeholder-Koordination direkt in die digitale Kundenkommunikation einbringen',
    longTermSignal: { use: true, reason: 'Die Rolle ist ein plausibler langfristiger Entwicklungsschritt innerhalb der digitalen Kommunikation.' },
  };
  if (roleFamily === 'communication-content') return {
    positioning: 'Mediamatiker mit Content-, Medienproduktions- und Kampagnenpraxis',
    motivationAngle: 'Inhalte gestalterisch stark, kanalübergreifend und für konkrete Zielgruppen wirksam umsetzen',
    valueProposition: 'Konzeption, Gestaltung, Produktion und zuverlässige Kanalpflege aus einer Hand verbinden',
    longTermSignal: { use: true, reason: 'Die Rolle entspricht der bestehenden fachlichen Laufbahn und bietet Entwicklungstiefe.' },
  };
  if (roleFamily === 'cms-web-process') return {
    positioning: 'Mediamatiker an der Schnittstelle von CMS, Webpflege, Daten und Prozessen',
    motivationAngle: 'Digitale Inhalte und Systeme nicht nur pflegen, sondern ihre Abläufe nachvollziehbar und zuverlässig weiterentwickeln',
    valueProposition: 'Content-Administration, technisches Webverständnis und Prozessdokumentation für stabile digitale Kanäle verbinden',
    longTermSignal: { use: true, reason: 'Die Rolle verbindet vorhandene Erfahrung mit einem langfristig tragfähigen digitalen Schwerpunkt.' },
  };
  return {
    positioning: 'Mediamatiker mit breiter digitaler, organisatorischer und technischer Praxis',
    motivationAngle: 'Gestaltung, Technik und strukturierte Umsetzung in einer klar umrissenen Funktion verbinden',
    valueProposition: 'Digitale Aufgaben zuverlässig umsetzen, Stakeholder koordinieren und Wissen nachvollziehbar sichern',
    longTermSignal: { use: false, reason: 'Nur verwenden, wenn die konkrete Rolle eine glaubwürdige langfristige Perspektive bietet.' },
  };
}

export function buildApplicationStrategy(context, overrides = {}, masterPath = 'data/private/cv.master.json') {
  const master = JSON.parse(readFileSync(masterPath, 'utf8'));
  const catalogue = evidenceCatalogue(master);
  const title = normalizeJobTitle(context.jobTitleOriginal || context.jobTitle);
  const roleFamily = overrides.roleFamily || detectRoleFamily(context);
  const defaults = roleDefaults(roleFamily);
  const requestedIds = [
    'education-mediamatiker-efz-berufsmaturitaet',
    ...(overrides.selectedEvidenceIds || []),
    ...(DEFAULT_EVIDENCE_BY_ROLE[roleFamily] || DEFAULT_EVIDENCE_BY_ROLE['adjacent-digital']),
  ];
  const selectedEvidence = [];
  for (const id of requestedIds) {
    const record = catalogue.get(id);
    if (!record || selectedEvidence.some((item) => item.id === id)) continue;
    if (!['verified', 'defensible_inference', 'training_verified'].includes(record.status)) continue;
    selectedEvidence.push(record);
    if (selectedEvidence.length >= 6) break;
  }

  const gaps = overrides.gapHandling || (context.requirements?.must || [])
    .filter((item) => typeof item === 'object' && item.evidenceStatus === 'unsupported_rejected')
    .slice(0, 3)
    .map((item) => ({
      requirement: item.text,
      handling: 'Nicht behaupten; die vorhandene übertragbare Erfahrung konkret benennen und die Einarbeitung transparent darstellen.',
    }));

  return {
    schemaVersion: 1,
    applicationId: context.applicationId,
    roleFamily,
    jobTitleOriginal: title.original,
    jobTitleRendered: title.rendered,
    titleTransformations: title.transformations,
    positioning: overrides.positioning || defaults.positioning,
    motivationAngle: overrides.motivationAngle || defaults.motivationAngle,
    employerMotivation: overrides.employerMotivation || context.employerDescription || `Die ausgeschriebene Aufgabe bei ${context.employer} verbindet die zentralen Anforderungen der Rolle mit einem Umfeld, in dem verlässliche Umsetzung zählt.`,
    valueProposition: overrides.valueProposition || defaults.valueProposition,
    selectedEvidenceIds: selectedEvidence.map((item) => item.id),
    selectedEvidence,
    gapHandling: gaps,
    longTermSignal: overrides.longTermSignal || defaults.longTermSignal,
    portfolioUse: overrides.portfolioUse || (['digital-marketing-automation', 'communication-content', 'cms-web-process'].includes(roleFamily) ? 'relevant' : 'omit'),
    aiTrainingUse: overrides.aiTrainingUse || 'only-if-relevant',
    letterContent: overrides.letterContent || null,
    mailContent: overrides.mailContent || null,
    companySources: overrides.companySources || context.jobAd?.companyResearch || [],
    guidanceVersion: '2026-07-21.1',
    status: 'draft',
    manualApprovalRequired: true,
  };
}

export function assertStrategyEvidence(strategy) {
  const allowed = new Set(strategy.selectedEvidenceIds || []);
  const claims = strategy.letterContent?.paragraphs || [];
  for (const [index, paragraph] of claims.entries()) {
    if (!Array.isArray(paragraph.evidenceIds) || paragraph.evidenceIds.length === 0) {
      throw new Error(`letterContent.paragraphs[${index}] requires evidenceIds`);
    }
    for (const id of paragraph.evidenceIds) {
      if (!allowed.has(id) && !String(id).startsWith('job-ad:') && !String(id).startsWith('company-source:')) {
        throw new Error(`letterContent.paragraphs[${index}] references unselected evidence id ${id}`);
      }
    }
  }
}
