# CV Autopilot Web-App – verbindlicher UI/UX-Bauplan

**Status:** freigegebene Produkt- und Designgrundlage für die erste Web-App-Implementierung  
**Ziel-URL:** `https://projects.dolinsky.ch/cv-autopilot`  
**Produktname:** `CV Autopilot`  
**Sprache:** vollständig Deutsch  
**Designrichtung:** stark vereinfachte, eigenständige Arbeitsoberfläche im Stil professioneller Adobe-Programme wie Photoshop, Premiere Pro und InDesign – ohne Adobe-Logos, proprietäre Assets oder eine pixelgenaue Kopie.

---

## 1. Produktziel

CV Autopilot ist keine öffentliche Marketing-Website und kein klassisches Bewerbungsportal. Die Web-App ist eine private Produktionsoberfläche für den bestehenden Bewerbungsworkflow.

Der Kernablauf lautet:

```text
Stelleninserat einfügen oder hochladen
        ↓
Angaben und Analyse prüfen
        ↓
CV, Motivationsschreiben, Mail und RAV-Recap kontrollieren
        ↓
Bewerbungspaket herunterladen
```

Die Oberfläche soll sich wie ein fokussiertes professionelles Werkzeug anfühlen. Die technische Komplexität der vorhandenen Generatoren bleibt im Hintergrund.

---

## 2. Verbindliche Produktprinzipien

1. **Direkter Einstieg:** Nach der Authentifizierung erscheint sofort die Eingabe für ein neues Stelleninserat. Kein Dashboard als Zwischenschritt.
2. **Eine primäre Aufgabe pro Bildschirm:** Keine überladenen Statistiken, Kartenlandschaften oder SaaS-Startseiten.
3. **Prüfen statt konfigurieren:** Das System erkennt möglichst viele Angaben selbst. Adam prüft nur Unsicherheiten und relevante Entscheidungen.
4. **Bestehende Generatoren bleiben autoritativ:** Die Web-App darf keine eigene CV-, Motivationsschreiben- oder RAV-Layoutlogik erfinden.
5. **Deutsch-only:** Keine gemischten englischen und deutschen UI-Bezeichnungen.
6. **Mobile zuerst mitgedacht:** Ab 320 Pixel ohne horizontales Scrollen; Desktop bleibt der produktivste Arbeitsmodus.
7. **Keine automatische Bewerbung:** Erzeugung und Download sind erlaubt, Versand nur nach späterer ausdrücklicher Implementierung und manueller Freigabe.
8. **Datenschutz vor Komfort:** Keine personenbezogenen Inhalte in Browser-Logs, Analyse-Tools oder öffentlichen Pfaden.

---

## 3. Informationsarchitektur

### Hauptbereiche

```text
/cv-autopilot/
├── Neue Bewerbung / Start
├── Arbeitsbereich einer Bewerbung
│   ├── Inserat
│   ├── Analyse
│   ├── CV
│   ├── Motivationsschreiben
│   ├── Mail
│   ├── RAV-Recap
│   └── Paket
└── Später: Bewerbungsarchiv und Einstellungen
```

### Für Phase 1 nicht Teil des Umfangs

- öffentliches Landingpage-Marketing
- Mehrbenutzerverwaltung
- Rollen und Berechtigungen
- komplexes Bewerbungs-CRM
- Statistiken und Erfolgsquoten
- freies Verschieben oder Gestalten von CV-Elementen
- echte KI- oder Renderer-Aufrufe
- echte Dateispeicherung
- eigener Passwort-Login
- automatische Webhost-Bereitstellung

---

## 4. Globale App-Shell

### Desktop ab 1024 px

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Obere Programmleiste                                                    │
├──────────┬───────────────────────────────────────────┬───────────────────┤
│ Prozess- │                                           │ Eigenschaften /   │
│ leiste   │               Arbeitsfläche               │ Review            │
│ links    │                                           │ rechts            │
├──────────┴───────────────────────────────────────────┴───────────────────┤
│ Statusleiste                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Dimensionen

- obere Programmleiste: `44px`
- linke Prozessleiste im Arbeitsbereich: `88px`
- rechtes Eigenschaften-Panel: `320px`, bei kleineren Desktops `280px`
- Statusleiste: `28px`
- minimaler Arbeitsflächenabstand: `24px`
- maximale Inhaltsbreite auf der Startseite: `920px`

