# ACTIVE CODEX TASK — Review Runde 43

## Verbindlicher Arbeitskontext

Arbeite ausschliesslich im bestehenden privaten Repository `addocode/cv-autopilot` auf dem bereits ausgewählten Branch `codex/verifiziere-icon-hashes-und-svg-geometrie` und im bestehenden PR #6.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #7.
- Merge weder PR #6 noch PR #5.
- Verändere PR #1–#4 nicht.
- Suche nicht nach PR-Kommentaren.
- Verwende keine GitHub CLI.
- Diese Datei enthält den vollständigen aktiven Auftrag.
- Wo ältere Anweisungen im Repository widersprechen, gilt diese Datei.

## Pflichtprüfung vor Arbeitsbeginn

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche das Ergebnis mit der im Startprompt genannten erwarteten Head-SHA.
3. Prüfe, dass diese Datei `ACTIVE_CODEX_TASK.md` vorhanden ist und mit `# ACTIVE CODEX TASK — Review Runde 43` beginnt.
4. Falls die SHA abweicht oder diese Datei fehlt: keine Dateien verändern, keinen Commit erstellen und mit `STALE SNAPSHOT` abbrechen.

---

## Ausgangslage

Der letzte Produktionsworkflow war technisch grün. Review Runde 42 wurde jedoch nur oberflächlich umgesetzt:

- Die Berufsmaturität ist weiterhin mit der Mediamatiker-Ausbildung kombiniert.
- Der BM-Titel lautet fälschlich `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Wirtschaft`.
- Korrekt ist `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen`.
- Die gewünschten Abschnittstitel wurden nicht umgesetzt.
- Die 7-mm-Erweiterung auf Seite 1 wurde nicht umgesetzt.
- Die 15–17-mm-Erweiterung auf Seite 2 wurde nicht umgesetzt.
- Die adaptive Experience-Füllung ist weiterhin ein False Positive.

Diese Runde muss die tatsächliche Darstellung, Datenstruktur und Renderlogik umsetzen. Es reicht nicht, nur Tests oder Report-Erwartungen anzupassen.

---

## 1. Ausbildung und Berufsmaturität als getrennte Stationen

Entferne die kombinierte `.combined-training-title`-Darstellung vollständig.

Erzeuge zwei eigenständige, unmittelbar aufeinanderfolgende Stationen:

```text
08/2017 – 08/2021 | Mediamatiker EFZ in Ausbildung
<bereits verifizierte Ausbildungsinstitution und Ort unverändert aus den vorhandenen Daten übernehmen>
```

Direkt darunter:

```text
08/2017 – 08/2021 | Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen
Berufsbildungszentrum BBZ-CFP, Biel
```

Die Berufsmaturität ist eine eigene Ausbildungsstation, keine berufliche Tätigkeit.

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

Alle drei Bullets:

- `evidenceStatus: verified`
- Source-IDs aus bestehenden Ausbildungs-, Zeugnis- und LinkedIn-Quellen
- sichtbar im HTML, PDF und PNG
- extrahierbar über Poppler Raw, Poppler Default und PDF.js

Die BM-Station besitzt genau diese drei Bullets und keinen Breadth-Summary- oder GEVER-Cross-Domain-Bullet.

---

## 2. Einheitliches Titellayout aller Stationen

Jede berufliche oder Ausbildungsstation auf Seite 2 verwendet:

```text
MM/YYYY – MM/YYYY | Bezeichnung der Position
Name Institution, Ort
```

Für laufende Stationen ist `MM/YYYY – heute` zulässig.

Verbindlich:

- Zeitraum und Position in derselben ersten Zeile
- Trennzeichen exakt ` | `
- erste Zeile Roboto Slab 700 in bestehender Experience-Farbe und -Grösse
- zweite Zeile Arial/Liberation Sans 700
- keine kleinere Sonderdarstellung für Ausbildung oder BM
- bestehende verifizierte Arbeitgeber-, Institutions- und Ortsdaten übernehmen
- keine Institution oder Ortsangabe erfinden

---

## 3. Neuer Haupttitel Seite 1

Ersetze den sichtbaren Titel durch exakt:

```text
FÄHIGKEITEN UND SKILLS
```

Gestaltung:

- Roboto Slab 700
- Farbe exakt wie die horizontalen Trennlinien (`var(--rule)` beziehungsweise identischer berechneter Farbwert)
- exakt 2 px grösser als die bisherige Abschnittstitelgrösse von 9.9 pt, bevorzugt `calc(9.9pt + 2px)`
- Grossschreibung
- natürliche Laufweite
- keine Kompression
- linksbündig mit Profilbild und `KURZPROFIL`
- kein Padding auf Höhe der Skill-Textspalte

Die horizontale Linie oberhalb des ersten Skillsets muss immer sichtbar sein. Da der Titel nun vor dem ersten Skillset steht, verwende einen robusten Selektor wie:

```css
.competencies-page-title + .skill-section {
  border-top: var(--rule-width) solid var(--rule);
}
```

