# ACTIVE CODEX TASK — Review Runde 54

## Arbeitskontext

Arbeite ausschliesslich im privaten Repository `addocode/cv-autopilot` auf dem bestehenden Branch:

`codex/verifiziere-icon-hashes-und-svg-geometrie`

und im bestehenden PR #6.

- Erstelle keinen neuen Branch und keinen neuen Pull Request.
- Rufe `make_pr` nicht auf.
- Merge weder PR #6 noch PR #5.
- Verändere das finale CV-Design, die Schriftgrössen, Icons, Seitenzahl und eingefrorene Geometrie nicht.
- Diese Datei ersetzt alle früheren aktiven Review-Aufträge.

## Pflichtprüfung

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 54` beginnt.
4. Bei Abweichung nichts verändern und ausschliesslich `STALE SNAPSHOT` melden.

---

# 1. Verifizierte Ausgangslage nach PR #14 und Live-Run 76

PR #14 hat erfolgreich korrigiert:

- `selectedVariant` zusätzlich zum kompatiblen `variant`
- robuster Variant-Gate im Application-Workflow
- `Nach Vereinbarung` für `start.kind === "negotiable"`
- grammatisch korrektes `..., ich bin Mediamatiker EFZ ...`
- erste `jobAdRelevance`-Diagnostik
- keine doppelte generische `unsupported_rejected`-Zeile

Der zweite echte Parlamentsdienste-Live-Lauf erzeugte erfolgreich:

- Application-Exitcode `0`
- Variante `administration-gever`
- PDF und Preview
- `04_manifest.json`
- `05_render-report.json`
- Exportarchiv `.tar.gz`
- zwei Seiten
- keine Overflows, Collisions oder Warnings
- ATS erfolgreich
- korrektes Pensum
- `Nach Vereinbarung`
- korrekt integriertes Greeting

PR #14 ist trotzdem nicht abschlussbereit. Workflow Run 72 und der isolierte Live-Run haben die folgenden verbleibenden Fehler objektiv bestätigt.

---

# 2. Eintrittsformat ohne Regression

PR #14 änderte für alle sicheren Eintrittsarten den sichtbaren Text auf bloss `parsedValue`. Dadurch scheitert der bestehende formelle Datums-Fixture-Test.

Verbindliche Ausgabe:

- `kind: "date"`:
  `Per DD.MM.YYYY gemäss Inserat, alternativ nach Vereinbarung`
- `kind: "immediately"`:
  `Per sofort gemäss Inserat, alternativ nach Vereinbarung`
- `kind: "negotiable"`:
  `Nach Vereinbarung`
- `kind: "unknown"` oder unsichere Extraktion:
  `Per sofort oder nach Vereinbarung`

Für alle vier Fälle müssen `parsedValue`, `renderedText`, `usedFallback`, `confidence`, sichtbarer DOM-Text und ATS-Text konsistent sein.

Aktualisiere echte Verhaltens-/Render-Tests; keine reinen `src.includes(...)`-Assertions als alleiniger Nachweis.

---

# 3. Exportintegrität ohne unmöglichen Selbst-Hash

Im Live-Run stimmte der im ausserhalb des Archivs liegenden Manifest gespeicherte Archiv-Hash mit der finalen `.tar.gz`-Datei überein. Das im Archiv enthaltene `04_manifest.json` war jedoch älter und enthielt einen anderen Hash.

Eine Datei kann ihren eigenen finalen Archiv-Hash nicht selbstkonsistent im selben Archiv speichern. Implementiere deshalb ein widerspruchsfreies Modell:

Bevorzugte Lösung:

1. `04_manifest.json` enthält die Hashes aller Dossierdateien, aber keinen behaupteten finalen Selbst-Hash des umschliessenden Archivs.
2. Das Manifest innerhalb des Dossierordners und innerhalb des Archivs ist byte-identisch.
3. Nach Erstellung des finalen Archivs wird ausserhalb des Archivs eine Sidecar-Datei erzeugt, beispielsweise:
   - `exports/<applicationId>.tar.gz.sha256`
   oder
   - `exports/<applicationId>.export.json`
4. Die Sidecar-Datei enthält den tatsächlichen SHA-256 des finalen Archivs und wird nicht in dasselbe Archiv aufgenommen.

Verbindliche Tests:

- Dossiermanifest innen und aussen byte-identisch
- alle Dossierdatei-Hashes korrekt
- Archiv entpackbar und vollständig
- Sidecar-Hash entspricht exakt der finalen Archivdatei
- erneuter identischer Lauf erzeugt deterministisch denselben Archiv-Hash
- keine nachträgliche Manifeständerung nach der finalen Archivierung

---

# 4. Stellenrelevanz muss die Auswahl verändern, nicht nur sortieren

Die aktuelle Implementierung berechnet Scores erst, nachdem die Variantenlogik die Kernbullets bereits ausgewählt hat. Dadurch ändert sich meist nur die Reihenfolge innerhalb eines festen Sets.

Der Live-CV zeigt weiterhin prominent:

- Webhoster
- CMS-Administration
- Onlineshop-Zahlungsprozesse
- Google Analytics
- Newsletter
- Social Media
- Landing Pages

obwohl höher relevante belegte Inhalte vorhanden sind.

Verbindlich:

- Erzeuge pro Skillset einen vollständigen evidence-backed Kandidatenpool aus Basis- und Supplemental-Bullets.
- Berechne `jobAdMatchScore` vor der Auswahl.
- Wähle daraus 6–8 sichtbare Bullets pro Skillset unter Beachtung der bestehenden Layout-/Evidence-Gates.
- Höher relevante belegte Bullets verdrängen weniger relevante Bullets.
- Erst danach darf die adaptive Füllung sichere Füller ergänzen.
- Für Experience-Bullets muss der Score ebenfalls vor `slice()` beziehungsweise finaler Auswahl berücksichtigt werden.
- BM und geschützte Education-Stations bleiben unverändert.
- `unsupported_rejected` darf nie gerendert werden.

Für den Administrations-/GEVER-Fixture müssen vor Onlineshop, Analytics und Social Media priorisiert werden:

- MS Office und Dokumentenverwaltung
- GEVER / ACTA NOVA
- digitale Geschäftsvorgangsbearbeitung
- Dokumentenablage
- formale Kontrolle und Qualitätssicherung
- Prozessdokumentation und Wissenssicherung
- Koordination interner und externer Stellen
- administrative Unterstützung und Auskünfte
- selbstständige Organisation und Prioritätensetzung
- rasche Einarbeitung in Informatiksysteme
- Deutsch/Französisch
- redaktionelle und dokumentationsbezogene Praxis

Das Design und die vier Skillset-Sektionen bleiben erhalten. Weniger relevante Mediamatik-Inhalte dürfen nur als sichere Füller erscheinen, wenn keine höher relevante belegte Alternative verfügbar ist.

---

# 5. Scoring robust und nachvollziehbar machen

Die aktuelle Teilwortlogik erzeugt Fehlgewichtungen. Im Live-Report erhielt etwa die Zusammenarbeit mit Webhostern einen hohen Score, während ACTA NOVA teilweise `0` erhielt.

Verbindlich:

- Nutze normalisierte Tags, `atsSynonyms`, kontrollierte Synonymgruppen und sinnvolle Token-/Stammübereinstimmung.
- Verwende Stopwörter für generische Begriffe wie `Stellen`, `Arbeiten`, `sicher`, `intern`, `extern`, sofern sie allein keine fachliche Relevanz belegen.
- Phrase-/Tag-Treffer wie Dokumentenmanagement, Administration, GEVER, Qualität, Koordination und Sprachen müssen stärker zählen als generische Teilworttreffer.
- Keine semantischen Fähigkeiten erfinden; Scoring priorisiert nur vorhandene belegte Inhalte.
- Gleiche Eingaben müssen deterministisch gleiche Scores und Auswahl erzeugen.

`selectionReasonById` soll konkrete Treffer nennen, nicht nur `jobAdMatchScore=n`, beispielsweise:

```json
{
  "score": 8,
  "matchedTerms": ["Dokumentenmanagement", "Administration"],
  "matchedTags": ["gever", "documentation"],
  "selectionStage": "core-selection"
}
```

---

# 6. `jobAdRelevance`-Report intern konsistent machen

Im Live-Report sind mehrere IDs zugleich in `selectedSkillBulletIds` und `deprioritizedBulletIds` enthalten. Zudem ist `unsupportedTermsRejected` leer, obwohl der strukturierte Kontext eine konkrete `unsupported_rejected`-Anforderung enthält.

Verbindlich:

- `selectedSkillBulletIds`: nur final sichtbare Skill-Bullets
- `selectedExperienceBulletIds`: nur final sichtbare Experience-Bullets
- `deprioritizedBulletIds`: nur geprüfte, aber nicht sichtbare Kandidaten
- keine Überschneidung zwischen selected und deprioritized
- `unsupportedTermsRejected`: konkrete Text-/ID-Angaben aus Anforderungen mit `evidenceStatus: "unsupported_rejected"`
- `selectionReasonById`: für ausgewählte und abgelehnte Kandidaten
- Report muss den finalen DOM-Zustand nach adaptiver Füllung widerspiegeln, nicht einen früheren Zwischenstand

Ergänze Tests für Mengenüberschneidungen und DOM-/Report-Konsistenz.

---

# 7. Vollständige Bewerbungsakte mit echten Eckdaten

Der strukturierte Live-Kontext enthielt zusätzliche echte Angaben, die aktuelle Markdown-Akte ignoriert sie jedoch weiterhin. Die Akte zeigte weder `unbefristet`, Referenznummer noch beide Kontakte und enthielt im Arbeitgeber-/Benefits-Bereich nur `-`.

Erweitere Schema, Validierung, JSON und Markdown datengetrieben um optionale Felder:

- `employmentType`
- `referenceNumber`
- `applicationDeadline`
- `organisationUnit`
- `homeOffice`
- `jobContact`
- `applicationContact`
- `benefits`
- `employerDescription`
- `applicationProcess`
- `additionalNotes`

Kontaktregeln:

- Fachkontakt und Bewerbungskontakt getrennt speichern und anzeigen.
- Nur `applicationContact` darf als Greeting-Kandidat verwendet werden.
- Keine E-Mail oder Telefonnummer aus Namen ableiten.
- Nachrichtenformular ohne sichtbare Adresse bleibt als `keine direkte E-Mail im Inserat` dokumentiert.

Markdown-Anforderungen:

- Eckdatentabelle enthält alle vorhandenen Werte.
- Kontaktbereich enthält Zweck, Name, Funktion und vorhandene Kontaktwege beider Personen.
- Arbeitgeber-/Umfeld-/Benefits-Abschnitt verwendet vorhandene Daten statt `-`.
- Bewerbungsprozess enthält Onlineportal und komplettes Dossier.
- Offene Punkte nennen tatsächlich fehlende Werte, beim Live-Fall mindestens:
  - Bewerbungsfrist nicht genannt
  - direkte Kontakt-E-Mail nicht sichtbar
  - Homeoffice/Arbeitsmodell nicht genannt
- `Keine offensichtlichen offenen Pflichtpunkte erkannt` darf nur erscheinen, wenn die definierten relevanten Metadaten vollständig sind.
- Originaltext bleibt vollständig und unverändert archiviert.

---

# 8. Echte Application-E2E-Prüfung dauerhaft in CI

PR #14 fügte keine echte Playwright-Application-E2E-Prüfung hinzu. Der bestehende Unit-Test mit `--skip-render-for-tests` bleibt, reicht aber nicht.

Füge nach den neutralen `render:all`- und `test:render`-Schritten einen vollständig fiktiven echten Application-E2E-Lauf hinzu.

Warum nach den neutralen Tests:

- Application-Suffix-Artefakte dürfen die vier neutralen PDF-/PNG-Zählungen nicht beeinflussen.
- Mehrere Application-Renders müssen im selben Workspace möglich sein.

Der CI-Schritt muss:

- mit `set -o pipefail` oder explizitem `${PIPESTATUS[0]}` arbeiten
- Exitcode separat speichern
- Diagnoseartefakte auch bei Fehler hochladen
- einen Fehllauf niemals als Erfolg maskieren
- keine echten Arbeitgeber- oder Personendaten in Fixtures enthalten

E2E-Akzeptanz:

- echter Playwright-PDF-Render
- Application-Exitcode `0`
- Manifest vorhanden
- Archiv und Sidecar vorhanden
- Archiv entpackbar
- zwei Seiten
- ATS erfolgreich
- keine Overflows, Collisions oder Warnings
- korrekte Variante
- korrektes Pensum
- korrektes Datum-/Sofort-/Nach-Vereinbarung-Verhalten
- grammatisch korrekt integriertes Greeting
- neutrale Artefakte unverändert

---

# 9. Tests statt Quelltext-Suchassertions

Die neuen Runde-53-Tests prüfen überwiegend nur, ob bestimmte Quelltextfragmente vorhanden sind. Ergänze echte Funktions- und Integrationsprüfungen.

Mindestens testen:

- strukturierter Kontext → sichtbarer Footertext
- strukturierter Kontext → integrierter Kurzprofiltext
- Kontext → tatsächlich andere Skill-/Experience-Auswahl als neutraler Render
- finaler DOM → `jobAdRelevance`-Report
- Application-CLI → Manifest, Archiv, Sidecar und Hashkonsistenz
- zwei Application-Renders im selben `dist/`
- neutraler Visual Review bleibt exakt bei vier kanonischen PDFs und acht PNGs

---

# 10. Eingefrorene erfolgreiche Eigenschaften

Nicht zurückbauen:

- vier CV-Varianten
- exakt zwei Seiten
- aktuelles Design und Geometrie
- vier Skillsets mit 6–8 evidence-backed Bullets
- drei BM-Pflichtbullets und BM-Ausschlüsse
- echte adaptive Experience-Füllung
- Geschäftsnummer und Kontaktlayout
- ATS-/Poppler-/PDF.js-Gates
- neutrale Fallbackwerte
- korrekte `Nach Vereinbarung`-Ausgabe
- korrektes `..., ich bin Mediamatiker EFZ ...`
- `selectedVariant` und kompatibles `variant`
- `applications/` und `exports/` git-ignored
- vollständiger Originaltext

---

# 11. Vollständige Abschlussprüfung

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

Zusätzlich den neuen echten fiktiven Application-E2E-Test ausführen.

Erfolg erst bei:

- `renderAllExitCode: 0`
- `renderTestsExitCode: 0`
- alle vier neutralen Reports erfolgreich
- Visual Review erfolgreich
- Application-E2E-Exitcode `0`
- Manifest innen und aussen identisch
- Archiv-Sidecar-Hash korrekt
- Datum, sofort, nach Vereinbarung und Fallback korrekt
- selected/deprioritized ohne Überschneidung
- `unsupportedTermsRejected` korrekt
- Administrations-Fixture zeigt sichtbar relevantere Auswahl
- vollständige Markdown-Eckdaten und beide Kontakte
- finaler Guard übersprungen

## Abschlussbericht

Berichte mindestens:

1. lokaler Commit-SHA
2. Live-Head-SHA von PR #6
3. Workflow-Link und Status aller Schritte
4. neutrale Render-/Test-Exitcodes
5. Application-E2E-Exitcode
6. Manifest-/Archiv-/Sidecar-Status
7. Eintritts-, Pensum- und Greeting-Ergebnis
8. ausgewählte und depriorisierte Skill-/Experience-IDs ohne Überschneidung
9. `unsupportedTermsRejected`
10. Markdown-Eckdaten- und Kontaktstatus
11. PageCount, ATS, Overflows, Collisions, Warnings
12. Bestätigung: kein neuer Branch, kein neuer PR, nichts gemergt

Beginne jetzt und fahre ohne weitere Rückfrage fort.