### Obere Programmleiste

Links:

- schlichtes quadratisches App-Signet mit den Buchstaben `CV`
- Produktname `CV Autopilot`

Mitte, nur im Arbeitsbereich:

- aktueller Arbeitgeber
- aktuelle Stellenbezeichnung
- Trennung durch einen dezenten Punkt oder Slash

Rechts:

- Systemstatus, z. B. grüner Punkt + `System bereit`
- später Benutzer-/Session-Schaltfläche

Keine klassischen Menüs wie `Datei`, `Bearbeiten` oder `Fenster` in Phase 1.

---

## 5. Startseite – Neue Bewerbung

Die Startseite ist der wichtigste Bildschirm. Sie öffnet direkt nach der später vorgeschalteten Authentifizierung.

### Aufbau

```text
┌───────────────────────────────────────────────────────────────┐
│ Neue Bewerbung                                                │
│ Stelleninserat als Text einfügen oder als Datei hochladen.     │
│                                                               │
│ [ Text einfügen ] [ Datei hochladen ]                         │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Stelleninserat hier einfügen …                            │ │
│ │                                                           │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│                                 [ Bewerbung erstellen → ]     │
└───────────────────────────────────────────────────────────────┘
```

### Eingabemodi

#### Modus 1: Text einfügen

- standardmässig aktiv
- grosses Textfeld, Desktop mindestens `320px` hoch
- keine unnötigen Zusatzfelder
- Zeichenzähler nur dezent, z. B. `4’280 Zeichen`
- primärer Button bleibt deaktiviert, solange kein sinnvoller Text vorhanden ist

#### Modus 2: Datei hochladen

- Dropzone mit gestricheltem oder dezentem Rahmen
- Klick öffnet den nativen Datei-Dialog
- unterstützte Dateitypen in Phase 1 visuell aufführen:
  - PDF
  - DOCX
  - TXT
  - PNG
  - JPG / JPEG
- maximale Datei in der Mock-Oberfläche: `15 MB`
- ausgewählte Datei zeigt Dateiname, Dateityp, Grösse und Entfernen-Schaltfläche
- Drag-and-drop ist eine Ergänzung; der normale Datei-Button muss immer funktionieren

### Primäre Aktion

Beschriftung:

```text
Bewerbung erstellen
```

Optionaler Pfeil nach rechts. Keine Bezeichnung wie `AI starten`, `Autopilot ausführen` oder `Generieren` auf der Startseite.

### Verhalten im ersten Prototyp

Nach Klick wird ein simulierter Ablauf gezeigt:

1. `Inserat wird gelesen`
2. `Anforderungen werden analysiert`
3. `Passende CV-Variante wird gewählt`
4. `Bewerbungspaket wird vorbereitet`

Anschliessend öffnet sich der Demo-Arbeitsbereich. Die Simulation darf kurz sein und muss bei aktivierter Einstellung `prefers-reduced-motion` ohne unnötige Animation funktionieren.

---

## 6. Arbeitsbereich

### Linke Prozessleiste

Reihenfolge und Bezeichnungen sind verbindlich:

1. Inserat
2. Analyse
3. CV
4. Motivationsschreiben
5. Mail
6. RAV
7. Paket

Jeder Schritt besitzt:

- monochromes, eigenständiges Linien-Icon oder einfaches Inline-SVG
- kurze deutsche Beschriftung
- aktiven Zustand in Blau
- erledigten Zustand mit kleinem grünen Häkchen
- Review-Zustand mit gelbem Punkt
- nicht verfügbaren Zustand in reduziertem Kontrast

Die Leiste darf nicht wie eine nummerierte Checkout-Strecke aussehen, sondern wie eine vereinfachte Werkzeugleiste eines Desktop-Programms.

### Zentrale Arbeitsfläche

Die zentrale Fläche ist dunkler als die Panels. Je nach aktivem Schritt erscheint:

- Inserattext
- Analysezusammenfassung
- CV-Dokumentvorschau
- Motivationsschreiben-Vorschau
- Mailtext
- eingebetteter RAV-Recap
- Paketübersicht

#### Dokumentvorschau

