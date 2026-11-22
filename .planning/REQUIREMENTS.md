# Requirements: Klavier-App (Arbeitstitel)

**Defined:** 2026-11-22
**Core Value:** Die App hört über das Mikrofon zuverlässig, welchen Ton ich auf meinem akustischen Klavier spiele, und wartet im Warte-Modus, bis der richtige Ton kommt.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Bereitstellung (DEPL)

- [ ] **DEPL-01**: Nutzer kann die App über eine HTTPS-Adresse (kostenloses Hosting, z. B. GitHub Pages) auf iPad und Laptop öffnen
- [ ] **DEPL-02**: Nutzer sieht eine verständliche deutsche Fehlermeldung, wenn die Seite ohne HTTPS geöffnet wird und das Mikrofon deshalb nicht geht
- [ ] **DEPL-03**: Nutzer sieht in der App eine Versionsnummer, um zu erkennen, ob ein Update angekommen ist
- [ ] **DEPL-04**: Nutzer hat eine deutsche Schritt-für-Schritt-Anleitung (für Nicht-Programmierer), wie man die App kostenlos mit HTTPS online stellt und aktualisiert

### Mikrofon & Testseite (MIC)

- [ ] **MIC-01**: Nutzer kann mit einem Tipp das Mikrofon starten (funktioniert in Safari auf dem iPad)
- [ ] **MIC-02**: Nutzer sieht auf einer Testseite live den gehörten Ton (Notenname + Oktave) und die Abweichung in Cent
- [ ] **MIC-03**: Nutzer sieht auf der Testseite Lautstärke-Pegel und Erkennungssicherheit (Clarity)
- [ ] **MIC-04**: Nutzer sieht auf der Testseite technische Diagnosewerte (Abtastrate, Mikrofon-Einstellungen, Audio-Status), um iPad-Probleme zu erkennen
- [ ] **MIC-05**: Ein gehaltener Ton bleibt mindestens 2 Sekunden stabil erkannt (Sprachfilter des Browsers sind abgeschaltet)
- [ ] **MIC-06**: Nutzer sieht auf der Testseite ein Protokoll der erkannten Anschläge (eine Zeile pro angeschlagener Taste)

### Kalibrierung (KAL)

- [ ] **KAL-01**: Nutzer kann die Stimmung ausgleichen, indem er ein A spielt; die App merkt sich die Abweichung (begrenzt auf ca. ±60 Cent)
- [ ] **KAL-02**: Nutzer kann das Hintergrundgeräusch messen lassen; leisere Geräusche (Sprechen, Raum) lösen keine Töne aus
- [ ] **KAL-03**: Nutzer kann die Empfindlichkeit per Regler einstellen
- [ ] **KAL-04**: Kalibrierungs-Einstellungen bleiben nach Neuladen der App erhalten

### Tonerkennung (ERK)

- [ ] **ERK-01**: Die App erkennt jeden neuen Anschlag einzeln, auch bei wiederholten Tönen (E–E–E) und Wechseln (E–Dis–E–Dis–E) – genau ein Ereignis pro Anschlag
- [ ] **ERK-02**: Nachklingende Töne und gehaltenes Pedal lösen keine falschen neuen Anschläge aus
- [ ] **ERK-03**: Zwischen Anschlag und Reaktion der App vergehen bei Tönen ab C4 höchstens ca. 100 ms
- [ ] **ERK-04**: Nutzer kann eine Oktav-Toleranz einschalten: der richtige Ton in falscher Oktave zählt als richtig

### Stücke & Import (SONG)

- [ ] **SONG-01**: Nutzer findet in der Bibliothek 4–5 gemeinfreie klassische Stücke in einfacher, selbst gesetzter Fassung (Für Elise Anfang, Bach Präludium C-Dur, Satie Gymnopédie Nr. 1, Mondscheinsonate 1. Satz Anfang)
- [ ] **SONG-02**: Zu jedem mitgelieferten Stück sind Quelle und Lizenz in den Stückdaten hinterlegt (nur gemeinfreie / frei lizenzierte Quellen)
- [ ] **SONG-03**: Nutzer kann eine eigene MIDI-Datei hochladen und als fallende Noten üben
- [ ] **SONG-04**: Beim MIDI-Upload kann der Nutzer festlegen, welche Spur/Töne zur rechten bzw. linken Hand gehören (mit sinnvollem Vorschlag)
- [ ] **SONG-05**: Hochgeladene Stücke bleiben im Browser gespeichert und erscheinen in der Bibliothek

