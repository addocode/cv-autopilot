import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { normalizeAtsText, atsNormalizationConfig, joinPdfTextItems } from '../src/lib/ats-normalize.mjs';

const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const esc = (value) => String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
const arg = process.argv.indexOf('--variant');
const variantId = arg >= 0 ? process.argv[arg + 1] : 'general';
mkdirSync('dist', { recursive: true });
const staleFiles = [
  `dist/render-failure-${variantId}.json`,
  `dist/render-report-${variantId}.json`,
  `dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`,
  `dist/cv-${variantId}-page-1.png`,
  `dist/cv-${variantId}-page-2.png`,
  `dist/text-${variantId}-poppler.txt`,
  `dist/text-${variantId}-poppler-raw.txt`,
  `dist/text-${variantId}-poppler-layout.txt`,
];
for (const file of staleFiles) {
  if (existsSync(file)) unlinkSync(file);
}

const data = load('data/private/cv.master.json');
const variant = load(`data/public/variants/${variantId}.json`);
const backgroundFileExists = existsSync('assets/bg_img.jpeg');

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

function applyVariant() {
  const selected = new Set(variant.selectedBulletIds);
  const hidden = new Set(variant.hiddenBulletIds);
  const priority = new Map(variant.bulletPriority.map((id, index) => [id, index]));
  const sections = variant.skillSectionOrder
    .map((id) => data.skillSections.find((section) => section.id === id))
    .filter(Boolean)
    .filter((section) => !variant.hiddenSkillSections.includes(section.id))
    .map((section) => ({
      ...section,
      title: variant.skillSectionTitles[section.id] || section.title,
      items: section.items.slice(0, Math.ceil(variant.budgets.pageOneMaxSkillItems / variant.skillSectionOrder.length) + 2),
    }));

  const supplementaryItems = [];
  const experienceIndicatorText = data.supplementaryIndicators?.experience?.[variantId] || data.supplementaryIndicators?.experience?.general;
  const maxExperienceIndicators = variant.supplementaryIndicators?.experience?.enabled ? variant.supplementaryIndicators.experience.maxPerVariant ?? 0 : 0;
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
    const optionalCandidates = (experience.optionalBullets || [])
      .filter((bullet) => (bullet.variantRelevance || []).includes(variantId))
      .sort((a, b) => (a.fillPriority ?? 99) - (b.fillPriority ?? 99))
      .map((bullet) => ({ ...bullet, experienceId: experience.id, candidateType: 'optional-bullet' }));
    const minimumFillers = [...experience.bullets, ...optionalCandidates]
      .filter((bullet) => !included.some((item) => item.id === bullet.id) && !hidden.has(bullet.id) && bullet.status !== 'inferred_review_required' && bullet.evidenceLevel !== 'inferred_review_required')
      .sort((a, b) => (priority.get(a.id) ?? a.fillPriority ?? 99) - (priority.get(b.id) ?? b.fillPriority ?? 99));
    while (included.length < 2 && minimumFillers.length > 0) {
      const filler = minimumFillers.shift();
      included.push({ ...filler, text: filler.shortText || filler.text, minimumFallback: true });
    }
    const omitted = [...omittedMandatory, ...optionalCandidates].filter((bullet) => !included.some((item) => item.id === bullet.id));
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
  const skillHtml = cv.skillSections.map((section) => `<section class="module skill-section" id="skill-${section.id}" data-check data-collision-group="skills"><div>${icon(section.id)}</div><div><h2 data-ats-required>${esc(section.title)}</h2><ul>${section.items.map((item) => `<li id="${item.id}" data-check>${esc(item.text)}</li>`).join('')}</ul></div></section>`).join('');
  const expHtml = cv.experiences.map((experience) => {
    const bullets = experience.bullets;
    const optionalHtml = experience.optionalCandidates.map((bullet) => `<li id="${bullet.id}" class="optional-fill" data-check data-fill-state="candidate" data-fill-kind="optional-bullet" data-experience-id="${experience.id}" data-fill-priority="${bullet.fillPriority ?? 99}" data-long-text="${esc(bullet.text)}" data-short-text="${esc(bullet.shortText || bullet.text)}" data-fill-id="${bullet.id}" hidden>${esc(bullet.text)}</li>`).join('');
    const indicatorAllowed = cv.supplementary.candidateItems.find((item) => item.type === 'experience' && item.experienceId === experience.id);
    const indicatorHtml = indicatorAllowed ? `<p class="supplementary experience-more" data-check data-fill-state="candidate" data-fill-kind="experience-indicator" data-experience-id="${experience.id}" data-fill-priority="${indicatorAllowed.priority ?? 99}" data-long-text="${esc(indicatorAllowed.text)}" data-short-text="${esc(indicatorAllowed.text)}" data-fill-id="${indicatorAllowed.id}" hidden>${esc(indicatorAllowed.text)}</p>` : '';
    return `<article class="module experience" id="experience-${experience.id}" data-check data-collision-group="experiences"><div class="experience-heading"><div class="meta" data-ats-required>${esc(experience.period)} <span>|</span> <strong>${esc(experience.role)}</strong></div><div class="employer" data-ats-required>${experienceLine(experience)}</div>${experience.notes.map((note) => `<div class="note">${esc(note)}</div>`).join('')}</div><ul>${bullets.map((bullet) => `<li id="${bullet.id}" data-check>${esc(bullet.text)}</li>`).join('')}${optionalHtml}</ul>${indicatorHtml}</article>`;
  }).join('');
  const toolIndicator = cv.supplementary.toolsIndicator ? `<p class="supplementary tools-more" data-check data-ats-required data-ats-text="${esc(cv.supplementary.toolsIndicator.text)}">${esc(cv.supplementary.toolsIndicator.text)}</p>` : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Lebenslauf ${esc(cv.person.name)} ${esc(variantId)}</title><link rel="stylesheet" href="../src/styles/tokens.css"><link rel="stylesheet" href="../src/styles/cv.css"></head><body><main class="cv" data-variant="${esc(variantId)}"><section class="cv-page" id="page-1"><div class="frame"><section class="hero-panel" id="hero-panel" data-check><img class="profile" src="../${esc(cv.person.profileImage)}" alt="Porträt von Adam Dolinsky"><header class="hero"><h1 data-ats-required>${esc(cv.person.name)}</h1><p class="headline" data-ats-required>${esc(cv.headline)}</p><p class="credential">${esc(cv.positioning.credential)}</p><p class="contact"><span>${esc(cv.person.location)}</span><br><a href="mailto:${esc(cv.person.email)}" data-ats-required>${esc(cv.person.email)}</a></p><div class="link-buttons"><a href="${esc(cv.person.portfolio)}">dolinsky.ch</a><a href="${esc(cv.person.linkedin)}">LinkedIn</a></div></header><section class="module summary" id="summary" data-check data-summary-target-lines="${cv.summaryMeta.targetLines}"><h2>KURZPROFIL</h2><p id="summary-text">${esc(cv.summaryText)}</p></section></section><section class="competence-panel" id="competence-panel" data-check>${skillHtml}<section class="module languages-row" id="languages" data-check data-collision-group="skills"><div class="languages-label">SPRACHEN</div>${cv.languages.map((language) => `<div class="language" data-ats-required data-ats-text="${esc(`${language.name} ${language.level}`)}"><span>${esc(language.name)}</span><strong>${esc(language.level)}</strong></div>`).join('')}</section></section></div><div class="counter">1/2</div></section><section class="cv-page" id="page-2"><div class="frame page-two"><section class="white-panel" id="page-two-panel" data-check><section class="experience-list" id="experience-list" data-check>${expHtml}</section><footer class="bottom-grid" id="bottom-grid" data-check data-collision-group="experiences"><section class="module tools" id="tools" data-check data-collision-group="bottom"><h2 data-footer-title="tools">${icon('tools')}<span>SOFTWARE & TOOLS</span></h2><div class="tool-cols"><div>${toolLeft.map((tool) => `<span id="${tool.id}" data-tool-id="${tool.id}" data-ats-required>${esc(tool.name)}</span>`).join('')}</div><div>${toolRight.map((tool) => `<span id="${tool.id}" data-tool-id="${tool.id}" data-ats-required>${esc(tool.name)}</span>`).join('')}</div></div>${toolIndicator}</section><section class="module refs" id="references" data-check data-collision-group="bottom"><h2 data-footer-title="references">${icon('references')}<span>REFERENZEN</span></h2>${cv.references.map((reference) => `<p><strong data-ats-required>${esc(reference.name)}</strong><br>${esc(reference.role)}<br>${esc(reference.employer)}<br><span data-ats-required>${esc(reference.phone)}</span></p>`).join('')}</section><section class="module avail" id="availability" data-check data-collision-group="bottom"><div class="availability-block entry-block"><h2 data-footer-title="entry">${icon('availability')}<span>EINTRITT</span></h2><p data-ats-required>${esc(cv.availability.text)}</p></div><div class="availability-block workload-block"><h2 data-footer-title="workload">${icon('workload')}<span>PENSUM</span></h2><p data-ats-required>${esc(cv.workload.text)}</p></div></section></footer></section></div><div class="counter">2/2</div></section></main></body></html>`;
}

const htmlPath = `dist/cv-${variantId}-preview.html`;
writeFileSync(htmlPath, html());

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
  await page.evaluate(() => document.fonts.ready);

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

  renderStage = 'initial-layout-metrics';
  const metrics = await page.evaluate(({ bgExists, variantMeta }) => {
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
        tools: getComputedStyle(document.querySelector('.tools span')).fontFamily,
        slab: getComputedStyle(document.querySelector('.summary h2')).fontFamily,
        slabLoaded: document.fonts.check('700 16px "Roboto Slab"'),
        figtreeLoaded: document.fonts.check('400 16px "Figtree"') && document.fonts.check('600 16px "Figtree"'),
        figtreeNormalLoaded: document.fonts.check('400 16px "Figtree"'),
        figtreeMediumLoaded: document.fonts.check('500 16px "Figtree"'),
        figtreeSemiboldLoaded: document.fonts.check('600 16px "Figtree"'),
        figtreeBoldLoaded: document.fonts.check('700 16px "Figtree"'),
        figtreeItalicLoaded: document.fonts.check('italic 400 16px "Figtree"'),
        figtreeItalicMediumLoaded: document.fonts.check('italic 500 16px "Figtree"'),
        figtreeLigatures: '',
        figtreeKerning: '',
        figtreeFeatureSettings: '',
        figtreeSynthesis: '',
        figtreeComputedSamples: {},
        slabSamples: {},
        skillHeadingSamples: [],
        deprecatedFontChecks: { poppinsPresent: false },
      },
      buttonStates: { normal: {}, hover: {}, focus: {} },
      emailState: {},
      finalInteractiveState: {},
      layout: { pageTwoWhitePanelTopPx: 0, pageTwoFooterHeightPx: 0, counterRailAlignment: [], languageVerticalDividerCount: 1, languageHorizontalDividerCount: 2, darkRuleWidthPx: 0, profileBorderWidthPx: 0, frameOffsetLeftPx: 0, frameOffsetRightPx: 0, frameOffsetTopPx: 0, frameOffsetBottomPx: 0, blueTouchesPageTop: false, blueTouchesPageBottom: false, blueTouchesPageLeft: false, blueTouchesPageRight: false, experienceBulletGapPx: 0, experienceBulletGaps: [], frameOffsets: { page1: {}, page2: {} }, pageOneHasTopBackgroundStrip: false, pageOneHasBottomBackgroundStrip: true, pageTwoHasTopBackgroundStrip: true, pageTwoHasBottomBackgroundStrip: false, stackedPageGapPx: 0 },
      experienceQuality: { minimumBulletsPerStation: 2, stations: [] },
      toolsQuality: { minimumVisibleTools: 14, visibleToolCount: 0, visibleToolIds: [], duplicateToolIds: [], unverifiedVisibleToolIds: [] },
      footerQuality: { titleFontSizes: {}, titleFontFamilies: {}, iconBoxes: {}, iconTitleGapsPx: {}, entryAndWorkloadAligned: false },
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
    const rootStyle = getComputedStyle(document.documentElement);
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
    const summaryRange = document.createRange();
    summaryRange.selectNodeContents(document.querySelector('#summary-text'));
    out.summary.actualLines = [...new Set([...summaryRange.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top * 2) / 2))].length;
    out.layout.experienceBulletGaps = [...document.querySelectorAll('.experience')].map((experience) => { const heading = experience.querySelector('.experience-heading'); const firstBullet = experience.querySelector('li:not([hidden])'); return { experienceId: experience.id.replace('experience-', ''), gapPx: heading && firstBullet ? Math.round(firstBullet.getBoundingClientRect().top - heading.getBoundingClientRect().bottom) : 0 }; });
    out.layout.experienceBulletGapPx = out.layout.experienceBulletGaps[0]?.gapPx || 0;
    out.experienceQuality.stations = [...document.querySelectorAll('.experience')].map((experience) => {
      const visibleBullets = [...experience.querySelectorAll('li:not([hidden])')];
      return { experienceId: experience.id.replace('experience-', ''), visibleBulletCount: visibleBullets.length, verifiedBulletCount: visibleBullets.filter((li) => !li.id.includes('summary')).length, defensibleInferenceCount: visibleBullets.filter((li) => li.id.includes('summary')).length, sourceIds: visibleBullets.map((li) => li.id) };
    });
    out.toolsQuality.visibleToolIds = [...document.querySelectorAll('[data-tool-id]')].map((tool) => tool.dataset.toolId);
    out.toolsQuality.visibleToolCount = out.toolsQuality.visibleToolIds.length;
    out.toolsQuality.duplicateToolIds = out.toolsQuality.visibleToolIds.filter((id, index, arr) => arr.indexOf(id) !== index);
    const footerSelectors = { tools: '#tools h2', references: '#references h2', entry: '.entry-block h2', workload: '.workload-block h2' };
    for (const [key, selector] of Object.entries(footerSelectors)) { const title = document.querySelector(selector); if (!title) continue; const style = getComputedStyle(title); const icon = title.querySelector('.icon')?.getBoundingClientRect(); const span = title.querySelector('span')?.getBoundingClientRect(); out.footerQuality.titleFontSizes[key] = style.fontSize; out.footerQuality.titleFontFamilies[key] = style.fontFamily; out.footerQuality.iconBoxes[key] = icon ? { width: Math.round(icon.width), height: Math.round(icon.height), top: Math.round(icon.top), left: Math.round(icon.left) } : null; out.footerQuality.iconTitleGapsPx[key] = icon && span ? Math.round(span.left - icon.right) : null; }
    const entrySpan = document.querySelector('.entry-block h2 span')?.getBoundingClientRect(); const workloadSpan = document.querySelector('.workload-block h2 span')?.getBoundingClientRect();
    out.footerQuality.entryAndWorkloadAligned = Boolean(entrySpan && workloadSpan && Math.abs(entrySpan.left - workloadSpan.left) <= 2);
    const figtreeSelectors = { summary: '#summary-text', employer: '.employer', bullet: '.experience li:not([hidden])', language: '.language', tool: '.tools [data-tool-id]', supplementary: '.supplementary', reference: '.refs p', availability: '.avail p' };
    const slabSelectors = { summaryHeading: '.summary h2', experienceTitle: '.experience .meta', toolsHeading: '#tools h2', referencesHeading: '#references h2', entryHeading: '.entry-block h2', workloadHeading: '.workload-block h2' };
    const cssString = (value) => typeof value === 'string' ? value : '';
    function readComputedSample(selector) {
      const element = document.querySelector(selector);
      if (!element) return { selector, found: false, fontFamily: '', fontStyle: '', fontWeight: '', fontVariantLigatures: '', fontKerning: '', fontFeatureSettings: '', fontSynthesis: '', letterSpacing: '', wordSpacing: '' };
      const style = getComputedStyle(element);
      return {
        selector,
        found: true,
        text: cssString(element.textContent).replace(/\s+/g, ' ').trim(),
        fontFamily: cssString(style.fontFamily),
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
    const featureValues = [];
    const kerningValues = [];
    const ligatureValues = [];
    const synthesisValues = [];
    for (const [key, selector] of Object.entries(figtreeSelectors)) {
      const sample = readComputedSample(selector);
      out.fonts.figtreeComputedSamples[key] = sample;
      if (!sample.found) continue;
      ligatureValues.push(sample.fontVariantLigatures);
      kerningValues.push(sample.fontKerning);
      featureValues.push(sample.fontFeatureSettings);
      synthesisValues.push(sample.fontSynthesis);
    }
    out.fonts.figtreeLigatures = [...new Set(ligatureValues)].join(' | ');
    out.fonts.figtreeKerning = [...new Set(kerningValues)].join(' | ');
    out.fonts.figtreeFeatureSettings = [...new Set(featureValues)].join(' | ');
    out.fonts.figtreeSynthesis = [...new Set(synthesisValues)].join(' | ');
    for (const [key, selector] of Object.entries(slabSelectors)) out.fonts.slabSamples[key] = readComputedSample(selector);
    out.fonts.skillHeadingSamples = [...document.querySelectorAll('.skill-section h2')].map((element) => {
      const style = getComputedStyle(element);
      return { text: cssString(element.textContent).replace(/\s+/g, ' ').trim(), fontFamily: cssString(style.fontFamily), fontWeight: cssString(style.fontWeight), fontStyle: cssString(style.fontStyle) };
    });
    if (!out.assets.profile.loaded) out.warnings.push('Profile image did not load.');
    if ([out.fonts.heading, out.fonts.body, out.fonts.slab, out.fonts.tools, out.fonts.employer].some((font) => /Times New Roman|Arial/i.test(font))) out.warnings.push('Chromium fell back to Arial or Times New Roman.');
    if (!out.fonts.slabLoaded || !/Roboto Slab/i.test(out.fonts.slab)) out.warnings.push('Roboto Slab did not load for the summary heading.');
    if (!out.fonts.figtreeLoaded || !/Figtree/i.test(out.fonts.body)) out.warnings.push('Figtree did not load for body text.');
    const figtreeSamples = Object.values(out.fonts.figtreeComputedSamples);
    const foundFigtreeSamples = figtreeSamples.filter((sample) => sample.found);
    const missingFigtreeSamples = Object.entries(out.fonts.figtreeComputedSamples).filter(([, sample]) => !sample.found).map(([key, sample]) => `${key}:${sample.selector}`);
    if (missingFigtreeSamples.length) out.warnings.push(`Figtree diagnostic selector missing: ${missingFigtreeSamples.join(', ')}`);
    if (foundFigtreeSamples.some((sample) => !/Figtree/i.test(sample.fontFamily))) out.warnings.push('A Figtree body sample did not compute to Figtree.');
    if (foundFigtreeSamples.some((sample) => sample.fontVariantLigatures !== 'none')) out.warnings.push('Figtree ligatures are not disabled.');
    if (foundFigtreeSamples.some((sample) => sample.fontKerning !== 'normal')) out.warnings.push('Figtree kerning is not natural.');
    if (foundFigtreeSamples.some((sample) => sample.fontFeatureSettings !== 'normal')) out.warnings.push('Figtree feature settings are not natural.');
    if (foundFigtreeSamples.some((sample) => sample.fontSynthesis !== 'none')) out.warnings.push('Figtree font synthesis is not disabled.');
    if (foundFigtreeSamples.some((sample) => !['normal', '0px'].includes(sample.letterSpacing))) out.warnings.push('Figtree letter spacing uses fixed tracking.');
    if (foundFigtreeSamples.some((sample) => !['normal', '0px'].includes(sample.wordSpacing))) out.warnings.push('Figtree word spacing uses fixed spacing.');
    if (out.fonts.skillHeadingSamples.some((sample) => !/Roboto Slab/i.test(sample.fontFamily) || /Figtree|Arial|Times New Roman/i.test(sample.fontFamily))) out.warnings.push('A skill heading does not use Roboto Slab.');
    if (out.fonts.figtreeComputedSamples.summary?.fontStyle !== 'italic') out.warnings.push('Summary text is not italic.');
    if (out.fonts.figtreeComputedSamples.supplementary?.found && out.fonts.figtreeComputedSamples.supplementary.fontStyle !== 'italic') out.warnings.push('Supplementary text is not italic.');
    if (out.summary.actualLines !== out.summary.targetLines || out.summary.selectionSucceeded !== true) out.warnings.push('Summary is not exactly four visible lines.');
    if (out.experienceQuality.stations.some((station) => station.visibleBulletCount < out.experienceQuality.minimumBulletsPerStation)) out.warnings.push('An experience has fewer than two visible bullets.');
    if (out.toolsQuality.visibleToolCount < out.toolsQuality.minimumVisibleTools || out.toolsQuality.duplicateToolIds.length) out.warnings.push('Tool quality requirements failed.');
    if (!out.assets.background.exists || !out.assets.background.computed || !out.assets.background.rendered || !out.assets.background.coversFullPage || !out.assets.background.bottomZoneNotGray) out.warnings.push('Background image did not cover the full page.');
    return out;
  }, {
    bgExists: backgroundFileExists,
    variantMeta: { supplementary: cv.supplementary, fill: cv.fill, summary: cv.summaryMeta, summaryCandidates: cv.summaryCandidates },
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

function runPopplerExtraction(pdfPath, variant, mode) {
  const suffix = mode === 'raw' ? 'raw' : 'layout';
  const outputPath = `dist/text-${variant}-poppler-${suffix}.txt`;
  const args = ['-enc', 'UTF-8', mode === 'raw' ? '-raw' : '-layout', pdfPath, outputPath];
  const result = spawnSync('pdftotext', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    return { outputPath, text: '', error: result.stderr || result.error?.message || 'pdftotext failed', args };
  }
  return { outputPath, text: readFileSync(outputPath, 'utf8'), error: null, args };
}

async function buildAtsReport(pdfPath, metrics, requiredTerms) {
  const visibleText = metrics.visibleText || '';
  const required = [...new Set(requiredTerms || [])];
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
  const popplerLayout = runPopplerExtraction(pdfPath, variantId, 'layout');
  const popplerRawAnalysis = analyzeExtractedText(popplerRaw.text, required);
  const popplerLayoutAnalysis = analyzeExtractedText(popplerLayout.text, required);
  const primaryAtsSuccess = popplerRaw.error === null
    && popplerRawAnalysis.missingTerms.length === 0
    && popplerRawAnalysis.brokenTokensDetected.length === 0
    && popplerRaw.text.trim().length > 100;
  const lower = popplerRawAnalysis.normalizedText;
  const keywordTerms = [...new Set(cv.skillSections.flatMap((section) => section.items.flatMap((item) => item.atsSynonyms || item.tags || [])))];
  const keywordHits = keywordTerms.filter((term) => lower.includes(normalizeAtsText(term)));
  const orderChecks = [cv.person.name, cv.headline, cv.person.email, cv.summaryText, cv.skillSections[0]?.title, 'SPRACHEN', cv.experiences[0]?.period, 'SOFTWARE & TOOLS', 'REFERENZEN', 'EINTRITT', 'PENSUM'].filter(Boolean).map((term) => normalizeAtsText(term));
  const readingOrderValid = orderChecks.every((term, index) => {
    const current = lower.indexOf(term);
    if (current < 0) return false;
    if (index === 0) return true;
    const previous = lower.indexOf(orderChecks[index - 1]);
    return previous >= 0 && previous <= current;
  });
  const pdfJsSuccess = pdfJsAnalysis.missingTerms.length === 0 && pdfJsAnalysis.brokenTokensDetected.length === 0;
  const popplerLayoutSuccess = !popplerLayout.error && popplerLayoutAnalysis.missingTerms.length === 0 && popplerLayoutAnalysis.brokenTokensDetected.length === 0;
  return {
    textExtractable: primaryAtsSuccess || textExtractable,
    readingOrderValid,
    readingOrderExtractor: 'poppler-raw',
    primaryExtractor: 'poppler-raw',
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
      popplerRaw: { role: 'primary-ats-extractor', gatesProductionSuccess: true, success: primaryAtsSuccess, missingTerms: popplerRawAnalysis.missingTerms, brokenTokensDetected: popplerRawAnalysis.brokenTokensDetected, extractionSentinelsPresent: popplerRawAnalysis.extractionSentinelsPresent, outputPath: popplerRaw.outputPath, error: popplerRaw.error, args: popplerRaw.args },
      popplerLayout: { role: 'layout-diagnostic', gatesProductionSuccess: false, success: popplerLayoutSuccess, missingTerms: popplerLayoutAnalysis.missingTerms, brokenTokensDetected: popplerLayoutAnalysis.brokenTokensDetected, extractionSentinelsPresent: popplerLayoutAnalysis.extractionSentinelsPresent, outputPath: popplerLayout.outputPath, error: popplerLayout.error, args: popplerLayout.args },
      pdfjs: { role: 'secondary-diagnostic', gatesProductionSuccess: false, success: pdfJsSuccess, missingTerms: pdfJsAnalysis.missingTerms, brokenTokensDetected: pdfJsAnalysis.brokenTokensDetected, extractionSentinelsPresent: pdfJsAnalysis.extractionSentinelsPresent, selectedMode: selectedPdfJsMode },
    },
    requiredTermRepairApplied: false,
    requiredTermRepairs: [],
    fragmentJoinCount: normalizedStats.fragmentJoinCount,
    insertedSpaceCount: normalizedStats.insertedSpaceCount,
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
metrics.reviewQueue = buildReviewQueue();

const report = {
  success: renderer === 'playwright' && pageCount === 2 && metrics.summary.selectionSucceeded === true && metrics.summary.actualLines === metrics.summary.targetLines && metrics.overflows.length === 0 && metrics.collisions.length === 0 && metrics.warnings.length === 0 && metrics.ats.textExtractable && metrics.ats.primarySuccess === true && metrics.ats.missingTerms.length === 0 && metrics.ats.brokenTokensDetected.length === 0 && !metrics.ats.keywordStuffingRisk && !metrics.ats.hiddenTextDetected,
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
  experienceQuality: metrics.experienceQuality,
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
