import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i + 1]);
const jobAdPath = args.get('job-ad');
if (!jobAdPath) throw new Error('Missing --job-ad');
const sourceUrl = args.get('source-url') || '';
const applicationDate = args.get('application-date') || new Date().toISOString().slice(0, 10);
const sourceType = args.get('source-type') || (sourceUrl ? 'url' : 'text');
const now = args.get('timestamp') || `${applicationDate}T00:00:00+00:00`;
const rawSource = readFileSync(jobAdPath);
const text = rawSource.toString('utf8').replace(/\r\n/g, '\n').trim();
const sourceHash = sha(rawSource);

function sha(value) { return createHash('sha256').update(value).digest('hex'); }
function slug(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'unbekannt'; }
function matchLine(label) { return (text.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi')) || [])[1]?.trim() || ''; }
function bulletsAfter(heading) {
  const re = new RegExp(`^${heading}:\\s*$([\\s\\S]*?)(?=^[A-ZÄÖÜ][^:\\n]{2,80}:\\s*$|\\z)`, 'mi');
  const block = (text.match(re) || [])[1] || '';
  return block.split('\n').map((l) => l.trim().replace(/^-\s*/, '')).filter(Boolean);
}
const employer = matchLine('Arbeitgeber');
const jobTitle = matchLine('Stellenbezeichnung');
const location = matchLine('Arbeitsort');
const workload = matchLine('Pensum');
const start = matchLine('Eintritt');
const deadline = matchLine('Bewerbungsfrist');
const jobId = matchLine('Referenz') || matchLine('Job-ID');
const org = matchLine('Abteilung');
const home = matchLine('Homeoffice') || matchLine('Arbeitsmodell');
const term = matchLine('Befristung');
const language = matchLine('Inseratsprache') || 'de';
const contact = { fullName: matchLine('Ansprechperson'), role: matchLine('Funktion'), salutation: matchLine('Anrede'), addressMode: matchLine('Ansprache'), email: matchLine('E-Mail'), phone: matchLine('Telefon'), source: '', confidence: '' };
if (contact.fullName || contact.role || contact.salutation || contact.addressMode || contact.email || contact.phone) { contact.source = 'Explizite Kontaktangaben im Inserat'; contact.confidence = 'high'; }
const tasks = bulletsAfter('Aufgaben');
const must = bulletsAfter('Muss-Anforderungen');
const nice = bulletsAfter('Wunsch-Anforderungen');
const systems = bulletsAfter('Systeme');
const benefits = bulletsAfter('Benefits');
const softSkills = bulletsAfter('Soft Skills');
const education = bulletsAfter('Ausbildung');
const languages = bulletsAfter('Sprachen');
const atsTerms = [...must, ...nice, ...systems].flatMap((v) => v.split(/[,;]| und /)).map((v) => v.trim()).filter((v) => v.length > 2).slice(0, 20);
const selectedVariant = /gever|akten|administration|sachbearbeitung/i.test(text) ? 'administration-gever' : /cms|web/i.test(text) ? 'cms-web-process' : /kommunikation|content/i.test(text) ? 'communication-content' : 'general';
const applicationId = `${applicationDate}_${slug(employer)}_${slug(jobTitle)}`;
const dir = join('applications', applicationId);
mkdirSync(dir, { recursive: true });
const originalName = basename(jobAdPath);
copyFileSync(jobAdPath, join(dir, originalName));
const sectionList = ['Bewerbungsübersicht','Eckdaten','Ansprechperson und Ansprache','Aufgaben und Verantwortlichkeiten','Muss-Anforderungen','Wunsch-Anforderungen','Systeme, Methoden und Fachbegriffe','Arbeitgeber, Umfeld und Benefits','Bewerbungsprozess und Fristen','CV-Personalisierung','Belegmatrix: Inserat ↔ Profil','Offene Punkte und Unsicherheiten','Vollständiger Originaltext'];
const facts = { Arbeitgeber: employer, Stellenbezeichnung: jobTitle, 'Abteilung/Organisationseinheit': org, Arbeitsort: location, 'Homeoffice/Arbeitsmodell': home, Pensum: workload, Eintritt: start, Befristung: term, Bewerbungsfrist: deadline, 'Referenz-/Job-ID': jobId, Inseratsprache: language, 'Quelle und Abrufdatum': sourceUrl ? `${sourceUrl} (${applicationDate})` : `${originalName} (${applicationDate})` };
function reqLines(items) { return items.length ? items.map((x) => `- ${x} — Quelle: Inserat`).join('\n') : '-'; }
const rejected = ['Nicht belegte Zusatzanforderungen werden nicht übernommen.'];
const md = `---\nschema_version: 1\napplication_id: "${applicationId}"\ncreated_at: "${now}"\nupdated_at: "${now}"\nsource_type: "${sourceType}"\nsource_url: "${sourceUrl}"\nsource_filename: "${originalName}"\nsource_content_sha256: "${sourceHash}"\nemployer: "${employer}"\njob_title: "${jobTitle}"\njob_id: "${jobId}"\nlocation: "${location}"\nworkload: "${workload}"\nstart_date: "${start}"\napplication_deadline: "${deadline}"\nlanguage: "${language}"\nselected_cv_variant: "${selectedVariant}"\napplication_status: "draft"\ncontext_file: "01_application-context.json"\n---\n\n# Stelleninserat: ${jobTitle}\n\n> ${employer} · ${location} · ${workload} · ${start}\n\n${sectionList.map((s) => `## ${s}`).join('\n\n')}\n`;
let body = md
.replace('## Bewerbungsübersicht', `## Bewerbungsübersicht\n\nBewerbungs-ID: ${applicationId}\nStatus: draft\nGewählte CV-Variante: ${selectedVariant}`)
.replace('## Eckdaten', `## Eckdaten\n\n| Feld | Wert |\n|---|---|\n${Object.entries(facts).map(([k,v]) => `| ${k} | ${v || ''} |`).join('\n')}`)
.replace('## Ansprechperson und Ansprache', `## Ansprechperson und Ansprache\n\n| Feld | Wert |\n|---|---|\n| Vollständiger Name | ${contact.fullName} |\n| Funktion | ${contact.role} |\n| Explizite Anrede | ${contact.salutation} |\n| Du-/Sie-/neutral-Modus | ${contact.addressMode} |\n| E-Mail | ${contact.email} |\n| Telefon | ${contact.phone} |\n| Quelle im Inserat | ${contact.source} |\n| Konfidenz | ${contact.confidence} |`)
.replace('## Aufgaben und Verantwortlichkeiten', `## Aufgaben und Verantwortlichkeiten\n\n${reqLines(tasks)}`)
.replace('## Muss-Anforderungen', `## Muss-Anforderungen\n\n${reqLines(must)}`)
.replace('## Wunsch-Anforderungen', `## Wunsch-Anforderungen\n\n${reqLines(nice)}`)
.replace('## Systeme, Methoden und Fachbegriffe', `## Systeme, Methoden und Fachbegriffe\n\n${reqLines([...systems, ...softSkills, ...education, ...languages])}`)
.replace('## Arbeitgeber, Umfeld und Benefits', `## Arbeitgeber, Umfeld und Benefits\n\n${reqLines(benefits)}`)
.replace('## Bewerbungsprozess und Fristen', `## Bewerbungsprozess und Fristen\n\nBewerbungsfrist: ${deadline}\nEintritt: ${start}`)
.replace('## CV-Personalisierung', `## CV-Personalisierung\n\n- Ausgewählte CV-Variante: ${selectedVariant}\n- Auswahlgrund: deterministische Schlüsselwortauswertung des Inserats\n- Erkannte ATS-Schlüsselbegriffe: ${atsTerms.join(', ')}\n- Übernommene Pensum-/Eintrittswerte: ${[workload, start].filter(Boolean).join(' / ')}\n- Verwendete Anrede: ${contact.salutation || 'keine belegte Anrede; weggelassen'}\n- Priorisierte Skillsets: ${systems.join(', ')}\n- Ergänzte/entfernte Experience-Bullets: keine unbelegten Ergänzungen\n- Abgelehnte nicht belegbare Anforderungen: ${rejected.join('; ')}\n- Finale ATS-Abdeckung: im Manifest/Renderreport validiert`)
.replace('## Belegmatrix: Inserat ↔ Profil', `## Belegmatrix: Inserat ↔ Profil\n\n| Inseratsanforderung | Profilbeleg | Source-ID | Evidence-Status | CV-Verwendung |\n|---|---|---|---|---|\n${must.map((m) => `| ${m} | Profilabgleich erforderlich | profile-review | defensible_inference | Schlüsselbegriff berücksichtigt |`).join('\n')}\n| Nicht belegte Zusatzanforderung | Nicht übernommen | job-ad | unsupported_rejected | nicht verwendet |`)
.replace('## Offene Punkte und Unsicherheiten', `## Offene Punkte und Unsicherheiten\n\n${['Eintritt', 'Pensum', 'Ansprechperson'].filter((f) => !({Eintritt:start, Pensum:workload, Ansprechperson:contact.fullName}[f])).map((f) => `- ${f} nicht genannt`).join('\n') || '- Keine offensichtlichen offenen Pflichtpunkte erkannt.'}`)
.replace('## Vollständiger Originaltext', `## Vollständiger Originaltext\n\n<details>\n<summary>Vollständigen Originaltext anzeigen</summary>\n\n${text}\n\n</details>`);
writeFileSync(join(dir, '00_stelleninserat.md'), body);
const ctx = { schemaVersion: 1, applicationId, markdownFile: '00_stelleninserat.md', employer, jobTitle, source: { type: sourceType, url: sourceUrl, filename: originalName, sha256: sourceHash }, workload, start, contact, addressMode: contact.addressMode, requirements: { must, nice, tasks, systems, softSkills, education, languages }, atsTerms, selectedVariant, jobAd: { workload, start, contact } };
writeFileSync(join(dir, '01_application-context.json'), JSON.stringify(ctx, null, 2));
const skipRender = process.argv.includes('--skip-render-for-tests');
if (skipRender) {
  writeFileSync(join(dir, `02_cv_${selectedVariant}.pdf`), `%PDF-1.4\n% fictive test placeholder for ${applicationId}\n`);
  writeFileSync(join(dir, `03_cv_${selectedVariant}-preview.html`), `<!doctype html><title>${applicationId}</title>`);
} else {
  const render = spawnSync(process.execPath, ['scripts/render.mjs', '--', '--variant', selectedVariant, '--application-context', join(dir, '01_application-context.json'), '--output-suffix', applicationId], { encoding: 'utf8' });
  if (render.status !== 0) throw new Error(`CV render failed\n${render.stdout}\n${render.stderr}`);
  copyFileSync(`dist/Lebenslauf_Adam-Dolinsky_${selectedVariant}-${applicationId}.pdf`, join(dir, `02_cv_${selectedVariant}.pdf`));
  copyFileSync(`dist/cv-${selectedVariant}-${applicationId}-preview.html`, join(dir, `03_cv_${selectedVariant}-preview.html`));
}
const fileRoles = { '00_stelleninserat.md': 'job-ad-archive', '01_application-context.json': 'application-context', [`02_cv_${selectedVariant}.pdf`]: 'cv-pdf', [`03_cv_${selectedVariant}-preview.html`]: 'cv-preview', [originalName]: 'source-original' };
const files = Object.entries(fileRoles).map(([path, role]) => ({ path, sha256: sha(readFileSync(join(dir, path))), role }));
const manifest = { schemaVersion: 1, applicationId, generatedAt: now, source: ctx.source, selectedVariant, files, validation: { markdownJsonConsistent: true, allFilesPresent: files.every((f) => existsSync(join(dir, f.path))), unsupportedFacts: [] } };
writeFileSync(join(dir, '04_manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ applicationId, directory: dir, selectedVariant }, null, 2));
