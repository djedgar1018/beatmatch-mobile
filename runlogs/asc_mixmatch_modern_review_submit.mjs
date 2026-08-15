import fs from 'fs';
import crypto from 'crypto';

const APP_ID = '6776072672';
const VERSION_STRING = '1.0';
const TARGET_BUILD = '32';
const KEY_PATH = process.env.EXPO_ASC_API_KEY_PATH || '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const KEY_ID = process.env.EXPO_ASC_KEY_ID || 'VTRT89PDB7';
const ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID || '48e7c084-254c-49f5-8568-4607e99d4b6d';
const JSONLOG = 'runlogs/asc_mixmatch_modern_review_submit_20260707.json';
const SUMMARY = 'runlogs/asc_mixmatch_modern_review_submit_20260707.summary.txt';

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
async function api(method, path, body) {
  const startedAt = new Date().toISOString();
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { ok: res.ok, status: res.status, method, path, requestBody: body || null, body: parsed, startedAt, endedAt: new Date().toISOString() };
}
function summarizeErrors(r) {
  const errs = r?.body?.errors;
  if (!Array.isArray(errs)) return '';
  return errs.map(e => `${e.status || ''} ${e.code || ''}: ${e.detail || e.title || JSON.stringify(e)}`).join(' | ');
}
function latest(data, state) {
  return (data || []).find(r => r.attributes?.state === state) || null;
}
async function main() {
  const out = { generatedAt: new Date().toISOString(), appId: APP_ID, versionString: VERSION_STRING, targetBuild: TARGET_BUILD, commandsEquivalent: [], requests: [], result: {}, blocker: null };
  out.commandsEquivalent.push(`EXPO_ASC_API_KEY_PATH=${KEY_PATH} EXPO_ASC_KEY_ID=${KEY_ID} EXPO_ASC_ISSUER_ID=${ISSUER_ID} node runlogs/asc_mixmatch_modern_review_submit.mjs`);

  const versions = await api('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  out.requests.push(versions);
  if (!versions.ok) throw new Error(`version query failed ${versions.status}`);
  const version = versions.body.data.find(v => v.attributes?.versionString === VERSION_STRING);
  out.result.versionBefore = version ? { id: version.id, state: version.attributes?.appStoreState, buildRel: version.relationships?.build?.data || null } : null;
  if (!version) throw new Error(`version ${VERSION_STRING} missing`);

  const builds = await api('GET', `/v1/builds?filter[app]=${APP_ID}&limit=20&sort=-uploadedDate&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  out.requests.push(builds);
  if (!builds.ok) throw new Error(`build query failed ${builds.status}`);
  const build32 = builds.body.data.find(b => b.attributes?.version === TARGET_BUILD);
  out.result.build32 = build32 ? { id: build32.id, version: build32.attributes?.version, processingState: build32.attributes?.processingState, uploadedDate: build32.attributes?.uploadedDate, expired: build32.attributes?.expired } : null;
  if (!build32 || build32.attributes?.processingState !== 'VALID') throw new Error(`build ${TARGET_BUILD} not VALID`);
  if (version.relationships?.build?.data?.id !== build32.id) {
    const link = await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: build32.id } });
    out.requests.push(link);
    if (!link.ok) throw new Error(`build link failed ${link.status}: ${summarizeErrors(link)}`);
  }

  const reviewListBefore = await api('GET', `/v1/apps/${APP_ID}/reviewSubmissions?limit=20&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`);
  out.requests.push(reviewListBefore);
  if (!reviewListBefore.ok) throw new Error(`reviewSubmissions query failed ${reviewListBefore.status}`);
  out.result.reviewSubmissionsBefore = reviewListBefore.body.data.map(r => ({ id: r.id, state: r.attributes?.state, submittedDate: r.attributes?.submittedDate, items: r.relationships?.items?.data || [] }));

  let reviewSubmission = null;
  // Prefer a non-terminal draft-ish review submission if Apple has one; otherwise create a new one.
  const reusableStates = new Set(['READY_FOR_REVIEW', 'PREPARE_FOR_SUBMISSION', 'WAITING_FOR_REVIEW']);
  reviewSubmission = reviewListBefore.body.data.find(r => reusableStates.has(r.attributes?.state)) || null;
  if (!reviewSubmission) {
    const createReview = await api('POST', `/v1/reviewSubmissions`, {
      data: {
        type: 'reviewSubmissions',
        attributes: { platform: 'IOS' },
        relationships: { app: { data: { type: 'apps', id: APP_ID } } }
      }
    });
    out.requests.push(createReview);
    if (!createReview.ok) {
      out.result.createReviewSubmissionError = { status: createReview.status, errors: createReview.body?.errors || createReview.body };
      out.blocker = `create reviewSubmissions failed ${createReview.status}: ${summarizeErrors(createReview)}`;
    } else {
      reviewSubmission = createReview.body.data;
    }
  }

  if (reviewSubmission && !out.blocker) {
    out.result.reviewSubmissionId = reviewSubmission.id;
    // Try the documented item-create flow first.
    const createItem = await api('POST', `/v1/reviewSubmissionItems`, {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: reviewSubmission.id } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } }
        }
      }
    });
    out.requests.push(createItem);
    if (!createItem.ok) {
      out.result.createReviewSubmissionItemError = { status: createItem.status, errors: createItem.body?.errors || createItem.body };
      // If item already exists, proceed to submit; otherwise block after trying relationship endpoint fallback.
      const errText = summarizeErrors(createItem);
      if (!/already|exists|duplicate/i.test(errText)) {
        const relItem = await api('POST', `/v1/reviewSubmissions/${reviewSubmission.id}/relationships/items`, {
          data: [{ type: 'reviewSubmissionItems', id: version.id }]
        });
        out.requests.push(relItem);
        if (!relItem.ok) out.blocker = `create reviewSubmissionItems failed ${createItem.status}/${relItem.status}: ${errText} || ${summarizeErrors(relItem)}`;
      }
    } else {
      out.result.reviewSubmissionItemId = createItem.body.data?.id;
    }
  }

  if (reviewSubmission && !out.blocker) {
    // Modern submit action endpoint. Apple docs expose this as POST /v1/reviewSubmissions/{id}/submit.
    const submit = await api('POST', `/v1/reviewSubmissions/${reviewSubmission.id}/submit`, undefined);
    out.requests.push(submit);
    if (!submit.ok) {
      out.result.submitReviewSubmissionError = { status: submit.status, errors: submit.body?.errors || submit.body };
      // Try PATCH state fallback if docs/schema differ.
      const patchSubmit = await api('PATCH', `/v1/reviewSubmissions/${reviewSubmission.id}`, { data: { type: 'reviewSubmissions', id: reviewSubmission.id, attributes: { state: 'SUBMITTED' } } });
      out.requests.push(patchSubmit);
      if (!patchSubmit.ok) out.blocker = `submit reviewSubmission failed ${submit.status}/${patchSubmit.status}: ${summarizeErrors(submit)} || ${summarizeErrors(patchSubmit)}`;
      else out.result.submitFallback = { status: patchSubmit.status, data: patchSubmit.body?.data || null };
    } else {
      out.result.submit = { status: submit.status, data: submit.body?.data || null };
    }
  }

  const reviewListAfter = await api('GET', `/v1/apps/${APP_ID}/reviewSubmissions?limit=20&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`);
  out.requests.push(reviewListAfter);
  out.result.reviewSubmissionsAfter = reviewListAfter.ok ? reviewListAfter.body.data.map(r => ({ id: r.id, state: r.attributes?.state, submittedDate: r.attributes?.submittedDate, items: r.relationships?.items?.data || [] })) : { status: reviewListAfter.status, errors: reviewListAfter.body?.errors || reviewListAfter.body };
  const versionsAfter = await api('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10&include=build&fields[appStoreVersions]=platform,versionString,appStoreState,build&fields[builds]=version,uploadedDate,processingState,expired,usesNonExemptEncryption`);
  out.requests.push(versionsAfter);
  if (versionsAfter.ok) {
    const vAfter = versionsAfter.body.data.find(v => v.attributes?.versionString === VERSION_STRING);
    out.result.versionAfter = vAfter ? { id: vAfter.id, state: vAfter.attributes?.appStoreState, buildRel: vAfter.relationships?.build?.data || null } : null;
  }

  fs.writeFileSync(JSONLOG, JSON.stringify(out, null, 2));
  const lines = [];
  lines.push(`generatedAt=${out.generatedAt}`);
  lines.push(`versionBefore=${JSON.stringify(out.result.versionBefore)}`);
  lines.push(`build32=${JSON.stringify(out.result.build32)}`);
  lines.push(`reviewSubmissionId=${out.result.reviewSubmissionId || 'none'}`);
  lines.push(`reviewSubmissionItemId=${out.result.reviewSubmissionItemId || 'none'}`);
  lines.push(`submit=${JSON.stringify(out.result.submit || out.result.submitFallback || null)}`);
  lines.push(`blocker=${out.blocker || 'none'}`);
  lines.push(`reviewSubmissionsAfter=${JSON.stringify(out.result.reviewSubmissionsAfter)}`);
  lines.push(`versionAfter=${JSON.stringify(out.result.versionAfter)}`);
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
