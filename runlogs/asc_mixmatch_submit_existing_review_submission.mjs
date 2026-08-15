import fs from 'fs';
import crypto from 'crypto';

const APP_ID = '6776072672';
const VERSION_STRING = '1.0';
const TARGET_BUILD = '32';
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH || '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const KEY_ID = process.env.EXPO_ASC_KEY_ID || 'VTRT89PDB7';
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID || '48e7c084-254c-49f5-8568-4607e99d4b6d';
const JSONLOG = 'runlogs/asc_mixmatch_submit_existing_review_submission_20260707.json';
const SUMMARY = 'runlogs/asc_mixmatch_submit_existing_review_submission_20260707.summary.txt';
const FINAL = 'runlogs/mixmatch_final_submission_package_20260707.md';

const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
function b64url(objOrBuf) {
  const buf = Buffer.isBuffer(objOrBuf) ? objOrBuf : Buffer.from(typeof objOrBuf === 'string' ? objOrBuf : JSON.stringify(objOrBuf));
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const input = `${b64url({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })}.${b64url({ iss: ISSUER_ID, iat: now, exp: now + 1190, aud: 'appstoreconnect-v1' })}`;
  return `${input}.${b64url(crypto.sign('sha256', Buffer.from(input), { key: privateKey, dsaEncoding: 'ieee-p1363' }))}`;
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
  if (!Array.isArray(errs)) return r?.body ? JSON.stringify(r.body).slice(0, 900) : '';
  return errs.map(e => `${e.status || ''} ${e.code || ''}: ${e.detail || e.title || ''}`).join(' | ');
}
function compactReview(r) {
  return { id: r.id, state: r.attributes?.state, submittedDate: r.attributes?.submittedDate, items: r.relationships?.items?.data || [] };
}
async function main() {
  const out = { generatedAt: new Date().toISOString(), appId: APP_ID, versionString: VERSION_STRING, targetBuild: TARGET_BUILD, requests: [], result: {}, blocker: null };
  const commands = [
    'EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 EXPO_ASC_KEY_ID=VTRT89PDB7 EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d node runlogs/asc_mixmatch_submit_existing_review_submission.mjs'
  ];

  const versions = await api('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  out.requests.push(versions);
  if (!versions.ok) throw new Error(`version query failed ${versions.status}: ${errSummary(versions)}`);
  const version = versions.body.data.find(v => v.attributes?.versionString === VERSION_STRING);
  if (!version) throw new Error(`version ${VERSION_STRING} not found`);
  out.result.versionBefore = { id: version.id, state: version.attributes?.appStoreState, buildRel: version.relationships?.build?.data || null };

  const builds = await api('GET', `/v1/builds?filter[app]=${APP_ID}&limit=20&sort=-uploadedDate&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  out.requests.push(builds);
  if (!builds.ok) throw new Error(`build query failed ${builds.status}: ${errSummary(builds)}`);
  const build32 = builds.body.data.find(b => b.attributes?.version === TARGET_BUILD);
  out.result.build32 = build32 ? { id: build32.id, version: build32.attributes?.version, processingState: build32.attributes?.processingState, uploadedDate: build32.attributes?.uploadedDate, expired: build32.attributes?.expired } : null;
  if (!build32 || build32.attributes?.processingState !== 'VALID') throw new Error(`ASC build ${TARGET_BUILD} missing or not VALID`);
  if (version.relationships?.build?.data?.id !== build32.id) {
    const link = await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: build32.id } });
    out.requests.push(link);
    if (!link.ok) throw new Error(`build link failed ${link.status}: ${errSummary(link)}`);
    out.result.linkedBuild = true;
  } else {
    out.result.linkedBuild = false;
  }

  const reviewsBefore = await api('GET', `/v1/apps/${APP_ID}/reviewSubmissions?limit=20&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`);
  out.requests.push(reviewsBefore);
  if (!reviewsBefore.ok) throw new Error(`review submissions query failed ${reviewsBefore.status}: ${errSummary(reviewsBefore)}`);
  out.result.reviewSubmissionsBefore = reviewsBefore.body.data.map(compactReview);

  const active = reviewsBefore.body.data.find(r => ['UNRESOLVED_ISSUES', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'READY_FOR_REVIEW'].includes(r.attributes?.state));
  if (!active) {
    out.blocker = 'No active/reusable reviewSubmission found; create-new path should be used, but previous create attempts returned a blocker. See modern/legacy submit logs.';
  } else {
    out.result.targetReviewSubmission = compactReview(active);
    const submit = await api('POST', `/v1/reviewSubmissions/${active.id}/submit`);
    out.requests.push(submit);
    if (submit.ok) {
      out.result.submitExistingReviewSubmission = { status: submit.status, data: submit.body?.data || null };
    } else {
      out.result.submitExistingReviewSubmissionError = { status: submit.status, errors: submit.body?.errors || submit.body };
      out.blocker = `POST /v1/reviewSubmissions/${active.id}/submit failed ${submit.status}: ${errSummary(submit)}`;
    }
  }

  const reviewsAfter = await api('GET', `/v1/apps/${APP_ID}/reviewSubmissions?limit=20&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`);
  out.requests.push(reviewsAfter);
  out.result.reviewSubmissionsAfter = reviewsAfter.ok ? reviewsAfter.body.data.map(compactReview) : { status: reviewsAfter.status, errors: reviewsAfter.body?.errors || reviewsAfter.body };
  const versionsAfter = await api('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  out.requests.push(versionsAfter);
  if (versionsAfter.ok) {
    const vAfter = versionsAfter.body.data.find(v => v.attributes?.versionString === VERSION_STRING);
    out.result.versionAfter = vAfter ? { id: vAfter.id, state: vAfter.attributes?.appStoreState, buildRel: vAfter.relationships?.build?.data || null } : null;
  }

  fs.writeFileSync(JSONLOG, JSON.stringify(out, null, 2));
  const lines = [
    `generatedAt=${out.generatedAt}`,
    `command=${commands[0]}`,
    `versionBefore=${JSON.stringify(out.result.versionBefore)}`,
    `build32=${JSON.stringify(out.result.build32)}`,
    `targetReviewSubmission=${JSON.stringify(out.result.targetReviewSubmission || null)}`,
    `submitExistingReviewSubmission=${JSON.stringify(out.result.submitExistingReviewSubmission || null)}`,
    `blocker=${out.blocker || 'none'}`,
    `reviewSubmissionsAfter=${JSON.stringify(out.result.reviewSubmissionsAfter)}`,
    `versionAfter=${JSON.stringify(out.result.versionAfter)}`,
  ];
  fs.writeFileSync(SUMMARY, lines.join('\n') + '\n');
  const final = `# MixMatch Final Submission Package — 2026-07-07\n\n` +
`## App\n- Name: Mix-Match\n- Bundle ID: com.ten18.mixnmatch\n- ASC app ID: ${APP_ID}\n- Target App Store version: ${VERSION_STRING}\n\n` +
`## Build\n- EAS build ID: aa979355-e3ca-4dc6-8b10-f295d21291c5\n- Version/build: 1.0 (32)\n- ASC build ID / delivery UUID: ${out.result.build32?.id || 'unknown'}\n- ASC build processing: ${out.result.build32?.processingState || 'unknown'}\n- Commit containing release: 9245aac3f0814df2b98e01da5d52fa3ed5d85891\n\n` +
`## Commands run\n- ${commands[0]}\n- Earlier gates: npx tsc --noEmit; npx expo-doctor; npx expo export --platform ios; eas build -p ios --profile production --non-interactive --no-wait; eas submit -p ios --profile production --id aa979355-e3ca-4dc6-8b10-f295d21291c5 --non-interactive --wait; direct altool upload as fallback.\n\n` +
`## ASC/API result\n- Version before submit attempt: ${JSON.stringify(out.result.versionBefore)}\n- Build 32: ${JSON.stringify(out.result.build32)}\n- Target review submission: ${JSON.stringify(out.result.targetReviewSubmission || null)}\n- Submit response: ${JSON.stringify(out.result.submitExistingReviewSubmission || null)}\n- Blocker: ${out.blocker || 'none'}\n- Review submissions after: ${JSON.stringify(out.result.reviewSubmissionsAfter)}\n- Version after: ${JSON.stringify(out.result.versionAfter)}\n\n` +
`## Logs\n- JSON: ${JSONLOG}\n- Summary: ${SUMMARY}\n`;
  fs.writeFileSync(FINAL, final);
  console.log(lines.join('\n'));
  if (out.blocker) process.exit(20);
}
main().catch(e => {
  fs.writeFileSync(JSONLOG, JSON.stringify({ generatedAt: new Date().toISOString(), crashed: true, message: e.message, stack: e.stack }, null, 2));
  fs.writeFileSync(SUMMARY, `crashed=${e.message}\n`);
  fs.writeFileSync(FINAL, `# MixMatch Final Submission Package — 2026-07-07\n\nCrashed: ${e.message}\n`);
  console.error(e.stack || String(e));
  process.exit(1);
});
