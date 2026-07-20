# ACTIVE CODEX TASK — Review Runde 50

## Arbeitskontext

Arbeite ausschliesslich im privaten Repository `addocode/cv-autopilot` auf dem bereits ausgewählten Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #11.
- Rufe `make_pr` nicht auf.
- Merge weder PR #6 noch PR #5.
- Verändere PR #1–#4 nicht.
- Diese Datei ersetzt alle früheren aktiven Review-Aufträge.

## Pflichtprüfung

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 50` beginnt.
4. Bei Abweichung nichts verändern und ausschliesslich `STALE SNAPSHOT` melden.

---

# 1. Ausgangslage: Workflow Run 53

Workflow Run 53 auf PR #10 / Commit `1dd4e5ae54e4883caf85351b632e0919030fa3dd` hat die gesamte Produktionsfunktion erfolgreich ausgeführt:

```text
renderAllExitCode: 0
allReportsSuccessful: true
visualReviewOverallSuccess: true
```

Alle vier Varianten besitzen:

- `report.success === true`
- exakt zwei Seiten
- keine Overflows
- keine Collisions
- keine Warnungen
- vollständige ATS-Extraktion
- drei sichtbare und verifizierte BM-Bullets
- `bmExcludedFromAdaptivePruning === true`
- echte DOM-Kandidaten und gemessene Experience-Auswahl
- Füllgrad im Zielbereich
- öffentliche Geschäftsnummer
- identische Titel-zu-Trennlinien-Abstände

Die realen Füllwerte sind:

```text
general:               0.910 -> 0.947
communication-content: 0.798 -> 0.928
administration-gever:  0.873 -> 0.947
cms-web-process:       0.761 -> 0.928
```

Diese Funktion, alle sichtbaren Inhalte und das gesamte Layout sind eingefroren.

Der einzige rote Wert ist:

```text
renderTestsExitCode: 1
```

Grund sind fünf veraltete beziehungsweise unvollständige Assertions in `tests/render.test.mjs`.

---

# 2. Keine Layout- oder Inhaltsänderungen

Verbindlich nicht verändern:

- CV-Texte und Reihenfolge
- Experience-Auswahl und Kandidatenpriorität
- BM-Inhalte
- Schriftgrössen, Zeilenhöhen und Fonts
- Icons
- Hero- und White-Panel-Geometrie
- Footer
- Profilbild
- Telefonnummerposition
- Skillsets und Sprachen
- Titelabstände
- neutrale Produktionswerte

Änderungen sind auf Tests und – nur falls für eine korrekte Messung zwingend – Diagnose-/Fixture-Infrastruktur begrenzt.

---

# 3. Fünf fehlerhafte Render-Tests korrigieren

## 3.1 Unterer Seitenbereich

Der Test erwartet noch ungefähr 28 mm Footer-/Resthöhe. Die finale Spezifikation ist:

```text
pageTwoFooterHeightPx: ungefähr 42 px
pageTwoBlueStripHeightMm: ungefähr 11 mm
pageTwoWhiteExtensionMm: ungefähr 17 mm
pageTwoHasBottomBackgroundStrip: true
blueTouchesPageBottom: false
```

Nutze sinnvolle Messtoleranzen:

- Footerhöhe etwa `38–46 px`
- mm-Werte maximal ±0.3 mm

Keine Produktionsmetrik ändern, nur den veralteten Test.

## 3.2 Fokuszustand der Link-Buttons korrekt messen

Der CSS-Fokuszustand muss weiterhin wirklich geprüft werden:

- `:focus-visible` aktiv
- blauer Hintergrund
- weisser Text
- weisser Rand
- sichtbarer Fokus-Ring

Run 53 meldet `isFocusVisible: false`, weil die bisherige programmgesteuerte Fokussierung Chromium nicht zuverlässig in den `:focus-visible`-Modus versetzt.

Schwäche den Test nicht ab. Korrigiere stattdessen die Diagnose in `scripts/render.mjs`:

1. vor der Fokusmessung Fokus entfernen;
2. per echter Tastaturinteraktion (`page.keyboard.press('Tab')`, nötigenfalls wiederholt) den ersten `.link-buttons a` fokussieren;
3. zwei Animation Frames abwarten;
4. `element.matches(':focus-visible')` und Computed Styles erfassen;
5. danach Fokus und Hover vollständig entfernen, bevor PDF/PNG erzeugt werden.

Der Test muss weiter `focus.isFocusVisible === true` und die vorgesehenen Farben verlangen.

## 3.3 E-Mail im Grid ist korrekt blockifiziert

Durch das neue zweispaltige Grid ist der berechnete Display-Wert der E-Mail `block`. Das ist CSS-Grid-Blockification und kein Pill-Button.

Aktualisiere den Test so, dass `display` entweder `block` oder `inline` sein darf, aber weiterhin zwingend gilt:

```text
padding: 0
margin: 0
borderWidth: 0
borderRadius: 0
background transparent
boxShadow: none
```

Prüfe dieselben Nicht-Pill-Eigenschaften zusätzlich für den Telefonlink.

## 3.4 ATS-Erwartungen auf finale neutrale Werte aktualisieren

Entferne die alten Erwartungen:

```text
nach Vereinbarung oder sofort
60–100 % flexibel nach Absprache
```

Verlange im neutralen Produktionsrender stattdessen:

```text
Per sofort oder nach Vereinbarung
Flexibel nach Absprache
+41 41 413 22 22
```

Die Telefonnummer muss in `requiredTermsPresent`, Poppler Raw und Poppler Default auffindbar sein. Der Link muss `tel:+41414132222` lauten.

## 3.5 Produktions-Personalisierungstest trennen

Der bisherige Test `round 45 job-ad footer and greeting personalization are reported` erwartet fälschlich Demo-Personalisierung in allen vier neutralen Produktionsreports.

Ersetze ihn durch zwei getrennte Testgruppen.

### A. Neutrale vier Produktionsvarianten

Erwarte je Variante:

```text
workload.renderedText === "Flexibel nach Absprache"
start.renderedText === "Per sofort oder nach Vereinbarung"
workload.usedFallback === true
start.usedFallback === true
greeting.rendered === false
greeting.visible === false
greeting.omissionReason === "no-safe-application-contact"
summaryActualLines === 4
footerLayout.collisionFree === true
```

### B. Separate Fixture-Tests

Teste die bestehenden Fixtures isoliert, ohne die neutralen Produktionsartefakte zu überschreiben:

- `tests/fixtures/application-context-formal.json`
- `tests/fixtures/application-context-informal.json`
- `tests/fixtures/application-context-unsafe.json`

Ergänze dafür bei Bedarf einen kleinen, nur für Preview-/Testausgaben verwendeten CLI-Parameter wie:

```text
--output-suffix formal-fixture
```

oder eine gleichwertige sichere Ausgabepfad-Lösung.

Formelle Fixture muss exakt ergeben:

```text
Guten Tag Frau Meier, ich bin ...
80 % gemäss Inserat, flexibel nach Absprache
Per 01.09.2026 gemäss Inserat, alternativ nach Vereinbarung
```

Zusätzlich:

- `Anna Meier`
- Rolle `HR-Leitung`
- genau ein `#summary-text`
- keine `.summary-greeting`
- Anrede nahtlos im Fliesstext
- keine leere Zusatzzeile