- weisse A4-Seite mittig auf dunkler Arbeitsfläche
- dezenter Schatten und dünner Rand
- Seitennavigation unten: `‹ 1 / 2 ›`
- Zoomanzeige, z. B. `75 %`
- Aktionen: `Anpassen`, `100 %`
- im ersten Prototyp nur glaubwürdige Mock-Dokumente, keine neue echte CV-Layoutlogik

### Rechtes Eigenschaften-Panel

Obere Segmente:

- `Eigenschaften`
- `Review`

#### Eigenschaften

Anzeigen:

- Arbeitgeber
- Stellenbezeichnung
- Arbeitsort
- Pensum
- Kontaktperson
- Bewerbungsfrist
- empfohlene CV-Variante
- erkannte ATS-Begriffe

Werte werden in kompakten Feldern oder Property-Zeilen gezeigt. Normale Werte sind nicht permanent als grosse Formulare dargestellt. Erst `Bearbeiten` schaltet ein Feld in den Editiermodus.

#### Review

Nur echte Unsicherheiten anzeigen, zum Beispiel:

```text
Kontaktperson nicht eindeutig
Vermutet: Martina Probst
[ Übernehmen ] [ Bearbeiten ]
```

oder:

```text
Kompetenz nur indirekt ableitbar
Projektadministration
Grundlage: ACTA NOVA, Dokumentenverwaltung und Koordination
[ Übernehmen ] [ Ablehnen ]
```

Sichere, belegte Punkte erscheinen nicht als Review-Karten. Sie erhalten höchstens einen kleinen bestätigten Status.

### Statusleiste

Mögliche Informationen:

- `CV geprüft`
- `Motivationsschreiben geprüft`
- `Mail erstellt`
- `1 Review offen`
- rechts: `Paket noch nicht freigegeben`

Die Statusleiste bleibt kompakt und dient nicht als zweite Navigation.

---

## 7. Demo-Inhalt für Phase 1

Für den visuellen Prototyp wird eine fiktive, aber realistische Bewerbung verwendet:

- Arbeitgeber: `Bundesamt für digitale Dienste`
- Stelle: `Fachspezialist Digitale Kommunikation`
- Ort: `Bern`
- Pensum: `80–100 %`
- Kontaktperson: `Martina Probst`
- CV-Variante: `Digital Communication & Content`

Stärkste Matches:

- CMS und Webpflege
- digitale Kommunikation
- Content-Produktion
- Prozessdokumentation
- Adobe Creative Cloud

Review-Hinweise:

- Kontaktperson aus Inserat ableiten
- Projektadministration als vertretbare Übertragung prüfen

Keine echten personenbezogenen Referenzkontakte in Demo-Daten.

---

## 8. Mobile Verhalten

### Breakpoints

- `320–619px`: Smartphone
- `620–899px`: grosses Smartphone / kleines Tablet
- `900–1023px`: Tablet / kompakter Desktop
- ab `1024px`: vollständiger Desktop-Arbeitsbereich

### Smartphone – Startseite

- obere Leiste `48px`
- Eingabemodi als breite Segment-Schaltflächen
- Textfeld mindestens `300px` hoch
- Datei-Dropzone vollständig klickbar
- primäre Aktion am unteren Rand gut erreichbar; sie darf bei längeren Inhalten sticky werden
- Touch-Ziele mindestens `44 × 44px`

### Smartphone – Arbeitsbereich

Keine drei Spalten zusammendrücken.

- zentrale Arbeitsfläche nimmt die volle Breite ein
- untere Navigation mit maximal fünf sichtbaren Gruppen:
  - Inserat
  - Analyse
  - Dokumente
  - Review
  - Paket
- `Dokumente` öffnet CV, Motivationsschreiben, Mail und RAV über eine sekundäre Auswahl
- Eigenschaften und Review öffnen als Bottom Sheet
- Dokumentvorschau wird auf Breite eingepasst
- keine horizontale Seitenbewegung der gesamten App

### Tablet

- linke Prozessleiste bleibt sichtbar
- rechtes Eigenschaften-Panel kann ein- und ausgeklappt werden

---

## 9. Visuelle Sprache

### Farb-Tokens

```css
:root {
  --app-bg: #1e1e1e;
  --canvas-bg: #181818;
  --surface: #252525;
  --surface-raised: #2d2d2d;
  --surface-hover: #343434;
  --border: #454545;
  --border-subtle: #383838;
  --text: #f2f2f2;
  --text-muted: #b5b5b5;
  --text-disabled: #747474;
  --accent: #1473e6;
  --accent-hover: #0d66d0;
  --accent-active: #095aba;
  --cv-blue: #15519f;
  --success: #2d9d5b;
  --warning: #e5a000;
  --danger: #d7373f;
  --focus: #4b9cff;
}
```

