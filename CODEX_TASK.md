# ACTIVE CODEX TASK — Review Runde 43

## Verbindlicher Arbeitskontext

Arbeite ausschliesslich im bestehenden privaten Repository `addocode/cv-autopilot` auf dem bereits ausgewählten Branch `codex/verifiziere-icon-hashes-und-svg-geometrie` und im bestehenden PR #6.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #7.
- Merge weder PR #6 noch PR #5.
- Verändere PR #1–#4 nicht.
- Suche nicht nach PR-Kommentaren und verwende keine GitHub CLI. Diese Datei enthält den vollständigen Auftrag.
- Wo ältere Anweisungen im Repository widersprechen, gilt diese Datei.

## Ausgangslage

Der letzte Workflow war technisch grün, aber Review Runde 42 wurde inhaltlich nur teilweise und teilweise falsch umgesetzt:

- Die Berufsmaturität ist weiterhin mit der Ausbildung kombiniert.
- Der sichtbare Titel lautet fälschlich `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Wirtschaft`.
- Korrekt ist `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen`.
- Die gewünschten Abschnittstitel wurden nicht umgesetzt.
- Die 7-mm-Erweiterung auf Seite 1 und 15–17-mm-Erweiterung auf Seite 2 wurden nicht umgesetzt.
- Die adaptive Experience-Füllung ist weiterhin ein False Positive.

Diese Runde muss die tatsächliche Gestaltung und Logik umsetzen, nicht nur Tests oder Report-Erwartungen anpassen.

---

## 1. Ausbildung und Berufsmaturität als zwei getrennte Stationen

Entferne die kombinierte `.combined-training-title`-Darstellung vollständig.

Erzeuge zwei eigenständige, unmittelbar aufeinanderfolgende Stationen:

```text
08/2017 – 08/2021 | Mediamatiker EFZ in Ausbildung
<bereits verifizierte Ausbildungsinstitution und Ort unverändert aus den Daten übernehmen>
```

Direkt darunter:

```text
08/2017 – 08/2021 | Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen
Berufsbildungszentrum BBZ-CFP, Biel
```

Die Berufsmaturität ist eine eigene Ausbildungsstation und keine berufliche Tätigkeit. Sie steht direkt unter der Mediamatiker-Ausbildung.

Keine ATS-Dublette und kein künstlich zusammengefügter Parent-Term.

### Verbindliche BM-Bullets

Die BM-Station erhält exakt diese drei sichtbaren Bullets:

```text
Bürokommunikation, Deutsch, Englisch, Französisch, Präsentationstechnik und Projektmanagement: strukturierte Korrespondenz, adressatengerechte Dokumentation und professionelle Präsentationen.
```

```text
Wirtschaft und Recht, Rechnungswesen, Marketing sowie Geschichts- und Politikkunde: kaufmännische Abläufe, betriebswirtschaftliche Zusammenhänge, rechtliche Grundlagen und gesellschaftspolitischer Kontext.
```

```text
Informatik, Web Technologies, Multimedia-Techniken, Multimedia Design, Multimedia Konzept und Grundlagen der Applikationsentwicklung: sichere Anwendung digitaler Arbeitsmittel und strukturierte Informationsaufbereitung.
```

Diese Bullets sind `verified` und erhalten Source-IDs aus den vorhandenen Ausbildungs-, Zeugnis- und LinkedIn-Quellen.

Die BM-Station besitzt genau diese drei Bullets und keinen Breadth-Summary- oder GEVER-Cross-Domain-Bullet.

---

## 2. Einheitliches Titellayout aller Stationen

Jede berufliche oder Ausbildungsstation auf Seite 2 verwendet verbindlich:

```text
MM/YYYY – MM/YYYY | Bezeichnung der Position
Name Institution, Ort
```

Bei laufenden Stationen ist `MM/YYYY – heute` zulässig.

