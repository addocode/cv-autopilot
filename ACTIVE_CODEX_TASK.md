# ACTIVE CODEX TASK — Review Runde 48

## Verbindlicher Arbeitskontext

Arbeite ausschliesslich im privaten Repository `addocode/cv-autopilot` auf dem bereits ausgewählten Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #10.
- Rufe `make_pr` nicht auf.
- Merge weder PR #6 noch PR #5.
- Verändere PR #1–#4 nicht.
- Suche nicht nach privaten PR-Kommentaren.
- Diese Datei enthält den vollständigen aktiven Auftrag.
- Frühere Review-Dateien dienen nur als Historie. Bei Widersprüchen gilt Review Runde 48.

## Pflichtprüfung vor Arbeitsbeginn

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten Head-SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 48` beginnt.
4. Bei Abweichung: keine Dateien verändern, keinen Commit erstellen und ausschliesslich `STALE SNAPSHOT` melden.

---

# 1. Ausgangslage: Workflow Run 49

Run 49 erzeugte vollständig:

- vier PDFs
- acht PNGs
- vier Render-Reports
- Poppler-, PDF.js- und Font-Artefakte
- exakt zwei Seiten pro Variante
- keine Overflows
- keine Collisions
- keine Warnungen

Die Änderungen aus Review Runde 47 sind visuell richtig und werden eingefroren:

- Hero-Höhe `98mm`
- Identitätsgruppe `5mm` nach oben
- Kurzprofilblock `2.8mm` nach oben
- weisse Fläche Seite 1 insgesamt `10mm` nach oben erweitert
- `FÄHIGKEITEN UND SKILLS` höher mit natürlichem Abstand zum ersten Skillset
- Kurzprofil und Greeting als ein einziger Fliesstext
- ohne Greeting weiterhin vier Zeilen
- neutraler Produktionskontext ohne Demo-Person
- `EINTRITT: Per sofort oder nach Vereinbarung`
- `PENSUM: Flexibel nach Absprache`
- Seite-2-Blaufläche `11mm`

Diese Werte und das sichtbare Layout dürfen nicht zurückgebaut, verkleinert oder enger gesetzt werden.

Run 49 ist dennoch rot. Reale Produktionsdiagnose:

1. Die BM besitzt im Master drei Pflichtbullets, im finalen DOM/PDF aber nur zwei.
2. `bmVerified === false` und `bmExcludedFromAdaptivePruning === false` in allen vier Reports.
3. `candidateBulletIds: []` in allen Varianten.
4. Es findet keine echte Experience-Auswahl statt: `fillRatioBefore === fillRatioAfter`.
5. `communication-content` liegt bei ungefähr `0.819` statt mindestens `0.88`.
6. `cms-web-process` liegt bei ungefähr `0.782` statt mindestens `0.82`.
7. Veraltete Render-Tests erwarten weiterhin Demo-Personalisierung, alten Eintrittstext und ungefähr 28mm statt den realen 11mm unteren Blaustreifen.

Es reicht nicht, Tests oder Erfolgsgates abzuschwächen. Die tatsächliche DOM-Auswahl und die Pflichtinhalte müssen korrigiert werden.

---

# 2. BM: exakt drei unveränderliche Pflichtbullets

Station:

`berufsmaturitaet-bbz-cfp`

## 2.1 Masterdaten ergänzen

Ergänze datengetrieben:

```json
{
  "stationType": "education",
  "requiredVisibleBulletCount": 3,
  "excludeFromCrossDomain": true,
  "excludeFromBreadthSummary": true,
  "excludeFromAdaptivePruning": true
}
```

Alle drei vorhandenen BM-Bullets bleiben unverändert, `verified` und source-backed.

## 2.2 `applyVariant()` korrigieren

Der aktuelle allgemeine Pfad:

```js
.filter(selected...)
.slice(0, variant.maxBulletsPerExperience)
```

entfernt den dritten BM-Bullet. Pflichtstationen mit `excludeFromAdaptivePruning === true` beziehungsweise `requiredVisibleBulletCount` dürfen diesen allgemeinen Selektions- und Kürzungspfad nicht verwenden.

Verbindlich:

- alle drei BM-Bullets werden vor Variantenselektion übernommen
- keine `.slice(maxBulletsPerExperience)` für diese Station
- kein `hiddenBulletIds`-Filter für die drei Pflichtbullets
- kein optionaler Kandidat
- kein Breadth-Summary
- kein Cross-Domain-Bullet
- Reihenfolge exakt wie im Master
- exakt drei sichtbare `<li>` in jeder Variante
- alle drei im HTML, PDF, Poppler Raw, Poppler Default und PDF.js

Report:

```json
{
  "trainingStations": {
    "split": true,
    "bmBulletCount": 3,
    "bmVerified": true,
    "bmExcludedFromAdaptivePruning": true
  }
}
```

---

# 3. Cross-Domain- und Breadth-Ausnahmen vollständig datengetrieben

Alle DOM- und Reportzähler müssen Education-Stationen sowie explizite Ausschlussflags respektieren.

Für BM gilt überall:

```text
eligible: false
exclusionReason: education-station
```

BM darf nicht einbezogen werden in:

- `expectedStationCount`
- `renderedStationCount`
- `missingExperienceIds`
- `allRenderedLast`
- Cross-Domain-Zähler
- Breadth-Summary-Zähler
- adaptive Kandidaten
- adaptive Pruning- oder Kürzungslogik

Für `administration-gever` muss danach gelten:

```json
{
  "missingExperienceIds": [],
  "expectedStationCount": 5,
  "renderedStationCount": 5
}
```

oder dieselbe korrekte Anzahl, falls die Anzahl berechtigter operativer Stationen datengetrieben anders ermittelt wird. Entscheidend ist: BM ist nie erwartet und nie fehlend.

---

# 4. Echter Experience-Kandidatenpool

Der aktuelle Fehler liegt in `applyVariant()`:

- `omittedMandatory` wird zwar ermittelt, danach aber nicht als DOM-Kandidat erhalten.
- `experience.optionalCandidates` enthält nur `remainingOptionalCandidates`.
- deshalb rendert `optionalHtml` keine geeigneten ausgelassenen regulären Bullets.
- die Metrik liest zwar den DOM, findet aber `candidateBulletIds: []`.

## 4.1 Detailkandidaten im Datenmodell erhalten

Erzeuge pro Station eine getrennte Liste, beispielsweise:

```js
experience.detailCandidates
```

Sie umfasst in dieser Reihenfolge:

1. ausgelassene reguläre Bullets aus `experience.bullets`
2. verbleibende optionale Bullets
3. vorhandene belegte längere Textvarianten

Nur aufnehmen, wenn:

- nicht bereits sichtbar
- nicht in `hiddenBulletIds`
- keine identische ID
- keine semantische Dublette zu sichtbaren oder bereits aufgenommenen Kandidaten
- Source-IDs vorhanden
- Evidence-Status `verified` oder `defensible_inference`
- nicht `inferred_review_required`
- Station nicht Education und nicht `excludeFromAdaptivePruning`

Jeder Kandidat erhält mindestens:

```text
data-fill-state="candidate"
data-fill-kind="experience-detail-bullet"
data-experience-id="..."
data-fill-id="..."
data-fill-priority="..."
data-source-ids="..."
data-evidence-status="..."
hidden
```

`candidateBulletIds` muss aus diesen realen DOM-Elementen stammen.

## 4.2 Breadth-Summary korrekt nachrangig

Für normale Varianten darf ein Breadth-Summary nicht bereits vor der Auswahl als automatischer sichtbarer Baseline-Bullet eingefügt werden.

- Detailkandidaten werden zuerst geprüft.
- Danach darf maximal ein Breadth-Summary pro berechtigter Station als versteckter Kandidat geprüft werden.
- Ein akzeptierter Breadth-Summary ist immer der letzte sichtbare Bullet seiner Station.
- BM erhält nie einen solchen Kandidaten.

GEVER-Ausnahme:

- der feste Cross-Domain-Bullet bleibt für jede berechtigte operative Station sichtbar
- er bleibt immer letzter Bullet
- neu akzeptierte Detailbullets müssen im DOM vor diesem strukturellen Schlussbullet stehen

---

# 5. Tatsächlicher Render-Schritt `experience-layout-selection`

Der aktuelle Code setzt nur den Namen der Render-Stage und schreibt später Messwerte. Er führt keine Kandidatenauswahl aus.

Implementiere vor `initial-layout-metrics` einen eigenen Playwright-/Browser-Schritt, beispielsweise:

```js
const experienceLayoutSelection = await page.evaluate(async (...) => { ... })
```

und übergib dessen Resultat danach an die finalen Metriken.

## 5.1 Baseline messen

Nach dem Rendern aller Pflichtinhalte und vor dem Einblenden von Kandidaten:

- `fillRatioBefore`
- `actualFooterGapPx`
- Seitenzahl
- Overflows
- Collisions
- sichtbare semantische Texte

## 5.2 Kandidaten sortieren

Globale Reihenfolge:

1. Stellenrelevanz / `jobAdMatchScore`
2. `verified` vor `defensible_inference`
3. zusätzlicher Informationswert
4. `fillPriority`
5. stabile DOM-Reihenfolge

Detailbullets immer vor Breadth-Summary-Kandidaten.

## 5.3 Jeden Kandidaten einzeln testen

Für jeden Kandidaten:

1. sichtbar schalten
2. zwei Animation Frames und `document.fonts.ready` abwarten
3. Layout neu messen
4. behalten oder wieder ausblenden
5. Ablehnungsgrund protokollieren

Akzeptieren nur bei:

- exakt zwei Seiten
- keine Overflows
- keine Collisions
- kein abgeschnittener Text
- mindestens 5mm Abstand zur Footer-Trennlinie
- finaler Füllgrad höchstens `0.96`
- keine semantische Dublette
- gültige Source-IDs und Evidence
- GEVER-Schlussbullet bleibt letzter Bullet

Ablehnungsgründe mindestens:

```text
duplicate-content
overflow
collision
footer-gap
over-target
invalid-evidence
lower-priority
```

## 5.4 Zielwerte

- `general`: `0.82–0.96`
- `communication-content`: `0.88–0.96`
- `administration-gever`: `0.82–0.96`
- `cms-web-process`: `0.82–0.96`

Der dritte BM-Bullet zählt zum realen Inhalt. Danach ergänzen Detailkandidaten die fehlende Fläche.

Für den finalen aktuellen Datenbestand verbindlich:

- `candidateBulletIds` ist bei Communication und CMS nicht leer
- `fillRatioAfter > fillRatioBefore`, sobald mindestens ein Kandidat akzeptiert wurde
- `withinTargetRange === true` bei allen vier Varianten
- `largestSafeContentSetSelected === true` nur nach echter gemessener Auswahl
- kein False Positive durch blossen Breadth-Summary-Bullet

Report mindestens:

```json
{
  "pageFill": {
    "candidateBulletIds": [],
    "acceptedBulletIds": [],
    "rejectedBulletIds": [],
    "rejections": [],
    "fillRatioBefore": 0,
    "fillRatioAfter": 0,
    "withinTargetRange": true,
    "largestSafeContentSetSelected": true,
    "maximalSafeContentExhausted": false
  }
}
```

Finale Metriken müssen die Resultate von `experienceLayoutSelection` übernehmen, nicht nachträglich leere Arrays neu erzeugen.

---

# 6. Personalisierung und R47-Layout einfrieren

Keine sichtbare Regression zulässig.

## 6.1 Neutraler Produktionsrender

Ohne `--application-context`:

```text
EINTRITT: Per sofort oder nach Vereinbarung
PENSUM: Flexibel nach Absprache
```

- kein Greeting
- kein leerer Greeting-Platzhalter
- Kurzprofil exakt vier Zeilen
- keine Demo-Namen oder Demo-Werte

## 6.2 Informelle Fixture

Mit `tests/fixtures/application-context-informal.json`:

- genau ein `#summary-text`
- kein `.summary-greeting`
- Fliesstext beginnt sinngemäss mit `Hallo Anna, ich bin ...`
- dieselbe Schrift, Grösse, Kursivstellung und Zeilenhöhe wie der restliche Kurzprofiltext
- exakt vier Zeilen
- individuelles Pensum und Eintritt sichtbar und ATS-extrahierbar

