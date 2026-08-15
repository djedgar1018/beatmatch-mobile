const fs = require('fs');
const crypto = require('crypto');
const keyPath = '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const keyId = 'VTRT89PDB7';
const issuerId = '48e7c084-254c-49f5-8568-4607e99d4b6d';
const appId = '6776072672';
const versionId = '6ee9e137-1aef-4927-bf7a-74c0b1627530';
const oldSubmissionId = '4b63ce5d-0c84-4d92-9f3d-127c449be635';
const oldItemId = 'NGI2M2NlNWQtMGM4NC00ZDkyLTlmM2QtMTI3YzQ0OWJlNjM1fDZ8ODg2NDU3MDM5';
function b64url(input) { return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function jwt() { const now=Math.floor(Date.now()/1000); const h={alg:'ES256',kid:keyId,typ:'JWT'}; const p={iss:issuerId,iat:now-60,exp:now+20*60,aud:'appstoreconnect-v1'}; const i=`${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(p))}`; const sig=crypto.sign('sha256',Buffer.from(i),{key:fs.readFileSync(keyPath,'utf8'),dsaEncoding:'ieee-p1363'}); return `${i}.${b64url(sig)}`; }
async function api(method,path,body){const res=await fetch(`https://api.appstoreconnect.apple.com${path}`,{method,headers:{Authorization:`Bearer ${jwt()}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const text=await res.text();let json;try{json=text?JSON.parse(text):null}catch{json=text};if(!res.ok){const e=new Error(`${method} ${path} -> ${res.status}`);e.status=res.status;e.body=json;throw e;}return json;}
async function step(out,name,fn){try{out[name]=await fn();return out[name]}catch(e){out.errors.push({step:name,status:e.status,body:e.body||e.message});return null}}
(async()=>{
 const out={time:new Date().toISOString(),errors:[]};
 out.before=await step(out,'before',()=>api('GET',`/v1/apps/${appId}/reviewSubmissions?limit=10&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`));
 const patchBodies = [
  {name:'patchItemRelationshipsOnly', body:{data:{type:'reviewSubmissionItems',id:oldItemId,relationships:{appStoreVersion:{data:{type:'appStoreVersions',id:versionId}},reviewSubmission:{data:{type:'reviewSubmissions',id:oldSubmissionId}}}}}},
  {name:'patchItemStateReady', body:{data:{type:'reviewSubmissionItems',id:oldItemId,attributes:{state:'READY_FOR_REVIEW'},relationships:{appStoreVersion:{data:{type:'appStoreVersions',id:versionId}},reviewSubmission:{data:{type:'reviewSubmissions',id:oldSubmissionId}}}}}},
  {name:'patchItemStateWaiting', body:{data:{type:'reviewSubmissionItems',id:oldItemId,attributes:{state:'WAITING_FOR_REVIEW'},relationships:{appStoreVersion:{data:{type:'appStoreVersions',id:versionId}},reviewSubmission:{data:{type:'reviewSubmissions',id:oldSubmissionId}}}}}},
 ];
 for (const p of patchBodies) {
   if (out[p.name]) continue;
   const r = await step(out,p.name,()=>api('PATCH',`/v1/reviewSubmissionItems/${encodeURIComponent(oldItemId)}`,p.body));
   if (r) break;
 }
 out.after=await step(out,'after',()=>api('GET',`/v1/apps/${appId}/reviewSubmissions?limit=10&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`));
 out.version=await step(out,'version',()=>api('GET',`/v1/appStoreVersions/${versionId}?include=build&fields[appStoreVersions]=versionString,appStoreState,build&fields[builds]=version,processingState,uploadedDate`));
 fs.writeFileSync('runlogs/submission/mixmatch-update-old-review-item-result.json',JSON.stringify(out,null,2));
 console.log(JSON.stringify({versionState:out.version?.data?.attributes?.appStoreState,versionBuild:out.version?.data?.relationships?.build?.data,reviewSubmissions:out.after?.data?.map(r=>({id:r.id,state:r.attributes?.state,submittedDate:r.attributes?.submittedDate,items:r.relationships?.items?.data})),included:out.after?.included?.map(i=>({type:i.type,id:i.id,state:i.attributes?.state})),errors:out.errors},null,2));
})().catch(e=>{console.error(e.message); if(e.body) console.error(JSON.stringify(e.body,null,2)); process.exit(1)});
