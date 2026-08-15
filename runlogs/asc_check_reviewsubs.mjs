import { asc } from './asc_helper.mjs';

const res = await asc('GET', '/apps/6785379395/reviewSubmissions?limit=10');
console.log('=== existing review submissions ===', res.status);
console.log(JSON.stringify(res.body?.data?.map(d => ({id: d.id, state: d.attributes.state, platform: d.attributes.platform})), null, 2));
