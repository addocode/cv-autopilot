# Motivationsschreiben Autopilot

## Status

Produktiver zweiter Dokumentgenerator des CV Autopilot. Dieses Modul wird separat vom CV-Renderer geführt, verwendet jedoch dieselbe Bewerbungsinstanz, dieselbe Faktenbasis und dieselben Beleg-IDs.

Der Generator erstellt keine Standardbriefe. Er soll für jedes Stelleninserat eine eigenständige, glaubwürdige Argumentation entwickeln und diese anschliessend rendern, messen, prüfen und bei Bedarf überarbeiten.

## Zielbild

Ein eingefügtes Stelleninserat löst einen gemeinsamen Ablauf aus:

1. Stelleninserat analysieren.
2. Gemeinsame Bewerbungsstrategie und Belegauswahl erstellen.
3. Individuellen CV konfigurieren und rendern.
4. Motivationsschreiben aus derselben Strategie und denselben Belegen verfassen.
5. Mailanschreiben erzeugen.
6. CV und Motivationsschreiben gegenseitig auf Konsistenz prüfen.
7. Alle Dokumente rendern, messen und in der Bewerbungsakte speichern.
8. Adam erhält Vorschauen und Reports zur manuellen Schlussfreigabe. Es erfolgt kein automatischer Versand.

## Modulgrenzen

Empfohlene Ablage:

```text
modules/
├── motivation-letter/
│   ├── README.md
│   ├── layout-reference.json
│   ├── guidance-sources.json
│   ├── src/
│   │   ├── strategy.mjs
│   │   ├── compose.mjs
│   │   ├── emphasize.mjs
│   │   ├── template.mjs
│   │   └── quality-report.mjs
│   ├── styles/
│   │   └── motivation-letter.css
│   └── tests/
│       ├── content.test.mjs
│       └── render.test.mjs
└── application-email/
    └── README.md
```

Die Module bleiben fachlich getrennt. Gemeinsame Daten werden nicht kopiert, sondern aus `01_application-context.json` und einer neuen, dokumentübergreifenden Strategie gelesen.

## Gemeinsamer Strategie-Vertrag

Vor CV und Motivationsschreiben soll ein gemeinsamer Strategiebaustein entstehen, beispielsweise `06_application-strategy.json`:

```json
{
  "schemaVersion": 1,
  "applicationId": "2026-07-21_beispielamt_sachbearbeiter-digitalisierung",
  "roleFamily": "administration-gever",
  "positioning": "Digital Administration mit Mediamatik- und Bundeserfahrung",
  "motivationAngle": "Hin-zu-Motivation für strukturierte, sinnvolle und langfristige Verwaltungsarbeit",
  "valueProposition": "Digitale Geschäftsvorgänge strukturiert bearbeiten, verständlich dokumentieren und Prozesse mit hoher IT-Affinität unterstützen",
  "selectedEvidenceIds": [
    "experience-army-acta-nova",
    "experience-fors-process-documentation",
    "skill-digital-systems"
  ],
  "gapHandling": [
    {
      "requirement": "klassische KV-Ausbildung",
      "handling": "nicht behaupten; über Berufsmaturität, ACTA NOVA, Dokumentenmanagement und übertragbare Praxis argumentieren"
    }
  ],
  "longTermSignal": {
    "use": true,
    "reason": "Rolle und Arbeitgeber passen zur belegten beruflichen Neuorientierung"
  },
  "portfolioUse": "optional",
  "aiTrainingUse": "only_if_relevant"
}
```

CV, Motivationsschreiben und Mail müssen diese Strategie verwenden. Kein Dokument darf eine neue unbelegte Tatsache einführen.

## Inhaltliche Rolle des Generators

Der Generator arbeitet gleichzeitig als:

- HR-Berater mit Verständnis für Schweizer Bewerbungsgewohnheiten,
- professioneller Bewerbungsautor,
- Faktenprüfer,
- Karriereübersetzer für Quereinstiege,
- Redaktor für natürliche, nicht generische Sprache,
- Qualitätsprüfer für Layout, Konsistenz und Wirkung.

