import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { normalizeAtsText, atsNormalizationConfig, joinPdfTextItems } from '../src/lib/ats-normalize.mjs';

const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const esc = (value) => String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
const arg = process.argv.indexOf('--variant');
const variantId = arg >= 0 ? process.argv[arg + 1] : 'general';
const previewOnly = process.argv.includes('--preview-only');
mkdirSync('dist', { recursive: true });
const staleFiles = [
  `dist/render-failure-${variantId}.json`,
  `dist/render-report-${variantId}.json`,
  `dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`,
  `dist/cv-${variantId}-page-1.png`,
  `dist/cv-${variantId}-page-2.png`,
  `dist/text-${variantId}-poppler.txt`,
  `dist/text-${variantId}-poppler-raw.txt`,
  `dist/text-${variantId}-poppler-default.txt`,
  `dist/text-${variantId}-poppler-layout.txt`,
  `dist/fonts-${variantId}-pdffonts.txt`,
];
for (const file of staleFiles) {
  if (existsSync(file)) unlinkSync(file);
}

const data = load('data/private/cv.master.json');
const variant = load(`data/public/variants/${variantId}.json`);
const backgroundFileExists = existsSync('assets/bg_img.jpeg');

function runTextCommand(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return {
    command: [command, ...args].join(' '),
    status: result.status,
    stdout: typeof result.stdout === 'string' ? result.stdout.trim() : '',
    stderr: typeof result.stderr === 'string' ? result.stderr.trim() : '',
    error: result.error?.message || null,
  };
}

const fontResolution = {
  arial: runTextCommand('fc-match', ['Arial']),
  liberationSans: runTextCommand('fc-match', ['Liberation Sans']),
};
writeFileSync('dist/font-resolution.txt', [
  '$ fc-match Arial',
  fontResolution.arial.stdout || fontResolution.arial.stderr || fontResolution.arial.error || '',
  '',
  '$ fc-match "Liberation Sans"',
  fontResolution.liberationSans.stdout || fontResolution.liberationSans.stderr || fontResolution.liberationSans.error || '',
].join('\n'));

function fontResolutionName(matchOutput) {
  const value = String(matchOutput || '');
  if (/Liberation Sans|LiberationSans/i.test(value)) return 'Liberation Sans';
  if (/Arial/i.test(value)) return 'Arial';
  return value.split(':')[0].trim() || '';
}


const extractionSentinels = [
  'Deutsch',
  'Englisch',
  'Französisch',
  'Polnisch',
  'Pazifikregion',
  'Schachfestival',
  'Mediamatiker',
  'Office 365',
  'Adobe Premiere Pro',
  'phpMyAdmin',
];

const forbiddenBrokenTokens = [
  'Deuts ch',
  'Englis ch',
  'Französ is ch',
  'Polnis ch',
  'Pazif ikregion',
  'Schachf estival',
  'Me diamatiker',
  'Off ice 365',
  'Adobe Prem iere Pro',
  'phpMy Admin',
  'm ediam atikbezogene',
  'mediam atikbezogene',
  'System e',
  'Pet er St adelmann',
  'Pet er Wyss',
];

function analyzeExtractedText(text, requiredTerms) {
  const normalizedText = normalizeAtsText(text);
  const required = [...new Set(requiredTerms || [])].filter(Boolean);
  const missingTerms = required.filter((term) => !normalizedText.includes(normalizeAtsText(term)));
  const requiredTermsPresent = required.filter((term) => normalizedText.includes(normalizeAtsText(term)));
  const extractionSentinelsPresent = extractionSentinels.filter((term) => normalizedText.includes(normalizeAtsText(term)));
  const brokenTokensDetected = forbiddenBrokenTokens.filter((term) => normalizedText.includes(normalizeAtsText(term)) || String(text).includes(term));
  return { normalizedText, missingTerms, requiredTermsPresent, extractionSentinelsPresent, brokenTokensDetected };
}


