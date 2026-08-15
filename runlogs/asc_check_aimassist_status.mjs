import { asc } from './asc_helper.mjs';
const res = await asc('GET', '/reviewSubmissions/39b5cc23-e43f-436f-9330-41c39bc8be88?include=items');
console.log(JSON.stringify(res.body, null, 2));
