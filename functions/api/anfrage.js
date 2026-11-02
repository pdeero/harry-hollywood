// Nimmt Anfragen aus dem Kontaktformular an und schickt sie an Harrys Postfach.
// Einstellungen bei Cloudflare Pages: RESEND_API_KEY und ALTCHA_SECRET (Pflicht),
// MAIL_TO und MAIL_FROM (optional). Ohne Spam-Schutz geht keine Mail raus.

import { verifySolution } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import { GUELTIG_MINUTEN } from '../_altcha.js';

const ANFRAGEN_PRO_STUNDE = 5;

const antwort = (status, ok) => new Response(JSON.stringify({ ok }), {
  status,
  headers: { 'content-type': 'application/json' },
});

const text = (form, name, max) => String(form.get(name) ?? '').trim().slice(0, max);

const hash = async (wert) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(wert));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Merkzettel im Cloudflare-Cache. Er gilt je Rechenzentrum, das reicht als Bremse.
const zettel = async (art, wert, env) => new Request(`https://www.harryhollywood.com/_${art}/${await hash(env.ALTCHA_SECRET + wert)}`);
const merke = (anfrage, inhalt, sekunden) => caches.default.put(anfrage, new Response(String(inhalt), {
  headers: { 'cache-control': `max-age=${sekunden}` },
}));

async function geloest(env, form) {
  let payload;
  try {
    payload = JSON.parse(atob(text(form, 'altcha', 8192)));
  } catch {
    return false;
  }
  try {
    const ergebnis = await verifySolution({ ...payload, deriveKey, hmacSignatureSecret: env.ALTCHA_SECRET });
    if (!ergebnis.verified) return false;
    // Jede Lösung gilt nur einmal.
    const benutzt = await zettel('benutzt', payload.challenge.signature, env);
    if (await caches.default.match(benutzt)) return false;
    await merke(benutzt, 1, GUELTIG_MINUTEN * 60);
    return true;
  } catch {
    return false;
  }
}

async function unterGrenze(env, request) {
  const ip = await zettel('ip', request.headers.get('cf-connecting-ip') ?? '', env);
  const treffer = await caches.default.match(ip);
  const anzahl = Number(treffer ? await treffer.text() : 0);
  if (anzahl >= ANFRAGEN_PRO_STUNDE) return false;
  await merke(ip, anzahl + 1, 3600);
  return true;
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.ALTCHA_SECRET) return antwort(503, false);

  let form;
  try {
    form = await request.formData();
  } catch {
    return antwort(400, false);
  }

  // Dieses Feld ist für Menschen unsichtbar. Ist es gefüllt, war es ein Bot.
  if (form.get('zusatz')) return antwort(200, true);

  const name = text(form, 'name', 200);
  const email = text(form, 'email', 200);
  const art = text(form, 'art', 100);
  const nachricht = text(form, 'nachricht', 5000);
  if (!name || !nachricht || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return antwort(400, false);
  if (!(await geloest(env, form))) return antwort(403, false);
  if (!(await unterGrenze(env, request))) return antwort(429, false);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM ?? 'Website Harry Hollywood <anfrage@harryhollywood.com>',
      to: [env.MAIL_TO ?? 'hello@harryhollywood.com'],
      reply_to: email,
      subject: `Anfrage: ${art || 'Website'} von ${name}`,
      text: `Name: ${name}\nE-Mail: ${email}\nThema: ${art}\n\n${nachricht}`,
    }),
  });
  return res.ok ? antwort(200, true) : antwort(502, false);
}