- Erste Zeile: Zeitraum und Position, Roboto Slab 700, bestehende Experience-Farbe und -Grösse.
- Zweite Zeile: verifizierte Institution/Arbeitgeber und Ort, Arial/Liberation Sans 700.
- Keine Sondertypografie für Ausbildung oder BM.
- Keine Institution und keinen Ort erfinden.

---

## 3. Abschnittstitel Seite 1

Ersetze den sichtbaren Titel vollständig durch:

```text
FÄHIGKEITEN UND SKILLS
```

Gestaltung:

- Roboto Slab 700.
- Farbe exakt dieselbe graue Farbe wie die horizontalen Trennlinien (`var(--rule)`).
- Exakt 2 px grösser als die bisherige Abschnittstitelgrösse von 9.9 pt, bevorzugt `calc(9.9pt + 2px)`.
- Grossschreibung.
- Natürliche Laufweite, keine Kompression.
- Links bündig mit Profilbild und `KURZPROFIL`, also an der linken Innenkante des Competence-Panels.
- Kein bisheriges Padding auf Höhe der Skill-Textspalte.

Die horizontale Linie oberhalb des ersten Skillsets muss immer sichtbar sein. Da der Titel vor dem ersten Skillset steht, verwende einen robusten Selektor wie:

```css
.competencies-page-title + .skill-section {
  border-top: var(--rule-width) solid var(--rule);
}
```

oder eine gleichwertige Lösung.

---

## 4. Abschnittstitel Seite 2

Ersetze den sichtbaren Titel vollständig durch:

```text
LEBENSLAUF UND VERANTWORTUNG
```

Gestaltung identisch zum Seite-1-Titel:

- Roboto Slab 700.
- dieselbe graue Rule-Farbe.
- dieselbe um 2 px erhöhte Schriftgrösse.
- Grossschreibung.
- sichtbar und ATS-extrahierbar.

---

## 5. Seite 1: weisse Fläche 7 mm nach oben erweitern

Erweitere die weisse Kompetenzfläche um 7 mm nach oben.

Bevorzugte Umsetzung:

- Hero-/Blauflächenhöhe von 108 mm auf 101 mm reduzieren.
- Competence-Panel entsprechend um 7 mm vergrössern.
- Inhalte des weissen Panels rücken nach oben.
- Der Bereich `SPRACHEN` bleibt durch seine untere Verankerung an derselben absoluten Y-Position wie zuvor, maximal ±1 px.

Verbindlich:

- Profilbild, Name, Kontakt, Buttons und Kurzprofil vollständig sichtbar.
- Keine Kollision zwischen Kurzprofil und Kompetenzbereich.
- Genau vier Skillsets.
- 6–8 Bullets je Skillset.
- Bestehende Sprachabstandsregel bleibt erfüllt.
- Keine Schriftgrösse reduzieren.

Report:

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

---

## 6. Seite 2: weisse Fläche 15–17 mm nach unten erweitern

Erweitere die weisse Fläche auf Seite 2 nach unten und verschiebe den gesamten Footerbereich ab der horizontalen Trennlinie oberhalb `SOFTWARE & TOOLS` nach unten.

Betroffen:

- Footer-Trennlinie.
- SOFTWARE & TOOLS.
- REFERENZEN.
- EINTRITT.
- PENSUM.
- alle Footer-Icons.

Ziel: 17 mm. Falls 17 mm echte Kollisionen erzeugen, verwende die grösste sichere Erweiterung zwischen 15 und 17 mm und dokumentiere sie.

Bevorzugte Umsetzung:

- den bestehenden White-Panel-Bottom-Offset beziehungsweise `--page-two-footer-height` entsprechend reduzieren.
- Bottom-Grid unverändert am unteren Rand des White Panels verankern.

Verbindlich:

- Der blaue untere Balken bleibt sichtbar, mindestens 8 mm.
- Seitenzähler `2/2` vollständig sichtbar.
- Footer-Inhalte vollständig innerhalb des Rahmens.
- Footer-Typografie, Icons, Spalten und Abstände nicht verkleinern.
- Exakt zwei Seiten.

