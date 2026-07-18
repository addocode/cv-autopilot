# Codex-Auftrag – CV Autopilot v1

## Repository

`addocode/cv-autopilot`

## Ziel

Erstelle ein modular befüllbares, lokal ausführbares und Adobe-unabhängiges CV-Framework auf Basis des bestehenden 2-Seiten-CVs von Adam Dolinsky.

Das System soll später durch ChatGPT/Codex anhand eines Stelleninserats automatisch angepasst werden können. In Phase 1 geht es jedoch zuerst um:

1. visuell präzisen Nachbau,
2. sauberes Datenmodell,
3. Variantenlogik,
4. PDF-Export,
5. Überlauf-/Qualitätskontrollen,
6. Datenschutz im öffentlichen Repository.

Kein generisches CV-Template bauen. Die bestehende Gestaltung ist die visuelle Source of Truth.

---

# 1. Bereitgestellte Referenzen

## Primäre Layoutreferenz

`2d_Lebenslauf_Adam-Dolinsky.pdf`

Diese Datei definiert:

- A4-Hochformat
- exakt zwei Seiten
- blaues Rahmensystem
- Holz-Hintergrund
- asymmetrische Editorial-Struktur
- kreisförmiges Profilbild
- Typografie, Grössenverhältnisse und Abstände
- Kompetenzblöcke auf Seite 1
- Berufserfahrung plus Tools/Referenzen/Eintritt/Pensum auf Seite 2

Der 2-Seiten-CV ist die primäre visuelle und strukturelle Referenz. Er wurde auf Empfehlung der RAV-Beraterin gekürzt und soll im Normalfall das finale Format bleiben.

## Inhaltsarchiv

`2b_Lebenslauf_Adam-Dolinsky_alt.pdf`

Diese Datei ist **keine Layoutvorlage**. Sie enthält ausführlichere Inhalte, ältere Formulierungen und zusätzliche Detailinformationen.

Verwendung:

- Reservepool für Tätigkeitsbausteine
- zusätzliche Erfahrungstexte
- historische Detailquelle
- Quelle für spätere Spezialvarianten

Nicht automatisch alle Inhalte übernehmen. Das Ziel bleibt ein fokussierter 2-Seiten-CV.

## LinkedIn-Datenquelle

`Linkedin_Profil_Extrakt.pdf`

Diese Datei liefert:

- Berufsstationen
- Zeiträume
- Skills
- Skill-Zuordnungen zu Stationen
- Projekte
- Tool-Erfahrung
- Portfolio-Projekte
- zusätzliche technische Kenntnisse

Wichtig:

LinkedIn-Skills sind nicht automatisch gleichwertige Berufserfahrung. Jeder Skill muss in der Datenbank klassifiziert werden:

- `professional_core`
- `professional_supporting`
- `project_experience`
- `training_exposure`
- `basic`
- `historical`
- `do_not_surface_automatically`

Beispiele:

- Adobe InDesign: `professional_core`
- ACTA NOVA: `professional_supporting`
- Windows Server: `training_exposure`
- MySQL/phpMyAdmin: `basic` oder `training_exposure`
- Skype: `historical`
- Assistenz der Geschäftsleitung: nur als kontextgebundene Erfahrung, nicht als formaler Jobtitel

## Motivationsschreiben als Designreferenzen

- `1_Motivationsschreiben_Adam-Dolinsky_hep.pdf`
- `1_Motivationsschreiben_Adam-Dolinsky_KeystoneSDA.pdf`
- `1_Motivationsschreiben_Adam-Dolinsky_SPE.pdf`
- `1_Motivationsschreiben_Adam-Dolinsky_ZIVI.pdf`

Diese vier Dateien dienen als zusätzliche Referenz für ein gemeinsames Bewerbungsdesignsystem:

- gleiche blaue Markenfarbe
- gleicher Hintergrund
- gleiche Rand-/Rahmenlogik
- gleiche Typografierichtung
- grosse Stellenbezeichnung unten links
- Signatur-/Abschlussbereich
- reduzierte, moderne einseitige Gestaltung
- konsistente visuelle Sprache zwischen CV und Motivationsschreiben

In Phase 1 muss noch kein kompletter Motivationsschreiben-Autopilot gebaut werden. Aber:

- Design Tokens sollen CV und spätere Motivationsschreiben gemeinsam nutzen können.
- Architektur soll einen zukünftigen `cover-letter` Renderer ermöglichen.
- Optional darf ein statisches `cover-letter-demo.html` als Proof of Concept erstellt werden.

## Bilder

- `bg_img.jpeg`
- `profile_img.png`

`bg_img.jpeg` ist das vollflächige Holz-Hintergrundbild.

`profile_img.png` ist das Profilbild:

