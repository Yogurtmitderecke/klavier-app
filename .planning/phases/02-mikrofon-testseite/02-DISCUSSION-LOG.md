# Phase 2: Mikrofon-Testseite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-23
**Phase:** 02-mikrofon-testseite
**Areas discussed:** Mikrofon-Start, Test am Klavier
**Areas offered but not selected:** Ton-Anzeige, Diagnose-Werte (→ Claude's discretion)

---

## Mikrofon-Start

**Q: Wann soll die App nach der Mikrofon-Erlaubnis fragen?**

| Option | Description | Selected |
|--------|-------------|----------|
| Knopf auf Testseite | Großer „Mikrofon starten"-Knopf erst auf der Testseite | ✓ |
| Schon beim „Start" | Start-Knopf der Startseite fragt sofort (wie in Phase 1 D-02 vorbereitet) | |
| Du entscheidest | | |

**Q: Was soll passieren, wenn das Mikrofon nicht startet?**

| Option | Description | Selected |
|--------|-------------|----------|
| Hilfe auf Deutsch | Hinweis + Anleitung zum Wiedereinschalten in Safari + „Nochmal versuchen" | |
| Nur kurze Meldung | Eine Zeile + „Nochmal versuchen" | |
| Du entscheidest | | |

**User's choice:** Free text: „entscheide du" → Claude's discretion

**Q: Was passiert beim Verlassen der Testseite mit „‹ Zurück"?**

| Option | Description | Selected |
|--------|-------------|----------|
| Mikro aus beim Verlassen | Mikrofon wird gestoppt, beim nächsten Besuch neu starten | ✓ |
| Mikro läuft weiter | Bleibt die ganze Sitzung an | |
| Du entscheidest | | |

**Q: Zusätzlicher Knopf „Mikrofon stoppen"?**

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Start/Stopp | Ein Knopf, der zwischen Starten und Stoppen wechselt | ✓ |
| Nein, nur Start | Stoppen nur durch Verlassen der Seite | |

---

## Test am Klavier

**Q: Wie prüfen wir am Klavier?**

| Option | Description | Selected |
|--------|-------------|----------|
| Feste Checkliste | Vorgegebene Liste (C2, C3, C4, A4 halten, C6, schnelle Folge) | ✓ |
| Frei ausprobieren | | |
| Beides | | |

**Q: Soll die App beim Test helfen?**

| Option | Description | Selected |
|--------|-------------|----------|
| Nein, nur anzeigen | Ergebnisse im Chat melden | ✓ |
| Einfache Halte-Anzeige | „stabil seit 2,4 s" | |
| Werte zum Kopieren | Kopier-Knopf für Diagnose-/Messwerte | |

**Q: Wenn die Erkennung nicht gut genug ist?**

| Option | Description | Selected |
|--------|-------------|----------|
| Nachbessern in Phase 2 | Verbessern, bis die Checkliste passt | ✓ |
| Weiter, später verbessern | | |
| Du entscheidest | | |

**Q: Auch vom Home-Bildschirm testen?**

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, mit Anleitung | Safari-Tab und Home-Bildschirm testen | ✓ |
| Nur Safari-Tab | | |

---

## Claude's Discretion

- Fehlerbehandlung bei abgelehntem/nicht verfügbarem Mikrofon
- Ton-Anzeige (Notennamen, Oktav-Schreibweise, Cent-Darstellung)
- Diagnose-Bereich (Layout, Inhalte)

## Deferred Ideas

None.
