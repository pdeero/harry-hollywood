# Harry Hollywood Website

Gebaut mit [Astro](https://astro.build), Inhalte werden über [Sveltia CMS](https://github.com/sveltia/sveltia-cms) gepflegt. Die Seite läuft auf Cloudflare Pages unter https://harry-hollywood.pages.dev/. Jede Änderung im `main`-Branch wird dort automatisch gebaut und veröffentlicht.

## Inhalte ändern

Unter `/admin/` anmelden und dort Videos, Texte, Bilder und Rechtstexte bearbeiten. Videos sortieren sich automatisch nach Datum, die drei neuesten Commercials stehen groß oben.

Die Anmeldung läuft über „Mit GitHub anmelden“ und braucht ein GitHub-Konto mit Schreibrechten auf dieses Repository. Dahinter stehen die Funktion `functions/api/login.js` und eine OAuth App in den GitHub-Einstellungen mit der Callback-Adresse `https://www.harryhollywood.com/api/login`. Deren Daten liegen bei Cloudflare Pages als `GITHUB_CLIENT_ID` und `GITHUB_CLIENT_SECRET`.

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

1. **Eigene Domain:** bei Cloudflare Pages verbinden, in `astro.config.mjs` `site` setzen und die Adressen in `public/admin/config.yml` anpassen.
2. **Login:** Harrys GitHub-Konto als Mitarbeiter in dieses Repository einladen.
3. **Showreel als Datei:** Im Schriftzug läuft das Reel noch über YouTube und erscheint deshalb erst nach Zustimmung im Cookie-Hinweis. Im CMS unter Startseite eine MP4-Datei hinterlegen, ohne Ton und etwa 15 bis 30 MB groß, dann läuft es für alle.
4. **Vorschaubilder:** Einige Videos nutzen Bilder von der alten Website. Diese Bilder ins Projekt holen, bevor die alte Seite abgeschaltet wird.
5. **Formular:** Ohne Formular-Dienst öffnet es eine fertige E-Mail. Für echten Versand die Adresse des Dienstes im CMS eintragen.
6. **Rechtstexte:** Beide Rechtstexte prüfen lassen. Wer einen Dienst ergänzt oder das Showreel als Datei einbindet, passt den Datenschutz mit an.
7. **Suchmaschinen:** Im CMS unter Startseite „Von Suchmaschinen ausblenden“ ausschalten.
