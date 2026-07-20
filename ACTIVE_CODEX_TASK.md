# ACTIVE CODEX TASK — Review Runde 53

## Arbeitskontext

Arbeite ausschliesslich im privaten Repository `addocode/cv-autopilot` auf dem bestehenden Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch und keinen neuen Pull Request.
- Rufe `make_pr` nicht auf.
- Merge weder PR #6 noch PR #5.
- Verändere das finale CV-Design, die Schriftgrössen, Icons, Seitenzahl und eingefrorene Geometrie nicht.
- Diese Datei ersetzt alle früheren aktiven Review-Aufträge.

## Pflichtprüfung

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 53` beginnt.
4. Bei Abweichung nichts verändern und ausschliesslich `STALE SNAPSHOT` melden.

---

# 1. Verifizierte Ausgangslage

Workflow Run 63 war vollständig grün, inklusive:

- Build und Validierung
- Datentests
- Application-Workflow-Test
- vier neutrale Produktionsrenders
- Render-Tests
- finaler Guard übersprungen

Der erste echte kontrollierte Live-Test wurde mit dem öffentlichen Inserat `Admin. Sachbearbeiter/-in FK` der Parlamentsdienste PD durchgeführt.

Das Live-PDF selbst wurde erfolgreich erzeugt:

- gewählte Variante: `administration-gever`
- `report.success === true`
- exakt zwei Seiten
- keine Overflows
- keine Collisions
- keine Warnings
- ATS erfolgreich
- Pensum korrekt erkannt: `80 % gemäss Inserat, flexibel nach Absprache`
- Anwendungskontakt korrekt und sicher erkannt: `Loïc Chatton`, neutraler Modus
- Greeting in den Fliesstext integriert

Der Live-Lauf deckte jedoch reale Produktionsfehler auf. Diese dürfen nicht durch schwächere Tests oder manuelle Nachbearbeitung umgangen werden.

---

# 2. Manifest-/Export-Blocker korrigieren

`scripts/create-application.mjs` prüft derzeit:

```js
report.selectedVariant !== selectedVariant
```

Der echte Renderer schreibt die Variante aber als:

```json
{
  "variant": "administration-gever"
}
```

Dadurch bricht ein realer Lauf nach erfolgreichem PDF und Render-Report ab. Im Live-Test fehlten deshalb:

- `04_manifest.json`
- `exports/<applicationId>.tar.gz`

Verbindliche Korrektur:

- Nutze einen einheitlichen kanonischen Reportschlüssel.
- Bevorzugt soll der Renderer zusätzlich `selectedVariant` ausgeben und `variant` aus Kompatibilitätsgründen beibehalten.
- Der Archivgenerator darf alternativ robust `report.selectedVariant || report.variant` lesen.
- Der Gate-Vergleich muss die tatsächlich gerenderte Variante prüfen.
- Ein echter erfolgreicher Lauf muss Manifest und Exportarchiv erzeugen.
- Manifest-Hashes müssen nach dem finalen Archivaufbau konsistent sein.

Ergänze Regressionstests für den echten Renderer-Reportvertrag.

---

# 3. Eintritt `nach Vereinbarung` korrekt normalisieren

Der strukturierte Kontext enthielt korrekt:

```json
{
  "kind": "negotiable",
  "sourceText": "nach Vereinbarung",
  "confidence": 0.99
}
```

Der Renderer erzeugte trotzdem:

```text
Per sofort oder nach Vereinbarung
```

und meldete `usedFallback: true`.

Das ist sachlich falsch, weil das Inserat den Eintritt ausdrücklich nennt.

Verbindlich:

- `start.kind === "negotiable"` und klarer Text `nach Vereinbarung` werden als sichere Inseratsangabe erkannt.
- Sichtbarer Footertext exakt:

```text
Nach Vereinbarung
```

- `usedFallback === false`
- `confidence` bleibt die Eingabekonfidenz.
- ATS-Text und Report enthalten denselben Wert.
- Der neutrale Produktionsrender ohne Inserat bleibt unverändert:

```text
Per sofort oder nach Vereinbarung
```

Ergänze Tests für `date`, `immediately`, `negotiable` und `unknown`.

---

# 4. Grammatik der integrierten Anrede korrigieren

Der Live-CV schrieb:

```text
Guten Tag Loïc Chatton, ich bin mediamatiker EFZ ...
```

Richtig ist:

```text
Guten Tag Loïc Chatton, ich bin Mediamatiker EFZ ...
```

Die Bridge-Logik darf den Anfang eines nominalen Berufs-/Abschlussausdrucks nicht pauschal kleinschreiben.

Verbindlich:

- Bei eingefügtem `ich bin` bleibt `Mediamatiker EFZ` grossgeschrieben.
- Direkte Fortsetzungen wie `Ich arbeite ...` dürfen weiterhin grammatisch zu `ich arbeite ...` werden.
- Verwende eine deterministische, getestete Verbindungslogik und keine generelle Kleinschreibung des ersten Zeichens.
- Anrede und Kurzprofil bleiben ein einziger Fliesstext.
- Keine `.summary-greeting`.
- Kurzprofil weiterhin exakt vier Zeilen.
- Formeller, informeller und neutraler Kontaktmodus testen.

---

# 5. Live-/Application-Workflow darf Fehler nicht maskieren

Der temporäre Live-Schritt verwendete eine Pipe zu `tee`. Der Node-Prozess scheiterte, aber der Schritt wurde wegen des Exitcodes von `tee` als erfolgreich markiert.

Verbindlich für jeden dokumentierten oder zukünftigen Application-Run:

```bash
set -o pipefail
node ... 2>&1 | tee ...
```

oder gleichwertige explizite Erfassung von `${PIPESTATUS[0]}`.

- Kein fehlgeschlagener `create-application`-Lauf darf als Erfolg erscheinen.
- Der Exitcode muss im Artefakt beziehungsweise Statusreport festgehalten werden.
- Bei Fehlern sollen Diagnoseartefakte trotzdem hochgeladen werden, ohne Erfolg vorzutäuschen.

---

# 6. Application-Artefakte von neutralem Visual Review isolieren

Beim Live-Test lagen zusätzlich zu den vier neutralen PDFs/acht PNGs auch anwendungsspezifische Dateien in `dist/`.

Dadurch zählte das Visual Review fünf PDFs statt vier und der neutrale Render-Test schlug fehl, obwohl alle vier neutralen Reports grün waren.

Verbindlich:

- Neutraler Visual Review zählt ausschliesslich die vier kanonischen neutralen Produktionsdateien.
- Anwendungsspezifische Suffix-Artefakte dürfen die neutralen Counts nicht verändern.
- Alternativ darf ein Application-E2E-Schritt erst nach erfolgreichem neutralem Render-/Testlauf ausgeführt werden.
- Die Architektur muss mehrere Bewerbungsakten im selben Workspace erlauben.
- Keine glob-basierte falsche Zählung fremder PDFs/PNGs.

Ergänze einen Test mit vier neutralen und mindestens einem anwendungsspezifischen Render im selben `dist/`.

---

# 7. Echter Playwright-End-to-End-Test für Bewerbungsakten

Der bestehende Application-Test mit `--skip-render-for-tests` bleibt als schneller Unit-Test erhalten, reicht aber nicht als Produktionsgate.

Ergänze in CI einen isolierten vollständig fiktiven E2E-Test mit echtem Playwright-Render:

- strukturierter Schema-v2-Kontext
- sichere formelle oder neutrale Kontaktperson
- eindeutiges Pensum
- Eintritt `nach Vereinbarung`
- gewählte Variante `administration-gever`
- PDF und Preview
- `05_render-report.json`
- `04_manifest.json`
- deterministisches `.tar.gz`

Der Test muss prüfen:

- Prozess-Exitcode `0`
- `report.success === true`
- zwei Seiten
- keine Overflows, Collisions oder Warnings
- ATS erfolgreich
- korrektes Pensum
- `Nach Vereinbarung`
- grammatisch korrekt integriertes Greeting
- tatsächliche Variante stimmt
- alle Manifest-Dateien vorhanden
- alle Hashes stimmen
- Exportarchiv entpackbar und vollständig
- neutrale Produktionsartefakte unverändert

Keine echten Arbeitgeber- oder Kontaktdaten in öffentliche Fixtures übernehmen.

---

# 8. Bewerbungsakte um alle echten Eckdaten erweitern

Die Live-Markdown-Akte war grundsätzlich gut lesbar, liess aber vorhandene Inseratsangaben aus.

Erweitere den strukturierten Kontext und die Markdown-Ausgabe datengetrieben um optionale Felder:

- `employmentType` / Anstellungsart
- `referenceNumber` / Referenz- oder Job-ID
- `applicationDeadline`
- `organisationUnit`
- `homeOffice` / Arbeitsmodell
- `jobContact` für fachliche Fragen
- `applicationContact` für Bewerbungsfragen
- `benefits`
- `employerDescription`
- `applicationProcess`
- `additionalNotes`

Für mehrere Kontakte:

- Zweck klar ausweisen: `Fragen zur Stelle` beziehungsweise `Fragen zur Bewerbung`.
- Nur der sichere Bewerbungskontakt darf für das CV-Greeting verwendet werden.
- Keine E-Mail-Adresse erfinden, wenn nur ein Nachrichtenformular vorhanden ist.

Markdown:

- Eckdatentabelle zeigt alle vorhandenen Werte.
- Kontaktbereich zeigt beide Kontaktpersonen und ihren Zweck.
- `Arbeitgeber, Umfeld und Benefits` darf nicht bloss `-` enthalten, wenn entsprechende Angaben vorhanden sind.
- Bewerbungsprozess enthält Onlineportal, komplettes Dossier und vorhandene Fristen.
- Offene Punkte nennen tatsächlich fehlende Angaben, beispielsweise fehlende Bewerbungsfrist oder nicht sichtbare direkte E-Mail-Adresse.
- Keine Aussage `Keine offensichtlichen offenen Pflichtpunkte`, wenn relevante Metadaten fehlen.
- Der vollständige Originaltext bleibt unverändert archiviert.

Unbekannte Werte bleiben leer beziehungsweise werden als nicht genannt markiert. Nichts erfinden.

---

# 9. Belegmatrix präzisieren

- Entferne die pauschale zusätzliche Tabellenzeile `Nicht belegte Zusatzanforderung`, wenn konkrete `unsupported_rejected`-Anforderungen bereits vorhanden sind.
- Jede Inseratsanforderung soll genau einmal vorkommen.
- `verified` nur bei direkter belegter Aussage.
- `defensible_inference` bei plausibler, aber nicht wortgleicher Übertragbarkeit.
- `unsupported_rejected` darf niemals in den CV gelangen.
- `Source-ID` muss auf reale Masterquellen verweisen oder bei Ablehnung klar `job-ad` lauten.
- Die Aussage `fehlerfreie Korrespondenz` darf nicht allein durch eine Sprachstufe automatisch als vollständig verifiziert gelten; redaktionelle und sprachliche Evidenz gemeinsam und konservativ bewerten.

---

# 10. Stellenbezogene Priorisierung tatsächlich nutzen

Der Live-Test wählte korrekt `administration-gever` und priorisierte relevante Experience-Bullets. Auf Seite 1 blieben jedoch mehrere deutlich weniger relevante Basispunkte sichtbar, unter anderem Onlineshop, Google Analytics und Social Media, während das Inserat stark auf Sitzungsorganisation, Dokumentenmanagement, Revision, administrative Auskünfte, interne/externe Kontakte und Amtssprachen fokussiert.

Nutze `applicationContext.atsTerms`, Aufgaben, Muss-Anforderungen und Systeme für eine echte datengetriebene Relevanzbewertung vorhandener Inhalte.

Verbindlich:

- Nur bereits vorhandene source-backed Inhalte verwenden.
- Keine neuen Fähigkeiten aus Inseratsbegriffen erfinden.
- Berechne pro Skill-/Experience-Bullet einen transparenten `jobAdMatchScore` aus Tags, ATS-Synonymen und normalisierten Inseratsbegriffen.
- Relevante Inhalte zuerst, weniger relevante Inhalte nur als sichere Füller.
- Adaptive Füllung und bestehende 6–8 Skill-Bullets pro Skillset bleiben erhalten.
- Für eine sachbearbeitungs-/GEVER-nahe Stelle sollen insbesondere priorisiert werden:
  - MS Office und Dokumentenverwaltung
  - GEVER / ACTA NOVA
  - digitale Geschäftsvorgangsbearbeitung
  - formale Kontrolle und Qualitätssicherung
  - Prozessdokumentation und Wissenssicherung
  - Koordination interner und externer Stellen
  - selbstständige Organisation und Prioritätensetzung
  - rasche Einarbeitung in Informatiksysteme
  - Deutsch/Französisch
  - redaktionelle beziehungsweise dokumentationsbezogene Praxis
- Onlineshop, Analytics und Social Media werden nur gezeigt, wenn nach allen höher relevanten belegten Inhalten noch Platz benötigt wird.

Report ergänzen:

```json
{
  "jobAdRelevance": {
    "inputTerms": [],
    "selectedSkillBulletIds": [],
    "selectedExperienceBulletIds": [],
    "deprioritizedBulletIds": [],
    "unsupportedTermsRejected": [],
    "selectionReasonById": {}
  }
}
```

Tests müssen zeigen, dass ein strukturierter Administrationskontext eine andere Priorisierung als der neutrale Administrationsrender bewirkt, ohne das Layout zu verändern.

---

# 11. Eingefrorene erfolgreiche Eigenschaften

Nicht zurückbauen:

- vier CV-Varianten
- exakt zwei Seiten
- aktuelles Design und Geometrie
- drei BM-Pflichtbullets
- BM-Ausschlüsse
- echte adaptive Experience-Füllung
- Geschäftsnummer und Kontaktlayout
- ATS-/Poppler-/PDF.js-Gates
- neutrale Fallbackwerte
- isolierte formelle/informelle/unsichere Fixtures
- `applications/` und `exports/` git-ignored
- vollständiger Originaltext in der Markdown-Akte

---

# 12. Vollständige Abschlussprüfung

Ausführen:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run test:application
npm run render:all
npm run test:render
```

Zusätzlich den neuen echten fiktiven Application-E2E-Test ausführen.

Erfolg erst bei:

- alle neutralen Produktionschecks grün
- Application-E2E-Prozess Exitcode `0`
- Manifest vorhanden
- Exportarchiv vorhanden und entpackbar
- `Nach Vereinbarung` korrekt
- integrierte Anrede grammatisch korrekt
- anwendungsspezifische Dateien beeinflussen neutrale Counts nicht
- jobbezogene Priorisierung reportbar und sichtbar
- finaler Guard übersprungen

## Abschlussbericht

Berichte mindestens:

1. lokaler Commit-SHA
2. Live-Head-SHA von PR #6
3. Workflow-Link und Status aller Schritte
4. neutrale Render-/Test-Exitcodes
5. Application-E2E-Exitcode
6. Manifest- und Exportstatus
7. Eintritts-, Pensum- und Greeting-Ergebnis
8. ausgewählte und depriorisierte Skill-/Experience-IDs
9. Belegmatrix-Status
10. PageCount, ATS, Overflows, Collisions, Warnings
11. Bestätigung: kein neuer Branch, kein neuer PR, nichts gemergt

Beginne jetzt und fahre ohne weitere Rückfrage fort.
