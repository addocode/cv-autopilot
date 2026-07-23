import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function yaml(value) {
  return JSON.stringify(String(value ?? ''));
}

function tableCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replace(/\s*\n\s*/g, ' ').trim();
}

function publicContacts(context) {
  const candidates = [
    ['Fachkontakt', context.jobContact],
    ['Bewerbungskontakt', context.applicationContact || context.contact],
  ];
  const grouped = new Map();
  for (const [purpose, contact] of candidates) {
    if (!contact?.fullName) continue;
    const key = [contact.fullName, contact.email, contact.phone].join('|');
    const existing = grouped.get(key);
    if (existing) {
      existing.purposes.push(purpose);
      continue;
    }
    grouped.set(key, {
      purposes: [purpose],
      name: contact.fullName,
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
  }
  return [...grouped.values()].map(({ purposes, ...contact }) => ({
    purpose: purposes.join(' / '),
    ...contact,
  }));
}

export function buildJobAdArchiveMarkdown(context, originalText) {
  const contacts = publicContacts(context);
  const source = context.source || {};
  const contactRows = contacts.length
    ? contacts.map((contact) => `| ${tableCell(contact.purpose)} | ${tableCell(contact.name)} | ${tableCell(contact.role)} | ${tableCell(contact.email)} | ${tableCell(contact.phone)} |`).join('\n')
    : '| Nicht eindeutig genannt |  |  |  |  |';

  return `---
schema_version: 1
application_id: ${yaml(context.applicationId)}
application_date: ${yaml(context.applicationDate)}
source_url: ${yaml(source.url)}
source_filename: ${yaml(source.filename)}
source_content_sha256: ${yaml(source.sha256)}
employer: ${yaml(context.employer)}
job_title: ${yaml(context.jobTitleOriginal || context.jobTitle)}
location: ${yaml(context.location)}
workload: ${yaml(context.workload)}
archive_scope: "public-job-ad-only"
---

# ${context.jobTitleOriginal || context.jobTitle}

> ${context.employer} · ${context.location || 'Arbeitsort nicht genannt'} · ${context.workload || 'Pensum nicht genannt'}

## Quelle

- Originalquelle: ${source.url || 'Vom Nutzer bereitgestellter Inseratstext'}
- Bewerbungsdatum: ${context.applicationDate}
- Inhalts-Hash (SHA-256): \`${source.sha256}\`

## Im Inserat publizierte Kontakte

| Zweck | Name | Funktion | E-Mail | Telefon |
|---|---|---|---|---|
${contactRows}

## Vollständiger Originaltext

${String(originalText || '').trim()}
`;
}

export function writeJobAdArchive({ root = 'job-ad-archive', context, originalText }) {
  const directory = join(root, context.applicationId);
  const path = join(directory, '00_stelleninserat.md');
  mkdirSync(directory, { recursive: true });
  writeFileSync(path, buildJobAdArchiveMarkdown(context, originalText));
  return path;
}