### Typografie

Keine proprietären Adobe-Fontdateien verwenden oder einchecken.

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
```

Richtwerte:

- App-Titel: `14px / 600`
- Screen-Titel: `24–28px / 600`
- Panel-Titel: `12px / 600`, optional in Grossbuchstaben mit leichter Laufweite
- Standardtext: `14px`
- Metadaten: `12px`

### Formen

- kleine Controls: Radius `4px`
- Inputs und Standardbuttons: Radius `6px`
- grössere Startkarten / Dropzone: Radius `10px`
- keine extremen Pill-Buttons
- Schatten sparsam und nur für Dokumentseiten oder überlagerte Panels

### Icons

- einfache, konsistente Linien-Icons
- keine Adobe-Produktlogos
- keine unlizenzierte Kopie der Adobe-Icon-Sets
- Icons nie als einzige Erklärung wichtiger Aktionen; Tooltip oder Text ergänzen

---

## 10. Interaktionszustände

Jede interaktive Komponente benötigt:

- Standard
- Hover
- Active
- Focus-visible
- Disabled
- Loading, falls relevant
- Success oder Error, falls relevant

### Fokus

- sichtbarer Fokusrahmen mit `--focus`
- vollständige Bedienung per Tastatur
- kein Entfernen von Outline ohne gleichwertigen Ersatz

### Upload-Fehler

Verbindliche Beispiele:

- `Dieser Dateityp wird nicht unterstützt.`
- `Die Datei ist grösser als 15 MB.`
- `Die Datei konnte nicht gelesen werden.`

### Leerer Zustand

Der primäre Button ist deaktiviert. Kein modaler Fehler nach Klick auf einen erkennbar leeren Zustand.

---

## 11. Barrierefreiheit

- semantische Überschriftenreihenfolge
- echte Buttons und Inputs, keine klickbaren `div`
- zugängliche Labels für Datei-Input und Textfeld
- Statusmeldungen über geeignete Live-Regionen
- ausreichende Kontraste im Dark UI
- `prefers-reduced-motion` beachten
- Drag-and-drop nie als einzige Upload-Möglichkeit
- keine Information ausschliesslich über Farbe vermitteln
- bei 200 % Browser-Zoom weiterhin bedienbar

---

## 12. Technische UI-Architektur

Die erste Implementierung soll als eigenständige Next.js-App unter folgendem Ordner entstehen:

```text
apps/web/
```

Empfohlene Struktur:

```text
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AppHeader.tsx
│   ├── JobInput.tsx
│   ├── FileDropzone.tsx
│   ├── AnalysisProgress.tsx
│   ├── WorkspaceShell.tsx
│   ├── ProcessRail.tsx
│   ├── DocumentCanvas.tsx
│   ├── PropertiesPanel.tsx
│   ├── ReviewCard.tsx
│   ├── StatusBar.tsx
│   ├── MobileNavigation.tsx
│   └── BottomSheet.tsx
├── data/
│   └── demo-application.ts
├── lib/
│   └── ui-types.ts
├── public/
├── tests/
├── next.config.mjs
├── package.json
└── tsconfig.json
```

### Routing und Hosting-Vorbereitung

- Zielpfad ist verbindlich `/cv-autopilot`.
- Next.js `basePath` auf `/cv-autopilot` vorbereiten.
- Keine hart codierten Asset-Links wie `/icon.svg`, die den Base Path umgehen.
- App für einen späteren Node-/Standalone-Betrieb vorbereiten.
- Keine Secrets im Frontend.
- Keine echte Authentifizierung im ersten UI-Prototyp. Später wird die gesamte Route bevorzugt infrastrukturseitig geschützt.

### Trennung vom bestehenden Produktionssystem

- vorhandene CV-, Motivationsschreiben-, Mail- und RAV-Module nicht verändern
- keine produktiven Daten aus `data/private/` in Client-Komponenten importieren
- im ersten Prototyp ausschliesslich neutrale Demo-Daten verwenden
- keine vorhandenen Render-Tests abschwächen
- die Root-Package-Struktur möglichst nicht verändern; `apps/web` besitzt zunächst ein eigenes `package.json`

---

## 13. Bildschirmzustände für Phase 1

Mindestens implementieren:

1. Startseite, Textmodus leer
2. Startseite, Textmodus befüllt
3. Startseite, Dateimodus leer
4. Startseite, Datei ausgewählt
5. Upload-Fehler
6. simulierter Analysefortschritt
7. Desktop-Arbeitsbereich – CV aktiv
8. Desktop-Arbeitsbereich – Analyse aktiv
9. Desktop-Arbeitsbereich – Review offen
10. Mobile Startseite
11. Mobile Arbeitsbereich
12. Mobile Bottom Sheet

---

## 14. Qualitäts- und Abnahmekriterien

### Funktional

- Textmodus und Dateimodus lassen sich zuverlässig wechseln.
- Eingaben gehen beim Wechsel nicht unbeabsichtigt verloren.
- primäre Aktion ist bei leerer Eingabe deaktiviert.
- Demo-Ablauf öffnet den Arbeitsbereich.
- alle sieben Desktop-Prozessschritte sind auswählbar.
- Eigenschaften- und Review-Segment funktionieren.
- mobile Bottom-Sheet-Interaktion funktioniert.

### Visuell

- klare professionelle Dark-UI ohne Marketing-Look
- Adobe-inspiriert, aber eigenständig
- keine grossen Farbverläufe, Glassmorphism- oder Neon-Effekte
- zentrale Dokumentseite wirkt wie eine Arbeitsfläche, nicht wie eine Website-Karte
- Blau nur für primäre Aktionen und aktiven Zustand
- Grün, Gelb und Rot nur semantisch

### Responsive

Testbreiten:

- 320 px
- 390 px
- 620 px
- 760 px
- 1024 px
- 1440 px

Auf keiner Breite horizontales Scrollen der gesamten App.

### Technisch

- TypeScript ohne Fehler
- Linting ohne Fehler
- Produktions-Build erfolgreich
- Komponenten sinnvoll aufgeteilt
- keine unnötig grosse UI-Bibliothek
- keine proprietären Font- oder Adobe-Dateien
- keine echte private Daten im Bundle
- bestehende Root-Tests bleiben unberührt

---

## 15. Sicherheits- und Datenschutzbedingungen für die spätere Produktivphase

Vor einer Verbindung mit dem Webhost müssen mindestens erfüllt sein:

1. Das Repository mit realen personenbezogenen Daten ist privat.
2. API-Schlüssel und Hosting-Zugänge liegen nur in GitHub Secrets oder Server-Umgebungsvariablen.
3. Die Route `/cv-autopilot` wird vollständig authentifiziert geschützt.
4. Bewerbungsdateien werden nicht in öffentlich direkt adressierbaren Verzeichnissen gespeichert.
5. Uploads werden serverseitig auf Typ, Grösse und Inhalt geprüft.
6. Logs enthalten keine vollständigen Inserate, Lebensläufe oder Kontaktdaten.
7. Downloads erfolgen nur über authentifizierte Endpunkte.

---

## 16. Geplante Umsetzungsphasen

### Phase 1 – visueller Prototyp

- Next.js-App in `apps/web`
- Startseite mit Text und Datei
- simulierte Analyse
- Adobe-inspirierter Arbeitsbereich
- Demo-Daten
- Desktop und Mobile
- keine reale Generator-Anbindung

### Phase 2 – echte Bewerbungsinstanz

- Stelleninserat serverseitig entgegennehmen
- bestehende Application-Context-Struktur nutzen
- Bewerbungsakte erstellen
- Status und Review aus realen Reports anzeigen

### Phase 3 – Generatoren anbinden

- CV
- Motivationsschreiben
- Mail
- RAV-Recap
- Paketdownload

### Phase 4 – Authentifizierung und Hosting

- Route schützen
- GitHub-Secrets konfigurieren
- automatisches Deployment
- Gesundheitsprüfung und Rollback
- Entwicklungs- und Produktionsworkflow festlegen

---

## 17. Verbindlicher Leitsatz

> CV Autopilot zeigt vorne nur die wenigen Entscheidungen, die Adam wirklich treffen muss. Alles andere bleibt eine geprüfte, deterministische Produktionspipeline im Hintergrund.
