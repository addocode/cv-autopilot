# ACTIVE CODEX ADDENDUM — Review Runde 47

## Verbindlicher Kontext

Dieses Addendum ergänzt den bestehenden Auftrag in `ACTIVE_CODEX_TASK.md` (Review Runde 46). Sämtliche noch offenen technischen Punkte aus Runde 46 bleiben verbindlich. Bei Widersprüchen zu früheren Anweisungen gilt dieses Addendum.

Arbeite ausschliesslich auf dem bestehenden Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch.
- Erstelle keinen PR #9.
- Rufe `make_pr` nicht auf.
- Merge nichts.
- Verändere PR #1–#5 nicht.
- Behalte exakt zwei Seiten, alle bisherigen Fonts, Schriftgrössen, Icons, Footer-Spalten und die aktuellen BM-/Personalisierungsfunktionen bei.

---

# 1. Personalisierte Anrede nahtlos in das Kurzprofil integrieren

## 1.1 Ziel

Die Anrede darf nicht mehr als eigener Absatz, eigene Zeile oder typografisch separates Element erscheinen.

Nicht mehr zulässig:

```html
<p class="summary-greeting">Hallo Anna,</p>
<p id="summary-text">Ich bin ...</p>
```

Stattdessen muss genau ein sichtbarer Kurzprofil-Absatz gerendert werden:

```html
<p id="summary-text">Guten Tag Frau Meier, ich bin Mediamatiker EFZ ...</p>
```

Beispiel:

```text
Guten Tag Frau Meier, ich bin Mediamatiker EFZ mit Berufsmaturität und Erfahrung in digitaler Geschäftsvorgangsbearbeitung, Dokumentenmanagement und Prozessdokumentation. Ich verbinde strukturierte Arbeitsweise, Systemverständnis und sorgfältige Qualitätssicherung mit zuverlässiger administrativer Unterstützung.
```

## 1.2 Typografie

Die integrierte Anrede verwendet exakt dieselbe Typografie wie der übrige Kurzprofiltext:

- gleiche Fontfamilie
- gleiche Schriftgrösse
- gleiche Schriftstärke
- gleicher Kursivstil
- gleiche Farbe
- gleiche Zeilenhöhe
- keine separate Klasse mit abweichendem Styling
- kein zusätzliches Icon
- keine zusätzliche Linie
- kein eigener Blockabstand

Entferne `.summary-greeting` und alle Sonderregeln, die die Anrede separat gestalten.

## 1.3 Grammatische Verknüpfungslogik

Implementiere eine deterministische Funktion, sinngemäss:

```js
composePersonalizedSummary(greeting, summaryText)
```

Sie muss die Anrede und das gewählte Kurzprofil grammatisch korrekt zu einem einzigen Fliesstext verbinden.

Verbindliche Regeln:

1. Die Anrede endet mit einem Komma.
2. Der anschliessende Profiltext beginnt innerhalb desselben Satzes kleingeschrieben, sofern dies grammatisch korrekt ist.
3. Das System darf nicht einfach zwei Strings mit Leerzeichen zusammenkleben, sondern muss den passenden Anschluss anhand des Profilanfangs bestimmen.
4. Es darf keine doppelte Anrede, kein doppeltes Komma und kein Satzbeginn wie `Guten Tag Frau Meier, Ich bin` entstehen.

Mindestens folgende Fortsetzungen unterstützen:

```text
Ich bin ...  -> Guten Tag Frau Meier, ich bin ...
Als Mediamatiker ... -> Guten Tag Frau Meier, als Mediamatiker ...
Mit meiner Erfahrung ... -> Guten Tag Frau Meier, mit meiner Erfahrung ...
Durch meine Erfahrung ... -> Guten Tag Frau Meier, durch meine Erfahrung ...
Gerne ... -> Guten Tag Frau Meier, gerne ...
```

Falls der gewählte Profiltext keinen grammatisch sicheren Anschluss erlaubt:

