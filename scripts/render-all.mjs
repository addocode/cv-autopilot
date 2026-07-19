import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const variants = ['general', 'communication-content', 'administration-gever', 'cms-web-process'];
let failed = false;
const renderResults = {};

for (const variant of variants) {
  const result = spawnSync(process.execPath, ['scripts/render.mjs', '--', '--variant', variant], { stdio: 'inherit' });
  const success = result.status === 0;
  renderResults[variant] = { exitCode: result.status, success };
  if (success) {
    console.log(`[${variant}] render succeeded`);
  } else {
    failed = true;
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
const expectedFiles = [
  ...variants.map((variant) => `dist/Lebenslauf_Adam-Dolinsky_${variant}.pdf`),
  ...variants.flatMap((variant) => [`dist/cv-${variant}-page-1.png`, `dist/cv-${variant}-page-2.png`]),
  ...variants.map((variant) => `dist/cv-${variant}-preview.html`),
  ...variants.map((variant) => `dist/render-report-${variant}.json`),
  ...variants.map((variant) => `dist/text-${variant}-poppler.txt`),
];
const distFiles = existsSync('dist') ? readdirSync('dist') : [];
const artifactCompleteness = {
  pdfCount: distFiles.filter((file) => /^Lebenslauf_Adam-Dolinsky_.*\.pdf$/.test(file)).length,
  pngCount: distFiles.filter((file) => /^cv-.*-page-[12]\.png$/.test(file)).length,
  htmlCount: distFiles.filter((file) => /^cv-.*-preview\.html$/.test(file)).length,
  reportCount: distFiles.filter((file) => /^render-report-.*\.json$/.test(file)).length,
  popplerTextCount: distFiles.filter((file) => /^text-.*-poppler\.txt$/.test(file)).length,
  expected: { pdfCount: 4, pngCount: 8, htmlCount: 4, reportCount: 4, popplerTextCount: 4 },
  missingFiles: expectedFiles.filter((file) => !existsSync(file)),
  complete: false,
};
artifactCompleteness.complete = artifactCompleteness.missingFiles.length === 0
  && artifactCompleteness.pdfCount === artifactCompleteness.expected.pdfCount
  && artifactCompleteness.pngCount === artifactCompleteness.expected.pngCount
  && artifactCompleteness.htmlCount === artifactCompleteness.expected.htmlCount
  && artifactCompleteness.reportCount === artifactCompleteness.expected.reportCount
  && artifactCompleteness.popplerTextCount === artifactCompleteness.expected.popplerTextCount;
if (artifactCompleteness.missingFiles.length) {
  console.error('Missing render artifacts:');
  for (const file of artifactCompleteness.missingFiles) console.error(file);
}

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
const overallSuccess = allReportsPresent
  && artifactCompleteness.complete
  && allReports.every((report) => report.success === true);
const visualReview = {
  reportsPresent,
  renderResults,
  artifactCompleteness,
  summaryChecks: {
    allVariantsFourLines: variants.every((variant) => variantChecks[variant]),
    variants: variantChecks,
  },
  atsChecks: {
    missingTermsEmpty: allReportsPresent && allReports.every((report) => report.ats?.missingTerms?.length === 0),
    brokenTokensEmpty: allReportsPresent && allReports.every((report) => report.ats?.brokenTokensDetected?.length === 0),
    pdfJsPassed: allReportsPresent && allReports.every((report) => report.ats?.extractors?.pdfjs?.success === true),
    popplerPassed: allReportsPresent && allReports.every((report) => report.ats?.extractors?.poppler?.success === true),
  },
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
  remainingDifferences: overallSuccess ? [] : ['Production render failed before PDF/report generation'],
};

writeFileSync('dist/visual-review-round-17.json', JSON.stringify(visualReview, null, 2));

if (failed || !visualReview.overallSuccess) process.exit(1);
