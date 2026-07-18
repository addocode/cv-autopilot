import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { normalizeAtsText, atsNormalizationConfig } from '../src/lib/ats-normalize.mjs';

const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const esc = (value) => String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
const arg = process.argv.indexOf('--variant');
const variantId = arg >= 0 ? process.argv[arg + 1] : 'general';
mkdirSync('dist', { recursive: true });

const data = load('data/private/cv.master.json');
const variant = load(`data/public/variants/${variantId}.json`);
const backgroundFileExists = existsSync('assets/bg_img.jpeg');

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
    const omitted = [...omittedMandatory, ...optionalCandidates];
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
    summaryText: variant.summaryKey === 'default' ? data.summary.default : data.summary.variants[variant.summaryKey],
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
  };
  return `<svg class="icon icon-${id}" aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths[id] || paths['digital-marketing-web']}</svg>`;
}

function experienceLine(experience) {
  return experience.id === 'freelance-digital-marketing-media'
    ? esc(experience.employer)
    : `${esc(experience.employer)}${experience.location ? `, ${esc(experience.location)}` : ''}`;
}

function toolColumns() {
  const split = Math.ceil(cv.tools.length / 2);
  return [cv.tools.slice(0, split), cv.tools.slice(split)];
}

function html() {
  const [toolLeft, toolRight] = toolColumns();
  const skillHtml = cv.skillSections.map((section) => `<section class="module skill-section" id="skill-${section.id}" data-check data-collision-group="skills"><div>${icon(section.id)}</div><div><h2>${esc(section.title)}</h2><ul>${section.items.map((item) => `<li id="${item.id}" data-check>${esc(item.text)}</li>`).join('')}</ul></div></section>`).join('');
  const expHtml = cv.experiences.map((experience) => {
    const bullets = experience.bullets;
    const optionalHtml = experience.optionalCandidates.map((bullet) => `<li id="${bullet.id}" class="optional-fill" data-check data-fill-state="candidate" data-fill-kind="optional-bullet" data-experience-id="${experience.id}" data-fill-priority="${bullet.fillPriority ?? 99}" data-long-text="${esc(bullet.text)}" data-short-text="${esc(bullet.shortText || bullet.text)}" data-fill-id="${bullet.id}" hidden>${esc(bullet.text)}</li>`).join('');
    const indicatorAllowed = cv.supplementary.candidateItems.find((item) => item.type === 'experience' && item.experienceId === experience.id);
    const indicatorHtml = indicatorAllowed ? `<p class="supplementary experience-more" data-check data-fill-state="candidate" data-fill-kind="experience-indicator" data-experience-id="${experience.id}" data-fill-priority="${indicatorAllowed.priority ?? 99}" data-long-text="${esc(indicatorAllowed.text)}" data-short-text="${esc(indicatorAllowed.text)}" data-fill-id="${indicatorAllowed.id}" hidden>${esc(indicatorAllowed.text)}</p>` : '';
    return `<article class="module experience" id="experience-${experience.id}" data-check data-collision-group="experiences"><div class="meta">${esc(experience.period)} <span>|</span> <strong>${esc(experience.role)}</strong></div><div class="employer">${experienceLine(experience)}</div>${experience.notes.map((note) => `<div class="note">${esc(note)}</div>`).join('')}<ul>${bullets.map((bullet) => `<li id="${bullet.id}" data-check>${esc(bullet.text)}</li>`).join('')}${optionalHtml}</ul>${indicatorHtml}</article>`;
  }).join('');
  const toolIndicator = cv.supplementary.toolsIndicator ? `<p class="supplementary tools-more" data-check>${esc(cv.supplementary.toolsIndicator.text)}</p>` : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Lebenslauf ${esc(cv.person.name)} ${esc(variantId)}</title><link rel="stylesheet" href="../src/styles/tokens.css"><link rel="stylesheet" href="../src/styles/cv.css"></head><body><main class="cv" data-variant="${esc(variantId)}"><section class="cv-page" id="page-1"><div class="frame"><section class="hero-panel" id="hero-panel" data-check><img class="profile" src="../${esc(cv.person.profileImage)}" alt="Porträt von Adam Dolinsky"><header class="hero"><h1>${esc(cv.person.name)}</h1><p class="headline">${esc(cv.headline)}</p><p class="credential">${esc(cv.positioning.credential)}</p><p class="contact"><span>${esc(cv.person.location)}</span><br><a href="mailto:${esc(cv.person.email)}">${esc(cv.person.email)}</a></p><div class="link-buttons"><a href="${esc(cv.person.portfolio)}">dolinsky.ch</a><a href="${esc(cv.person.linkedin)}">LinkedIn</a></div></header><section class="module summary" id="summary" data-check><h2>KURZPROFIL</h2><p>${esc(cv.summaryText)}</p></section></section><section class="competence-panel" id="competence-panel" data-check>${skillHtml}<section class="module languages" id="languages" data-check data-collision-group="skills"><h2>SPRACHEN</h2>${cv.languages.map((language) => `<div><span>${esc(language.name)}</span><strong>${esc(language.level)}</strong></div>`).join('')}</section></section></div><div class="counter">1/2</div></section><section class="cv-page" id="page-2"><div class="frame page-two"><section class="white-panel" id="page-two-panel" data-check><section class="experience-list" id="experience-list" data-check>${expHtml}</section><footer class="bottom-grid" id="bottom-grid" data-check data-collision-group="experiences"><section class="module tools" id="tools" data-check data-collision-group="bottom"><h2>${icon('tools')}<span>SOFTWARE & TOOLS</span></h2><div class="tool-cols"><div>${toolLeft.map((tool) => `<span id="${tool.id}">${esc(tool.name)}</span>`).join('')}</div><div>${toolRight.map((tool) => `<span id="${tool.id}">${esc(tool.name)}</span>`).join('')}</div></div>${toolIndicator}</section><section class="module refs" id="references" data-check data-collision-group="bottom"><h2>${icon('references')}<span>REFERENZEN</span></h2>${cv.references.map((reference) => `<p><strong>${esc(reference.name)}</strong><br>${esc(reference.role)}<br>${esc(reference.employer)}<br>${esc(reference.phone)}</p>`).join('')}</section><section class="module avail" id="availability" data-check data-collision-group="bottom"><h2>${icon('availability')}<span>EINTRITT</span></h2><p>${esc(cv.availability.text)}</p><h2><span>PENSUM</span></h2><p>${esc(cv.workload.text)}</p></section></footer></section></div><div class="counter">2/2</div></section></main></body></html>`;
}

const htmlPath = `dist/cv-${variantId}-preview.html`;
writeFileSync(htmlPath, html());

async function withPlaywright() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
  const fileUrl = new URL(htmlPath, `file://${process.cwd()}/`).href;
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

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
        body: getComputedStyle(document.body).fontFamily,
        slab: getComputedStyle(document.querySelector('.summary h2')).fontFamily,
        slabLoaded: document.fonts.check('700 16px "Roboto Slab"'),
      },
      buttonStates: { normal: {}, hover: {}, focus: {} },
      emailState: {},
      finalInteractiveState: {},
      layout: { pageTwoWhitePanelTopPx: 0, pageTwoFooterHeightPx: 0, counterRailAlignment: [] },
      ats: { textExtractable: false, readingOrderValid: false, requiredTermsPresent: [], missingTerms: [], keywordCoverage: 0, keywordStuffingRisk: false, hiddenTextDetected: false },
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
    const page2 = document.querySelector('#page-2')?.getBoundingClientRect();
    if (panel2 && page2) { out.layout.pageTwoWhitePanelTopPx = Math.round(panel2.top - page2.top); out.layout.pageTwoFooterHeightPx = Math.round(page2.bottom - panel2.bottom); }
    out.layout.counterRailAlignment = [...document.querySelectorAll('.cv-page')].map((page) => { const counter = page.querySelector('.counter').getBoundingClientRect(); const pageRect = page.getBoundingClientRect(); const expectedCenterX = pageRect.left + (10 + 5) * 96 / 25.4; const actualCenterX = counter.left + counter.width / 2; return { pageId: page.id, expectedCenterX: Math.round(expectedCenterX), actualCenterX: Math.round(actualCenterX), deltaPx: Math.round(Math.abs(actualCenterX - expectedCenterX)) }; });
    if (document.querySelector('.summary p').textContent.length > 430) out.warnings.push('Summary exceeds 430 characters.');
    if (!out.assets.profile.loaded) out.warnings.push('Profile image did not load.');
    if ([out.fonts.heading, out.fonts.body, out.fonts.slab].some((font) => /Times New Roman/i.test(font))) out.warnings.push('Chromium fell back to Times New Roman.');
    if (!out.fonts.slabLoaded || !/Roboto Slab/i.test(out.fonts.slab)) out.warnings.push('Roboto Slab did not load for the summary heading.');
    if (!out.assets.background.exists || !out.assets.background.computed || !out.assets.background.rendered || !out.assets.background.coversFullPage || !out.assets.background.bottomZoneNotGray) out.warnings.push('Background image did not cover the full page.');
    return out;
  }, {
    bgExists: backgroundFileExists,
    variantMeta: { supplementary: cv.supplementary, fill: cv.fill },
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

  metrics.visibleText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
  metrics.ats.hiddenTextDetected = await page.evaluate(() => [...document.querySelectorAll('body *')].some((element) => { const style = getComputedStyle(element); const text = element.textContent?.trim(); return Boolean(text && style.visibility === 'hidden' && !element.closest('[hidden]')); }));

  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.locator('#page-1').screenshot({ path: `dist/cv-${variantId}-page-1.png` });
  await page.locator('#page-2').screenshot({ path: `dist/cv-${variantId}-page-2.png` });
  await browser.close();
  return metrics;
}

