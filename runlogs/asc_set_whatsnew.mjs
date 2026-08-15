import { asc } from './asc_helper.mjs';

const LOC_ID = 'ca5c3410-bf5f-44f6-8304-d5ee3918f50c';

const res = await asc('PATCH', `/appStoreVersionLocalizations/${LOC_ID}`, {
  data: {
    type: 'appStoreVersionLocalizations',
    id: LOC_ID,
    attributes: {
      whatsNew: 'Added your real broker account balance alongside each strategy\'s paper-trading P&L, so you can see actual account totals and per-strategy performance together. Minor stability improvements.',
    },
  },
});
console.log('=== set whatsNew ===', res.status);
console.log(JSON.stringify(res.body, null, 2));