Report:

```json
{
  "layout": {
    "pageTwoWhiteExtensionMm": 17,
    "pageTwoBlueStripHeightMm": 0,
    "pageTwoFooterShiftPx": 0,
    "pageTwoFooterShiftPassed": true
  }
}
```

Die tatsächlichen Messwerte sind einzutragen, nicht hart zu codieren.

---

## 7. Echte adaptive Experience-Füllung

Implementiere beziehungsweise vervollständige eine echte Renderstufe:

```text
experience-layout-selection
```

Der bisherige grüne Zustand ist ein False Positive, weil `breadthBulletExists` einen zu niedrigen Fill-Ratio akzeptiert.

### Kandidatenpool

Berücksichtige:

1. ausgelassene reguläre source-backed Experience-Bullets;
2. ausgelassene optionale Experience-Bullets;
3. erst danach evidence-backed Breadth-Summary-Bullets;
4. als letzte Möglichkeit source-backed `defensible_inference`-Neuformulierungen aus belegten Tätigkeitsatomen.

Keine `inferred_review_required`-Inhalte rendern.

### Deduplizierung

Vor dem DOM-Rendern semantisch deduplizieren:

- keine doppelten IDs;
- keine wortgleichen Aussagen;
- keine nahezu identischen Kurz-/Langvarianten gleichzeitig;
- bereits als Kernbullet sichtbare Inhalte nicht erneut als optionalen Kandidaten anbieten.

### Auswahl

- Detailbullets vor allgemeinen Breitenhinweisen.
- Kandidaten einzeln sichtbar machen, Layout messen, behalten oder zurücksetzen.
- Keine dritte Seite.
- Keine Overflows oder Kollisionen.
- Mindestens 5 mm Abstand zur Footer-Trennlinie.
- Keine Schriftverkleinerung oder horizontale Kompression.

### Zielwerte

- `communication-content`: Fill-Ratio 0.88–0.96.
- übrige Varianten: 0.82–0.96.

Wenn der Zielwert trotz aller sicheren belegten Kandidaten nicht erreicht wird, darf der Report nur erfolgreich sein, wenn:

```json
{
  "maximalSafeContentExhausted": true,
  "allCandidatesConsidered": true,
  "rejectedCandidates": [
    {
      "id": "...",
      "reason": "duplicate|overflow|footer-gap|third-page|unsupported"
    }
  ]
}
```

Entferne jede Erfolgslogik der Form:

```js
fillRatio >= minimumTargetRatio || breadthBullets.length > 0
```

Ein Breadth-Summary-Bullet allein erfüllt das Füllziel nicht.

---

## 8. ATS und sichtbare Reihenfolge

Die sichtbare und extrahierbare Reihenfolge lautet:

```text
Name
Kontakt
Kurzprofil
Fähigkeiten und Skills
vier Skillsets
Sprachen
Lebenslauf und Verantwortung
Berufserfahrung
Mediamatiker EFZ in Ausbildung
Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen
Software & Tools
Referenzen
Eintritt
Pensum
```

Beide neuen Abschnittstitel und beide separaten Ausbildungsstationen müssen in Poppler Raw, Poppler Default und PDF.js sichtbar sein.

Keine versteckten Überschriften oder unsichtbaren ATS-Aliase.

---

## 9. Eingefrorene Bereiche

Keine Änderungen an:

- Profilbild und dessen Grösse.
- Hintergrundbild.
- Seitenformat.
- Farben ausser den beiden ausdrücklich geänderten Abschnittstiteln.
- Arial/Liberation Sans.
- Roboto Slab.
- Skill-Icon-SVGs und deren Hashes.
- Footer-Icons.
- Footer-Inhalt und Typografie.
- Referenzen, Eintritt, Pensum.
- Toolauswahl und Toolschrift.
- Poppler-/PDF.js-/ATS-Architektur.
- Workflow-Exit-Code-Logik.

