# ACTIVE CODEX TASK — Review Runde 55

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
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Review Runde 55` beginnt.
4. Bei Abweichung nichts verändern und ausschliesslich `STALE SNAPSHOT` melden.

---

# 1. Verifizierte Ausgangslage nach PR #15 und Live-Run 91

PR #15 wurde in PR #6 integriert. Workflow Run 87 war vollständig grün:

- Installation und Chromium
- Build und Validierung
- Datentests
- Application-Unit-Test
- vier neutrale Produktionsrenders
- alle Render-Tests
- echter fiktiver Playwright-Application-E2E-Lauf
- finaler Guard übersprungen

Der erneute echte Parlamentsdienste-Live-Lauf 91 war ebenfalls vollständig grün:

- reale Application-CLI Exitcode `0`
- Variante `administration-gever`
- exakt zwei Seiten
- keine Overflows
- keine Collisions
- keine Warnings
- ATS erfolgreich
- `80 % gemäss Inserat, flexibel nach Absprache`
- `Nach Vereinbarung`
- `Guten Tag Loïc Chatton, ich bin Mediamatiker EFZ ...`
- Manifest vollständig
- Archiv entpackbar
- Manifest innerhalb und ausserhalb des Archivs byte-identisch
- Sidecar-SHA entspricht exakt der finalen `.tar.gz`
- `unsupported_rejected` wird im Manifest und Report ausgewiesen
- beide Kontakte und zusätzliche Eckdaten werden in der realen Markdown-Akte gespeichert

Diese erfolgreiche Infrastruktur ist eingefroren. Es verbleiben ausschliesslich die nachfolgend objektiv bestätigten Qualitätsprobleme.

---

# 2. Scoring-Fehlmatches beseitigen

Der Live-Report 91 erzeugt weiterhin sachlich falsche Treffer durch generische Einzelwörter.

Beispiele:

- `skill-online-campaigns` erhält Punkte für `Produkte` und `pflegen`.
- `skill-social-performance` erhält Punkte für `betreuen`.
- `skill-photo-video` erhält Punkte für `Produkte`.
- `skill-websites-cms-landing` erhält Punkte für `betreuen`.
- `skill-webhosters` erhält Punkte für `leisten` und generische externe Kontakte.
- `bullet-kunz-websites-landing` erhält Punkte für `betreuen`.
- `bullet-kunz-guegg` erhält dagegen keine redaktionelle Priorität, obwohl das Inserat redaktionelle Aufgaben und Medienmitteilungen nennt.
- `skill-responsibility-quality` erhält `0`, obwohl das Inserat Präzision und Qualitätssicherung verlangt.
- `skill-de-fr-context` erkennt Französisch nicht zuverlässig.

Verbindliche Korrektur:

1. Verwende eine einzige kanonische Normalisierung für Inseratsterms, Synonyme, Tags und Kandidatentexte.
2. Behandle deutsche Umlaute konsistent. `Qualität`, `qualitaet`, `Französisch`, `franzoesisch`, `Geschäftsvorgang` und `geschaeftsvorgang` müssen jeweils dieselbe kanonische Form erhalten.
3. Entferne beziehungsweise entwerte generische Einzelwörter als eigenständige Treffer, mindestens:
   - `betreuen`
   - `pflegen`
   - `produkte`
   - `leisten`
   - `weitere`
   - `sicher`
   - `arbeiten`
   - `stellen`
   - `intern`
   - `extern`
   - `anwendungen`
4. Solche Wörter dürfen nur innerhalb einer fachlich kontrollierten Phrase beziehungsweise eines kontrollierten Tag-/Synonymtreffers wirken, beispielsweise `IT-Anwendungen`, `interne und externe Stellen` oder `Dokumentenpflege`.
5. Fachliche Phrase-/Tag-Treffer müssen deutlich stärker zählen als freie Token:
   - Dokumentenmanagement / Dokumentenablage
   - GEVER / ACTA NOVA / Geschäftsvorgangsbearbeitung
   - administrative Sachbearbeitung / administrative Unterstützung
   - Qualitätssicherung / formale Kontrolle / präzise Arbeitsweise
   - Koordination / Sitzungsorganisation
   - Redaktion / redaktionell / editorial / Medienmitteilungen
   - Deutsch / Französisch / Amtssprachen
   - Selbstorganisation / Prioritäten / Eigenverantwortung
   - Informatiksysteme / rasche Einarbeitung
6. Keine semantische Fähigkeit erfinden. Scoring priorisiert nur vorhandene source-backed Inhalte.
7. Gleiche Eingaben erzeugen deterministisch dieselben Scores.

`selectionReasonById` muss die tatsächlich gewichteten kanonischen Phrasen und Tags ausweisen; generische Stoppwörter dürfen dort nicht als Begründung erscheinen.

---

# 3. Erwartete Skill-Auswahl für Administrations-/GEVER-Stellen

Für den realen Parlamentsdienste-Kontext wurden unter anderem folgende Fehlprioritäten gemessen:

- `skill-gever-document-work` wurde verdrängt, während `skill-cms-admin` und `skill-webhosters` sichtbar blieben.
- `skill-responsibility-quality` und `skill-structured-projects` wurden verdrängt.
- Onlineshop und Social Media erhielten durch generische Fehlmatches künstliche Relevanz.

Verbindlich:

## `ADMINISTRATION, GEVER & SYSTEME`

Vor CMS/Webhoster-Füllern priorisieren:

- `skill-system-support-office`
- `skill-data-care-quality`
- `skill-ms-office-docs`
- `skill-acta-nova`
- `skill-gever-document-work`

CMS-Administration oder Webhoster dürfen erst danach als Füller erscheinen, wenn die Mindestzahl von sechs Bullets sonst nicht erreicht wird.

## `ARBEITSWEISE & ZUSAMMENARBEIT`

Für das reale Inserat insbesondere priorisieren:

- `skill-structured-projects`
- `skill-responsibility-quality`
- `skill-fast-onboarding`
- `skill-coordination-partners`
- `skill-process-documentation`
- `skill-knowledge-documentation`
- `skill-de-fr-context`
- `skill-service-quality`

Die finale Auswahl bleibt layoutabhängig bei sechs bis acht evidence-backed Bullets.

## Weniger relevante Sektionen

Die vier bestehenden Skillset-Sektionen bleiben erhalten. Weniger relevante Mediamatik-/Marketing-Inhalte dürfen als sichere Füller sichtbar bleiben, aber sie erhalten keinen künstlichen Job-Ad-Score durch Wörter wie `betreuen`, `Produkte` oder `pflegen`.

Tests müssen nicht nur Reihenfolge, sondern die tatsächlich sichtbaren IDs prüfen.

---

# 4. Experience-Auswahl aus vollständigem Kandidatenpool

PR #15 sortiert Experience-Bullets weiterhin erst nach:

```js
.filter((bullet) => selected.has(bullet.id) && !hidden.has(bullet.id))
```

Damit bleibt die bisherige Varianten-Vorauswahl weitgehend eingefroren. Höher relevante, aber vorher nicht ausgewählte Bullets können nicht verdrängen.

Der Live-Run bestätigt:

- `bullet-kunz-guegg` mit eigenständiger redaktioneller Magazinproduktion wird depriorisiert.
- `bullet-kunz-websites-landing` bleibt sichtbar.
- `bullet-freelance-french` wird trotz geforderter zweiter Amtssprache depriorisiert.
- `bullet-freelance-self-organization` wird trotz Selbstorganisation/Prioritätensetzung depriorisiert.

Verbindliche Korrektur:

1. Erzeuge pro nicht geschützter Experience-Station einen vollständigen source-backed Kandidatenpool aus:
   - regulären Bullets
   - optionalen Bullets mit passender beziehungsweise defensibel übertragbarer Variant-Relevanz
   - bestehenden sicheren längeren/kurzen Formulierungen, sofern datengetrieben vorhanden
2. Entferne `inferred_review_required` und unbelegte Kandidaten vor der Auswahl.
3. Berechne den Job-Ad-Score vor der finalen Auswahl.
4. Wähle daraus die in der Varianten-/Layoutlogik zulässige Zahl sichtbarer Bullets.
5. Erst danach adaptive Füllung und Breadth-/Cross-Domain-Regeln anwenden.
6. Cross-Domain-Bullet bleibt der letzte sichtbare Bullet der Station.
7. BM und geschützte Education-Stationen bleiben unverändert.

Für den realen Administrationskontext sollen bei Kunz Kunath insbesondere redaktionelle Magazinpraxis, Prozessübergaben, externe Koordination und dokumentationsnahe Arbeiten vor Website-/Onlineshop-Füllern stehen.

Für Freelance sollen Französisch, Selbstorganisation und Stakeholder-Koordination vor generischer Marketingunterstützung priorisiert werden, sofern Layout und Evidence-Gates dies zulassen.

---

# 5. `jobAdRelevance` muss den final sichtbaren DOM-Zustand abbilden

Verbindlich:

- `selectedSkillBulletIds`: alle und nur final sichtbaren Skill-Bullets, einschliesslich tatsächlich sichtbarer adaptiver Füller.
- `selectedExperienceBulletIds`: alle und nur final sichtbaren Experience-Bullets.
- `deprioritizedBulletIds`: geprüfte, aber final nicht sichtbare Kandidaten.
- Keine Überschneidung zwischen selected und deprioritized.
- `unsupportedTermsRejected`: konkrete IDs und Texte aller `unsupported_rejected`-Anforderungen.
- `selectionReasonById`: ausgewählte und abgelehnte Kandidaten mit Score, kanonischen matchedTerms, matchedTags und tatsächlicher Selection-Stage.
- Report erst nach Abschluss der adaptiven DOM-Auswahl finalisieren.

Ergänze echte Assertions, die sichtbare DOM-IDs gegen den Report vergleichen.

---

# 6. Markdown-Kontaktwege korrekt darstellen

Die reale Stellenakte enthält beide Kontakte korrekt, aber die Spalte `Kontaktwege` ist leer, obwohl im Inserat jeweils ein Nachrichtenformular vorhanden ist.

Ursache: Die Ausgabe prüft `addressMode === "portal"`, während `portal` kein zulässiger Ansprachemodus ist und fachlich auch kein Ansprachemodus sein soll.

Verbindlich:

- Trenne Ansprachemodus und Kontaktkanal.
- Ergänze ein optionales Feld wie `contactChannels`, `contactMethod` oder `hasMessageForm`.
- Für den Live-Fall muss die Kontaktspalte ausgeben:

```text
Nachrichtenformular; keine direkte E-Mail im Inserat
```

- `addressMode` bleibt `formal|informal|neutral|unknown`.
- Keine E-Mail oder Telefonnummer erfinden.
- Nur der Bewerbungskontakt bleibt Greeting-Kandidat.

---

# 7. Generische Belegmatrix-Zeile vollständig entfernen

Die fiktive E2E-Markdown-Akte enthält weiterhin die erfundene Zeile:

```text
Nicht belegte Zusatzanforderung
```

und zusätzlich ein sichtbares literales `\n`.

Verbindlich:

- Entferne diese generische Zeile vollständig.
- Jede Tabellenzeile muss einer konkreten Inseratsanforderung entsprechen.
- Konkrete `unsupported_rejected`-Anforderungen werden regulär als eigene Anforderungszeile dargestellt.
- Kein literales `\n` im Markdown.
- Keine künstliche Ablehnung erzeugen, wenn keine konkrete unbelegte Anforderung vorliegt.

---

# 8. Fiktive E2E-Fixture muss alle neuen Archivfelder prüfen

Der echte Live-Kontext erzeugt die erweiterten Felder korrekt. Die öffentliche fiktive E2E-Fixture enthält diese Felder jedoch nicht, obwohl ihr Originaltext Werte für Abteilung, Homeoffice, Befristung, Frist, Referenz und Benefits enthält. Dadurch bleibt die CI-Prüfung für diese Funktion unvollständig.

Erweitere die vollständig fiktive strukturierte Fixture um:

- `employmentType`
- `referenceNumber`
- `applicationDeadline`
- `organisationUnit`
- `homeOffice`
- getrennten `jobContact`
- getrennten `applicationContact`
- `contactMethod` beziehungsweise Nachrichtenformular
- `benefits`
- `employerDescription`
- `applicationProcess`
- `additionalNotes`
- mindestens eine konkrete `unsupported_rejected`-Anforderung

E2E-/Unit-Assertions müssen prüfen:

- alle Werte in JSON und Markdown vorhanden
- beide Kontakte mit Zweck
- nur Bewerbungskontakt als Greeting
- Nachrichtenformular ohne erfundene E-Mail
- konkrete Ablehnung genau einmal
- keine generische Ablehnungszeile
- keine literalen Escape-Sequenzen
- Benefits-/Arbeitgeberabschnitt nicht leer
- offene Punkte nur für wirklich fehlende Werte

Der Default `Onlineportal und komplettes Dossier` darf nicht erfunden werden, wenn kein strukturierter oder explizit extrahierter Bewerbungsweg vorliegt. Ohne Quelle lautet die Ausgabe `nicht genannt`.

---

# 9. Application-E2E-Status vollständig protokollieren

Der Workflow prüft den Application-E2E-Exitcode korrekt im finalen Guard, aber `dist/command-status.json` enthält weiterhin nur:

- `renderAllExitCode`
- `renderTestsExitCode`

Verbindlich:

- Übergib `APPLICATION_E2E_EXIT_CODE` an `scripts/write-command-status.mjs`.
- Schreibe `applicationE2EExitCode` in `command-status.json`.
- Ergänze `applicationE2ESuccess`.
- `allReportsSuccessful` bleibt auf die vier neutralen Reports bezogen.
- Ergänze einen separaten Gesamtwert, beispielsweise `allProductionAndApplicationChecksSuccessful`.
- Ein fehlender oder nicht numerischer E2E-Exitcode darf nicht als Erfolg gelten.

---

# 10. Verhaltens- und Integrationsprüfungen

Reine `src.includes(...)`-Assertions reichen nicht als Nachweis.

Ergänze echte Tests für:

1. Umlaut-/ASCII-Normalisierung:
   - Qualität / qualitaet
   - Französisch / franzoesisch
   - Geschäftsvorgang / geschaeftsvorgang
2. Stoppwörter erzeugen allein keinen Score.
3. Dokumenten-/GEVER-/Qualitäts-/Sprach-Bullets verdrängen Onlineshop, Analytics und Social Media im fiktiven Administrationskontext.
4. Experience-Auswahl kann einen zuvor nicht im Variant-Set sichtbaren redaktionellen oder sprachlichen Bullet auswählen.
5. Finaler DOM und `jobAdRelevance` enthalten exakt dieselben sichtbaren IDs.
6. Datum, sofort, nach Vereinbarung und unknown bleiben ohne Regression korrekt.
7. Application-E2E erzeugt PDF, Report, Manifest, Archiv und Sidecar.
8. Manifest innen/aussen byte-identisch; Sidecar korrekt.
9. Fiktive Markdown-Akte enthält alle optionalen Felder und keine generische Ablehnung.
10. Neutrale vier PDFs und acht PNGs bleiben unverändert isoliert.

---

# 11. Eingefrorene erfolgreiche Eigenschaften

Nicht zurückbauen:

- vier CV-Varianten
- exakt zwei Seiten
- aktuelles Design und Geometrie
- vier Skillsets mit sechs bis acht evidence-backed Bullets
- drei BM-Pflichtbullets und BM-Ausschlüsse
- adaptive Experience-Füllung
- Cross-Domain-Bullet jeweils zuletzt
- Geschäftsnummer und Kontaktlayout
- ATS-/Poppler-/PDF.js-Gates
- neutrale Fallbackwerte
- korrekte vierstufige Eintrittslogik
- grammatisch integrierte Anrede
- `selectedVariant` und kompatibles `variant`
- vollständige Bewerbungsakte
- Manifest und externe Sidecar-SHA
- echter fiktiver Application-E2E-Lauf nach neutralen Tests
- `applications/` und `exports/` git-ignored
- vollständiger Originaltext

---

# 12. Vollständige Abschlussprüfung

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

Der CI-Workflow muss zusätzlich den echten fiktiven Application-E2E-Lauf erfolgreich ausführen.

Erfolg erst bei:

- alle neutralen Reports grün
- alle Render-Tests grün
- Application-E2E Exitcode `0`
- `applicationE2ESuccess === true`
- exakt zwei Seiten
- keine Overflows, Collisions oder Warnings
- ATS erfolgreich
- keine selected/deprioritized-Überschneidung
- DOM-/Report-ID-Konsistenz
- keine generischen Fehlmatches
- redaktionelle und sprachliche Experience-Punkte werden real auswählbar
- Kontaktweg Nachrichtenformular korrekt dokumentiert
- keine generische Belegmatrix-Zeile und kein literales `\n`
- Archiv-/Sidecar-Integrität grün
- finaler Guard übersprungen

## Abschlussbericht

Berichte mindestens:

1. lokaler Commit-SHA
2. Live-Head-SHA von PR #6
3. Workflow Run und Status aller Schritte
4. neutrale Render-/Test-Exitcodes
5. Application-E2E-Exitcode und Gesamtstatus
6. finale sichtbare Skill- und Experience-IDs des Administrations-Fixtures
7. depriorisierte IDs und Nichtüberschneidung
8. konkrete Selection-Reasons für Dokumentenmanagement, Qualität, Französisch, Redaktion sowie abgewählte Marketingpunkte
9. Markdown-Kontakte und Kontaktwege
10. Belegmatrix-Prüfung
11. Manifest-, Archiv- und Sidecar-Status
12. PageCount, ATS, Overflows, Collisions, Warnings
13. Bestätigung: kein neuer Branch, kein neuer PR, PR #6/PR #5 nicht gemergt

Beginne jetzt und fahre ohne weitere Rückfrage fort.