oder eine gleichwertige Lösung.

---

## 4. Neuer Haupttitel Seite 2

Ersetze den sichtbaren Titel durch exakt:

```text
LEBENSLAUF UND VERANTWORTUNG
```

Gestaltung identisch zum Seite-1-Titel:

- Roboto Slab 700
- Trennliniengrau
- exakt gleiche Schriftgrösse
- Grossschreibung
- natürliche Laufweite
- sichtbar und ATS-extrahierbar

---

## 5. Seite 1 um 7 mm nach oben erweitern

Erweitere die weisse Kompetenzfläche auf Seite 1 um exakt 7 mm nach oben.

Bevorzugte Umsetzung:

- Hero-/Blauflächenhöhe von 108 mm auf 101 mm reduzieren
- Competence-Panel entsprechend um 7 mm vergrössern
- sämtliche Inhalte der weissen Fläche rücken nach oben
- der Bereich `SPRACHEN` bleibt durch seine untere Verankerung an derselben absoluten Y-Position

Verbindlich:

- Profilbild, Name, Kontakt, Buttons und Kurzprofil bleiben vollständig sichtbar
- keine Kollision zwischen Kurzprofil und weisser Fläche
- Sprachbereich-Verschiebung maximal ±1 px gegenüber dem letzten grünen Referenzrun
- genau vier Skillsets
- 6–8 Bullets je Skillset
- Sprachabstandsregel weiterhin erfüllt
- keine Schriftgrösse reduzieren

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

## 6. Seite 2 und Footer um 15–17 mm nach unten erweitern

Erweitere die weisse Fläche auf Seite 2 nach unten um die grösste sichere Distanz zwischen 15 und 17 mm.

Verschiebe gleichzeitig den gesamten Bereich ab der horizontalen Trennlinie oberhalb von `SOFTWARE & TOOLS` nach unten, inklusive:

- Trennlinie
- SOFTWARE & TOOLS
- REFERENZEN
- EINTRITT
- PENSUM
- Footer-Icons

Bevorzugte Umsetzung:

- `--page-two-footer-height` beziehungsweise White-Panel-Bottom-Offset um 15–17 mm reduzieren
- `.bottom-grid` unverändert am unteren Rand des White Panels verankern

Verbindlich:

- verbleibender blauer unterer Balken mindestens 8 mm sichtbar
- Seitenzähler `2/2` vollständig sichtbar
- Footer vollständig innerhalb des Rahmens
- Footer-Typografie, Icons, Spalten und Abstände unverändert
- keine dritte Seite
- keine Kollisionen oder Overflows

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

Falls 17 mm nicht sicher sind, verwende 16 mm oder 15 mm und dokumentiere den real gewählten Wert.

---

## 7. Echte adaptive Experience-Füllung

Implementiere einen echten Render-Schritt:

```text
experience-layout-selection
```

Er muss vor `initial-layout-metrics` laufen.

### Kandidatenpool

Der Pool umfasst pro Station:

1. ausgelassene reguläre source-backed Bullets
2. vorhandene optionale source-backed Bullets
3. belegbare längere Formulierungsvarianten
4. erst danach maximal einen Breadth-Summary-Bullet

Nicht verwenden:

- bereits sichtbare Bullets
- semantische Dubletten
- identische IDs
- `inferred_review_required`
- unbelegte Aussagen

### Reihenfolge

1. verpflichtende Kernbullets rendern
2. BM-Pflichtstation mit drei Bullets rendern
3. aktuelle reale Füllung messen
4. Detailkandidaten global nach Relevanz sortieren
5. jeden Kandidaten einzeln einblenden
6. Layout neu messen
7. sicheren Kandidaten behalten oder wieder entfernen
8. Breadth-Summary erst nach Ausschöpfung relevanter Detailkandidaten prüfen

### Akzeptanz eines Kandidaten

Nur behalten, wenn:

- exakt zwei Seiten
- keine Overflows
- keine Collisions
- keine abgeschnittenen Texte
- kein Footer-Kontakt
- mindestens 5 mm Abstand zur Footer-Trennlinie
- keine semantische Dublette
- Quelle und Evidence-Status vorhanden

### Zielwerte

- `communication-content`: Füllgrad 0.88–0.96
- übrige Varianten: Füllgrad 0.82–0.96

Entferne jede False-Positive-Logik wie:

```js
fillRatio >= minimumTargetRatio || breadthBullets.length > 0
```

Ein Breadth-Summary-Bullet allein erfüllt das Füllziel nicht.

Wenn trotz aller sicheren belegten Kandidaten das Ziel nicht erreicht wird:

```json
{
  "maximalSafeContentExhausted": true,
  "withinTargetRange": false
}
```

mit vollständiger Kandidatenliste und Ablehnungsgründen. Das darf kein künstliches `true` erzeugen.

---

## 8. ATS-Reihenfolge

Die sichtbare Reihenfolge lautet:

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

