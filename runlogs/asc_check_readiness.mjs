import { asc } from './asc_helper.mjs';

const VERSION_ID = 'e67b1aea-0eca-4e1f-b193-c9600a734522';

const loc = await asc('GET', `/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations`);
console.log('=== localizations ===', loc.status);
console.log(JSON.stringify(loc.body?.data?.map(d => ({id: d.id, locale: d.attributes.locale, whatsNew: d.attributes.whatsNew})), null, 2));

const review = await asc('GET', `/appStoreVersions/${VERSION_ID}/appStoreReviewDetail`);
console.log('\n=== review detail ===', review.status);
console.log(JSON.stringify(review.body, null, 2));

const compliance = await asc('GET', `/apps/6785379395/builds`);
