const fs = require('fs');
const crypto = require('crypto');
const keyPath = '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const keyId = 'VTRT89PDB7';
const issuerId = '48e7c084-254c-49f5-8568-4607e99d4b6d';
const appId = '6776072672';
const versionId = '6ee9e137-1aef-4927-bf7a-74c0b1627530';
function b64url(input) { return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function jwt() { const now=Math.floor(Date.now()/1000); const h={alg:'ES256',kid:keyId,typ:'JWT'}; const p={iss:issuerId,iat:now-60,exp:now+20*60,aud:'appstoreconnect-v1'}; const i=`${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(p))}`; const sig=crypto.sign('sha256',Buffer.from(i),{key:fs.readFileSync(keyPath,'utf8'),dsaEncoding:'ieee-p1363'}); return `${i}.${b64url(sig)}`; }
async function api(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, { method, headers: { Authorization:`Bearer ${jwt()}`, 'Content-Type':'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) { const e = new Error(`${method} ${path} -> ${res.status}`); e.status=res.status; e.body=json; throw e; }
  return json;
}
async function step(out, name, fn) { try { out[name] = await fn(); return out[name]; } catch(e) { out.errors.push({step:name,status:e.status,body:e.body||e.message}); return null; } }
(async()=>{
  const out = { time:new Date().toISOString(), appId, versionId, errors: [] };
  out.beforeVersion = await step(out, 'beforeVersion', () => api('GET', `/v1/appStoreVersions/${versionId}?include=build&fields[appStoreVersions]=versionString,appStoreState,build&fields[builds]=version,processingState,uploadedDate`));
  out.beforeReviewSubmissions = await step(out, 'beforeReviewSubmissions', () => api('GET', `/v1/apps/${appId}/reviewSubmissions?limit=10&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`));

  // New Review Submission API. If creation is not allowed because an unresolved submission exists,
  // use the existing unresolved submission and try to add/update the item for the current app version.
  let reviewSubmissionId = null;
  const created = await step(out, 'createReviewSubmission', () => api('POST', '/v1/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: appId } } }
    }
  }));
  if (created?.data?.id) reviewSubmissionId = created.data.id;

  if (!reviewSubmissionId) {
    const existing = out.beforeReviewSubmissions?.data?.find(r => ['UNRESOLVED_ISSUES','READY_FOR_REVIEW','WAITING_FOR_REVIEW'].includes(r.attributes?.state));
    if (existing) reviewSubmissionId = existing.id;
  }
  out.chosenReviewSubmissionId = reviewSubmissionId;

  if (reviewSubmissionId) {
    out.createReviewSubmissionItem = await step(out, 'createReviewSubmissionItem', () => api('POST', '/v1/reviewSubmissionItems', {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: reviewSubmissionId } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } }
        }
      }
    }));
  }

  out.afterVersion = await step(out, 'afterVersion', () => api('GET', `/v1/appStoreVersions/${versionId}?include=build&fields[appStoreVersions]=versionString,appStoreState,build&fields[builds]=version,processingState,uploadedDate`));
  out.afterReviewSubmissions = await step(out, 'afterReviewSubmissions', () => api('GET', `/v1/apps/${appId}/reviewSubmissions?limit=10&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`));
  fs.writeFileSync('runlogs/submission/mixmatch-review-submit-new-api-result.json', JSON.stringify(out,null,2));
  const summary = {
    beforeState: out.beforeVersion?.data?.attributes?.appStoreState,
    beforeBuild: out.beforeVersion?.data?.relationships?.build?.data,
    createdReviewSubmission: out.createReviewSubmission?.data ? {id: out.createReviewSubmission.data.id, state: out.createReviewSubmission.data.attributes?.state} : null,
    chosenReviewSubmissionId: reviewSubmissionId,
    createdReviewSubmissionItem: out.createReviewSubmissionItem?.data ? {id: out.createReviewSubmissionItem.data.id, state: out.createReviewSubmissionItem.data.attributes?.state} : null,
    afterState: out.afterVersion?.data?.attributes?.appStoreState,
    afterBuild: out.afterVersion?.data?.relationships?.build?.data,
    afterReviewSubmissions: out.afterReviewSubmissions?.data?.map(r=>({id:r.id,state:r.attributes?.state,submittedDate:r.attributes?.submittedDate,items:r.relationships?.items?.data})),
    errors: out.errors,
  };
  console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e.message); if(e.body) console.error(JSON.stringify(e.body,null,2)); process.exit(1)});