### Ansichten (ANS)

- [ ] **ANS-01**: Nutzer sieht fallende Noten über einer Klaviatur, die auf den Tonumfang des Stücks gezoomt ist
- [ ] **ANS-02**: Nutzer sieht das Stück in klassischer Notenschrift mit einem Cursor an der aktuellen Stelle
- [ ] **ANS-03**: Nutzer kann zwischen fallenden Noten und Notenschrift umschalten, ohne die Position im Stück zu verlieren
- [ ] **ANS-04**: Bei hochgeladenen MIDI-Dateien erklärt ein deutscher Hinweis, dass die Notenschrift nur für mitgelieferte Stücke verfügbar ist
- [ ] **ANS-05**: Nutzer sieht beim Üben immer eine „Was ich höre“-Anzeige mit dem gerade erkannten Ton

### Üben (UEB)

- [ ] **UEB-01**: Im Warte-Modus bleiben die Noten stehen, bis der richtige Ton erklingt; dann rückt die nächste Note nach (einstimmig, rechte Hand / Melodie)
- [ ] **UEB-02**: Nutzer kann Hände wählen: nur rechts, nur links, beide (bei „beide“ wartet die App in V1 auf die rechte Hand und zeigt die linke an)
- [ ] **UEB-03**: Nutzer kann das Tempo zwischen 30 % und 100 % einstellen
- [ ] **UEB-04**: Nutzer kann ein Metronom einschalten (standardmäßig sichtbar/blinkend, damit das Mikrofon kein Klicken hört)
- [ ] **UEB-05**: Nutzer kann einen Takt-Bereich auswählen, der in Schleife geübt wird
- [ ] **UEB-06**: Nutzer kann einen Durchgang neu starten und zum vorherigen/nächsten Takt springen

### Rückmeldung (RUECK)

- [ ] **RUECK-01**: Richtig gespielte Töne werden grün markiert, falsche rot (zusätzlich mit Symbol, nicht nur Farbe)
- [ ] **RUECK-02**: Nach jedem Durchgang sieht der Nutzer seine Trefferquote

### Speicherung (DAT)

- [ ] **DAT-01**: Fortschritt pro Stück (z. B. letzte Trefferquote, letzte Position) wird lokal im Browser gespeichert – ohne Login, ohne Server
- [ ] **DAT-02**: Einstellungen (Ansicht, Tempo, Hände, Kalibrierung) bleiben nach Neustart erhalten

### Oberfläche (UI)

- [x] **UI-01**: Die gesamte Oberfläche ist auf Deutsch
- [x] **UI-02**: Schrift und Bedienelemente sind aus ca. 60 cm Abstand gut lesbar und antippbar (Quer-Format auf dem iPad, unterer Bildschirmrand bleibt frei wegen Notenständer-Leiste)
- [ ] **UI-03**: Eigener Name, eigenes Design, keine Inhalte/Gestaltung von flowkey

### App-Installation (PWA)

- [ ] **PWA-01**: Nutzer kann die App auf dem iPad zum Home-Bildschirm hinzufügen und wie eine App starten
- [ ] **PWA-02**: Das Mikrofon funktioniert auch in der installierten App (oder es gibt eine klare deutsche Empfehlung, sie im Safari-Tab zu nutzen)
- [ ] **PWA-03**: Nach Unterbrechung (Bildschirmsperre, App-Wechsel, Anruf) kann der Nutzer das Mikrofon mit einem Tipp wieder starten („Mikrofon pausiert – tippen zum Fortsetzen“)
- [ ] **PWA-04**: Die App lädt auch offline (mitgelieferte Stücke inklusive)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Akkorde & beide Hände

- **AKK-01**: App erkennt erwartete Akkorde / beide Hände gleichzeitig per Erwartungsabgleich (vorher Spike mit Aufnahmen vom eigenen Klavier)
- **AKK-02**: Im Modus „beide Hände“ wartet die App auf beide Hände