## Kernfragen jedes Schreibens

Jeder Text muss konkret beantworten:

1. Weshalb interessiert Adam genau diese Position und genau dieser Arbeitgeber?
2. Welche zwei bis vier belegten Erfahrungen sind für diese Stelle am stärksten?
3. Welchen konkreten Nutzen bringt Adam in den ersten Monaten?
4. Wie lassen sich fehlende direkte Erfahrungen ehrlich und überzeugend überbrücken?
5. Weshalb ist die Motivation bei fachfremderen Rollen glaubwürdig und nicht bloss eine Notlösung?
6. Weshalb ist eine langfristige Zusammenarbeit plausibel, sofern sie wirklich zur Stelle passt?
7. Welche Inhalte gehören besser in den CV und sollen im Schreiben nicht wiederholt werden?

## Rollenabhängige Argumentationslogik

### Direkte Passung: Mediamatik, Kommunikation, Content, Web

- Mit konkreten Arbeitsproben und Projekten starten.
- Direkte Wirkung und schnelle Einsatzfähigkeit zeigen.
- Portfolio gezielt nennen.
- Keine lange Erklärung des Berufswechsels.

### Angrenzende Passung: Digitalisierung, CMS, Prozesssupport, Verbände

- Schnittstelle aus Gestaltung, Technik, Struktur und Koordination zeigen.
- Belege aus FORS, Websystemen, Prozessdokumentation und Stakeholder-Koordination auswählen.
- Weiterentwicklung als bewusste Hin-zu-Bewegung formulieren.

### Quereinstieg: Sachbearbeitung, Bund, Kanton, Administration, GEVER

- Nicht defensiv mit fehlender KV-Ausbildung beginnen.
- Zuerst die echte Motivation für klare Prozesse, gesellschaftlichen Nutzen, Verlässlichkeit und langfristige Entwicklung darstellen.
- Danach übertragbare Praxis belegen: ACTA NOVA, Geschäftsvorgänge, Qualitätssicherung, Dokumentenverwaltung, MS Office, Koordination und Berufsmaturität.
- Marketing als Zusatznutzen darstellen, nicht als eigentliche Zielrolle.
- Langfristigkeit ausdrücklich nennen, wenn Arbeitgeber, Rolle und Strategie dies rechtfertigen.

### Initiativbewerbung oder bewusster Kompetenz-Gap

- Ausgangspunkt und Anlass transparent erklären.
- Keine geforderte Führung, Software oder Ausbildung erfinden.
- Einen realistischen alternativen Einsatzbereich benennen.
- Initiative als präzise und respektvolle Anfrage formulieren.

## Textstruktur

Die Struktur ist adaptiv, nicht starr. Standardmässig soll das Schreiben folgende Funktionen erfüllen:

1. **Anrede**
2. **Individuelle Einleitung** mit Stellen-/Arbeitgeberbezug und echter Motivation
3. **Relevanter Profilbeleg** mit konkreter Praxis
4. **Zweiter Profilbeleg oder Quereinstiegsbrücke**
5. **Mehrwert- und Zukunftsabschnitt**: konkrete Wirkung, mögliche Verbesserungen, Entwicklung
6. **Optionaler Zusatzabschnitt**: Portfolio, KI-Weiterbildung oder besonderes Projekt - nur bei Relevanz
7. **Verbindlicher Schluss** mit Gesprächswunsch
8. **Grussformel und Name**

Absätze dürfen zusammengelegt oder ausgelassen werden, wenn ein kürzerer Text stärker ist.

## Sprachregeln

