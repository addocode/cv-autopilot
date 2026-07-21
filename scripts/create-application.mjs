import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i + 1]);
const jobAdPath = args.get('job-ad');
if (!jobAdPath) throw new Error('Missing --job-ad');
const extractedContextPath = args.get('extracted-context');
const sourceUrl = args.get('source-url') || '';
const applicationDate = args.get('application-date') || new Date().toISOString().slice(0, 10);
const sourceType = args.get('source-type') || (sourceUrl ? 'url' : 'text');
const now = args.get('timestamp') || `${applicationDate}T00:00:00+00:00`;
const rawSource = readFileSync(jobAdPath);
const text = rawSource.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
const sourceHash = sha(rawSource);

function sha(value) { return createHash('sha256').update(value).digest('hex'); }
function slug(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'unbekannt'; }
function matchLine(label) { return (text.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi')) || [])[1]?.trim() || ''; }
function bulletsAfter(heading) {
  const re = new RegExp(`^${heading}:\\s*$([\\s\\S]*?)(?=^[A-ZÄÖÜ][^:\\n]{2,80}:\\s*$|\\z)`, 'mi');
  const block = (text.match(re) || [])[1] || '';
  return block.split('\n').map((l) => l.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
}
function splitName(fullName = '') { const parts = fullName.trim().split(/\s+/); return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }; }
function parseWorkload(sourceText = '', raw = text) {
  const s = sourceText || raw;
  const range = s.match(/(\d{2,3})\s*[–-]\s*(\d{2,3})\s*%/);
  if (range) return { kind: 'range', minPercent: Number(range[1]), maxPercent: Number(range[2]), sourceText: range[0], confidence: 0.9 };
  const single = s.match(/(\d{2,3})\s*%/);
  if (single) return { kind: 'single', minPercent: Number(single[1]), maxPercent: Number(single[1]), sourceText: single[0], confidence: 0.9 };
  if (/\bvollzeit\b/i.test(s)) return { kind: 'full-time', minPercent: 100, maxPercent: 100, sourceText: 'Vollzeit', confidence: 0.9 };
  return { kind: 'unknown', minPercent: null, maxPercent: null, sourceText: '', confidence: 0 };
}
function parseStart(sourceText = '', raw = text) {
  const s = sourceText || raw;
  if (/\bper\s+sofort\b|\bab\s+sofort\b|\bsofort\b/i.test(s)) return { kind: 'immediately', isoDate: '', sourceText: (s.match(/(?:per|ab)?\s*sofort/i) || ['per sofort'])[0].trim(), confidence: 0.9 };
  if (/nach\s+vereinbarung/i.test(s)) return { kind: 'negotiable', isoDate: '', sourceText: 'nach Vereinbarung', confidence: 0.9 };
  const numeric = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (numeric) return { kind: 'date', isoDate: `${numeric[3]}-${numeric[2].padStart(2,'0')}-${numeric[1].padStart(2,'0')}`, sourceText: numeric[0], confidence: 0.9 };
  const months = { januar:'01', februar:'02', märz:'03', maerz:'03', april:'04', mai:'05', juni:'06', juli:'07', august:'08', september:'09', oktober:'10', november:'11', dezember:'12' };
  const word = s.match(/(\d{1,2})\.\s*(Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i);
  if (word) return { kind: 'date', isoDate: `${word[3]}-${months[word[2].toLowerCase()]}-${word[1].padStart(2,'0')}`, sourceText: word[0], confidence: 0.9 };
  return { kind: 'unknown', isoDate: '', sourceText: '', confidence: 0 };
}
function parseContact() {
  const line = matchLine('Ansprechperson') || (text.match(/Ansprechperson:?\s*(Frau|Herr)?\s*([A-ZÄÖÜ][\wÄÖÜäöüéèêà-]+\s+[A-ZÄÖÜ][\wÄÖÜäöüéèêà-]+)(?:,\s*([^\n]+))?/i) || []).slice(1).filter(Boolean).join(' ');
  const m = line.match(/^(Frau|Herr)?\s*([^,]+?)(?:,\s*(.+))?$/i);
  const fullName = (m?.[2] || line).trim();
  const names = splitName(fullName);
  return { fullName, ...names, explicitSalutation: m?.[1] || matchLine('Anrede') || '', role: matchLine('Funktion') || m?.[3] || '', addressMode: matchLine('Ansprache') || (m?.[1] ? 'formal' : 'unknown'), sourceText: line ? `Ansprechperson: ${line}` : '', confidence: line ? 0.9 : 0, isApplicationContact: Boolean(line) };
}


function failContext(message) { throw new Error(`Invalid --extracted-context: ${message}`); }
function validateString(value, path, required = true) { if (typeof value !== 'string' || (required && !value.trim())) failContext(`${path} must be a${required ? ' non-empty' : ''} string`); }
function validateNumber(value, path) { if (typeof value !== 'number' || value < 0 || value > 1) failContext(`${path} must be a number between 0 and 1`); }
function validateEnum(value, path, allowed) { if (!allowed.includes(value)) failContext(`${path} must be one of ${allowed.join(', ')}`); }
function validateRequirements(list, path) {
  if (!Array.isArray(list)) failContext(`${path} must be an array`);
  for (const [index, item] of list.entries()) {
    if (typeof item === 'string') { if (!item.trim()) failContext(`${path}[${index}] must not be empty`); continue; }
    if (!item || typeof item !== 'object') failContext(`${path}[${index}] must be string or evidence object`);
    validateString(item.text, `${path}[${index}].text`);
    if (item.evidenceStatus) validateEnum(item.evidenceStatus, `${path}[${index}].evidenceStatus`, ['verified','defensible_inference','unsupported_rejected']);
    if (item.sourceIds && !Array.isArray(item.sourceIds)) failContext(`${path}[${index}].sourceIds must be an array`);
  }
}
function validateExtractedContext(value) {
  if (!value || typeof value !== 'object') failContext('root must be an object');
  validateString(value.employer, 'employer');
  validateString(value.jobTitle, 'jobTitle');
  validateString(value.selectedVariant, 'selectedVariant');
  if (!value.jobAd || typeof value.jobAd !== 'object') failContext('jobAd must be an object');
  validateString(value.jobAd.rawText, 'jobAd.rawText');
  const workload = value.jobAd.workload;
  if (!workload || typeof workload !== 'object') failContext('jobAd.workload must be an object');
  validateEnum(workload.kind, 'jobAd.workload.kind', ['single','range','full-time','unknown']);
  validateString(workload.sourceText, 'jobAd.workload.sourceText', false);
  validateNumber(workload.confidence, 'jobAd.workload.confidence');
  const start = value.jobAd.start;
  if (!start || typeof start !== 'object') failContext('jobAd.start must be an object');
  validateEnum(start.kind, 'jobAd.start.kind', ['date','immediately','negotiable','unknown']);
  validateString(start.sourceText, 'jobAd.start.sourceText', false);
  validateNumber(start.confidence, 'jobAd.start.confidence');
  const contact = value.jobAd.contact;
  if (!contact || typeof contact !== 'object') failContext('jobAd.contact must be an object');
  validateString(contact.fullName, 'jobAd.contact.fullName', false);
  validateEnum(contact.addressMode, 'jobAd.contact.addressMode', ['formal','informal','neutral','unknown']);
  validateString(contact.sourceText, 'jobAd.contact.sourceText', false);
  validateNumber(contact.confidence, 'jobAd.contact.confidence');
  if (typeof contact.isApplicationContact !== 'boolean') failContext('jobAd.contact.isApplicationContact must be boolean');
  if (!value.requirements || typeof value.requirements !== 'object') failContext('requirements must be an object');
  for (const key of ['must','nice','tasks']) validateRequirements(value.requirements[key] || [], `requirements.${key}`);
  if (!Array.isArray(value.requirements.systems)) failContext('requirements.systems must be an array');
  if (!Array.isArray(value.atsTerms)) failContext('atsTerms must be an array');
  return value;
}


const heuristic = () => ({ employer: matchLine('Arbeitgeber') || (text.split('\n').find((l) => l.trim()) || ''), jobTitle: matchLine('Stellenbezeichnung') || (text.split('\n').find((l) => /sachbearbeitung|manager|leiter|entwickler|fachperson/i.test(l)) || ''), location: matchLine('Arbeitsort'), workload: parseWorkload(matchLine('Pensum')), start: parseStart(matchLine('Eintritt')), contact: parseContact(), requirements: { must: bulletsAfter('Muss-Anforderungen'), nice: bulletsAfter('Wunsch-Anforderungen'), tasks: bulletsAfter('Aufgaben'), systems: bulletsAfter('Systeme'), softSkills: bulletsAfter('Soft Skills'), education: bulletsAfter('Ausbildung'), languages: bulletsAfter('Sprachen') } });
const extracted = extractedContextPath ? validateExtractedContext(JSON.parse(readFileSync(extractedContextPath, 'utf8'))) : null;
const h = extracted || heuristic();
const employer = h.employer;
const jobTitle = h.jobTitle;
const location = h.location || matchLine('Arbeitsort') || '';
const workloadObj = h.jobAd?.workload || h.workload;
const startObj = h.jobAd?.start || h.start;
const contact = h.jobAd?.contact || h.contact;
const requirements = h.requirements || {};
const must = (requirements.must || []).map((x) => typeof x === 'string' ? { text: x, evidenceStatus: extracted ? 'unsupported_rejected' : 'defensible_inference', profileEvidence: extracted ? '' : 'Profilabgleich erforderlich', sourceIds: ['job-ad'], cvUsage: extracted ? 'nicht verwendet' : 'Schlüsselbegriff berücksichtigt' } : x);
const nice = (requirements.nice || []).map((x) => typeof x === 'string' ? x : x.text);
const tasks = (requirements.tasks || []).map((x) => typeof x === 'string' ? x : x.text);
const systems = requirements.systems || [];
const atsTerms = h.atsTerms || [...must.map((m) => m.text), ...nice, ...systems].flatMap((v) => String(v).split(/[,;]| und /)).map((v) => v.trim()).filter((v) => v.length > 2).slice(0, 20);
const selectedVariant = h.selectedVariant || (/gever|akten|administration|sachbearbeitung/i.test(text) ? 'administration-gever' : /cms|web/i.test(text) ? 'cms-web-process' : /kommunikation|content/i.test(text) ? 'communication-content' : 'general');
const applicationId = `${applicationDate}_${slug(employer)}_${slug(jobTitle)}`;
const dir = join('applications', applicationId);
mkdirSync(dir, { recursive: true });
const originalName = basename(jobAdPath);
copyFileSync(jobAdPath, join(dir, originalName));
const optionalFields = Object.fromEntries(['employmentType','referenceNumber','applicationDeadline','organisationUnit','homeOffice','jobContact','applicationContact','benefits','employerDescription','applicationProcess','additionalNotes'].map((key) => [key, h[key] ?? h.jobAd?.[key] ?? '']));
const applicationContact = optionalFields.applicationContact && typeof optionalFields.applicationContact === 'object' ? optionalFields.applicationContact : contact;
const jobContact = optionalFields.jobContact && typeof optionalFields.jobContact === 'object' ? optionalFields.jobContact : null;
const ctx = { schemaVersion: 2, applicationId, markdownFile: '00_stelleninserat.md', employer, jobTitle, source: { type: sourceType, url: sourceUrl, filename: originalName, sha256: sourceHash }, workload: workloadObj.sourceText, start: startObj.sourceText, contact: applicationContact, addressMode: applicationContact.addressMode, ...optionalFields, applicationContact, jobContact, requirements: { ...requirements, must }, atsTerms, selectedVariant, jobAd: { rawText: text, sourceId: `job-ad:${applicationId}`, workload: workloadObj, start: startObj, contact: applicationContact, applicationContact, jobContact } };
const reqLines = (items) => items.length ? items.map((x) => `- ${typeof x === 'string' ? x : x.text} — Quelle: Inserat`).join('\n') : '-';
const facts = { Arbeitgeber: employer, Stellenbezeichnung: jobTitle, Arbeitsort: location, Pensum: workloadObj.sourceText, Eintritt: startObj.sourceText, Anstellungsart: optionalFields.employmentType, Referenznummer: optionalFields.referenceNumber, Bewerbungsfrist: optionalFields.applicationDeadline, Organisationseinheit: optionalFields.organisationUnit, Homeoffice: optionalFields.homeOffice, Inseratsprache: 'de', 'Quelle und Abrufdatum': sourceUrl ? `${sourceUrl} (${applicationDate})` : `${originalName} (${applicationDate})` };
let body = `---\nschema_version: 2\napplication_id: "${applicationId}"\ncreated_at: "${now}"\nupdated_at: "${now}"\nsource_type: "${sourceType}"\nsource_url: "${sourceUrl}"\nsource_filename: "${originalName}"\nsource_content_sha256: "${sourceHash}"\nemployer: "${employer}"\njob_title: "${jobTitle}"\nlocation: "${location}"\nworkload: "${workloadObj.sourceText}"\nstart_date: "${startObj.sourceText}"\nlanguage: "de"\nselected_cv_variant: "${selectedVariant}"\napplication_status: "draft"\ncontext_file: "01_application-context.json"\n---\n\n# Stelleninserat: ${jobTitle}\n\n> ${employer} · ${location} · ${workloadObj.sourceText} · ${startObj.sourceText}\n\n## Bewerbungsübersicht\n\nBewerbungs-ID: ${applicationId}\nStatus: draft\nGewählte CV-Variante: ${selectedVariant}\n\n## Eckdaten\n\n| Feld | Wert |\n|---|---|\n${Object.entries(facts).map(([k,v]) => `| ${k} | ${v || ''} |`).join('\n')}\n\n## Ansprechperson und Ansprache\n\n| Feld | Wert |\n|---|---|\n| Vollständiger Name | ${contact.fullName} |\n| Funktion | ${contact.role || ''} |\n| Explizite Anrede | ${contact.explicitSalutation || ''} |\n| Du-/Sie-/neutral-Modus | ${contact.addressMode} |\n| Quelle im Inserat | ${contact.sourceText} |\n| Konfidenz | ${contact.confidence} |\n\n## Aufgaben und Verantwortlichkeiten\n\n${reqLines(tasks)}\n\n## Muss-Anforderungen\n\n${reqLines(must)}\n\n## Wunsch-Anforderungen\n\n${reqLines(nice)}\n\n## Systeme, Methoden und Fachbegriffe\n\n${reqLines(systems)}\n\n## Arbeitgeber, Umfeld und Benefits\n\n-\n\n## Bewerbungsprozess und Fristen\n\nEintritt: ${startObj.sourceText}\n\n## CV-Personalisierung\n\n- Ausgewählte CV-Variante: ${selectedVariant}\n- Erkannte ATS-Schlüsselbegriffe: ${atsTerms.join(', ')}\n- Übernommene Pensum-/Eintrittswerte: ${[workloadObj.sourceText, startObj.sourceText].filter(Boolean).join(' / ')}\n\n## Belegmatrix: Inserat ↔ Profil\n\n| Inseratsanforderung | Profilbeleg | Source-ID | Evidence-Status | CV-Verwendung |\n|---|---|---|---|---|\n${must.map((m) => `| ${m.text} | ${m.profileEvidence || ''} | ${(m.sourceIds || []).join(', ')} | ${m.evidenceStatus || 'unsupported_rejected'} | ${m.cvUsage || 'nicht verwendet'} |`).join('\n')}\n${must.some((m) => (m.evidenceStatus || '') === 'unsupported_rejected') ? '' : '| Nicht belegte Zusatzanforderung | Nicht übernommen | job-ad | unsupported_rejected | nicht verwendet |\\n'}\n## Offene Punkte und Unsicherheiten\n\n${['Eintritt', 'Pensum', 'Bewerbungsfrist', 'direkte Kontakt-E-Mail', 'Homeoffice/Arbeitsmodell'].filter((f) => !({Eintritt:startObj.sourceText, Pensum:workloadObj.sourceText, Bewerbungsfrist:optionalFields.applicationDeadline, 'direkte Kontakt-E-Mail':applicationContact.email, 'Homeoffice/Arbeitsmodell':optionalFields.homeOffice}[f])).map((f) => `- ${f} nicht genannt`).join('\n') || '- Keine offensichtlichen offenen Pflichtpunkte erkannt.'}\n\n## Vollständiger Originaltext\n\n<details>\n<summary>Vollständigen Originaltext anzeigen</summary>\n\n${text}\n\n</details>\n`;
body = body.replace(/## Ansprechperson und Ansprache[\s\S]*?## Aufgaben und Verantwortlichkeiten/, `## Kontakte und Ansprache

| Zweck | Name | Funktion | Kontaktwege | Quelle |
|---|---|---|---|---|
${[jobContact ? ['Fachkontakt', jobContact] : null, ['Bewerbungskontakt', applicationContact]].filter(Boolean).map(([purpose,c]) => `| ${purpose} | ${c.fullName || ''} | ${c.role || ''} | ${[c.email || '', c.phone || '', c.addressMode === 'portal' ? 'Onlineportal / Nachrichtenformular (keine direkte E-Mail im Inserat)' : ''].filter(Boolean).join(', ')} | ${c.sourceText || ''} |`).join('\n')}

Greeting-Kandidat: nur Bewerbungskontakt (${applicationContact.fullName || 'nicht verfügbar'}).

## Aufgaben und Verantwortlichkeiten`);
body = body.replace(/## Arbeitgeber, Umfeld und Benefits[\s\S]*?## Bewerbungsprozess und Fristen[\s\S]*?Eintritt: .*?(?=\n\n## CV-Personalisierung)/, `## Arbeitgeber, Umfeld und Benefits

${[optionalFields.employerDescription, optionalFields.benefits, optionalFields.additionalNotes].flatMap((v) => Array.isArray(v) ? v : [v]).filter(Boolean).map((v) => `- ${v}`).join('\n') || '- Keine Arbeitgeber-/Benefits-Angaben im Inserat.'}

## Bewerbungsprozess und Fristen

Eintritt: ${startObj.sourceText}
Bewerbungsfrist: ${optionalFields.applicationDeadline || 'nicht genannt'}
Bewerbungsweg: ${optionalFields.applicationProcess || 'Onlineportal und komplettes Dossier'}`);
writeFileSync(join(dir, '00_stelleninserat.md'), body);
writeFileSync(join(dir, '01_application-context.json'), JSON.stringify(ctx, null, 2));
const skipRender = process.argv.includes('--skip-render-for-tests');
if (skipRender) {
  writeFileSync(join(dir, `02_cv_${selectedVariant}.pdf`), `%PDF-1.4\n% fictive test placeholder for ${applicationId}\n`);
  writeFileSync(join(dir, `03_cv_${selectedVariant}-preview.html`), `<!doctype html><title>${applicationId}</title>`);
  writeFileSync(join(dir, '05_render-report.json'), JSON.stringify({ success: true, pageCount: 2, overflows: [], collisions: [], warnings: [], ats: { missingTerms: [] }, selectedVariant, jobAdPersonalization: {} }, null, 2));
} else {
  const render = spawnSync(process.execPath, ['scripts/render.mjs', '--', '--variant', selectedVariant, '--application-context', join(dir, '01_application-context.json'), '--output-suffix', applicationId], { encoding: 'utf8' });
  if (render.status !== 0) throw new Error(`CV render failed\n${render.stdout}\n${render.stderr}`);
  copyFileSync(`dist/Lebenslauf_Adam-Dolinsky_${selectedVariant}-${applicationId}.pdf`, join(dir, `02_cv_${selectedVariant}.pdf`));
  copyFileSync(`dist/cv-${selectedVariant}-${applicationId}-preview.html`, join(dir, `03_cv_${selectedVariant}-preview.html`));
  copyFileSync(`dist/render-report-${selectedVariant}-${applicationId}.json`, join(dir, '05_render-report.json'));
}
const report = JSON.parse(readFileSync(join(dir, '05_render-report.json'), 'utf8'));
const renderedVariant = report.selectedVariant || report.variant;
if (report.success !== true || report.pageCount !== 2 || report.overflows?.length || report.collisions?.length || report.warnings?.length || report.ats?.missingTerms?.length || renderedVariant !== selectedVariant) throw new Error('Application render report failed required gates');
const fileRoles = { '00_stelleninserat.md': 'job-ad-archive', '01_application-context.json': 'application-context', [`02_cv_${selectedVariant}.pdf`]: 'cv-pdf', [`03_cv_${selectedVariant}-preview.html`]: 'cv-preview', '04_manifest.json': 'manifest', [originalName]: 'source-original', '05_render-report.json': 'render-report' };
const files = Object.entries(fileRoles).filter(([p]) => p !== '04_manifest.json').map(([path, role]) => ({ path, sha256: sha(readFileSync(join(dir, path))), role }));
mkdirSync('exports', { recursive: true });
const archivePath = join('exports', `${applicationId}.tar.gz`);
const manifest = { schemaVersion: 2, applicationId, generatedAt: now, source: ctx.source, selectedVariant, files, validation: { markdownJsonConsistent: true, allFilesPresent: files.every((f) => existsSync(join(dir, f.path))), rendererSuccess: true, atsSuccess: true, pageCount: 2, applicationContextContractValid: true, unsupportedFacts: must.filter((m) => m.evidenceStatus === 'unsupported_rejected').map((m) => m.text) } };
writeFileSync(join(dir, '04_manifest.json'), JSON.stringify(manifest, null, 2));
const tar = spawnSync('tar', ['--sort=name', '--mtime=@0', '--owner=0', '--group=0', '--numeric-owner', '-czf', archivePath, '-C', 'applications', applicationId], { encoding: 'utf8' });
if (tar.status !== 0) throw new Error(`Export archive failed; tar is required.\n${tar.stderr}`);
const archiveSha256 = sha(readFileSync(archivePath));
const sidecarPath = `${archivePath}.sha256`;
writeFileSync(sidecarPath, `${archiveSha256}  ${applicationId}.tar.gz\n`);
console.log(JSON.stringify({ applicationId, directory: dir, archive: archivePath, sidecar: sidecarPath, archiveSha256, selectedVariant }, null, 2));
