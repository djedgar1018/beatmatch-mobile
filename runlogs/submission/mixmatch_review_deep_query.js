const fs = require('fs');
const crypto = require('crypto');
const keyPath = '/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8';
const keyId = 'VTRT89PDB7';
const issuerId = '48e7c084-254c-49f5-8568-4607e99d4b6d';
const appId = '6776072672';
const versionId = '6ee9e137-1aef-4927-bf7a-74c0b1627530';
function b64url(input) { return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function jwt() { const now=Math.floor(Date.now()/1000); const h={alg:'ES256',kid:keyId,typ:'JWT'}; const p={iss:issuerId,iat:now-60,exp:now+20*60,aud:'appstoreconnect-v1'}; const i=`${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(p))}`; const sig=crypto.sign('sha256',Buffer.from(i),{key:fs.readFileSync(keyPath,'utf8'),dsaEncoding:'ieee-p1363'}); return `${i}.${b64url(sig)}`; }
async function api(path) { const res=await fetch(`https://api.appstoreconnect.apple.com${path}`,{headers:{Authorization:`Bearer ${jwt()}`}}); const text=await res.text(); let body; try{body=text?JSON.parse(text):null}catch{body=text}; if(!res.ok){throw new Error(`${res.status} ${path}: ${text.slice(0,1000)}`)} return body; }
(async()=>{
 const out={time:new Date().toISOString()};
 out.version=await api(`/v1/appStoreVersions/${versionId}?include=build,appStoreReviewDetail,appStoreVersionSubmission,appStoreVersionLocalizations&fields[appStoreVersions]=versionString,appStoreState,build,appStoreReviewDetail,appStoreVersionSubmission,appStoreVersionLocalizations&fields[builds]=version,processingState,uploadedDate&fields[appStoreReviewDetails]=contactFirstName,contactLastName,contactPhone,contactEmail,demoAccountName,notes&fields[appStoreVersionLocalizations]=description,keywords,marketingUrl,promotionalText,supportUrl,whatsNew`);
 out.reviewSubmissions=await api(`/v1/apps/${appId}/reviewSubmissions?limit=10&include=items&fields[reviewSubmissions]=platform,state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`);
 const included=out.reviewSubmissions.included||[];
 const itemIds=included.filter(x=>x.type==='reviewSubmissionItems').map(x=>x.id);
 out.items={};
 for (const id of itemIds) out.items[id]=await api(`/v1/reviewSubmissionItems/${encodeURIComponent(id)}?include=appStoreVersion&fields[reviewSubmissionItems]=state,appStoreVersion&fields[appStoreVersions]=versionString,appStoreState`);
 fs.writeFileSync('runlogs/submission/mixmatch-review-deep-query.json', JSON.stringify(out,null,2));
 console.log(JSON.stringify({version:{id:out.version.data.id,state:out.version.data.attributes.appStoreState,build:out.version.data.relationships.build.data},reviewSubmissions:out.reviewSubmissions.data.map(r=>({id:r.id,state:r.attributes.state,submittedDate:r.attributes.submittedDate,items:r.relationships.items.data})),included:included.map(i=>({type:i.type,id:i.id,state:i.attributes?.state,appStoreVersion:i.relationships?.appStoreVersion?.data}))},null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