- wähle bevorzugt einen anderen belegten Kurzprofil-Kandidaten mit sicherem Anschluss;
- erst danach verwende eine kurze, natürliche und belegbare Brücke, zum Beispiel `möchte ich mich kurz vorstellen:`, sofern das resultierende Profil weiterhin genau vier Zeilen einhält;
- keine inhaltlichen Tatsachen erfinden.

Berichte den verwendeten Anschluss explizit:

```json
{
  "jobAdPersonalization": {
    "greeting": {
      "rendered": true,
      "text": "Guten Tag Frau Meier,",
      "connectorMode": "lowercase-continuation",
      "connectorText": "ich",
      "combinedSummaryText": "Guten Tag Frau Meier, ich bin ...",
      "integratedIntoSummary": true,
      "separateGreetingElementPresent": false
    }
  }
}
```

## 1.4 Vier-Zeilen-Regel

Das vollständige Kurzprofil einschliesslich Anrede soll weiterhin möglichst immer exakt vier sichtbare Textzeilen umfassen.

Verbindlich:

- `summary.targetLines` bleibt immer `4`, auch bei vorhandener Anrede.
- Die Kandidatenauswahl misst den vollständig kombinierten Text, nicht nur den Text nach der Anrede.
- Bevorzugt wird ein belegter Kandidat, der zusammen mit der Anrede exakt vier Zeilen ergibt.
- Keine Schriftverkleinerung, keine horizontale Kompression und keine negative Laufweite.
- Falls kein belegter Kandidat exakt vier Zeilen erreicht, wähle die nächstbeste sichere Variante und dokumentiere den Grund; drei oder fünf Zeilen dürfen nicht stillschweigend als Erfolg gelten.
- Ohne sichere Ansprechperson wird keine Anrede gerendert und das normale Kurzprofil bleibt ebenfalls bei vier Zeilen.

ATS:

- Der gesamte kombinierte Absatz muss in Poppler Raw, Poppler Default und PDF.js in korrekter Reihenfolge extrahierbar sein.
- Die Anrede darf nicht als versteckter ATS-Alias dupliziert werden.

---

# 2. Hero-Bereich und Übergang zur weissen Fläche feinjustieren

## 2.1 Identitätsgruppe 5 mm nach oben

Behandle folgende Elemente als eine gemeinsame visuelle Gruppe:

- Profilbild
- `ADAM DOLINSKY`
- Headline
- Credential
- Ort und E-Mail
- Buttons `dolinsky.ch` und `LinkedIn`

Diese gesamte Identitätsgruppe wird exakt 5 mm nach oben verschoben.

Bevorzugte robuste Umsetzung:

- gemeinsamer Wrapper, beispielsweise `.identity-cluster`, oder
- identische geometrische Verschiebung für Profilbild und Hero-Textblock über layoutwirksame Positionierung.

Verbindlich:

- Profilbild und Textblock behalten ihre gegenseitige Ausrichtung.
- Die Buttons bleiben Teil derselben Gruppe.
- Keine Veränderung der Elementgrössen oder internen Abstände.
- Kein Clipping am oberen Frame-Rand.
- Mindestabstand jedes Gruppenelements zum oberen inneren Frame-Rand: 5 mm.
- Keine Veränderung des Kurzprofilblocks durch diese 5-mm-Gruppenverschiebung.

Report:

```json
{
  "layout": {
    "identityClusterShiftUpMm": 5,
    "identityClusterElementsAligned": true,
    "identityClusterTopClearanceMm": 0,
    "identityClusterClipped": false
  }
}
```

Die Werte müssen aus realen DOM-Rechtecken abgeleitet werden.

## 2.2 Kurzprofil knapp 3 mm nach oben

Verschiebe den kompletten Kurzprofilblock einschliesslich:

- Titel `KURZPROFIL`
- weisser Titeltrennlinie
- integriertem Kurzprofilabsatz

um 2.8 mm nach oben.

Die Verschiebung darf nicht durch eine Schrift- oder Zeilenhöhenänderung simuliert werden.

Verbindlich:

