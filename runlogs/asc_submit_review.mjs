import { asc } from './asc_helper.mjs';

const VERSION_ID = 'e67b1aea-0eca-4e1f-b193-c9600a734522';

const res = await asc('POST', '/appStoreVersionSubmissions', {
  data: {
    type: 'appStoreVersionSubmissions',
    relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } } },
  },
});
console.log('=== submit for review ===', res.status);
console.log(JSON.stringify(res.body, null, 2));
