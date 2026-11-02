// Nimmt Anfragen aus dem Kontaktformular an und schickt sie an Harrys Postfach.
// Einstellungen bei Cloudflare Pages: RESEND_API_KEY und TURNSTILE_SECRET (Pflicht),
// MAIL_TO und MAIL_FROM (optional). Ohne Spam-Schutz geht keine Mail raus.

const SEITEN = ['harryhollywood.com', 'harry-hollywood.pages.dev'];

const antwort = (status, ok) => new Response(JSON.stringify({ ok }), {
  status,
  headers: { 'content-type': 'application/json' },
});

const text = (form, name, max) => String(form.get(name) ?? '').trim().slice(0, max);

async function spamfrei(env, form, request) {
  const token = text(form, 'cf-turnstile-response', 4096);
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  body.append('remoteip', request.headers.get('cf-connecting-ip') ?? '');
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    const seite = String(data.hostname ?? '');
    return data.success === true
      && data.action === 'anfrage'
      && SEITEN.some((s) => seite === s || seite.endsWith(`.${s}`));
  } catch {
    // Ist die Prüfung nicht erreichbar, geht lieber nichts durch als alles.
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET) return antwort(503, false);

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
  if (!(await spamfrei(env, form, request))) return antwort(403, false);

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
