# Codex Prompt 01 – CV Autopilot UI-Prototyp

Den folgenden Prompt vollständig und unverändert als ersten Codex-Auftrag verwenden, nachdem der UI/UX-Bauplan auf dem gewählten Arbeitsbranch verfügbar ist.

---

## Prompt

Arbeite im Repository `addocode/cv-autopilot` auf einem neuen Branch, ausgehend vom aktuellen `main`. Erstelle einen Pull Request, aber merge ihn nicht selbst.

### Verbindliche Grundlagen

Lies vor jeder Änderung vollständig:

1. `docs/web-app/UI_UX_BLUEPRINT.md`
2. `README.md`
3. `modules/motivation-letter/CHAT_AND_WEBAPP_CONTRACT.md`
4. `modules/rav-recap/CHAT_AND_WEBAPP_CONTRACT.md`
5. die vorhandene Root-`package.json`
6. die vorhandene `.gitignore`

Der UI/UX-Bauplan ist für Layout, Texte, Komponenten, Breakpoints, Zustände und Abnahmekriterien verbindlich. Erfinde keine alternative SaaS-, Dashboard- oder Marketing-Oberfläche.

### Ziel dieses Auftrags

Implementiere ausschliesslich **Phase 1: den funktionsfähigen visuellen Frontend-Prototyp** der privaten Web-App `CV Autopilot`.

Die Ziel-URL ist später:

```text
https://projects.dolinsky.ch/cv-autopilot
```

Die App muss deshalb technisch unter dem Next.js-Base-Path `/cv-autopilot` funktionieren.

### Harte Grenzen

- Verändere die vorhandenen CV-, Motivationsschreiben-, Mail-, RAV- und Application-Workflow-Module nicht.
- Verändere keine produktiven CV-Daten unter `data/private/`.
- Importiere keine privaten Daten in den Browser-Bundle.
- Schwäche keine vorhandenen Tests oder Qualitätsgates ab.
- Implementiere noch keine echte KI, keine echten Renderer-Aufrufe und keine echte Speicherung.
- Implementiere noch keine eigene Passwort- oder Login-Lösung.
- Implementiere noch kein Hosting- oder Deployment-Workflow.
- Verwende keine Adobe-Logos, Adobe-Produkticons, proprietären Adobe-Assets oder proprietäre Fontdateien.
- Erstelle keine alternative CV-, Motivationsschreiben- oder RAV-Dokumentgestaltung.
- Ändere die Root-Abhängigkeiten und Root-Skripte nur, wenn dies zwingend nötig ist. Bevorzugt bleibt die Web-App als selbstständiges Paket unter `apps/web`.

### Technische Grundstruktur

Erstelle eine eigenständige Next.js-App mit TypeScript unter:

```text
apps/web/
```

Sie besitzt ein eigenes `package.json`, eine eigene Lockdatei, eigene TypeScript-/Lint-/Test-Konfigurationen und beeinflusst die bestehende Root-Pipeline nicht.

Verwende die aktuelle stabile Next.js-Version, die Node.js 22 unterstützt, und pinne die tatsächlich installierten Versionen über die Lockdatei. Dokumentiere die gewählten Versionen im Implementierungsbericht.

Konfiguriere mindestens:

```js
basePath: '/cv-autopilot'
```

Bereite die App für einen späteren Node-/Standalone-Betrieb vor. Verwende keine hart codierten Root-Assetpfade, welche den Base Path umgehen.

### Erwartete Dateistruktur

