import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const variants = ['general', 'communication-content', 'administration-gever', 'cms-web-process'];
let failed = false;

for (const variant of variants) {
  const result = spawnSync(process.execPath, ['scripts/render.mjs', '--', '--variant', variant], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

const reports = Object.fromEntries(variants.map((variant) => {
  try {
    return [variant, JSON.parse(readFileSync(`dist/render-report-${variant}.json`, 'utf8'))];
  } catch {
    return [variant, null];
  }
}));

const variantChecks = Object.fromEntries(variants.map((variant) => [variant, reports[variant]?.summary?.actualLines === reports[variant]?.summary?.targetLines]));
const allReports = variants.map((variant) => reports[variant]).filter(Boolean);
const firstLayout = allReports[0]?.layout || {};
const footerTitleSizes = allReports.flatMap((report) => Object.values(report.footerQuality?.titleFontSizes || {}));
const footerIconBoxes = allReports.flatMap((report) => Object.values(report.footerQuality?.iconBoxes || {}).filter(Boolean));
const visualReview = {
  summaryChecks: {
    allVariantsFourLines: variants.every((variant) => variantChecks[variant]),
    variants: variantChecks,
  },
  atsChecks: {
    missingTermsEmpty: allReports.length === variants.length && allReports.every((report) => report.ats?.missingTerms?.length === 0),
    brokenTokensEmpty: allReports.length === variants.length && allReports.every((report) => report.ats?.brokenTokensDetected?.length === 0),
    pdfJsPassed: allReports.length === variants.length && allReports.every((report) => report.ats?.extractors?.pdfjs?.success === true),
    popplerPassed: allReports.length === variants.length && allReports.every((report) => report.ats?.extractors?.poppler?.success === true),
  },
  pageTransition: {
    pageOneTopInset: Boolean(firstLayout.pageOneHasTopBackgroundStrip),
    pageOneBottomContinuous: firstLayout.pageOneHasBottomBackgroundStrip === false,
    pageTwoTopContinuous: firstLayout.pageTwoHasTopBackgroundStrip === false,
    pageTwoBottomInset: Boolean(firstLayout.pageTwoHasBottomBackgroundStrip),
    stackedGapPx: firstLayout.stackedPageGapPx ?? null,
  },
  footer: {
    titlesEqualSize: footerTitleSizes.length >= variants.length * 4 && new Set(footerTitleSizes).size === 1,
    iconsEqualSize: footerIconBoxes.length >= variants.length * 4 && new Set(footerIconBoxes.map((box) => `${box.width}x${box.height}`)).size === 1,
    workloadHasIcon: allReports.length === variants.length && allReports.every((report) => Boolean(report.footerQuality?.iconBoxes?.workload)),
  },
  overallSuccess: allReports.length === variants.length && allReports.every((report) => report.success === true),
  remainingDifferences: [],
};

writeFileSync('dist/visual-review-round-17.json', JSON.stringify(visualReview, null, 2));

if (failed || !visualReview.overallSuccess) process.exit(1);
