import Airtable from 'airtable';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  console.error('Airtable API 키와 Base ID가 필요합니다.');
  process.exit(1);
}

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);
const META_URL = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
const HEADERS = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

const tables = [
  { name: 'Settings - Hospital', fields: [
    { name: 'Hospital Name', type: 'singleLineText' },
    { name: 'Business Number', type: 'singleLineText' },
    { name: 'Representative Name', type: 'singleLineText' },
    { name: 'Postal Code', type: 'singleLineText' },
    { name: 'Address Line1', type: 'singleLineText' },
    { name: 'Address Line2', type: 'singleLineText' },
    { name: 'Phone', type: 'singleLineText' },
    { name: 'Fax', type: 'singleLineText' },
    { name: 'Email', type: 'email' },
    { name: 'Website', type: 'url' },
  ]},
  { name: 'Settings - Benchmark', fields: [
    { name: 'Benchmark Hospitals', type: 'multilineText' },
  ]},
  // 새 구조: 병원별 한 행
  { name: 'Benchmark Hospitals', fields: [
    { name: 'Hospital Name', type: 'singleLineText' },
    { name: 'Order', type: 'number', options: { precision: 0 } },
    { name: 'Active', type: 'checkbox', options: { color: 'greenBright', icon: 'check' } },
    { name: 'Created At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
    { name: 'Updated At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
  ]},
  { name: 'Settings - Integration', fields: [
    { name: 'EMR Type', type: 'singleLineText' },
    { name: 'EMR API Key', type: 'singleLineText' },
  ]},
  { name: 'Users', fields: [
    { name: 'Name', type: 'singleLineText' },
    { name: 'Email', type: 'email' },
    { name: 'Role', type: 'singleSelect', options: { choices: [ { name: '원장' }, { name: '관리자' }, { name: '직원' }, { name: '간호사' } ] } },
    { name: 'Status', type: 'singleSelect', options: { choices: [ { name: '활성' }, { name: '비활성' } ] } },
    { name: 'Last Login', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
  ]},
  { name: 'Settings - Billing', fields: [
    { name: 'Plan', type: 'singleLineText' },
    { name: 'Next Billing Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Usage Percent', type: 'number', options: { precision: 0 } },
    { name: 'Payment Last4', type: 'singleLineText' },
    { name: 'Payment Expiry', type: 'singleLineText' },
  ]},
];

async function createTable(def) {
  const res = await fetch(META_URL, { method: 'POST', headers: HEADERS, body: JSON.stringify(def) });
  if (!res.ok) {
    const t = await res.text();
    if (!t.includes('already exists')) throw new Error(t);
  }
}

(async () => {
  const list = await fetch(META_URL, { headers: HEADERS }).then(r => r.json());
  const existing = new Set(list.tables.map(t => t.name));
  for (const t of tables) if (!existing.has(t.name)) await createTable(t);
  console.log('✅ Settings 테이블 준비 완료');
})();


