import { asc } from './asc_helper.mjs';

const APP_ID = '6785379395';
const BUILD_ID = 'a41c4c6e-f228-4dc7-ab9d-6355000e4778'; // build 31, VALID

// Step 1: create the 1.2.1 App Store version
const createRes = await asc('POST', '/appStoreVersions', {
  data: {
    type: 'appStoreVersions',
    attributes: { platform: 'IOS', versionString: '1.2.1' },
    relationships: { app: { data: { type: 'apps', id: APP_ID } } },
  },
});
console.log('=== create version ===', createRes.status);
console.log(JSON.stringify(createRes.body, null, 2));
