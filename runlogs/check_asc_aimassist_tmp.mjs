import fs from 'fs';
import crypto from 'crypto';

const KEY_ID = process.env.EXPO_ASC_KEY_ID;
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID;
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH;
const APP_ID = '6785379395'; // aim-assist ASC App ID

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = { iss: ISSUER_ID, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' };

const headerB64 = base64url(JSON.stringify(header));
const payloadB64 = base64url(JSON.stringify(payload));
const signingInput = `${headerB64}.${payloadB64}`;

const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
const signer = crypto.createSign('SHA256');
signer.update(signingInput);
signer.end();
const derSig = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
const sigB64 = base64url(derSig);
const token = `${signingInput}.${sigB64}`;

const res = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/appStoreVersions?limit=10`, {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.json();
console.log('status:', res.status);
console.log(JSON.stringify(body, null, 2));
