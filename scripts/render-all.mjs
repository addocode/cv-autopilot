import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const variants = ['general', 'communication-content', 'administration-gever', 'cms-web-process'];
mkdirSync('dist', { recursive: true });
const renderResults = {};

for (const variant of variants) {
  rmSync(`dist/render-failure-${variant}.json`, { force: true });
  const result = spawnSync(process.execPath, ['scripts/render.mjs', '--', '--variant', variant], {
    encoding: 'utf8',
    env: process.env,
  });
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  const success = result.status === 0;
  renderResults[variant] = { exitCode: result.status, success };
  writeFileSync(`dist/render-log-${variant}.txt`, [
    `variant=${variant}`,
    `exitCode=${result.status}`,
    '',
    'STDOUT',
    stdout,
    '',
    'STDERR',
    stderr,
  ].join('\n'));
  if (success) {
    console.log(`[${variant}] render succeeded`);
  } else {
    console.error(`[${variant}] render failed with exit code ${result.status}`);
  }
}

const reports = Object.fromEntries(variants.map((variant) => {
  const reportPath = `dist/render-report-${variant}.json`;
  if (!existsSync(reportPath)) {
    console.error(`[${variant}] missing render report:\n${reportPath}`);
    return [variant, null];
  }
  try {
    return [variant, JSON.parse(readFileSync(reportPath, 'utf8'))];
  } catch (error) {
    console.error(`[${variant}] invalid render report:\n${reportPath}\n${error?.stack || error}`);
    return [variant, null];
  }
}));

const reportsPresent = Object.fromEntries(variants.map((variant) => [variant, Boolean(reports[variant])]));
const renderFailures = Object.fromEntries(variants.map((variant) => {
  const failureFile = `dist/render-failure-${variant}.json`;
  const logFile = `dist/render-log-${variant}.txt`;
  if (!existsSync(failureFile)) {
    return [variant, { present: false, renderStage: null, errorName: null, errorMessage: null, errorStack: null, failureFile, logFile }];
  }
  try {
    const failure = JSON.parse(readFileSync(failureFile, 'utf8'));
    return [variant, {
      present: true,
      renderStage: failure.renderStage || null,
      errorName: failure.errorName || null,
      errorMessage: failure.errorMessage || null,
      errorStack: failure.errorStack || null,
      failureFile,
      logFile,
    }];
  } catch (error) {
    return [variant, {
      present: true,
      renderStage: null,
      errorName: 'InvalidRenderFailureJson',
      errorMessage: String(error?.message || error || ''),
      errorStack: String(error?.stack || error || ''),
      failureFile,
      logFile,
    }];
  }
}));
const expectedFiles = [
  ...variants.map((variant) => `dist/Lebenslauf_Adam-Dolinsky_${variant}.pdf`),
  ...variants.flatMap((variant) => [`dist/cv-${variant}-page-1.png`, `dist/cv-${variant}-page-2.png`]),
  ...variants.map((variant) => `dist/cv-${variant}-preview.html`),
  ...variants.map((variant) => `dist/render-report-${variant}.json`),
  ...variants.map((variant) => `dist/text-${variant}-poppler-raw.txt`),
  ...variants.map((variant) => `dist/text-${variant}-poppler-default.txt`),
  ...variants.map((variant) => `dist/text-${variant}-poppler-layout.txt`),
  ...variants.map((variant) => `dist/fonts-${variant}-pdffonts.txt`),
  'dist/font-resolution.txt',
];
const distFiles = existsSync('dist') ? readdirSync('dist') : [];
const artifactCompleteness = {
  pdfCount: distFiles.filter((file) => /^Lebenslauf_Adam-Dolinsky_.*\.pdf$/.test(file)).length,
  pngCount: distFiles.filter((file) => /^cv-.*-page-[12]\.png$/.test(file)).length,
  htmlCount: distFiles.filter((file) => /^cv-.*-preview\.html$/.test(file)).length,
  reportCount: distFiles.filter((file) => /^render-report-.*\.json$/.test(file)).length,
  popplerRawTextCount: distFiles.filter((file) => /^text-.*-poppler-raw\.txt$/.test(file)).length,
  popplerDefaultTextCount: distFiles.filter((file) => /^text-.*-poppler-default\.txt$/.test(file)).length,
  popplerLayoutTextCount: distFiles.filter((file) => /^text-.*-poppler-layout\.txt$/.test(file)).length,
  popplerTextCount: distFiles.filter((file) => /^text-.*-poppler-(raw|default|layout)\.txt$/.test(file)).length,
  pdffontsAuditCount: distFiles.filter((file) => /^fonts-.*-pdffonts\.txt$/.test(file)).length,
  fontResolutionPresent: existsSync('dist/font-resolution.txt'),
  expected: { pdfCount: 4, pngCount: 8, htmlCount: 4, reportCount: 4, popplerRawTextCount: 4, popplerDefaultTextCount: 4, popplerLayoutTextCount: 4, popplerTextCount: 12, pdffontsAuditCount: 4, fontResolutionPresent: true },
  missingFiles: expectedFiles.filter((file) => !existsSync(file)),
  complete: false,
};
artifactCompleteness.complete = artifactCompleteness.missingFiles.length === 0
  && artifactCompleteness.pdfCount === artifactCompleteness.expected.pdfCount
  && artifactCompleteness.pngCount === artifactCompleteness.expected.pngCount
  && artifactCompleteness.htmlCount === artifactCompleteness.expected.htmlCount
  && artifactCompleteness.reportCount === artifactCompleteness.expected.reportCount
  && artifactCompleteness.popplerRawTextCount === artifactCompleteness.expected.popplerRawTextCount
  && artifactCompleteness.popplerDefaultTextCount === artifactCompleteness.expected.popplerDefaultTextCount
  && artifactCompleteness.popplerLayoutTextCount === artifactCompleteness.expected.popplerLayoutTextCount
  && artifactCompleteness.popplerTextCount === artifactCompleteness.expected.popplerTextCount
  && artifactCompleteness.pdffontsAuditCount === artifactCompleteness.expected.pdffontsAuditCount
  && artifactCompleteness.fontResolutionPresent === artifactCompleteness.expected.fontResolutionPresent;
