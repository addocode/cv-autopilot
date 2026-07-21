# Chat and Web-App Contract – RAV-Recap

Jeder Chat, Agent, CLI-Durchlauf und spätere Web-App-Endpunkt muss denselben RAV-Recap-Generator verwenden.

## Verbindliche Reihenfolge

1. Bewerbungsinstanz und Stelleninserat laden.
2. Pflichtfelder aus dem Inserat extrahieren.
3. Fehlende Werte anhand offizieller Quellen recherchieren.
4. Verbleibende Pflichtfelder nach den dokumentierten Fallbackregeln füllen.
5. Daten gegen `schema.json` validieren.
6. HTML ausschliesslich über `mobile-template.html` rendern.
7. TXT und Report aus denselben JSON-Daten erzeugen.
8. Alle vier Dateien in der Bewerbungsakte speichern.
9. In der Web-App eine Unterseite mit demselben HTML-Framework veröffentlichen.

## Kein stiller Layout-Fallback

Ist der produktive RAV-Recap-Renderer nicht verfügbar, darf kein anders gestaltetes Dokument als final ausgegeben werden. Das System meldet den fehlenden Renderer und kann höchstens die validierten JSON-Daten als vorläufigen Entwurf bereitstellen.

## Web-App-Publikation

Empfohlener stabiler Pfad:

```text
/applications/<applicationId>/rav-recap/
```

Die Seite zeigt dieselben Werte und Interaktionen wie `12_rav-recap.html`. Optional kann sie zusätzlich einen Link zum vollständigen Bewerbungspaket enthalten. Änderungen am Bewerbungsstatus aktualisieren JSON, HTML-Unterseite, TXT und Report gemeinsam.

## Versionskennung

Jeder Report muss enthalten:

```json
{
  "ravRecapStandard": "approved-mobile-v1",
  "schemaVersion": 1,
  "template": "modules/rav-recap/mobile-template.html"
}
```
