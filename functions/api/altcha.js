// Gibt dem Formular eine frische Rechenaufgabe. Die Signatur beweist später, dass sie von hier stammt.

import { createChallenge, randomInt } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import { AUFGABE, GUELTIG_MINUTEN, ZAEHLER } from '../_altcha.js';

export async function onRequestGet({ env }) {
  if (!env.ALTCHA_SECRET) return new Response(null, { status: 503 });
  const challenge = await createChallenge({
    ...AUFGABE,
    counter: randomInt(...ZAEHLER),
    deriveKey,
    expiresAt: new Date(Date.now() + GUELTIG_MINUTEN * 60_000),
    hmacSignatureSecret: env.ALTCHA_SECRET,
  });
  return new Response(JSON.stringify(challenge), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
