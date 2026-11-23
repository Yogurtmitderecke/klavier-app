# Roadmap: Klavier-App (Arbeitstitel)

## Overview

Wir bauen die App in 11 kleinen Schritten. Zuerst kommt die App ins Internet (mit HTTPS), damit sie auf dem iPad am Klavier läuft. Danach klären wir das Wichtigste und Schwierigste: Hört das Mikrofon die Töne des akustischen Klaviers zuverlässig? (Testseite, Kalibrierung, Anschlag-Erkennung.) Dann bekommt die App ihr erstes Stück (Für Elise Anfang), zeigt es als fallende Noten und lernt den Warte-Modus – damit ist das Ziel von Version 1 erreichbar. Danach folgen Notenschrift, Übungs-Werkzeuge, die Bibliothek mit eigenen MIDI-Dateien und zum Schluss die Installation als App auf dem iPad samt deutscher Anleitung zum Online-Stellen. Nach jeder Phase gibt es etwas Konkretes am Klavier auszuprobieren.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Grundgerüst und Online-Adresse** - Leere deutsche App mit großer Schrift ist per HTTPS auf dem iPad erreichbar (completed 2026-11-23)
- [ ] **Phase 2: Mikrofon-Testseite** - Die App zeigt live, welchen Ton sie vom Klavier hört (Entscheidung: klappt es?)
- [ ] **Phase 3: Kalibrierung** - Stimmung ausgleichen, Hintergrundgeräusche ausblenden, Empfindlichkeit einstellen
- [ ] **Phase 4: Anschlag-Erkennung** - Jeder Tastenanschlag wird genau einmal erkannt, auch bei Wiederholungen
- [ ] **Phase 5: Erstes Stück (Für Elise)** - Für Elise Anfang ist als selbst gesetzte Fassung in der App und als Notenliste prüfbar
- [ ] **Phase 6: Fallende Noten** - Für Elise fällt als Noten über einer Klaviatur herunter
- [ ] **Phase 7: Warte-Modus** - Die Noten warten, bis der richtige Ton gespielt wird (Ziel von Version 1)
- [ ] **Phase 8: Notenschrift** - Dasselbe Stück in klassischer Notenschrift mit mitlaufendem Cursor
- [ ] **Phase 9: Übungs-Werkzeuge** - Hände wählen, Tempo, Metronom, Takt-Schleife, Springen
- [ ] **Phase 10: Bibliothek und eigene MIDI-Dateien** - Alle mitgelieferten Stücke, eigene MIDI-Dateien, gespeicherter Fortschritt
- [ ] **Phase 11: Als App installieren und Anleitung** - Auf dem iPad installierbar, offline nutzbar, Mikrofon nach Pause wieder startbar, deutsche Hosting-Anleitung

## Phase Details

### Phase 1: Grundgerüst und Online-Adresse

**Goal**: Der Nutzer kann die (noch fast leere) App über eine sichere HTTPS-Adresse auf dem iPad und dem Laptop öffnen; die Oberfläche ist deutsch, groß und gut lesbar.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DEPL-01, DEPL-02, DEPL-03, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):

  1. Der Nutzer öffnet eine HTTPS-Adresse (z. B. GitHub Pages) in Safari auf dem iPad und auf dem Laptop und sieht die Startseite der App.
  2. Alle Texte sind auf Deutsch; Schrift und Knöpfe sind im Querformat aus ca. 60 cm gut lesbar und antippbar, der untere Bildschirmrand bleibt frei; Name und Design sind eigen (nichts von flowkey).
  3. Wird die Seite ohne HTTPS geöffnet, erscheint eine verständliche deutsche Meldung, warum das Mikrofon dann nicht geht.
  4. In der App ist eine Versionsnummer sichtbar; nach einer Änderung zeigt das iPad die neue Nummer.
  5. Am Klavier testen: iPad auf den Notenständer stellen, Adresse öffnen, auf „Start“ tippen – Text ist aus Spielposition gut lesbar.

