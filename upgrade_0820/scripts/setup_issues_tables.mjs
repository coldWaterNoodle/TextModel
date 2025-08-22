import fetch from 'node-fetch';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import path from 'path';

// --- Configuration ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { NEXT_PUBLIC_AIRTABLE_API_KEY: AIRTABLE_API_KEY, NEXT_PUBLIC_AIRTABLE_BASE_ID: AIRTABLE_BASE_ID } = process.env;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing env variables');
  process.exit(1);
}

const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// --- Schemas & Data ---
const SCHEMAS = [
    { name: '[Demo] Reputation Issues', fields: [
        { name: 'Title', type: 'singleLineText' },
        { name: 'Type', type: 'singleSelect', options: { choices: [{name: '부정 리뷰'}, {name: '부정 게시글'}] } },
        { name: 'Source', type: 'singleLineText' },
        { name: 'Status', type: 'singleSelect', options: { choices: [{name: '대응 필요'}, {name: '대응 중'}, {name: '완료'}] } },
        { name: 'Link', type: 'url' },
    ]},
    { name: '[Demo] Channel Status', fields: [
        { name: 'Channel', type: 'singleLineText' },
        { name: 'Status', type: 'singleSelect', options: { choices: [{name: '정상', color: 'greenBright'}, {name: '주의', color: 'yellowBright'}, {name: '오류', color: 'redBright'}] } },
        { name: 'Details', type: 'singleLineText' },
        { name: 'LastChecked', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: {name: 'iso'}, timeFormat: {name: '24hour'} } },
    ]},
    { name: '[Demo] Performance Alerts', fields: [
        { name: 'Metric', type: 'singleLineText' },
        { name: 'Change', type: 'singleLineText' },
        { name: 'Details', type: 'singleLineText' },
        { name: 'Priority', type: 'singleSelect', options: { choices: [{name: 'High'}, {name: 'Medium'}, {name: 'Low'}] } },
    ]}
];

const DEMO_DATA = {
    '[Demo] Reputation Issues': [
        { fields: { Title: "신경치료 후 통증이 계속됩니다", Type: '부정 리뷰', Source: "네이버 플레이스", Status: '대응 필요', Link: 'https://naver.com' } },
        { fields: { Title: "다른 곳에서 임플란트 재시술 알아봅니다", Type: '부정 게시글', Source: "맘카페", Status: '대응 필요', Link: 'https://naver.com' } }
    ],
    '[Demo] Channel Status': [
        { fields: { Channel: '네이버 플레이스', Status: '정상', Details: '예약 시스템 정상 동작 중', LastChecked: new Date().toISOString() } },
        { fields: { Channel: '블로그', Status: '정상', Details: '어제 포스팅 정상 노출', LastChecked: new Date().toISOString() } },
        { fields: { Channel: '홈페이지', Status: '주의', Details: '페이지 로딩 속도 소폭 저하 (3.2s)', LastChecked: new Date().toISOString() } },
        { fields: { Channel: '플레이스 광고', Status: '오류', Details: '예산 소진으로 광고 중단됨', LastChecked: new Date().toISOString() } }
    ],
    '[Demo] Performance Alerts': [
        { fields: { Metric: '지도 순위', Change: '하락', Details: "'동탄 임플란트' 키워드 순위 19위 -> 25위", Priority: 'High' } },
        { fields: { Metric: '예약 전환율', Change: '-35%', Details: '어제 예약 전환율이 주 평균 대비 35% 하락', Priority: 'Medium' } }
    ]
};

// --- Main Execution ---
async function main() {
    console.log('🚀 Setting up real-time issue tables...');

    const response = await fetch(METADATA_API_URL, { headers: HEADERS });
    const { tables } = await response.json();
    const existingTableNames = new Set(tables.map(t => t.name));

    for (const schema of SCHEMAS) {
        if (!existingTableNames.has(schema.name)) {
            console.log(`- Creating table "${schema.name}"...`);
            await fetch(METADATA_API_URL, { method: 'POST', headers: HEADERS, body: JSON.stringify(schema) });
        } else {
            console.log(`- Table "${schema.name}" already exists.`);
        }
    }

    console.log('\n✍️ Populating data...');
    for (const [tableName, records] of Object.entries(DEMO_DATA)) {
        const existingRecords = await base(tableName).select({ fields: [] }).all();
        if (existingRecords.length > 0) {
            const ids = existingRecords.map(r => r.id);
            for (let i = 0; i < ids.length; i += 10) await base(tableName).destroy(ids.slice(i, i + 10));
        }
        for (let i = 0; i < records.length; i += 10) await base(tableName).create(records.slice(i, i + 10));
        console.log(`- Populated ${records.length} records into "${tableName}".`);
    }

    console.log('\n🎉 Issue tables setup completed successfully!');
}

main().catch(error => {
    console.error('\n❌ An error occurred:', error);
    process.exit(1);
});
