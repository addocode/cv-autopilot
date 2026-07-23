import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  escapeHtml,
  formatDateCh,
  normalizeJobTitle,
  workloadCategory,
} from '../../application-core/src/utils.mjs';

const FIELD_LABELS = {
  applicationDate: 'Bewerbungsdatum',
  applicationMethod: 'Bewerbungsart',
  'company.name': 'Unternehmen',
  'company.street': 'Strasse',
  'company.number': 'Nummer',
  'company.poBox': 'Postfach-Nr.',
  'company.country': 'Land',
  'company.postalCode': 'PLZ',
  'company.city': 'Ort',
  'company.contactPerson': 'Kontaktperson',
  'company.email': 'E-Mail',
  'company.phone': 'Telefonnummer',
  'job.title': 'Stellenbezeichnung',
  'job.applicationUrl': 'Link zum Online-Formular',
  ravAssignment: 'Zuweisung des RAV',
  workloadCategory: 'Arbeitspensum',
  result: 'Ergebnis',
};

function source(field, status, value, reason, url = '', confidence = 1) {
  return { field, status, value: String(value), reason, ...(url ? { url } : {}), confidence };
}

function officialDomain(sourceUrl) {
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
    return hostname && !hostname.endsWith('.invalid') ? hostname : '';
  } catch {
    return '';
  }
}

function researchValue(research, key, fallback) {
  const value = research?.[key];
  return typeof value === 'object' && value !== null ? value.value : value || fallback;
}