- kreisförmig zuschneiden
- Gesicht korrekt zentrieren
- nicht verzerren
- optional feiner weisser/blauer Rand
- Alt-Text: `Porträt von Adam Dolinsky`

---

# 2. Technologiestack

Verwende vorzugsweise:

- Node.js LTS
- TypeScript
- HTML5
- CSS
- Playwright/Chromium
- Zod oder JSON Schema
- Vitest oder Node Test Runner
- `pdfjs-dist` oder ein anderes lokales Tool zur PDF-Textprüfung

Kein React notwendig, sofern Vanilla TypeScript einfacher und stabiler ist.

Keine Adobe-Abhängigkeit im Normalbetrieb.

---

# 3. Zielstruktur

```text
cv-autopilot/
├── assets/
│   ├── bg_img.jpeg
│   ├── profile_img.png
│   └── icons/
├── reference/
│   ├── cv/
│   │   ├── 2d_Lebenslauf_Adam-Dolinsky.pdf
│   │   └── 2b_Lebenslauf_Adam-Dolinsky_alt.pdf
│   ├── cover-letters/
│   │   ├── hep.pdf
│   │   ├── keystone-sda.pdf
│   │   ├── spe.pdf
│   │   └── zivi.pdf
│   └── linkedin/
│       └── Linkedin_Profil_Extrakt.pdf
├── data/
│   ├── public/
│   │   ├── cv.master.example.json
│   │   └── variants/
│   ├── private/
│   │   └── cv.master.json
│   ├── schema/
│   │   └── cv.schema.json
│   └── sources/
│       └── source-map.json
├── src/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── reset.css
│   │   ├── components.css
│   │   ├── cv.css
│   │   └── print.css
│   ├── templates/
│   │   ├── cv.ts
│   │   ├── page-one.ts
│   │   ├── page-two.ts
│   │   └── components/
│   ├── lib/
│   │   ├── load-data.ts
│   │   ├── merge-variant.ts
│   │   ├── validate-data.ts
│   │   ├── validate-facts.ts
│   │   ├── overflow-check.ts
│   │   ├── extract-pdf-text.ts
│   │   └── render-report.ts
│   └── types/
│       └── cv.ts
├── scripts/
│   ├── render.ts
│   ├── preview.ts
│   ├── validate.ts
│   └── compare-reference.ts
├── tests/
├── dist/
├── CODEX_TASK.md
├── README.md
├── .gitignore
├── package.json
└── tsconfig.json
```

Abweichungen sind erlaubt, wenn sie begründet und einfacher wartbar sind.

---

# 4. Datenmodell: Single Source of Truth

Alle sichtbaren Inhalte müssen datengetrieben sein. Keine Tätigkeitsbeschreibungen hart im HTML codieren.

## Stammdaten

```json
{
  "person": {
    "name": "Adam Dolinsky",
    "location": "3007 Bern",
    "email": "adam@dolinsky.ch",
    "portfolio": "https://dolinsky.ch",
    "linkedin": "https://linkedin.com/in/adam-dolinsky",
    "profileImage": "assets/profile_img.png"
  }
}
```

## Stabile IDs

Jede Erfahrung, Kompetenz, Tätigkeit und jedes Projekt erhält eine stabile ID.

```json
{
  "id": "fors-magazine-production",
  "text": "Eigenständige Produktion des Firmenmagazins «Gügg Grüggüü» mit drei Ausgaben pro Jahr",
  "shortText": "Eigenständige Produktion des Firmenmagazins «Gügg Grüggüü»",
  "tags": [
    "communication",
    "editorial",
    "print",
    "project-coordination"
  ],
  "evidenceLevel": "professional_core",
  "sources": [
    "cv-2d",
    "cv-2b",
    "linkedin-project-guegg"
  ],
  "priority": 95,
  "enabled": true
}
```

## Quellenbezug

Erstelle `source-map.json`, damit jeder wichtige Baustein auf mindestens eine Quelle zurückgeführt werden kann.

Beispiel:

```json
{
  "fors-magazine-production": {
    "sources": [
      {
        "document": "2d_Lebenslauf_Adam-Dolinsky.pdf",
        "location": "page 2"
      },
      {
        "document": "Linkedin_Profil_Extrakt.pdf",
        "location": "project: Gügg Grüggüü Magazine"
      }
    ]
  }
}
```

Der spätere AI-Agent darf nur verifizierte Bausteine verwenden.

---

# 5. Vier CV-Varianten

Implementiere folgende Override-Varianten:

## `general`

Für:

- vielseitige Mediamatiker-Stellen
- KMU-Allrounderrollen
- gemischte Marketing/Web/Content-Funktionen

## `communication-content`

Priorisieren:

- Magazin
- Newsletter
- Social Media
- Foto/Video
- Storytelling
- redaktionelle Arbeit
- Kampagnen
- CI/CD
- Livestreaming

