import { readFileSync } from 'node:fs';
import { composeMotivationLetter } from '../modules/motivation-letter/src/compose.mjs';
import { renderMotivationLetter } from '../modules/motivation-letter/src/renderer.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith('--')) args.set(process.argv[index].slice(2), process.argv[index + 1]);
}

let letter;
if (args.get('input')) {
  letter = JSON.parse(readFileSync(args.get('input'), 'utf8'));
} else {
  const contextPath = args.get('context');
  const strategyPath = args.get('strategy');
  if (!contextPath || !strategyPath) throw new Error('Provide --input or both --context and --strategy');
  const context = JSON.parse(readFileSync(contextPath, 'utf8'));
  const strategy = JSON.parse(readFileSync(strategyPath, 'utf8'));
  letter = composeMotivationLetter(context, strategy);
}

const report = await renderMotivationLetter(letter, {
  outputDir: args.get('output-dir') || 'dist',
  outputId: args.get('output-id') || letter.applicationId,
  throwOnFailure: true,
});
console.log(JSON.stringify(report, null, 2));