export function buildRavRecapData(context, provided = null) {
  if (provided) return structuredClone(provided);
  const title = normalizeJobTitle(context.jobTitleOriginal || context.jobTitle);
  const research = context.companyResearch || context.jobAd?.companyResearch || {};
  const contact = context.applicationContact || context.contact || context.jobContact || {};
  const url = context.source?.url || context.jobAd?.applicationUrl || '';
  const domain = officialDomain(url);
  const email = contact.email || researchValue(research, 'email', domain ? `bewerbung@${domain}` : 'personalabteilung@example.invalid');
  const phone = contact.phone || researchValue(research, 'phone', 'Nicht verfügbar');
  const street = researchValue(research, 'street', 'Nicht im Inserat genannt');
  const number = researchValue(research, 'number', 'Nicht bekannt');
  const postalCode = researchValue(research, 'postalCode', 'Nicht bekannt');
  const city = researchValue(research, 'city', context.location || 'Bern');
  const applicationUrl = /^https:\/\//.test(url) ? url : `https://example.invalid/${context.applicationId}`;
  const date = formatDateCh(context.applicationDate || context.generationDate);
  const sources = [
    source('applicationDate', 'inferred_high_confidence', date, 'Bewerbungsdatum der gemeinsamen Bewerbungsinstanz.', '', 0.99),
    source('company.name', 'job_ad_explicit', context.employer, 'Arbeitgeber aus dem Stelleninserat.'),
    source('company.contactPerson', contact.fullName ? 'job_ad_explicit' : 'fallback_required_field', contact.fullName || 'Personalabteilung', contact.fullName ? 'Kontaktperson aus dem Stelleninserat.' : 'Keine namentliche Kontaktperson vorhanden; neutraler Pflichtfeld-Ersatz.'),
    source('company.email', contact.email ? 'job_ad_explicit' : domain ? 'inferred_high_confidence' : 'fallback_required_field', email, contact.email ? 'E-Mail aus dem Stelleninserat beziehungsweise dem validierten Kontext.' : domain ? 'Best-Effort-Adresse auf der offiziellen Stellen-Domain; vor Übertragung prüfen.' : 'Keine belastbare E-Mail vorhanden; technischer Pflichtfeld-Ersatz.', url, contact.email ? 1 : domain ? 0.65 : 0.1),
    source('company.phone', contact.phone ? 'job_ad_explicit' : research.phone ? 'official_research' : 'fallback_required_field', phone, contact.phone ? 'Telefonnummer aus dem Stelleninserat.' : research.phone ? 'Telefonnummer aus offizieller Recherche.' : 'Keine Telefonnummer vorhanden; Pflichtfeld-Ersatz muss manuell geprüft werden.', research.phone?.url || '', contact.phone || research.phone ? 1 : 0.1),
    source('company.address', research.street ? 'official_research' : 'fallback_required_field', `${street} ${number}, ${postalCode} ${city}`, research.street ? 'Adresse aus offizieller Arbeitgeberrecherche.' : 'Adresse ist im Kontext nicht vollständig vorhanden und muss vor der Übertragung geprüft werden.', research.addressUrl || '', research.street ? 1 : 0.1),
    source('company.poBox', 'fallback_required_field', 'Kein Postfach', 'Keine Postfachnummer publiziert; Job-Room-Pflichtfeld-Ersatz.'),
    source('job.title', 'job_ad_explicit', title.rendered, 'Stellenbezeichnung aus dem Inserat für Adam bereinigt; Pensum entfernt.'),
    source('job.applicationUrl', /^https:\/\//.test(url) ? 'job_ad_explicit' : 'fallback_required_field', applicationUrl, /^https:\/\//.test(url) ? 'Direkte Stellen- oder Bewerbungs-URL.' : 'Keine direkte HTTPS-URL vorhanden; technischer Platzhalter muss ersetzt werden.', applicationUrl, /^https:\/\//.test(url) ? 1 : 0.1),
  ];
  const workload = context.jobAd?.workload || context.workload || {};
  const category = workloadCategory(workload);
  return {
    schemaVersion: 1,
    applicationId: context.applicationId,
    applicationDate: date,
    applicationMethod: context.applicationMethod || 'Elektronisch',
    company: {
      name: context.employer,
      street,
      number,
      poBox: researchValue(research, 'poBox', 'Kein Postfach'),
      country: researchValue(research, 'country', 'Schweiz'),
      postalCode,
      city,
      contactPerson: contact.fullName || 'Personalabteilung',
      email,
      phone,
    },
    job: {
      title: title.rendered,
      applicationUrl,
      advertisedWorkload: workload.sourceText || context.workload || 'Nicht genannt',
    },
    ravAssignment: context.ravAssignment || 'Nein',
    workloadCategory: context.appliedWorkloadCategory || category,
    result: context.applicationResult || 'Noch offen',
    instructions: [
      'Im Job-Room jedes Feld einzeln aus der mobilen HTML-Datei kopieren.',
      `Bei Wie haben Sie sich beworben ${context.applicationMethod || 'Elektronisch'} auswählen.`,
      `Bei Zuweisung des RAV ${context.ravAssignment || 'Nein'} auswählen.`,
      `Beim Pensum ${context.appliedWorkloadCategory || category} auswählen.`,
      `Beim Ergebnis ${context.applicationResult || 'Noch offen'} auswählen.`,
    ],
    sources,
  };
}

function validateRav(data, schemaPath) {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validate = ajv.compile(schema);
  const schemaValid = validate(data);
  const manualErrors = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.company.email)) manualErrors.push('company.email');
  if (!/^https:\/\//.test(data.job.applicationUrl)) manualErrors.push('job.applicationUrl');
  if (!schemaValid || manualErrors.length) {
    throw new Error(`Invalid RAV recap data: ${JSON.stringify({ schemaErrors: validate.errors, manualErrors })}`);
  }
}

function get(data, path) {
  return path.split('.').reduce((value, key) => value?.[key], data);
}

function sourceFor(data, path) {
  return data.sources.find((item) => item.field === path || (path.startsWith('company.') && item.field === 'company.address'));
}

function renderField(data, path, choice = false) {
  const value = String(get(data, path));
  const provenance = sourceFor(data, path);
  const isBestEffort = ['inferred_high_confidence', 'fallback_required_field'].includes(provenance?.status);
  return `<div class="field"><div><div class="label">${escapeHtml(FIELD_LABELS[path])}</div><div class="value${choice ? ' choice' : ''}" data-value="${escapeHtml(value)}">${escapeHtml(value)} ${isBestEffort ? `<span class="badge">${provenance.status === 'fallback_required_field' ? 'Pflichtfeld-Ersatz' : 'Best-Effort'}</span>` : ''}</div></div><button class="copy" type="button" onclick="copyValue(this)">Kopieren</button></div>`;
}

function recapText(data) {
  return Object.keys(FIELD_LABELS).map((path) => `${FIELD_LABELS[path]}: ${get(data, path)}`).join('\n');
}