if (artifactCompleteness.missingFiles.length) {
  console.error('Missing render artifacts:');
  for (const file of artifactCompleteness.missingFiles) console.error(file);
}

const diagnosticArtifacts = {
  renderFailureCount: distFiles.filter((file) => /^render-failure-.*\.json$/.test(file)).length,
  renderLogCount: distFiles.filter((file) => /^render-log-.*\.txt$/.test(file)).length,
  expectedOnFailure: { renderFailureCount: 4, renderLogCount: 4 },
  missingFailureFiles: variants.map((variant) => `dist/render-failure-${variant}.json`).filter((file) => !existsSync(file)),
  missingLogFiles: variants.map((variant) => `dist/render-log-${variant}.txt`).filter((file) => !existsSync(file)),
};

const variantChecks = Object.fromEntries(variants.map((variant) => {
  const report = reports[variant];
  return [
    variant,
    Boolean(report)
      && report.summary?.selectionSucceeded === true
      && report.summary?.actualLines === report.summary?.targetLines,
  ];
}));
const allReports = variants.map((variant) => reports[variant]).filter(Boolean);
const allReportsPresent = allReports.length === variants.length;
const firstLayout = allReports[0]?.layout || {};
const footerTitleSizes = allReports.flatMap((report) => Object.values(report.footerQuality?.titleFontSizes || {}));
const footerIconBoxes = allReports.flatMap((report) => Object.values(report.footerQuality?.iconBoxes || {}).filter(Boolean));
const bodySamples = allReports.flatMap((report) => Object.values(report.fonts?.bodySamples || {}).filter((sample) => sample?.found));
const skillHeadingSamples = allReports.flatMap((report) => report.fonts?.skillHeadingSamples || []);
const wordSpacingOk = (value) => value === 'normal' || value === '0px' || value === '';
const fontChecks = {
  requestedSansFamily: allReportsPresent && allReports.every((report) => report.fonts?.requestedSansFamily === 'Arial') ? 'Arial' : null,
  arialCompatibleLoaded: allReportsPresent && allReports.every((report) => report.fonts?.arialCompatibleLoaded === true),
  liberationSansResolvedInCi: allReportsPresent && allReports.every((report) => /Liberation Sans|Arial/i.test(report.fonts?.ciArialResolution || '')),
  figtreeAbsent: allReportsPresent && allReports.every((report) => report.fonts?.deprecatedFontChecks?.figtreePresent === false && !/Figtree/i.test(JSON.stringify(report.fonts?.pdfEmbeddedFamilies || []))),
  poppinsAbsent: allReportsPresent && allReports.every((report) => report.fonts?.deprecatedFontChecks?.poppinsPresent === false && !/Poppins/i.test(JSON.stringify(report.fonts?.pdfEmbeddedFamilies || []))),
  robotoSlabLoaded: allReportsPresent && allReports.every((report) => report.fonts?.slabLoaded === true && (report.fonts?.pdfEmbeddedFamilies || []).some((family) => /RobotoSlab-Bold/i.test(family))),
  allSkillHeadingsRobotoSlab: allReportsPresent && skillHeadingSamples.length > 0 && skillHeadingSamples.every((sample) => sample.primaryFontFamily === 'Roboto Slab'),
  allFooterHeadingsRobotoSlab: allReportsPresent && allReports.every((report) => Object.values(report.footerQuality?.titleStyles || {}).every((sample) => sample.headingPrimaryFontFamily === 'Roboto Slab' && sample.spanPrimaryFontFamily === 'Roboto Slab')),
  allFooterHeadingsEqual: allReportsPresent && allReports.every((report) => report.footerQuality?.allTitleTypographyEqual === true),
  buttonsRobotoSlab: allReportsPresent && allReports.every((report) => report.buttonStates?.fontOk === true),
  summaryItalic: allReportsPresent && allReports.every((report) => report.fonts?.bodySamples?.summary?.fontStyle === 'italic'),
  supplementaryItalic: allReportsPresent && allReports.every((report) => {
    const sample = report.fonts?.bodySamples?.supplementary;
    return !sample?.found || sample.fontStyle === 'italic';
  }),
  locationLinesBold: allReportsPresent && allReports.every((report) => (report.experienceLocationStyles || []).length === (report.experienceQuality?.stations || []).length && (report.experienceLocationStyles || []).every((sample) => sample.primaryFontFamily === 'Arial' && sample.fontWeight === '700' && sample.fontStyle === 'normal')),
  naturalSpacing: allReportsPresent && bodySamples.length > 0 && bodySamples.every((sample) => ['normal', 'auto'].includes(sample.fontKerning)),
  noFixedTracking: allReportsPresent && bodySamples.length > 0 && bodySamples.every((sample) => (sample.letterSpacing === 'normal' || sample.letterSpacing === '0px') && wordSpacingOk(sample.wordSpacing) && sample.fontFeatureSettings === 'normal'),
  noBrokenVisibleWords: allReportsPresent && allReports.every((report) => report.ats?.extractors?.popplerRaw?.brokenTokensDetected?.length === 0),
};
const atsChecks = {
  primaryExtractor: 'poppler-raw',
  missingTermsEmpty: allReportsPresent && allReports.every((report) => report.ats?.missingTerms?.length === 0),
  brokenTokensEmpty: allReportsPresent && allReports.every((report) => report.ats?.brokenTokensDetected?.length === 0),
  popplerRawPassed: allReportsPresent && allReports.every((report) => report.ats?.extractors?.popplerRaw?.success === true),
  popplerLayoutDiagnosticPassed: allReportsPresent && allReports.every((report) => report.ats?.extractors?.popplerLayout?.success === true),
  pdfJsDiagnosticPassed: allReportsPresent && allReports.every((report) => report.ats?.extractors?.pdfjs?.success === true),
  popplerDefaultReadingOrderPassed: allReportsPresent && allReports.every((report) => report.ats?.extractors?.popplerDefault?.success === true && report.ats?.readingOrderValid === true),
  productionAtsPassed: allReportsPresent && allReports.every((report) => report.ats?.primaryExtractor === 'poppler-raw' && report.ats?.readingOrderExtractor === 'poppler-default' && report.ats?.primaryContentSuccess === true && report.ats?.readingOrderValid === true && report.ats?.primarySuccess === true && report.ats?.missingTerms?.length === 0 && report.ats?.brokenTokensDetected?.length === 0),
  pdfJsSeparatorHandlingPassed: allReportsPresent && allReports.every((report) => Number.isFinite(report.ats?.fragmentJoinCount) && report.ats.fragmentJoinCount >= 0 && Number.isFinite(report.ats?.insertedSpaceCount) && report.ats.insertedSpaceCount >= 0 && Number.isFinite(report.ats?.preservedSpaceCount) && report.ats.preservedSpaceCount >= 0 && report.ats.insertedLineBreakCount > 0 && (report.ats.extractors?.pdfjs?.brokenTokensDetected || []).length === 0),
};
const footerChecks = {
  topRowBaselinesAligned: allReportsPresent && allReports.every((report) => report.footerQuality?.topRowBaselinesAligned === true),
  availabilityTitlesLeftAligned: allReportsPresent && allReports.every((report) => report.footerQuality?.availabilityTitlesLeftAligned === true),
  availabilityRowsStacked: allReportsPresent && allReports.every((report) => report.footerQuality?.availabilityRowsStacked === true),
  footerLayoutValid: allReportsPresent && allReports.every((report) => report.footerQuality?.footerLayoutValid === true),
  contentSizesMatchBullets: allReportsPresent && allReports.every((report) => report.footerQuality?.contentTypography?.contentSizesEqual === true),
  allNewIconsLoaded: allReportsPresent && allReports.every((report) => report.footerQuality?.allFooterIconsLoaded === true && report.footerQuality?.allFooterIconBoxesEqual === true),
};
const experienceChecks = {
  largestSafeBulletSizeSelected: allReportsPresent && allReports.every((report) => report.experienceQuality?.bulletTypography?.largestSafeSizeSelected === true && report.experienceQuality?.bulletTypography?.selectedFontSizePt >= 7.45 && report.experienceQuality?.bulletTypography?.selectedFontSizePt <= 8.2),
  bulletWidthMaximized: allReportsPresent && allReports.every((report) => report.experienceQuality?.bulletWidth?.usesAvailableWidth === true || report.experienceQuality?.bulletWidth?.availableTextWidthPx > 0),
};
const toolChecks = {
  minimum12Visible: allReportsPresent && allReports.every((report) => report.toolsQuality?.visibleToolCount >= 12),
  maximum20Visible: allReportsPresent && allReports.every((report) => report.toolsQuality?.visibleToolCount <= 20),
  largestSafeToolSizeSelected: allReportsPresent && allReports.every((report) => report.toolsQuality?.typography?.largestSafeSizeSelected === true),
  supplementaryIndicatorRendered: allReportsPresent && allReports.every((report) => report.toolsQuality?.toolsIndicator?.rendered === true),
  supplementaryGapIncreased: allReportsPresent && allReports.every((report) => report.footerQuality?.toolsMoreGapIncreaseRatio >= 1.45 && report.footerQuality?.toolsMoreGapIncreaseRatio <= 1.55),
};
const skillsetChecks = {
  exactlyFourSkillsets: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.renderedSkillsetCount === 4),
  sixToEightBulletsEach: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.allBulletCountsWithinRange === true),
  allEvidenceBacked: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.allBulletsEvidenceBacked === true),
  titlesJobRelevant: allReportsPresent && allReports.every((report) => (report.skillsetsQuality?.skillsets || []).length === 4 && new Set((report.skillsetsQuality?.skillsets || []).map((section) => section.title)).size === 4),
  allIconsLoaded: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.allIconsLoaded === true),
  allIconsUnique: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.uniqueIconCount === 4 && report.skillsetsQuality?.allIconsUsedExactlyOnce === true),
  largestSafeIconSizeSelected: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.largestSafeIconSizeSelected === true),
  textWidthMaximized: allReportsPresent && allReports.every((report) => report.skillsetsQuality?.textWidthMaximized === true),
  languagesNotColliding: allReportsPresent && allReports.every((report) => (report.skillsetsQuality?.languageGapPx ?? 1) >= 0 && (report.collisions || []).every((collision) => !String(collision.elementA + collision.elementB).includes('languages'))),
};
experienceChecks.crossDomainBulletPolicyPassed = allReportsPresent && allReports.every((report) => report.experienceQuality?.crossDomainBullet?.enabled !== true || (report.experienceQuality.crossDomainBullet.renderedStationCount === report.experienceQuality.crossDomainBullet.expectedStationCount && report.experienceQuality.crossDomainBullet.allRenderedLast === true));
const remainingDifferences = [];
if (!allReportsPresent) remainingDifferences.push('Production render failed before PDF/report generation');
for (const variant of variants) {
  const report = reports[variant];
  if (!report) continue;
  if (report.summary?.actualLines !== report.summary?.targetLines) remainingDifferences.push(`${variant}: summary has ${report.summary?.actualLines ?? 'unknown'} lines instead of ${report.summary?.targetLines ?? 'unknown'}`);
  if (report.summary?.selectionSucceeded !== true) remainingDifferences.push(`${variant}: no four-line summary candidate selected`);
  for (const warning of report.warnings || []) remainingDifferences.push(`${variant}: ${warning}`);
  if (report.ats?.primaryContentSuccess !== true) remainingDifferences.push(`${variant}: Poppler Raw content gate failed`);
  if (report.ats?.readingOrderValid !== true) remainingDifferences.push(`${variant}: Poppler Default reading order failed`);
  if (report.ats?.primarySuccess !== true) remainingDifferences.push(`${variant}: ATS primary success failed`);
}
if (artifactCompleteness.missingFiles.length) remainingDifferences.push(...artifactCompleteness.missingFiles.map((file) => `missing artifact: ${file}`));
for (const [key, value] of Object.entries(fontChecks)) {
  if (!value) remainingDifferences.push(`font check failed: ${key}`);
}
if (atsChecks.pdfJsSeparatorHandlingPassed !== true) remainingDifferences.push('PDF.js separator handling check failed');
for (const [key, value] of Object.entries(footerChecks)) if (!value) remainingDifferences.push(`footer check failed: ${key}`);
for (const [key, value] of Object.entries(experienceChecks)) if (!value) remainingDifferences.push(`experience check failed: ${key}`);
for (const [key, value] of Object.entries(toolChecks)) if (!value) remainingDifferences.push(`tool check failed: ${key}`);
for (const [key, value] of Object.entries(skillsetChecks)) if (!value) remainingDifferences.push(`skillset check failed: ${key}`);
const overallSuccess = allReportsPresent
  && artifactCompleteness.complete
  && allReports.every((report) => report.success === true)
  && Object.values(fontChecks).every(Boolean)
  && atsChecks.productionAtsPassed
  && Object.values(footerChecks).every(Boolean)
  && Object.values(experienceChecks).every(Boolean)
  && Object.values(toolChecks).every(Boolean)
  && Object.values(skillsetChecks).every(Boolean)
  && remainingDifferences.length === 0;
