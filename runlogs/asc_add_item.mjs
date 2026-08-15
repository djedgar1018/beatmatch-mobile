import { asc } from './asc_helper.mjs';

const REVIEW_SUB_ID = '39b5cc23-e43f-436f-9330-41c39bc8be88';
const VERSION_ID = 'e67b1aea-0eca-4e1f-b193-c9600a734522';

const res = await asc('POST', '/reviewSubmissionItems', {
  data: {
    type: 'reviewSubmissionItems',
    relationships: {
      reviewSubmission: { data: { type: 'reviewSubmissions', id: REVIEW_SUB_ID } },
      appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } },
    },
  },
});
console.log('=== add review submission item ===', res.status);
console.log(JSON.stringify(res.body, null, 2));