- Schweizer Hochdeutsch, kein `ß`.
- Natürlich, persönlich und professionell.
- Keine erfundenen Kenntnisse, Kennzahlen oder Verantwortungen.
- Keine generischen KI-Floskeln.
- Keine blosse Wiederholung des Inserats oder CVs.
- Konkrete Verben statt unnötiger Nominalstil.
- Wenig Konjunktiv; verbindliche, aber nicht überhebliche Aussagen.
- Einleitung und Schlusssatz dürfen nicht serienbriefartig klingen.
- Adjektive nur, wenn sie mit einer Handlung oder einem Beispiel gestützt werden.
- Arbeitgeberlob nur konkret und quellengestützt.
- Nicht jedes Schreiben erwähnt KI, Portfolio, Weiterbildung oder dieselben Projekte.
- Keine künstlich dramatische Lebensgeschichte.
- Keine Behauptung langfristiger Bindung, wenn sie aus Rolle und Strategie nicht plausibel ist.

## Beleg- und Wahrheitsregeln

Zulässige Inhalte:

- `verified`: darf direkt verwendet werden.
- `defensible_inference`: darf vorsichtig und nachvollziehbar formuliert werden.
- `inferred_review_required`: nur in der Review Queue, nicht automatisch im finalen Text.
- `unsupported_rejected`: darf nicht erscheinen.

Jede substanzielle Aussage im Text muss im Report auf mindestens eine `sourceId` oder auf eine belegte Stellen-/Unternehmensquelle zurückgeführt werden können.

## Quellen- und Ratgebervergleich

Der Generator soll nicht bei jeder Bewerbung beliebige Blogtexte live zusammenfassen. Stattdessen nutzt er zwei Ebenen:

1. **Versionierte Guidance Library** mit kuratierten Schweizer Regeln für Individualität, Arbeitgebernutzen, Kürze, Struktur, konkrete Belege, Zukunftsbezug und Schlusskontrolle.
2. **Aktuelle Arbeitgeberrecherche** aus dem Stelleninserat und bevorzugt offiziellen Unternehmensseiten. Firmenbezogene Aussagen dürfen nur verwendet werden, wenn eine Quelle gespeichert wird.

Der Qualitätsreport nennt:

- Guidance-Version,
- konsultierte Quellen,
- angewandte Regeln,
- bewusst nicht angewandte Regeln,
- aktuelle Arbeitgeberquellen,
- unbelegte oder unsichere Firmenaussagen.

Die Quellen erscheinen nicht als Fussnoten im Motivationsschreiben; sie bleiben im internen Report.

## Dynamische Länge

Die Länge wird nicht allein über Wortzahl gesteuert. Der Renderer misst die tatsächliche Höhe.

- Die rote Hilfslinie der Vorlage markiert den spätesten erlaubten Textbeginn und damit die Mindestlänge.
- Die grüne Hilfslinie markiert den frühesten erlaubten Textbeginn und damit die Maximallänge.
- Beide Linien sind reine Entwicklungs-/Testelemente und dürfen im finalen PDF nie sichtbar sein.
- Der untere Abschlussbereich bleibt stabil. Bei längerem Inhalt wächst der Textblock nach oben.
- Der Generator wählt zunächst eine rollenabhängige Ziellänge und überarbeitet den Text danach renderbasiert.
- Kürzen erfolgt semantisch: Wiederholungen, schwächere Beispiele und allgemeine Sätze zuerst entfernen.
- Verlängern erfolgt ebenfalls semantisch: zusätzlichen Profilbeleg, konkreten Mehrwert oder glaubwürdigen Zukunftsbezug ergänzen. Kein Fülltext.

Orientierungsbereich für die erste Komposition: ungefähr 250 bis 340 Wörter inklusive Anrede und Schluss; die Render-Messung ist verbindlich.

## Layout-Vertrag

Die exakten Werte stehen in `layout-reference.json`. Wesentliche Regeln:

