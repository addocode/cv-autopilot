# ACTIVE CODEX TASK — Review Runde 52

## Arbeitskontext

Arbeite ausschliesslich auf dem bestehenden Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch und keinen neuen Pull Request.
- Rufe `make_pr` nicht auf.
- Merge weder PR #6 noch PR #5.
- Verändere das finale CV-Design nicht.
- Diese Datei ersetzt alle früheren aktiven Review-Aufträge.

## Pflichtprüfung

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 52` beginnt.
4. Bei Abweichung nichts verändern und ausschliesslich `STALE SNAPSHOT` melden.

---

# 1. Ausgangslage

Workflow Run 60 für den neuen Bewerbungsarchiv-Workflow ist grün. Der kontrollierte Fixture-Test besteht. Vor einem echten Stelleninserat müssen aber der Datenvertrag zwischen `scripts/create-application.mjs` und `scripts/render.mjs`, die Produktionspersonalisierung und die dauerhafte Exportierbarkeit korrigiert werden.

Die sichtbaren neutralen CV-Artefakte, vier Varianten, Layout, Fonts, BM-Logik, adaptive Füllung, ATS- und PDF-Gates sind eingefroren.

---

# 2. Exakter Datenvertrag für `application-context.json`

Der aktuell erzeugte Kontext verwendet für `jobAd.workload` und `jobAd.start` einfache Strings und für `jobAd.contact` inkompatible Feldnamen. Der Renderer erwartet strukturierte Objekte.

Erzeuge in `01_application-context.json` verbindlich:

```json
{
  "schemaVersion": 2,
  "applicationId": "...",
  "markdownFile": "00_stelleninserat.md",
  "selectedVariant": "administration-gever",
  "jobAd": {
    "rawText": "vollständiger bereinigter Inseratstext",
    "sourceId": "job-ad:<applicationId>",
    "workload": {
      "kind": "single|range|full-time|unknown",
      "minPercent": 80,
      "maxPercent": 80,
      "sourceText": "Pensum 80 %",
      "confidence": 0.99
    },
    "start": {
      "kind": "date|immediately|negotiable|unknown",
      "isoDate": "2026-09-01",
      "sourceText": "Stellenantritt per 1. September 2026",
      "confidence": 0.99
    },
    "contact": {
      "fullName": "Anna Meier",
      "firstName": "Anna",
      "lastName": "Meier",
      "explicitSalutation": "Frau",
      "role": "HR-Leitung",
      "addressMode": "formal|informal|neutral|unknown",
      "sourceText": "Ansprechperson: Frau Anna Meier, HR-Leitung",
      "confidence": 0.99,
      "isApplicationContact": true
    }
  }
}
```

Regeln:

- Unbekannte Werte bleiben leer beziehungsweise `unknown`; nichts raten.
- `confidence` ist immer numerisch zwischen 0 und 1.
- `isApplicationContact` ist nur bei einer explizit als Bewerbungskontakt erkennbaren Person `true`.
- `rawText` enthält den vollständigen Originalinhalt normalisiert auf LF, nicht eine Zusammenfassung.
- Top-Level-Spiegelfelder dürfen für die Markdown-Erzeugung bestehen, aber der Renderer verwendet ausschliesslich `jobAd` im obigen Schema.

---

# 3. Robuste Eingabe für echte Stelleninserate

Der aktuelle Parser erkennt nur Zeilen mit exakt `Arbeitgeber:`, `Stellenbezeichnung:` usw. Das reicht für Fixtures, aber nicht für beliebige echte Inserate.

Implementiere zwei Eingabemodi:

## 3.1 Kontrollierter strukturierter Modus

Neue optionale CLI-Option:

```bash
--extracted-context path/to/extracted-context.json
```

Diese Datei enthält die bereits aus dem echten Inserat extrahierten Eckdaten im Schema aus Abschnitt 2. Der vollständige Originaltext kommt weiterhin unverändert aus `--job-ad` und wird archiviert.

Dieser Modus hat Vorrang vor Heuristiken und ist der verbindliche Modus für den ersten Live-Test.

Validiere mit Zod oder einer gleichwertigen expliziten Prüfung:

- Arbeitgeber
- Stellenbezeichnung
- selectedVariant
- jobAd.rawText
- workload/start/contact-Struktur
- tasks, requirements, systems, ATS terms

Bei ungültigen Daten: klarer Fehler, kein halbfertiges Dossier.

## 3.2 Heuristischer Fallback

Ohne `--extracted-context` darf weiterhin heuristisch extrahiert werden. Erweitere die Erkennung mindestens für:

- Pensum `80%`, `80–100 %`, Vollzeit
- Eintritt `per sofort`, `nach Vereinbarung`, ausgeschriebene oder numerische Daten
- Ansprechperson mit Frau/Herr, Vor-/Nachname und Funktion
- Arbeitsort
- Arbeitgeber und Stellentitel aus üblichen ersten Überschriften

Unsichere Werte nicht erfinden. Im Markdown unter `Offene Punkte und Unsicherheiten` ausweisen.

---

# 4. Personalisierung muss im echten PDF funktionieren

Der Renderer integriert das Greeting derzeit nur bei `previewOnly`. Korrigiere dies:

- Bei vorhandenem sicherem `applicationContext.jobAd.contact` wird die Anrede auch im echten anwendungsspezifischen PDF nahtlos in `#summary-text` integriert.
- Ohne Anwendungskontext bleibt der neutrale Produktions-CV unverändert und ohne Greeting.
- Bei unsicherer Person entfällt das Greeting vollständig.
- Kurzprofil bleibt vier Zeilen.
- Pensum und Eintritt verwenden die strukturierten Werte aus Abschnitt 2.