const started = performance.now();
let metrics;
const renderer = 'playwright';
try {
  metrics = await withPlaywright();
} catch (error) {
  console.error('Production render requires Playwright/Chromium:', error.message);
  process.exit(1);
}

let pageCount = metrics.pageCount;
try {
  const pdf = readFileSync(`dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`, 'latin1');
  pageCount = (pdf.match(/\/Type\s*\/Page\b/g) || []).length;
} catch {}

async function buildAtsReport(pdfPath, metrics) {
  const visibleText = metrics.visibleText || '';
  const baseTerms = [cv.person.name, cv.headline, cv.person.email, 'Peter Wyss', '+41 58 489 20 03', cv.availability.text, cv.workload.text];
  const employerTerms = cv.experiences.map((experience) => experience.employer.split('(')[0].trim()).filter(Boolean);
  const periodTerms = cv.experiences.map((experience) => experience.period);
  const toolTerms = cv.tools.map((tool) => tool.name);
  const skillTerms = cv.skillSections.map((section) => section.title);
  const required = [...new Set([...baseTerms, ...employerTerms, ...periodTerms, ...toolTerms, ...skillTerms])];
  let extractedText = visibleText;
  let textExtractable = false;
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)) }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
    }
    extractedText = pages.join(' ').trim();
    textExtractable = extractedText.length > 100;
  } catch {
    textExtractable = visibleText.length > 100;
  }
  const normalizedPdfText = normalizeAtsText(extractedText);
  const missingTerms = required.filter((term) => term && !normalizedPdfText.includes(normalizeAtsText(term)));
  const requiredTermsPresent = required.filter((term) => term && normalizedPdfText.includes(normalizeAtsText(term)));
  const lower = normalizedPdfText;
  const keywordTerms = [...new Set(cv.skillSections.flatMap((section) => section.items.flatMap((item) => item.atsSynonyms || item.tags || [])))];
  const keywordHits = keywordTerms.filter((term) => lower.includes(normalizeAtsText(term)));
  const orderChecks = [cv.person.name, cv.person.email, cv.experiences[0]?.period, cv.experiences[1]?.employer].filter(Boolean).map((term) => normalizeAtsText(term));
  const readingOrderValid = orderChecks.every((term, index) => index === 0 || normalizedPdfText.indexOf(orderChecks[index - 1]) <= normalizedPdfText.indexOf(term));
  return {
    textExtractable,
    readingOrderValid,
    requiredTermsPresent,
    missingTerms,
    keywordCoverage: keywordTerms.length ? Number((keywordHits.length / keywordTerms.length).toFixed(2)) : 0,
    keywordStuffingRisk: /(\b\w+\b)(?:\s+\1){3,}/i.test(extractedText),
    hiddenTextDetected: Boolean(metrics.ats.hiddenTextDetected),
    extractedCharCount: extractedText.length,
    normalization: atsNormalizationConfig,
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

metrics.ats = await buildAtsReport(`dist/Lebenslauf_Adam-Dolinsky_${variantId}.pdf`, metrics);
metrics.reviewQueue = buildReviewQueue();

const report = {
  success: renderer === 'playwright' && pageCount === 2 && metrics.overflows.length === 0 && metrics.collisions.length === 0 && metrics.warnings.length === 0 && metrics.ats.textExtractable && metrics.ats.readingOrderValid && metrics.ats.missingTerms.length === 0 && !metrics.ats.keywordStuffingRisk && !metrics.ats.hiddenTextDetected,
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
  ats: metrics.ats,
  reviewQueue: metrics.reviewQueue,
  supplementary: metrics.supplementary,
  fill: metrics.fill,
};
writeFileSync(`dist/render-report-${variantId}.json`, JSON.stringify(report, null, 2));
console.log(`Rendered ${variantId} with ${renderer}: success=${report.success}, pages=${pageCount}, overflows=${report.overflows.length}, collisions=${report.collisions.length}`);
if (!report.success) process.exit(1);