Beide Haupttitel und beide Ausbildungsstationen müssen in Poppler Raw, Poppler Default und PDF.js sichtbar sein.

Keine versteckten Überschriften oder ATS-Aliase.

---

## 9. Eingefrorene Bereiche

Keine Änderungen an:

- Profilbildgrösse und -ausschnitt
- Hintergrundbild
- Farben ausser der expliziten grauen Haupttitel
- Arial/Liberation Sans
- Roboto Slab
- bestehenden Schriftgrössen ausser exakt +2 px für die beiden Haupttitel
- Buttons
- Kurzprofiltext
- Sprachinhalte
- Skill-Icon-Dateien und Hashes
- Footer-Typografie und Footer-Icons
- Referenzen
- Eintritt
- Pensum
- Toolauswahl und Toolschrift
- Poppler-/PDF.js-Architektur
- Workflow-Exit-Code-Architektur

Nicht erlaubt:

- kleinere Schrift
- `scaleX`
- `font-stretch`
- negatives `letter-spacing`
- versteckte Keywords
- dritte Seite
- erfundene Tatsachen

---

## 10. Regressionstests

Ergänze Tests für:

1. Mediamatiker-Ausbildung und BM sind getrennte Stationen.
2. BM steht direkt unter der Ausbildung.
3. Beide besitzen `08/2017 – 08/2021`.
4. BM-Titel lautet exakt `Berufsmaturität Wirtschaft und Dienstleistungen, Typ Dienstleistungen`.
5. BM-Institution lautet exakt `Berufsbildungszentrum BBZ-CFP, Biel`.
6. BM besitzt exakt drei Fachbullets.
7. BM besitzt keinen Breadth-Summary- oder Cross-Domain-Bullet.
8. Alle Stationen folgen `Zeitraum | Position` und `Institution, Ort`.
9. Seite 1 ist 7 mm nach oben erweitert.
10. Sprachbereich bleibt ±1 px an seiner Position.
11. Seite 2 ist 15–17 mm nach unten erweitert.
12. Footer wurde entsprechend nach unten verschoben.
13. Blauer Balken bleibt mindestens 8 mm sichtbar.
14. `FÄHIGKEITEN UND SKILLS` erscheint exakt einmal.
15. `LEBENSLAUF UND VERANTWORTUNG` erscheint exakt einmal.
16. Beide Titel verwenden Roboto Slab 700, Rule-Farbe und +2 px.
17. Seite-1-Titel ist mit Profilbild/Kurzprofil linksbündig.
18. obere Linie vor dem ersten Skillset ist sichtbar.
19. adaptive Experience-Kandidaten werden tatsächlich einzeln getestet.
20. Detailbullets werden vor Breadth-Summary priorisiert.
21. keine False-Positive-Fülllogik.
22. keine Schriftverkleinerung oder Kompression.
23. exakt zwei Seiten, keine Overflows, keine Collisions, Warnungen leer.

---

## 11. Produktionsworkflow

Führe vollständig aus:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Warte danach den Live-GitHub-Workflow vollständig ab, sofern Zugriff vorhanden ist. Ohne Remote-Zugriff lokale Ergebnisse ehrlich berichten.

Erfolg erst bei:

- `renderAllExitCode: 0`
- `renderTestsExitCode: 0`
- finaler Guard skipped
- alle vier Reports `success: true`
- visual-review `overallSuccess: true`
- `remainingDifferences: []`
- exakt zwei Seiten
- keine Overflows, Collisions oder Warnungen
- keine Schriftverkleinerung
- keine unbelegten Inhalte

---

## 12. Abschlussantwort

Berichte:

1. Start-HEAD und Ergebnis der Snapshot-Prüfung
2. lokaler Commit-SHA
3. tatsächlicher Live-Head-SHA, sofern abrufbar
4. Workflow-Status, sofern abrufbar
5. real gewählte Seite-1-Erweiterung in mm
6. real gewählte Seite-2-Erweiterung in mm
7. verbleibende blaue Balkenhöhe in mm
8. Footer-Verschiebung in px/mm
9. Sprachbereich-Verschiebung in px
10. beide finalen Haupttitel mit Font, Farbe und Grösse
11. Nachweis der oberen Skillset-Trennlinie
12. alle Stationstitel im Standardformat
13. BM-Station mit Zeitraum, Institution und drei Bullets
14. Source-IDs und Evidence-Status der BM-Bullets
15. Füllgrad vor und nach Auswahl pro Variante
16. akzeptierte und abgelehnte Experience-Kandidaten samt Gründen
17. PageCount, Overflows, Collisions und Warnungen pro Variante
18. ATS-/Poppler-/PDF.js-Ergebnisse
19. report.success pro Variante
20. visual-review overallSuccess und remainingDifferences
21. Pfad zur achtseitigen Kontaktübersicht
22. Bestätigung: kein PR #7, nichts gemergt

Fahre nach erfolgreicher Snapshot-Prüfung ohne weitere Rückfrage fort.
