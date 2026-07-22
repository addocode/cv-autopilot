import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const lockPath = 'layout-lock.json';
const canonicalFiles = [
  'assets/bg_img.jpeg',
  'assets/profile_img.png',
  'assets/icons/footer/eintritt.svg',
  'assets/icons/footer/pensum.svg',
  'assets/icons/footer/referenzen.svg',
  'assets/icons/footer/software-tools.svg',
  'assets/icons/skills/skill-content-media.svg',
  'assets/icons/skills/skill-digital-web.svg',
  'assets/icons/skills/skill-systems-processes.svg',
  'assets/icons/skills/skill-workstyle-organization.svg',
  'src/styles/tokens.css',
  'src/styles/cv.css',
  'src/templates/cv.ts',
  'scripts/render.mjs',
  'modules/motivation-letter/layout-reference.json',
  'modules/motivation-letter/references/ad_logo.png',
  'modules/motivation-letter/styles/motivation-letter.css',
  'modules/motivation-letter/src/template.mjs',
  'modules/motivation-letter/src/renderer.mjs',
  'modules/rav-recap/mobile-template.html',
  'modules/rav-recap/src/render.mjs',
];

function hash(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const missingFiles = canonicalFiles.filter((path) => !existsSync(path));
if (missingFiles.length) throw new Error(`Canonical layout files missing: ${missingFiles.join(', ')}`);
const current = Object.fromEntries(canonicalFiles.map((path) => [path, hash(path)]));

if (process.argv.includes('--write')) {
  const lock = {
    schemaVersion: 1,
    algorithm: 'sha256',
    policy: 'Application data runs must not modify these files. Update hashes only in an explicitly approved layout-change task.',
    files: current,
  };
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(JSON.stringify({ success: true, mode: 'write', lockedFiles: canonicalFiles.length }, null, 2));
  process.exit(0);
}

if (!existsSync(lockPath)) throw new Error(`${lockPath} is missing; run this script with --write only during the approved integration setup.`);
const expected = JSON.parse(readFileSync(lockPath, 'utf8'));
const mismatches = canonicalFiles.filter((path) => expected.files?.[path] !== current[path]);
const unexpected = Object.keys(expected.files || {}).filter((path) => !canonicalFiles.includes(path));
const success = mismatches.length === 0 && unexpected.length === 0;
console.log(JSON.stringify({ success, mode: 'verify', lockedFiles: canonicalFiles.length, mismatches, unexpected }, null, 2));
if (!success) process.exitCode = 1;
