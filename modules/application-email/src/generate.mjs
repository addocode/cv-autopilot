import { buildSalutation, normalizeJobTitle, wordCount } from '../../application-core/src/utils.mjs';

function yaml(value) {
  return JSON.stringify(String(value ?? ''));
}

function recipient(context) {
  const contact = context.applicationContact || context.contact || {};
  const value = String(contact.email || context.companyResearch?.email || '').trim();
  const sourceStatus = contact.emailStatus || context.companyResearch?.emailStatus || '';
  if (!value) return { value: '', status: 'missing-review-required' };
  if (['inferred_high_confidence', 'fallback_required_field', 'best_effort'].includes(sourceStatus)) {
    return { value, status: 'best-effort-review-suggestion' };
  }
  return { value, status: 'explicit-or-official' };
}

export function generateApplicationEmail(context, strategy) {
  const title = normalizeJobTitle(strategy.jobTitleOriginal || context.jobTitleOriginal || context.jobTitle);
  const contact = context.applicationContact || context.contact || {};
  const to = recipient(context);
  const salutation = strategy.mailContent?.salutation || buildSalutation(contact, context.addressMode);
  const referenceSuffix = context.jobAd?.reference?.visible && context.jobAd.reference.value
    ? ` · ${context.jobAd.reference.label || 'Referenz'} ${context.jobAd.reference.value}`
    : '';
  const subject = strategy.mailContent?.subject || `${title.heading}${referenceSuffix}`;
  const paragraphs = strategy.mailContent?.paragraphs || [
    `Im Anhang sende ich Ihnen meine Bewerbungsunterlagen für die Position als ${title.rendered}. ${strategy.motivationAngle}.`,
    `${strategy.valueProposition}. Gerne erläutere ich Ihnen in einem persönlichen Gespräch, wie ich meine Erfahrung bei ${context.employer} einbringen kann.`,
  ];
  const body = [salutation, ...paragraphs, 'Freundliche Grüsse', 'Adam Dolinsky'].join('\n\n');
  const markdown = `---\napplication_id: ${yaml(context.applicationId)}\nto: ${yaml(to.value)}\nrecipient_status: ${yaml(to.status)}\nsubject: ${yaml(subject)}\ncontact_name: ${yaml(contact.fullName || '')}\nstatus: "draft"\nautomatic_send: false\n---\n\n${body}\n`;
  return {
    applicationId: context.applicationId,
    to,
    subject,
    contactName: contact.fullName || '',
    salutation,
    paragraphs,
    body,
    markdown,
    wordCount: wordCount(body),
    status: 'draft',
    automaticSend: false,
  };
}