Orientiere dich an dieser Struktur; kleine sachlich begründete Abweichungen sind erlaubt:

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
├── tests/
├── next.config.mjs
├── package.json
└── tsconfig.json
```

### Zu implementierende Benutzerführung

#### 1. Direkte Startseite

Nach dem Öffnen erscheint sofort `Neue Bewerbung`.

Biete zwei gleichwertige Eingabemodi:

- `Text einfügen`
- `Datei hochladen`

Textmodus:

- grosses Textfeld
- deutscher Placeholder
- dezenter Zeichenzähler
- Eingabe bleibt beim Wechsel der Modi erhalten

Dateimodus:

- zugänglicher Datei-Input
- Drag-and-drop zusätzlich
- akzeptierte Typen: PDF, DOCX, TXT, PNG, JPG, JPEG
- maximale Mock-Grösse 15 MB
- Dateiname, Typ und Grösse anzeigen
- Datei entfernen können
- verständliche deutsche Fehlermeldungen

Der primäre Button lautet exakt:

```text
Bewerbung erstellen
```

Er ist bei leerem oder ungültigem Zustand deaktiviert.

#### 2. Simulierter Analysefortschritt

Nach gültigem Absenden zeige kurz diese Schritte:

1. `Inserat wird gelesen`
2. `Anforderungen werden analysiert`
3. `Passende CV-Variante wird gewählt`
4. `Bewerbungspaket wird vorbereitet`

Danach öffnet sich der Demo-Arbeitsbereich. Bei `prefers-reduced-motion` keine unnötigen Übergangsanimationen.

#### 3. Desktop-Arbeitsbereich

Implementiere:

- obere Programmleiste
- linke Prozessleiste
- zentrale Arbeitsfläche
- rechtes Eigenschaften-/Review-Panel
- kompakte Statusleiste

Die Prozessleiste enthält exakt:

1. Inserat
2. Analyse
3. CV
4. Motivationsschreiben
5. Mail
6. RAV
7. Paket

Alle Schritte müssen anklickbar sein und glaubwürdige Demo-Inhalte zeigen.

Die zentrale Dokumentvorschau zeigt eine neutrale Mock-A4-Seite. Sie darf nicht als neue produktive CV-Vorlage missverstanden werden. Zeige Seitennavigation und Zoom-Steuerung als UI-Prototyp.

Das rechte Panel besitzt die Segmente:

- `Eigenschaften`
- `Review`

#### 4. Mobile Arbeitsoberfläche

Unter 620 px:

- keine drei Spalten
- volle Arbeitsfläche
- untere Hauptnavigation mit:
  - Inserat
  - Analyse
  - Dokumente
  - Review
  - Paket
- Dokumente bieten eine sekundäre Auswahl für CV, Motivationsschreiben, Mail und RAV
- Eigenschaften und Review als zugängliches Bottom Sheet
- keine horizontale Scrollbar der Gesamt-App

Zwischen 620 und 1023 px:

- linke Prozessleiste kann sichtbar bleiben
- rechtes Panel ein-/ausklappbar

### Demo-Daten

Verwende ausschliesslich diese neutralen Demo-Daten:

```text
Arbeitgeber: Bundesamt für digitale Dienste
Stelle: Fachspezialist Digitale Kommunikation
Ort: Bern
Pensum: 80–100 %
Kontaktperson: Martina Probst
CV-Variante: Digital Communication & Content
```

Stärkste Matches:

- CMS und Webpflege
- digitale Kommunikation
- Content-Produktion
- Prozessdokumentation
- Adobe Creative Cloud

Review-Punkte:

- Kontaktperson aus Inserat ableiten
- Projektadministration als vertretbare Übertragung prüfen

Verwende keine echten Referenzkontakte, Telefonnummern, Adressen oder privaten Bewerbungsdaten.

### Direkte Demo-Zustände

Unterstütze für Entwicklung, Tests und Screenshots Query-Parameter oder eine gleichwertige deterministische Lösung:

```text
?demo=start
?demo=workspace
?demo=review
```

Ohne Query-Parameter startet die App normal auf der Eingabeseite.

### Design

Setze die Design-Tokens und visuellen Regeln aus `UI_UX_BLUEPRINT.md` um.

Wichtige Merkmale:

- dunkle professionelle Arbeitsoberfläche
- Adobe-inspiriert, aber eigenständig
- keine Marketing-Hero-Fläche
- keine Glassmorphism-, Neon- oder übermässigen Gradient-Effekte
- feine Trennlinien
- kompakte Bedienelemente
- Weiss/Grau für Inhalte
- Blau für aktive/primäre Aktionen
- Grün, Gelb und Rot nur semantisch
- abgerundete Controls, aber keine übertriebenen Pill-Buttons
- Dokumentseite weiss und mittig auf dunkler Canvas-Fläche

Verwende den vorgegebenen System-Fontstack. Keine Fontdateien hinzufügen.

Icons als konsistente einfache Inline-SVGs oder eine sehr kleine, klar lizenzierte Icon-Lösung. Keine grosse UI-Komponentenbibliothek einführen. Dokumentiere jede neue Abhängigkeit.

### Barrierefreiheit

Mindestens:

- semantisches HTML
- echte Buttons, Labels und Inputs
- vollständige Tastaturbedienung
- sichtbare `focus-visible`-Zustände
- Statusmeldungen zugänglich
- Drag-and-drop nicht als einzige Upload-Möglichkeit
- keine Information nur über Farbe
- ausreichender Kontrast
- Reduced Motion berücksichtigen
- sinnvolle ARIA-Attribute für Segmente, Bottom Sheet und Fortschritt

### Tests und Qualitätsprüfung

Führe mindestens aus und dokumentiere die echten Ergebnisse:

```bash
npm --prefix apps/web install --no-audit --no-fund
npm --prefix apps/web run lint
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

