import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const esc = (value) => String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
const arg = process.argv.indexOf('--variant');
const variantId = arg >= 0 ? process.argv[arg + 1] : 'general';
const allToolCount = 11;

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

  const optionalLimit = variant.fill?.enabled ? variant.fill.optionalBulletLimit ?? 0 : 0;
  let optionalUsed = 0;
  const supplementaryItems = [];
  const experienceIndicatorText = data.supplementaryIndicators?.experience?.[variantId] || data.supplementaryIndicators?.experience?.general;

  const experiences = data.experiences.map((experience) => {
    const included = experience.bullets
      .filter((bullet) => selected.has(bullet.id) && !hidden.has(bullet.id))
      .sort((a, b) => (priority.get(a.id) ?? 99) - (priority.get(b.id) ?? 99))
      .slice(0, variant.maxBulletsPerExperience);
    const omittedMandatory = experience.bullets.filter((bullet) => !included.some((item) => item.id === bullet.id));
    const optionalCandidates = (experience.optionalBullets || [])
      .filter((bullet) => (bullet.variantRelevance || []).includes(variantId))
      .sort((a, b) => (a.fillPriority ?? 99) - (b.fillPriority ?? 99));
    const optionalVisible = [];
    for (const bullet of optionalCandidates) {
      if (optionalUsed >= optionalLimit) break;
      optionalVisible.push(bullet);
      optionalUsed += 1;
    }
    const omittedOptional = optionalCandidates.filter((bullet) => !optionalVisible.some((item) => item.id === bullet.id));
    const omitted = [...omittedMandatory, ...omittedOptional];
    const showSupplementary = Boolean(experience.showSupplementaryWhenOmitted && omitted.length > 0 && experienceIndicatorText);
    if (showSupplementary) {
      supplementaryItems.push({
        type: 'experience',
        experienceId: experience.id,
        text: experience.supplementaryText || experienceIndicatorText,
        omittedBulletIds: omitted.map((bullet) => bullet.id),
      });
    }
    return {
      ...experience,
      bullets: included,
      optionalVisible,
      supplementaryText: showSupplementary ? (experience.supplementaryText || experienceIndicatorText) : '',
      omittedBulletIds: omitted.map((bullet) => bullet.id),
    };
  });

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
      items: supplementaryItems,
      optionalVisibleBulletIds: experiences.flatMap((experience) => experience.optionalVisible.map((bullet) => bullet.id)),
      omittedToolIds: omittedTools.map((tool) => tool.id),
      toolsIndicator,
    },
    fill: {
      enabled: Boolean(variant.fill?.enabled),
      optionalBulletLimit: optionalLimit,
      optionalBulletsUsed: optionalUsed,
      minRemainingSpaceMm: variant.fill?.minRemainingSpaceMm ?? 5,
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
    const bullets = [...experience.bullets, ...experience.optionalVisible];
    return `<article class="module experience" id="experience-${experience.id}" data-check data-collision-group="experiences"><div class="meta">${esc(experience.period)} <span>|</span> <strong>${esc(experience.role)}</strong></div><div class="employer">${experienceLine(experience)}</div>${experience.notes.map((note) => `<div class="note">${esc(note)}</div>`).join('')}<ul>${bullets.map((bullet) => `<li id="${bullet.id}" data-check>${esc(bullet.text)}</li>`).join('')}</ul>${experience.supplementaryText ? `<p class="supplementary experience-more" data-check>${esc(experience.supplementaryText)}</p>` : ''}</article>`;
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

  const metrics = await page.evaluate((bgExists, variantMeta) => {
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
    const experienceList = document.querySelector('#experience-list')?.getBoundingClientRect();
    const bottomGrid = document.querySelector('#bottom-grid')?.getBoundingClientRect();
    if (experienceList && bottomGrid) out.fill.experienceBottomGapPx = Math.round(bottomGrid.top - experienceList.bottom);
    if (document.querySelector('.summary p').textContent.length > 430) out.warnings.push('Summary exceeds 430 characters.');
    if (!out.assets.profile.loaded) out.warnings.push('Profile image did not load.');
    if ([out.fonts.heading, out.fonts.body, out.fonts.slab].some((font) => /Times New Roman/i.test(font))) out.warnings.push('Chromium fell back to Times New Roman.');
    if (!out.fonts.slabLoaded || !/Roboto Slab/i.test(out.fonts.slab)) out.warnings.push('Roboto Slab did not load for the summary heading.');
    if (!out.assets.background.exists || !out.assets.background.computed || !out.assets.background.rendered || !out.assets.background.coversFullPage || !out.assets.background.bottomZoneNotGray) out.warnings.push('Background image did not cover the full page.');
    return out;
  }, backgroundFileExists, { supplementary: cv.supplementary, fill: cv.fill });

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

const report = {
  success: renderer === 'playwright' && pageCount === 2 && metrics.overflows.length === 0 && metrics.collisions.length === 0 && metrics.warnings.length === 0,
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
  supplementary: metrics.supplementary,
  fill: metrics.fill,
};
writeFileSync(`dist/render-report-${variantId}.json`, JSON.stringify(report, null, 2));
console.log(`Rendered ${variantId} with ${renderer}: success=${report.success}, pages=${pageCount}, overflows=${report.overflows.length}, collisions=${report.collisions.length}`);
if (!report.success) process.exit(1);
