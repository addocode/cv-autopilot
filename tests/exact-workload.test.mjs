import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync('scripts/render.mjs', 'utf8');
const start = source.indexOf('function normalizeWorkload(');
const end = source.indexOf('function normalizeStart(', start);
const normalize = vm.runInNewContext(`(${source.slice(start, end).trim()})`);
test('exact candidate workload cannot imply flexibility', () => {
  const result = normalize({workload:{kind:'single',minPercent:40,maxPercent:40,confidence:1,exact:true},rawText:'Inserat 40–60 %'});
  assert.equal(result.renderedText, 'Exakt 40 %');
  assert.equal(result.parsedValue, '40 %');
  assert.equal(result.usedFallback, false);
});
test('existing range and unknown behaviour remains intact', () => {
  assert.equal(normalize({workload:{kind:'range',minPercent:40,maxPercent:60,confidence:1}}).renderedText,'40–60 % gemäss Inserat, flexibel nach Absprache');
  assert.equal(normalize({}).usedFallback,true);
  assert.equal(normalize({workload:{kind:'single',minPercent:40,confidence:0,exact:true}}).usedFallback,true);
});
