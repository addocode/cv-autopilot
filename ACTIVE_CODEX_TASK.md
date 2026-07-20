# ACTIVE CODEX TASK — Review Runde 44

## Verbindlicher Arbeitskontext

Arbeite ausschliesslich im bestehenden privaten Repository `addocode/cv-autopilot` auf dem bereits ausgewählten Branch:

`codex/uberprufe-head-sha-auf-branch-codex/verifiziere-icon-hashes`

und im bestehenden gestapelten PR #7.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #8.
- Merge weder PR #7 noch PR #6 oder PR #5.
- Verändere PR #1–#4 nicht.
- Suche nicht nach privaten PR-Kommentaren.
- Diese Datei enthält den vollständigen aktiven Auftrag.
- Wo ältere Anweisungen widersprechen, gilt diese Datei.

## Pflichtprüfung vor Arbeitsbeginn

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten Head-SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 44` beginnt.
4. Bei Abweichung: keine Dateien verändern, keinen Commit erstellen und ausschliesslich `STALE SNAPSHOT` melden.

---

## Ausgangslage: Run 40

PR #7 rendert alle vier PDFs und acht PNGs. Visuell funktionieren bereits:

- getrennte Mediamatiker- und Berufsmaturitätsstation
- offizieller BM-Titel `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen`
- drei verifizierte BM-Bullets
- `FÄHIGKEITEN UND SKILLS`
- `LEBENSLAUF UND VERANTWORTUNG`
- Hero-Höhe 101 mm
- Seite-2-Footerhöhe 11 mm
- sichtbare obere Trennlinie des ersten Skillsets
- exakt zwei Seiten
- keine Overflows oder Collisions

Der Workflow ist trotzdem rot. Run-40-Diagnose:

```text
renderAllExitCode: 1
renderTestsExitCode: 1
```

Nur `administration-gever` meldet `success: false`.

Reale Fehler:

1. Die GEVER-Cross-Domain-Policy zählt die BM-Station fälschlich als normale Erfahrungsstation und erwartet dort den Bullet `Weitere Tätigkeiten aus dem Mediamatik- und Marketingbereich`, obwohl die BM-Station ausdrücklich davon ausgenommen ist.
2. Der Visual Review prüft noch das entfernte Gate `combinedTrainingCredentialPassed` statt die getrennten Ausbildungsstationen.
3. Die angebliche `experience-layout-selection` ist noch keine echte Auswahl. In den Reports sind `candidateBulletIds: []` und `fillRatioBefore === fillRatioAfter`.
4. `communication-content` liegt bei ca. 0.854 statt mindestens 0.88; `cms-web-process` bei ca. 0.817 statt mindestens 0.82.
5. Die geforderten Layout-Erweiterungsmetriken fehlen im Report.
6. Die BM-Station ist aktuell hart in `scripts/render.mjs` erzeugt und verletzt damit die datengetriebene Single Source of Truth.

Diese Runde behebt genau diese Punkte. Seite-1-Design, Fonts, SVGs, Footer-Typografie und sichtbare Texte bleiben ansonsten unverändert.

---

## 1. Berufsmaturität in die Datenquelle verschieben

Entferne die hart codierte Erzeugung der BM-Station aus `applyVariant()` in `scripts/render.mjs`.

Lege die BM-Station in der bestehenden Master-Datenquelle für Experiences ab, analog zu den übrigen Stationen. Aktualisiere bei Bedarf:

- `data/private/cv.master.json`
- öffentliche Beispieldaten
- Schema
- `data/sources/source-map.json`
- relevante Variantenkonfigurationen

Verbindliche Daten:

```json
{
  "id": "berufsmaturitaet-bbz-cfp",
  "period": "08/2017 – 08/2021",
  "role": "Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen",
  "employer": "Berufsbildungszentrum BBZ-CFP",
  "location": "Biel",
  "experienceType": "education-credential",
  "fixedBullets": true,
  "excludeFromCrossDomainPolicy": true,
  "excludeFromBreadthSummary": true
}
```

Die Station steht in der Datenreihenfolge unmittelbar nach `mediamatiker-ausbildung-army-bict`.

Sie besitzt exakt die drei bereits definierten BM-Bullets, jeweils:

- `evidenceStatus: verified`
- reale Source-IDs
- keine optionalen Kandidaten
- kein Breadth-Summary
- kein GEVER-Cross-Domain-Bullet

Keine sichtbaren BM-Texte ändern.

---

## 2. GEVER-Cross-Domain-Policy korrekt auf berechtigte Stationen begrenzen

Die Cross-Domain-Policy gilt nur für berechtigte berufliche beziehungsweise operative Erfahrungsstationen.

Nicht berechtigt sind insbesondere Stationen mit:

```text
experienceType === "education-credential"
excludeFromCrossDomainPolicy === true
```

Passe alle Berechnungen konsistent an:

- `expectedStationCount`
- `renderedStationCount`
- `missingExperienceIds`
- `allRenderedLast`
- `allStationsHaveMinimumSubstantiveBullets`
- `insufficientSubstantiveExperienceIds`
- `byExperience`
- Report-Success-Gate
- Visual Review
- Tests

Erwartet für `administration-gever`:

- BM-Station wird nicht als fehlend gemeldet.
- Die fünf berechtigten Stationen besitzen weiterhin exakt einen Cross-Domain-Bullet als letzten Bullet.
- BM besitzt exakt null Cross-Domain-Bullets.
- `warnings: []`.
- `report.success: true`.

Reportstruktur je Station darf ergänzen:

```json
{
  "experienceId": "berufsmaturitaet-bbz-cfp",
  "eligible": false,
  "exclusionReason": "education-credential"
}
```

---

## 3. Veraltetes Combined-Training-Gate vollständig ersetzen

Die kombinierte Ausbildungsdarstellung ist entfernt und darf nicht mehr als Erfolgskriterium verlangt werden.

Behalte höchstens eine Diagnose:

```json
{
  "combinedTrainingCredential": {
    "removed": true,
    "visible": false
  }
}
```

Sie darf kein Produktions-Gate mehr sein.

Ersetze in Report, Visual Review und Tests:

```text
combinedTrainingCredentialPassed
```

mit echten getrennten Prüfungen, zum Beispiel:

```json
{
  "trainingStationsSplitPassed": true,
  "trainingStationVisible": true,
  "bmStationVisible": true,
  "bmDirectlyAfterTraining": true,
  "bmVerified": true,
  "bmHasExactlyThreeBullets": true,
  "bmExcludedFromCrossDomainPolicy": true,
  "bmExcludedFromBreadthSummary": true
}
```

`visual-review-round-17.json` darf keine Differenz bezüglich `combinedTrainingCredentialPassed` mehr enthalten.

---

## 4. Echte `experience-layout-selection` implementieren

Ein blosses Umbenennen von `renderStage` reicht nicht.

Implementiere vor `initial-layout-metrics` einen realen Browser-Auswahlschritt, analog zur Skillset-Auswahl.

### Kandidatenpool

Der Pool umfasst je Station:

1. ausgelassene reguläre, source-backed Bullets
2. noch nicht sichtbare optionale, source-backed Bullets
3. vorhandene belegte Langfassungen, falls semantisch nicht redundant
4. erst danach höchstens einen Breadth-Summary-Bullet

Ausgeschlossen:

- bereits sichtbare IDs
- semantische Dubletten
- `inferred_review_required`
- unbelegte Aussagen
- BM-Station
- generische Fülltexte ohne neue Information

Die Kandidaten müssen schon im Preview-DOM als `hidden` vorliegen oder datengetrieben sicher injiziert werden.

### Auswahlreihenfolge

Sortiere global nach:

```text
Stellenrelevanz
→ Evidence-Stärke
→ Arbeitgebernutzen
→ zusätzlicher Informationswert
→ Fill-Priority
→ stabile ID-Reihenfolge
```

Für jeden Kandidaten:

1. einzeln einblenden
2. Fonts/Layout abwarten
3. Seitenzahl, Overflows, Collisions, Text-Clipping und Footerabstand messen
4. bei sicherem Layout behalten, sonst wieder ausblenden
5. nach jedem akzeptierten Kandidaten Füllgrad neu messen
6. bei Erreichen des Zielbereichs stoppen

Detailbullets müssen vor Breadth-Summary-Bullets geprüft werden.

### Layoutbedingungen

Ein Kandidat ist nur sicher bei:

- exakt zwei Seiten
- `overflows: []`
- `collisions: []`
- kein abgeschnittener Text
- mindestens 5 mm Abstand zur Footer-Trennlinie
- kein Kontakt mit Bottom-Grid
- Source-IDs vorhanden
- Evidence-Status `verified` oder `defensible_inference`

### Zielwerte

```text
communication-content: 0.88–0.96
alle übrigen Varianten: 0.82–0.96
```

Run-40-Ausgangswerte:

```text
general: 0.928
communication-content: 0.854
administration-gever: 0.873
cms-web-process: 0.817
```

General und Administration dürfen nicht unnötig überfüllt werden. Communication benötigt voraussichtlich mindestens einen echten Zusatzbullet, CMS/Web mindestens einen kleinen Zusatzbullet.

### Report

```json
{
  "experienceQuality": {
    "pageFill": {
      "fillRatioBefore": 0,
      "fillRatioAfter": 0,
      "candidateBulletIds": [],
      "acceptedBulletIds": [],
      "rejectedBulletIds": [],
      "rejectionReasonsById": {},
      "breadthSummaryBulletIds": [],
      "withinTargetRange": true,
      "maximalSafeContentExhausted": false,
      "largestSafeContentSetSelected": true,
      "actualFooterGapPx": 0
    }
  }
}
```

Verbindlich:

- Für Communication und CMS dürfen `candidateBulletIds` nicht leer sein.
- `fillRatioAfter` muss bei mindestens einer dieser Varianten grösser als `fillRatioBefore` sein.
- `largestSafeContentSetSelected` darf nicht durch `breadthBullets.length > 0` künstlich wahr werden.
- Entferne jede False-Positive-Logik wie:

```js
fillRatio >= minimumTargetRatio || breadthBullets.length > 0
```

Das Produktions-Gate lautet:

```text
withinTargetRange === true
ODER
(maximalSafeContentExhausted === true UND alle realen Kandidaten wurden mit Gründen geprüft)
```

Ziel ist ausdrücklich, die vorhandenen belegten Inhalte so auszuschöpfen, dass Communication und CMS den Zielwert erreichen.

---

## 5. Layout-Erweiterungen real messen und berichten

Die sichtbaren Anpassungen sind vorhanden, aber die Reportfelder fehlen.

Ergänze echte Browsermessungen, keine bloss hart codierten `true`-Werte.

### Seite 1

Referenz-Hero-Höhe vorher: 108 mm.
Aktuell erwartet: 101 mm.

```json
{
  "layout": {
    "pageOneWhiteExtensionUpMm": 7,
    "heroPanelHeightMm": 101,
    "languageAbsoluteShiftPx": 0,
    "pageOneExtensionPassed": true
  }
}
```

`languageAbsoluteShiftPx` wird gegenüber der letzten grünen Referenzposition gemessen; bei 794×1123 lag die obere Sprachregel bei ungefähr 1069 px. Toleranz ±1 px.

### Seite 2

Referenz-`--page-two-footer-height`: 28 mm.
Aktuell erwartet: 11 mm.

```json
{
  "layout": {
    "pageTwoWhiteExtensionMm": 17,
    "pageTwoBlueStripHeightMm": 11,
    "pageTwoFooterShiftPx": 64,
    "pageTwoFooterShiftMm": 17,
    "pageTwoFooterShiftPassed": true
  }
}
```

Messe tatsächliche Werte aus den DOM-Rechtecken und berechneten Styles. Rundungstoleranz maximal 0.5 mm beziehungsweise 2 px.

Zusätzlich prüfen:

- blauer Balken mindestens 8 mm
- Seitenzähler sichtbar
- Footer vollständig innerhalb des Rahmens
- Footer-Typografie und Icons unverändert

---

## 6. Abschnittstitel-Metriken vervollständigen

Für beide Titel messen:

- exakter Text
- sichtbar
- ATS-extrahierbar
- `Roboto Slab`
- Gewicht 700
- berechnete Farbe identisch mit `var(--rule)`
- Schriftgrösse exakt 2 px über 9.9 pt

Für Seite 1 zusätzlich:

- linksbündig mit der linken Innenkante von Kurzprofil/Profilbild, Toleranz 1 px
- obere Trennlinie vor dem ersten Skillset sichtbar

Report:

```json
{
  "skillsetsQuality": {
    "sectionTitle": {
      "text": "FÄHIGKEITEN UND SKILLS",
      "colorMatchesRule": true,
      "fontSizeIncreasePx": 2,
      "leftAlignedWithSummary": true,
      "topRuleBeforeFirstSkillsetVisible": true
    }
  }
}
```

und analog für `LEBENSLAUF UND VERANTWORTUNG`.

---

## 7. Einheitliches Perioden-/Titellayout regressionssicher machen

Jede Station verwendet dasselbe DOM-Schema:

```text
Zeitraum | Position
Institution, Ort
```

Laufende Stationen dürfen `MM/YYYY – heute` verwenden.

Der wiederkehrende Schachfestival-Einsatz bleibt wahrheitsgetreu, wird aber numerisch vereinheitlicht:

```text
07/2019 / 07/2020 | Livestream-Operator & Assistent Eventorganisation
```

Nicht fälschlich als durchgehendes Arbeitsverhältnis mit Gedankenstrich darstellen.

Prüfe:

- alle Titel verwenden Roboto Slab 700
- alle Institutionszeilen Arial/Liberation Sans 700
- Trennzeichen ` | ` genau einmal
- keine alte `.training-period`
- keine `.combined-training-title`

---

## 8. Tests und Gates

Ergänze echte Regressionstests für:

1. BM-Daten liegen in der Master-Datenquelle, nicht hart in `render.mjs`.
2. BM ist direkt nach Mediamatiker-Ausbildung sortiert.
3. BM besitzt exakt drei verifizierte Bullets.
4. BM ist aus Cross-Domain- und Breadth-Summary-Policies ausgeschlossen.
5. Administration erwartet nur berechtigte Cross-Domain-Stationen.
6. Administration hat keine Warnung und `success: true`.
7. Visual Review verwendet keine `combinedTrainingCredentialPassed`-Prüfung.
8. `trainingStationsSplitPassed` und BM-Gates sind echt abgeleitet.
9. `experience-layout-selection` besitzt Kandidatenpool, Einblende-/Rollback-Logik und reale Messung.
10. Communication und CMS haben nichtleere Kandidatenlisten.
11. `fillRatioAfter >= fillRatioBefore`; bei akzeptierten Kandidaten strikt grösser.
12. Keine False-Positive-Fülllogik.
13. Seite-1- und Seite-2-Erweiterungsmetriken sind real und bestehen.
14. Abschnittstitel-Metriken bestehen.
15. Exakt zwei Seiten, keine Overflows, Collisions oder Warnungen.
16. Keine Schriftverkleinerung, keine Kompression, kein `scaleX`, kein negatives Tracking.

---

## 9. Vollständiger Workflow

Führe lokal soweit möglich aus:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Ein lokaler Registry-403 darf dokumentiert werden. Der Commit muss trotzdem zum bestehenden PR-#7-Branch gepusht beziehungsweise über das bereitgestellte Tool aktualisiert werden, damit GitHub Actions den vollständigen Produktionslauf ausführt.

Warte den Live-GitHub-Workflow vollständig ab, sofern die Umgebung dies ermöglicht.

Erfolg erst bei:

```text
renderAllExitCode: 0
renderTestsExitCode: 0
finaler Guard: skipped
alle vier Reports success: true
visual-review overallSuccess: true
remainingDifferences: []
```

---

## 10. Abschlussantwort

Berichte danach:

1. Start-HEAD und Ergebnis der Snapshot-Prüfung
2. lokalen Commit-SHA
3. tatsächlichen Live-Head-SHA von PR #7, sofern abrufbar
4. Workflow-Run und Status aller Schritte
5. renderAllExitCode, renderTestsExitCode, finalen Guard
6. Cross-Domain-Zahlen für Administration inklusive ausgeschlossener BM-Station
7. Visual-Review-Gates für getrennte Ausbildungsstationen
8. Datenpfad der BM-Station und Source-Map-Einträge
9. Fill-Ratio vor/nach pro Variante
10. Kandidaten, akzeptierte Bullets und Ablehnungsgründe pro Variante
11. gemessene 7-mm-/17-mm-Erweiterungen
12. gemessene blaue Balkenhöhe und Footer-Verschiebung
13. Abschnittstitel-Metriken
14. PageCount, Overflows, Collisions, Warnungen
15. ATS-/Poppler-/PDF.js-Ergebnisse
16. Pfad zur achtseitigen Kontaktübersicht
17. Bestätigung: kein PR #8, nichts gemergt

Beginne jetzt mit dem aktuellen Stand von PR #7 und fahre ohne weitere Rückfrage fort.
