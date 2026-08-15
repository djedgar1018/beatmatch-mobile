import { asc } from './asc_helper.mjs';

const REVIEW_SUB_ID = '39b5cc23-e43f-436f-9330-41c39bc8be88';

const res = await asc('PATCH', `/reviewSubmissions/${REVIEW_SUB_ID}`, {
  data: {
    type: 'reviewSubmissions',
    id: REVIEW_SUB_ID,
    attributes: { submitted: true },
  },
});
console.log('=== finalize submit ===', res.status);
console.log(JSON.stringify(res.body, null, 2));
