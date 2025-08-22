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

const base = new Airtable({
  apiKey: API_KEY,
}).base(BASE_ID);

const tables = [
  { name: 'Demo Homepage Combined Data', fields: [
    { name: 'Date', type: 'date' },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
    { name: 'SEO Score', type: 'number' },
    { name: 'Search Inflow', type: 'number' },
    { name: 'Conversion Rate', type: 'number' },
    { name: 'Search Keyword', type: 'singleSelect', options: { choices: [ { name: '임플란트' }, { name: '신경치료' }, { name: '기타' } ] } },
    { name: 'Organic Inflow', type: 'number' },
    { name: 'Direct Inflow', type: 'number' },
    { name: 'Session Duration', type: 'number' },
    { name: 'Bounce Rate', type: 'number' },
    { name: 'Page Views', type: 'number' },
  ]},
  { name: 'Demo Homepage SEO Scores', fields: [
    { name: 'Date', type: 'date' },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
    { name: 'SEO Score', type: 'number' },
    { name: 'Max Score', type: 'number' },
    { name: 'Improvement Items', type: 'longText' },
    { name: 'Image Alt Text Count', type: 'number' },
    { name: 'Page Speed Status', type: 'singleSelect', options: { choices: [ { name: 'good' }, { name: 'needs-improvement' }, { name: 'poor' } ] } },
    { name: 'Meta Description Issues', type: 'number' },
  ]},
  { name: 'Demo Homepage Search Inflow', fields: [
    { name: 'Date', type: 'date' },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
    { name: 'Total Inflow', type: 'number' },
    { name: 'Organic Inflow', type: 'number' },
    { name: 'Direct Inflow', type: 'number' },
    { name: 'Change Rate', type: 'number' },
    { name: 'Search Keyword', type: 'singleSelect', options: { choices: [ { name: '임플란트' }, { name: '신경치료' }, { name: '기타' } ] } },
  ]},
  { name: 'Demo Homepage Conversion Rates', fields: [
    { name: 'Date', type: 'date' },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
    { name: 'Conversion Rate', type: 'number' },
    { name: 'Change Rate', type: 'number' },
    { name: 'Average Session Duration', type: 'number' },
    { name: 'Bounce Rate', type: 'number' },
    { name: 'Search Keyword', type: 'singleSelect', options: { choices: [ { name: '임플란트' }, { name: '신경치료' }, { name: '기타' } ] } },
  ]},
  { name: 'Demo Homepage Top Pages', fields: [
    { name: 'Page URL', type: 'url' },
    { name: 'Page Title', type: 'singleLineText' },
    { name: 'Conversion Rate', type: 'number' },
    { name: 'Bounce Rate', type: 'number' },
    { name: 'Session Duration', type: 'number' },
    { name: 'Page Views', type: 'number' },
    { name: 'Page Type', type: 'singleSelect', options: { choices: [ { name: 'conversion' }, { name: 'bounce' } ] } },
    { name: 'Subject', type: 'singleSelect', options: { choices: [ { name: '전체' }, { name: '임플란트' }, { name: '신경치료' } ] } },
  ]},
  { name: 'Demo Homepage Competitors', fields: [
    { name: 'Competitor Name', type: 'singleLineText' },
    { name: 'Website URL', type: 'url' },
    { name: 'SEO Score', type: 'number' },
    { name: 'Search Inflow', type: 'number' },
    { name: 'Conversion Rate', type: 'number' },
    { name: 'Ranking Keywords', type: 'number' },
    { name: 'Backlinks', type: 'number' },
    { name: 'Last Updated', type: 'date' },
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

// 가상 데이터 생성 함수
function generateHomepageData() {
  const data = [];
  const startDate = new Date('2024-08-01');
  const endDate = new Date('2025-08-25');
  const subjects = ['전체', '임플란트', '신경치료'];
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 월요일로 조정
    
    for (const subject of subjects) {
      // 주제별 가중치 설정 (월 800건 수준으로 조정)
      let seoBase = 80;
      let inflowBase = 200; // 주간 기준으로 조정 (월 800건 = 주간 약 200건)
      let conversionBase = 4.0;
      
      if (subject === '임플란트') {
        seoBase = 85;
        inflowBase = 250; // 월 1000건 수준
        conversionBase = 4.5;
      } else if (subject === '신경치료') {
        seoBase = 82;
        inflowBase = 220; // 월 880건 수준
        conversionBase = 4.2;
      }
      
      // 시간에 따른 변화 추가
      const timeProgress = (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
      const seasonalFactor = 1 + 0.2 * Math.sin(timeProgress * Math.PI * 2); // 계절성 변동
      
      // 검색 유입어 설정
      let searchKeyword = '기타';
      if (subject === '임플란트') {
        searchKeyword = '임플란트';
      } else if (subject === '신경치료') {
        searchKeyword = '신경치료';
      }
      
      data.push({
        'Date': weekStart.toISOString().split('T')[0],
        'Subject': subject,
        'SEO Score': Math.round(seoBase + Math.random() * 10 + timeProgress * 5),
        'Search Inflow': Math.round((inflowBase + Math.random() * 50) * seasonalFactor),
        'Conversion Rate': Math.round((conversionBase + Math.random() * 1.5) * 100) / 100,
        'Search Keyword': searchKeyword,
        'Organic Inflow': Math.round((inflowBase * 0.75 + Math.random() * 30) * seasonalFactor),
        'Direct Inflow': Math.round((inflowBase * 0.25 + Math.random() * 20) * seasonalFactor),
        'Session Duration': Math.round(120 + Math.random() * 60),
        'Bounce Rate': Math.round(30 + Math.random() * 20),
        'Page Views': Math.round(inflowBase * 1.5 + Math.random() * 100)
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 7); // 다음 주로
  }
  
  return data;
}

// Benchmark Hospitals에서 경쟁사 데이터 가져오기
async function getCompetitorData() {
  try {
    const records = await base('Benchmark Hospitals').select({
      maxRecords: 10
    }).firstPage();

    return records.map((record, index) => {
      const hospitalName = record.get('Hospital Name') || `병원${index + 1}`;
      const seoScore = 65 + Math.floor(Math.random() * 20); // 65-85 범위
      const searchInflow = 150 + Math.floor(Math.random() * 100); // 150-250 범위
      const conversionRate = 2.5 + Math.random() * 2; // 2.5-4.5 범위
      
      return {
        'Competitor Name': hospitalName,
        'Website URL': `https://${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
        'SEO Score': seoScore,
        'Search Inflow': searchInflow,
        'Conversion Rate': Math.round(conversionRate * 100) / 100,
        'Ranking Keywords': 80 + Math.floor(Math.random() * 80),
        'Backlinks': 800 + Math.floor(Math.random() * 1200),
        'Last Updated': new Date().toISOString().split('T')[0]
      };
    });
  } catch (error) {
    console.error('Benchmark Hospitals 데이터 조회 실패:', error);
    // 기본 데이터 반환
    return [
      {
        'Competitor Name': '강남미소치과',
        'Website URL': 'https://gangnam-miso.com',
        'SEO Score': 78,
        'Search Inflow': 200,
        'Conversion Rate': 3.8,
        'Ranking Keywords': 142,
        'Backlinks': 1980,
        'Last Updated': new Date().toISOString().split('T')[0]
      },
      {
        'Competitor Name': '서울스마일치과',
        'Website URL': 'https://seoul-smile.com',
        'SEO Score': 72,
        'Search Inflow': 180,
        'Conversion Rate': 3.5,
        'Ranking Keywords': 128,
        'Backlinks': 1650,
        'Last Updated': new Date().toISOString().split('T')[0]
      }
    ];
  }
}

// 데이터 입력 함수
async function insertData(tableName, data) {
  try {
    console.log(`테이블 "${tableName}"에 데이터 입력 중...`);
    
    // 배치로 데이터 입력 (Airtable은 한 번에 최대 10개 레코드)
    const batchSize = 10;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize).map(record => ({
        fields: record
      }));
      await base(tableName).create(batch);
      console.log(`${i + batch.length}/${data.length} 레코드 입력 완료`);
    }
    
    console.log(`테이블 "${tableName}" 데이터 입력 완료`);
    return true;
  } catch (error) {
    console.error(`테이블 "${tableName}" 데이터 입력 실패:`, error);
    return false;
  }
}

(async () => {
  try {
    const listRes = await fetch(META_URL, { headers: HEADERS });
    if (!listRes.ok) throw new Error(`Airtable 테이블 목록 조회 실패: ${await listRes.text()}`);
    const list = await listRes.json();

    console.log('Airtable에 존재하는 테이블 목록:', list.tables.map(t => t.name));
    const existingTablesMap = new Map(list.tables.map(t => [t.name, t]));

    // 1. 첫 번째 테이블만 생성/업데이트
    await createOrUpdateTable(tables[0], existingTablesMap);
    
    // 2. 가상 데이터 생성 및 입력
    console.log('가상 데이터 생성 중...');
    const homepageData = generateHomepageData();
    console.log(`생성된 데이터 수: ${homepageData.length}개`);
    
    // 3. 통합 데이터 테이블에 데이터 입력
    await insertData('Demo Homepage Combined Data', homepageData);
    
    console.log('✅ 홈페이지 통합 데이터 테이블 준비 및 데이터 입력 완료');
    console.log('나머지 테이블들은 필요시 수동으로 생성하거나 더미 데이터로 작동합니다.');
  } catch (error) {
    console.error('테이블 준비 중 오류 발생:', error);
  }
})();
