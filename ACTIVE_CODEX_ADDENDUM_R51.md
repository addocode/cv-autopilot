# ACTIVE CODEX ADDENDUM — Review Runde 51

## Ziel

Erweitere den bestehenden vollständig grünen CV-Autopilot um eine dauerhafte, menschenlesbare und maschinenverwertbare Bewerbungsakte pro echtem Stelleninserat.

Die bestehende CV-Engine, das Layout, die vier Varianten, ATS-Gates und alle grünen Tests aus Run 58 bleiben unverändert. Diese Runde ergänzt ausschliesslich den Eingabe-/Archivierungs- und Paketierungsworkflow.

Arbeite ausschliesslich auf dem bestehenden Branch `codex/verifiziere-icon-hashes-und-svg-geometrie` und PR #6.

- keinen neuen Branch erstellen
- keinen neuen Pull Request erstellen
- `make_pr` nicht aufrufen
- nichts mergen
- keine bestehenden CV-Layouts, Fonts, Icons oder Texte ohne konkreten Anwendungskontext verändern

---

## 1. Bewerbungsakte pro Stelleninserat

Nach Übergabe eines echten Stelleninserats muss das System einen eindeutigen Bewerbungsordner erzeugen:

```text
applications/YYYY-MM-DD_<arbeitgeber-slug>_<stellen-slug>/
```

Beispiel:

```text
applications/2026-07-20_bundesamt-fuer-informatik_sachbearbeitung-gever/
```

Der Ordner enthält mindestens:

```text
00_stelleninserat.md
01_application-context.json
02_cv_<variant>.pdf
03_cv_<variant>-preview.html
04_manifest.json
```

Später zusätzlich:

```text
05_motivationsschreiben.pdf
06_motivationsschreiben.md
```

Bei PDF-, Bild- oder Textdatei als Quelle soll die Originaldatei zusätzlich unverändert im selben Ordner archiviert werden, sofern sie lokal verfügbar ist.

---

## 2. `00_stelleninserat.md` als menschenlesbare Hauptakte

Die Markdown-Datei ist die dauerhaft lesbare Stellenakte für spätere Bewerbungsgespräche. Sie muss optisch sauber, vollständig und ohne erfundene Informationen aufgebaut sein.

### 2.1 YAML-Frontmatter

```yaml
---
schema_version: 1
application_id: "2026-07-20_bundesamt-fuer-informatik_sachbearbeitung-gever"
created_at: "2026-07-20T20:00:00+03:00"
updated_at: "2026-07-20T20:00:00+03:00"
source_type: "url|pdf|image|text"
source_url: ""
source_filename: ""
source_content_sha256: ""
employer: ""
job_title: ""
job_id: ""
location: ""
workload: ""
start_date: ""
application_deadline: ""
language: "de"
selected_cv_variant: ""
application_status: "draft"
---
```

Nur tatsächlich bekannte Werte eintragen. Unbekannte Werte als leere Strings, nicht raten.

### 2.2 Sichtbare Struktur

Die Datei enthält genau diese Hauptabschnitte:

```markdown
# Stelleninserat: [Stellenbezeichnung]

> [Arbeitgeber] · [Ort] · [Pensum] · [Eintritt]

## Bewerbungsübersicht

## Eckdaten

## Ansprechperson und Ansprache

## Aufgaben und Verantwortlichkeiten

## Muss-Anforderungen

## Wunsch-Anforderungen

## Systeme, Methoden und Fachbegriffe

## Arbeitgeber, Umfeld und Benefits

## Bewerbungsprozess und Fristen

## CV-Personalisierung

## Belegmatrix: Inserat ↔ Profil

## Offene Punkte und Unsicherheiten

## Vollständiger Originaltext
```

### 2.3 Eckdaten

Als kompakte Markdown-Tabelle mit mindestens:

- Arbeitgeber
- Stellenbezeichnung
- Abteilung/Organisationseinheit
- Arbeitsort
- Homeoffice/Arbeitsmodell
- Pensum
- Eintritt
- Befristung
- Bewerbungsfrist
- Referenz-/Job-ID
- Inseratsprache
- Quelle und Abrufdatum

### 2.4 Ansprechperson

Dokumentiere getrennt:

- vollständiger Name
- Funktion
- explizite Anrede
- Du-/Sie-/neutral-Modus
- E-Mail
- Telefon
- Quelle im Inserat
- Konfidenz

Keine Person, Anrede, Funktion oder Geschlechtszuordnung erraten.

### 2.5 Anforderungen

Trenne klar zwischen:

- Muss-Anforderungen
- Wunsch-/Kann-Anforderungen
- Aufgaben
- Systeme/Tools
- Soft Skills
- Ausbildung/Erfahrung
- Sprachen

Jeder Punkt erhält, sofern sinnvoll:

```text
- [Anforderung] — Quelle: [kurzer Originalausschnitt oder Abschnitt]
```

Keine Anforderungen ergänzen, die nicht im Inserat stehen.

### 2.6 CV-Personalisierung

Dokumentiere transparent:

- ausgewählte CV-Variante und Auswahlgrund
- erkannte ATS-Schlüsselbegriffe
- übernommene Pensum-/Eintrittswerte
- verwendete Anrede oder Begründung für Weglassen
- priorisierte Skillsets
- ergänzte/entfernte Experience-Bullets
- abgelehnte nicht belegbare Anforderungen
- finale ATS-Abdeckung

### 2.7 Belegmatrix

