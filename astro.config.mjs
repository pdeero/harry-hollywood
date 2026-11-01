import { defineConfig } from 'astro/config';

// Cloudflare Pages setzt beim Bauen CF_PAGES, dort liegt die Seite direkt auf der Hauptadresse.
// Für die eigene Domain später: site auf https://www.harryhollywood.com setzen.
const cloudflare = Boolean(process.env.CF_PAGES);

export default defineConfig({
  site: cloudflare ? 'https://harry-hollywood.pages.dev' : 'https://pdeero.github.io',
  base: cloudflare ? undefined : '/harry-hollywood',
});