## 6.3 Formelle Fixture

Mit `tests/fixtures/application-context-formal.json`:

- Fliesstext beginnt `Guten Tag Frau Müller, ich bin ...`
- keine separate Zeile oder Sondertypografie
- exakt vier Zeilen

## 6.4 Unsichere Fixture

Mit `tests/fixtures/application-context-unsafe.json`:

- kein Greeting
- kein Name geraten
- neutraler Kurzprofiltext mit vier Zeilen

## 6.5 Geometrie

Aus realen DOM-Messungen:

```json
{
  "heroPanelHeightMm": 98,
  "pageOneWhiteExtensionUpMm": 10,
  "identityClusterShiftUpMm": 5,
  "summaryBlockShiftUpMm": 2.8,
  "pageTwoBlueStripHeightMm": 11,
  "pageTwoWhiteExtensionMm": 17
}
```

Toleranz höchstens ±0.3mm bei CSS-/Pixelumrechnung.

Nicht verändern:

- Schriftgrössen
- Icongrössen
- horizontale Kompression
- Footer-Spalten
- Profilbildgrösse
- Sprachposition
- Seitenzahl

---

# 7. Veraltete Tests korrigieren

Passe Tests an die tatsächliche finale Spezifikation an, nicht um Fehler zu verstecken.

