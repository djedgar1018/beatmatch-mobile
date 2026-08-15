import fs from 'fs';
import crypto from 'crypto';

const KEY_ID = process.env.EXPO_ASC_KEY_ID;
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID;
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH;

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function makeToken() {
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: ISSUER_ID, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
  const signer = crypto.createSign('SHA256');
  signer.update(signingInput);
  signer.end();
  const sigB64 = base64url(signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }));
  return `${signingInput}.${sigB64}`;
}

export async function asc(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${makeToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, body: json || text };
}
