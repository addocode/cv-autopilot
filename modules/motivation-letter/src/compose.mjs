import {
  buildSalutation,
  normalizeJobTitle,
  splitTitleLines,
  wordCount,
} from '../../application-core/src/utils.mjs';

const GENERIC_BLOCKLIST = [
  'hiermit bewerbe ich mich',
  'mit grossem interesse habe ich',
  'teamfähig und belastbar',
  'suche eine neue herausforderung',
];

function run(text, emphasis = false) {
  return { text, emphasis };
}

function paragraph(runs, evidenceIds, purpose) {
  return { runs, evidenceIds: [...new Set(evidenceIds.filter(Boolean))], purpose };
}

function roleEvidenceParagraphs(strategy) {
  const evidence = strategy.selectedEvidence || [];
  const byId = new Map(evidence.map((item) => [item.id, item]));
  const first = evidence[0];
  const second = evidence[1];
  const third = evidence[2];

  if (strategy.roleFamily === 'administration-gever') {
    const acta = byId.get('bullet-rs-acta-nova') || first;
    const quality = byId.get('bullet-rs-quality') || second;
    const process = byId.get('bullet-kunz-process-handover') || third;
    return [
      paragraph([
        run('Während meines Führungsdienstes im Stab Personelles der Armee arbeitete ich mit '),
        run('GEVER und ACTA NOVA', true),
        run(`. ${acta?.text || 'Digitale Geschäftsvorgänge, Dokumente und Zuständigkeiten bearbeitete ich dabei strukturiert und nachvollziehbar'}. Diese Praxis gibt mir eine konkrete Grundlage für verlässliche administrative Abläufe.`),
      ], [acta?.id], 'primary-evidence'),
      paragraph([
        run(`${quality?.text || 'Qualitätssicherung und formale Kontrolle von Informationen'} gehörten ebenso zu meiner Arbeit. `),
        run(`${process?.text || 'Prozessdokumentation und Wissenssicherung'} ergänzen dieses Profil. So verbinde ich Sorgfalt im Detail mit dem Blick für wiederkehrende Abläufe und eine saubere Übergabe.`),
      ], [quality?.id, process?.id], 'secondary-evidence'),
    ];
  }

  if (strategy.roleFamily === 'digital-marketing-automation') {
    const campaigns = byId.get('bullet-kunz-campaigns') || first;
    const web = byId.get('bullet-kunz-websites-landing') || second;
    const analytics = byId.get('skill-google-analytics') || third;
    return [
      paragraph([
        run('Bei Kunz Kunath AG betreute ich Websites und Onlineshops, konzipierte Newsletter sowie Kampagnen und koordinierte deren Umsetzung. '),
        run('Digital Marketing, Web und Content'),
        run(' habe ich dadurch nicht als getrennte Disziplinen erlebt, sondern als zusammenhängenden Prozess von der Idee bis zur Veröffentlichung und Auswertung.'),
      ], [campaigns?.id, web?.id], 'primary-evidence'),
      paragraph([
        run(`Mit ${analytics?.text || 'Google Analytics und digitaler Erfolgskontrolle'} bringe ich einen konkreten Datenbezug mit. `),
        run('HTML und CSS', true),
        run(' sowie CMS- und Webshop-Praxis helfen mir, technische Anforderungen zu verstehen, sauber mit Fachstellen abzustimmen und neue Systeme strukturiert zu erschliessen.'),
      ], [analytics?.id, byId.get('tool-html-css')?.id], 'secondary-evidence'),
    ];
  }

  const primary = [first, second].filter(Boolean);
  const secondary = [third, evidence[3]].filter(Boolean);
  return [
    paragraph([
      run('In meiner bisherigen Praxis verband ich '),
      run(primary.map((item) => item.text).join(' und ') || 'digitale Umsetzung, Kommunikation und Koordination', true),
      run('. Dabei übernahm ich Aufgaben von der strukturierten Vorbereitung bis zur zuverlässigen Veröffentlichung beziehungsweise Übergabe.'),
    ], primary.map((item) => item.id), 'primary-evidence'),
    paragraph([
      run(`${secondary.map((item) => item.text).join(' und ') || 'Technisches Verständnis und Prozessdokumentation'} ergänzen mein Profil. Ich arbeite mich rasch in neue Systeme ein, halte Entscheidungen nachvollziehbar fest und koordiniere interne wie externe Beteiligte verbindlich.`),
    ], secondary.map((item) => item.id), 'secondary-evidence'),
  ];
}

