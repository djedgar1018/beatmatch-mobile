import { asc } from './asc_helper.mjs';
const APP_ID = '6776072672';

const versions = await asc('GET', `/apps/${APP_ID}/appStoreVersions?limit=5`);
console.log('=== versions ===');
for (const v of versions.body.data || []) {
  console.log(v.attributes.versionString, v.attributes.appStoreState, v.attributes.appVersionState, v.id);
}

const builds = await asc('GET', `/apps/${APP_ID}/builds?limit=5`);
console.log('\n=== builds ===');
for (const b of builds.body.data || []) {
  console.log('version', b.attributes.version, b.attributes.processingState, b.attributes.uploadedDate, b.id);
}

const subs = await asc('GET', `/apps/${APP_ID}/reviewSubmissions?limit=5`);
console.log('\n=== review submissions ===');
for (const s of subs.body.data || []) {
  console.log(s.attributes.state, s.attributes.platform, s.attributes.submittedDate, s.id);
}
