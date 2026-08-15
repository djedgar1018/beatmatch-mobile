import { asc } from './asc_helper.mjs';

const res = await asc('POST', '/reviewSubmissions', {
  data: {
    type: 'reviewSubmissions',
    attributes: { platform: 'IOS' },
    relationships: { app: { data: { type: 'apps', id: '6785379395' } } },
  },
});
console.log('=== create review submission ===', res.status);
console.log(JSON.stringify(res.body, null, 2));