function composeFallback(context, strategy) {
  const title = normalizeJobTitle(context.jobTitleOriginal || context.jobTitle);
  const jobSource = context.jobAd?.sourceId || `job-ad:${context.applicationId}`;
  const evidenceParagraphs = roleEvidenceParagraphs(strategy);
  const paragraphs = [
    paragraph([
      run(`${strategy.employerMotivation} `),
      run(title.rendered, true),
      run(` ist für mich besonders interessant, weil ich ${strategy.motivationAngle.toLowerCase()}.`),
    ], [jobSource], 'role-and-employer-motivation'),
    paragraph([
      run('Als '),
      run('Mediamatiker EFZ mit Berufsmaturität', true),
      run(` bringe ich eine breite Verbindung aus digitaler Praxis, technischem Verständnis und strukturierter Umsetzung mit. Für ${context.employer} möchte ich diese Grundlage gezielt in die Aufgaben der ausgeschriebenen Funktion übertragen.`),
    ], ['education-mediamatiker-efz-berufsmaturitaet', jobSource], 'positioning'),
    ...evidenceParagraphs,
  ];

  if (strategy.gapHandling?.length) {
    const gap = strategy.gapHandling[0];
    paragraphs.push(paragraph([
      run(`Direkte Erfahrung mit ${gap.requirement} behaupte ich nicht. `),
      run('Entscheidend ist für mich der ehrliche Transfer'),
      run(`: ${gap.handling} Neue Anwendungen und Fachabläufe eigne ich mir mit klarer Dokumentation, Rückfragen und praktischer Anwendung an.`),
    ], [jobSource, ...(strategy.selectedEvidenceIds || []).slice(0, 2)], 'honest-gap-bridge'));
  } else {
    paragraphs.push(paragraph([
      run(`${strategy.valueProposition}. Mein Ziel für die ersten Monate wäre, die bestehenden Abläufe genau zu verstehen, operative Aufgaben zuverlässig zu übernehmen und Verbesserungsmöglichkeiten gemeinsam mit dem Team nachvollziehbar weiterzuentwickeln.`),
    ], [jobSource, ...(strategy.selectedEvidenceIds || []).slice(0, 3)], 'value-proposition'));
  }

  if (strategy.longTermSignal?.use) {
    paragraphs.push(paragraph([
      run('Ich sehe diese Bewerbung als '),
      run('bewussten langfristigen Entwicklungsschritt', true),
      run(` und nicht als Zwischenlösung. ${strategy.longTermSignal.reason} Ich möchte Verantwortung aufbauen, mich fachlich vertiefen und dauerhaft zu verlässlichen Ergebnissen beitragen.`),
    ], [jobSource], 'long-term-signal'));
  }

  paragraphs.push(paragraph([
    run(`Gerne erläutere ich Ihnen persönlich, wie ich meine Erfahrung und meine strukturierte Arbeitsweise bei ${context.employer} einbringen und weiterentwickeln möchte.`),
  ], [jobSource], 'closing'));
  return paragraphs;
}