Informelle Fixture:

```text
Hallo Anna, ich bin ...
```

Unsichere Fixture:

- keine Anrede
- kein geratener Name

Mindestens Preview-HTML deterministisch prüfen. Falls ohne Umbau möglich, zusätzlich einen isolierten Playwright-Layouttest für vier Kurzprofilzeilen ausführen.

---

# 4. Kontakt- und Abstandsdiagnostik vervollständigen

Die sichtbare Ausgabe ist korrekt. Stelle zusätzlich sicher, dass der Report einen expliziten Block enthält, beispielsweise:

```json
{
  "contactLayout": {
    "businessPhoneText": "+41 41 413 22 22",
    "businessPhoneHref": "tel:+41414132222",
    "phoneVisible": true,
    "phoneAtsExtractable": true,
    "emailAndPhoneSameRow": true,
    "phoneLinkedInDeltaPx": 0,
    "phoneAlignedWithLinkedIn": true,
    "collisionFree": true
  }
}
```

Die vorhandene reale Titelabstandsmessung bleibt:

```text
pageOneGapPx: 13.06
pageTwoGapPx: 13.06
deltaPx: 0
requirementPassed: true
```

Regressionstest:

- `Math.abs(deltaPx) <= 1`
- `requirementPassed === true`

Keine sichtbare Position verändern.

---

# 5. Finale Regressionen

Ergänze beziehungsweise aktualisiere Tests für:

1. alle vier Reports erfolgreich;
2. drei BM-Bullets und BM-Schutz;
3. Candidate-/Accepted-/Rejected-IDs vorhanden;
4. Füllwerte im Zielbereich;
5. Telefonnummer sichtbar, ATS-extrahierbar und korrekt verlinkt;
6. E-Mail und Telefon in derselben Zeile;
7. Telefon und LinkedIn höchstens 1 px X-Abweichung;
8. beide Titelabstände höchstens 1 px Unterschied;
9. neutrale Produktionswerte;
10. formelle R49-Fixture mit Anna Meier, 80 % und 01.09.2026;
11. informelle und unsichere Fixture;
12. korrekter Tastatur-Fokuszustand;
13. finale PDF-/PNG-Artefakte bleiben unfokussiert und ungehovert.

---

# 6. Workflow

Vollständig ausführen:

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

und weiterhin:

- vier PDFs
- acht PNGs
- exakt zwei Seiten
- keine Overflows
- keine Collisions
- keine Warnungen
- `remainingDifferences: []`

---

# 7. Abschlussbericht

Berichte knapp:

1. lokaler Commit-SHA;
2. Live-Head-SHA von PR #6;
3. Workflow-Run-Link;
4. beide Exit-Codes und finaler Guard;
5. Status der fünf früher fehlerhaften Tests;
6. Fokusmessung;
7. neutrale Produktionswerte;
8. formelle/informelle/unsichere Fixture-Ergebnisse;
9. Telefon-/E-Mail-/LinkedIn-Ausrichtung;
10. Titelabstandsdelta;
11. BM- und Fill-Werte;
12. `report.success` je Variante;
13. `visual-review overallSuccess` und `remainingDifferences`;
14. Bestätigung: kein neuer Branch, kein PR #11, nichts gemergt.

Beginne jetzt und fahre ohne weitere Rückfrage fort.
