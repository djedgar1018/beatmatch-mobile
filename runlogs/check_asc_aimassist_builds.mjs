import fs from 'fs';
import crypto from 'crypto';

const KEY_ID = process.env.EXPO_ASC_KEY_ID;
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID;
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH;
const APP_ID = '6785379395';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = { iss: ISSUER_ID, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' };
const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
const signer = crypto.createSign('SHA256');
signer.update(signingInput);
signer.end();
const sigB64 = base64url(signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }));
const token = `${signingInput}.${sigB64}`;

const res = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/builds?limit=10`, {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.json();
console.log('status:', res.status);
for (const b of (body.data || [])) {
  console.log({
    id: b.id,
    version: b.attributes.version,
    processingState: b.attributes.processingState,
    uploadedDate: b.attributes.uploadedDate,
    expired: b.attributes.expired,
  });
}
if (body.errors) console.log(JSON.stringify(body.errors, null, 2));
