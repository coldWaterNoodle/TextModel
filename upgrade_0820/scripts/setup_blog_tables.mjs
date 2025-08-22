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

const META_URL = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
const HEADERS = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

const tables = [
  { name: 'Blog Posts', fields: [
    { name: 'Post ID', type: 'singleLineText' },
    { name: 'Title', type: 'singleLineText' },
    { name: 'URL', type: 'url' },
    { name: 'Target Keyword', type: 'singleLineText' },
    { name: 'Subject', type: 'singleLineText' },
    { name: 'Publish Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Author', type: 'singleLineText' },
  ]},
  { name: 'Blog Weekly Metrics', fields: [
    { name: 'Week Start', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Post ID', type: 'singleLineText' },
    { name: 'Subject', type: 'singleLineText' },
    { name: 'Views', type: 'number', options: { precision: 0 } },
    { name: 'Inflow', type: 'number', options: { precision: 0 } },
    { name: 'Place Clicks', type: 'number', options: { precision: 0 } },
    { name: 'Conversions', type: 'number', options: { precision: 0 } },
  ]},
  { name: 'Blog Chart Data', fields: [
    { name: 'Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Period Type', type: 'singleSelect', options: { choices: [ { name: '주간' }, { name: '월간' } ] } },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
    { name: 'Views', type: 'number', options: { precision: 0 } },
    { name: 'Inflow', type: 'number', options: { precision: 0 } },
    { name: 'Place Clicks', type: 'number', options: { precision: 0 } },
    { name: 'Conversion Rate', type: 'number', options: { precision: 2 } },
  ]},
  { name: 'Blog Posts Summary', fields: [
    { name: 'Post ID', type: 'singleLineText' },
    { name: 'Post Title', type: 'singleLineText' },
    { name: 'Target Keyword', type: 'singleLineText' },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
    { name: 'Publish Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Blog URL', type: 'url' },
    { name: 'Total Views', type: 'number', options: { precision: 0 } },
    { name: 'Total Inflow', type: 'number', options: { precision: 0 } },
    { name: 'Total Conversions', type: 'number', options: { precision: 0 } },
    { name: 'Best Rank', type: 'number', options: { precision: 0 } },
    { name: 'Current Rank', type: 'number', options: { precision: 0 } },
    { name: 'Status', type: 'singleSelect', options: { choices: [ { name: '정상' }, { name: '순위하락' }, { name: '신규' } ] } },
    { name: 'SEO Score', type: 'number', options: { precision: 0 } },
    { name: 'Legal Status', type: 'singleSelect', options: { choices: [ { name: '안전' }, { name: '주의' }, { name: '위험' } ] } },
  ]},
  { name: 'Blog Ranking Trends', fields: [
    { name: 'Post ID', type: 'singleLineText' },
    { name: 'Week Start', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'My Rank', type: 'number', options: { precision: 0 } },
    { name: 'Benchmark Hospital', type: 'singleLineText' },
    { name: 'Benchmark Rank', type: 'number', options: { precision: 0 } },
  ]},
  { name: 'Blog Weekly Rankings', fields: [
    { name: 'Week Start', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Keyword', type: 'singleLineText' },
    { name: 'Hospital ID', type: 'singleLineText' },
    { name: 'Post ID', type: 'singleLineText' },
    { name: 'Rank', type: 'number', options: { precision: 0 } },
    { name: 'Source', type: 'singleLineText' },
  ]},
  { name: 'Blog Campaigns', fields: [
    { name: 'Campaign ID', type: 'singleLineText' },
    { name: 'Name', type: 'singleLineText' },
    { name: 'Period Start', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Period End', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Subject Cluster', type: 'singleLineText' },
    { name: 'Target Inflow', type: 'number', options: { precision: 0 } },
    { name: 'Created At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
    { name: 'Updated At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
  ]},
  { name: 'Campaign Targets', fields: [
    { name: 'Campaign', type: 'multipleRecordLinks', options: { linkedTableName: 'Blog Campaigns' } },
    { name: 'Post ID', type: 'singleLineText' },
    { name: 'Post Title', type: 'singleLineText' },
    { name: 'Publish Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
    { name: 'Keywords', type: 'singleLineText' },
    { name: 'Target Inflow', type: 'number', options: { precision: 0 } },
    { name: 'Achieved Inflow', type: 'number', options: { precision: 0 } },
    { name: 'Rank', type: 'number', options: { precision: 0 } },
    { name: 'SEO Score', type: 'number', options: { precision: 0 } },
    { name: 'Legal Status', type: 'singleSelect', options: { choices: [ { name: '안전' }, { name: '주의' }, { name: '위험' } ] } },
    { name: 'Post Type', type: 'singleSelect', options: { choices: [ { name: '유입' }, { name: '전환' } ] } },
    { name: 'Status', type: 'singleSelect', options: { choices: [ { name: 'normal' }, { name: 'warning' }, { name: 'error' } ] } },
  ]},
];

async function createOrUpdateTable(tableDef, existingTablesMap) {
  const existingTable = existingTablesMap.get(tableDef.name);

  if (!existingTable) {
    console.log(`'${tableDef.name}' 테이블 생성 중...`);
    const createRes = await fetch(META_URL, { 
      method: 'POST', 
      headers: HEADERS, 
      body: JSON.stringify({ name: tableDef.name, fields: tableDef.fields }) 
    });
    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`'${tableDef.name}' 테이블 생성 실패: ${errorText}`);
    }
    console.log(`'${tableDef.name}' 테이블 생성 완료.`);
  } else {
    console.log(`'${tableDef.name}' 테이블 필드 업데이트 중...`);
    // Airtable 메타 API 목록에서 가져온 fields 배열 사용
    const existingFields = new Set(existingTable.fields.map(f => f.name));
    
    for (const field of tableDef.fields) {
      if (!existingFields.has(field.name)) {
        console.log(`  - '${field.name}' 필드 추가...`);
        const addFieldRes = await fetch(`${META_URL}/${existingTable.id}/fields`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ name: field.name, type: field.type, options: field.options })
        });
        if (!addFieldRes.ok) {
          const errorText = await addFieldRes.text();
          console.error(`    '${field.name}' 필드 추가 실패: ${errorText}`);
        }
      }
    }
    console.log(`'${tableDef.name}' 테이블 필드 업데이트 완료.`);
  }
}

(async () => {
  try {
    const listRes = await fetch(META_URL, { headers: HEADERS });
    if (!listRes.ok) throw new Error(`Airtable 테이블 목록 조회 실패: ${await listRes.text()}`);
    const list = await listRes.json();

    console.log('Airtable에 존재하는 테이블 목록:', list.tables.map(t => t.name));
    const existingTablesMap = new Map(list.tables.map(t => [t.name, t]));

    for (const t of tables) {
      await createOrUpdateTable(t, existingTablesMap);
    }
    console.log('✅ Blog 관련 테이블 준비 완료');
  } catch (error) {
    console.error('테이블 준비 중 오류 발생:', error);
  }
})();