**Plans**: 5 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking skeleton: scaffold, test infra, branch main, German welcome -> Start -> overview (Zustand, UI-SPEC tokens)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Build version label top-right + own icon (DEPL-03, UI-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — GitHub Pages deploy via Actions, GitHub setup checkpoint, first live HTTPS deploy (DEPL-01)
- [x] 01-04-PLAN.md — Overview tiles, Mikrofon-Test placeholder with Zurück, no-HTTPS warning (DEPL-02, D-04..D-07)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md — Release 0.2.0 and device/piano test on the iPad, record iPadOS version

**UI hint**: yes

### Phase 2: Mikrofon-Testseite

**Goal**: Der Nutzer sieht auf einer Testseite live, welchen Ton die App über das Mikrofon vom akustischen Klavier hört – damit ist früh geklärt, ob die Kernidee auf dem iPad funktioniert.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MIC-01, MIC-02, MIC-03, MIC-04, MIC-05
**Success Criteria** (what must be TRUE):

  1. Ein Tipp auf „Mikrofon starten“ startet das Mikrofon in Safari auf dem iPad (Erlaubnis-Abfrage erscheint, danach läuft die Anzeige).
  2. Die Testseite zeigt live Notenname, Oktave und Abweichung in Cent, dazu Lautstärke-Pegel und Erkennungssicherheit (Clarity).
  3. Die Testseite zeigt Diagnosewerte (Abtastrate, Mikrofon-Einstellungen wie abgeschaltete Sprachfilter, Audio-Status), sodass iPad-Probleme sichtbar werden.
  4. Am Klavier testen: Einzelne Tasten in verschiedenen Lagen (auch C2/C3) anschlagen – der richtige Ton erscheint; ein gehaltenes A4 bleibt mindestens 2 Sekunden stabil bei ca. 440 Hz (±10 Cent).
  5. Am Klavier testen: dasselbe einmal im Safari-Tab und einmal vom Home-Bildschirm aus probieren und das Ergebnis notieren.

**Plans**: 6 plans

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Mic an/aus: Mikrofon-Test page, one-tap start (AudioContext resumed in the tap, voice filters off), Stop/Zurück release the mic (MIC-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — pitchy legitimacy checkpoint + install, live German note name/octave/cents/Hz (MIC-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Stable held note (smoother), level + clarity meters, tuner bar with ±10-cent band (MIC-03, MIC-05)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — German error help with retry, no-HTTPS warning, hints, background stop (MIC-01)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 02-05-PLAN.md — Diagnose panel (sample rates, filters, audio state, launch mode) beside the live values (MIC-04)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 02-06-PLAN.md — Release 0.3.0 and piano checklist twice (Safari tab + home screen), go/no-go (MIC-01..05)

**UI hint**: yes
**Research flag**: ja – pitchy vs. YIN am echten Klavier, Fensterlänge für tiefe Töne, `getSettings()` auf dem iPad

### Phase 3: Kalibrierung

**Goal**: Der Nutzer kann die App auf sein Klavier und seinen Raum einstellen: Verstimmung ausgleichen, Hintergrundgeräusche ausblenden, Empfindlichkeit regeln – und die Einstellungen bleiben gespeichert.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: KAL-01, KAL-02, KAL-03, KAL-04
**Success Criteria** (what must be TRUE):

  1. Der Nutzer spielt ein A, tippt auf „Stimmung übernehmen“, und die App zeigt danach für dieses A ungefähr 0 Cent Abweichung (Ausgleich auf ca. ±60 Cent begrenzt).
  2. Nach „Ruhe messen“ (einige Sekunden still sein) lösen Sprechen und Raumgeräusche auf der Testseite keine Töne mehr aus.
  3. Mit einem Empfindlichkeits-Regler lässt sich einstellen, wie leise ein Ton sein darf, um noch erkannt zu werden.
  4. Nach Neuladen der App sind Stimmungsausgleich, Ruhepegel und Empfindlichkeit noch da.
  5. Am Klavier testen: kalibrieren, dann sprechen und leise spielen – nur die Klaviertöne erscheinen, und die Cent-Anzeige bleibt nahe 0.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Anschlag-Erkennung

**Goal**: Die App erkennt jeden einzelnen Tastenanschlag genau einmal – auch bei wiederholten Tönen, nachklingenden Saiten und Pedal – schnell genug für den Warte-Modus.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ERK-01, ERK-02, ERK-03, MIC-06
**Success Criteria** (what must be TRUE):

  1. Die Testseite zeigt ein Protokoll mit genau einer Zeile pro angeschlagener Taste.
  2. Am Klavier testen: E–E–E ergibt genau 3 Zeilen, E–Dis–E–Dis–E genau 5 Zeilen.
  3. Am Klavier testen: Ein Ton ausklingen lassen bzw. mit Pedal halten erzeugt keine zusätzlichen Zeilen.
  4. Bei Tönen ab C4 erscheint die Zeile spürbar sofort (höchstens ca. 100 ms nach dem Anschlag).

**Plans**: TBD
**UI hint**: yes
**Research flag**: ja – Schwellwerte für Anschlag-Erkennung, Annahme-Regel, Test-Aufnahmen vom eigenen Klavier; am Ende entscheiden, ob die linke Hand (Bass) verlässlich genug ist

### Phase 5: Erstes Stück (Für Elise)

**Goal**: Die App enthält „Für Elise“ (Anfang) als selbst gesetzte, gemeinfreie Fassung mit hinterlegter Quelle und Lizenz; der Nutzer kann die eingelesenen Noten als Liste prüfen.
**Mode:** mvp
**Depends on**: Phase 1 (kann parallel zu Phase 3/4 laufen)
**Requirements**: SONG-02
**Success Criteria** (what must be TRUE):

  1. Der Nutzer kann „Für Elise (Anfang)“ in der App auswählen und sieht eine Notenliste (Takt, Ton, Hand, Dauer).
  2. Zum Stück werden Quelle und Lizenz angezeigt (gemeinfreie Vorlage, selbst gesetzt).
  3. Am Klavier testen: Notenliste neben die gedruckten Noten legen und die ersten Takte langsam Ton für Ton nachspielen – Reihenfolge, Töne und Hände stimmen überein.

**Plans**: TBD
**UI hint**: yes

### Phase 6: Fallende Noten

**Goal**: Der Nutzer sieht ein Stück als fallende Noten über einer Klaviatur, die auf den Tonumfang des Stücks gezoomt ist, und sieht dabei immer, welchen Ton die App gerade hört.
**Mode:** mvp
**Depends on**: Phase 5, Phase 2
**Requirements**: ANS-01, ANS-05
**Success Criteria** (what must be TRUE):

  1. Für Elise läuft als fallende Noten über einer Klaviatur; die Klaviatur zeigt nur den Tonbereich des Stücks, groß genug zum Erkennen der Tasten.
  2. Eine „Was ich höre“-Anzeige zeigt beim Üben immer den gerade erkannten Ton.
  3. Die Animation läuft auf dem iPad flüssig, der untere Bildschirmrand bleibt frei.
  4. Am Klavier testen: Für Elise bei 50 % fallen lassen und mitspielen – die „Was ich höre“-Anzeige zeigt die gespielten Töne.

**Plans**: TBD
**UI hint**: yes

### Phase 7: Warte-Modus

**Goal**: Im Warte-Modus bleiben die Noten stehen, bis der richtige Ton erklingt; richtige und falsche Töne werden markiert, und am Ende steht die Trefferquote. Damit ist das Ziel von Version 1 erreichbar: Für Elise (Anfang) komplett und sauber durchspielen.
**Mode:** mvp
**Depends on**: Phase 4, Phase 6
**Requirements**: UEB-01, RUECK-01, RUECK-02, ERK-04
**Success Criteria** (what must be TRUE):

  1. Die fallenden Noten bleiben stehen, bis der richtige Ton (rechte Hand / Melodie) gespielt wird; dann rückt die nächste Note nach.
  2. Richtige Töne werden grün mit Häkchen markiert, falsche rot mit Kreuz (nicht nur Farbe).
  3. Nach jedem Durchgang erscheint die Trefferquote, mit großen Knöpfen „Nochmal“ / „Weiter“.
  4. Eine einschaltbare Oktav-Toleranz lässt den richtigen Ton in falscher Oktave als richtig zählen.
  5. Am Klavier testen: Für Elise (Anfang) komplett im Warte-Modus durchspielen – ohne falsches Weiterspringen und ohne Hängenbleiben, auch mit Pedal und bei E–Dis–E–Dis–E.

**Plans**: TBD
**UI hint**: yes

### Phase 8: Notenschrift

**Goal**: Der Nutzer kann ein mitgeliefertes Stück in klassischer Notenschrift üben; ein Cursor folgt der aktuellen Stelle, und er kann jederzeit zu den fallenden Noten wechseln, ohne die Stelle zu verlieren.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: ANS-02, ANS-03
**Success Criteria** (what must be TRUE):

  1. Für Elise wird als Notenschrift angezeigt (gut lesbar, 2–3 Notenzeilen auf dem Bildschirm), mit einem Cursor an der aktuellen Stelle.
  2. Im Warte-Modus rückt der Cursor mit jedem richtig gespielten Ton weiter, auch über Pausen und Haltebögen.
  3. Ein Umschalter wechselt zwischen fallenden Noten und Notenschrift; die Position im Stück bleibt dabei erhalten.
  4. Am Klavier testen: Für Elise aus der Notenschrift spielen, in der Mitte zu den fallenden Noten wechseln und an derselben Stelle weiterspielen.

**Plans**: TBD
**UI hint**: yes
**Research flag**: ja – OpenSheetMusicDisplay 3.0 Cursor, Einfärben von Noten, Verhalten bei Wiederholungen

### Phase 9: Übungs-Werkzeuge

**Goal**: Der Nutzer kann gezielt üben: Hände wählen, Tempo einstellen, Metronom nutzen, Takte in Schleife üben und im Stück springen – und seine Einstellungen bleiben erhalten.
**Mode:** mvp
**Depends on**: Phase 8
**Requirements**: UEB-02, UEB-03, UEB-04, UEB-05, UEB-06, DAT-02
**Success Criteria** (what must be TRUE):

  1. Der Nutzer wählt „nur rechts“, „nur links“ oder „beide“ (bei „beide“ wartet die App auf die rechte Hand und zeigt die linke an).
  2. Ein Tempo-Regler (30–100 %) und ein Metronom (standardmäßig sichtbar/blinkend, ohne Klicken) sind verfügbar.
  3. Der Nutzer wählt einen Takt-Bereich, der in Schleife läuft; er kann neu starten und zum vorherigen/nächsten Takt springen.
  4. Ansicht, Tempo, Hände und Kalibrierung sind nach Neustart der App noch so eingestellt wie zuvor.
  5. Am Klavier testen: Takte 1–4 von Für Elise mit der linken Hand bei 60 % in Schleife üben.

**Plans**: TBD
**UI hint**: yes

### Phase 10: Bibliothek und eigene MIDI-Dateien

**Goal**: Der Nutzer findet alle mitgelieferten gemeinfreien Stücke in einer Bibliothek, kann eigene MIDI-Dateien hochladen und üben, und sein Fortschritt wird lokal gespeichert.
**Mode:** mvp
**Depends on**: Phase 9
**Requirements**: SONG-01, SONG-03, SONG-04, SONG-05, ANS-04, DAT-01
**Success Criteria** (what must be TRUE):

  1. Die Bibliothek zeigt 4–5 selbst gesetzte gemeinfreie Stücke (Für Elise Anfang, Bach Präludium C-Dur, Satie Gymnopédie Nr. 1, Mondscheinsonate 1. Satz Anfang).
  2. Der Nutzer lädt eine eigene MIDI-Datei hoch, legt mit einem Vorschlag der App fest, was rechte und linke Hand ist, und übt sie als fallende Noten; bei der Notenschrift erscheint ein deutscher Hinweis, dass diese nur für mitgelieferte Stücke verfügbar ist.
  3. Hochgeladene Stücke stehen nach Neuladen weiterhin in der Bibliothek.
  4. Pro Stück werden letzte Trefferquote und letzte Position gespeichert und nach Neustart angezeigt – ohne Login, ohne Server.
  5. Am Klavier testen: ein neues Stück aus der Bibliothek (z. B. Bach Präludium) und eine eigene MIDI-Datei im Warte-Modus spielen, App neu laden, Fortschritt ist noch da.

**Plans**: TBD
**UI hint**: yes

### Phase 11: Als App installieren und Anleitung

**Goal**: Der Nutzer kann die App auf dem iPad wie eine echte App installieren, offline starten und nach Unterbrechungen mit einem Tipp weiterüben; eine deutsche Anleitung erklärt, wie man die App selbst kostenlos mit HTTPS online stellt und aktualisiert.
**Mode:** mvp
**Depends on**: Phase 10
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, DEPL-04
**Success Criteria** (what must be TRUE):

  1. Der Nutzer fügt die App über „Zum Home-Bildschirm“ hinzu und startet sie mit eigenem Symbol wie eine App; das Mikrofon funktioniert dort – oder die App empfiehlt klar auf Deutsch, sie im Safari-Tab zu nutzen.
  2. Nach Bildschirmsperre, App-Wechsel oder Anruf erscheint „Mikrofon pausiert – tippen zum Fortsetzen“, und ein Tipp startet das Mikrofon wieder.
  3. Die App samt mitgelieferten Stücken lädt auch ohne Internet.
  4. Eine deutsche Schritt-für-Schritt-Anleitung für Nicht-Programmierer erklärt, wie man die App kostenlos mit HTTPS online stellt und Updates veröffentlicht.
  5. Am Klavier testen: App vom Home-Bildschirm starten, 15 Minuten üben, iPad sperren und entsperren, mit einem Tipp weiterspielen; dann im Flugmodus starten.

**Plans**: TBD
**UI hint**: yes
**Research flag**: ja – iPadOS-Version des Nutzers, Mikrofon-Erlaubnis in installierter App, Wake Lock, Service-Worker-Updates

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Grundgerüst und Online-Adresse | 5/5 | Complete   | 2026-11-23 |
| 2. Mikrofon-Testseite | 5/6 | In Progress|  |
| 3. Kalibrierung | 0/TBD | Not started | - |
| 4. Anschlag-Erkennung | 0/TBD | Not started | - |
| 5. Erstes Stück (Für Elise) | 0/TBD | Not started | - |
| 6. Fallende Noten | 0/TBD | Not started | - |
| 7. Warte-Modus | 0/TBD | Not started | - |
| 8. Notenschrift | 0/TBD | Not started | - |
| 9. Übungs-Werkzeuge | 0/TBD | Not started | - |
| 10. Bibliothek und eigene MIDI-Dateien | 0/TBD | Not started | - |
| 11. Als App installieren und Anleitung | 0/TBD | Not started | - |