Markdown-Tabelle:

| Inseratsanforderung | Profilbeleg | Source-ID | Evidence-Status | CV-Verwendung |
|---|---|---|---|---|

Evidence-Status nur:

- `verified`
- `defensible_inference`
- `unsupported_rejected`

### 2.8 Offene Punkte

Alle unklaren oder widersprüchlichen Angaben werden sichtbar dokumentiert, beispielsweise:

- Eintritt nicht genannt
- Pensum widersprüchlich
- Ansprechperson ohne eindeutige Ansprache
- Inserat nennt Tool, das im Profil nicht belegt ist

### 2.9 Originaltext

Der vollständige normalisierte Originaltext des Inserats wird am Ende archiviert. Originalinhalt nicht umformulieren. Technische Navigation, Cookie-Texte und irrelevante Seitenelemente dürfen entfernt werden.

Bevorzugt einklappbar:

```html
<details>
<summary>Vollständigen Originaltext anzeigen</summary>

[Originaltext]

</details>
```

---

## 3. Maschinenlesbarer Anwendungskontext

`01_application-context.json` wird deterministisch aus derselben Inseratsanalyse erzeugt und bleibt die direkte Eingabe für den Renderer.

Die Markdown-Akte und JSON-Datei müssen dieselben Kerndaten enthalten:

- employer
- jobTitle
- source
- workload
- start
- contact
- addressMode
- requirements
- atsTerms
- selectedVariant

Füge in beide Dateien eine gemeinsame `application_id` und gegenseitige Referenz ein.

Der JSON-Kontext darf niemals zusätzliche Tatsachen enthalten, die in der Markdown-Akte oder im Inserat nicht belegt sind.

---

## 4. Manifest und Dateiintegrität

`04_manifest.json` enthält mindestens:

```json
{
  "schemaVersion": 1,
  "applicationId": "...",
  "generatedAt": "...",
  "source": {
    "type": "url|pdf|image|text",
    "url": "",
    "filename": "",
    "sha256": ""
  },
  "selectedVariant": "...",
  "files": [
    {
      "path": "00_stelleninserat.md",
      "sha256": "...",
      "role": "job-ad-archive"
    }
  ],
  "validation": {
    "markdownJsonConsistent": true,
    "allFilesPresent": true,
    "unsupportedFacts": []
  }
}
```

Alle erzeugten Dateien erhalten SHA-256-Hashes.

---

## 5. CLI-/Workflow-Schnittstelle

Ergänze einen dokumentierten, deterministischen Workflow, beispielsweise:

```bash
node scripts/create-application.mjs \
  --job-ad fixtures/real-job-ad.txt \
  --source-url "https://..." \
  --application-date 2026-07-20
```

oder eine gleichwertige klare Schnittstelle.

Der Workflow muss:

1. Inserat einlesen
2. Bewerbungs-ID/Slug bilden
3. `00_stelleninserat.md` erzeugen
4. `01_application-context.json` erzeugen
5. passende CV-Variante bestimmen
6. CV mit diesem Kontext rendern
7. finale CV-Dateien in den Bewerbungsordner kopieren
8. Manifest erzeugen
9. Konsistenz und Pflichtdateien validieren

Keine bestehenden neutralen Produktionsartefakte überschreiben.

---

## 6. Datenschutz und Repository-Verhalten

Der Ordner `applications/` enthält reale Bewerbungs- und Kontaktdaten und bleibt privat.

- keine Daten an externe Dienste senden
- keine privaten Inhalte in öffentliche Fixtures kopieren
- Testfixtures ausschliesslich mit klar fiktiven Daten
- URL-Inhalte lokal archivieren, da Inserate später verschwinden oder verändert werden können

---

## 7. Tests

Ergänze mindestens:

1. vollständiger Bewerbungsordner wird erzeugt
2. Dateinamen/Slug sind deterministisch
3. Markdown enthält alle Pflichtabschnitte
4. YAML-Frontmatter ist parsebar
5. unbekannte Werte bleiben leer statt geraten
6. vollständiger Originaltext ist enthalten
7. JSON und Markdown stimmen bei Kerndaten überein
8. Ansprechperson und Ansprache werden nur bei belegten Daten gesetzt
9. CV-Variante ist dokumentiert
10. Belegmatrix enthält keine unbelegten positiven Matches
11. `unsupported_rejected` wird sichtbar dokumentiert
12. CV-PDF liegt im selben Bewerbungsordner
13. neutrale `dist/`-Produktionsartefakte werden nicht überschrieben
14. Manifest enthält korrekte SHA-256-Hashes
15. späteres erneutes Erzeugen ist idempotent oder erzeugt eine klar versionierte Aktualisierung

Nutze eine fiktive Testfixture; keine echten persönlichen HR-Daten in öffentliche Tests übernehmen.

---

## 8. Erfolgskriterien

- bestehender Run-58-Workflow bleibt vollständig grün
- neue Archivierungs-/Pakettests grün
- keine CV-Layoutänderung
- kein Verlust des Originalinserats
- Markdown ist ohne Zusatzsoftware gut lesbar
- Renderer kann den Anwendungskontext direkt wiederverwenden
- alle Bewerbungsdateien sind durch dieselbe `application_id` verbunden

Berichte danach:

- Commit-SHA
- erzeugte Beispielstruktur
- Beispiel-Markdown
- gewählte CLI
- neue Tests
- Workflow-Status
- Bestätigung, dass neutrale Produktionsartefakte unverändert bleiben