- kein Kontakt mit den Buttons
- keine Überlagerung mit der Identitätsgruppe
- natürlicher Abstand zwischen Buttons und `KURZPROFIL`
- vollständiger Text sichtbar
- kombinierter Kurzprofiltext weiterhin vier Zeilen

Report:

```json
{
  "layout": {
    "summaryBlockShiftUpMm": 2.8,
    "summaryToIdentityGapMm": 0,
    "summaryCollisionFree": true
  }
}
```

## 2.3 Weisse Fläche weitere 3 mm nach oben erweitern

Reduziere die aktuelle Hero-Höhe von 101 mm auf 98 mm:

```css
.hero-panel {
  height: 98mm;
}

.competence-panel {
  height: calc(100% - 98mm);
}
```

oder eine geometrisch exakt gleichwertige Lösung.

Damit wird die weisse Kompetenzfläche gegenüber dem aktuellen Stand um weitere 3 mm nach oben erweitert. Gegenüber dem ursprünglichen 108-mm-Stand beträgt die gesamte Erweiterung nun 10 mm.

Verbindlich:

- Sprachen bleiben weiterhin an derselben absoluten unteren Position, maximal ±1 px.
- Vier Skillsets und 6–8 Bullets je Skillset bleiben vollständig sichtbar.
- Die Sprachabstandsregel bleibt erfüllt.
- Keine Schriftgrösse oder Icongrösse reduzieren.
- Keine Kollision zwischen Kurzprofil und weisser Fläche.

Report aktualisieren:

```json
{
  "layout": {
    "pageOneWhiteExtensionUpMm": 10,
    "heroPanelHeightMm": 98,
    "additionalPageOneExtensionMm": 3,
    "languageAbsoluteShiftPx": 0,
    "pageOneExtensionPassed": true
  }
}
```

## 2.4 `FÄHIGKEITEN UND SKILLS` höher setzen und Abstand vergrössern

Der Titel `FÄHIGKEITEN UND SKILLS` soll gegenüber seinem aktuellen absoluten Standort ungefähr 3 mm höher liegen.

Gleichzeitig darf er nicht mehr so eng an der oberen Trennlinie beziehungsweise dem ersten Skillset kleben.

Empfohlene Geometrie:

- Durch den um 3 mm höher beginnenden weissen Bereich rückt der Titel automatisch etwa 3 mm nach oben.
- Erhöhe zusätzlich den Abstand **unterhalb** des Titels zum ersten Skillset um ungefähr 3 mm, beispielsweise durch Anpassung von `margin-bottom`.
- Das erste Skillset soll dadurch ungefähr auf seiner bisherigen absoluten Y-Position bleiben, während der Titel höher steht und mehr Luft erhält.

Nicht verwenden:

- Text-Transform oder Skalierung zur Positionskorrektur
- negative Laufweite
- kleinere Schrift
- Entfernen der oberen Skillset-Trennlinie

Verbindlich:

- Titel weiterhin linksbündig mit Profilbild und `KURZPROFIL`
- Roboto Slab 700
- gleiche graue Rule-Farbe
- gleiche aktuelle Schriftgrösse
- obere horizontale Linie des ersten Skillsets weiterhin sichtbar
- Abstand zwischen Unterkante des Titels und oberer Skillset-Linie gegenüber dem aktuellen Referenzrun um 2.5–3.5 mm vergrössert

Report:

```json
{
  "skillsetsQuality": {
    "sectionTitle": {
      "shiftUpMm": 3,
      "gapToFirstSkillsetIncreaseMm": 3,
      "topRuleBeforeFirstSkillsetVisible": true,
      "leftAlignedWithSummary": true
    }
  }
}
```

---

# 3. Regressionstests

Ergänze Tests für mindestens:

1. Bei sicherer Ansprechperson existiert genau ein sichtbarer `#summary-text`-Absatz.
2. Es existiert kein separates `.summary-greeting`-Element.
3. `Hallo Anna, ich bin ...` beziehungsweise `Guten Tag Frau Meier, ich bin ...` steht als zusammenhängender Fliesstext im DOM.
4. Nach dem Anredekomma beginnt `ich`, `als`, `mit`, `durch` oder `gerne` kleingeschrieben.
5. Keine Sequenz `, Ich`, `, Als`, `, Mit` oder doppeltes Komma.
6. `summary.targetLines === 4` mit und ohne Anrede.
7. `summary.actualLines === 4` im Produktionsrender mit sicherer Greeting-Test-Fixture.
8. Anrede und restlicher Kurzprofiltext besitzen identische berechnete Font-, Style-, Weight-, Size-, Color- und Line-Height-Werte.
9. Identitätsgruppe ist real 5 mm nach oben verschoben und nicht abgeschnitten.
10. Kurzprofilblock ist real 2.8 mm nach oben verschoben und kollisionsfrei.
11. Hero-Höhe beträgt real 98 mm.
12. Weisse Fläche ist gegenüber 108 mm insgesamt 10 mm erweitert.
13. Sprachbereich bewegt sich höchstens ±1 px.
14. `FÄHIGKEITEN UND SKILLS` liegt rund 3 mm höher.
15. Titel-zu-erster-Skillset-Abstand wurde um 2.5–3.5 mm vergrössert.
16. Erste Skillset-Trennlinie bleibt sichtbar.
17. Exakt zwei Seiten, keine Overflows, keine Collisions, warnings leer.
18. Keine Schriftgrössenreduktion, kein `scaleX`, kein `font-stretch`, keine negative Laufweite.

---

# 4. Visual Review

Prüfe in der achtseitigen Kontaktübersicht besonders:

- Anrede wirkt wie natürlicher Beginn des Kurzprofils, nicht wie Briefkopf.
- Kein eigener Anredeabsatz und keine abweichende Schrift.
- Kurzprofil einschliesslich Anrede umfasst vier Zeilen.
- Profilbild, Name, Angaben und Buttons sind gemeinsam 5 mm höher.
- Zwischen Buttons und Kurzprofil bleibt genügend Luft.
- Kurzprofil steht knapp 3 mm höher.
- Der Übergang zur weissen Fläche beginnt 3 mm höher.
- `FÄHIGKEITEN UND SKILLS` steht höher und besitzt sichtbar mehr Abstand zum ersten Skillset.
- Sprachbereich bleibt unverändert.
- Keine Seite wirkt gedrängt oder abgeschnitten.

---

# 5. Workflow und Abschluss

Führe nach Umsetzung den vollständigen Workflow aus:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Erfolg erst bei:

- alle offenen Gates aus Review Runde 46 erfüllt
- renderAllExitCode 0
- renderTestsExitCode 0
- finaler Guard skipped
- alle vier Reports `success: true`
- visual-review `overallSuccess: true`
- `remainingDifferences: []`
- exakt zwei Seiten
- keine Overflows, Collisions oder Warnungen
- Kurzprofil mit und ohne Anrede exakt vier Zeilen
- keine typografisch separate Anrede
- reale 5-mm-/2.8-mm-/3-mm-Messwerte im Report

Berichte danach zusätzlich:

1. lokaler Commit-SHA
2. tatsächlicher Live-Head-SHA von PR #6
3. Workflow-Run und Schrittstatus
4. kombinierter Kurzprofiltext je Greeting-Testfall
5. verwendeter Connector-Modus und Connector-Text
6. Kurzprofil-Zeilenanzahl mit und ohne Anrede
7. berechnete Typografiegleichheit von Anrede und Profiltext
8. Identitätsgruppenverschiebung in mm
9. Kurzprofilverschiebung in mm
10. reale Hero-Höhe und gesamte White-Panel-Erweiterung
11. Titelverschiebung und neuer Abstand zum ersten Skillset
12. Sprachbereich-Verschiebung in px
13. PageCount, Overflows, Collisions und warnings pro Variante
14. Pfad zur achtseitigen Kontaktübersicht
15. Bestätigung: kein neuer Branch, kein PR #9, kein Merge