Nicht erlaubt:

- kleinere Schrift.
- `scaleX`.
- `font-stretch`.
- negatives `letter-spacing`.
- abgeschnittene Inhalte.
- unbelegte Tatsachen.

---

## 10. Regressionstests

Ergänze Tests für:

1. Ausbildung und BM sind zwei getrennte Stationen.
2. BM steht direkt unter der Ausbildung.
3. Beide haben `08/2017 – 08/2021`.
4. BM-Titel exakt `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen`.
5. BM-Institution exakt `Berufsbildungszentrum BBZ-CFP, Biel`.
6. BM besitzt exakt drei Fachbullets.
7. BM besitzt keinen Breadth-Summary- oder GEVER-Cross-Domain-Bullet.
8. Alle Stationen folgen `Zeitraum | Position` plus `Institution, Ort`.
9. Seite 1 ist 7 mm nach oben erweitert.
10. Sprachenposition bleibt ±1 px.
11. Seite 2 ist 15–17 mm nach unten erweitert.
12. Blauer Balken bleibt mindestens 8 mm sichtbar.
13. `FÄHIGKEITEN UND SKILLS` erscheint genau einmal sichtbar.
14. `LEBENSLAUF UND VERANTWORTUNG` erscheint genau einmal sichtbar.
15. Beide Titel sind Roboto Slab 700, Rule-Grau und +2 px.
16. Seite-1-Titel ist linksbündig mit Kurzprofil/Profilbild.
17. obere Linie des ersten Skillsets sichtbar.
18. Experience-Kandidaten werden wirklich getestet und berichtet.
19. Kein False-Positive-Fill-Gate.
20. keine Schriftverkleinerung oder Textkompression.
21. exakt zwei Seiten, keine Overflows, Kollisionen oder Warnungen.

---

## 11. Workflow

Führe vollständig aus:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Warte den Live-GitHub-Workflow vollständig ab, sofern Zugriff besteht. Falls die lokale Codex-Umgebung keinen Remote besitzt, committe trotzdem auf den bestehenden Arbeitsstand und rufe `make_pr` mit dem unveränderten bestehenden PR-Titel auf. Erstelle keinen neuen PR.

Erfolgskriterien:

- `renderAllExitCode: 0`.
- `renderTestsExitCode: 0`.
- finaler Guard `skipped`.
- alle vier Reports `success: true`.
- Visual Review `overallSuccess: true`.
- `remainingDifferences: []`.
- exakt zwei Seiten.
- `overflows: []`, `collisions: []`, `warnings: []`.
- keine Schriftverkleinerung.
- keine unbelegten Inhalte.

---

## 12. Abschlussbericht

Berichte mindestens:

1. lokalen Commit-SHA;
2. tatsächlich verwendete Seite-1-Erweiterung in mm;
3. tatsächlich verwendete Seite-2-Erweiterung in mm;
4. verbleibende blaue Balkenhöhe in mm;
5. Footer-Verschiebung in px/mm;
6. Sprachbereich-Verschiebung in px;
7. beide finalen Abschnittstitel mit Font, Farbe und Grösse;
8. Nachweis der oberen Skillset-Trennlinie;
9. Titeldarstellung aller Stationen;
10. BM-Station mit Zeitraum, Institution und drei Bullets;
11. Source-IDs und Evidence-Status der BM-Bullets;
12. Fill-Ratio vor/nach je Variante;
13. akzeptierte und abgelehnte Experience-Kandidaten;
14. PageCount, Overflows, Collisions und Warnungen je Variante;
15. ATS-/Poppler-/PDF.js-Ergebnisse;
16. `report.success` je Variante;
17. `visual-review overallSuccess` und `remainingDifferences`;
18. Pfad zur achtseitigen Kontaktübersicht;
19. Bestätigung: kein PR #7 und nichts gemergt.

Beginne jetzt mit der Umsetzung dieser Datei und fahre ohne weitere Rückfrage fort.