## `administration-gever`

Priorisieren:

- ACTA NOVA
- Dokumentenmanagement
- Geschäftsvorgänge
- Qualitätssicherung
- Koordination
- MS Office
- OneNote
- Bundesverwaltung
- strukturierte Prozesse
- Projektassistenz/Sachbearbeitung

Marketing nur als Zusatznutzen darstellen.

## `cms-web-process`

Priorisieren:

- TYPO3
- WordPress
- Grav
- Magento
- HTML/CSS
- Webpflege
- Onlineshop
- Daten-/Contentpflege
- Zahlungsprozesse
- Webhoster
- Prozessdokumentation
- GitHub
- Wissensmanagement
- KI-gestützte Workflows

CLI:

```bash
npm run render -- --variant general
npm run render -- --variant administration-gever
```

---

# 6. Visueller Nachbau

## Seitenformat

```css
@page {
  size: A4;
  margin: 0;
}
```

```css
.cv-page {
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  break-after: page;
}
```

## Referenzmerkmale

- vollflächiger Holz-Hintergrund
- kräftiges Dunkel-/Mittelblau als Markenkern
- breiter blauer Innenrahmen
- weisse Inhaltsflächen
- grosse, markante Namenszeile
- Profilbild im Kreis
- klare Hierarchie
- kompakte, aber gut lesbare Bulletpoints
- Seitenzähler
- sehr ähnliche Raster-/Abstandslogik wie im 2d-PDF
- zweite Seite mit grosszügiger Berufserfahrung und kompaktem Bottom-Grid

## Schrift

Keine proprietären Fontdateien committen.

Nutze metrisch ähnliche, frei verfügbare oder System-Fallbacks:

- `Roboto Slab` für markante Überschriften
- `Montserrat`, `Arial`, sans-serif für Fliesstext/Labels
- optional `Avenir Next` als lokaler System-Fallback

Alle Typografieparameter in `tokens.css`.

## Design Tokens

Definiere zentral:

```css
:root {
  --brand-blue: ...;
  --brand-blue-dark: ...;
  --paper-white: ...;
  --text-primary: ...;
  --font-heading: ...;
  --font-body: ...;
  --page-width: 210mm;
  --page-height: 297mm;
}
```

Diese Tokens sollen später auch für Motivationsschreiben verwendet werden.

---

# 7. Modulare Komponenten

Mindestens:

- `CvPage`
- `ProfileHeader`
- `ContactBlock`
- `SummaryBlock`
- `SkillSection`
- `LanguageRow`
- `ExperienceItem`
- `ToolGrid`
- `ReferenceCard`
- `AvailabilityCard`
- `WorkloadCard`
- `PageCounter`
- `ExternalLink`
- `PreviewWarning`

Kein wichtiger Text darf als Bild gerendert werden.

---

# 8. Layout- und Überlaufregeln

Das System muss variable Inhalte robust verarbeiten.

Implementiere:

- maximale Bullet-Anzahl pro Erfahrung
- Textlängenbudgets
- Overflow-Erkennung
- Zwei-Seiten-Prüfung
- Warnungen bei zu langen Kurzprofilen
- Warnungen bei zu vielen Tools
- keine automatische starke Schriftverkleinerung
- keine dritte Seite

Beispiel `render-report.json`:

```json
{
  "success": false,
  "variant": "administration-gever",
  "pageCount": 2,
  "warnings": [
    "Summary exceeds 430 characters."
  ],
  "overflows": [
    {
      "elementId": "experience-kunz-kunath",
      "overflowPixels": 24,
      "suggestion": "Remove or shorten one bullet."
    }
  ]
}
```

Bei Overflow:

- Preview trotzdem erzeugen
- PDF optional als Debug-Ausgabe erzeugen
- Prozess mit Fehlercode beenden
- klare Meldung in Konsole und Report

---

# 9. ATS- und PDF-Anforderungen

- exakt zwei A4-Seiten
- Text markierbar
- Text suchbar
- klickbare Links
- keine Browser-Kopf-/Fusszeilen
- `printBackground: true`
- logische DOM-Reihenfolge
- semantische HTML-Struktur
- sinnvolle Überschriftenhierarchie
- Alt-Texte
- keine versteckten Keywordlisten
- keine wichtigen Inhalte als Bild

Automatischer Test:

1. fertiges PDF rendern,
2. Text extrahieren,
3. prüfen, ob Name, Kurzprofil, Erfahrungen und Tools vorkommen,
4. Reihenfolge grob validieren,
5. Seitenzahl prüfen.

---

# 10. Datenschutz

Das Repository ist öffentlich.

Darum:

