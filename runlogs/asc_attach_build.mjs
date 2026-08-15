import { asc } from './asc_helper.mjs';

const VERSION_ID = 'e67b1aea-0eca-4e1f-b193-c9600a734522';
const BUILD_ID = 'a41c4c6e-f228-4dc7-ab9d-6355000e4778';

const res = await asc('PATCH', `/appStoreVersions/${VERSION_ID}/relationships/build`, {
  data: { type: 'builds', id: BUILD_ID },
});
console.log('=== attach build ===', res.status);
console.log(JSON.stringify(res.body, null, 2));
