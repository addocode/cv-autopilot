import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const variants = ['general', 'communication-content', 'administration-gever', 'cms-web-process'];
mkdirSync('dist', { recursive: true });

function parseExitCode(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return { value: null, error: `${name} missing` };
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return { value: null, error: `${name} is not a non-negative integer: ${raw}` };
  return { value, error: null };
}

function readJson(path) {
  if (!existsSync(path)) return { present: false, data: null, error: null };
  try {
    return { present: true, data: JSON.parse(readFileSync(path, 'utf8')), error: null };
  } catch (error) {
    return { present: true, data: null, error: String(error?.message || error || '') };
  }
}

const renderAll = parseExitCode('RENDER_ALL_EXIT_CODE');
const renderTests = parseExitCode('RENDER_TESTS_EXIT_CODE');
const visualReview = readJson('dist/visual-review-round-17.json');
const reports = Object.fromEntries(variants.map((variant) => {
  const report = readJson(`dist/render-report-${variant}.json`);
  return [variant, report.present && report.data?.success === true];
}));
const inputErrors = [renderAll.error, renderTests.error].filter(Boolean);
const commandStatus = {
  renderAllExitCode: renderAll.value,
  renderTestsExitCode: renderTests.value,
  visualReviewPresent: visualReview.present && visualReview.error === null,
  visualReviewOverallSuccess: visualReview.data?.overallSuccess === true,
  reports,
  allReportsSuccessful: variants.every((variant) => reports[variant] === true),
  inputErrors,
  timestamp: new Date().toISOString(),
};

writeFileSync('dist/command-status.json', JSON.stringify(commandStatus, null, 2));
if (inputErrors.length > 0) process.exitCode = 1;