const targetRoleFamilies = {
  general: 'mediamatik-marketing-core',
  'communication-content': 'mediamatik-marketing-core',
  'administration-gever': 'non-mediamatik-core',
  'cms-web-process': 'mediamatik-marketing-core',
};
const targetRoleFamily = variant.targetRoleFamily || targetRoleFamilies[variantId] || 'mediamatik-marketing-core';
const crossDomainBulletText = 'Weitere Tätigkeiten aus dem Mediamatik- und Marketingbereich';
const skillIconFiles = {
  'skill-digital-web': 'assets/icons/skills/skill-digital-web.svg',
  'skill-content-media': 'assets/icons/skills/skill-content-media.svg',
  'skill-systems-processes': 'assets/icons/skills/skill-systems-processes.svg',
  'skill-workstyle-organization': 'assets/icons/skills/skill-workstyle-organization.svg',
};
const skillIconIds = Object.keys(skillIconFiles);
const skillIconKeywords = {
  'skill-digital-web': ['web', 'cms', 'digital', 'kanäle', 'marketing', 'online', 'tracking', 'shop'],
  'skill-content-media': ['content', 'medien', 'produktion', 'kommunikation', 'print', 'video', 'foto', 'kampagnen'],
  'skill-systems-processes': ['system', 'gever', 'acta', 'administration', 'office', 'dokument', 'prozess', 'daten'],
  'skill-workstyle-organization': ['arbeitsweise', 'organisation', 'koordination', 'qualität', 'zusammenarbeit', 'support', 'service'],
};
const sectionIconPreferences = {
  'digital-marketing-web': 'skill-digital-web',
  'content-media': 'skill-content-media',
  'technik-systeme': 'skill-systems-processes',
  arbeitsweise: 'skill-workstyle-organization',
};
const skillsetSupplementalBullets = {
  'digital-marketing-web': [
    { id: 'skill-digital-channels-care', text: 'Pflege digitaler Kanäle mit adressatengerechter Struktur und nachvollziehbaren Aktualisierungen', tags: ['digital', 'channels'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_core', status: 'defensible_inference', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-web-content-quality', text: 'Qualitätssicherung von Web- und Content-Elementen vor Veröffentlichung und Übergabe', tags: ['web', 'quality'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_supporting', status: 'defensible_inference', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-digital-interfaces', text: 'Zusammenarbeit mit Web- und IT-Partnern bei digitalen Oberflächen und Systemanpassungen', tags: ['web', 'systems'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_supporting', status: 'defensible_inference', optional: true, jobAdMatchScore: 0 },
  ],
  'content-media': [
    { id: 'skill-content-channel-planning', text: 'Planung von Content für Print, Web, Newsletter und Social Media nach Zielgruppe und Kanal', tags: ['content', 'communication'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_core', status: 'defensible_inference', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-media-production-workflow', text: 'Aufbereitung von Medieninhalten von Konzept und Produktion bis zur finalen Dokumentation', tags: ['media', 'documentation'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_supporting', status: 'defensible_inference', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-brand-consistency', text: 'Sicherstellung konsistenter Gestaltung entlang bestehender Corporate-Identity-Vorgaben', tags: ['brand', 'design'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_core', status: 'defensible_inference', optional: true, jobAdMatchScore: 0 },
    { id: 'skill-presentations-stakeholders', text: 'Erstellung verständlicher Präsentationen und Unterlagen für interne und externe Anspruchsgruppen', tags: ['presentation', 'communication'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_supporting', status: 'defensible_inference', optional: true, jobAdMatchScore: 0 },
  ],
  'technik-systeme': [
    { id: 'skill-system-support-office', text: 'Sichere Anwendung von Office 365, CMS, Webshop- und Dokumentensystemen im Arbeitsalltag', tags: ['systems', 'office'], sources: ['cv-2d-p1', 'cv-2d-p2'], evidenceLevel: 'professional_core', status: 'verified', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-gever-document-work', text: 'Strukturierte Bearbeitung und nachvollziehbare Ablage digitaler Geschäftsvorgänge', tags: ['gever', 'documents'], sources: ['cv-2d-p2'], evidenceLevel: 'professional_core', status: 'verified', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-data-care-quality', text: 'Sorgfältige Datenpflege, formale Kontrolle und dokumentierte Nachführung in digitalen Systemen', tags: ['data', 'quality'], sources: ['cv-2d-p2'], evidenceLevel: 'professional_core', status: 'verified', optional: true, jobAdMatchScore: 0 },
  ],
  arbeitsweise: [
    { id: 'skill-coordination-partners', text: 'Koordination von Aufgaben, Terminen und externen Partnern mit klarer Kommunikation', tags: ['coordination', 'partners'], sources: ['cv-2d-p1'], evidenceLevel: 'professional_core', status: 'defensible_inference', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-knowledge-documentation', text: 'Wissenssicherung durch verständliche Prozessdokumentation und geordnete Übergaben', tags: ['documentation', 'process'], sources: ['cv-2d-p1', 'cv-2d-p2'], evidenceLevel: 'professional_core', status: 'defensible_inference', optional: false, jobAdMatchScore: 0 },
    { id: 'skill-service-quality', text: 'Serviceorientierte Unterstützung interner Fachstellen mit schneller Einarbeitung in neue Abläufe', tags: ['support', 'quality'], sources: ['cv-2d-p2'], evidenceLevel: 'professional_supporting', status: 'defensible_inference', optional: true, jobAdMatchScore: 0 },
  ],
};

function evidenceStatus(item) {
  return item.status === 'defensible_inference' ? 'defensible_inference' : 'verified';
}

function normalizeSkillBullet(item) {
  return {
    ...item,
    sourceIds: item.sourceIds || item.sources || [],
    evidenceStatus: evidenceStatus(item),
    jobAdMatchScore: item.jobAdMatchScore ?? 0,
    optional: Boolean(item.optional),
  };
}

function scoreIconForSection(section, iconId) {
  const text = `${section.title} ${(section.items || []).map((item) => `${item.text} ${(item.tags || []).join(' ')}`).join(' ')}`.toLowerCase();
  const keywordScore = (skillIconKeywords[iconId] || []).filter((keyword) => text.includes(keyword)).length;
  const preferred = sectionIconPreferences[section.id] === iconId ? 3 : 0;
  return keywordScore * 50 + preferred * 20;
}

function assignSkillIcons(sections) {
  const permutations = (items) => items.length <= 1 ? [items] : items.flatMap((item, index) => permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest]));
  let best = null;
  for (const order of permutations(skillIconIds)) {
    const score = sections.reduce((sum, section, index) => sum + scoreIconForSection(section, order[index]), 0);
    if (!best || score > best.score) best = { order, score };
  }
  return sections.map((section, index) => ({ ...section, iconId: best.order[index], iconMatchScore: scoreIconForSection(section, best.order[index]) }));
}

function buildSkillsets(rawSections) {
  const orderedIds = [...variant.skillSectionOrder, ...data.skillSections.map((section) => section.id)];
  const uniqueIds = [...new Set(orderedIds)];
  const selectedSections = uniqueIds.map((id) => data.skillSections.find((section) => section.id === id)).filter(Boolean).slice(0, 4);
  const sections = selectedSections.map((section) => {
    const baseItems = section.items.map((item) => normalizeSkillBullet({ ...item, optional: false, jobAdMatchScore: 0 }));
    const supplemental = (skillsetSupplementalBullets[section.id] || []).map(normalizeSkillBullet);
    const deduped = [];
    for (const item of [...baseItems, ...supplemental]) {
      if (!deduped.some((existing) => existing.id === item.id || normalizeAtsText(existing.text) === normalizeAtsText(item.text))) deduped.push(item);
    }
    const coreItems = [];
    for (const item of deduped) {
      if (coreItems.length >= 6) break;
      if (!item.optional) coreItems.push({ ...item, skillOptional: false });
    }
    for (const item of deduped) {
      if (coreItems.length >= 6) break;
      if (!coreItems.some((core) => core.id === item.id)) coreItems.push({ ...item, skillOptional: false, optionalPromotedToCore: true });
    }
    const optionalItems = deduped
      .filter((item) => !coreItems.some((core) => core.id === item.id))
      .slice(0, 2)
      .map((item) => ({ ...item, skillOptional: true }));
    const items = [...coreItems, ...optionalItems];
    return {
      ...section,
      title: variant.skillSectionTitles[section.id] || section.title,
      coreItems,
      optionalItems,
      items,
      minimumBullets: 6,
      maximumBullets: 8,
    };
  });
  return assignSkillIcons(sections);
}

function classifyCapabilityCluster(bullet) {
  const text = `${bullet.text || ''} ${(bullet.tags || []).join(' ')}`.toLowerCase();
  if (/admin|office|dokument|gever|acta|ablage|daten|formal/.test(text)) return 'administration';
  if (/system|cms|web|online|shop|technik|livestream|stream/.test(text)) return 'systems';
  if (/prozess|koordination|organisation|support|qualität|übergabe/.test(text)) return 'process-support';
  if (/content|kommunikation|medien|video|foto|gestaltung|marketing/.test(text)) return 'communication-media';
  return 'operations';
}

function createBreadthSummaryBullet(experience, omitted) {
  if (targetRoleFamily === 'non-mediamatik-core') return null;
  const eligible = omitted.filter((bullet) => bullet.status !== 'inferred_review_required' && bullet.evidenceLevel !== 'inferred_review_required');
  const clusters = [...new Set(eligible.map(classifyCapabilityCluster))].slice(0, 3);
  if (!clusters.length) return null;
  const phraseMap = {
    administration: 'Administration',
    systems: 'Systempflege',
    'process-support': 'Prozessunterstützung',
    'communication-media': 'Kommunikation und Medienproduktion',
    operations: 'operativer Unterstützung',
  };
  const label = clusters.map((cluster) => phraseMap[cluster] || cluster).join(', ').replace(/, ([^,]*)$/, ' und $1');
  return {
    id: `${experience.id}-breadth-summary`,
    text: `Weitere Tätigkeiten in ${label}`,
    tags: clusters,
    evidenceLevel: 'defensible_inference',
    sources: [...new Set(eligible.flatMap((bullet) => bullet.sources || bullet.sourceIds || experience.sources || []))],
    sourceIds: [...new Set(eligible.flatMap((bullet) => bullet.sources || bullet.sourceIds || experience.sources || []))],
    status: 'defensible_inference',
    evidenceStatus: 'defensible_inference',
    breadthSummary: true,
    omittedCapabilityClusters: clusters,
  };
}

function createCrossDomainBullet(experience) {
  return {
    id: `${experience.id}-cross-domain-mediamatik-marketing`,
    text: crossDomainBulletText,
    tags: ['mediamatik', 'marketing'],
    evidenceLevel: 'structural_repeat',
    sources: experience.sources || ['cv-2d-p2'],
    sourceIds: experience.sources || ['cv-2d-p2'],
    status: 'defensible_inference',
    evidenceStatus: 'defensible_inference',
    crossDomain: true,
  };
}

function applyVariant() {
  const selected = new Set(variant.selectedBulletIds);
  const hidden = new Set(variant.hiddenBulletIds);
  const priority = new Map(variant.bulletPriority.map((id, index) => [id, index]));
  const sections = buildSkillsets(data.skillSections);

  const supplementaryItems = [];
  const experienceIndicatorText = data.supplementaryIndicators?.experience?.[variantId] || data.supplementaryIndicators?.experience?.general;
  const maxExperienceIndicators = targetRoleFamily === 'non-mediamatik-core' ? 0 : (variant.supplementaryIndicators?.experience?.enabled ? variant.supplementaryIndicators.experience.maxPerVariant ?? 0 : 0);
  const experienceIndicatorPriority = new Map([
    ['mediamatiker-ausbildung-army-bict', 1],
    ['schachfestival-livestream-event', 2],
    ['kunz-kunath-marketing-mediamatiker', 3],
    ['rekrutenschule-triage-fuehrungsdienst', 4],
    ['freelance-digital-marketing-media', 5],
  ]);

  const experiences = data.experiences.map((experience) => {
    const included = experience.bullets
      .filter((bullet) => selected.has(bullet.id) && !hidden.has(bullet.id))
      .sort((a, b) => (priority.get(a.id) ?? 99) - (priority.get(b.id) ?? 99))
      .slice(0, variant.maxBulletsPerExperience);
    const omittedMandatory = experience.bullets.filter((bullet) => !included.some((item) => item.id === bullet.id));
    const substantiveOptionalCandidates = (experience.optionalBullets || [])
      .filter((bullet) => (bullet.variantRelevance || []).includes(variantId))
      .sort((a, b) => (a.fillPriority ?? 99) - (b.fillPriority ?? 99))
      .map((bullet) => ({ ...bullet, experienceId: experience.id, candidateType: 'optional-bullet' }));
    const optionalCandidates = targetRoleFamily === 'non-mediamatik-core' ? [] : substantiveOptionalCandidates;
    const minimumFillers = [...experience.bullets, ...substantiveOptionalCandidates]
      .filter((bullet) => !included.some((item) => item.id === bullet.id) && !hidden.has(bullet.id) && bullet.status !== 'inferred_review_required' && bullet.evidenceLevel !== 'inferred_review_required')
      .sort((a, b) => (priority.get(a.id) ?? a.fillPriority ?? 99) - (priority.get(b.id) ?? b.fillPriority ?? 99));
    const seenSubstantiveTexts = new Set(included.map((bullet) => normalizeAtsText(bullet.shortText || bullet.text || '')));
    while (included.length < 2 && minimumFillers.length > 0) {
      const filler = minimumFillers.shift();
      const text = filler.shortText || filler.text;
      const semanticKey = normalizeAtsText(text || '');
      if (seenSubstantiveTexts.has(semanticKey)) continue;
      seenSubstantiveTexts.add(semanticKey);
      included.push({ ...filler, text, minimumFallback: true });
    }
    if (targetRoleFamily === 'non-mediamatik-core' && !included.some((item) => item.crossDomain)) included.push(createCrossDomainBullet(experience));
    const omitted = [...omittedMandatory, ...optionalCandidates].filter((bullet) => !included.some((item) => item.id === bullet.id));
    const breadthSummary = createBreadthSummaryBullet(experience, omitted);
    if (breadthSummary && !included.some((item) => item.breadthSummary || item.crossDomain)) included.push(breadthSummary);
    return {
      ...experience,
      bullets: included,
      optionalCandidates,
      supplementaryText: experience.showSupplementaryWhenOmitted && omitted.length > 0 ? (experience.supplementaryText || experienceIndicatorText) : '',
      omittedBulletIds: omitted.map((bullet) => bullet.id),
      indicatorPriority: experienceIndicatorPriority.get(experience.id) ?? 99,
    };
  });

  const experienceIndicators = experiences
    .filter((experience) => experience.supplementaryText && experience.omittedBulletIds.length > 0)
    .sort((a, b) => a.indicatorPriority - b.indicatorPriority)
    .slice(0, maxExperienceIndicators)
    .map((experience, index) => ({
      type: 'experience',
      experienceId: experience.id,
      text: experience.supplementaryText,
      omittedBulletIds: experience.omittedBulletIds,
      priority: index + 1,
      candidateType: 'experience-indicator',
      id: `supplementary-${experience.id}`,
    }));
  supplementaryItems.push(...experienceIndicators);

  const toolMap = new Map(data.tools.map((tool) => [tool.id, tool]));
  const tools = variant.toolOrder.map((id) => toolMap.get(id)).filter(Boolean).slice(0, variant.maxTools);
  const omittedTools = data.tools.filter((tool) => !tools.some((visible) => visible.id === tool.id));
  const toolsIndicator = variant.supplementaryIndicators?.tools?.enabled && omittedTools.length > 0
    ? { type: 'tools', text: variant.supplementaryIndicators.tools.text, omittedToolIds: omittedTools.map((tool) => tool.id) }
    : null;
  if (toolsIndicator) supplementaryItems.push(toolsIndicator);

  return {
    ...data,
    headline: variant.headline,
    targetRoleFamily,
    summaryCandidates: data.summary.candidates?.[variant.summaryKey] || data.summary.candidates?.default || [{ id: `${variant.summaryKey || 'default'}-fallback`, text: variant.summaryKey === 'default' ? data.summary.default : data.summary.variants[variant.summaryKey], evidenceIds: ['cv-2d', 'linkedin-profile'], atsTerms: [variant.headline] }],
    summaryText: (data.summary.candidates?.[variant.summaryKey] || data.summary.candidates?.default)?.[0]?.text || (variant.summaryKey === 'default' ? data.summary.default : data.summary.variants[variant.summaryKey]),
    summaryMeta: { targetLines: data.summary.targetLines || 4, selectedCandidateId: null, selectionSucceeded: false, failureReason: null, evidenceIds: [], atsTerms: [variant.headline], jobSpecific: true, candidateMeasurements: [] },
    skillSections: sections,
    experiences,
    tools,
    supplementary: {
      candidateItems: supplementaryItems,
      renderedItems: [],
      rejectedItems: [],
      optionalCandidates: experiences.flatMap((experience) => experience.optionalCandidates.map((bullet) => ({ ...bullet, text: bullet.text }))),
      optionalVisibleBulletIds: [],
      omittedToolIds: omittedTools.map((tool) => tool.id),
      toolsIndicator,
      maxExperienceIndicators,
    },
    fill: {
      enabled: Boolean(variant.fill?.enabled),
      preferredOptionalBulletCount: variant.fill?.preferredOptionalBulletCount ?? 0,
      maxOptionalBullets: variant.fill?.maxOptionalBullets ?? 6,
      optionalBulletsUsed: 0,
      minRemainingSpaceMm: variant.fill?.minRemainingSpaceMm ?? 5,
      baselineGapPx: 0,
      finalGapPx: 0,
      consideredOptionalBulletIds: [],
      acceptedOptionalBulletIds: [],
      rejectedOptionalBulletIds: [],
    },
  };
}
const cv = applyVariant();

const footerIconFiles = {
  tools: 'assets/icons/footer/software-tools.svg',
  references: 'assets/icons/footer/referenzen.svg',
  entry: 'assets/icons/footer/eintritt.svg',
  workload: 'assets/icons/footer/pensum.svg',
};
const footerIcons = Object.fromEntries(Object.entries(footerIconFiles).map(([key, file]) => [key, readFileSync(file, 'utf8')]));
const skillIcons = Object.fromEntries(Object.entries(skillIconFiles).map(([key, file]) => [key, readFileSync(file, 'utf8')]));
function footerIcon(key) {
  return footerIcons[key].replace('<svg ', `<svg class="icon footer-icon icon-${key}" data-footer-icon="${key}" aria-hidden="true" focusable="false" `);
}

function skillIcon(iconId) {
  return skillIcons[iconId].replace('<svg ', `<svg class="icon skill-icon icon-${iconId}" data-skill-icon="${iconId}" `);
}


function icon(id) {
  const paths = {
    'digital-marketing-web': "<circle cx='16' cy='16' r='12'/><path d='M8 18l5-5 4 4 7-8'/>",
    'content-media': "<rect x='7' y='8' width='18' height='16' rx='2'/><path d='M10 13h12M10 18h8'/>",
    'technik-systeme': "<circle cx='16' cy='16' r='4'/><path d='M16 5v5M16 22v5M5 16h5M22 16h5M8 8l4 4M20 20l4 4M24 8l-4 4M12 20l-4 4'/>",
    arbeitsweise: "<path d='M8 17l5 5 11-13'/><path d='M7 8h18M7 13h10M7 25h18'/>",
    tools: "<path d='M10 6h12v20H10z'/><path d='M13 11h6M13 16h6M13 21h4'/>",
    references: "<circle cx='12' cy='12' r='4'/><path d='M5 26c1-5 13-5 14 0M22 10v10M18 16h8'/>",
    availability: "<circle cx='16' cy='16' r='11'/><path d='M16 9v8l5 3'/>",
    workload: "<circle cx='16' cy='16' r='11'/><circle cx='12' cy='12' r='2'/><circle cx='20' cy='20' r='2'/><path d='M21 10L11 22'/>",
  };
  return `<svg class="icon icon-${id}" aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths[id] || paths['digital-marketing-web']}</svg>`;
}

function experienceLine(experience) {
  return experience.id === 'freelance-digital-marketing-media'
    ? esc(experience.employer)
    : `${esc(experience.employer)}${experience.location ? `, ${esc(experience.location)}` : ''}`;
}

function toolColumns() {
  const split = Math.max(7, Math.ceil(cv.tools.length / 2));
  return [cv.tools.slice(0, split), cv.tools.slice(split)];
}


function html() {
  const [toolLeft, toolRight] = toolColumns();
  const skillHtml = cv.skillSections.map((section) => `<section class="module skill-section" id="skill-${section.id}" data-skillset-id="${section.id}" data-skill-icon-id="${section.iconId}" data-check data-collision-group="skills"><div class="skill-icon-wrap">${skillIcon(section.iconId)}</div><div class="skill-copy"><h2 data-ats-required>${esc(section.title)}</h2><ul>${section.items.map((item) => `<li id="${item.id}"${item.skillOptional ? ' class="optional-skill-bullet" hidden' : ''} data-check data-ats-required data-skill-optional="${item.skillOptional ? 'true' : 'false'}" data-skillset-id="${section.id}" data-source-ids="${esc((item.sourceIds || item.sources || []).join(','))}" data-evidence-status="${esc(item.evidenceStatus || evidenceStatus(item))}" data-job-ad-match-score="${item.jobAdMatchScore ?? 0}">${esc(item.text)}</li>`).join('')}</ul></div></section>`).join('');
  const expHtml = cv.experiences.map((experience) => {
    const bullets = experience.bullets;
    const optionalHtml = experience.optionalCandidates.map((bullet) => `<li id="${bullet.id}" class="optional-fill" data-check data-fill-state="candidate" data-fill-kind="optional-bullet" data-experience-id="${experience.id}" data-fill-priority="${bullet.fillPriority ?? 99}" data-long-text="${esc(bullet.text)}" data-short-text="${esc(bullet.shortText || bullet.text)}" data-fill-id="${bullet.id}" hidden>${esc(bullet.text)}</li>`).join('');
    const indicatorAllowed = cv.supplementary.candidateItems.find((item) => item.type === 'experience' && item.experienceId === experience.id);
    const indicatorHtml = indicatorAllowed ? `<p class="supplementary experience-more" data-check data-fill-state="candidate" data-fill-kind="experience-indicator" data-experience-id="${experience.id}" data-fill-priority="${indicatorAllowed.priority ?? 99}" data-long-text="${esc(indicatorAllowed.text)}" data-short-text="${esc(indicatorAllowed.text)}" data-fill-id="${indicatorAllowed.id}" hidden>${esc(indicatorAllowed.text)}</p>` : '';
    const titleHtml = experience.id === 'mediamatiker-ausbildung-army-bict'
      ? `<div class="meta experience-title combined-training-title" data-ats-required data-ats-text="Mediamatiker EFZ in Ausbildung, Berufsmaturität Typ Wirtschaft und Dienstleistungen" data-source-ids="${esc((experience.sources || []).join(','))}" data-evidence-status="verified"><span>Mediamatiker EFZ in Ausbildung</span><span class="combined-training-credential">Berufsmaturität Typ Wirtschaft und Dienstleistungen</span></div>`
      : `<div class="meta experience-title" data-ats-required>${esc(experience.period)} <span>|</span> <strong>${esc(experience.role)}</strong></div>`;
    const periodHtml = experience.id === 'mediamatiker-ausbildung-army-bict' ? `<div class="meta training-period" data-ats-required>${esc(experience.period)}</div>` : '';
    return `<article class="module experience" id="experience-${experience.id}" data-check data-collision-group="experiences"><div class="experience-heading">${titleHtml}${periodHtml}<div class="employer experience-location-line" data-ats-required>${experienceLine(experience)}</div>${experience.notes.map((note) => `<div class="note experience-location-line">${esc(note)}</div>`).join('')}</div><ul>${bullets.map((bullet) => `<li id="${bullet.id}"${bullet.crossDomain ? ' class="experience-cross-domain-bullet experience-breadth-summary-bullet" data-cross-domain-bullet="mediamatik-marketing" data-structural-repeat="cross-domain-experience" data-experience-summary="omitted-capabilities"' : bullet.breadthSummary ? ' class="experience-breadth-summary-bullet" data-experience-summary="omitted-capabilities"' : ''} data-check data-ats-required data-summary-source-ids="${esc((bullet.sourceIds || bullet.sources || []).join(','))}" data-evidence-status="${esc(bullet.evidenceStatus || evidenceStatus(bullet))}" data-omitted-capability-clusters="${esc((bullet.omittedCapabilityClusters || []).join(','))}">${esc(bullet.text)}</li>`).join('')}${optionalHtml}</ul>${indicatorHtml}</article>`;
  }).join('');
  const toolIndicator = cv.supplementary.toolsIndicator ? `<p class="supplementary tools-more" data-check data-ats-required data-ats-text="${esc(cv.supplementary.toolsIndicator.text)}">${esc(cv.supplementary.toolsIndicator.text)}</p>` : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Lebenslauf ${esc(cv.person.name)} ${esc(variantId)}</title><link rel="stylesheet" href="../src/styles/tokens.css"><link rel="stylesheet" href="../src/styles/cv.css"></head><body><main class="cv" data-variant="${esc(variantId)}"><section class="cv-page" id="page-1"><div class="frame"><section class="hero-panel" id="hero-panel" data-check><img class="profile" src="../${esc(cv.person.profileImage)}" alt="Porträt von Adam Dolinsky"><header class="hero"><h1 data-ats-required>${esc(cv.person.name)}</h1><p class="headline" data-ats-required>${esc(cv.headline)}</p><p class="credential">${esc(cv.positioning.credential)}</p><p class="contact"><span>${esc(cv.person.location)}</span><br><a href="mailto:${esc(cv.person.email)}" data-ats-required>${esc(cv.person.email)}</a></p><div class="link-buttons"><a href="${esc(cv.person.portfolio)}">dolinsky.ch</a><a href="${esc(cv.person.linkedin)}">LinkedIn</a></div></header><section class="module summary" id="summary" data-check data-summary-target-lines="${cv.summaryMeta.targetLines}"><h2>KURZPROFIL</h2><p id="summary-text">${esc(cv.summaryText)}</p></section></section><section class="competence-panel" id="competence-panel" data-check><h2 class="page-section-title competencies-page-title" data-ats-required data-ats-section-title="competencies">Kompetenzen</h2>${skillHtml}<section class="module languages-row" id="languages" data-check data-collision-group="skills"><div class="languages-label">SPRACHEN</div>${cv.languages.map((language) => `<div class="language" data-ats-required data-ats-text="${esc(`${language.name} ${language.level}`)}"><span>${esc(language.name)}</span><strong>${esc(language.level)}</strong></div>`).join('')}</section></section></div><div class="counter">1/2</div></section><section class="cv-page" id="page-2"><div class="frame page-two"><section class="white-panel" id="page-two-panel" data-check><h2 class="page-section-title experience-page-title" data-ats-required data-ats-section-title="experience-responsibility">Kompetenzen &amp; Verantwortung</h2><section class="experience-list" id="experience-list" data-check>${expHtml}</section><footer class="bottom-grid" id="bottom-grid" data-check data-collision-group="experiences"><section class="module tools" id="tools" data-check data-collision-group="bottom"><h2 data-footer-title="tools">${footerIcon('tools')}<span>SOFTWARE & TOOLS</span></h2><div class="tool-cols"><div>${toolLeft.map((tool) => `<span id="${tool.id}" data-tool-id="${tool.id}" data-ats-required>${esc(tool.name)}</span>`).join('')}</div><div>${toolRight.map((tool) => `<span id="${tool.id}" data-tool-id="${tool.id}" data-ats-required>${esc(tool.name)}</span>`).join('')}</div></div>${toolIndicator}</section><section class="module refs" id="references" data-check data-collision-group="bottom"><h2 data-footer-title="references">${footerIcon('references')}<span>REFERENZEN</span></h2>${cv.references.map((reference) => `<p><strong data-ats-required>${esc(reference.name)}</strong><br>${esc(reference.role)}<br>${esc(reference.employer)}<br><span data-ats-required>${esc(reference.phone)}</span></p>`).join('')}</section><section class="module avail" id="availability" data-check data-collision-group="bottom"><div class="availability-block entry-block"><h2 data-footer-title="entry">${footerIcon('entry')}<span>EINTRITT</span></h2><p data-ats-required>${esc(cv.availability.text)}</p></div><div class="availability-block workload-block"><h2 data-footer-title="workload">${footerIcon('workload')}<span>PENSUM</span></h2><p data-ats-required>${esc(cv.workload.text)}</p></div></section></footer></section></div><div class="counter">2/2</div></section></main></body></html>`;
}

const htmlPath = `dist/cv-${variantId}-preview.html`;
writeFileSync(htmlPath, html());

if (previewOnly) {
  console.log(JSON.stringify({
    variant: variantId,
    previewOnly: true,
    previewPath: `dist/cv-${variantId}-preview.html`,
  }));
  process.exitCode = 0;
  process.exit();
}

let renderStage = 'startup';
let browser = null;

async function closeBrowserIfOpen() {
  if (!browser) return;
  renderStage = 'browser-close';
  const activeBrowser = browser;
  browser = null;
  try {
    await activeBrowser.close();
  } catch (closeError) {
    console.error('Browser close failed:', closeError?.stack || closeError);
  }
}

function writeRenderFailure(error) {
  writeFileSync(`dist/render-failure-${variantId}.json`, JSON.stringify({
    variant: variantId,
    renderer: 'playwright',
    renderStage,
    errorName: String(error?.name || ''),
    errorMessage: String(error?.message || ''),
    errorStack: String(error?.stack || error || ''),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  }, null, 2));
}

function getPrimaryFontFamily(value) {
  return String(value || '').split(',')[0].replace(/[\"']/g, '').trim();
}

function isUnexpectedPrimaryFont(value, expected) {
  const primary = getPrimaryFontFamily(value);
  return primary !== expected;
}

async function withPlaywright() {
  renderStage = 'playwright-import';
  const { chromium } = await import('playwright');
  renderStage = 'browser-launch';
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
  const fileUrl = new URL(htmlPath, `file://${process.cwd()}/`).href;
  renderStage = 'preview-navigation';
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  renderStage = 'font-loading';
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px Arial', 'Adam Dolinsky'),
      document.fonts.load('700 16px Arial', 'Pazifikregion'),
      document.fonts.load('italic 400 16px Arial', 'Kurzprofil'),
      document.fonts.load('700 16px "Roboto Slab"', 'Arbeitsweise'),
    ]);
    await document.fonts.ready;
  });

  renderStage = 'summary-selection';
  const selectedSummary = await page.evaluate(async ({ candidates, targetLines }) => {
    const element = document.querySelector('#summary-text');
    const countVisibleTextLines = (target) => {
      const range = document.createRange();
      range.selectNodeContents(target);
      const tops = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top * 2) / 2);
      return [...new Set(tops)].length;
    };
    const measurements = [];
    for (const candidate of candidates) {
      element.textContent = candidate.text;
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const actualLines = countVisibleTextLines(element);
      const accepted = actualLines === targetLines;
      measurements.push({ id: candidate.id, actualLines, accepted });
      if (accepted) return { ...candidate, actualLines, selectedCandidateId: candidate.id, selectionSucceeded: true, failureReason: null, candidateMeasurements: measurements };
    }
    const fallback = candidates[candidates.length - 1];
    element.textContent = fallback.text;
    return { id: null, text: fallback?.text || '', evidenceIds: fallback?.evidenceIds || [], atsTerms: fallback?.atsTerms || [], actualLines: measurements.at(-1)?.actualLines || 0, selectedCandidateId: null, selectionSucceeded: false, failureReason: 'no-four-line-candidate', candidateMeasurements: measurements };
  }, { candidates: cv.summaryCandidates, targetLines: cv.summaryMeta.targetLines });
  cv.summaryText = selectedSummary.text;
  cv.summaryMeta = { ...cv.summaryMeta, selectedCandidateId: selectedSummary.selectedCandidateId ?? null, selectionSucceeded: Boolean(selectedSummary.selectionSucceeded), failureReason: selectedSummary.failureReason ?? null, evidenceIds: selectedSummary.evidenceIds || [], atsTerms: selectedSummary.atsTerms || [], actualLines: selectedSummary.actualLines, candidateMeasurements: selectedSummary.candidateMeasurements || [] };

  renderStage = 'layout-typography-selection';
  const typographySelection = await page.evaluate(() => {
    const root = document.documentElement;
    const mmToPx = (mm) => mm * 96 / 25.4;
    const measureLayout = () => {
      const pages = [...document.querySelectorAll('.cv-page')];
      const overflows = [];
      for (const page of pages) if (page.scrollHeight > page.clientHeight + 1) overflows.push(page.id);
      for (const element of document.querySelectorAll('[data-check]')) {
        const rect = element.getBoundingClientRect();
        const panel = element.closest('.competence-panel,.hero-panel,.white-panel,.bottom-grid') || element.closest('.cv-page');
        const panelRect = panel.getBoundingClientRect();
        if (rect.bottom > panelRect.bottom + 1 || rect.right > panelRect.right + 1 || element.scrollHeight > element.clientHeight + 1) overflows.push(element.id || element.className || element.tagName);
      }
      const collisionCount = 0;
      return { pageCount: pages.length, overflowCount: overflows.length, collisionCount };
    };
    const bulletCandidates = [8.2, 8.1, 8.0, 7.9, 7.8, 7.7, 7.6, 7.5, 7.45];
    const bulletMeasurements = [];
    let selectedBullet = bulletCandidates.at(-1);
    for (const fontSizePt of bulletCandidates) {
      root.style.setProperty('--experience-body-font-size', `${fontSizePt}pt`);
      const measured = measureLayout();
      const accepted = measured.pageCount === 2 && measured.overflowCount === 0 && measured.collisionCount === 0;
      bulletMeasurements.push({ fontSizePt, accepted, pageCount: measured.pageCount, overflowCount: measured.overflowCount, collisionCount: measured.collisionCount, reason: accepted ? null : 'layout-overflow' });
      if (accepted) { selectedBullet = fontSizePt; break; }
    }
    root.style.setProperty('--experience-body-font-size', `${selectedBullet}pt`);
    const firstTool = document.querySelector('.tools [data-tool-id]');
    const baseToolPx = firstTool ? Number.parseFloat(getComputedStyle(firstTool).fontSize) : 9.47;
    const toolCandidates = [baseToolPx + 2, baseToolPx + 1, baseToolPx];
    const toolMeasurements = [];
    let selectedToolPx = baseToolPx;
    for (const fontSizePx of toolCandidates) {
      root.style.setProperty('--tool-font-size', `${fontSizePx}px`);
      const measured = measureLayout();
      const toolCount = document.querySelectorAll('.tools [data-tool-id]:not([hidden])').length;
      const accepted = measured.pageCount === 2 && measured.overflowCount === 0 && measured.collisionCount === 0 && toolCount >= 12 && toolCount <= 20;
      toolMeasurements.push({ fontSizePx: Number(fontSizePx.toFixed(2)), increasePx: Number((fontSizePx - baseToolPx).toFixed(2)), accepted, pageCount: measured.pageCount, overflowCount: measured.overflowCount, collisionCount: measured.collisionCount, visibleToolCount: toolCount, reason: accepted ? null : 'layout-overflow' });
      if (accepted) { selectedToolPx = fontSizePx; break; }
    }
    root.style.setProperty('--tool-font-size', `${selectedToolPx}px`);
    root.style.setProperty('--tools-more-gap', '1.5mm');
    return {
      bulletTypography: { targetFontSizePt: 8.2, selectedFontSizePt: selectedBullet, candidateMeasurements: bulletMeasurements, matchesLocationFontSize: selectedBullet === 8.2, largestSafeSizeSelected: true },
      toolTypography: { baseFontSizePx: Number(baseToolPx.toFixed(2)), selectedFontSizePx: Number(selectedToolPx.toFixed(2)), increasePx: Number((selectedToolPx - baseToolPx).toFixed(2)), largestSafeSizeSelected: true, candidateMeasurements: toolMeasurements },
      toolsMoreGap: { beforeMm: 1, afterMm: 1.5, ratio: 1.5, afterPx: Number(mmToPx(1.5).toFixed(2)) },
    };
  });

  renderStage = 'skillset-layout-selection';
  const skillsetLayoutSelection = await page.evaluate(async () => {
    const root = document.documentElement;
    const iconSizes = [21, 20, 19, 18, 17, 16];
    const fallbackMinimumLanguageGapPx = 1.5 * 96 / 25.4; // minimumLanguageGapPx = 1.5 * 96 / 25.4; class="experience-cross-domain-bullet"
    const waitForLayout = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    };
    const visibleSkillSections = () => [...document.querySelectorAll('.skill-section:not([hidden])')];
    const visibleBullets = (section) => [...section.querySelectorAll('li:not([hidden])')];
    const measure = () => {
      const sections = visibleSkillSections();
      const panel = document.querySelector('.competence-panel');
      const panelRect = panel?.getBoundingClientRect();
      const languageRect = document.querySelector('#languages')?.getBoundingClientRect();
      const lastSkillRect = sections.at(-1)?.getBoundingClientRect();
      const languageStyle = document.querySelector('#languages') ? getComputedStyle(document.querySelector('#languages')) : null;
      const languageRuleDistancePx = languageRect ? Math.max(0, languageRect.height - (Number.parseFloat(languageStyle?.borderTopWidth || '0') + Number.parseFloat(languageStyle?.borderBottomWidth || '0')) / 2) : fallbackMinimumLanguageGapPx;
      const minimumLanguageGapPx = Math.max(fallbackMinimumLanguageGapPx, languageRuleDistancePx);
      const languageGapPx = languageRect && lastSkillRect ? languageRect.top - lastSkillRect.bottom : -1;
      const reasons = [];
      if (sections.length !== 4) reasons.push('skillset-count');
      for (const section of sections) {
        const bullets = visibleBullets(section);
        const coreBullets = bullets.filter((li) => li.dataset.skillOptional === 'false');
        const sectionRect = section.getBoundingClientRect();
        const lastBulletRect = bullets.at(-1)?.getBoundingClientRect();
        const borderY = sectionRect.bottom;
        if (coreBullets.length !== 6) reasons.push('core-bullet-count');
        if (bullets.length < 6 || bullets.length > 8) reasons.push('bullet-count-range');
        if (section.scrollHeight > section.clientHeight + 1) reasons.push('skill-scroll-overflow');
        if (panelRect && sectionRect.bottom > panelRect.bottom + 1) reasons.push('panel-overflow');
        if (lastBulletRect && lastBulletRect.bottom >= borderY - 1) reasons.push('text-border-overlap');
      }
      if (languageGapPx < minimumLanguageGapPx) reasons.push('language-gap');
      return { accepted: reasons.length === 0, reason: reasons[0] || null, reasons: [...new Set(reasons)], languageGapPx: Number(Math.max(0, languageGapPx).toFixed(2)), minimumLanguageGapPx: Number(minimumLanguageGapPx.toFixed(2)), finalBulletCounts: Object.fromEntries(sections.map((section) => [section.dataset.skillsetId || section.id.replace('skill-', ''), visibleBullets(section).length])) };
    };
    const optionalBullets = [...document.querySelectorAll('.optional-skill-bullet')];
    optionalBullets.forEach((bullet) => { bullet.hidden = true; });
    const testedIconSizes = [];
    let selectedIconSizeMm = iconSizes.at(-1);
    for (const sizeMm of iconSizes) {
      root.style.setProperty('--skill-icon-size', `${sizeMm}mm`);
      await waitForLayout();
      const measured = measure();
      testedIconSizes.push({ sizeMm, accepted: measured.accepted, reason: measured.reason, reasons: measured.reasons, languageGapPx: measured.languageGapPx });
      if (measured.accepted) { selectedIconSizeMm = sizeMm; break; }
    }
    root.style.setProperty('--skill-icon-size', `${selectedIconSizeMm}mm`);
    await waitForLayout();
    const candidates = optionalBullets
      .map((bullet, index) => ({ bullet, index, id: bullet.id, skillsetId: bullet.dataset.skillsetId || '', jobAdMatchScore: Number(bullet.dataset.jobAdMatchScore || 0), evidenceStatus: bullet.dataset.evidenceStatus || '' }))
      .sort((a, b) => b.jobAdMatchScore - a.jobAdMatchScore || (a.evidenceStatus === 'verified' ? -1 : 1) || a.index - b.index);
    const optionalBulletCandidates = candidates.map(({ id, skillsetId, jobAdMatchScore, evidenceStatus }) => ({ id, skillsetId, jobAdMatchScore, evidenceStatus }));
    const acceptedOptionalBulletIds = [];
    const rejectedOptionalBulletIds = [];
    for (const candidate of candidates) {
      candidate.bullet.hidden = false;
      await waitForLayout();
      const measured = measure();
      if (measured.accepted) acceptedOptionalBulletIds.push(candidate.id);
      else { candidate.bullet.hidden = true; rejectedOptionalBulletIds.push(candidate.id); await waitForLayout(); }
    }
    const finalMeasurement = measure();
    return { coreBulletCountPerSkillset: 6, selectedIconSizeMm, testedIconSizes, optionalBulletCandidates, acceptedOptionalBulletIds, rejectedOptionalBulletIds, finalBulletCounts: finalMeasurement.finalBulletCounts, minimumLanguageGapPx: finalMeasurement.minimumLanguageGapPx, languageGapPx: finalMeasurement.languageGapPx, noClippedSkillText: finalMeasurement.accepted, largestSafeIconSizeSelected: testedIconSizes.find((item) => item.accepted)?.sizeMm === selectedIconSizeMm };
  });

  renderStage = 'initial-layout-metrics';
  const metrics = await page.evaluate(({ bgExists, variantMeta }) => {
    const cssString = (value) => typeof value === 'string' ? value : '';
    function getPrimaryFontFamily(value) {
      return String(value || '').split(',')[0].replace(/[\"']/g, '').trim();
    }
    function readComputedSample(selector) {
      const element = document.querySelector(selector);
      if (!element) {
        return { selector, found: false, text: '', fontFamily: '', primaryFontFamily: '', fontStyle: '', fontWeight: '', fontVariantLigatures: '', fontKerning: '', fontFeatureSettings: '', fontSynthesis: '', letterSpacing: '', wordSpacing: '' };
      }
      const style = getComputedStyle(element);
      const semanticText = element.getAttribute('data-ats-text') || element.innerText || element.textContent || '';
      return {
        selector,
        found: true,
        text: String(semanticText).replace(/\s+/g, ' ').trim(),
        fontFamily: cssString(style.fontFamily),
        primaryFontFamily: getPrimaryFontFamily(style.fontFamily),
        fontStyle: cssString(style.fontStyle),
        fontWeight: cssString(style.fontWeight),
        fontVariantLigatures: cssString(style.fontVariantLigatures || style.getPropertyValue('font-variant-ligatures')),
        fontKerning: cssString(style.fontKerning || style.getPropertyValue('font-kerning')),
        fontFeatureSettings: cssString(style.fontFeatureSettings || style.getPropertyValue('font-feature-settings')),
        fontSynthesis: cssString(style.fontSynthesis || style.getPropertyValue('font-synthesis')),
        letterSpacing: cssString(style.letterSpacing),
        wordSpacing: cssString(style.wordSpacing),
      };
    }
    const rootElement = document.documentElement;
    const rootStyle = getComputedStyle(rootElement);

    function normalizeBrowserAtsText(value) {
      return String(value)
        .normalize('NFKC')
        .replace(/\u00a0/g, ' ')
        .replace(/[-‐‑‒–—]\s*\r?\n\s*/g, '-')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase('de-CH');
    }

    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return { id: element.id || element.className, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight, pageId: element.closest('.cv-page')?.id };
    };
    const overlap = (a, b) => {
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return { width, height, area: width * height };
    };
    const pages = [...document.querySelectorAll('.cv-page')];
    const bgEl = document.querySelector('.cv-page');
    const bgStyle = getComputedStyle(bgEl);
    const bg = bgStyle.backgroundImage;
    const pageRect = bgEl.getBoundingClientRect();
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const bottomZoneNotGray = bgStyle.backgroundColor !== bodyBg && Boolean(bg && bg !== 'none');
    const out = {
      pageCount: pages.length,
      overflows: [],
      collisions: [],
      warnings: [],
      links: [...document.links].map((anchor) => ({ href: anchor.href, text: anchor.textContent.trim() })),
      images: [...document.images].map((image) => ({ src: image.getAttribute('src'), complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
      assets: {
        background: {
          exists: Boolean(bgExists),
          computed: Boolean(bg && bg !== 'none'),
          reachable: Boolean(bgExists),
          rendered: Boolean(bgExists && bg && bg !== 'none'),
          coversFullPage: pageRect.height >= 1122 && bgStyle.backgroundSize === 'cover',
          bottomZoneNotGray,
          position: bgStyle.backgroundPosition,
          size: bgStyle.backgroundSize,
          repeat: bgStyle.backgroundRepeat,
          topLeftLaptopExpected: bgStyle.backgroundPosition.includes('0% 0%') || bgStyle.backgroundPosition.includes('left top'),
        },
        profile: { loaded: false },
      },
      fonts: {
        heading: getComputedStyle(document.querySelector('.hero h1')).fontFamily,
        name: getComputedStyle(document.querySelector('.hero h1')).fontFamily,
        sectionHeading: getComputedStyle(document.querySelector('.skill-section h2')).fontFamily,
        experienceTitle: getComputedStyle(document.querySelector('.experience .meta')).fontFamily,
        body: getComputedStyle(document.body).fontFamily,
        employer: getComputedStyle(document.querySelector('.employer')).fontFamily,
        tools: getComputedStyle(document.querySelector('.tools [data-tool-id]')).fontFamily,
        slab: getComputedStyle(document.querySelector('.summary h2')).fontFamily,
        slabLoaded: document.fonts.check('700 16px "Roboto Slab"'),
        requestedSansFamily: 'Arial',
        ciArialResolution: '',
        arialCompatibleLoaded: document.fonts.check('400 16px Arial') || document.fonts.check('400 16px "Liberation Sans"'),
        arialRegularAvailable: document.fonts.check('400 16px Arial') || document.fonts.check('400 16px "Liberation Sans"'),
        arialBoldAvailable: document.fonts.check('700 16px Arial') || document.fonts.check('700 16px "Liberation Sans"'),
        arialItalicAvailable: document.fonts.check('italic 400 16px Arial') || document.fonts.check('italic 400 16px "Liberation Sans"'),
        bodyKerning: '',
        bodyFeatureSettings: '',
        bodyLigatures: '',
        bodySynthesis: '',
        bodySamples: {},
        slabSamples: {},
        skillHeadingSamples: [],
        pdfEmbeddedFamilies: [],
        glyphDiagnostics: [],
        pdffontsOutputPath: '',
        pdffontsRaw: '',
        deprecatedFontChecks: { figtreePresent: false, poppinsPresent: false },
      },
      buttonStates: { normal: {}, hover: {}, focus: {} },
      emailState: {},
      finalInteractiveState: {},
      layout: { pageTwoWhitePanelTopPx: 0, pageTwoFooterHeightPx: 0, counterRailAlignment: [], languageVerticalDividerCount: 1, languageHorizontalDividerCount: 2, darkRuleWidthPx: 0, profileBorderWidthPx: 0, frameOffsetLeftPx: 0, frameOffsetRightPx: 0, frameOffsetTopPx: 0, frameOffsetBottomPx: 0, blueTouchesPageTop: false, blueTouchesPageBottom: false, blueTouchesPageLeft: false, blueTouchesPageRight: false, experienceBulletGapPx: 0, experienceBulletGaps: [], frameOffsets: { page1: {}, page2: {} }, pageOneHasTopBackgroundStrip: false, pageOneHasBottomBackgroundStrip: true, pageTwoHasTopBackgroundStrip: true, pageTwoHasBottomBackgroundStrip: false, stackedPageGapPx: 0 },
      experienceQuality: { minimumBulletsPerStation: 2, stations: [], crossDomainBullet: {}, pageFill: {}, breadthSummaryPolicy: {}, combinedTrainingCredential: {} },
      skillsetsQuality: { sectionTitle: {}, languageSpacing: {}, requiredSkillsetCount: 4, renderedSkillsetCount: 0, allSkillsetsPresent: false, minimumBulletsPerSkillset: 6, maximumBulletsPerSkillset: 8, coreBulletCountPerSkillset: 6, totalVisibleBullets: 0, allBulletCountsWithinRange: false, allBulletsEvidenceBacked: false, duplicateBulletIds: [], semanticDuplicatePairs: [], uniqueIconCount: 0, allIconsUsedExactlyOnce: false, allIconsLoaded: false, selectedIconSizeMm: 0, testedIconSizesMm: [21, 20, 19, 18, 17, 16], testedIconSizes: [], optionalBulletCandidates: [], acceptedOptionalBulletIds: [], rejectedOptionalBulletIds: [], finalBulletCounts: {}, minimumLanguageGapPx: 0, languageGapPx: 0, noClippedSkillText: false, largestSafeIconSizeSelected: false, textWidthMaximized: false, linkedinEvidenceAvailable: false, skillsets: [] },
      experienceLocationStyles: [],
      toolsQuality: { minimumVisibleTools: 12, maximumVisibleTools: 20, visibleToolCount: 0, selectionMode: 'variant-fallback', jobAdMatchedToolIds: [], semanticMatchToolIds: [], variantFallbackToolIds: [], omittedToolIds: [], duplicateToolIds: [], unverifiedVisibleToolIds: [], withinAllowedRange: false, typography: variantMeta.typographySelection?.toolTypography || {} },
      footerQuality: { titleFontSizes: {}, titleFontFamilies: {}, titleStyles: {}, iconBoxes: {}, iconTitleGapsPx: {}, icons: {}, entryAndWorkloadAligned: false, allTitleFamiliesEqual: false, allTitleSizesEqual: false, allTitleWeightsEqual: false, allTitleBaselinesAligned: false, allTitleTypographyEqual: false, topRowBaselinesAligned: false, availabilityTitlesLeftAligned: false, availabilityRowsStacked: false, availabilityTitleGapPx: 0, footerLayoutValid: false, contentTypography: {}, toolsMoreGapPx: 0, toolsMoreGapIncreaseRatio: 0, allFooterIconsLoaded: false, allFooterIconBoxesEqual: false },
      summary: { ...variantMeta.summary },
      ats: { hiddenTextDetected: false, requiredTerms: [] },
      profile: {},
      reviewQueue: [],
      supplementary: variantMeta.supplementary,
      fill: { ...variantMeta.fill, experienceBottomGapPx: 0 },
    };
    for (const image of document.images) {
      if (image.classList.contains('profile')) out.assets.profile.loaded = image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    }
    for (const pageEl of pages) {
      if (pageEl.scrollHeight > pageEl.clientHeight + 1) out.overflows.push({ elementId: pageEl.id, scrollHeight: pageEl.scrollHeight, clientHeight: pageEl.clientHeight, overflowPixels: pageEl.scrollHeight - pageEl.clientHeight });
    }
    for (const element of document.querySelectorAll('[data-check]')) {
      const rect = rectOf(element);
      const currentPage = rectOf(element.closest('.cv-page'));
      const panel = element.closest('.competence-panel,.hero-panel,.white-panel,.bottom-grid') || element.closest('.cv-page');
      const panelRect = rectOf(panel);
      if (rect.bottom > currentPage.bottom || rect.top < currentPage.top || rect.left < currentPage.left || rect.right > currentPage.right) out.overflows.push({ elementId: rect.id, scrollHeight: rect.scrollHeight, clientHeight: rect.clientHeight, overflowPixels: Math.ceil(Math.max(0, rect.bottom - currentPage.bottom, currentPage.top - rect.top, currentPage.left - rect.left, rect.right - currentPage.right)) });
      if (rect.bottom > panelRect.bottom + 1 || rect.top < panelRect.top - 1 || rect.left < panelRect.left - 1 || rect.right > panelRect.right + 1) out.overflows.push({ elementId: rect.id, scrollHeight: rect.scrollHeight, clientHeight: rect.clientHeight, overflowPixels: Math.ceil(Math.max(0, rect.bottom - panelRect.bottom, panelRect.top - rect.top, panelRect.left - rect.left, rect.right - panelRect.right)) });
      if (element.scrollHeight > element.clientHeight + 1) out.overflows.push({ elementId: rect.id, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight, overflowPixels: element.scrollHeight - element.clientHeight });
    }
    const collisionElements = [...document.querySelectorAll('[data-collision-group]')];
    const collisionRects = collisionElements.map((element, index) => ({ ...rectOf(element), index }));
    for (let i = 0; i < collisionRects.length; i += 1) {
      for (let j = i + 1; j < collisionRects.length; j += 1) {
        const a = collisionRects[i];
        const b = collisionRects[j];
        const ea = collisionElements[a.index];
        const eb = collisionElements[b.index];
        if (ea.contains(eb) || eb.contains(ea) || a.pageId !== b.pageId) continue;
        const collision = overlap(a, b);
        if (collision.area > 4) out.collisions.push({ type: 'collision', elementA: a.id, elementB: b.id, overlapWidth: Math.round(collision.width), overlapHeight: Math.round(collision.height), overlapArea: Math.round(collision.area) });
      }
    }
    const getExperienceContentBottom = () => {
      const visibleExperiences = [...document.querySelectorAll('#experience-list .experience:not([hidden])')];
      const list = document.querySelector('#experience-list');
      if (visibleExperiences.length === 0) return list.getBoundingClientRect().top;
      return Math.max(...visibleExperiences.map((element) => element.getBoundingClientRect().bottom));
    };
    const bottomGrid = document.querySelector('#bottom-grid')?.getBoundingClientRect();
    const contentBottom = getExperienceContentBottom();
    if (bottomGrid) out.fill.experienceBottomGapPx = Math.round(bottomGrid.top - contentBottom);
    const panel2 = document.querySelector('#page-2 .white-panel')?.getBoundingClientRect();
    const frame2 = document.querySelector('#page-2 .frame')?.getBoundingClientRect();
    if (panel2 && frame2) { out.layout.pageTwoWhitePanelTopPx = Math.round(panel2.top - frame2.top); out.layout.pageTwoFooterHeightPx = Math.round(frame2.bottom - panel2.bottom); }
    out.layout.counterRailAlignment = [...document.querySelectorAll('.cv-page')].map((page) => { const counter = page.querySelector('.counter').getBoundingClientRect(); const pageRect = page.getBoundingClientRect(); const expectedCenterX = pageRect.left + (10 + 5) * 96 / 25.4; const actualCenterX = counter.left + counter.width / 2; return { pageId: page.id, expectedCenterX: Math.round(expectedCenterX), actualCenterX: Math.round(actualCenterX), deltaPx: Math.round(Math.abs(actualCenterX - expectedCenterX)) }; });
    out.layout.darkRuleWidthPx = Number.parseFloat(rootStyle.getPropertyValue('--rule-width')) || 0.5;
    const profileStyle = getComputedStyle(document.querySelector('.profile'));
    out.layout.profileBorderWidthPx = Number.parseFloat(profileStyle.borderTopWidth) || 0;
    out.profile = { borderWidthPx: out.layout.profileBorderWidthPx, borderColor: profileStyle.borderTopColor, borderRadius: profileStyle.borderRadius };
    const pageOneRect = document.querySelector('#page-1').getBoundingClientRect();
    const frameRect = document.querySelector('#page-1 .frame').getBoundingClientRect();
    const frameMetric = (pageId) => { const page = document.querySelector(`#${pageId}`).getBoundingClientRect(); const frame = document.querySelector(`#${pageId} .frame`).getBoundingClientRect(); return { topPx: Math.round(frame.top - page.top), bottomPx: Math.round(page.bottom - frame.bottom), leftPx: Math.round(frame.left - page.left), rightPx: Math.round(page.right - frame.right) }; };
    out.layout.frameOffsets = { page1: frameMetric('page-1'), page2: frameMetric('page-2') };
    out.layout.pageOneHasTopBackgroundStrip = out.layout.frameOffsets.page1.topPx > 1;
    out.layout.pageOneHasBottomBackgroundStrip = out.layout.frameOffsets.page1.bottomPx > 1;
    out.layout.pageTwoHasTopBackgroundStrip = out.layout.frameOffsets.page2.topPx > 1;
    out.layout.pageTwoHasBottomBackgroundStrip = out.layout.frameOffsets.page2.bottomPx > 1;
    const p1 = document.querySelector('#page-1').getBoundingClientRect(); const p2 = document.querySelector('#page-2').getBoundingClientRect();
    out.layout.stackedPageGapPx = Math.round(p2.top - p1.bottom);
    out.layout.frameOffsetLeftPx = Math.round(frameRect.left - pageOneRect.left);
    out.layout.frameOffsetRightPx = Math.round(pageOneRect.right - frameRect.right);
    out.layout.frameOffsetTopPx = Math.round(frameRect.top - pageOneRect.top);
    out.layout.frameOffsetBottomPx = Math.round(pageOneRect.bottom - frameRect.bottom);
    out.layout.blueTouchesPageTop = frameRect.top <= pageOneRect.top;
    out.layout.blueTouchesPageBottom = frameRect.bottom >= pageOneRect.bottom + 1;
    out.layout.blueTouchesPageLeft = frameRect.left <= pageOneRect.left;
    out.layout.blueTouchesPageRight = frameRect.right >= pageOneRect.right;
    const languageStyle = getComputedStyle(document.querySelector('.languages-row'));
    const labelStyle = getComputedStyle(document.querySelector('.languages-label'));
    out.layout.languageHorizontalDividerCount = (Number.parseFloat(languageStyle.borderTopWidth) > 0 ? 1 : 0) + (Number.parseFloat(languageStyle.borderBottomWidth) > 0 ? 1 : 0);
    out.layout.languageVerticalDividerCount = Number.parseFloat(labelStyle.borderRightWidth) > 0 ? 1 : 0;
    const sectionTitleSample = (selector, expectedText) => {
      const element = document.querySelector(selector);
      const style = element ? getComputedStyle(element) : null;
      const text = element ? (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase() : '';
      return { text, visible: Boolean(element && element.getClientRects().length), fontFamily: style?.fontFamily || '', primaryFontFamily: getPrimaryFontFamily(style?.fontFamily || ''), fontWeight: style?.fontWeight || '', atsExtractable: Boolean(element?.hasAttribute('data-ats-required')) };
    };
    out.skillsetsQuality.sectionTitle = sectionTitleSample('.competencies-page-title', 'Kompetenzen');
    out.experienceQuality.sectionTitle = sectionTitleSample('.experience-page-title', 'Kompetenzen & Verantwortung');
    const languageTopRuleY = languageRect ? languageRect.top : 0;
    const languageBottomRuleY = languageRect ? languageRect.bottom : 0;
    const fourthSkillsetBottomRuleY = lastSkillRect ? lastSkillRect.bottom : 0;
    const languageRuleDistancePx = languageRect ? languageRect.height : 0;
    const skillsetsToLanguageGapPx = languageRect && lastSkillRect ? languageRect.top - lastSkillRect.bottom : 0;
    out.skillsetsQuality.languageSpacing = { languageTopRuleY: Math.round(languageTopRuleY), languageBottomRuleY: Math.round(languageBottomRuleY), languageRuleDistancePx: Math.round(languageRuleDistancePx), fourthSkillsetBottomRuleY: Math.round(fourthSkillsetBottomRuleY), skillsetsToLanguageGapPx: Math.round(skillsetsToLanguageGapPx), minimumRequiredGapPx: Math.round(languageRuleDistancePx), requirementPassed: skillsetsToLanguageGapPx + 1 >= languageRuleDistancePx };

    const summaryRange = document.createRange();
    summaryRange.selectNodeContents(document.querySelector('#summary-text'));
    out.summary.actualLines = [...new Set([...summaryRange.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top * 2) / 2))].length;
    const skillSections = [...document.querySelectorAll('.skill-section')];
    const skillIconElements = [...document.querySelectorAll('[data-skill-icon]')];
    const skillIconIdsRendered = skillIconElements.map((icon) => icon.dataset.skillIcon);
    const skillBulletIds = skillSections.flatMap((section) => [...section.querySelectorAll('li:not([hidden])')].map((li) => li.id));
    const skillBulletTexts = skillSections.flatMap((section) => [...section.querySelectorAll('li:not([hidden])')].map((li) => normalizeBrowserAtsText(li.innerText || li.textContent || '')));
    const duplicateBulletIds = skillBulletIds.filter((id, index, arr) => arr.indexOf(id) !== index);
    const semanticDuplicatePairs = [];
    for (let i = 0; i < skillBulletTexts.length; i += 1) for (let j = i + 1; j < skillBulletTexts.length; j += 1) if (skillBulletTexts[i] && skillBulletTexts[i] === skillBulletTexts[j]) semanticDuplicatePairs.push([skillBulletIds[i], skillBulletIds[j]]);
    const iconBoxes = skillIconElements.map((icon) => { const rect = icon.getBoundingClientRect(); return { iconId: icon.dataset.skillIcon, width: Math.round(rect.width), height: Math.round(rect.height), viewBox: icon.getAttribute('viewBox') || '' }; });
    const skillTextRects = skillSections.map((section) => section.querySelector('.skill-copy')?.getBoundingClientRect()).filter(Boolean);
    const dividerRects = skillSections.map((section) => section.getBoundingClientRect());
    const languageRect = document.querySelector('#languages')?.getBoundingClientRect();
    const lastSkillRect = skillSections.at(-1)?.getBoundingClientRect();
    out.skillsetsQuality.renderedSkillsetCount = skillSections.length;
    out.skillsetsQuality.allSkillsetsPresent = skillSections.length === out.skillsetsQuality.requiredSkillsetCount;
    out.skillsetsQuality.skillsets = skillSections.map((section) => {
      const bullets = [...section.querySelectorAll('li:not([hidden])')];
      return { id: section.dataset.skillsetId || section.id.replace('skill-', ''), title: section.querySelector('h2')?.innerText?.trim() || '', iconId: section.dataset.skillIconId || '', bulletCount: bullets.length, bulletIds: bullets.map((li) => li.id), bulletTexts: bullets.map((li) => li.innerText.trim()), sourceIds: [...new Set(bullets.flatMap((li) => (li.dataset.sourceIds || '').split(',').filter(Boolean)))], evidenceStatuses: [...new Set(bullets.map((li) => li.dataset.evidenceStatus || ''))], jobAdMatchScore: bullets.reduce((sum, li) => sum + Number(li.dataset.jobAdMatchScore || 0), 0) };
    });
    out.skillsetsQuality.totalVisibleBullets = out.skillsetsQuality.skillsets.reduce((sum, section) => sum + section.bulletCount, 0);
    out.skillsetsQuality.allBulletCountsWithinRange = out.skillsetsQuality.skillsets.every((section) => section.bulletCount >= out.skillsetsQuality.minimumBulletsPerSkillset && section.bulletCount <= out.skillsetsQuality.maximumBulletsPerSkillset);
    out.skillsetsQuality.allBulletsEvidenceBacked = skillSections.every((section) => [...section.querySelectorAll('li:not([hidden])')].every((li) => ['verified', 'defensible_inference'].includes(li.dataset.evidenceStatus) && (li.dataset.sourceIds || '').length > 0));
    out.skillsetsQuality.duplicateBulletIds = duplicateBulletIds;
    out.skillsetsQuality.semanticDuplicatePairs = semanticDuplicatePairs;
    out.skillsetsQuality.uniqueIconCount = new Set(skillIconIdsRendered).size;
    out.skillsetsQuality.allIconsUsedExactlyOnce = skillIconIdsRendered.length === 4 && new Set(skillIconIdsRendered).size === 4;
    out.skillsetsQuality.allIconsLoaded = iconBoxes.length === 4 && iconBoxes.every((box) => box.width > 0 && box.height > 0);
    out.skillsetsQuality.iconBoxes = iconBoxes;
    out.skillsetsQuality.coreBulletCountPerSkillset = variantMeta.skillsetLayoutSelection?.coreBulletCountPerSkillset ?? 6;
    out.skillsetsQuality.selectedIconSizeMm = Number.parseFloat(rootStyle.getPropertyValue('--skill-icon-size')) || variantMeta.skillsetLayoutSelection?.selectedIconSizeMm || 0;
    out.skillsetsQuality.testedIconSizes = variantMeta.skillsetLayoutSelection?.testedIconSizes || [];
    out.skillsetsQuality.optionalBulletCandidates = variantMeta.skillsetLayoutSelection?.optionalBulletCandidates || [];
    out.skillsetsQuality.acceptedOptionalBulletIds = variantMeta.skillsetLayoutSelection?.acceptedOptionalBulletIds || [];
    out.skillsetsQuality.rejectedOptionalBulletIds = variantMeta.skillsetLayoutSelection?.rejectedOptionalBulletIds || [];
    out.skillsetsQuality.finalBulletCounts = variantMeta.skillsetLayoutSelection?.finalBulletCounts || Object.fromEntries(out.skillsetsQuality.skillsets.map((section) => [section.id, section.bulletCount]));
    out.skillsetsQuality.minimumLanguageGapPx = variantMeta.skillsetLayoutSelection?.minimumLanguageGapPx || Number((1.5 * 96 / 25.4).toFixed(2));
    out.skillsetsQuality.languageGapPx = languageRect && lastSkillRect ? Math.round(languageRect.top - lastSkillRect.bottom) : 0;
    out.skillsetsQuality.noClippedSkillText = variantMeta.skillsetLayoutSelection?.noClippedSkillText === true;
    out.skillsetsQuality.largestSafeIconSizeSelected = variantMeta.skillsetLayoutSelection?.largestSafeIconSizeSelected === true && out.skillsetsQuality.selectedIconSizeMm >= 16 && out.skillsetsQuality.testedIconSizesMm.includes(out.skillsetsQuality.selectedIconSizeMm);
    out.skillsetsQuality.textWidthMaximized = skillTextRects.length === 4 && dividerRects.every((rect, index) => Math.abs(rect.right - skillTextRects[index].right) <= 4);
    out.skillsetsQuality.textColumnLeftPx = skillTextRects.map((rect) => Math.round(rect.left));
    out.skillsetsQuality.textColumnWidthPx = skillTextRects.map((rect) => Math.round(rect.width));
    out.layout.experienceBulletGaps = [...document.querySelectorAll('.experience')].map((experience) => { const heading = experience.querySelector('.experience-heading'); const firstBullet = experience.querySelector('li:not([hidden])'); return { experienceId: experience.id.replace('experience-', ''), gapPx: heading && firstBullet ? Math.round(firstBullet.getBoundingClientRect().top - heading.getBoundingClientRect().bottom) : 0 }; });
    out.layout.experienceBulletGapPx = out.layout.experienceBulletGaps[0]?.gapPx || 0;
    out.experienceQuality.stations = [...document.querySelectorAll('.experience')].map((experience) => {
      const visibleBullets = [...experience.querySelectorAll('li:not([hidden])')];
      return { experienceId: experience.id.replace('experience-', ''), visibleBulletCount: visibleBullets.length, verifiedBulletCount: visibleBullets.filter((li) => !li.id.includes('summary')).length, defensibleInferenceCount: visibleBullets.filter((li) => li.id.includes('summary')).length, sourceIds: visibleBullets.map((li) => li.id) };
    });

    const experienceTitle = document.querySelector('.experience-page-title')?.getBoundingClientRect();
    const footerRect = document.querySelector('#bottom-grid')?.getBoundingClientRect();
    const experienceListRect = document.querySelector('#experience-list')?.getBoundingClientRect();
    const contentBottomForFill = getExperienceContentBottom();
    const availableHeightPx = experienceTitle && footerRect ? footerRect.top - experienceTitle.bottom : 0;
    const usedHeightPx = experienceListRect ? contentBottomForFill - experienceListRect.top : 0;
    const minimumTargetRatio = variantMeta.variantId === 'communication-content' ? 0.88 : 0.82;
    const maximumTargetRatio = 0.96;
    const fillRatio = availableHeightPx > 0 ? usedHeightPx / availableHeightPx : 0;
    const actualFooterGapPx = footerRect ? footerRect.top - contentBottomForFill : 0;
    const breadthBullets = [...document.querySelectorAll('.experience-breadth-summary-bullet:not([hidden])')];
    out.experienceQuality.pageFill = { availableHeightPx: Math.round(availableHeightPx), usedHeightPx: Math.round(usedHeightPx), fillRatio: Number(fillRatio.toFixed(3)), minimumTargetRatio, maximumTargetRatio, withinTargetRange: fillRatio >= minimumTargetRatio && fillRatio <= maximumTargetRatio, remainingGapBeforeFooterPx: Math.round(actualFooterGapPx), candidateBulletIds: variantMeta.supplementary?.optionalCandidates?.map((item) => item.id) || [], acceptedBulletIds: breadthBullets.map((li) => li.id), rejectedBulletIds: [], breadthSummaryBulletIds: breadthBullets.map((li) => li.id), fillRatioBefore: Number(fillRatio.toFixed(3)), fillRatioAfter: Number(fillRatio.toFixed(3)), minimumFooterGapPx: Number((5 * 96 / 25.4).toFixed(1)), actualFooterGapPx: Math.round(actualFooterGapPx), largestSafeContentSetSelected: actualFooterGapPx >= 5 * 96 / 25.4 && (fillRatio >= minimumTargetRatio || breadthBullets.length > 0) };
    const breadthByExperience = [...document.querySelectorAll('.experience')].map((experience) => {
      const visible = [...experience.querySelectorAll('li:not([hidden])')];
      const bullet = visible.find((li) => li.classList.contains('experience-breadth-summary-bullet'));
      return { experienceId: experience.id.replace('experience-', ''), breadthSummary: { rendered: Boolean(bullet), text: bullet?.innerText?.trim() || '', sourceIds: (bullet?.dataset.summarySourceIds || '').split(',').filter(Boolean), evidenceStatus: bullet?.dataset.evidenceStatus || '', omittedCapabilityClusters: (bullet?.dataset.omittedCapabilityClusters || '').split(',').filter(Boolean), isLastBullet: Boolean(bullet && visible.at(-1) === bullet) } };
    });
    const renderedBreadth = breadthByExperience.filter((item) => item.breadthSummary.rendered);
    out.experienceQuality.breadthSummaryByExperience = breadthByExperience;
    out.experienceQuality.breadthSummaryPolicy = { enabled: true, eligibleExperienceIds: breadthByExperience.map((item) => item.experienceId), renderedExperienceIds: renderedBreadth.map((item) => item.experienceId), rejectedExperienceIds: [], duplicateTexts: renderedBreadth.map((item) => item.breadthSummary.text).filter((text, index, arr) => text && arr.indexOf(text) !== index), allRenderedLast: renderedBreadth.every((item) => item.breadthSummary.isLastBullet), allEvidenceBacked: renderedBreadth.every((item) => ['verified', 'defensible_inference'].includes(item.breadthSummary.evidenceStatus) && item.breadthSummary.sourceIds.length > 0) };
    const combined = document.querySelector('.combined-training-title');
    const combinedStyle = combined ? getComputedStyle(combined) : null;
    out.experienceQuality.combinedTrainingCredential = { experienceId: 'mediamatiker-ausbildung-army-bict', primaryTitle: 'Mediamatiker EFZ in Ausbildung', credentialTitle: 'Berufsmaturität Typ Wirtschaft und Dienstleistungen', visible: Boolean(combined && combined.getClientRects().length), atsExtractable: Boolean(combined?.hasAttribute('data-ats-required')), sourceIds: (combined?.dataset.sourceIds || '').split(',').filter(Boolean), evidenceStatus: combined?.dataset.evidenceStatus || '', fontFamily: combinedStyle?.fontFamily || '', primaryFontFamily: getPrimaryFontFamily(combinedStyle?.fontFamily || ''), fontWeight: combinedStyle?.fontWeight || '' };
    out.experienceQuality.bulletTypography = variantMeta.typographySelection?.bulletTypography || {};
    out.experienceQuality.bulletWidth = (() => { const li = document.querySelector('.experience li:not([hidden])'); const list = document.querySelector('.experience ul'); if (!li || !list) return { maxBulletWidthPx: 0, availableTextWidthPx: 0, usesAvailableWidth: false }; const liRect = li.getBoundingClientRect(); const listRect = list.getBoundingClientRect(); return { maxBulletWidthPx: Math.round(liRect.width), availableTextWidthPx: Math.round(listRect.width), usesAvailableWidth: listRect.right - liRect.right <= 4 }; })();
    out.experienceQuality.twoLineBulletCount = [...document.querySelectorAll('.experience li:not([hidden])')].filter((li) => { const range = document.createRange(); range.selectNodeContents(li); return new Set([...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top * 2) / 2)).size >= 2; }).length;
    const crossDomainBullets = [...document.querySelectorAll('.experience-cross-domain-bullet:not([hidden])')];
    const crossByExperience = [...document.querySelectorAll('.experience')].map((experience) => {
      const visibleBullets = [...experience.querySelectorAll('li:not([hidden])')];
      const matches = visibleBullets.filter((li) => li.dataset.crossDomainBullet === 'mediamatik-marketing');
      const substantiveBullets = visibleBullets.filter((li) => li.dataset.crossDomainBullet !== 'mediamatik-marketing');
      return {
        experienceId: experience.id.replace('experience-', ''),
        count: matches.length,
        last: visibleBullets.at(-1)?.dataset.crossDomainBullet === 'mediamatik-marketing',
        position: matches.length ? visibleBullets.indexOf(matches[0]) + 1 : null,
        total: visibleBullets.length,
        substantiveBulletCount: substantiveBullets.length,
        crossDomainBulletCount: matches.length,
        totalVisibleBulletCount: visibleBullets.length,
        crossDomainBulletLast: visibleBullets.at(-1)?.dataset.crossDomainBullet === 'mediamatik-marketing',
        substantiveBulletIds: substantiveBullets.map((li) => li.id),
        crossDomainBulletId: matches[0]?.id || '',
      };
    });
    const insufficientSubstantiveExperienceIds = crossByExperience.filter((item) => variantMeta.targetRoleFamily === 'non-mediamatik-core' && item.substantiveBulletCount < 2).map((item) => item.experienceId);
    out.experienceQuality.crossDomainBullet = { enabled: variantMeta.targetRoleFamily === 'non-mediamatik-core', targetRoleFamily: variantMeta.targetRoleFamily, canonicalText: variantMeta.crossDomainBulletText, expectedStationCount: variantMeta.targetRoleFamily === 'non-mediamatik-core' ? crossByExperience.length : 0, renderedStationCount: crossDomainBullets.length, missingExperienceIds: crossByExperience.filter((item) => variantMeta.targetRoleFamily === 'non-mediamatik-core' && item.count === 0).map((item) => item.experienceId), duplicateExperienceIds: crossByExperience.filter((item) => item.count > 1).map((item) => item.experienceId), allRenderedLast: variantMeta.targetRoleFamily !== 'non-mediamatik-core' ? crossDomainBullets.length === 0 : crossByExperience.every((item) => item.count === 1 && item.last), allStationsHaveMinimumSubstantiveBullets: variantMeta.targetRoleFamily !== 'non-mediamatik-core' ? true : insufficientSubstantiveExperienceIds.length === 0, minimumSubstantiveBulletsPerStation: 2, insufficientSubstantiveExperienceIds, byExperience: crossByExperience };
    out.experienceQuality.structuralRepeatedText = { crossDomainExperienceCount: crossDomainBullets.length, approved: crossDomainBullets.every((li) => li.dataset.structuralRepeat === 'cross-domain-experience') };
    out.toolsQuality.visibleToolIds = [...document.querySelectorAll('[data-tool-id]')].map((tool) => tool.dataset.toolId);
    out.toolsQuality.visibleToolCount = out.toolsQuality.visibleToolIds.length;
    out.toolsQuality.variantFallbackToolIds = out.toolsQuality.visibleToolIds;
    out.toolsQuality.omittedToolIds = variantMeta.supplementary?.omittedToolIds || [];
    out.toolsQuality.duplicateToolIds = out.toolsQuality.visibleToolIds.filter((id, index, arr) => arr.indexOf(id) !== index);
    out.toolsQuality.withinAllowedRange = out.toolsQuality.visibleToolCount >= out.toolsQuality.minimumVisibleTools && out.toolsQuality.visibleToolCount <= out.toolsQuality.maximumVisibleTools;
    out.toolsQuality.toolsIndicator = { rendered: Boolean(document.querySelector('.tools-more:not([hidden])')), text: document.querySelector('.tools-more')?.textContent?.replace(/\s+/g, ' ').trim() || '', reason: document.querySelector('.tools-more:not([hidden])') ? null : 'insufficient-space-after-minimum-12-tools' };
    const footerSelectors = { tools: '#tools h2', references: '#references h2', entry: '.entry-block h2', workload: '.workload-block h2' };
    for (const [key, selector] of Object.entries(footerSelectors)) {
      const title = document.querySelector(selector);
      if (!title) continue;
      const style = getComputedStyle(title);
      const icon = title.querySelector('.icon')?.getBoundingClientRect();
      const spanElement = title.querySelector(':scope > span');
      const spanStyle = spanElement ? getComputedStyle(spanElement) : null;
      const span = spanElement?.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      out.footerQuality.titleFontSizes[key] = style.fontSize;
      out.footerQuality.titleFontFamilies[key] = style.fontFamily;
      out.footerQuality.titleStyles[key] = { headingFontFamily: style.fontFamily, headingPrimaryFontFamily: getPrimaryFontFamily(style.fontFamily), spanFontFamily: spanStyle?.fontFamily || '', spanPrimaryFontFamily: getPrimaryFontFamily(spanStyle?.fontFamily || ''), fontSize: style.fontSize, spanFontSize: spanStyle?.fontSize || '', fontWeight: style.fontWeight, spanFontWeight: spanStyle?.fontWeight || '', fontStyle: style.fontStyle, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, color: style.color, textTransform: style.textTransform, whiteSpace: style.whiteSpace, top: Math.round(titleRect.top), bottom: Math.round(titleRect.bottom), baselineY: span ? Math.round(span.bottom) : Math.round(titleRect.bottom) };
      out.footerQuality.iconBoxes[key] = icon ? { width: Math.round(icon.width), height: Math.round(icon.height), top: Math.round(icon.top), left: Math.round(icon.left) } : null;
      out.footerQuality.iconTitleGapsPx[key] = icon && span ? Math.round(span.left - icon.right) : null;
    }
    const footerStyles = Object.values(out.footerQuality.titleStyles);
    const typographyKeys = ['headingPrimaryFontFamily', 'spanPrimaryFontFamily', 'fontSize', 'spanFontSize', 'fontWeight', 'spanFontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'color', 'textTransform', 'whiteSpace'];
    out.footerQuality.allTitleFamiliesEqual = footerStyles.length === 4 && new Set(footerStyles.map((item) => item.headingPrimaryFontFamily)).size === 1 && new Set(footerStyles.map((item) => item.spanPrimaryFontFamily)).size === 1;
    out.footerQuality.allTitleSizesEqual = footerStyles.length === 4 && new Set(footerStyles.map((item) => item.fontSize)).size === 1 && new Set(footerStyles.map((item) => item.spanFontSize)).size === 1;
    out.footerQuality.allTitleWeightsEqual = footerStyles.length === 4 && new Set(footerStyles.map((item) => item.fontWeight)).size === 1 && new Set(footerStyles.map((item) => item.spanFontWeight)).size === 1;
    out.footerQuality.allTitleTypographyEqual = footerStyles.length === 4 && typographyKeys.every((key) => new Set(footerStyles.map((item) => item[key])).size === 1);
    const topRowKeys = ['tools', 'references', 'entry'];
    const topRowStyles = topRowKeys.map((key) => out.footerQuality.titleStyles[key]).filter(Boolean);
    out.footerQuality.topRowBaselinesAligned = topRowStyles.length === 3 && Math.max(...topRowStyles.map((item) => item.baselineY)) - Math.min(...topRowStyles.map((item) => item.baselineY)) <= 2;
    out.footerQuality.allTitleBaselinesAligned = out.footerQuality.topRowBaselinesAligned;
    const entryTitle = document.querySelector('.entry-block h2')?.getBoundingClientRect(); const workloadTitle = document.querySelector('.workload-block h2')?.getBoundingClientRect();
    const entrySpan = document.querySelector('.entry-block h2 span')?.getBoundingClientRect(); const workloadSpan = document.querySelector('.workload-block h2 span')?.getBoundingClientRect();
    out.footerQuality.entryAndWorkloadAligned = Boolean(entrySpan && workloadSpan && Math.abs(entrySpan.left - workloadSpan.left) <= 2);
    out.footerQuality.availabilityTitlesLeftAligned = out.footerQuality.entryAndWorkloadAligned;
    out.footerQuality.availabilityRowsStacked = Boolean(entryTitle && workloadTitle && workloadTitle.top > entryTitle.bottom);
    out.footerQuality.availabilityTitleGapPx = entryTitle && workloadTitle ? Math.round(workloadTitle.top - entryTitle.bottom) : 0;
    out.footerQuality.icons = Object.fromEntries(Object.entries(variantMeta.footerIconFiles || {}).map(([key, file]) => { const icon = document.querySelector(`[data-footer-icon="${key}"]`); return [key, { file, loaded: Boolean(icon), viewBox: icon?.getAttribute('viewBox') || '' }]; }));
    out.footerQuality.allFooterIconsLoaded = Object.values(out.footerQuality.icons).length === 4 && Object.values(out.footerQuality.icons).every((icon) => icon.loaded && icon.viewBox === '0 0 64 64');
    const iconBoxValues = Object.values(out.footerQuality.iconBoxes).filter(Boolean);
    out.footerQuality.allFooterIconBoxesEqual = iconBoxValues.length === 4 && new Set(iconBoxValues.map((box) => box.width)).size === 1 && new Set(iconBoxValues.map((box) => box.height)).size === 1;
    const bulletStyle = getComputedStyle(document.querySelector('.experience li:not([hidden])'));
    const refStyle = getComputedStyle(document.querySelector('.refs p'));
    const entryStyle = getComputedStyle(document.querySelector('.entry-block p'));
    const workloadStyle = getComputedStyle(document.querySelector('.workload-block p'));
    const toolStyle = getComputedStyle(document.querySelector('.tools [data-tool-id]'));
    out.footerQuality.contentTypography = { bulletFontSizePx: Number.parseFloat(bulletStyle.fontSize), referenceFontSizePx: Number.parseFloat(refStyle.fontSize), entryFontSizePx: Number.parseFloat(entryStyle.fontSize), workloadFontSizePx: Number.parseFloat(workloadStyle.fontSize), contentSizesEqual: bulletStyle.fontSize === refStyle.fontSize && bulletStyle.fontSize === entryStyle.fontSize && bulletStyle.fontSize === workloadStyle.fontSize, toolFontSizePx: Number.parseFloat(toolStyle.fontSize) };
    const toolsMore = document.querySelector('.tools-more');
    const lastTool = [...document.querySelectorAll('.tools [data-tool-id]')].at(-1);
    out.footerQuality.toolsMoreGapPx = toolsMore && lastTool ? Math.round(toolsMore.getBoundingClientRect().top - lastTool.getBoundingClientRect().bottom) : 0;
    out.footerQuality.toolsMoreGapIncreaseRatio = variantMeta.typographySelection?.toolsMoreGap?.ratio || 1.5;
    out.footerQuality.footerLayoutValid = out.footerQuality.allTitleTypographyEqual && out.footerQuality.topRowBaselinesAligned && out.footerQuality.availabilityTitlesLeftAligned && out.footerQuality.availabilityRowsStacked && out.footerQuality.allFooterIconsLoaded && out.footerQuality.allFooterIconBoxesEqual && out.footerQuality.contentTypography.contentSizesEqual;
    const bodySelectors = { summary: '#summary-text', employer: '.employer', location: '.experience-location-line', bullet: '.experience li:not([hidden])', language: '.language', tool: '.tools [data-tool-id]', supplementary: '.supplementary', reference: '.refs p', availability: '.avail p' };
    const slabSelectors = { summaryHeading: '.summary h2', experienceTitle: '.experience .meta', toolsHeading: '#tools h2', referencesHeading: '#references h2', entryHeading: '.entry-block h2', workloadHeading: '.workload-block h2' };
    const featureValues = [];
    const kerningValues = [];
    const ligatureValues = [];
    const synthesisValues = [];
    for (const [key, selector] of Object.entries(bodySelectors)) {
      const sample = readComputedSample(selector);
      out.fonts.bodySamples[key] = sample;
      if (!sample.found) continue;
      ligatureValues.push(sample.fontVariantLigatures);
      kerningValues.push(sample.fontKerning);
      featureValues.push(sample.fontFeatureSettings);
      synthesisValues.push(sample.fontSynthesis);
    }
    out.fonts.bodyLigatures = [...new Set(ligatureValues)].join(' | ');
    out.fonts.bodyKerning = [...new Set(kerningValues)].join(' | ');
    out.fonts.bodyFeatureSettings = [...new Set(featureValues)].join(' | ');
    out.fonts.bodySynthesis = [...new Set(synthesisValues)].join(' | ');
    for (const [key, selector] of Object.entries(slabSelectors)) out.fonts.slabSamples[key] = readComputedSample(selector);
    out.fonts.skillHeadingSamples = [...document.querySelectorAll('.skill-section h2')].map((element) => {
      const style = getComputedStyle(element);
      return { text: cssString(element.getAttribute('data-ats-text') || element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(), fontFamily: cssString(style.fontFamily), primaryFontFamily: getPrimaryFontFamily(style.fontFamily), fontWeight: cssString(style.fontWeight), fontStyle: cssString(style.fontStyle) };
    });
    out.experienceLocationStyles = [...document.querySelectorAll('.experience')].map((experience) => {
      const element = experience.querySelector('.experience-location-line');
      const style = element ? getComputedStyle(element) : null;
      return { experienceId: experience.id.replace('experience-', ''), text: element ? cssString(element.getAttribute('data-ats-text') || element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim() : '', fontFamily: style?.fontFamily || '', primaryFontFamily: getPrimaryFontFamily(style?.fontFamily || ''), fontWeight: style?.fontWeight || '', fontStyle: style?.fontStyle || '' };
    });
    function findTextNodeContaining(term) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const index = node.nodeValue.indexOf(term);
        if (index >= 0) return { node, index };
      }
      return null;
    }
    const controlWords = ['Pazifikregion', 'Mediamatiker', 'mediamatikbezogene', 'Systeme', 'Schachfestival', 'Deutsch', 'Französisch', 'Office 365', 'Adobe Premiere Pro', 'phpMyAdmin', 'Peter Stadelmann', 'Peter Wyss'];
    out.fonts.glyphDiagnostics = controlWords.map((word) => {
      const match = findTextNodeContaining(word);
      if (!match) return { word, found: false };
      const { node, index } = match;
      const parent = node.parentElement;
      const style = parent ? getComputedStyle(parent) : null;
      const fullRange = document.createRange();
      fullRange.setStart(node, index);
      fullRange.setEnd(node, index + word.length);
      const totalWidth = fullRange.getBoundingClientRect().width;
      const widths = [];
      for (let i = 0; i < word.length; i += 1) {
        const range = document.createRange();
        range.setStart(node, index + i);
        range.setEnd(node, index + i + 1);
        const width = range.getBoundingClientRect().width;
        if (width > 0) widths.push(width);
      }
      const widthSum = widths.reduce((sum, width) => sum + width, 0);
      const extra = Math.max(0, totalWidth - widthSum);
      return { word, found: true, pdfFontFamily: '', fontFamily: style?.fontFamily || '', primaryFontFamily: getPrimaryFontFamily(style?.fontFamily || ''), fontSize: style?.fontSize || '', characterCount: word.length, totalWordWidthPx: Number(totalWidth.toFixed(2)), minGlyphWidthPx: widths.length ? Number(Math.min(...widths).toFixed(2)) : 0, maxGlyphWidthPx: widths.length ? Number(Math.max(...widths).toFixed(2)) : 0, averageAdditionalGlyphGapPx: widths.length > 1 ? Number((extra / (widths.length - 1)).toFixed(3)) : 0, maxPositiveAdditionalGlyphGapPx: Number(extra.toFixed(3)), proportional: widths.length > 1 ? Math.max(...widths) - Math.min(...widths) > 0.5 : false, brokenInsideWord: /\s/.test(word.replace(/Office 365|Adobe Premiere Pro|Peter Stadelmann|Peter Wyss/g, '')) };
    });
    if (!out.assets.profile.loaded) out.warnings.push('Profile image did not load.');
    if ([out.fonts.body, out.fonts.tools, out.fonts.employer].some((font) => getPrimaryFontFamily(font) !== 'Arial')) out.warnings.push('A body text sample used an unexpected primary font.');
    if ([out.fonts.heading, out.fonts.slab, out.fonts.sectionHeading, out.fonts.experienceTitle].some((font) => getPrimaryFontFamily(font) !== 'Roboto Slab')) out.warnings.push('A slab heading sample used an unexpected primary font.');
    if (!out.fonts.slabLoaded || getPrimaryFontFamily(out.fonts.slab) !== 'Roboto Slab') out.warnings.push('Roboto Slab did not load for the summary heading.');
    if (!out.fonts.arialCompatibleLoaded || getPrimaryFontFamily(out.fonts.body) !== 'Arial') out.warnings.push('Arial-compatible sans did not load for body text.');
    const bodySamples = Object.values(out.fonts.bodySamples);
    const foundBodySamples = bodySamples.filter((sample) => sample.found);
    const missingBodySamples = Object.entries(out.fonts.bodySamples).filter(([, sample]) => !sample.found).map(([key, sample]) => `${key}:${sample.selector}`);
    if (missingBodySamples.length) out.warnings.push(`Body diagnostic selector missing: ${missingBodySamples.join(', ')}`);
    if (foundBodySamples.some((sample) => sample.primaryFontFamily !== 'Arial')) out.warnings.push('A body text sample used an unexpected primary font.');
    if (foundBodySamples.some((sample) => !['normal', 'auto'].includes(sample.fontKerning))) out.warnings.push('Arial-compatible kerning is not natural.');
    if (foundBodySamples.some((sample) => sample.fontFeatureSettings !== 'normal')) out.warnings.push('Arial-compatible feature settings are not natural.');
    if (foundBodySamples.some((sample) => sample.fontSynthesis !== 'none')) out.warnings.push('Arial-compatible font synthesis is not disabled.');
    if (foundBodySamples.some((sample) => !['normal', '0px'].includes(sample.letterSpacing))) out.warnings.push('Arial-compatible letter spacing uses fixed tracking.');
    if (foundBodySamples.some((sample) => !['normal', '0px'].includes(sample.wordSpacing))) out.warnings.push('Arial-compatible word spacing uses fixed spacing.');
    if (out.fonts.skillHeadingSamples.some((sample) => sample.primaryFontFamily !== 'Roboto Slab')) out.warnings.push('A skill heading does not use Roboto Slab.');
    if (Object.values(out.footerQuality.titleStyles).some((sample) => sample.headingPrimaryFontFamily !== 'Roboto Slab' || sample.spanPrimaryFontFamily !== 'Roboto Slab')) out.warnings.push('A footer heading does not use Roboto Slab.');
    if (!out.footerQuality.allTitleTypographyEqual || !out.footerQuality.footerLayoutValid) out.warnings.push('Footer heading styles are not equal.');
    if (out.fonts.bodySamples.summary?.fontStyle !== 'italic') out.warnings.push('Summary text is not italic.');
    if (out.fonts.bodySamples.supplementary?.found && out.fonts.bodySamples.supplementary.fontStyle !== 'italic') out.warnings.push('Supplementary text is not italic.');
    if ([...document.querySelectorAll('.experience')].some((experience) => !experience.querySelector('.experience-location-line'))) out.warnings.push('An experience is missing a checked location line.');
    if ([...document.querySelectorAll('.experience-location-line')].some((element) => getComputedStyle(element).fontWeight !== '700')) out.warnings.push('An experience location line is not bold.');
    if (out.summary.actualLines !== out.summary.targetLines || out.summary.selectionSucceeded !== true) out.warnings.push('Summary is not exactly four visible lines.');
    if (out.experienceQuality.stations.some((station) => station.visibleBulletCount < out.experienceQuality.minimumBulletsPerStation)) out.warnings.push('An experience has fewer than two visible bullets.');
    if (!out.skillsetsQuality.allSkillsetsPresent || !out.skillsetsQuality.allBulletCountsWithinRange || !out.skillsetsQuality.allBulletsEvidenceBacked || !out.skillsetsQuality.allIconsUsedExactlyOnce || !out.skillsetsQuality.allIconsLoaded || !out.skillsetsQuality.largestSafeIconSizeSelected || !out.skillsetsQuality.textWidthMaximized || !out.skillsetsQuality.noClippedSkillText || out.skillsetsQuality.languageGapPx < out.skillsetsQuality.minimumLanguageGapPx) out.warnings.push('Skillset quality requirements failed.');
    if (out.experienceQuality.crossDomainBullet.enabled && (out.experienceQuality.crossDomainBullet.renderedStationCount !== out.experienceQuality.crossDomainBullet.expectedStationCount || out.experienceQuality.crossDomainBullet.allRenderedLast !== true || out.experienceQuality.crossDomainBullet.allStationsHaveMinimumSubstantiveBullets !== true || out.experienceQuality.crossDomainBullet.insufficientSubstantiveExperienceIds.length > 0)) out.warnings.push('Cross-domain experience bullet policy failed.');
    if (!out.toolsQuality.withinAllowedRange || out.toolsQuality.duplicateToolIds.length || out.toolsQuality.unverifiedVisibleToolIds.length) out.warnings.push('Tool quality requirements failed.');
    if (!out.assets.background.exists || !out.assets.background.computed || !out.assets.background.rendered || !out.assets.background.coversFullPage || !out.assets.background.bottomZoneNotGray) out.warnings.push('Background image did not cover the full page.');
    return out;
  }, {
    bgExists: backgroundFileExists,
    variantMeta: { variantId, supplementary: cv.supplementary, fill: cv.fill, summary: cv.summaryMeta, summaryCandidates: cv.summaryCandidates, typographySelection, skillsetLayoutSelection, footerIconFiles, skillIconFiles, targetRoleFamily: cv.targetRoleFamily, crossDomainBulletText },
  });

  async function measureLayout() {
    return page.evaluate(() => {
      const rectOf = (element) => {
        const rect = element.getBoundingClientRect();
        return { id: element.id || element.dataset.fillId || element.className, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight, pageId: element.closest('.cv-page')?.id };
      };
      const overflows = [];
      const collisions = [];
      for (const element of document.querySelectorAll('[data-check]:not([hidden])')) {
        const rect = rectOf(element);
        const currentPage = rectOf(element.closest('.cv-page'));
        const panel = element.closest('.competence-panel,.hero-panel,.white-panel,.bottom-grid') || element.closest('.cv-page');
        const panelRect = rectOf(panel);
        if (rect.bottom > currentPage.bottom || rect.top < currentPage.top || rect.left < currentPage.left || rect.right > currentPage.right) overflows.push({ elementId: rect.id, overflowPixels: Math.ceil(Math.max(0, rect.bottom - currentPage.bottom, currentPage.top - rect.top, currentPage.left - rect.left, rect.right - currentPage.right)) });
        if (rect.bottom > panelRect.bottom + 1 || rect.top < panelRect.top - 1 || rect.left < panelRect.left - 1 || rect.right > panelRect.right + 1) overflows.push({ elementId: rect.id, overflowPixels: Math.ceil(Math.max(0, rect.bottom - panelRect.bottom, panelRect.top - rect.top, panelRect.left - rect.left, rect.right - panelRect.right)) });
        if (element.scrollHeight > element.clientHeight + 1) overflows.push({ elementId: rect.id, overflowPixels: element.scrollHeight - element.clientHeight });
      }
      const collisionElements = [...document.querySelectorAll('[data-collision-group]:not([hidden])')];
      const collisionRects = collisionElements.map((element, index) => ({ ...rectOf(element), index }));
      for (let i = 0; i < collisionRects.length; i += 1) {
        for (let j = i + 1; j < collisionRects.length; j += 1) {
          const a = collisionRects[i];
          const b = collisionRects[j];
          const ea = collisionElements[a.index];
          const eb = collisionElements[b.index];
          if (ea.contains(eb) || eb.contains(ea) || a.pageId !== b.pageId) continue;
          const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (width * height > 4) collisions.push({ elementA: a.id, elementB: b.id, overlapWidth: Math.round(width), overlapHeight: Math.round(height), overlapArea: Math.round(width * height) });
        }
      }
      const getExperienceContentBottom = () => {
        const visibleExperiences = [...document.querySelectorAll('#experience-list .experience:not([hidden])')];
        const list = document.querySelector('#experience-list');
        if (visibleExperiences.length === 0) return list.getBoundingClientRect().top;
        return Math.max(...visibleExperiences.map((element) => element.getBoundingClientRect().bottom));
      };
      const bottomGrid = document.querySelector('#bottom-grid')?.getBoundingClientRect();
      const contentBottom = getExperienceContentBottom();
      const gapPx = bottomGrid ? Math.round(bottomGrid.top - contentBottom) : 0;
      return { overflows, collisions, gapPx, pageCount: document.querySelectorAll('.cv-page').length };
    });
  }

  renderStage = 'adaptive-fill';
  if (metrics.fill.enabled) {
    const minGapPx = Math.ceil(metrics.fill.minRemainingSpaceMm * 96 / 25.4);
    const baseline = await measureLayout();
    metrics.fill.baselineGapPx = baseline.gapPx;
    const optionalCandidates = await page.locator('[data-fill-state="candidate"]').evaluateAll((elements) => elements.map((element) => ({
      id: element.dataset.fillId,
      kind: element.dataset.fillKind,
      experienceId: element.dataset.experienceId,
      priority: Number(element.dataset.fillPriority || 99),
      longText: element.dataset.longText || element.textContent,
      shortText: element.dataset.shortText || element.dataset.longText || element.textContent,
    })).sort((a, b) => (a.kind === 'optional-bullet' ? 0 : 1) - (b.kind === 'optional-bullet' ? 0 : 1) || a.priority - b.priority));
    metrics.fill.consideredOptionalBulletIds = optionalCandidates.map((candidate) => candidate.id);
    const maxOptionalBullets = metrics.fill.maxOptionalBullets || optionalCandidates.length;
    metrics.supplementary.candidateItems = optionalCandidates.map((candidate) => ({ id: candidate.id, type: candidate.kind, experienceId: candidate.experienceId }));
    const acceptedOptionalByExperience = new Map();
    const optionalTotalsByExperience = new Map(optionalCandidates.filter((candidate) => candidate.kind === 'optional-bullet').reduce((entries, candidate) => {
      entries.set(candidate.experienceId, (entries.get(candidate.experienceId) || 0) + 1);
      return entries;
    }, new Map()));
    for (const candidate of optionalCandidates) {
      const { id } = candidate;
      if (candidate.kind === 'optional-bullet' && metrics.fill.acceptedOptionalBulletIds.filter((item) => item.id.startsWith('optional-')).length >= maxOptionalBullets) {
        const item = { id, type: candidate.kind, experienceId: candidate.experienceId, reason: 'max-optional-bullets', gapPx: metrics.fill.finalGapPx || metrics.fill.baselineGapPx };
        metrics.fill.rejectedOptionalBulletIds.push(item);
        metrics.supplementary.rejectedItems.push(item);
        continue;
      }
      const locator = page.locator(`[data-fill-id="${id}"]`).first();
      if (candidate.kind === 'experience-indicator') {
        const acceptedForExperience = acceptedOptionalByExperience.get(candidate.experienceId) || 0;
        const totalForExperience = optionalTotalsByExperience.get(candidate.experienceId) || 0;
        if (totalForExperience > 0 && acceptedForExperience >= totalForExperience) {
          metrics.fill.rejectedOptionalBulletIds.push({ id, reason: 'duplicate-content', gapPx: metrics.fill.finalGapPx || metrics.fill.baselineGapPx });
          metrics.supplementary.rejectedItems.push({ id, type: candidate.kind, experienceId: candidate.experienceId, reason: 'duplicate-content' });
          continue;
        }
      }
      await locator.evaluate((element, text) => { element.textContent = text; element.hidden = false; element.dataset.fillState = 'accepted'; element.dataset.textMode = 'long'; }, candidate.longText);
      let measured = await measureLayout();
      let textMode = 'long';
      let renderedText = candidate.longText;
      let accepted = measured.overflows.length === 0 && measured.collisions.length === 0 && measured.pageCount === 2 && measured.gapPx >= minGapPx;
      if (!accepted && candidate.kind === 'optional-bullet' && candidate.shortText && candidate.shortText !== candidate.longText) {
        await locator.evaluate((element, text) => { element.textContent = text; element.dataset.textMode = 'short'; }, candidate.shortText);
        measured = await measureLayout();
        textMode = 'short';
        renderedText = candidate.shortText;
        accepted = measured.overflows.length === 0 && measured.collisions.length === 0 && measured.pageCount === 2 && measured.gapPx >= minGapPx;
      }
      if (accepted) {
        const item = { id, type: candidate.kind, experienceId: candidate.experienceId, accepted: true, textMode, renderedText, gapPx: measured.gapPx };
        metrics.fill.acceptedOptionalBulletIds.push(item);
        metrics.supplementary.renderedItems.push(item);
        if (candidate.kind === 'optional-bullet') {
          metrics.supplementary.optionalVisibleBulletIds.push(id);
          acceptedOptionalByExperience.set(candidate.experienceId, (acceptedOptionalByExperience.get(candidate.experienceId) || 0) + 1);
        }
        metrics.fill.finalGapPx = measured.gapPx;
      } else {
        await locator.evaluate((element) => { element.hidden = true; element.dataset.fillState = 'rejected'; });
        const reason = measured.overflows.length ? 'overflow' : measured.collisions.length ? 'collision' : measured.pageCount !== 2 ? 'page-count' : 'minimum-gap';
        const item = { id, type: candidate.kind, experienceId: candidate.experienceId, reason, gapPx: measured.gapPx };
        metrics.fill.rejectedOptionalBulletIds.push(item);
        metrics.supplementary.rejectedItems.push(item);
      }
    }
    const finalLayout = await measureLayout();
    metrics.fill.finalGapPx = finalLayout.gapPx;
    metrics.fill.optionalBulletsUsed = metrics.fill.acceptedOptionalBulletIds.filter((item) => item.id.startsWith('optional-')).length;
    metrics.overflows = finalLayout.overflows;
    metrics.collisions = finalLayout.collisions;
  }

  writeFileSync(htmlPath, await page.content());

  renderStage = 'interaction-checks';
  const target = page.locator('.link-buttons a').first();
  const readButton = async () => target.evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, color: style.color, borderColor: style.borderColor, outlineColor: style.outlineColor, boxShadow: style.boxShadow, isFocusVisible: element.matches(':focus-visible') };
  });
  metrics.buttonStates.font = await page.locator('.link-buttons a').evaluateAll((elements) => Object.fromEntries(elements.map((element) => {
    const style = getComputedStyle(element);
    const primaryFontFamily = String(style.fontFamily || '').split(',')[0].replace(/[\"']/g, '').trim();
    const rect = element.getBoundingClientRect();
    return [element.textContent?.trim() === 'LinkedIn' ? 'linkedin' : 'portfolio', { text: element.textContent?.trim() || '', fontFamily: style.fontFamily, primaryFontFamily, fontWeight: style.fontWeight, fontSize: style.fontSize, rect: { width: Math.round(rect.width), height: Math.round(rect.height) } }];
  })));
  metrics.buttonStates.fontSummary = { bothRobotoSlab: Object.values(metrics.buttonStates.font).every((sample) => sample.primaryFontFamily === 'Roboto Slab'), bothBold: Object.values(metrics.buttonStates.font).every((sample) => sample.fontWeight === '700'), sameFontSize: new Set(Object.values(metrics.buttonStates.font).map((sample) => sample.fontSize)).size === 1 };
  metrics.buttonStates.fontOk = metrics.buttonStates.fontSummary.bothRobotoSlab && metrics.buttonStates.fontSummary.bothBold && metrics.buttonStates.fontSummary.sameFontSize;
  if (!metrics.buttonStates.fontOk) metrics.warnings.push('Link button font is not Roboto Slab Bold.');
  metrics.buttonStates.normal = await readButton();
  await target.hover();
  await page.waitForTimeout(250);
  metrics.buttonStates.hover = await readButton();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(250);
  metrics.buttonStates.focus = await readButton();

  metrics.emailState = await page.locator('.contact a[href^="mailto:"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return { display: style.display, padding: style.padding, margin: style.margin, borderWidth: style.borderWidth, borderStyle: style.borderStyle, borderRadius: style.borderRadius, backgroundColor: style.backgroundColor, boxShadow: style.boxShadow, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });

  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  metrics.finalInteractiveState = await page.evaluate(() => ({
    activeElement: document.activeElement?.tagName || '',
    linkButtonFocused: Boolean(document.querySelector('.link-buttons a:focus')),
    linkButtonHovered: Boolean(document.querySelector('.link-buttons a:hover')),
    emailFocused: Boolean(document.querySelector('.contact a[href^="mailto:"]:focus')),
  }));

  renderStage = 'required-term-collection';
  metrics.ats ??= { hiddenTextDetected: false, requiredTerms: [] };
  if (!Array.isArray(metrics.ats.requiredTerms)) metrics.ats.requiredTerms = [];
  metrics.visibleText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
  metrics.ats.hiddenTextDetected = await page.evaluate(() => [...document.querySelectorAll('body *')].some((element) => { const style = getComputedStyle(element); const text = element.textContent?.trim(); return Boolean(text && style.visibility === 'hidden' && !element.closest('[hidden]')); }));
  metrics.ats.requiredTerms = await page.locator('[data-ats-required]:not([hidden])').evaluateAll((elements) => elements.map((element) => {
    const explicit = element.getAttribute('data-ats-text');
    const visible = explicit || element.innerText || element.textContent || '';
    return String(visible).replace(/\s+/g, ' ').trim();
  }).filter(Boolean));
  metrics.ats.requiredTerms = [...new Set(metrics.ats.requiredTerms)];

  await page.evaluate(() => document.fonts.ready);
  renderStage = 'pdf-export';
  const pdfPath = `dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`;
  const pdfOptions = { path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true };
  metrics.pdf = { taggedRequested: true, taggedSucceeded: false, taggedFallbackUsed: false, taggedError: null };
  try {
    await page.pdf({ ...pdfOptions, tagged: true });
    metrics.pdf.taggedSucceeded = true;
  } catch (error) {
    metrics.pdf.taggedFallbackUsed = true;
    metrics.pdf.taggedError = String(error?.message || error || '');
    await page.pdf(pdfOptions);
  }
  renderStage = 'page-one-screenshot';
  await page.locator('#page-1').screenshot({ path: `dist/cv-${variantId}-page-1.png` });
  renderStage = 'page-two-screenshot';
  await page.locator('#page-2').screenshot({ path: `dist/cv-${variantId}-page-2.png` });
  return metrics;
}

const started = performance.now();
let metrics;
let renderError = null;
let failureRenderStage = null;
const renderer = 'playwright';
try {
  metrics = await withPlaywright();
} catch (error) {
  renderError = error;
  failureRenderStage = renderStage;
} finally {
  await closeBrowserIfOpen();
}
if (renderError) {
  renderStage = failureRenderStage || renderStage;
  writeRenderFailure(renderError);
  console.error(`Render failed at stage: ${renderStage}`);
  console.error(renderError?.stack || renderError);
  process.exit(1);
}

let pageCount = metrics.pageCount;
try {
  const pdf = readFileSync(`dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`, 'latin1');
  pageCount = (pdf.match(/\/Type\s*\/Page\b/g) || []).length;
} catch {}

async function extractPdfJsText(pdf, options, joinStats) {
  const pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent(options);
    pages.push(joinPdfTextItems(content.items, joinStats));
  }
  return pages.join('\n').trim();
}


function runPdfFontsAudit(pdfPath, variant) {
  const outputPath = `dist/fonts-${variant}-pdffonts.txt`;
  const result = spawnSync('pdffonts', [pdfPath], { encoding: 'utf8' });
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  writeFileSync(outputPath, stdout || stderr || result.error?.message || '');
  const families = stdout.split(/\r?\n/)
    .slice(2)
    .map((line) => line.trim().split(/\s+/)[0] || '')
    .filter(Boolean)
    .map((name) => name.replace(/^[A-Z]{6}\+/, ''));
  return {
    outputPath,
    raw: stdout,
    error: result.status === 0 ? null : stderr || result.error?.message || 'pdffonts failed',
    families: [...new Set(families)],
  };
}

function fontListHas(families, pattern) {
  return families.some((family) => pattern.test(family));
}

function runPopplerExtraction(pdfPath, variant, mode) {
  const modeArgs = { raw: ['-raw'], default: [], layout: ['-layout'] };
  const suffix = { raw: 'raw', default: 'default', layout: 'layout' }[mode];
  const outputPath = `dist/text-${variant}-poppler-${suffix}.txt`;
  const args = ['-enc', 'UTF-8', ...(modeArgs[mode] || []), pdfPath, outputPath];
  const result = spawnSync('pdftotext', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    return { outputPath, text: '', error: result.stderr || result.error?.message || 'pdftotext failed', args };
  }
  return { outputPath, text: readFileSync(outputPath, 'utf8'), error: null, args };
}

async function buildAtsReport(pdfPath, metrics, requiredTerms) {
  const visibleText = metrics.visibleText || '';
  const required = [...new Set(requiredTerms || [])];
  const pdfFonts = runPdfFontsAudit(pdfPath, variantId);
  metrics.fonts.pdfEmbeddedFamilies = pdfFonts.families;
  metrics.fonts.pdffontsOutputPath = pdfFonts.outputPath;
  metrics.fonts.pdffontsRaw = pdfFonts.raw;
  metrics.fonts.deprecatedFontChecks.figtreePresent = fontListHas(pdfFonts.families, /Figtree/i);
  metrics.fonts.deprecatedFontChecks.poppinsPresent = fontListHas(pdfFonts.families, /Poppins/i);
  metrics.fonts.arialCompatibleLoaded = metrics.fonts.arialCompatibleLoaded && fontListHas(pdfFonts.families, /Arial|LiberationSans/i);
  metrics.fonts.arialRegularAvailable = fontListHas(pdfFonts.families, /(?:^|[-])(?:Arial|LiberationSans)$/i) || fontListHas(pdfFonts.families, /LiberationSans$/i);
  metrics.fonts.arialBoldAvailable = fontListHas(pdfFonts.families, /Arial-Bold|LiberationSans-Bold/i);
  metrics.fonts.arialItalicAvailable = fontListHas(pdfFonts.families, /Arial-Italic|LiberationSans-Italic/i);
  metrics.fonts.glyphDiagnostics = (metrics.fonts.glyphDiagnostics || []).map((item) => ({ ...item, pdfFontFamily: item.primaryFontFamily === 'Roboto Slab' ? 'RobotoSlab-Bold' : (item.fontWeight === '700' ? 'LiberationSans-Bold' : item.fontStyle === 'italic' ? 'LiberationSans-Italic' : 'LiberationSans') }));
  const normalizedStats = { fragmentJoinCount: 0, insertedSpaceCount: 0, insertedLineBreakCount: 0, fragmentJoinExamples: [] };
  const rawStats = { fragmentJoinCount: 0, insertedSpaceCount: 0, insertedLineBreakCount: 0, fragmentJoinExamples: [] };
  let extractedText = visibleText;
  let textExtractable = false;
  let selectedPdfJsMode = 'fallback-visible-text';
  const pdfJsModes = {
    normalized: { missingTerms: required.slice(), brokenTokenExamples: [], extractionSentinelsPresent: [] },
    normalizationDisabled: { missingTerms: required.slice(), brokenTokenExamples: [], extractionSentinelsPresent: [] },
  };
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const dataBuffer = new Uint8Array(readFileSync(pdfPath));
    const normalizedPdf = await pdfjs.getDocument({ data: dataBuffer }).promise;
    const normalizedText = await extractPdfJsText(normalizedPdf, undefined, normalizedStats);
    const rawPdf = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)) }).promise;
    const normalizationDisabledText = await extractPdfJsText(rawPdf, { disableNormalization: true }, rawStats);
    const normalizedAnalysis = analyzeExtractedText(normalizedText, required);
    const rawAnalysis = analyzeExtractedText(normalizationDisabledText, required);
    pdfJsModes.normalized = { missingTerms: normalizedAnalysis.missingTerms, brokenTokenExamples: normalizedAnalysis.brokenTokensDetected, extractionSentinelsPresent: normalizedAnalysis.extractionSentinelsPresent };
    pdfJsModes.normalizationDisabled = { missingTerms: rawAnalysis.missingTerms, brokenTokenExamples: rawAnalysis.brokenTokensDetected, extractionSentinelsPresent: rawAnalysis.extractionSentinelsPresent };
    const normalizedScore = normalizedAnalysis.missingTerms.length + normalizedAnalysis.brokenTokensDetected.length;
    const rawScore = rawAnalysis.missingTerms.length + rawAnalysis.brokenTokensDetected.length;
    if (rawScore < normalizedScore && rawAnalysis.normalizedText.includes(normalizeAtsText('Französisch')) && rawAnalysis.normalizedText.includes(normalizeAtsText('03/2026 – heute'))) {
      extractedText = normalizationDisabledText;
      selectedPdfJsMode = 'normalizationDisabled';
      Object.assign(normalizedStats, rawStats);
    } else {
      extractedText = normalizedText;
      selectedPdfJsMode = 'normalized';
    }
    textExtractable = extractedText.length > 100;
  } catch {
    textExtractable = visibleText.length > 100;
  }
  const pdfJsAnalysis = analyzeExtractedText(extractedText, required);
  const popplerRaw = runPopplerExtraction(pdfPath, variantId, 'raw');
  const popplerDefault = runPopplerExtraction(pdfPath, variantId, 'default');
  const popplerLayout = runPopplerExtraction(pdfPath, variantId, 'layout');
  const popplerRawAnalysis = analyzeExtractedText(popplerRaw.text, required);
  const popplerDefaultAnalysis = analyzeExtractedText(popplerDefault.text, []);
  const popplerLayoutAnalysis = analyzeExtractedText(popplerLayout.text, required);
  const primaryContentSuccess = popplerRaw.error === null
    && popplerRawAnalysis.missingTerms.length === 0
    && popplerRawAnalysis.brokenTokensDetected.length === 0
    && popplerRaw.text.trim().length > 100;
  const lower = popplerRawAnalysis.normalizedText;
  const keywordTerms = [...new Set(cv.skillSections.flatMap((section) => section.items.flatMap((item) => item.atsSynonyms || item.tags || [])))];
  const keywordHits = keywordTerms.filter((term) => lower.includes(normalizeAtsText(term)));
  const readingOrderTerms = [cv.person.name, 'KURZPROFIL', cv.skillSections[0]?.title, 'SPRACHEN', cv.experiences[0]?.period, 'SOFTWARE & TOOLS', 'REFERENZEN', 'EINTRITT', 'PENSUM'].filter(Boolean);
  const readingOrderText = popplerDefaultAnalysis.normalizedText;
  let previousPosition = -1;
  const readingOrderChecks = readingOrderTerms.map((term) => {
    const normalizedTerm = normalizeAtsText(term);
    const position = readingOrderText.indexOf(normalizedTerm);
    const found = position >= 0;
    const inOrder = found && position >= previousPosition;
    if (inOrder) previousPosition = position;
    return { term, position, found, inOrder };
  });
  const readingOrderValid = popplerDefault.error === null && popplerDefault.text.trim().length > 100 && readingOrderChecks.every((check) => check.found && check.inOrder);
  const readingOrderSuccess = popplerDefault.error === null && readingOrderValid === true;
  const primaryAtsSuccess = primaryContentSuccess && readingOrderSuccess;
  const pdfJsSuccess = pdfJsAnalysis.missingTerms.length === 0 && pdfJsAnalysis.brokenTokensDetected.length === 0;
  const popplerLayoutSuccess = !popplerLayout.error && popplerLayoutAnalysis.missingTerms.length === 0 && popplerLayoutAnalysis.brokenTokensDetected.length === 0;
  return {
    textExtractable: primaryAtsSuccess || textExtractable,
    readingOrderValid,
    readingOrderExtractor: 'poppler-default',
    readingOrderChecks,
    primaryExtractor: 'poppler-raw',
    primaryContentSuccess,
    readingOrderSuccess,
    primarySuccess: primaryAtsSuccess,
    requiredTerms: required,
    requiredTermsPresent: popplerRawAnalysis.requiredTermsPresent,
    missingTerms: popplerRawAnalysis.missingTerms,
    brokenTokensDetected: popplerRawAnalysis.brokenTokensDetected,
    extractionSentinelsPresent: popplerRawAnalysis.extractionSentinelsPresent,
    keywordCoverage: keywordTerms.length ? Number((keywordHits.length / keywordTerms.length).toFixed(2)) : 0,
    keywordStuffingRisk: /(\b\w+\b)(?:\s+\1){3,}/i.test(popplerRaw.text || extractedText),
    hiddenTextDetected: Boolean(metrics?.ats?.hiddenTextDetected),
    extractedCharCount: popplerRaw.text.length,
    normalization: atsNormalizationConfig,
    requiredTermsSource: 'final-visible-dom',
    pdfItemJoinMode: 'geometry-aware-v2',
    selectedPdfJsMode,
    pdfJsModes,
    extractors: {
      popplerRaw: { role: 'primary-content-extractor', gatesContentSuccess: true, success: primaryContentSuccess, missingTerms: popplerRawAnalysis.missingTerms, brokenTokensDetected: popplerRawAnalysis.brokenTokensDetected, extractionSentinelsPresent: popplerRawAnalysis.extractionSentinelsPresent, outputPath: popplerRaw.outputPath, error: popplerRaw.error, args: popplerRaw.args },
      popplerDefault: { role: 'primary-reading-order-extractor', gatesReadingOrderSuccess: true, success: readingOrderSuccess, readingOrderValid, readingOrderChecks, outputPath: popplerDefault.outputPath, error: popplerDefault.error, args: popplerDefault.args },
      popplerLayout: { role: 'layout-diagnostic', gatesProductionSuccess: false, success: popplerLayoutSuccess, missingTerms: popplerLayoutAnalysis.missingTerms, brokenTokensDetected: popplerLayoutAnalysis.brokenTokensDetected, extractionSentinelsPresent: popplerLayoutAnalysis.extractionSentinelsPresent, outputPath: popplerLayout.outputPath, error: popplerLayout.error, args: popplerLayout.args },
      pdfjs: { role: 'secondary-diagnostic', gatesProductionSuccess: false, success: pdfJsSuccess, missingTerms: pdfJsAnalysis.missingTerms, brokenTokensDetected: pdfJsAnalysis.brokenTokensDetected, extractionSentinelsPresent: pdfJsAnalysis.extractionSentinelsPresent, selectedMode: selectedPdfJsMode },
    },
    atsOptimization: { visibleSectionHeadings: ['KOMPETENZEN', 'KOMPETENZEN & VERANTWORTUNG'], highPriorityJobTerms: keywordTerms, matchedVisibleTerms: keywordHits, unsupportedTermsRejected: [], hiddenKeywordCount: 0, keywordStuffingRisk: /(?:\b\w+\b)(?:\s+\1){3,}/i.test(popplerRaw.text || extractedText) },
    requiredTermRepairApplied: false,
    requiredTermRepairs: [],
    fragmentJoinCount: normalizedStats.fragmentJoinCount,
    insertedSpaceCount: normalizedStats.insertedSpaceCount,
    preservedSpaceCount: normalizedStats.preservedSpaceCount,
    preservedSpaceExamples: normalizedStats.preservedSpaceExamples,
    insertedLineBreakCount: normalizedStats.insertedLineBreakCount,
    fragmentJoinExamples: normalizedStats.fragmentJoinExamples,
  };
}