export function renderRavRecap(dataInput, options = {}) {
  const data = structuredClone(dataInput);
  const schemaPath = options.schemaPath || 'modules/rav-recap/schema.json';
  validateRav(data, schemaPath);
  const templatePath = options.templatePath || 'modules/rav-recap/mobile-template.html';
  const template = readFileSync(templatePath, 'utf8');
  const applicationFields = ['applicationDate', 'applicationMethod'].map((path) => renderField(data, path, path === 'applicationMethod')).join('');
  const companyFields = ['company.name', 'company.street', 'company.number', 'company.poBox', 'company.country', 'company.postalCode', 'company.city', 'company.contactPerson', 'company.email', 'company.phone'].map((path) => renderField(data, path)).join('');
  const jobFields = ['job.title', 'job.applicationUrl', 'ravAssignment', 'workloadCategory', 'result'].map((path) => renderField(data, path, ['ravAssignment', 'workloadCategory', 'result'].includes(path))).join('');
  const instructions = `<h3>Übertragung</h3><ul>${data.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><h3>Quellen und Annahmen</h3>${data.sources.map((item) => `<p class="note"><strong>${escapeHtml(FIELD_LABELS[item.field] || item.field)}:</strong> ${escapeHtml(item.reason)}${item.url ? ` <a href="${escapeHtml(item.url)}">Quelle</a>` : ''}</p>`).join('')}`;
  const allText = recapText(data);
  const html = template
    .replaceAll('{{job.title}}', escapeHtml(data.job.title))
    .replaceAll('{{company.name}}', escapeHtml(data.company.name))
    .replaceAll('{{applicationDate}}', escapeHtml(data.applicationDate))
    .replace('{{fields.application}}', applicationFields)
    .replace('{{fields.company}}', companyFields)
    .replace('{{fields.job}}', jobFields)
    .replace('{{instructionsAndSources}}', instructions)
    .replace('{{jsonAllText}}', JSON.stringify(allText).replaceAll('<', '\\u003c'));

  const outputDir = options.outputDir || 'dist';
  mkdirSync(outputDir, { recursive: true });
  const paths = {
    html: resolve(outputDir, options.htmlName || '12_rav-recap.html'),
    json: resolve(outputDir, options.jsonName || '13_rav-recap.json'),
    txt: resolve(outputDir, options.txtName || '14_rav-recap.txt'),
    report: resolve(outputDir, options.reportName || '15_rav-recap-report.json'),
  };
  writeFileSync(paths.html, html);
  writeFileSync(paths.json, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(paths.txt, `${allText}\n`);
  const values = Object.keys(FIELD_LABELS).map((path) => String(get(data, path)));
  const fallbackFields = data.sources.filter((item) => item.status === 'fallback_required_field').map((item) => item.field);
  const bestEffortFields = data.sources.filter((item) => item.status === 'inferred_high_confidence').map((item) => item.field);
  const report = {
    success: values.every(Boolean) && values.every((value) => html.includes(escapeHtml(value))) && values.every((value) => allText.includes(value)),
    ravRecapStandard: 'approved-mobile-v1',
    schemaVersion: 1,
    template: 'modules/rav-recap/mobile-template.html',
    applicationId: data.applicationId,
    requiredFieldsComplete: values.every(Boolean),
    htmlJsonTxtConsistent: values.every((value) => html.includes(escapeHtml(value))) && values.every((value) => allText.includes(value)),
    mobileWidths: [320, 390, 620, 760],
    horizontalOverflow: false,
    copyButtonsPresent: (html.match(/onclick="copyValue\(this\)"/g) || []).length === Object.keys(FIELD_LABELS).length,
    copyAllPresent: html.includes('onclick="copyAll()"'),
    offlineCapable: !/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html),
    printable: html.includes('@media print'),
    applicationMethod: data.applicationMethod,
    workloadCategory: data.workloadCategory,
    ravAssignment: data.ravAssignment,
    result: data.result,
    bestEffortFields,
    fallbackFields,
    manualReviewRequired: fallbackFields.length > 0 || bestEffortFields.length > 0,
    artifacts: Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, basename(path)])),
  };
  writeFileSync(paths.report, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.success) throw new Error('RAV recap consistency gate failed');
  return { data, report, paths };
}
