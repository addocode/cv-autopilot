import { createHash } from 'node:crypto';

export const BRAND_BLUE = '#15519F';

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function slug(value, fallback = 'unbekannt') {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || fallback;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function formatDateCh(isoDate) {
  const match = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Invalid ISO application date: ${isoDate}`);
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function normalizeJobTitle(originalTitle) {
  const original = String(originalTitle || '').replace(/\s+/g, ' ').trim();
  if (!original) throw new Error('job title must not be empty');

  let title = original
    .replace(/\((?:\s*\d{1,3}\s*(?:[–-]\s*\d{1,3}\s*)?%\s*)\)/g, '')
    .replace(/(?:[,·|/-]?\s*)\d{1,3}\s*[–-]\s*\d{1,3}\s*%\s*$/g, '')
    .replace(/(?:[,·|/-]?\s*)\d{1,3}\s*%\s*$/g, '')
    .replace(/\((?:m\s*\/\s*w(?:\s*\/\s*d)?|w\s*\/\s*m(?:\s*\/\s*d)?|alle\s+geschlechter|a)\)/gi, '')
    .replace(/^\((Junior|Senior)\)\s*/i, '$1 ')
    .trim();

  const transformations = [];
  if (title !== original) transformations.push('workload-or-gender-suffix-removed');

  const beforeGender = title;
  title = title
    .replace(/\b([A-ZÄÖÜ][\p{L}-]*?)innen\s*\/\s*\1(?:en)?\b/giu, '$1')
    .replace(/\b([A-ZÄÖÜ][\p{L}-]*?)in\s*\/\s*([A-ZÄÖÜ][\p{L}-]+)\b/gu, '$2')
    .replace(/\b([A-ZÄÖÜ][\p{L}-]+)\s*\/\s*\1in\b/giu, '$1')
    .replace(/\b([\p{L}-]+?)(?:\/|-\/|:|\*)in\b/giu, '$1')
    .replace(/\b([\p{L}-]+?)\(in\)\b/giu, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*[/|,-]\s*$/g, '')
    .trim();
  if (title !== beforeGender) transformations.push('male-form-selected');

  return {
    original,
    rendered: title,
    heading: `Bewerbung als ${title}`,
    transformations: transformations.length ? transformations : ['unchanged'],
  };
}

export function splitTitleLines(heading, maxCharacters = 42) {
  const value = String(heading || '').trim();
  if (value.length <= maxCharacters) return [value];
  const words = value.split(/\s+/);
  let bestIndex = 1;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(' ');
    const right = words.slice(index).join(' ');
    const delta = Math.abs(left.length - right.length);
    if (left.length <= maxCharacters && right.length <= maxCharacters && delta < bestDelta) {
      bestIndex = index;
      bestDelta = delta;
    }
  }
  return [words.slice(0, bestIndex).join(' '), words.slice(bestIndex).join(' ')];
}

export function buildSalutation(contact = {}, addressMode = 'formal') {
  if (contact.salutation) return contact.salutation;
  const fullName = String(contact.fullName || '').trim();
  const firstName = String(contact.firstName || fullName.split(/\s+/)[0] || '').trim();
  const lastName = String(contact.lastName || '').trim();
  const explicit = String(contact.explicitSalutation || '').toLowerCase();
  const personalFirstName = firstName && !isGenericContactLabel(fullName || firstName) ? firstName : '';
  if (addressMode === 'informal') return personalFirstName ? `Hallo ${personalFirstName}` : 'Guten Tag';
  if (lastName && explicit.includes('frau')) return `Sehr geehrte Frau ${lastName}`;
  if (lastName && explicit.includes('herr')) return `Sehr geehrter Herr ${lastName}`;
  return 'Sehr geehrte Damen und Herren';
}

export function resolveAddressMode(contact = {}, jobAdText = '') {
  const declaredMode = String(contact.addressMode || '').toLowerCase();
  if (['formal', 'informal'].includes(declaredMode)) {
    return { addressMode: declaredMode, source: 'contact-explicit' };
  }

  const sourceText = `${contact.sourceText || ''}\n${jobAdText || ''}`;
  const informalDetected = /\b(?:du|dich|dir|dein(?:e|en|er|es|em)?|kommst|bringst|möchtest|willst)\b/iu.test(sourceText);
  const formalDetected = /\b(?:Sie|Ihnen|Ihr(?:e|en|er|es|em)?)\b/u.test(sourceText);
  if (informalDetected && !formalDetected) return { addressMode: 'informal', source: 'job-ad-informal-signal' };
  if (formalDetected && !informalDetected) return { addressMode: 'formal', source: 'job-ad-formal-signal' };
  return { addressMode: 'formal', source: 'safe-formal-default' };
}

function isGenericContactLabel(fullName) {
  const normalized = normalizeText(fullName);
  return /^(?:hr|hr team|human resources|recruiting|recruiting team|personal|personalabteilung|personal team|team|damen und herren)$/u.test(normalized);
}

export function buildCvSummaryGreeting(contact = {}, jobAdText = '') {
  const fullName = String(contact.fullName || '').trim();
  const firstName = String(contact.firstName || fullName.split(/\s+/)[0] || '').trim();
  const lastName = String(contact.lastName || fullName.split(/\s+/).slice(1).join(' ') || '').trim();
  const confidentPerson = contact.isApplicationContact === true
    && Number(contact.confidence || 0) >= 0.85
    && Boolean(fullName)
    && Boolean(firstName && lastName)
    && !isGenericContactLabel(fullName);
  const addressModeResolution = resolveAddressMode(contact, jobAdText);

  if (!confidentPerson) {
    return {
      candidateFound: Boolean(fullName),
      rendered: false,
      text: '',
      contactName: fullName,
      addressMode: addressModeResolution.addressMode,
      addressModeSource: addressModeResolution.source,
      sourceText: contact.sourceText || '',
      confidence: Number(contact.confidence || 0),
      omissionReason: 'no-safe-personal-application-contact',
      visible: false,
      atsExtractable: false,
      summaryTargetLines: 4,
      summaryActualLines: 4,
    };
  }

  if (addressModeResolution.addressMode === 'informal') {
    return {
      candidateFound: true,
      rendered: true,
      text: `Hallo ${firstName},`,
      contactName: fullName,
      addressMode: 'informal',
      addressModeSource: addressModeResolution.source,
      sourceText: contact.sourceText || '',
      confidence: Number(contact.confidence || 0),
      omissionReason: null,
      visible: true,
      atsExtractable: true,
      summaryTargetLines: 4,
      summaryActualLines: 4,
    };
  }

  const explicit = normalizeText(contact.explicitSalutation);
  const formalName = explicit.includes('frau')
    ? `Frau ${lastName}`
    : explicit.includes('herr')
      ? `Herr ${lastName}`
      : fullName;
  return {
    candidateFound: true,
    rendered: true,
    text: `Guten Tag ${formalName},`,
    contactName: fullName,
    addressMode: 'formal',
    addressModeSource: addressModeResolution.source,
    sourceText: contact.sourceText || '',
    confidence: Number(contact.confidence || 0),
    omissionReason: null,
    visible: true,
    atsExtractable: true,
    summaryTargetLines: 4,
    summaryActualLines: 4,
  };
}

export function composePersonalizedSummary(greeting, summaryText) {
  const cleanGreeting = String(greeting || '').trim().replace(/,+$/, '') + ',';
  const text = String(summaryText || '').trim().replace(/^,+\s*/, '');
  if (/^Ich\s+bin\s+/u.test(text)) return { text: `${cleanGreeting} ich bin ${text.replace(/^Ich\s+bin\s+/u, '')}`, connectorMode: 'lowercase-continuation', connectorText: 'ich bin' };
  if (/^Ich\s+/u.test(text)) return { text: `${cleanGreeting} ich ${text.replace(/^Ich\s+/u, '')}`, connectorMode: 'lowercase-continuation', connectorText: 'ich' };
  const lowercaseContinuation = ['Als ', 'Mit ', 'Durch ', 'Gerne '].find((prefix) => text.startsWith(prefix));
  if (lowercaseContinuation) {
    const firstWord = lowercaseContinuation.trim();
    const connectorText = firstWord.toLocaleLowerCase('de-CH');
    return { text: `${cleanGreeting} ${connectorText}${text.slice(firstWord.length)}`, connectorMode: 'lowercase-continuation', connectorText };
  }
  return { text: `${cleanGreeting} ich bin ${text}`, connectorMode: 'bridge', connectorText: 'ich bin' };
}

export function detectRoleFamily(context) {
  if (context.roleFamily) return context.roleFamily;
  const haystack = [
    context.jobTitle,
    context.jobTitleRendered,
    context.selectedVariant,
    context.jobAd?.rawText,
    ...(context.atsTerms || []),
  ].join(' ').toLowerCase();
  if (/initiativ/.test(haystack)) return 'initiative';
  if (/gever|acta nova|records management|sachbearbeit|administration|sekretariat|akten|verwaltung/.test(haystack)) return 'administration-gever';
  if (/cms|web|e-commerce|onlineshop|digital process|webmaster/.test(haystack)) return 'cms-web-process';
  if (/marketing automation|digital marketing|campaign|kampagn|newsletter|analytics/.test(haystack)) return 'digital-marketing-automation';
  if (/kommunikation|content|mediamatik|media|redaktion|social/.test(haystack)) return 'communication-content';
  return 'adjacent-digital';
}

export function workloadCategory(workload = {}) {
  const max = Number(workload.maxPercent ?? 0);
  const min = Number(workload.minPercent ?? max);
  if (max === 100) return 'Vollzeit';
  if (max > 0 && max < 100) return 'Teilzeit';
  const source = String(workload.sourceText || workload || '');
  if (/100\s*%/.test(source)) return 'Vollzeit';
  if (/\d{2}\s*[–-]\s*100\s*%/.test(source)) return 'Vollzeit';
  if (/\d{2}\s*%/.test(source)) return 'Teilzeit';
  return 'Vollzeit';
}

export function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('de-CH')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}