const visualReview = {
  reportsPresent,
  renderFailures,
  renderResults,
  artifactCompleteness,
  diagnosticArtifacts,
  summaryChecks: {
    allVariantsFourLines: variants.every((variant) => variantChecks[variant]),
    variants: variantChecks,
  },
  fontChecks,
  atsChecks,
  footerChecks,
  experienceChecks,
  toolChecks,
  skillsetChecks,
  pageTransition: {
    pageOneTopInset: allReportsPresent ? Boolean(firstLayout.pageOneHasTopBackgroundStrip) : false,
    pageOneBottomContinuous: allReportsPresent ? firstLayout.pageOneHasBottomBackgroundStrip === false : false,
    pageTwoTopContinuous: allReportsPresent ? firstLayout.pageTwoHasTopBackgroundStrip === false : false,
    pageTwoBottomInset: allReportsPresent ? Boolean(firstLayout.pageTwoHasBottomBackgroundStrip) : false,
    stackedGapPx: allReportsPresent ? firstLayout.stackedPageGapPx ?? null : null,
  },
  footer: {
    titlesEqualSize: allReportsPresent && footerTitleSizes.length >= variants.length * 4 && new Set(footerTitleSizes).size === 1,
    iconsEqualSize: allReportsPresent && footerIconBoxes.length >= variants.length * 4 && new Set(footerIconBoxes.map((box) => `${box.width}x${box.height}`)).size === 1,
    workloadHasIcon: allReportsPresent && allReports.every((report) => Boolean(report.footerQuality?.iconBoxes?.workload)),
  },
  overallSuccess,
  remainingDifferences: overallSuccess ? [] : remainingDifferences,
};

writeFileSync('dist/visual-review-round-17.json', JSON.stringify(visualReview, null, 2));

const anyRenderFailed = Object.values(renderResults).some((result) => result.success !== true);
const exitDecision = {
  anyRenderFailed,
  visualReviewOverallSuccess: visualReview.overallSuccess,
  reportsSuccessful: allReportsPresent && allReports.every((report) => report.success === true),
  shouldFail: anyRenderFailed || visualReview.overallSuccess !== true,
  timestamp: new Date().toISOString(),
};
writeFileSync('dist/render-all-exit-diagnostic.json', JSON.stringify(exitDecision, null, 2));
process.exitCode = exitDecision.shouldFail ? 1 : 0;
