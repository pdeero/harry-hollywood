# Harry Hollywood Website

Gebaut mit [Astro](https://astro.build), Inhalte werden über [Sveltia CMS](https://github.com/sveltia/sveltia-cms) gepflegt. Die Seite läuft auf Cloudflare Pages unter https://harry-hollywood.pages.dev/. Jede Änderung im `main`-Branch wird dort automatisch gebaut und veröffentlicht.

## Inhalte ändern

Unter `/admin/` anmelden und dort Videos, Texte, Bilder und Rechtstexte bearbeiten. Videos sortieren sich automatisch nach Datum, die drei neuesten Commercials stehen groß oben.

Bis ein Login-Dienst eingerichtet ist, läuft die Anmeldung über einen persönlichen GitHub-Zugangsschlüssel.

## Wo was liegt

- `src/content/videos/`: ein Eintrag je Video
- `src/data/startseite.json`: alle Texte der Startseite
- `src/pages/impressum.md`, `src/pages/datenschutz.md`: Rechtstexte
- `src/pages/index.astro`: Aufbau der Startseite
- `src/styles/site.css`, `src/scripts/main.js`: Design und Greenscreen
- `public/bilder/`: Bilder
- `public/admin/`: Sveltia CMS

## Lokal ansehen

```bash
npm install
```

```bash
npm run dev
```

## Vor dem echten Start

1. **Eigene Domain:** in `astro.config.mjs` `site` setzen, `base` entfernen und die Adressen in `public/admin/config.yml` anpassen.
2. **Login:** einen Login-Dienst einrichten, damit sich Harry mit seinem GitHub-Konto anmelden kann.
3. **Showreel als Datei:** Im Schriftzug läuft das Reel noch über YouTube und lädt damit schon beim Seitenaufruf von Google. Im CMS unter Startseite eine MP4-Datei hinterlegen, ohne Ton und etwa 15 bis 30 MB groß.
4. **Vorschaubilder:** Einige Videos nutzen Bilder von der alten Website. Diese Bilder ins Projekt holen, bevor die alte Seite abgeschaltet wird.
5. **Formular:** Ohne Formular-Dienst öffnet es eine fertige E-Mail. Für echten Versand die Adresse des Dienstes im CMS eintragen.
6. **Rechtstexte:** Die offenen Punkte im Datenschutz ausfüllen und beide Rechtstexte prüfen lassen.
7. **Suchmaschinen:** Im CMS unter Startseite „Von Suchmaschinen ausblenden“ ausschalten.
