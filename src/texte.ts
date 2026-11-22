// Alle sichtbaren Texte der App – ausschließlich Deutsch (UI-01).
// Typografie: deutsche Anführungszeichen „…“ und Halbgeviertstrich –.
export const TEXTE = {
  willkommen: {
    appTitel: 'Klavier-App',
    untertitel: 'Dein Übungsplatz am Klavier.',
    start: 'Start',
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
} as const
