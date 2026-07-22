import { escapeHtml, formatDateCh } from '../../application-core/src/utils.mjs';

function renderRuns(runs) {
  return runs.map((entry) => entry.emphasis
    ? `<strong>${escapeHtml(entry.text)}</strong>`
    : escapeHtml(entry.text)).join('');
}

export function renderMotivationLetterHtml(letter, css, assets) {
  const title = letter.titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('');
  const paragraphs = letter.paragraphs.map((item, index) => `<p data-purpose="${escapeHtml(item.purpose)}" data-evidence-ids="${escapeHtml(item.evidenceIds.join(','))}" data-paragraph-index="${index}">${renderRuns(item.runs)}</p>`).join('\n');
  const reference = letter.reference.visible
    ? `<div class="letter__reference" id="letter-reference">${escapeHtml(letter.reference.label)}: ${escapeHtml(letter.reference.value)}</div>`
    : '';
  const hydratedCss = css
    .replaceAll('__BACKGROUND_DATA_URL__', assets.background)
    .replaceAll('__LOGO_DATA_URL__', assets.logo);
  return `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(letter.titleLines.join(' '))}</title>
<style>${hydratedCss}</style>
</head>
<body>
<main class="letter" id="motivation-letter" data-layout-contract="approved-golden-v1">
  <div class="letter__frame" id="letter-frame"></div>
  <div class="letter__paper" id="letter-paper"></div>
  <img class="letter__logo" id="letter-logo" alt="AD" src="${assets.logo}">
  ${reference}
  <h1 class="letter__title" id="letter-title">${title}</h1>
  <section class="letter__stack" id="letter-stack">
    <div class="letter__body" id="letter-body">
      <p class="letter__salutation" id="letter-salutation">${escapeHtml(letter.salutation)}</p>
      ${paragraphs}
    </div>
    <div class="letter__signature" id="letter-signature">
      <p>Freundliche Grüsse</p>
      <p>${escapeHtml(letter.signature.firstName)} <a href="${escapeHtml(letter.signature.url)}"><span>${escapeHtml(letter.signature.lastName)}</span><b>${escapeHtml(letter.signature.domainSuffix)}</b></a></p>
    </div>
  </section>
  <div class="letter__date" id="letter-date">${escapeHtml(letter.place)}, ${formatDateCh(letter.generationDate)}</div>
</main>
<script>
function alignLetterDate(){
  const page=document.getElementById('motivation-letter').getBoundingClientRect();
  const salutation=document.getElementById('letter-salutation').getBoundingClientRect();
  document.getElementById('letter-date').style.top=(salutation.top-page.top)+'px';
}
document.fonts.ready.then(alignLetterDate);
window.addEventListener('load',alignLetterDate);
</script>
</body>
</html>`;
}