- A4, eine Seite.
- Vollflächiges Hintergrundbild wie beim CV.
- Weisser Inhaltsbereich mit blauem oberen Balken und blauen Seitenrails.
- Titel rechtsbündig in Roboto Slab Bold: `Bewerbung als` plus bereinigte Stellenbezeichnung.
- Stellenprozent im Titel entfernen.
- Bei Schreibweisen wie `Mitarbeiter/in`, `Mitarbeiter:in`, `Mitarbeiter*in` oder ausgeschriebener männlicher/weiblicher Form wird für Adam die korrekte männliche Form verwendet.
- Referenznummer nur rendern, wenn sie im Inserat explizit erkannt wurde. Sonst Element vollständig aus DOM und Report-Sichtbarkeit entfernen.
- Generierungsdatum im linken blauen Rail vertikal darstellen.
- Datum muss bei jeder Textlänge mit der ersten Zeile der Anrede bündig bleiben und sich deshalb mit dem dynamischen Textbeginn verschieben.
- Body: Arial 11 pt, ungefähr 14 pt Zeilenhöhe.
- Wichtige Stichworte sparsam in Bold und Blau hervorheben.
- Links bleiben klickbar und ATS-lesbar.
- Grussformel und Name bleiben im unteren Bereich stabil.

## Hervorhebungslogik

Blau + Bold ist ein bewusst knappes Gestaltungsmittel.

Standardbudget:

- zwei bis vier Hervorhebungsgruppen,
- höchstens eine Hervorhebungsgruppe pro Absatz,
- keine ganzen Sätze,
- keine mehrfachen Hervorhebungen desselben Begriffs.

Priorität:

1. Stellenbezeichnung bei der ersten relevanten Nennung,
2. stärkster belegter Abschluss, Skill oder Systembezug,
3. optional ein zentrales Projekt oder ein Portfolio-Link,
4. optional eine zweite besonders stellenrelevante Kompetenz.

Der Text darf auch mit weniger Hervorhebungen stärker sein. Der Renderer reportet Anzahl, Wortanteil und Wiederholungen.

## Titelbereinigung

Der Titel muss immer mit `Bewerbung als` beginnen.

Beispiele:

- `Sachbearbeiter/in Administration 80-100 %` -> `Bewerbung als Sachbearbeiter Administration`
- `Mediamatiker*in (80 %)` -> `Bewerbung als Mediamatiker`
- `Content Manager:in` -> `Bewerbung als Content Manager`
- `Fachspezialist/in Kommunikation` -> `Bewerbung als Fachspezialist Kommunikation`

Bei sprachlich unklaren oder substantivisch neutralen Titeln wird nichts unnötig maskulinisiert. Die bereinigte Bezeichnung wird im Report mit Originalwert und Transformationsregel dokumentiert.

## Bedingte Referenz

Erkannte Muster können sein:

- Referenznummer
- Job-ID
- Stellen-ID
- Vakanznummer
- Ausschreibungsnummer
- Kennziffer
- Requisition ID

Nur eine im Inserat oder Bewerbungsportal explizit gefundene Kennung darf erscheinen. Eine Telefonnummer, Postleitzahl oder URL-Zahl darf nie als Referenz geraten werden.

Datenmodell:

```json
{
  "reference": {
    "value": "0123456789",
    "label": "Referenz",
    "sourceText": "Referenznummer 0123456789",
    "confidence": 0.99,
    "visible": true
  }
}
```

Wenn kein sicherer Treffer existiert:

```json
{
  "reference": {
    "value": "",
    "label": "Referenz",
    "sourceText": "",
    "confidence": 0,
    "visible": false
  }
}
```

## Output pro Bewerbung

Als Erweiterung des bestehenden flachen Bewerbungsarchivs, ohne die aktuellen CV-Dateien umzubenennen:

```text
applications/<applicationId>/
├── 00_stelleninserat.md
├── 01_application-context.json
├── 02_cv_<variant>.pdf
├── 03_cv_<variant>-preview.html
├── 04_manifest.json
├── 05_render-report.json
├── 06_application-strategy.json
├── 07_motivationsschreiben.pdf
├── 08_motivationsschreiben-preview.html
├── 09_motivationsschreiben-report.json
├── 10_mailanschreiben.md
└── 11_application-package-report.json
```

`04_manifest.json` wird am Ende erneut erstellt und enthält danach sämtliche Dateien.

