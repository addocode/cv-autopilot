# ACTIVE CODEX TASK — Review Runde 46

## Verbindlicher Arbeitskontext

Arbeite ausschliesslich im bestehenden privaten Repository `addocode/cv-autopilot` auf dem bereits ausgewählten Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #9.
- Merge weder PR #6 noch PR #5.
- Verändere PR #1–#4 nicht.
- Suche nicht nach privaten PR-Kommentaren.
- Diese Datei enthält den vollständigen aktiven Auftrag.
- Wo ältere Anweisungen widersprechen, gilt diese Datei.

## Pflichtprüfung vor Arbeitsbeginn

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten Head-SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 46` beginnt.
4. Bei Abweichung: keine Dateien verändern, keinen Commit erstellen und ausschliesslich `STALE SNAPSHOT` melden.

---

# Ausgangslage: Workflow Run 45

Run 45 auf dem konsolidierten Stand von PR #8/PR #6 erzeugte erfolgreich:

- vier PDFs
- acht PNGs
- vier Render-Reports
- Poppler-/PDF.js-/Font-Artefakte
- exakt zwei Seiten pro Variante
- keine Overflows
- keine Collisions
- die neue Greeting-, EINTRITT- und PENSUM-Darstellung

Der Workflow ist dennoch rot:

```text
renderAllExitCode: 1
renderTestsExitCode: 1
```

Alle vier Reports sind `success: false`.

Die reale Diagnose aus den Produktionsartefakten lautet:

1. Die BM-Station besitzt in den Masterdaten drei Pflichtbullets, im finalen DOM/PDF werden aber nur zwei sichtbar. Dadurch ist `bmVerified: false`.
2. In `administration-gever` zählt die Cross-Domain-Reportlogik die BM weiterhin mit: `expectedStationCount: 6`, `renderedStationCount: 5`, `missingExperienceIds: ["berufsmaturitaet-bbz-cfp"]`.
3. Die adaptive Experience-Füllung hat weiterhin keinen echten Kandidatenpool: `candidateBulletIds: []` und `fillRatioBefore === fillRatioAfter`.
4. `communication-content` liegt bei ca. `0.819` statt mindestens `0.88`.
5. `cms-web-process` liegt bei ca. `0.782` statt mindestens `0.82`.
6. Die verlangten realen Layoutmetriken fehlen weiterhin im Report.
7. Veraltete Tests erwarten noch vier Kurzprofilzeilen trotz Greeting, die alte Eintrittsformulierung sowie ungefähr 28 mm statt 11 mm unteren Seitenstreifen.
8. Die privaten Masterdaten enthalten aktuell dauerhaft die Demo-Person `Anna Müller`, `80–100 %` und `Eintritt per sofort`. Dadurch erscheinen diese fiktiven Werte in jedem normalen Render. Demo-/Testdaten dürfen niemals als Produktionsstandard im Masterprofil stehen.

Diese Runde muss die tatsächliche Render- und Auswahlfunktion korrigieren. Es reicht nicht, nur Erfolgsgates oder Testwerte abzuschwächen.

---

# 1. BM besitzt immer exakt drei sichtbare Pflichtbullets

Die Station:

`berufsmaturitaet-bbz-cfp`

ist eine Pflicht-Ausbildungsstation.

Verbindlich:

- alle drei Master-Bullets werden in jeder Variante sichtbar gerendert
- kein BM-Bullet darf durch Variantenauswahl, Bullet-Limit, Page-Fill, Kürzung oder adaptive Auswahl entfernt oder versteckt werden
- kein BM-Bullet ist ein optionaler Füllkandidat
- Reihenfolge exakt wie in den Masterdaten
- kein zusätzlicher Cross-Domain- oder Breadth-Summary-Bullet
- alle drei besitzen sichtbare `data-summary-source-ids`
- alle drei besitzen `data-evidence-status="verified"`
- alle drei erscheinen in HTML, PDF, Poppler Raw, Poppler Default und PDF.js

Empfohlene Modellierung:

```json
{
  "stationType": "education",
  "requiredVisibleBulletCount": 3,
  "excludeFromCrossDomain": true,
  "excludeFromBreadthSummary": true,
  "excludeFromAdaptivePruning": true
}
```

oder eine gleichwertige sauber validierte Struktur.

`applyVariant()` muss für solche Stationen alle Pflichtbullets übernehmen, bevor allgemeine Experience-Limits angewendet werden.

Report-Gate:

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

# 2. BM vollständig aus Cross-Domain- und Breadth-Zählern ausschliessen

Die bisherige Erzeugung des Cross-Domain-Bullets berücksichtigt die BM bereits teilweise. Die spätere DOM-/Reportauswertung zählt sie aber weiterhin als erwartete Station.

Ergänze am `<article class="experience">` datengetriebene Attribute, beispielsweise:

```html
data-station-type="education"
data-exclude-cross-domain="true"
data-exclude-breadth-summary="true"
```

Berechne `expectedStationCount`, `missingExperienceIds`, `allRenderedLast`, `allStationsHaveMinimumSubstantiveBullets` und alle zugehörigen Gates ausschliesslich aus berechtigten Stationen:

```js
stationType !== 'education' && excludeFromCrossDomain !== true
```

Für `administration-gever` gilt:

- BM ist nicht erwartet
- BM ist nicht fehlend
- BM beeinflusst `allRenderedLast` nicht
- `missingExperienceIds` ist leer
- `expectedStationCount === renderedStationCount`
- Cross-Domain-Policy ist vollständig grün

Die BM darf zu Diagnosezwecken in `byExperience` erscheinen, dann aber mit:

```json
{
  "eligible": false,
  "exclusionReason": "education-station"
}
```

---

# 3. Echte adaptive Experience-Füllung implementieren

Die aktuelle Logik meldet `experience-layout-selection`, verwendet für `candidateBulletIds` aber weiterhin den falschen globalen Pfad `variantMeta.supplementary.optionalCandidates`. Deshalb ist der Kandidatenpool leer.

## 3.1 Kandidaten bereits in `applyVariant()` erhalten

Pro Experience-Station müssen getrennt erhalten bleiben:

- sichtbare verpflichtende Kernbullets
- ausgelassene reguläre, source-backed Bullets
- verbleibende optionale, source-backed Bullets
- belegte längere Textvarianten
- nachrangiger Breadth-Summary-Kandidat

Ausgelassene reguläre Bullets dürfen nicht verworfen werden. Rendere sie als versteckte Kandidaten mit eindeutigen Datenattributen, beispielsweise:

```html
<li
  hidden
  data-fill-state="candidate"
  data-fill-kind="experience-detail-bullet"
  data-experience-id="..."
  data-fill-id="..."
  data-fill-priority="..."
  data-source-ids="..."
  data-evidence-status="verified|defensible_inference"
