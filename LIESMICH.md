# Harry Hollywood Website

Statische Seite ohne Build-Schritt. Der Ordner lässt sich so, wie er ist, bei jedem Webhoster hochladen.

`index.html` enthält Design, Skript und Schriften direkt in der Datei und läuft auch per Drag and Drop im Browser. Änderungen an der Startseite gehören deshalb in `index.html`. `css/style.css` und `fonts/` werden nur noch von Impressum und Datenschutz genutzt.

Per Drag and Drop bleiben im Schriftzug die Animationen, und Videos öffnen sich auf YouTube, weil YouTube ohne Webadresse nicht einbettet. Über einen Webserver läuft alles auf der Seite selbst.

Projekte, Leistungen, Kunden und Kontaktdaten stammen von harryhollywood.com und dem YouTube-Kanal.

## Vor dem Go-live

1. **Showreel als Datei:** Im Schriftzug läuft das Reel noch über YouTube und lädt damit schon beim Seitenaufruf von Google. Besser: Harrys MP4 (ohne Ton, etwa 15 bis 30 MB) nach `video/reel.mp4` legen und in `index.html` bei `hero-film` `data-file="video/reel.mp4"` setzen. Dann entfällt die Verbindung zu YouTube beim Aufruf.
1. **Vorschaubilder:** Die Kacheln laden ihre Bilder noch von harryhollywood.com (`data-poster` in `index.html`). Bilder in einen Ordner `bilder/` legen und die Pfade anpassen, bevor die alte Seite abgeschaltet wird.
3. **Formular:** Ohne Formular-Dienst öffnet es eine fertige E-Mail. Für echten Versand die Adresse des Dienstes in `data-endpoint` am `<form>` eintragen.
4. **Rechtstexte:** Die grünen Felder in `datenschutz.html` ausfüllen und beide Rechtstexte prüfen lassen.
5. **Texte prüfen:** Der Text über Harry und die Kurzbeschreibungen der Leistungen sind neu formuliert.

## Lokal ansehen

```bash
npx serve@14 -l 4173 .
```