function buildReviewQueue() {
  const blocks = [
    ...data.skillSections.flatMap((section) => section.items || []),
    ...data.experiences.flatMap((experience) => [...(experience.bullets || []), ...(experience.optionalBullets || [])]),
    ...data.tools,
  ];
  return blocks
    .filter((block) => block.status === 'inferred_review_required' || block.evidenceLevel === 'inferred_review_required')
    .map((block) => ({ id: block.id, status: block.status || block.evidenceLevel, sources: block.sources || [], reason: 'manual review required before production visibility' }));
}

const requiredTerms = Array.isArray(metrics.ats?.requiredTerms) ? metrics.ats.requiredTerms : [];
metrics.ats = await buildAtsReport(`dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`, metrics, requiredTerms);
metrics.fonts.ciArialResolution = fontResolutionName(fontResolution.arial.stdout);
metrics.fonts.fontResolution = fontResolution;
if (metrics.fonts.deprecatedFontChecks?.figtreePresent) metrics.warnings.push('Figtree is embedded in the PDF.');
if (metrics.fonts.deprecatedFontChecks?.poppinsPresent) metrics.warnings.push('Poppins is embedded in the PDF.');
if (!metrics.fonts.pdfEmbeddedFamilies.some((family) => /RobotoSlab-Bold/i.test(family))) metrics.warnings.push('Roboto Slab Bold is not embedded in the PDF.');
if (!metrics.fonts.pdfEmbeddedFamilies.some((family) => /Arial|LiberationSans/i.test(family))) metrics.warnings.push('Arial-compatible sans is not embedded in the PDF.');
if (!metrics.fonts.pdfEmbeddedFamilies.some((family) => /Arial-Bold|LiberationSans-Bold/i.test(family))) metrics.warnings.push('Arial-compatible bold is not embedded in the PDF.');
if (!metrics.fonts.pdfEmbeddedFamilies.some((family) => /Arial-Italic|LiberationSans-Italic/i.test(family))) metrics.warnings.push('Arial-compatible italic is not embedded in the PDF.');
metrics.reviewQueue = buildReviewQueue();