### Statistik & Ziele

- **STAT-01**: Übungsstatistik (Zeit, Trefferquote über Zeit)
- **STAT-02**: Tagesziele
- **STAT-03**: Problemstellen pro Takt merken und anzeigen

### Komfort

- **KOMF-01**: Bildschirm bleibt beim Üben an (Wake Lock, iPadOS 18.4+)
- **KOMF-02**: Deutsche Notennamen (H, Cis, Dis …) mit Umschalter auf international
- **KOMF-03**: Quellen-/Lizenz-Seite in der App
- **KOMF-04**: Eigene MusicXML-Dateien hochladen (dann auch Notenschrift)
- **KOMF-05**: Fortschritt als Datei sichern / wiederherstellen
- **KOMF-06**: Hörbares Metronom mit Ausblendung in der Erkennung
- **KOMF-07**: Eigener App-Name und Logo

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Üben ohne Mikrofon (Noten laufen nur im Tempo) | Nutzer: ohne Zuhören ist die App wertlos |
| Automatisches Mitlaufen im Spieltempo / Position per Gehör finden | Warte-Modus reicht |
| Begleitung / andere Hand über Lautsprecher abspielen | Mikrofon würde es mithören |
| Rhythmus-Bewertung | Im Warte-Modus wird nur die Tonhöhe bewertet |
| MIDI automatisch in Notenschrift umwandeln | Im Browser nicht zuverlässig lösbar |
| Login, Konten, Server, Cloud-Sync | Nur für mich, alles lokal |
| MIDI-Keyboard-Anbindung | Ziel ist das akustische Klavier |
| Gamification (Punkte, Abzeichen, Ranglisten) | Nicht gewünscht |
| Inhalte von flowkey oder MuseScore.com-Uploads | Rechtlich ausgeschlossen |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | Phase 1 | Pending |
| DEPL-02 | Phase 1 | Pending |
| DEPL-03 | Phase 1 | Pending |
| DEPL-04 | Phase 11 | Pending |
| MIC-01 | Phase 2 | Pending |
| MIC-02 | Phase 2 | Pending |
| MIC-03 | Phase 2 | Pending |
| MIC-04 | Phase 2 | Pending |
| MIC-05 | Phase 2 | Pending |
| MIC-06 | Phase 4 | Pending |
| KAL-01 | Phase 3 | Pending |
| KAL-02 | Phase 3 | Pending |
| KAL-03 | Phase 3 | Pending |
| KAL-04 | Phase 3 | Pending |
| ERK-01 | Phase 4 | Pending |
| ERK-02 | Phase 4 | Pending |
| ERK-03 | Phase 4 | Pending |
| ERK-04 | Phase 7 | Pending |
| SONG-01 | Phase 10 | Pending |
| SONG-02 | Phase 5 | Pending |
| SONG-03 | Phase 10 | Pending |
| SONG-04 | Phase 10 | Pending |
| SONG-05 | Phase 10 | Pending |
| ANS-01 | Phase 6 | Pending |
| ANS-02 | Phase 8 | Pending |
| ANS-03 | Phase 8 | Pending |
| ANS-04 | Phase 10 | Pending |
| ANS-05 | Phase 6 | Pending |
| UEB-01 | Phase 7 | Pending |
| UEB-02 | Phase 9 | Pending |
| UEB-03 | Phase 9 | Pending |
| UEB-04 | Phase 9 | Pending |
| UEB-05 | Phase 9 | Pending |
| UEB-06 | Phase 9 | Pending |
| RUECK-01 | Phase 7 | Pending |
| RUECK-02 | Phase 7 | Pending |
| DAT-01 | Phase 10 | Pending |
| DAT-02 | Phase 9 | Pending |
| UI-01 | Phase 1 | Complete |
| UI-02 | Phase 1 | Complete |
| UI-03 | Phase 1 | Pending |
| PWA-01 | Phase 11 | Pending |
| PWA-02 | Phase 11 | Pending |
| PWA-03 | Phase 11 | Pending |
| PWA-04 | Phase 11 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-22*
*Last updated: 2026-11-22 after roadmap creation*
