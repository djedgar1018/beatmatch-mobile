import fs from 'fs';
import crypto from 'crypto';

const OUT = 'runlogs/asc_mixmatch_submission_state_20260707.json';
const SUMMARY = 'runlogs/asc_mixmatch_submission_state_20260707.summary.txt';
const APP_ID = '6776072672';
const VERSION_STRING = '1.0';
const TARGET_BUILD = '32';
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH || '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const KEY_ID = process.env.EXPO_ASC_KEY_ID || 'VTRT89PDB7';
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID || '48e7c084-254c-49f5-8568-4607e99d4b6d';

if (!fs.existsSync(KEY_PATH)) throw new Error(`ASC key path missing: ${KEY_PATH}`);
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
function b64url(objOrBuf) {
  const buf = Buffer.isBuffer(objOrBuf) ? objOrBuf : Buffer.from(typeof objOrBuf === 'string' ? objOrBuf : JSON.stringify(objOrBuf));
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const input = `${b64url({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })}.${b64url({ iss: ISSUER_ID, iat: now, exp: now + 1190, aud: 'appstoreconnect-v1' })}`;
  const sig = crypto.sign('sha256', Buffer.from(input), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${input}.${b64url(sig)}`;
}
async function api(path, opts = {}) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, status: res.status, body };
}
async function main() {
  const out = { generatedAt: new Date().toISOString(), appId: APP_ID, versionString: VERSION_STRING, targetBuild: TARGET_BUILD, requests: {} };
  out.requests.app = await api(`/v1/apps/${APP_ID}`);
  out.requests.versions = await api(`/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build,appStoreVersionSubmission,appStoreReviewDetail&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  const version = out.requests.versions.ok ? out.requests.versions.body.data.find(v => v.attributes?.versionString === VERSION_STRING) : null;
  out.versionId = version?.id || null;
  out.versionState = version?.attributes?.appStoreState || null;
  out.versionBuildRelationship = version?.relationships?.build?.data || null;
  if (version?.id) {
    out.requests.versionSubmissionRelationship = await api(`/v1/appStoreVersions/${version.id}/appStoreVersionSubmission`);
    out.requests.reviewDetail = await api(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`);
  }
  out.requests.builds = await api(`/v1/builds?filter[app]=${APP_ID}&limit=20&sort=-uploadedDate&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption,minOsVersion,app`);
  out.build32 = out.requests.builds.ok ? out.requests.builds.body.data.find(b => b.attributes?.version === TARGET_BUILD) || null : null;
  out.requests.reviewSubmissions = await api(`/v1/apps/${APP_ID}/reviewSubmissions?limit=20&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  const lines = [];
  lines.push(`generatedAt=${out.generatedAt}`);
  lines.push(`app=${out.requests.app.ok ? `${out.requests.app.body.data.attributes?.name} ${out.requests.app.body.data.attributes?.bundleId}` : `ERROR ${out.requests.app.status}`}`);
  lines.push(`versionId=${out.versionId}`);
  lines.push(`versionState=${out.versionState}`);
  lines.push(`versionBuildRel=${JSON.stringify(out.versionBuildRelationship)}`);
  lines.push(`build32=${out.build32 ? JSON.stringify({id: out.build32.id, version: out.build32.attributes?.version, processingState: out.build32.attributes?.processingState, uploadedDate: out.build32.attributes?.uploadedDate}) : 'missing'}`);
  lines.push(`appStoreVersionSubmissionRel=${out.requests.versionSubmissionRelationship ? JSON.stringify({ok: out.requests.versionSubmissionRelationship.ok, status: out.requests.versionSubmissionRelationship.status, data: out.requests.versionSubmissionRelationship.body?.data || null, errors: out.requests.versionSubmissionRelationship.body?.errors || null}) : 'not_queried'}`);
  const rs = out.requests.reviewSubmissions.ok ? out.requests.reviewSubmissions.body.data.map(r => ({id:r.id, state:r.attributes?.state, submittedDate:r.attributes?.submittedDate, items:r.relationships?.items?.data})) : `ERROR ${out.requests.reviewSubmissions.status}`;
  lines.push(`reviewSubmissions=${JSON.stringify(rs)}`);
  fs.writeFileSync(SUMMARY, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}
main().catch(e => { console.error(e.stack || String(e)); process.exit(1); });
