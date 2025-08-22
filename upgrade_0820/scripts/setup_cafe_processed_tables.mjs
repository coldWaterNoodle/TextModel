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
  { name: 'Cafe Posts', fields: [
    { name: 'Post Key', type: 'singleLineText' },
    { name: 'Club ID', type: 'singleLineText' },
    { name: 'Article ID', type: 'singleLineText' },
    { name: 'Cafe Name', type: 'singleLineText' },
    { name: 'Title', type: 'singleLineText' },
    { name: 'Author', type: 'singleLineText' },
    { name: 'Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Views', type: 'number', options: { precision: 0 } },
    { name: 'Comments Count', type: 'number', options: { precision: 0 } },
    { name: 'Mentioned Clinics', type: 'multilineText' },
    { name: 'Related Treatments', type: 'multilineText' },
    { name: 'Sentiment', type: 'singleSelect', options: { choices: [ { name: '긍정' }, { name: '중립' }, { name: '부정' } ] } },
    { name: 'Link', type: 'url' },
  ]},
  { name: 'Cafe Weekly Views', fields: [
    { name: 'Post Key', type: 'singleLineText' },
    { name: 'Week Index', type: 'number', options: { precision: 0 } },
    { name: 'Week Start', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Views', type: 'number', options: { precision: 0 } },
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
  console.log('✅ Cafe Posts / Cafe Weekly Views 테이블 준비 완료');
})();