function normalizePreparedParagraphs(letterContent) {
  return letterContent.paragraphs.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`letterContent.paragraphs[${index}] must be an object`);
    const evidenceIds = item.evidenceIds || [];
    if (!evidenceIds.length) throw new Error(`letterContent.paragraphs[${index}] requires evidenceIds`);
    let runs = item.runs;
    if (!runs) {
      const text = String(item.text || '').trim();
      if (!text) throw new Error(`letterContent.paragraphs[${index}] requires text or runs`);
      const emphasis = String(item.emphasis || '').trim();
      if (emphasis && text.includes(emphasis)) {
        const [before, ...rest] = text.split(emphasis);
        runs = [run(before), run(emphasis, true), run(rest.join(emphasis))].filter((entry) => entry.text);
      } else {
        runs = [run(text)];
      }
    }
    return { runs, evidenceIds, purpose: item.purpose || `prepared-${index + 1}` };
  });
}

export function composeMotivationLetter(context, strategy) {
  const title = normalizeJobTitle(strategy.jobTitleOriginal || context.jobTitleOriginal || context.jobTitle);
  const salutation = strategy.letterContent?.salutation || buildSalutation(context.applicationContact || context.contact, context.addressMode);
  const paragraphs = strategy.letterContent?.paragraphs
    ? normalizePreparedParagraphs(strategy.letterContent)
    : composeFallback(context, strategy);
  const plainText = [salutation, ...paragraphs.map((item) => item.runs.map((entry) => entry.text).join('')), 'Freundliche Grüsse', 'Adam Dolinsky'].join('\n\n');
  const genericPhrases = GENERIC_BLOCKLIST.filter((phrase) => plainText.toLowerCase().includes(phrase));
  const reference = context.jobAd?.reference || {
    value: context.referenceNumber || '',
    visible: Boolean(context.referenceNumber),
    label: 'Referenz',
  };
  const titleLines = strategy.letterContent?.titleLines || splitTitleLines(title.heading);
  const emphasisGroups = paragraphs.flatMap((item) => item.runs.filter((entry) => entry.emphasis).map((entry) => entry.text));
  return {
    schemaVersion: 1,
    applicationId: context.applicationId,
    generationDate: context.generationDate || context.applicationDate,
    place: context.place || 'Bern',
    employer: context.employer,
    jobTitleOriginal: title.original,
    jobTitleRendered: title.rendered,
    titleLines,
    salutation,
    reference: {
      label: reference.label || 'Referenz',
      value: reference.value || '',
      visible: reference.visible === true && Boolean(reference.value),
    },
    paragraphs,
    signature: {
      firstName: 'Adam',
      lastName: 'Dolinsky',
      domainSuffix: '.ch',
      url: 'https://dolinsky.ch',
    },
    selectedEvidenceIds: strategy.selectedEvidenceIds,
    contentMode: strategy.letterContent?.paragraphs ? 'structured-approved-draft' : 'deterministic-safe-draft',
    genericPhrases,
    wordCount: wordCount(plainText),
    emphasisGroups,
  };
}

export function validateLetterContent(letter) {
  if (!letter.applicationId) throw new Error('letter.applicationId is required');
  if (!letter.generationDate) throw new Error('letter.generationDate is required');
  if (!Array.isArray(letter.titleLines) || letter.titleLines.length < 1 || letter.titleLines.length > 2) throw new Error('letter.titleLines must contain one or two lines');
  if (!letter.salutation) throw new Error('letter.salutation is required');
  if (!Array.isArray(letter.paragraphs) || letter.paragraphs.length < 4) throw new Error('letter requires at least four paragraphs');
  if (letter.genericPhrases.length) throw new Error(`Blocked generic phrases: ${letter.genericPhrases.join(', ')}`);
  if (letter.emphasisGroups.length < 2 || letter.emphasisGroups.length > 4) throw new Error(`letter requires 2-4 emphasis groups; got ${letter.emphasisGroups.length}`);
  for (const [index, item] of letter.paragraphs.entries()) {
    if (!item.evidenceIds?.length) throw new Error(`letter.paragraphs[${index}] has no evidenceIds`);
    if (!item.runs?.length) throw new Error(`letter.paragraphs[${index}] has no runs`);
  }
  return letter;
}
