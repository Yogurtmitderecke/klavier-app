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
  mikrofonPlatzhalter: {
    titel: 'Mikrofon-Test',
    text: 'Hier entsteht als Nächstes der Mikrofon-Test. Das Mikrofon ist noch nicht eingeschaltet. Tippe auf „Zurück“, um zur Übersicht zu gelangen.',
  },
} as const
