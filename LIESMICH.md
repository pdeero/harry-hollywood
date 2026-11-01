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
3. **Formular:** Ohne Formular-Dienst öffnet es eine fertige E-Mail. Für echten Versand die Adresse des Dienstes im CMS eintragen.
4. **Rechtstexte:** Beide Rechtstexte prüfen lassen. Wer einen Dienst ergänzt, passt den Datenschutz mit an.
5. **Suchmaschinen:** Im CMS unter Startseite „Von Suchmaschinen ausblenden“ ausschalten.

## Filme und Datenschutz

Die Seite braucht keinen Cookie-Hinweis, solange beim Aufruf nichts von YouTube lädt. Showreel und Vorschaubilder liegen deshalb als eigene Dateien in `public/bilder/`. YouTube lädt erst, wenn jemand einen Film anklickt. Bei neuen Videos im CMS ein eigenes Vorschaubild hochladen. Cloudflare Pages nimmt Dateien nur bis 25 MB an, das Showreel muss darunter bleiben.
