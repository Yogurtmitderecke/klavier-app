// Alle sichtbaren Texte der App – ausschließlich Deutsch (UI-01).
// Typografie: deutsche Anführungszeichen „…“ und Halbgeviertstrich –.
export const TEXTE = {
  willkommen: {
    appTitel: 'Klavier-App',
    untertitel: 'Dein Übungsplatz am Klavier.',
    start: 'Start',
  },
  // Warnung ohne HTTPS (D-07 / DEPL-02); die Adresse kommt aus SECURE_URL.
  warnung: {
    titel: 'Achtung: Diese Seite ist nicht sicher verbunden.',
    text: 'Ohne sichere Verbindung (HTTPS) erlaubt der Browser kein Mikrofon – die App kann dein Klavier hier also nicht hören. Öffne die App stattdessen über diese sichere Adresse:',
  },
  uebersicht: {
    uebersichtTitel: 'Was möchtest du tun?',
    kacheln: {
      mikrofonTest: {
        titel: 'Mikrofon-Test',
        beschreibung: 'Prüfen, ob die App dein Klavier hört',
      },
      stueckeUeben: {
        titel: 'Stücke üben',
        beschreibung: 'Stücke mit fallenden Noten lernen',
      },
      einstellungen: {
        titel: 'Einstellungen',
        beschreibung: 'Stimmung, Empfindlichkeit, Ansicht',
      },
    },
    kommtBald: 'kommt bald',
    kommtBaldHinweis: 'Dieser Bereich kommt bald.',
  },
  // Zurück-Knopf aller Unterseiten (D-06): U+2039 + Leerzeichen + „Zurück“.
  zurueck: '‹ Zurück',
  // Mikrofon-Test (Phase 2): Knopf-Beschriftungen und Statustexte.
  mikrofonTest: {
    titel: 'Mikrofon-Test',
    knopf: {
      starten: 'Mikrofon starten',
      startet: 'Startet …',
      stoppen: 'Mikrofon stoppen',
      nochmal: 'Nochmal versuchen',
    },
    status: {
      idle: 'Das Mikrofon ist aus. Tippe auf „Mikrofon starten“.',
      startet: 'Bitte erlaube das Mikrofon, wenn Safari fragt.',
      laeuftOhneTon: 'Mikrofon läuft – spiel einen Ton.',
      laeuftMitTon: 'Mikrofon läuft.',
      gestoppt: 'Mikrofon gestoppt. Es hört nichts mehr.',
      hintergrund: 'Mikrofon gestoppt, weil die App im Hintergrund war.',
      fehler: 'Das Mikrofon konnte nicht starten.',
      unsicher: 'Ohne HTTPS geht das Mikrofon nicht.',
    },
    // Nicht-fatale Hinweise (MicHinweis), höchstens einer zugleich.
    hinweis: {
      keinSignal: {
        titel: 'Das Mikrofon liefert keine Daten.',
        text: 'Trenne Kopfhörer oder AirPods vom iPad. Tippe dann auf „Mikrofon stoppen“ und wieder auf „Mikrofon starten“.',
      },
      angehalten: {
        titel: 'Der Ton-Empfang ist noch angehalten.',
        text: 'Tippe auf „Mikrofon stoppen“ und dann noch einmal auf „Mikrofon starten“.',
      },
    },
    // Fehlerhilfe (MicFehler) je Fehlerart. Jeder Safari-Menüpfad ist ein eigener Text,
    // damit er nach dem iPad-Test (Plan 06) einzeln korrigiert werden kann.
    fehler: {
      verweigert: {
        titel: 'Die App darf das Mikrofon nicht benutzen.',
        intro: 'Safari hat den Zugriff auf das Mikrofon blockiert. So erlaubst du ihn wieder:',
        // Nur im Safari-Tab sinnvoll; beim Start vom Home-Bildschirm weggelassen.
        schrittSafari:
          'Tippe in Safari links in der Adressleiste auf das Seiten-Symbol, dann auf „Website-Einstellungen“. Stelle „Mikrofon“ auf „Erlauben“ oder „Fragen“.',
        schritte: [
          'Oder öffne die iPad-Einstellungen → Apps → Safari → Mikrofon und wähle „Fragen“ oder „Erlauben“.',
          'Tippe danach hier oben auf „Nochmal versuchen“.',
          // iOS 26.5.2: Safari meldet NotAllowedError, bis Safari bzw. das iPad neu startet.
          'Klappt es immer noch nicht: Schließe Safari ganz – im App-Umschalter nach oben wegwischen – und öffne die App neu. Hilft auch das nicht, starte das iPad neu.',
        ],
      },
      keinMikrofon: {
        titel: 'Es wurde kein Mikrofon gefunden.',
        intro: 'Das iPad meldet kein Mikrofon, das die App benutzen kann.',
        schritte: [
          'Trenne Kopfhörer, AirPods oder ein externes Mikrofon vom iPad.',
          'Tippe hier oben auf „Nochmal versuchen“.',
          'Klappt es immer noch nicht: Schließe Safari ganz und öffne die App neu.',
        ],
      },
      belegt: {
        titel: 'Das Mikrofon ist gerade belegt.',
        intro:
          'Eine andere App benutzt das Mikrofon – zum Beispiel ein Telefonat, FaceTime oder Sprachmemos.',
        schritte: [
          'Beende das Telefonat oder schließe die andere App.',
          'Tippe hier oben auf „Nochmal versuchen“.',
          'Klappt es immer noch nicht: Schließe Safari ganz – im App-Umschalter nach oben wegwischen – und öffne die App neu.',
        ],
      },
      unbekannt: {
        titel: 'Das Mikrofon ließ sich nicht starten.',
        intro:
          'Es ist ein unerwarteter Fehler aufgetreten. Die genaue Meldung steht in der Diagnose unter „Fehlerdetails“.',
        schritte: [
          'Tippe hier oben auf „Nochmal versuchen“.',
          'Klappt es nicht: Schließe Safari ganz und öffne die App neu. Hilft auch das nicht, starte das iPad neu.',
          'Mach ein Bildschirmfoto dieser Seite – die Diagnose hilft bei der Fehlersuche.',
        ],
      },
    },
    // Messkarte: gehörter Ton mit Cent, Hz und internationalem Namen.
    messkarte: {
      abschnitt: 'Gehörter Ton',
      platzhalter: '–',
      internationalPrefix: 'international: ',
      // Stimmgerät-Balken von −50 bis +50 Cent mit ±10-Cent-Band (D-08).
      tuner: {
        label: 'Abweichung in Cent',
        skala: ['−50', '−10', '0', '+10', '+50'],
      },
      // Messbalken für Pegel und Klarheit (MIC-03).
      pegel: {
        lautstaerke: 'Lautstärke',
        klarheit: 'Erkennungssicherheit',
      },
    },
  },
} as const
