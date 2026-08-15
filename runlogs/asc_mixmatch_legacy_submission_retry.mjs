import fs from 'fs';
import crypto from 'crypto';

const APP_ID = '6776072672';
const VERSION_STRING = '1.0';
const TARGET_BUILD = '32';
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH || '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const KEY_ID = process.env.EXPO_ASC_KEY_ID || 'VTRT89PDB7';
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID || '48e7c084-254c-49f5-8568-4607e99d4b6d';
const JSONLOG = 'runlogs/asc_mixmatch_legacy_submission_retry_20260707.json';
const SUMMARY = 'runlogs/asc_mixmatch_legacy_submission_retry_20260707.summary.txt';

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
async function api(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { ok: res.ok, status: res.status, method, path, requestBody: body || null, body: parsed };
}
function errSummary(r) {
  const errs = r?.body?.errors;
  if (!Array.isArray(errs)) return r?.body ? JSON.stringify(r.body).slice(0, 700) : '';
  return errs.map(e => `${e.status || ''} ${e.code || ''}: ${e.detail || e.title || ''}`).join(' | ');
}
async function main() {
  const out = { generatedAt: new Date().toISOString(), appId: APP_ID, versionString: VERSION_STRING, targetBuild: TARGET_BUILD, requests: [], result: {}, blocker: null };

  const versions = await api('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build,appStoreVersionSubmission&fields[builds]=version,uploadedDate,processingState,expired`);
  out.requests.push(versions);
  if (!versions.ok) throw new Error(`versions query failed ${versions.status}: ${errSummary(versions)}`);
  const version = versions.body.data.find(v => v.attributes?.versionString === VERSION_STRING);
  if (!version) throw new Error(`version ${VERSION_STRING} not found`);
  out.result.versionBefore = { id: version.id, state: version.attributes?.appStoreState, buildRel: version.relationships?.build?.data || null };

  const builds = await api('GET', `/v1/builds?filter[app]=${APP_ID}&limit=20&sort=-uploadedDate&fields[builds]=version,uploadedDate,processingState,expired`);
  out.requests.push(builds);
  if (!builds.ok) throw new Error(`builds query failed ${builds.status}: ${errSummary(builds)}`);
  const build32 = builds.body.data.find(b => b.attributes?.version === TARGET_BUILD);
  out.result.build32 = build32 ? { id: build32.id, version: build32.attributes?.version, processingState: build32.attributes?.processingState, uploadedDate: build32.attributes?.uploadedDate } : null;
  if (!build32 || build32.attributes?.processingState !== 'VALID') throw new Error(`build ${TARGET_BUILD} missing or not VALID`);
  if (version.relationships?.build?.data?.id !== build32.id) {
    const link = await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: build32.id } });
    out.requests.push(link);
    if (!link.ok) throw new Error(`link build failed ${link.status}: ${errSummary(link)}`);
  }

  const existing = await api('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionSubmission`);
  out.requests.push(existing);
  out.result.existingAppStoreVersionSubmission = existing.ok ? existing.body.data : { status: existing.status, error: existing.body?.errors || existing.body };
  if (existing.ok && existing.body?.data?.id) {
    const del = await api('DELETE', `/v1/appStoreVersionSubmissions/${existing.body.data.id}`);
    out.requests.push(del);
    out.result.deletedExistingAppStoreVersionSubmission = { id: existing.body.data.id, ok: del.ok, status: del.status, error: del.ok ? null : del.body?.errors || del.body };
    if (!del.ok) out.blocker = `delete existing appStoreVersionSubmission failed ${del.status}: ${errSummary(del)}`;
  }

  if (!out.blocker) {
    const create = await api('POST', `/v1/appStoreVersionSubmissions`, {
      data: {
        type: 'appStoreVersionSubmissions',
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } }
      }
    });
    out.requests.push(create);
    if (create.ok) out.result.createdAppStoreVersionSubmission = { id: create.body?.data?.id, type: create.body?.data?.type };
    else {
      out.result.createAppStoreVersionSubmissionError = { status: create.status, error: create.body?.errors || create.body };
      out.blocker = `create appStoreVersionSubmission failed ${create.status}: ${errSummary(create)}`;
    }
  }

  const versionsAfter = await api('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build,appStoreVersionSubmission&fields[builds]=version,uploadedDate,processingState,expired`);
  out.requests.push(versionsAfter);
  if (versionsAfter.ok) {
    const vAfter = versionsAfter.body.data.find(v => v.attributes?.versionString === VERSION_STRING);
    out.result.versionAfter = vAfter ? { id: vAfter.id, state: vAfter.attributes?.appStoreState, buildRel: vAfter.relationships?.build?.data || null } : null;
  }
  const relAfter = await api('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionSubmission`);
  out.requests.push(relAfter);
  out.result.appStoreVersionSubmissionAfter = relAfter.ok ? relAfter.body.data : { status: relAfter.status, error: relAfter.body?.errors || relAfter.body };

  fs.writeFileSync(JSONLOG, JSON.stringify(out, null, 2));
  const lines = [
    `generatedAt=${out.generatedAt}`,
    `versionBefore=${JSON.stringify(out.result.versionBefore)}`,
    `build32=${JSON.stringify(out.result.build32)}`,
    `existingAppStoreVersionSubmission=${JSON.stringify(out.result.existingAppStoreVersionSubmission)}`,
    `deletedExistingAppStoreVersionSubmission=${JSON.stringify(out.result.deletedExistingAppStoreVersionSubmission || null)}`,
    `createdAppStoreVersionSubmission=${JSON.stringify(out.result.createdAppStoreVersionSubmission || null)}`,
    `appStoreVersionSubmissionAfter=${JSON.stringify(out.result.appStoreVersionSubmissionAfter || null)}`,
    `versionAfter=${JSON.stringify(out.result.versionAfter)}`,
    `blocker=${out.blocker || 'none'}`,
  ];
  fs.writeFileSync(SUMMARY, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  if (out.blocker) process.exit(20);
}
main().catch(e => {
  fs.writeFileSync(JSONLOG, JSON.stringify({ generatedAt: new Date().toISOString(), crashed: true, message: e.message, stack: e.stack }, null, 2));
  fs.writeFileSync(SUMMARY, `crashed=${e.message}\n`);
  console.error(e.stack || String(e));
  process.exit(1);
});
