import Airtable from 'airtable';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// --- Configuration ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env file.');
  process.exit(1);
}

const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// --- Table Schema Definitions ---
const tableSchemas = [
  {
    name: '[Demo] KPI Metrics',
    fields: [
      { name: 'Metric', type: 'singleLineText' },
      { name: 'Value', type: 'number', options: { precision: 2 } },
      { name: 'Change', type: 'percent', options: { precision: 2 } },
      { name: 'Period', type: 'singleLineText' },
    ],
  },
  {
    name: '[Demo] Competitor Stats',
    fields: [
      { name: 'HospitalName', type: 'singleLineText' },
      { name: 'Metric', type: 'singleSelect', options: { choices: [{name: "방문자 수"}, {name: "리뷰 평점"}, {name: "블로그 포스트 수"}]} },
      { name: 'Value', type: 'number', options: { precision: 0 } },
    ],
  },
  {
    name: '[Demo] Urgent Tasks',
    fields: [
      { name: 'Task', type: 'singleLineText' },
      { name: 'Type', type: 'singleSelect', options: { choices: [{name: "자료 요청"}, {name: "콘텐츠 검토"}]} },
      { name: 'DueDate', type: 'date', options: { dateFormat: {name: 'iso'} } },
      { name: 'Status', type: 'singleSelect', options: { choices: [{name: "대기"}, {name: "완료"}]} },
    ],
  },
  {
    name: '[Demo] Activity Feed',
    fields: [
      { name: 'Activity', type: 'multilineText' },
      { name: 'Timestamp', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: {name: 'iso'}, timeFormat: {name: '24hour'} } },
      { name: 'User', type: 'singleLineText' },
    ],
  },
  // Funnel data schema is generated dynamically
];

// --- Data Population Definitions ---
async function getDataToPopulate() {
    const funnelDataPath = path.resolve(process.cwd(), '../blog_automation/demo/data/service/funnel_monthly.json');
    const funnelData = JSON.parse(await fs.readFile(funnelDataPath, 'utf-8'));
    
    return {
        '[Demo] KPI Metrics': [
            { fields: { 'Metric': '총 예약 수', 'Value': 152, 'Change': 0.12, 'Period': '지난 달 대비' } },
            { fields: { 'Metric': '예약 전환율', 'Value': 7.8, 'Change': -0.05, 'Period': '지난 달 대비' } },
            { fields: { 'Metric': '총 유입량', 'Value': 12450, 'Change': 0.25, 'Period': '지난 달 대비' } },
            { fields: { 'Metric': '리뷰 평점', 'Value': 4.8, 'Change': 0.02, 'Period': '지난 달 대비' } },
        ],
        '[Demo] Competitor Stats': [
            { fields: { 'HospitalName': 'A 경쟁병원', 'Metric': '방문자 수', 'Value': 15023 } },
            { fields: { 'HospitalName': 'A 경쟁병원', 'Metric': '리뷰 평점', 'Value': 4.7 } },
            { fields: { 'HospitalName': 'B 경쟁병원', 'Metric': '방문자 수', 'Value': 9870 } },
            { fields: { 'HospitalName': 'B 경쟁병원', 'Metric': '리뷰 평점', 'Value': 4.9 } },
        ],
        '[Demo] Urgent Tasks': [
            { fields: { 'Task': '블로그 포스트 "임플란트 종류" 최종 검토', 'Type': '콘텐츠 검토', 'DueDate': '2025-08-20', 'Status': '대기' } },
            { fields: { 'Task': '환자 수술 전후 사진 자료 제공', 'Type': '자료 요청', 'DueDate': '2025-08-22', 'Status': '대기' } },
        ],
        '[Demo] Activity Feed': [
            { fields: { 'Activity': '새로운 블로그 포스트 "올바른 칫솔질 방법"이 승인되었습니다.', 'Timestamp': new Date().toISOString(), 'User': '김매니저' } },
            { fields: { 'Activity': '부정 리뷰에 대한 대응이 시작되었습니다.', 'Timestamp': new Date(Date.now() - 3600 * 1000).toISOString(), 'User': '리걸케어' } },
        ],
        '[Demo] Funnel Monthly Data': funnelData.map(record => {
            const fields = {};
            for (const key in record) {
                fields[key === 'month' ? 'Month' : key] = record[key];
            }
            return { fields };
        }),
    };
}


// --- Main Execution ---
async function main() {
  console.log('🚀 Starting Airtable setup...');

  // 1. Get existing tables
  const response = await fetch(METADATA_API_URL, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch tables: ${await response.text()}`);
  }
  const { tables } = await response.json();
  const existingTableNames = new Set(tables.map(t => t.name));
  console.log('🔍 Found existing tables:', Array.from(existingTableNames));

  // Dynamically add funnel data schema by merging keys from all records
  const funnelDataPath = path.resolve(process.cwd(), '../blog_automation/demo/data/service/funnel_monthly.json');
  const funnelData = JSON.parse(await fs.readFile(funnelDataPath, 'utf-8'));
  const allFunnelKeys = new Set();
  funnelData.forEach(record => {
    Object.keys(record).forEach(key => allFunnelKeys.add(key));
  });

  const funnelFields = Array.from(allFunnelKeys).map(key => {
    const fieldSpec = {
      name: key === 'month' ? 'Month' : key,
      type: key === 'month' ? 'singleLineText' : 'number',
    };
    if (fieldSpec.type === 'number') {
      fieldSpec.options = { precision: 0 };
    }
    return fieldSpec;
  });
  tableSchemas.push({ name: '[Demo] Funnel Monthly Data', fields: funnelFields });

  // 2. Create missing tables
  for (const schema of tableSchemas) {
    if (!existingTableNames.has(schema.name)) {
      console.log(`✨ Creating table "${schema.name}"...`);
      const createResponse = await fetch(METADATA_API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ name: schema.name, fields: schema.fields }),
      });
      if (!createResponse.ok) {
        throw new Error(`Failed to create table "${schema.name}": ${await createResponse.text()}`);
      }
      console.log(`✅ Table "${schema.name}" created successfully.`);
    }
  }

  // 3. Populate tables
  const dataToPopulate = await getDataToPopulate();
  for (const [tableName, records] of Object.entries(dataToPopulate)) {
    console.log(`✍️ Populating data for "${tableName}"...`);
    // To avoid duplicating records, we won't add data if the table is not empty.
    const existingRecords = await base(tableName).select({ maxRecords: 1 }).firstPage();
    if (existingRecords.length > 0) {
        console.log(`- Skipping, table already contains data.`);
        continue;
    }

    for (let i = 0; i < records.length; i += 10) {
      const chunk = records.slice(i, i + 10);
      await base(tableName).create(chunk);
    }
    console.log(`- Populated ${records.length} records.`);
  }

  console.log('\n🎉 Airtable setup completed successfully!');
}

main().catch(error => {
  console.error('\n❌ An error occurred during Airtable setup:');
  console.error(error);
  process.exit(1);
});
