import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('data/private/cv.master.json','utf8')); const variants=['general','communication-content','administration-gever','cms-web-process'].map(v=>JSON.parse(readFileSync(`data/public/variants/${v}.json`,'utf8'))); const errs=[];
for(const key of ['person','positioning','summary','skillSections','languages','experiences','tools','references','availability','workload']) if(!d[key]) errs.push(`${key} missing`);
const required=[['freelance-digital-marketing-media','03/2026 – 07/2026'],['kunz-kunath-marketing-mediamatiker','10/2021 – 02/2026'],['rekrutenschule-triage-fuehrungsdienst','11/2022 – 03/2023'],['mediamatiker-ausbildung-army-bict','08/2017 – 08/2021'],['schachfestival-livestream-event','Juli 2019 / 2020']];
for(const [id,period] of required){const e=d.experiences.find(x=>x.id===id); if(!e) errs.push(`missing experience ${id}`); else if(e.period!==period) errs.push(`${id} period expected ${period} got ${e.period}`);} if(d.experiences.some(e=>/FORS/i.test(e.employer))) errs.push('FORS must not be separated as employer');
for(const lang of ['Deutsch:C2','Englisch:C1','Polnisch:C2','Französisch:B1']){const [name,level]=lang.split(':'); if(!d.languages.find(l=>l.name===name&&l.level===level)) errs.push(`missing language ${lang}`)}
if(d.references.length<2 || d.references.some(r=>!r.phone || /gemäss|siehe|Referenzperson/i.test(JSON.stringify(r)))) errs.push('real references incomplete');
for(const section of d.skillSections) for(const item of section.items) if(!item.id||!item.tags?.length||!item.evidenceLevel||!item.sources?.length) errs.push(`invalid skill ${item.id}`);
for(const exp of d.experiences) for(const b of exp.bullets) if(!b.id||!b.tags?.length||!b.evidenceLevel||!b.sources?.length) errs.push(`invalid bullet ${b.id}`);
for(const v of variants){for(const b of v.selectedBulletIds){if(!d.experiences.flatMap(e=>e.bullets).find(x=>x.id===b)) errs.push(`${v.id} selects missing bullet ${b}`)}}
if(errs.length){console.error(errs.join('\n')); process.exit(1)} console.log('CV data and variants valid');