>
```

BM-Bullets und bereits sichtbare Inhalte dürfen nie Kandidaten sein.

## 3.2 Kandidatenpool aus dem realen DOM erzeugen

Der Pool für `experience-layout-selection` muss aus den tatsächlich gerenderten versteckten Experience-Kandidaten erzeugt werden, nicht aus `supplementary.optionalCandidates`.

Berichte mindestens:

```json
{
  "candidateBulletIds": [],
  "acceptedBulletIds": [],
  "rejectedBulletIds": [],
  "rejections": [
    {
      "id": "...",
      "reason": "duplicate-content|overflow|collision|footer-gap|over-target|lower-priority"
    }
  ]
}
```

## 3.3 Auswahlreihenfolge

1. Pflichtinhalte inklusive aller drei BM-Bullets rendern.
2. Reale Baseline messen.
3. Detailkandidaten global nach Stellenrelevanz, Evidence-Stärke, zusätzlichem Informationswert und Priorität sortieren.
4. Jeden Kandidaten einzeln sichtbar schalten.
5. Layout neu messen.
6. Kandidaten behalten oder mit konkretem Grund wieder ausblenden.
7. Erst nach Ausschöpfung der Detailkandidaten einen Breadth-Summary-Kandidaten prüfen.
8. Bei Erreichen des Mindestzielwerts stoppen, sofern der Füllgrad höchstens `0.96` beträgt.

Akzeptanz nur bei:

- exakt zwei Seiten
- keine Overflows
- keine Collisions
- kein abgeschnittener Text
- mindestens 5 mm Footerabstand
- keine semantische Dublette
- eindeutige ID
- Source-IDs vorhanden
- `verified` oder `defensible_inference`
- finaler Füllgrad höchstens 0.96

## 3.4 Zielwerte

- `communication-content`: `0.88–0.96`
- `general`: `0.82–0.96`
- `administration-gever`: `0.82–0.96`
- `cms-web-process`: `0.82–0.96`

Der dritte verpflichtende BM-Bullet zählt zum echten Seiteninhalt. Danach sollen vorhandene source-backed Detailkandidaten die noch fehlende Fläche sinnvoll ausfüllen.

Verbindlich:

- `candidateBulletIds` ist für Communication und CMS nicht leer, sofern geeignete ausgelassene Inhalte existieren
- `fillRatioAfter > fillRatioBefore`, wenn ein Kandidat angenommen wurde
- `withinTargetRange === true` für alle vier finalen Produktionsvarianten
- kein False Positive durch blosses Vorhandensein eines Breadth-Summary-Bullets

`largestSafeContentSetSelected` darf nur `true` sein, wenn die finale Auswahl wirklich gemessen, alle angenommenen Kandidaten sicher sind und der Zielbereich erreicht wurde.

---

# 4. Produktionsprofil von Demo-Stelleninserat trennen

Entferne aus `data/private/cv.master.json` die dauerhaft fiktiven Produktionswerte:

- `Anna Müller`
- `80–100 %`
- `Eintritt per sofort`
- `Wir freuen uns auf dich`

Das Masterprofil enthält standardmässig einen leeren/neutralen Anwendungskontext, beispielsweise:

```json
{
  "applicationContext": {
    "jobAd": {
      "rawText": "",
      "sourceId": "",
      "workload": {
        "kind": "unspecified",
        "minPercent": null,
        "maxPercent": null,
        "sourceText": "",
        "confidence": 0
      },
      "start": {
        "kind": "unspecified",
        "isoDate": null,
        "sourceText": "",
        "confidence": 0
      },
      "contact": null
    }
  }
}
```

Normale Render ohne konkretes Stelleninserat zeigen daher:

```text
EINTRITT: Per sofort oder nach Vereinbarung
PENSUM: Flexibel nach Absprache
```

und keine Greeting-Zeile.

Die Anna-/80–100-/Sofort-Daten gehören ausschliesslich in eine Testfixture, beispielsweise:

`tests/fixtures/application-context-informal.json`

Ergänze eine saubere Einspeisung des aktuellen Bewerbungskontexts, bevorzugt:

```bash
node scripts/render.mjs --variant general --application-context tests/fixtures/application-context-informal.json
```

Alternativ ist eine gleichwertige klar dokumentierte JSON-Eingabe zulässig.

Priorität:

1. explizit übergebener validierter Bewerbungskontext
2. aktueller neutraler Master-Fallback

Keine Demo-Person darf in normalen vier Produktionsvarianten sichtbar sein.

---

# 5. Personalisierungslogik vollständig testen

## 5.1 Normaler Produktionsrender ohne Job-Ad-Fixture

Erwartet:

- Greeting nicht gerendert
- kein leerer Greeting-Abstand
- Kurzprofil weiterhin vier Zeilen
- `PENSUM: Flexibel nach Absprache`
- `EINTRITT: Per sofort oder nach Vereinbarung`
- Report `usedFallback: true`

## 5.2 Informelle Fixture

Mit der bestehenden Anna-Testfixture:

- `Hallo Anna,`
- `80–100 % gemäss Inserat, flexibel nach Absprache`
- `Per sofort gemäss Inserat, alternativ nach Vereinbarung`
- Kurzprofil drei Zeilen plus eine Greeting-Zeile
- keine Kollision

## 5.3 Formelle Fixture

Ergänze eine Fixture, z. B. mit explizitem `Frau Müller` und formeller Ansprache:

- `Guten Tag Frau Müller,`
- niemals `Hallo Anna,`

## 5.4 Unsichere Fixture

Bei unklarer/generischer Kontaktangabe:

- Greeting vollständig weglassen
- keine Namens- oder Geschlechtsvermutung
- `omissionReason` gesetzt

---

# 6. Reale Layoutmetriken ergänzen

Die Felder fehlen in Run 45 vollständig. Berechne sie aus realen `getBoundingClientRect()`-/Computed-Style-Messungen.

Mindestens:

```json
{
  "layout": {
    "pageOneWhiteExtensionUpMm": 7,
    "heroPanelHeightMm": 101,
    "languageAbsoluteShiftPx": 0,
    "pageOneExtensionPassed": true,
    "pageTwoWhiteExtensionMm": 17,
    "pageTwoBlueStripHeightMm": 11,
    "pageTwoFooterShiftPx": 64.3,
    "pageTwoFooterShiftPassed": true
  }
}
```

Toleranzen:

- Millimeterwerte ±0.5 mm
- Pixelwerte ±2 px

Berechnungsprinzip:

- `heroPanelHeightMm`: reale Hero-Höhe
- `pageOneWhiteExtensionUpMm`: 108 mm minus reale Hero-Höhe
- `languageAbsoluteShiftPx`: gemessene Abweichung der unteren Sprachverankerung vom definierten unveränderten Bottom-Anker, nicht hartcodiert
- `pageTwoBlueStripHeightMm`: reale Distanz zwischen White-Panel-Unterkante und Frame-Unterkante
- `pageTwoWhiteExtensionMm`: 28 mm minus reale blaue Resthöhe
- `pageTwoFooterShiftPx`: reale Verschiebung gegenüber der früheren 28-mm-Unterkante

Die Boolean-Felder müssen aus diesen Messungen abgeleitet werden.

---

# 7. Veraltete Tests korrigieren, ohne Gates abzuschwächen

Aktualisiere echte Altannahmen:

1. Kurzprofil:
   - Greeting sichtbar → `targetLines === 3`, `actualLines === 3` plus eine Greeting-Zeile
   - Greeting nicht sichtbar → `targetLines === 4`, `actualLines === 4`
2. Footer-Unterkante:
   - nicht mehr ungefähr 28 mm
   - reale blaue Resthöhe ungefähr 11 mm
3. ATS-Terme:
   - nicht mehr zwingend alter String `nach Vereinbarung oder sofort`
   - normale Produktion prüft `Per sofort oder nach Vereinbarung`
   - personalisierte Fixture prüft ihren tatsächlich gerenderten Stellenwert
4. Experience-Stationen:
   - separate BM-Station erhöht die Stationsanzahl
   - alle Experience-Location- und Gap-Arrays müssen die reale Stationszahl besitzen
5. Page-Fill:
   - finaler Zielbereich echt erreicht
   - kein `largestSafeContentSetSelected: true` bei zu geringer Füllung

Keine Tests entfernen, nur auf die neue fachlich korrekte Struktur umstellen.

---

# 8. Report-Success- und Visual-Review-Gates

`report.success` darf erst `true` sein, wenn zusätzlich gilt:

- BM getrennt und direkt nach der Mediamatiker-Ausbildung
- exakt drei sichtbare, verifizierte BM-Bullets
- BM aus Cross-Domain/Breadth/Adaptive-Pruning ausgeschlossen
- Cross-Domain-Policy vollständig erfüllt
- Page-Fill innerhalb Zielbereich
- Personalisierungsfallback oder übergebener Kontext korrekt und sichtbar
- Footer kollisionsfrei
- Layout-Erweiterungsmetriken bestanden

`visual-review-round-17.json` muss danach liefern:

```json
{
  "overallSuccess": true,
  "remainingDifferences": []
}
```

---

# 9. Visuelle Grenzen

Die aktuelle Gestaltung bleibt eingefroren:

- keine Schrift verkleinern
- keine Schrift komprimieren
- kein `scaleX`
- kein negatives `letter-spacing`
- keine SVG- oder Iconänderung
- keine Änderung der Grundfarben
- keine Änderung des Profilbilds
- keine dritte Seite
- Footer-Spalten und Footer-Typografie beibehalten
- Greeting bleibt dezent wie in Run 45
- EINTRITT/PENSUM bleiben in der aktuellen gut lesbaren Form

Der dritte BM-Bullet und zusätzliche Detailbullets müssen durch die vorhandene freie Experience-Fläche aufgenommen werden, nicht durch engere Typografie.

---

# 10. Vollständiger Workflow

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

- `renderAllExitCode: 0`
- `renderTestsExitCode: 0`
- finaler Guard skipped
- alle vier Reports `success: true`
- visual review `overallSuccess: true`
- `remainingDifferences: []`
- exakt zwei Seiten pro Variante
- `overflows: []`
- `collisions: []`
- `warnings: []`

---

# 11. Abschlussbericht

Berichte mindestens:

1. Start-HEAD und lokaler Commit-SHA
2. Live-Head-SHA des bestehenden PR #6
3. Workflow-Run-Link und Schrittstatus
4. beide Exit-Codes und finaler Guard
5. BM-Bulletzahl und Evidence-/Source-Status pro Variante
6. Cross-Domain expected/rendered/missing pro Variante
7. Candidate-, accepted- und rejected-Bullet-IDs pro Variante
8. `fillRatioBefore` und `fillRatioAfter` pro Variante
9. Fallback-Produktionswerte ohne Job-Ad-Fixture
10. Ergebnisse informelle, formelle und unsichere Fixture
11. Greeting-/Summary-Zeilenmessung
12. Footer-Zeilen und Kollisionen
13. reale Layout-Erweiterungsmetriken
14. PageCount, Overflows, Collisions und Warnungen
15. ATS-/Poppler-/PDF.js-Ergebnisse
16. `report.success` pro Variante
17. Visual-Review-Ergebnis
18. Pfad zur achtseitigen Kontaktübersicht
19. Bestätigung: kein PR #9 und nichts gemergt

Beginne jetzt ohne weitere Rückfrage.