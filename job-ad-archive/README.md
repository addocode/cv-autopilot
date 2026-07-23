# Dauerhaftes Stelleninserat-Archiv

Jeder echte Bewerbungslauf erzeugt hier eine schlanke, commit-fertige Stellenakte:

```text
job-ad-archive/<applicationId>/00_stelleninserat.md
```

Die Akte enthält nur öffentlich publizierte Inseratsdaten:

- Originaltext des Stelleninserats
- Arbeitgeber, Stellenbezeichnung, Arbeitsort und Pensum
- Quellen-URL, Bewerbungsdatum und SHA-256-Inhaltshash
- im Inserat publizierte Kontaktangaben

CV, Motivationsschreiben, persönliche Strategie, Gap-Analyse, RAV-Daten und PDFs
werden nicht in dieses öffentliche Archiv übernommen. Sie bleiben Bestandteil des
privaten Bewerbungspakets.

Die lokale Erzeugung allein ist noch keine GitHub-Sicherung. Bei einem Live-Run muss
die neue Stellenakte zusammen mit allfälligen geprüften Systemänderungen committed
und auf GitHub veröffentlicht werden. Kann dies nicht erfolgen, ist der Run als
«nicht dauerhaft auf GitHub archiviert» auszuweisen.
