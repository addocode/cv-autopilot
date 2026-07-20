# ACTIVE CODEX TASK — Review Runde 45

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
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 45` beginnt.
4. Bei Abweichung: keine Dateien verändern, keinen Commit erstellen und ausschliesslich `STALE SNAPSHOT` melden.

---

# Teil A — offene Abschlussarbeiten aus Review Runde 44

Die visuelle Basis aus PR #7 bleibt erhalten:

- getrennte Mediamatiker- und Berufsmaturitätsstation
- offizieller BM-Titel
- drei verifizierte BM-Bullets
- `FÄHIGKEITEN UND SKILLS`
- `LEBENSLAUF UND VERANTWORTUNG`
- Hero-Höhe 101 mm
- Seite-2-Footerhöhe 11 mm
- sichtbare obere Linie des ersten Skillsets
- exakt zwei Seiten
- unveränderte Schriftgrössen, Icons und Footer-Typografie

## A1. BM aus GEVER-Cross-Domain-Policy ausschliessen

Die Station `berufsmaturitaet-bbz-cfp` ist eine Ausbildungsstation und darf niemals einen GEVER-Cross-Domain- oder Breadth-Summary-Bullet erhalten.

Passe alle Zähler, erwarteten Stationenzahlen und Gates so an, dass nur berechtigte berufliche beziehungsweise operative Stationen berücksichtigt werden.

## A2. Visual-Review-Gate aktualisieren

Entferne das veraltete Gate `combinedTrainingCredentialPassed`.

Ersetze es durch echte Prüfungen:

- Mediamatiker-Ausbildung sichtbar
- BM als separate direkt folgende Station sichtbar
- korrekter Zeitraum beider Stationen
- korrekter BM-Titel
- `Berufsbildungszentrum BBZ-CFP, Biel`
- exakt drei sichtbare BM-Bullets
- alle drei `verified` und mit Source-IDs
- keine `.combined-training-title`

## A3. BM in die datengetriebene Single Source of Truth verschieben

Die BM-Station darf nicht hart in `scripts/render.mjs` konstruiert werden.

Verschiebe sie in das bestehende Master-Datenmodell beziehungsweise die private Master-Datenquelle und ergänze Schema/Source Map soweit erforderlich.

Der Renderer selektiert und rendert nur Daten; er erfindet keine Stationen.

## A4. Echte adaptive Experience-Füllung

Implementiere einen tatsächlichen Render-Schritt `experience-layout-selection` vor `initial-layout-metrics`.

Kandidatenpool:

1. ausgelassene reguläre source-backed Bullets
2. optionale source-backed Bullets
3. belegbare längere Formulierungsvarianten
4. erst danach maximal ein Breadth-Summary-Bullet pro berechtigter Station

Ausschliessen:

- bereits sichtbare Inhalte
- semantische Dubletten
- doppelte IDs
- BM-Pflichtbullets als optionale Kandidaten
- `inferred_review_required`
- unbelegte Aussagen

Jeden Kandidaten einzeln einblenden, Layout neu messen und nur behalten bei:

- exakt zwei Seiten
- keine Overflows
- keine Collisions
- kein abgeschnittener Text
- mindestens 5 mm Abstand zur Footer-Trennlinie
- Source-IDs und zulässiger Evidence-Status

Zielwerte:

- `communication-content`: 0.88–0.96
- übrige Varianten: 0.82–0.96

Entferne False-Positive-Logik wie `fillRatio >= target || breadthBulletExists`.

Wenn das Ziel nach Ausschöpfung aller sicheren Kandidaten nicht erreichbar ist:

```json
{
  "withinTargetRange": false,
  "maximalSafeContentExhausted": true
}
```

mit vollständiger Kandidaten- und Ablehnungsdokumentation.

## A5. Reale Layoutmetriken

Berichte und teste mindestens:

```json
{
  "layout": {
    "pageOneWhiteExtensionUpMm": 7,
    "heroPanelHeightMm": 101,
    "languageAbsoluteShiftPx": 0,
    "pageOneExtensionPassed": true,
    "pageTwoWhiteExtensionMm": 17,
    "pageTwoBlueStripHeightMm": 11,
    "pageTwoFooterShiftPx": 0,
    "pageTwoFooterShiftPassed": true
  }
}
```

Die Werte müssen aus realen DOM-Messungen berechnet werden, nicht hart als erfolgreiche Konstanten gesetzt sein.

---

# Teil B — stellenbezogene Personalisierung von EINTRITT und PENSUM

## B1. Ziel

Die Werte unter `EINTRITT` und `PENSUM` werden pro Bewerbung sichtbar anhand des konkreten Stelleninserats formuliert.

Sie sollen gleichzeitig zeigen:

1. Das Inserat wurde berücksichtigt.
2. Adam ist für eine alternative Vereinbarung offen.

Keine erfundenen Termine oder Arbeitspensen.

## B2. Datenmodell

Erweitere den Bewerbungskontext um eine validierte Struktur, sinngemäss:

```json
{
  "applicationContext": {
    "jobAd": {
      "rawText": "",
      "sourceId": "job-ad-current",
      "workload": {
        "kind": "single|range|full-time|part-time|unspecified",
        "minPercent": null,
        "maxPercent": null,
        "sourceText": "",
        "confidence": 0
      },
      "start": {
        "kind": "date|immediately|by-agreement|unspecified",
        "isoDate": null,
        "sourceText": "",
        "confidence": 0
      },
      "contact": null
    }
  }
}
```

Strukturierte, validierte Felder haben Vorrang. Ein deterministischer Parser darf klare Angaben aus `rawText` erkennen. Unsichere Angaben werden nicht übernommen.

## B3. PENSUM-Formatierung

Verbindliche Beispiele:

```text
80 % gemäss Inserat, flexibel nach Absprache
```

```text
80–100 % gemäss Inserat, flexibel nach Absprache
```

```text
100 % gemäss Inserat, flexibel nach Absprache
```

Fallback bei fehlender oder unsicherer Angabe:

```text
Flexibel nach Absprache
```

Regeln:

- Schweizer Schreibweise mit geschütztem beziehungsweise normalem Leerzeichen vor `%`.
- En-Dash für Bereiche.
- Keine Prozentzahl erfinden.
- Inseratstext wie `Vollzeit` darf bei eindeutiger Bedeutung zu `100 %` normalisiert werden.
- Bei widersprüchlichen Angaben Fallback statt Vermutung.

## B4. EINTRITT-Formatierung

Verbindliche Beispiele:

```text
Per 01.08.2026 gemäss Inserat, alternativ nach Vereinbarung
```

```text
Per sofort gemäss Inserat, alternativ nach Vereinbarung
```

```text
Nach Vereinbarung
```

Fallback bei fehlender oder unsicherer Angabe:

```text
Per sofort oder nach Vereinbarung
```

Regeln:

- Datumsformat sichtbar `DD.MM.YYYY`.
- ISO intern zulässig.
- Keine Termine aus dem Publikationsdatum oder Bewerbungsfrist ableiten.
- `Eintritt per ...`, `Start am ...`, `Stellenantritt ...` dürfen erkannt werden.
- Abgelaufene oder widersprüchliche Termine nicht blind übernehmen; als unsicher markieren und Fallback verwenden.

## B5. Layout des Footerblocks

`EINTRITT` und `PENSUM` dürfen auf zwei Zeilen umbrechen.

Der PENSUM-Block darf bei Bedarf innerhalb seiner bestehenden Footer-Spalte nach unten rücken.

Verbindlich:

- keine kleinere Schrift
- keine horizontale Kompression
- keine Überlagerung
- beide Überschriften und Icons bleiben ausgerichtet
- Footer bleibt vollständig innerhalb des White Panels
- blauer Balken bleibt sichtbar
- keine dritte Seite

Ergänze eine adaptive Messung der beiden Textblöcke und ihrer vertikalen Abstände.

## B6. Report

Ergänze mindestens:

```json
{
  "jobAdPersonalization": {
    "workload": {
      "sourceText": "",
      "parsedValue": "",
      "renderedText": "",
      "usedFallback": false,
      "confidence": 0,
      "visible": true,
      "atsExtractable": true
    },
    "start": {
      "sourceText": "",
      "parsedValue": "",
      "renderedText": "",
      "usedFallback": false,
      "confidence": 0,
      "visible": true,
      "atsExtractable": true
    },
    "footerLayout": {
      "entryLineCount": 0,
      "workloadLineCount": 0,
      "workloadShiftPx": 0,
      "collisionFree": true
    }
  }
}
```

---

# Teil C — optionales personalisiertes Wow-Element im Kurzprofil

## C1. Grundsatz

Eine persönliche Anrede wird nur angezeigt, wenn aus dem Stelleninserat eine konkrete natürliche Ansprechperson sicher erkannt wurde.

Bei fehlender, generischer oder unsicherer Ansprechperson entfällt das Element vollständig. Es darf kein leerer Platzhalter entstehen.

Nicht zulässig:

- `Sehr geehrte Damen und Herren`
- `Liebes HR-Team`
- erfundene Namen
- aus E-Mail-Adressen erratene Namen
- aus Vornamen erratenes Geschlecht
- Verwechslung von Autoren, Geschäftsleitung oder Datenschutzkontakt mit der Bewerbungsansprechperson

## C2. Kontaktdatenmodell

Sinngemäss:

```json
{
  "contact": {
    "fullName": "Anna Müller",
    "firstName": "Anna",
    "lastName": "Müller",
    "explicitSalutation": "Frau|null",
    "role": "Recruiting",
    "addressMode": "formal|informal|neutral|unknown",
    "sourceText": "",
    "confidence": 0,
    "isApplicationContact": true
  }
}
```

Nur `isApplicationContact === true` und hohe Konfidenz erlauben die Ausgabe.

## C3. Tonalitätslogik

### Informell

Nur bei klarer Du-Kultur im Inserat und sicherem Vornamen:

```text
Hallo Anna,
```

Du-Kultur darf aus mehrfachen eindeutigen Formulierungen wie `du`, `dein`, `dich`, `wir freuen uns auf dich` oder einer expliziten Aufforderung zur Vornamensansprache erkannt werden.

### Formell mit expliziter Anrede

Wenn das Inserat die Person ausdrücklich als Frau/Herr oder mit Titel nennt:

```text
Guten Tag Frau Müller,
```

```text
Guten Tag Herr Meier,
```

### Neutral-formell

Wenn eine sichere natürliche Ansprechperson vorhanden ist, aber Geschlecht oder gewünschte Anrede nicht zuverlässig feststehen:

```text
Guten Tag Anna Müller,
```

### Weglassen

Bei `addressMode === unknown`, unklarer Person oder geringer Konfidenz wird nichts gerendert.

## C4. Visuelle Integration

Die Anrede erscheint innerhalb des Kurzprofil-Moduls:

- direkt unter `KURZPROFIL`
- vor dem eigentlichen Kurzprofiltext
- eigene sichtbare Zeile
- Arial/Liberation Sans
- gleiche Grundschriftgrösse wie der Kurzprofiltext
- normal oder semibold, nicht kursiv
- weiss auf dem blauen Hintergrund
- dezent, ohne eigenes Icon und ohne neue Trennlinie

Damit die Gesamthöhe stabil bleibt:

- ohne Anrede: Kurzprofiltext weiterhin Ziel 4 sichtbare Zeilen
- mit Anrede: Anrede 1 Zeile plus Kurzprofiltext Ziel 3 sichtbare Zeilen
- keine Schriftverkleinerung
- keine Kollision mit der weissen Kompetenzfläche
- falls keine belegte sichere 3-Zeilen-Zusammenfassung passt, Anrede weglassen statt Layout zu komprimieren

Die Anrede ist sichtbar und extrahierbar, aber kein zwingender ATS-Required-Term.

## C5. Kurzprofilinhalt

Die Anrede ersetzt keine fachliche Aussage. Der eigentliche Kurzprofiltext bleibt stellenbezogen und beginnt direkt mit dem Mehrwertprofil.

Nicht redundant formulieren:

```text
Hallo Anna, ich bin Mediamatiker EFZ ...
```

Bevorzugt:

```text
Hallo Anna,
Als Mediamatiker EFZ verbinde ich ...
```

beziehungsweise eine vorhandene kürzere, belegte Profilvariante.

## C6. Report

```json
{
  "jobAdPersonalization": {
    "greeting": {
      "candidateFound": true,
      "rendered": true,
      "text": "Hallo Anna,",
      "addressMode": "informal",
      "sourceText": "",
      "confidence": 0,
      "omissionReason": null,
      "visible": true,
      "atsExtractable": true,
      "summaryTargetLines": 3,
      "summaryActualLines": 3
    }
  }
}
```

---

# Teil D — Tests

Ergänze Data-, Preview- und Produktionsrender-Tests für mindestens folgende Fälle:

## Footer-Personalisierung

1. `80 %` wird zu `80 % gemäss Inserat, flexibel nach Absprache`.
2. `80–100 %` wird korrekt normalisiert.
3. `Vollzeit` wird bei eindeutiger Angabe zu `100 %`.
4. fehlendes Pensum erzeugt `Flexibel nach Absprache`.
5. konkretes Startdatum wird als `Per DD.MM.YYYY gemäss Inserat, alternativ nach Vereinbarung` gerendert.
6. `per sofort` wird korrekt gerendert.
7. fehlender Eintritt erzeugt `Per sofort oder nach Vereinbarung`.
8. Bewerbungsfrist oder Publikationsdatum wird nicht als Eintritt verwendet.
9. beide Werte sind sichtbar und ATS-extrahierbar.
10. zweizeilige Werte verursachen keine Footer-Kollision.

## Anrede

11. klare Du-Kultur plus Kontakt `Anna Müller` erzeugt `Hallo Anna,`.
12. explizit `Frau Müller` plus Sie-Kultur erzeugt `Guten Tag Frau Müller,`.
13. sichere Person ohne sichere Anrede erzeugt `Guten Tag Anna Müller,`.
14. keine Person erzeugt keine Greeting-Zeile.
15. generischer `HR-Kontakt` erzeugt keine Greeting-Zeile.
16. Name nur aus E-Mail-Adresse wird nicht verwendet.
17. mit Greeting: Greeting 1 Zeile plus Summary 3 Zeilen.
18. ohne Greeting: Summary 4 Zeilen.
19. bei Layoutkonflikt wird Greeting weggelassen, nicht die Schrift verkleinert.
20. Greeting ist nicht als ATS-Pflichtterm markiert.

## Bestehende Qualität

21. BM bleibt von Cross-Domain/Breadth ausgenommen.
22. Visual Review prüft getrennte Ausbildungsstationen.
23. echte Experience-Kandidatenliste ist nicht leer, sofern ausgelassene belegte Inhalte existieren.
24. `fillRatioBefore` und `fillRatioAfter` unterscheiden sich bei akzeptierten Kandidaten.
25. keine False-Positive-Füllung.
26. exakt zwei Seiten.
27. Overflows, Collisions und Warnings leer.
28. keine Fontgrössenreduktion, kein `scaleX`, kein negatives Tracking.
29. Footer-Typografie und Icons unverändert.
30. alle vier Reports `success: true` und Visual Review `overallSuccess: true`.

---

# Teil E — Workflow

Vollständig ausführen:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Danach den Live-GitHub-Workflow abwarten.

Erfolg erst bei:

- `renderAllExitCode: 0`
- `renderTestsExitCode: 0`
- finaler Guard skipped
- alle vier Reports `success: true`
- Visual Review `overallSuccess: true`
- `remainingDifferences: []`
- exakt zwei Seiten pro Variante
- keine Overflows, Collisions oder Warnings
- keine unbelegten Inhalte
- keine neue Schriftkompression

---

# Teil F — Abschlussbericht

Berichte mindestens:

1. lokaler Commit-SHA
2. Live-Head-SHA von PR #7
3. Workflow-Run und Status aller Schritte
4. beide Exit-Codes und finaler Guard
5. BM-/GEVER-Ausnahme und Visual-Review-Gate
6. Speicherort der BM-Station in der Master-Datenquelle
7. Experience-Fill-Ratio vor/nach pro Variante
8. akzeptierte und abgelehnte Kandidaten mit Gründen
9. gerenderte PENSUM- und EINTRITT-Werte für alle Testfixtures
10. Parserquelle, Konfidenz und Fallbackstatus
11. Greeting-Ergebnis für formal, informell, neutral und ohne Kontakt
12. Summary-Zeilenzahl mit und ohne Greeting
13. Footer-Line-Counts und PENSUM-Verschiebung
14. PageCount, Overflows, Collisions, Warnings
15. ATS-/Poppler-/PDF.js-Ergebnisse
16. `report.success` pro Variante
17. Visual Review und `remainingDifferences`
18. Pfad zur achtseitigen Kontaktübersicht
19. Bestätigung: kein PR #8 und nichts gemergt

Beginne jetzt ohne weitere Rückfrage.