- keine privaten Telefonnummern committen
- keine nicht öffentlichen Referenzdaten committen
- keine API-Schlüssel
- keine vollständigen privaten Bewerbungsunterlagen öffentlich ablegen, falls dies nicht bewusst gewünscht ist
- `data/private/` in `.gitignore`
- `.env` in `.gitignore`
- öffentlich nur `cv.master.example.json`
- echte Daten lokal in `data/private/cv.master.json`

Bei Referenzen in öffentlichen Beispieldaten:

```json
{
  "name": "Peter Stadelmann",
  "role": "ehem. CEO & Marketingleiter",
  "contact": "auf Anfrage"
}
```

Die realen Telefonnummern dürfen nur lokal liegen.

Wichtig: Die vorhandenen PDFs enthalten private Kontaktdaten. Vor einem Commit prüfen, ob das öffentliche Repository diese enthalten soll. Standardannahme: **nicht committen**.

---

# 11. Befehle

```bash
npm install
npm run dev
npm run validate
npm run test
npm run render -- --variant general
npm run render -- --variant communication-content
npm run render -- --variant administration-gever
npm run render -- --variant cms-web-process
```

Ausgabe:

```text
dist/
  cv-general-preview.html
  Lebenslauf_Adam-Dolinsky_general.pdf
  render-report-general.json
```

---

# 12. README

Dokumentiere:

- Installation
- benötigte Node-Version
- lokaler Start
- Render-Befehle
- Aufbau der Masterdaten
- Erstellen einer Variante
- Hinzufügen eines neuen Bulletpoints
- private vs. öffentliche Daten
- Umgang mit Overflow
- bekannte visuelle Abweichungen zur InDesign-Referenz
- geplante Phase 2: AI-gestützte Inseratanalyse

---

# 13. Entwicklungsphasen

## Phase 1 – Foundation

- Repo initialisieren
- TypeScript/Playwright
- Datenmodell
- Schema
- Assets
- A4-Rendering

## Phase 2 – Visual reproduction

- 2d-CV möglichst genau nachbauen
- Referenz-Screenshots erstellen
- Raster, Abstände, Farben und Typografie abstimmen

## Phase 3 – Data extraction

- Inhalte aus 2d übernehmen
- alte 2b-Inhalte als Reservepool erfassen
- LinkedIn-Skills normalisieren
- Quellenmapping erstellen

## Phase 4 – Variants

- vier Varianten
- Priorisierung
- Sichtbarkeit
- Textvarianten

## Phase 5 – Quality

- Overflow
- Page count
- PDF-Text
- Tests
- Render Report

## Phase 6 – Shared design system

- Design Tokens für spätere Motivationsschreiben
- optionales Cover-Letter-Demo
- Architektur dokumentieren

---

# 14. Akzeptanzkriterien

Der Task gilt als fertig, wenn:

1. `npm install` funktioniert.
2. `npm run render -- --variant general` ein PDF erzeugt.
3. PDF exakt zwei Seiten hat.
4. Design klar als Nachbau des 2d-CVs erkennbar ist.
5. Hintergrund und Profilbild korrekt sind.
6. Inhalte aus JSON geladen werden.
7. vier Varianten funktionieren.
8. Varianten Reihenfolge/Sichtbarkeit ändern können.
9. keine belegbaren Fakten erfunden werden.
10. Overflow erkannt wird.
11. PDF-Text extrahierbar ist.
12. keine Adobe-Software benötigt wird.
13. keine privaten Telefonnummern öffentlich committed werden.
14. Tests erfolgreich sind.
15. README vollständig ist.
16. Codex am Ende verbleibende Abweichungen dokumentiert.

---

# 15. Arbeitsweise für Codex

- Nicht direkt auf `main` entwickeln.
- Branch erstellen: `feature/modular-cv-framework`
- Zuerst Repo und Referenzdateien prüfen.
- Dann kurzen Plan erstellen.
- In kleinen Schritten implementieren.
- Nach jeder grösseren Änderung rendern und testen.
- Ausgabe visuell mit 2d vergleichen.
- Keine CV-Fakten ohne Quelle verändern.
- Keine LinkedIn-Skills automatisch überhöhen.
- Keine unnötige Framework-Komplexität.
- Logische Commits.
- Pull Request gegen `main`.

Am Ende liefern:

- PR-Link
- Architekturübersicht
- Screenshot/PNG beider CV-Seiten
- Beispiel-PDF
- Testresultate
- Render Report
- Liste visueller Abweichungen
- Vorschlag für Phase 2: automatische Stellenanalyse und CV-Anpassung

---

# 16. Nicht Teil von Phase 1

Noch nicht implementieren:

- automatisches Auslesen eines Stelleninserats mit OpenAI API
- automatisches Versenden von Bewerbungen
- automatische Generierung unbelegter CV-Texte
- Arbeitgeber-spezifische Anschreiben
- vollständige Web-App mit Benutzerkonten

Phase 1 ist ein robustes, lokales, modulares Dokument-Framework.
