# Klavier-App (Arbeitstitel)

## What This Is

Eine eigene Klavier-Lern-App im Browser, mit der ich auf meinem **akustischen Klavier** bekannte, gemeinfreie Stücke lerne. Das iPad (oder der Laptop) steht auf dem Notenständer, hört über das Mikrofon zu und zeigt fallende Noten über einer Klaviatur oder klassische Notenschrift. Funktional ähnlich zu bekannten Klavier-Lern-Apps, aber mit eigenem Namen, eigenem Design und eigenen Inhalten. Persönliches Übungswerkzeug – nur für mich.

## Core Value

**Die App hört über das Mikrofon zuverlässig, welchen Ton ich auf meinem akustischen Klavier spiele, und wartet im Warte-Modus, bis der richtige Ton kommt.** Ohne funktionierende Mikrofon-Erkennung ist die App für mich wertlos – es gibt bewusst keinen Ersatz-Modus ohne Zuhören.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Mikrofon-Testseite: zeigt live, welchen Ton die App gerade hört (Notenname, Oktave, Abweichung in Cent) – als frühe, eigene Phase
- [ ] Tonhöhenerkennung über Web Audio API (z. B. „pitchy“ oder YIN), funktioniert in Safari auf dem iPad
- [ ] Kalibrierung: Stimmungs-Ausgleich (Klavier evtl. nicht perfekt gestimmt) und einstellbare Empfindlichkeit gegen Hintergrundgeräusche
- [ ] Song-Bibliothek mit 4–5 gemeinfreien klassischen Stücken in einfacher Fassung (z. B. Für Elise Anfang, Bach Präludium C-Dur, Satie Gymnopédie Nr. 1, Mondscheinsonate 1. Satz Anfang) – nur aus Quellen mit freier Lizenz oder selbst gesetzt
- [ ] Eigene MIDI-Dateien hochladen und üben (z. B. mit @tonejs/midi); MusicXML optional
- [ ] Ansicht 1: fallende Noten über einer Klaviatur
- [ ] Ansicht 2: klassische Notenschrift (OpenSheetMusicDisplay oder VexFlow); Umschalten zwischen beiden Ansichten
- [ ] Warte-Modus: Die fallenden Noten bleiben stehen, bis der richtige Ton erklingt, dann rückt die nächste Note nach (zuerst nur einstimmige Melodie / rechte Hand)
- [ ] Hände getrennt üben: nur rechts, nur links, beide
- [ ] Tempo-Regler (ca. 30–100 %), Metronom, Schleife über ausgewählte Takte
- [ ] Rückmeldung: richtige Töne grün, falsche rot, Trefferquote pro Durchgang
- [ ] Fortschritt lokal im Browser speichern (kein Login, kein Server)
- [ ] Oberfläche auf Deutsch, große Schrift, gut lesbar aus ca. 60 cm Abstand
- [ ] PWA: auf dem iPad wie eine App installierbar
- [ ] Anleitung (auf Deutsch, für Nicht-Programmierer), wie man die App kostenlos mit HTTPS online stellt, damit das Mikrofon auf dem iPad funktioniert

### Out of Scope

- Akkorde / beide Hände gleichzeitig per Mikrofon erkennen — technisch schwierig mit akustischem Klavier im Browser; für später geplant, **vorher Recherche + verständliche Erklärung der Optionen**
- Übungsstatistik und Tagesziele — später, nicht Version 1
- Ersatz-Modus ohne Mikrofon (Noten laufen nur im Tempo mit) — bewusst abgelehnt: ohne Zuhören hat die App für mich keinen Wert
- Automatisches Mitlaufen im Spieltempo / Position im Stück per Gehör finden — Warte-Modus reicht
- Login, Benutzerkonten, Server, Cloud-Sync — nur für mich, alles lokal
- Jegliche Inhalte von flowkey (Name, Logo, Design, Songs, Arrangements) — rechtlich und aus Prinzip ausgeschlossen
- Urheberrechtlich geschützte Stücke oder Arrangements in der mitgelieferten Bibliothek — nur gemeinfreie Werke mit freier Lizenz
- MIDI-Keyboard-Anbindung — Ziel ist explizit das akustische Klavier

## Context

- **Nutzer:** Ich selbst, Wiedereinsteiger (früher Unterricht, Noten lesen geht langsam). Fallende Noten und Notenschrift sind beide wichtig.
- **Gerät:** Hauptsächlich **iPad mit Safari** auf dem Notenständer, alternativ Laptop. iPad/Safari hat eigene Eigenheiten bei Mikrofon-Zugriff (nur über HTTPS, nach Nutzer-Geste), AudioContext und PWAs – muss früh und gezielt getestet werden.
- **Kein Programmierer:** Entscheidungen bitte kurz und einfach auf Deutsch erklären. Nach jeder Phase soll etwas Konkretes am Klavier testbar sein.
- **Akustisches Klavier:** Obertöne, Nachhall, mögliche Verstimmung und Raumgeräusche erschweren die Tonhöhenerkennung. Einstimmig (Melodie) ist realistisch, Akkorde deutlich schwieriger.
- **Erfolgskriterium für V1:** Ein Stück (z. B. Für Elise Anfang) im Warte-Modus komplett und sauber durchgespielt.
- **Name:** Vorerst Arbeitstitel „Klavier-App“, eigener Name kommt später.

## Constraints

- **Tech stack**: React + TypeScript + Vite — vom Nutzer vorgegeben
- **Audio**: Web Audio API + Tonhöhenerkennung (pitchy / YIN) — läuft komplett im Browser
- **Noten**: @tonejs/midi zum Einlesen; OpenSheetMusicDisplay oder VexFlow für Notenschrift — vom Nutzer vorgeschlagen
- **Speicherung**: Nur lokal im Browser (z. B. localStorage/IndexedDB) — kein Server, kein Login
- **Kompatibilität**: Muss in Safari auf dem iPad funktionieren (Mikrofon, Audio, PWA) — Hauptgerät
- **Hosting**: Kostenlos, mit HTTPS (Pflicht für Mikrofon-Zugriff im Browser)
- **Lizenz/Recht**: Nur gemeinfreie Stücke und frei lizenzierte Quellen; nichts von flowkey übernehmen
- **Vorgehen**: Kleine Phasen; Mikrofon-Erkennung früh als eigene Phase mit Testseite

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mikrofon-Erkennung + Testseite als frühe eigene Phase | Schwierigster und wichtigster Teil; Risiko früh klären | — Pending |
| Warte-Modus zuerst nur einstimmig (rechte Hand / Melodie) | Einzeltöne sind im Browser zuverlässig erkennbar, Akkorde nicht | — Pending |
| Kein Modus ohne Mikrofon | Nutzer: ohne Zuhören ist die App wertlos | — Pending |
| iPad + Safari als Hauptziel | Gerät auf dem Notenständer | — Pending |
| Alles lokal, kein Server/Login | Nur für den Eigengebrauch, einfach und kostenlos | — Pending |
| Nur gemeinfreie Stücke, eigene einfache Fassungen | Rechtssicherheit, keine Inhalte Dritter | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-22 after initialization*
