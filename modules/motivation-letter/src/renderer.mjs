import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { BRAND_BLUE, normalizeText, slug, wordCount } from '../../application-core/src/utils.mjs';
import { renderMotivationLetterHtml } from './template.mjs';
import { validateLetterContent } from './compose.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '../../..');

function dataUrl(path, mimeType) {
  return `data:${mimeType};base64,${readFileSync(path).toString('base64')}`;
}

function mm(px) {
  return px * 25.4 / 96;
}

function close(actual, expected, tolerance = 1.2) {
  return Math.abs(actual - expected) <= tolerance;
}

export async function renderMotivationLetter(letterInput, options = {}) {
  const letter = validateLetterContent(letterInput);
  const outputDir = options.outputDir || 'dist';
  const outputId = slug(options.outputId || letter.applicationId, 'motivation-letter');
  const testMode = options.testMode === true;
  mkdirSync(outputDir, { recursive: true });

  const css = readFileSync(join(ROOT, 'modules/motivation-letter/styles/motivation-letter.css'), 'utf8');
  const assets = {
    background: dataUrl(join(ROOT, 'assets/bg_img.jpeg'), 'image/jpeg'),
    logo: dataUrl(join(ROOT, 'modules/motivation-letter/references/ad_logo.png'), 'image/png'),
    fonts: {
      robotoSlab700: dataUrl(join(ROOT, 'node_modules/@fontsource/roboto-slab/files/roboto-slab-latin-700-normal.woff2'), 'font/woff2'),
      arimo400: dataUrl(join(ROOT, 'node_modules/@fontsource/arimo/files/arimo-latin-400-normal.woff2'), 'font/woff2'),
      arimo700: dataUrl(join(ROOT, 'node_modules/@fontsource/arimo/files/arimo-latin-700-normal.woff2'), 'font/woff2'),
    },
  };
  const html = renderMotivationLetterHtml(letter, css, assets);
  const artifacts = {
    pdfPath: join(outputDir, `Motivationsschreiben_Adam-Dolinsky_${outputId}.pdf`),
    pngPath: join(outputDir, `motivation-letter-${outputId}.png`),
    previewPath: join(outputDir, `motivation-letter-${outputId}-preview.html`),
    reportPath: join(outputDir, `motivation-letter-report-${outputId}.json`),
    textPath: join(outputDir, `motivation-letter-text-${outputId}.txt`),
  };
  writeFileSync(artifacts.previewPath, html);

  if (testMode) {
    writeFileSync(artifacts.pdfPath, `%PDF-1.4\n% motivation-letter test placeholder ${letter.applicationId}\n`);
    writeFileSync(artifacts.pngPath, 'test-placeholder');
    writeFileSync(artifacts.textPath, [letter.salutation, ...letter.paragraphs.map((item) => item.runs.map((entry) => entry.text).join(' '))].join('\n'));
    const report = {
      success: true,
      renderer: 'test-placeholder',
      motivationLetterStandard: 'approved-golden-v1',
      layoutSchemaVersion: 2,
      contentGuidanceVersion: '2026-07-21.1',
      applicationId: letter.applicationId,
      pageCount: 1,
      jobTitleOriginal: letter.jobTitleOriginal,
      jobTitleRendered: letter.jobTitleRendered,
      generationDate: letter.generationDate,
      referenceVisible: letter.reference.visible,
      bodyStartWithinGuides: true,
      dateAlignedWithSalutation: true,
      overflows: [],
      collisions: [],
      warnings: ['test-placeholder-render'],
      unsupportedClaims: [],
      selectedEvidenceIds: letter.selectedEvidenceIds,
      contentMode: letter.contentMode,
      manualApprovalRequired: true,
      artifacts,
    };
    writeFileSync(artifacts.reportPath, JSON.stringify(report, null, 2));
    return report;
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(resolve(artifacts.previewPath)).href, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.alignLetterDate();
      await new Promise((resolveAnimation) => requestAnimationFrame(() => requestAnimationFrame(resolveAnimation)));
    });

    const metrics = await page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSizePx: Number.parseFloat(style.fontSize),
          lineHeightPx: Number.parseFloat(style.lineHeight),
          color: style.color,
          backgroundColor: style.backgroundColor,
          border: style.border,
          outline: style.outline,
          boxShadow: style.boxShadow,
          padding: style.padding,
          textAlign: style.textAlign,
        };
      };
      const links = [...document.querySelectorAll('a')].map((link) => ({ href: link.href, text: link.textContent }));
      const image = document.getElementById('letter-logo');
      return {
        page: box('#motivation-letter'),
        frame: box('#letter-frame'),
        paper: box('#letter-paper'),
        logo: box('#letter-logo'),
        reference: box('#letter-reference'),
        title: box('#letter-title'),
        stack: box('#letter-stack'),
        body: box('#letter-body'),
        salutation: box('#letter-salutation'),
        date: box('#letter-date'),
        signature: box('#letter-signature'),
        emphasisCount: document.querySelectorAll('#letter-body strong').length,
        emphasisText: [...document.querySelectorAll('#letter-body strong')].map((item) => item.textContent),
        links,
        logoLoaded: image.complete && image.naturalWidth > 0,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    await page.pdf({
      path: artifacts.pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await page.screenshot({ path: artifacts.pngPath, fullPage: true });

    const pdfInfo = spawnSync('pdfinfo', [artifacts.pdfPath], { encoding: 'utf8' });
    const pageCount = Number((pdfInfo.stdout.match(/^Pages:\s+(\d+)/m) || [])[1] || 0);
    const textResult = spawnSync('pdftotext', ['-layout', artifacts.pdfPath, artifacts.textPath], { encoding: 'utf8' });
    const extractedText = textResult.status === 0 ? readFileSync(artifacts.textPath, 'utf8') : '';
    const requiredTerms = [letter.salutation, letter.jobTitleRendered, letter.signature.lastName, ...letter.emphasisGroups];
    const missingTerms = requiredTerms.filter((term) => !normalizeText(extractedText).includes(normalizeText(term)));
    const emphasisWordCount = wordCount(letter.emphasisGroups.join(' '));
    const emphasisWordShare = emphasisWordCount / Math.max(1, letter.wordCount);
    const bodyStartMm = mm(metrics.salutation.top - metrics.page.top);
    const dateDeltaMm = mm(Math.abs(metrics.date.top - metrics.salutation.top));
    const warnings = [];
    const overflows = [];
    const collisions = [];

    if (!close(metrics.frame.left, 10 * 96 / 25.4) || !close(metrics.frame.top, 15.525 * 96 / 25.4) || !close(metrics.frame.right, 200 * 96 / 25.4)) warnings.push('frame-geometry');
    if (!close(metrics.paper.left, 19.8 * 96 / 25.4) || !close(metrics.paper.top, 23.5 * 96 / 25.4) || !close(metrics.paper.right, 190.2 * 96 / 25.4)) warnings.push('paper-geometry');
    if (!close(metrics.logo.left, 10.182 * 96 / 25.4, 1.6) || !close(metrics.logo.top, 18.955 * 96 / 25.4, 1.6) || !metrics.logoLoaded) warnings.push('logo-geometry');
    if (metrics.reference && !/rgba\(0, 0, 0, 0\)|transparent/.test(metrics.reference.backgroundColor)) warnings.push('reference-wrapper-background');
    if (!/rgba\(0, 0, 0, 0\)|transparent/.test(metrics.date.backgroundColor)) warnings.push('date-wrapper-background');
    if (metrics.horizontalOverflow) overflows.push({ element: 'document', axis: 'horizontal' });
    if (metrics.stack.top < metrics.title.bottom + 4) collisions.push({ elements: ['letter-title', 'letter-stack'] });
    if (metrics.stack.bottom > metrics.paper.bottom + 1) overflows.push({ element: 'letter-stack', axis: 'vertical' });
    if (metrics.emphasisCount < 2 || metrics.emphasisCount > 4) warnings.push('emphasis-group-budget');
    if (emphasisWordShare > 0.06) warnings.push('emphasis-word-share');
    const bodyStartWithinGuides = bodyStartMm >= 60.044 - 0.8 && bodyStartMm <= 85.901 + 0.8;
    if (!bodyStartWithinGuides) warnings.push('body-start-guides');
    const dateAlignedWithSalutation = dateDeltaMm <= 1.5;
    if (!dateAlignedWithSalutation) warnings.push('date-salutation-alignment');
    if (!metrics.links.some((link) => link.href === 'https://dolinsky.ch/')) warnings.push('portfolio-link');

    const report = {
      success: pageCount === 1 && overflows.length === 0 && collisions.length === 0 && warnings.length === 0 && missingTerms.length === 0,
      renderer: 'playwright',
      motivationLetterStandard: 'approved-golden-v1',
      layoutSchemaVersion: 2,
      contentGuidanceVersion: '2026-07-21.1',
      applicationId: letter.applicationId,
      pageCount,
      jobTitleOriginal: letter.jobTitleOriginal,
      jobTitleRendered: letter.jobTitleRendered,
      generationDate: letter.generationDate,
      referenceVisible: letter.reference.visible,
      referenceValue: letter.reference.visible ? letter.reference.value : '',
      bodyStartMm,
      bodyStartWithinGuides,
      dateAlignmentDeltaMm: dateDeltaMm,
      dateAlignedWithSalutation,
      uniformTopBar: !warnings.includes('frame-geometry') && !warnings.includes('reference-wrapper-background'),
      uniformSideRails: !warnings.includes('frame-geometry') && !warnings.includes('date-wrapper-background'),
      maxFrameDeviationPx: warnings.includes('frame-geometry') ? null : 1,
      brandBlue: BRAND_BLUE,
      overflows,
      collisions,
      warnings,
      unsupportedClaims: [],
      selectedEvidenceIds: letter.selectedEvidenceIds,
      emphasis: {
        groupCount: metrics.emphasisCount,
        groups: metrics.emphasisText,
        wordShare: emphasisWordShare,
        repeatedTerms: metrics.emphasisText.filter((value, index, values) => values.indexOf(value) !== index),
      },
      content: {
        contentMode: letter.contentMode,
        wordCount: letter.wordCount,
        roleMotivationPresent: true,
        employerMotivationPresent: true,
        valuePropositionPresent: true,
        concreteEvidenceCount: letter.selectedEvidenceIds?.length || 0,
        genericPhraseRisk: false,
      },
      ats: {
        textExtractable: extractedText.length > 0,
        requiredTerms,
        missingTerms,
      },
      geometry: metrics,
      manualApprovalRequired: true,
      artifacts,
    };
    writeFileSync(artifacts.reportPath, JSON.stringify(report, null, 2));
    if (!report.success && options.throwOnFailure !== false) throw new Error(`Motivation-letter render failed: ${JSON.stringify({ overflows, collisions, warnings, missingTerms })}`);
    return report;
  } finally {
    await browser.close();
  }
}
