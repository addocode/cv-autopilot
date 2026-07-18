import test from 'node:test';import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';
test('master data and source map exist',()=>{const d=JSON.parse(readFileSync('data/private/cv.master.json','utf8'));assert.equal(d.person.name,'Adam Dolinsky');assert.ok(d.experiences.length>=3);assert.ok(existsSync('data/sources/source-map.json'))});
test('render report keeps exactly two pages',()=>{const r=JSON.parse(readFileSync('dist/render-report-general.json','utf8'));assert.equal(r.pageCount,2)});