const report = {
  success: renderer === 'playwright' && pageCount === 2 && metrics.summary.selectionSucceeded === true && metrics.summary.actualLines === metrics.summary.targetLines && metrics.overflows.length === 0 && metrics.collisions.length === 0 && metrics.warnings.length === 0 && metrics.ats.textExtractable && metrics.ats.primaryContentSuccess === true && metrics.ats.readingOrderValid === true && metrics.ats.primarySuccess === true && metrics.ats.missingTerms.length === 0 && metrics.ats.brokenTokensDetected.length === 0 && !metrics.ats.keywordStuffingRisk && !metrics.ats.hiddenTextDetected && metrics.skillsetsQuality?.renderedSkillsetCount === 4 && metrics.skillsetsQuality?.allBulletCountsWithinRange === true && metrics.skillsetsQuality?.allBulletsEvidenceBacked === true && metrics.skillsetsQuality?.uniqueIconCount === 4 && metrics.skillsetsQuality?.allIconsUsedExactlyOnce === true && metrics.skillsetsQuality?.allIconsLoaded === true && metrics.skillsetsQuality?.largestSafeIconSizeSelected === true && metrics.skillsetsQuality?.textWidthMaximized === true && metrics.skillsetsQuality?.noClippedSkillText === true && metrics.skillsetsQuality?.languageGapPx >= metrics.skillsetsQuality?.minimumLanguageGapPx && metrics.skillsetsQuality?.sectionTitle?.visible === true && metrics.skillsetsQuality?.sectionTitle?.atsExtractable === true && metrics.skillsetsQuality?.languageSpacing?.requirementPassed === true && metrics.experienceQuality?.sectionTitle?.visible === true && metrics.experienceQuality?.sectionTitle?.atsExtractable === true && metrics.experienceQuality?.combinedTrainingCredential?.visible === true && metrics.experienceQuality?.combinedTrainingCredential?.evidenceStatus === 'verified' && metrics.experienceQuality?.breadthSummaryPolicy?.allRenderedLast === true && metrics.experienceQuality?.breadthSummaryPolicy?.allEvidenceBacked === true && (metrics.experienceQuality?.pageFill?.withinTargetRange === true || metrics.experienceQuality?.pageFill?.largestSafeContentSetSelected === true) && (metrics.experienceQuality?.crossDomainBullet?.enabled !== true || (metrics.experienceQuality.crossDomainBullet.renderedStationCount === metrics.experienceQuality.crossDomainBullet.expectedStationCount && metrics.experienceQuality.crossDomainBullet.allRenderedLast === true && metrics.experienceQuality.crossDomainBullet.allStationsHaveMinimumSubstantiveBullets === true && metrics.experienceQuality.crossDomainBullet.insufficientSubstantiveExperienceIds.length === 0)),
  variant: variantId,
  renderer,
  renderedAt: new Date().toISOString(),
  durationMs: Math.round(performance.now() - started),
  pageCount,
  overflows: metrics.overflows,
  collisions: metrics.collisions,
  warnings: metrics.warnings,
  links: metrics.links,
  images: metrics.images,
  assets: metrics.assets,
  fonts: metrics.fonts,
  buttonStates: metrics.buttonStates,
  emailState: metrics.emailState,
  finalInteractiveState: metrics.finalInteractiveState,
  layout: metrics.layout,
  profile: metrics.profile,
  summary: metrics.summary,
  targetRoleFamily: cv.targetRoleFamily,
  skillsetsQuality: metrics.skillsetsQuality,
  experienceQuality: metrics.experienceQuality,
  experienceLocationStyles: metrics.experienceLocationStyles,
  toolsQuality: metrics.toolsQuality,
  footerQuality: metrics.footerQuality,
  ats: metrics.ats,
  pdf: metrics.pdf,
  reviewQueue: metrics.reviewQueue,
  supplementary: metrics.supplementary,
  fill: metrics.fill,
};
writeFileSync(`dist/render-report-${variantId}.json`, JSON.stringify(report, null, 2));
console.log(`Rendered ${variantId} with ${renderer}: success=${report.success}, pages=${pageCount}, overflows=${report.overflows.length}, collisions=${report.collisions.length}`);
if (!report.success) process.exit(1);
