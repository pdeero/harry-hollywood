// Meldet das CMS über GitHub an. Sveltia öffnet diese Adresse in einem kleinen Fenster, GitHub
// schickt das Fenster danach hierher zurück, und es reicht den Zugangsschlüssel an das CMS weiter.
// Einstellungen bei Cloudflare Pages: GITHUB_CLIENT_ID und GITHUB_CLIENT_SECRET (beide Pflicht).

// Nur diese Seiten bekommen den Schlüssel.
const SEITEN = [
  'https://www.harryhollywood.com',
  'https://harryhollywood.com',
  'https://harry-hollywood.pages.dev',
];

// Das fordert Sveltia mit auth_scope: public_repo an. Private Repositories der Nutzer bleiben außen vor.
const RECHTE = 'public_repo,user';

const COOKIE = 'github-anmeldung';
const cookie = (wert, sekunden) =>
  `${COOKIE}=${wert}; HttpOnly; Secure; SameSite=Lax; Path=/api/login; Max-Age=${sekunden}`;

const skript = (wert) => JSON.stringify(wert).replaceAll('<', '\\u003c');

// Antwort an das CMS. Der Ablauf (authorizing, dann authorization) ist von Sveltia vorgegeben.
// Der Absender einer Nachricht lässt sich nicht fälschen, darum entscheidet er über die Weitergabe.
function fenster(inhalt) {
  const status = inhalt.token ? 'success' : 'error';
  const nachricht = `authorization:github:${status}:${JSON.stringify({ provider: 'github', ...inhalt })}`;
  const html = `<!doctype html><script>
    addEventListener('message', ({ data, origin, source }) => {
      if (source === opener && data === 'authorizing:github' && ${skript(SEITEN)}.includes(origin)) {
        opener.postMessage(${skript(nachricht)}, origin);
      }
    });
    opener?.postMessage('authorizing:github', '*');
  </script>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': cookie('', 0),
    },
  });
}

function zuGithub(env) {
  const state = crypto.randomUUID().replaceAll('-', '');
  const anfrage = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, scope: RECHTE, state });
  return new Response(null, {
    status: 302,
    headers: {
      location: `https://github.com/login/oauth/authorize?${anfrage}`,
      'set-cookie': cookie(state, 600),
    },
  });
}

async function vonGithub(env, url, request) {
  const gemerkt = request.headers.get('cookie')?.match(new RegExp(`(?:^|; )${COOKIE}=([0-9a-f]{32})`))?.[1];
  if (url.searchParams.get('state') !== gemerkt) {
    return fenster({ error: 'Die Anmeldung wurde aus Sicherheitsgründen abgebrochen.', errorCode: 'CSRF_DETECTED' });
  }

  const code = url.searchParams.get('code');
  if (!code) return fenster({ error: 'GitHub hat die Anmeldung nicht bestätigt.', errorCode: 'AUTH_CODE_REQUEST_FAILED' });

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const { access_token: token } = await res.json();
    if (token) return fenster({ token });
  } catch {
    // Fällt auf die Fehlermeldung unten durch.
  }
  return fenster({ error: 'GitHub hat keinen Zugangsschlüssel geliefert.', errorCode: 'TOKEN_REQUEST_FAILED' });
}

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return fenster({ error: 'Der GitHub-Login ist nicht eingerichtet.', errorCode: 'MISCONFIGURED_CLIENT' });
  }
  const url = new URL(request.url);
  return url.searchParams.has('state') ? vonGithub(env, url, request) : zuGithub(env);
}