## 7.1 Standardrender

Erwarte:

```text
Per sofort oder nach Vereinbarung
Flexibel nach Absprache
```

Nicht mehr erwarten:

```text
nach Vereinbarung oder sofort
80–100 % gemäss Inserat ...
Hallo Anna,
```

im neutralen Produktionsrender.

## 7.2 Footer-/Blauflächenmessung

Der alte Test `pageTwoFooterHeightPx > 95 && < 115` ist veraltet.

Neu datengetrieben prüfen:

- `pageTwoBlueStripHeightMm` ungefähr `11`
- `pageTwoFooterHeightPx` ungefähr `42px` bei 96dpi, mit sinnvoller Toleranz
- `pageTwoWhiteExtensionMm` ungefähr `17`
- blauer Streifen sichtbar
- Footer vollständig im White Panel

## 7.3 BM

In jeder Variante:

- `bmBulletCount === 3`
- `bmVerified === true`
- `bmExcludedFromAdaptivePruning === true`

## 7.4 Fill

Nicht bloss `largestSafeContentSetSelected` statisch prüfen. Zusätzlich:

- Kandidatenpool vorhanden, wo Daten vorhanden sind
- angenommene IDs sind im finalen DOM sichtbar
- abgelehnte IDs bleiben verborgen
- `fillRatioAfter` entspricht der finalen DOM-Messung
- alle vier Varianten im Zielbereich