Verbindliche formelle Live-Fixture:

```text
Guten Tag Frau Meier, ich bin ...
80 % gemäss Inserat, flexibel nach Absprache
Per 01.09.2026 gemäss Inserat, alternativ nach Vereinbarung
```

Teste nicht nur Preview-HTML, sondern mindestens ein echtes fixture-spezifisches PDF/Render-Report mit Playwright, Poppler Raw und Poppler Default.

---

# 5. Bewerbungsakte dauerhaft exportierbar machen

`applications/` bleibt aus Datenschutzgründen git-ignored. Ein Codex-/CI-Dateisystem kann jedoch temporär sein. Jeder echte Lauf muss deshalb ein transportables Exportpaket erzeugen.

Erzeuge zusätzlich im Projektroot oder unter `exports/`:

```text
exports/<applicationId>.tar.gz
```

Das Paket enthält den vollständigen Bewerbungsordner inklusive:

- `00_stelleninserat.md`
- `01_application-context.json`
- `02_cv_<variant>.pdf`
- `03_cv_<variant>-preview.html`
- `04_manifest.json`
- Originaldatei des Inserats
- `05_render-report.json`
- optional später Motivationsschreiben-Dateien

Verwende unter Linux deterministisch `tar` mit stabiler Dateireihenfolge und ohne absolute Pfade. Falls `tar` nicht verfügbar ist, brich mit verständlicher Fehlermeldung ab; kein stiller Erfolg ohne Export.

Ignoriere auch `exports/` in Git. Die CLI-Ausgabe muss den genauen Ordner- und Archivpfad nennen.

Das Manifest erhält zusätzlich:

```json
{
  "archive": {
    "path": "exports/<applicationId>.tar.gz",
    "sha256": "..."
  },
  "validation": {
    "rendererSuccess": true,
    "atsSuccess": true,
    "pageCount": 2,
    "applicationContextContractValid": true
  }
}
```

---

# 6. Render-Report archivieren

Kopiere den tatsächlich zum applicationId-spezifischen CV gehörenden Render-Report als:

```text
05_render-report.json
```

in die Bewerbungsakte.

Prüfe darin mindestens:

- `success === true`
- `pageCount === 2`
- `overflows: []`
- `collisions: []`
- `warnings: []`
- ATS missing terms leer
- jobAdPersonalization mit den erwarteten Werten
- selectedVariant stimmt mit Kontext und Dateiname überein

Bei einem fehlgeschlagenen Report darf kein erfolgreiches Manifest und kein finaler Export erzeugt werden.

---

# 7. Belegmatrix ehrlich und nutzbar

Die aktuelle Belegmatrix schreibt pauschal `Profilabgleich erforderlich` und `defensible_inference`. Das ist für ein Gesprächsdossier zu schwach.

Im strukturierten Modus muss `--extracted-context` pro Anforderung optional enthalten:

```json
{
  "text": "Erfahrung mit GEVER",
  "classification": "must",
  "profileEvidence": "ACTA NOVA und digitale Geschäftsvorgangsbearbeitung in der Rekrutenschule",
  "sourceIds": ["cv-2d-p2"],
  "evidenceStatus": "verified",
  "cvUsage": "Kurzprofil und Skillset Technik & Systeme"
}
```

Erlaubte Werte:

- `verified`
- `defensible_inference`
- `unsupported_rejected`

Keine pauschale Behauptung. `unsupported_rejected` wird sichtbar dokumentiert und nicht in den CV übernommen.

---

# 8. CI muss den neuen Workflow wirklich ausführen

Der bestehende GitHub-Workflow führt aktuell `test:data` und `test:render` aus, aber nicht zwingend `tests/application-workflow.test.mjs`.

Ergänze einen expliziten CI-Schritt:

```bash
node --test tests/application-workflow.test.mjs
```

oder ein eigenes Script:

```json
"test:application": "node --test tests/application-workflow.test.mjs"
```

und führe es im Workflow aus.

Zusätzlich ein echter Renderer-Integrationstest ohne `--skip-render-for-tests`, der:

- eine vollständig fiktive strukturierte Fixture verwendet
- PDF, Preview, Markdown, JSON, Report, Manifest und `.tar.gz` erzeugt
- neutrale Produktionsartefakte unverändert lässt
- alle Hashes prüft
- idempotent wiederholbar ist

Keine echten Stellen- oder Personendaten in öffentliche Fixtures aufnehmen.

---

# 9. Rückwärtskompatibilität und Schutzregeln

- Das finale CV-Design bleibt unverändert.
- Neutrale vier Produktionsvarianten bleiben unverändert und grün.
- `npm run render:all` und `npm run test:render` bleiben grün.
- Kein Anwendungslauf darf neutrale PDFs, PNGs, Previews oder Reports überschreiben.
- Keine versteckten ATS-Texte.
- Keine erfundenen Angaben.
- Keine echte Bewerbungsakte committen.

---

# 10. Vollständiger Workflow

Ausführen:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run test:application
npm run render:all
npm run test:render
```

Erfolg erst bei:

- alle Befehle Exit-Code 0
- GitHub Actions vollständig grün
- finaler Guard skipped
- fiktiver End-to-End-Anwendungslauf erzeugt alle Dateien und Exportarchiv
- echter PDF-Personalisierungstest grün
- neutrale CV-Artefakte unverändert

---

# 11. Abschlussbericht

Berichte mindestens:

1. lokaler Commit-SHA
2. Live-Head-SHA von PR #6
3. Workflow-Run und alle Schritte
4. Anwendungskontext-Schema
5. Ergebnis des strukturierten Fixture-Laufs
6. Greeting/Pensum/Eintritt in echtem PDF und Poppler
7. gewählte Variante
8. Markdown-/JSON-Konsistenz
9. Belegmatrix-Statuswerte
10. Render-Report-Gates
11. Exportpfad und SHA-256 des `.tar.gz`
12. Idempotenz
13. neutrale Artefakte unverändert
14. kein neuer Branch/PR, nichts gemergt

Beginne jetzt und fahre ohne weitere Rückfrage fort.