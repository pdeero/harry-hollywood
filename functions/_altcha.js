// Gemeinsame Einstellungen für die Rechenaufgabe im Formular.
// Mehr Rechenaufwand bremst Bots stärker, lässt aber auch alte Handys länger rechnen.

export const AUFGABE = { algorithm: 'PBKDF2/SHA-256', cost: 5_000 };
export const ZAEHLER = [2_000, 4_000];
export const GUELTIG_MINUTEN = 20;