## 7.5 Fixture-Rendering

Ergänze mindestens einen echten Playwright-Layouttest für informelle und formelle Fixture, isoliert von den vier neutralen Produktionsartefakten. Nutze einen temporären Ausgabepfad oder einen sicheren Output-Suffix, damit die normalen Produktionsartefakte nicht überschrieben werden.

Prüfe:

- integrierter Fliesstext
- keine `.summary-greeting`
- exakt vier Zeilen
- korrekte Anrede
- korrekte Footerpersonalisierung
- keine Kollision

---

# 8. Success-Gates

`report.success` pro Variante nur bei:

- exakt zwei Seiten
- keine Overflows
- keine Collisions
- warnings leer
- ATS vollständig
- drei BM-Bullets und BM-Verifikation grün
- korrekte Education-Ausnahmen
- echter Experience-Kandidatenpool
- echter gemessener finaler Füllgrad im Zielbereich
- R47-Geometrie erfüllt
- neutraler Produktionskontext korrekt

`visual-review-round-17.json`:

```json
{
  "overallSuccess": true,
  "remainingDifferences": []
}
```

Der finale Guard muss `skipped` sein, weil beide Exit-Codes `0` sind.

---

# 9. Vollständiger Workflow

Ausführen:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Danach den Live-GitHub-Workflow vollständig abwarten.

Erfolg erst bei:

```text
renderAllExitCode: 0
renderTestsExitCode: 0
allReportsSuccessful: true
visualReviewOverallSuccess: true
final guard: skipped
```

Erzeuge beziehungsweise erhalte:

- vier finale PDFs
- acht finale PNGs
- vollständige Reports
- Poppler-/PDF.js-/Font-Artefakte
- achtseitige Kontaktübersicht

---

# 10. Abschlussbericht

Berichte mindestens:

1. lokaler Commit-SHA
2. Live-Head-SHA von PR #6
3. Workflow-Run-Link
4. Status aller Workflow-Schritte
5. beide Exit-Codes und finaler Guard
6. BM-Bulletzahl und Verifikation je Variante
7. Cross-Domain-/Breadth-Ausnahmen
8. candidate/accepted/rejected IDs je Variante
9. fillRatioBefore und fillRatioAfter je Variante
10. Footerabstand je Variante
11. PageCount, Overflows, Collisions, warnings
12. neutrale Job-Ad-Werte
13. informelle/formelle/unsichere Fixture-Ergebnisse
14. Kurzprofil-Zeilenzahl
15. R47-Geometriemessungen
16. ATS-/Poppler-/PDF.js-Ergebnisse
17. report.success je Variante
18. visual-review overallSuccess und remainingDifferences
19. Pfad zur Kontaktübersicht
20. Bestätigung: kein neuer Branch, kein PR #10, nichts gemergt

Beginne jetzt und fahre ohne weitere Rückfrage fort.