## Motivationsschreiben-Report

Mindestvertrag:

```json
{
  "success": true,
  "pageCount": 1,
  "applicationId": "...",
  "jobTitleOriginal": "...",
  "jobTitleRendered": "...",
  "generationDate": "2026-07-21",
  "referenceVisible": false,
  "bodyStartMm": 95.8,
  "bodyStartWithinGuides": true,
  "dateAlignedWithSalutation": true,
  "overflows": [],
  "collisions": [],
  "unsupportedClaims": [],
  "selectedEvidenceIds": [],
  "companySources": [],
  "guidanceVersion": "1.0",
  "emphasis": {
    "groupCount": 3,
    "wordShare": 0.035,
    "repeatedTerms": []
  },
  "content": {
    "roleMotivationPresent": true,
    "employerMotivationPresent": true,
    "valuePropositionPresent": true,
    "concreteEvidenceCount": 3,
    "longTermSignalUsed": true,
    "cvDuplicationRisk": false,
    "genericPhraseRisk": false
  },
  "cvConsistency": true,
  "reviewQueue": []
}
```

## Paketübergreifender Qualitätscheck

`11_application-package-report.json` prüft mindestens:

- Arbeitgebername in allen Ausgaben identisch,
- Stellenbezeichnung korrekt und sinnvoll bereinigt,
- Kontaktperson und Anrede konsistent,
- dieselben Belege werden nicht widersprüchlich beschrieben,
- keine unbelegten Aussagen,
- CV und Schreiben ergänzen sich statt sich zu kopieren,
- Pensum und Eintritt korrekt,
- Referenz korrekt oder vollständig ausgeblendet,
- Motivationsschreiben genau eine Seite,
- CV genau zwei Seiten,
- Mailbetreff und Anhänge korrekt,
- keine Altlasten aus einer früheren Bewerbung,
- manuelle Schlussfreigabe erforderlich.

## Tests und Fixtures

Mindestens folgende Fälle automatisieren:

1. Direkte Mediamatiker-/Kommunikationsstelle mit Portfolio und KI-Bezug.
2. Bundesstelle Sachbearbeitung mit Referenznummer und ehrlicher Quereinstiegsbrücke.
3. KV-/Administrationsstelle ohne Referenznummer.
4. Informelle Du-Ansprache.
5. Kein Kontaktname.
6. Sehr lange Stellenbezeichnung mit Genderzeichen und Pensum.
7. Inserat mit mehreren Zahlen, aber keiner echten Referenz.
8. Rolle ohne sinnvollen Portfolio- oder KI-Bezug.
9. Initiativbewerbung mit bewusstem Kompetenz-Gap.
10. Maximal- und Minimallänge nahe den beiden unsichtbaren Guides.
11. Unsichere Firmenbehauptung wird verworfen oder in Review Queue verschoben.
12. CV-/MS-Widerspruch führt zu fehlgeschlagenem Paket-Guard.

## Akzeptanzkriterien für Version 1

- Ein Stelleninserat erzeugt CV, Motivationsschreiben und Mail in einem Durchlauf.
- Beide PDFs verwenden dieselbe Bewerbungs-ID und denselben Anwendungskontext.
- Motivationsschreiben ist eine A4-Seite und liegt innerhalb der unsichtbaren Längengrenzen.
- Datum wird automatisch auf den Generierungstag gesetzt und bleibt mit der Anrede bündig.
- Referenz ist nur bei sicherem Inseratstreffer sichtbar.
- Titel beginnt immer mit `Bewerbung als` und enthält kein Pensum.
- Hervorhebungen sind sparsam, blau, fett und semantisch begründet.
- Quereinstiege werden ehrlich, motiviert und langfristig plausibel erklärt.
- Keine unbelegten Fähigkeiten oder Arbeitgeberbehauptungen.
- CV, Schreiben und Mail bestehen den gemeinsamen Qualitätscheck.
- Automatischer Versand bleibt ausgeschlossen.
