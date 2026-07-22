import { readFileSync, writeFileSync } from 'node:fs';

const masterPath = 'data/private/cv.master.json';
const updatesPath = 'data/private/profile-updates.json';
const master = JSON.parse(readFileSync(masterPath, 'utf8'));
const updateSet = JSON.parse(readFileSync(updatesPath, 'utf8'));

for (const update of updateSet.updates || []) {
  if (update.type !== 'language-level') throw new Error(`Unsupported profile update type: ${update.type}`);
  const language = (master.languages || []).find((item) => item.id === update.id);
  if (!language) throw new Error(`Language not found: ${update.id}`);
  if (language.name !== update.name) throw new Error(`Language name mismatch for ${update.id}`);
  language.level = update.level;
  language.sources = [...new Set([...(language.sources || []), update.sourceId])];
}

writeFileSync(masterPath, `${JSON.stringify(master, null, 2)}\n`);
console.log(JSON.stringify({ success: true, appliedUpdates: updateSet.updates || [] }, null, 2));