Füge automatisierte UI-Tests für die wichtigsten Zustände hinzu. Teste nach Möglichkeit mit Browser-E2E:

- Text-/Dateimodus wechseln
- leerer Submit deaktiviert
- gültiger Text öffnet den Fortschritt und Arbeitsbereich
- ungültiger Dateityp zeigt Fehler
- Prozessnavigation funktioniert
- Eigenschaften/Review wechseln
- mobiles Bottom Sheet öffnet und schliesst
- auf 320, 390, 620, 760, 1024 und 1440 px keine horizontale Gesamtseiten-Scrollbar

Falls Chromium oder eine Paketquelle im Codex-Umfeld technisch blockiert ist, dokumentiere dies ehrlich. Entferne oder umgehe deswegen keine Tests. Stelle sicher, dass die Tests in einer normalen CI-Umgebung ausführbar bleiben.

### Visuelle Kontrolle

Erzeuge nach Möglichkeit lokale Screenshots oder Testartefakte für:

- Startseite Desktop 1440 px
- Arbeitsbereich Desktop 1440 px
- Review Desktop 1440 px
- Startseite Mobile 390 px
- Arbeitsbereich Mobile 390 px

Committe keine unnötig grossen Binärdateien. Nutze sie für die Review-Dokumentation oder als CI-Artefakte.

### Dokumentation

Erstelle:

```text
apps/web/README.md
docs/web-app/IMPLEMENTATION_REPORT_01.md
```

Der Implementierungsbericht enthält:

- tatsächlich umgesetzte Komponenten und Zustände
- verwendete Framework-/Paketversionen
- neue Abhängigkeiten mit Begründung
- ausgeführte Befehle und echte Resultate
- bekannte Abweichungen vom Bauplan
- noch nicht umgesetzte Punkte
- Screenshots/Testartefakte, sofern vorhanden
- klare Bestätigung, dass keine private Produktionsdaten in die Web-App gelangt sind

### Pull Request

Erstelle einen übersichtlichen PR mit:

- Zusammenfassung
- Screens/Flows
- Testresultaten
- bekannten Einschränkungen
- Hinweis, dass echte Generatorintegration, Authentifizierung und Deployment bewusst noch nicht Bestandteil sind

Merge nicht selbst.

### Definition of Done

Der Auftrag ist erst abgeschlossen, wenn:

- `apps/web` als eigenständige Next.js-App vorhanden ist
- die App lokal unter `/cv-autopilot` funktioniert
- Startseite, Fortschritt, Desktop-Workspace und Mobile-Workspace bedienbar sind
- alle im Bauplan geforderten Kernzustände vorhanden sind
- keine echten privaten Daten im Client-Bundle liegen
- bestehende Produktionsmodule unverändert bleiben
- Lint, Typecheck und Build erfolgreich sind oder ein echter externer Blocker transparent dokumentiert ist
- der PR mit Implementierungsbericht bereitsteht

---

## Ende des Prompts
