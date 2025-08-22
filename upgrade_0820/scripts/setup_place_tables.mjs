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
  {
    name: 'Competitor',
    fields: [
      { name: 'hospitalName', type: 'singleLineText' },
      { name: 'currentRank', type: 'number', options: { precision: 0 } },
      { name: 'currentTier', type: 'singleSelect', options: { choices: [ { name: 'Tier 1' }, { name: 'Tier 2' }, { name: 'Tier 3' }, { name: 'Tier 4' }, { name: 'Tier 5' } ] } },
      { name: 'previousRank', type: 'number', options: { precision: 0 } },
      { name: 'previousTier', type: 'singleSelect', options: { choices: [ { name: 'Tier 1' }, { name: 'Tier 2' }, { name: 'Tier 3' }, { name: 'Tier 4' }, { name: 'Tier 5' } ] } },
      { name: 'visitorReviews', type: 'number', options: { precision: 0 } },
      { name: 'visitorReviewChange', type: 'number', options: { precision: 0 } },
      { name: 'blogReviews', type: 'number', options: { precision: 0 } },
      { name: 'blogReviewChange', type: 'number', options: { precision: 0 } },
      // linkedReport 필드는 나중에 업데이트
    ]
  },
  {
    name: 'ActionPlan',
    fields: [
      { name: 'planId', type: 'singleLineText' },
      { name: 'targetHospital', type: 'singleLineText' },
      { name: 'currentStatus', type: 'richText' },
      { name: 'goal', type: 'singleLineText' },
      { name: 'solution', type: 'richText' },
      { name: 'planDetails', type: 'richText' },
      { name: 'expectedKpi', type: 'singleLineText' },
       // linkedReport 필드는 나중에 업데이트
    ]
  },
  {
    name: 'PlaceAnalysisReport',
    fields: [
      { name: 'reportId', type: 'singleLineText' },
      { name: 'keyword', type: 'singleLineText' },
      { name: 'analysisDate', type: 'date', options: { dateFormat: { name: 'iso' } } },
      { name: 'tierSummaryChart', type: 'multipleAttachments' },
      { name: 'growthDrivers', type: 'richText' },
    ]
  },
];

async function createTable(tableDef) {
    console.log(`'${tableDef.name}' 테이블 생성 중...`);
    const createRes = await fetch(META_URL, { 
      method: 'POST', 
      headers: HEADERS, 
      body: JSON.stringify({ name: tableDef.name, fields: tableDef.fields, description: `Created by script at ${new Date().toISOString()}` }) 
    });
    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`'${tableDef.name}' 테이블 생성 실패: ${errorText}`);
    }
    const newTable = await createRes.json();
    console.log(`'${tableDef.name}' 테이블 생성 완료.`);
    return newTable;
}

async function updateTableFields(tableId, fieldDef) {
    console.log(`  - '${fieldDef.name}' 필드 추가...`);
    const addFieldRes = await fetch(`${META_URL}/${tableId}/fields`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(fieldDef)
    });
    if (!addFieldRes.ok) {
        const errorText = await addFieldRes.text();
        console.error(`    '${fieldDef.name}' 필드 추가 실패: ${errorText}`);
    }
}

function generateCompetitorData() {
    const competitors = [
        "연세더블유치과의원", "서울바른플란트치과의원", "동탄치과 동탄예치과의원", "서울삼성치과", "서울아띠치과",
        "치과, 예뻐지는", "바른이턱치과의원", "서울안심치과", "서울리더스치과", "화이트라인치과의원", "연세본치과의원",
        "서울리온치과", "수플란트치과병원", "우리치과", "22세기서울치과병원", "동탄퍼스트치과의원",
        "서울탑치과", "서울드림치과", "하루치과의원", "더새로운치과의원"
    ];
    
    return competitors.map((name, index) => {
        const rank = index + 1;
        const tier = rank <= 3 ? 'Tier 1' : rank <= 7 ? 'Tier 2' : rank <= 15 ? 'Tier 3' : 'Tier 4';
        return {
            'hospitalName': name,
            'currentRank': rank,
            'currentTier': tier,
            'previousRank': Math.max(1, rank + Math.floor(Math.random() * 5) - 2),
            'previousTier': tier,
            'visitorReviews': Math.floor(Math.random() * 500) + 50,
            'visitorReviewChange': Math.floor(Math.random() * 20),
            'blogReviews': Math.floor(Math.random() * 300) + 20,
            'blogReviewChange': Math.floor(Math.random() * 10)
        };
    });
}

function generateActionPlanData() {
    return [{
        'planId': 'PLAN-001',
        'targetHospital': '내이튼치과의원',
        'currentStatus': '<h3>현재 순위 및 Tier</h3><ul><li>현재 순위: 25위</li><li>현재 Tier: Tier 4</li><li>방문자 리뷰: 120개 (증가량 +10)</li><li>블로그 리뷰: 80개 (증가량 +5)</li></ul><h3>경쟁사 대비 약점</h3><p>상위 Tier 병원 대비 블로그 리뷰 및 방문자 리뷰 수가 절대적으로 부족하며, 순위 변동성이 큰 편입니다.</p>',
        'goal': '3개월 내 Tier 3 진입 및 순위 15위권 내 안착',
        'solution': '<h3>리뷰부스터 & 메디컨텐츠 솔루션 제안</h3><ol><li><strong>리뷰부스터</strong>: 방문자 리뷰 증대 캠페인을 통해 긍정적 후기를 확보하고 신뢰도를 높입니다.</li><li><strong>메디컨텐츠</strong>: 타겟 키워드에 최적화된 고품질 블로그 콘텐츠를 주 2회 발행하여 검색 유입을 늘리고 전문성을 강화합니다.</li></ol>',
        'planDetails': '<h4>1-4주차: 기반 다지기</h4><ul><li>리뷰부스터 캠페인 기획 및 초기 세팅</li><li>핵심 타겟 키워드 10개 선정 및 콘텐츠 전략 수립</li><li>주 2회 블로그 포스팅 시작</li></ul><h4>5-8주차: 콘텐츠 확산</h4><ul><li>긍정 리뷰 데이터 분석 및 피드백 반영</li><li>콘텐츠 확산을 위한 SNS 및 커뮤니티 채널 활용</li></ul><h4>9-12주차: 성과 분석 및 최적화</h4><ul><li>순위, 유입량, 리뷰 변화 데이터 종합 분석</li><li>성과 기반 콘텐츠 전략 수정 및 고도화</li></ul>',
        'expectedKpi': '방문자 리뷰 50개 추가 확보, 블로그 리뷰 24개 추가 발행, 월간 블로그 유입 30% 증가'
    }];
}

function generateReportData(competitorIds, actionPlanIds) {
    return {
        'reportId': `REPORT-${new Date().toISOString().slice(0, 10)}`,
        'keyword': '동탄치과',
        'analysisDate': new Date().toISOString().split('T')[0],
        'competitors': competitorIds,
        'growthDrivers': '<h3>Tier 2 급등 업체 분석: 더새로운치과의원</h3><h4>주요 원인: 폭발적인 블로그 콘텐츠 집중</h4><p>최근 60일간 20개 이상의 블로그 포스팅을 집중 발행하며 특정 세부 시술 키워드에서 상위 노출을 다수 확보했습니다. 이는 방문자 수 증가와 신규 상담 문의로 이어진 것으로 분석됩니다.</p><h4>성공 패턴 요약</h4><ul><li><strong>콘텐츠 양적 확대</strong>: 단기간에 많은 정보성 콘텐츠를 발행하여 검색 엔진 노출 기회를 극대화했습니다.</li><li><strong>키워드 다각화</strong>: 메인 키워드 외에 통증, 비용, 후기 등 다양한 롱테일 키워드를 공략했습니다.</li><li><strong>내부 링크 활용</strong>: 블로그 내 다른 관련 포스팅으로 연결하여 체류 시간을 늘리고 정보 탐색을 유도했습니다.</li></ul>',
        'actionPlans': actionPlanIds,
    };
}

async function clearTable(tableName) {
    console.log(`'${tableName}' 테이블 데이터 삭제 중...`);
    try {
        const records = await base(tableName).select().all();
        const recordIds = records.map(r => r.id);
        for (let i = 0; i < recordIds.length; i += 10) {
            const batch = recordIds.slice(i, i + 10);
            await base(tableName).destroy(batch);
        }
        console.log(`'${tableName}' 테이블 데이터 ${recordIds.length}개 삭제 완료.`);
    } catch (error) {
        console.error(`'${tableName}' 테이블 데이터 삭제 실패:`, error);
    }
}


async function insertData(tableName, data) {
    try {
        console.log(`'${tableName}' 테이블에 데이터 입력 중...`);
        const createdRecords = [];
        for (let i = 0; i < data.length; i += 10) {
            const batch = data.slice(i, i + 10).map(record => ({ fields: record }));
            const records = await base(tableName).create(batch);
            createdRecords.push(...records);
            console.log(`  ${i + batch.length}/${data.length} 레코드 입력 완료`);
        }
        console.log(`'${tableName}' 테이블 데이터 입력 완료.`);
        return createdRecords;
    } catch (error) {
        console.error(`'${tableName}' 테이블 데이터 입력 실패:`, error);
        throw error;
    }
}

async function createOrUpdateTable(tableDef, existingTablesMap) {
  const existingTable = existingTablesMap.get(tableDef.name);
  if (!existingTable) {
    console.log(`'${tableDef.name}' 테이블이 존재하지 않아 생성합니다.`);
    const createRes = await fetch(META_URL, { 
      method: 'POST', 
      headers: HEADERS, 
      body: JSON.stringify({ name: tableDef.name, fields: tableDef.fields, description: `Created by script at ${new Date().toISOString()}` }) 
    });
    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`'${tableDef.name}' 테이블 생성 실패: ${errorText}`);
    }
    const newTable = await createRes.json();
    console.log(`'${tableDef.name}' 테이블 생성 완료.`);
    existingTablesMap.set(newTable.name, newTable); // 새로 생성된 테이블 정보를 맵에 추가
    return newTable;
  } else {
    console.log(`'${tableDef.name}' 테이블이 이미 존재하여 필드를 업데이트합니다.`);
    const existingFields = new Set(existingTable.fields.map(f => f.name));
    
    for (const field of tableDef.fields) {
      if (!existingFields.has(field.name)) {
          await updateTableFields(existingTable.id, {
              name: field.name,
              type: field.type,
              options: field.options,
          });
      }
    }
    console.log(`'${tableDef.name}' 테이블 필드 업데이트 완료.`);
    return existingTable;
  }
}

(async () => {
  try {
    const listRes = await fetch(META_URL, { headers: HEADERS });
    if (!listRes.ok) throw new Error(`Airtable 테이블 목록 조회 실패: ${await listRes.text()}`);
    const list = await listRes.json();
    let existingTablesMap = new Map(list.tables.map(t => [t.name, t]));

    // 테이블 생성 또는 업데이트 (순서 중요)
    const competitorTableDef = tables.find(t => t.name === 'Competitor');
    const actionPlanTableDef = tables.find(t => t.name === 'ActionPlan');
    const reportTableDef = tables.find(t => t.name === 'PlaceAnalysisReport');
    
    const competitorTable = await createOrUpdateTable(competitorTableDef, existingTablesMap);
    const actionPlanTable = await createOrUpdateTable(actionPlanTableDef, existingTablesMap);
    
    // Report 테이블 생성 시 linkedTableId를 옵션에 추가
    reportTableDef.fields.push({ name: 'competitors', type: 'multipleRecordLinks', options: { linkedTableId: competitorTable.id } });
    reportTableDef.fields.push({ name: 'actionPlans', type: 'multipleRecordLinks', options: { linkedTableId: actionPlanTable.id } });
    const reportTable = await createOrUpdateTable(reportTableDef, existingTablesMap);

    // Competitor와 ActionPlan 테이블에 linkedReport 필드 업데이트
    await createOrUpdateTable({ name: 'Competitor', fields: [{ name: 'linkedReport', type: 'multipleRecordLinks', options: { linkedTableId: reportTable.id } }] }, existingTablesMap);
    await createOrUpdateTable({ name: 'ActionPlan', fields: [{ name: 'linkedReport', type: 'multipleRecordLinks', options: { linkedTableId: reportTable.id } }] }, existingTablesMap);
    
    // 기존 데이터 삭제
    await clearTable('PlaceAnalysisReport');
    await clearTable('Competitor');
    await clearTable('ActionPlan');

    // 데이터 생성
    const competitorData = generateCompetitorData();
    const actionPlanData = generateActionPlanData();

    // 데이터 입력 및 레코드 ID 확보
    const competitorRecords = await insertData('Competitor', competitorData);
    const actionPlanRecords = await insertData('ActionPlan', actionPlanData);

    const competitorIds = competitorRecords.map(r => r.id);
    const actionPlanIds = actionPlanRecords.map(r => r.id);

    const reportData = generateReportData(competitorIds, actionPlanIds);
    const reportRecords = await insertData('PlaceAnalysisReport', [reportData]);
    const reportId = reportRecords[0].id;
    
    // 생성된 레코드에 연결 업데이트 (10개씩 분할)
    const competitorUpdatePayload = competitorIds.map(id => ({ id, fields: { 'linkedReport': [reportId] } }));
    for (let i = 0; i < competitorUpdatePayload.length; i += 10) {
        await base('Competitor').update(competitorUpdatePayload.slice(i, i + 10));
    }
    
    const actionPlanUpdatePayload = actionPlanIds.map(id => ({ id, fields: { 'linkedReport': [reportId] } }));
    for (let i = 0; i < actionPlanUpdatePayload.length; i += 10) {
        await base('ActionPlan').update(actionPlanUpdatePayload.slice(i, i + 10));
    }
    
    console.log('✅ 네이버 플레이스 분석 테이블 준비 및 데이터 입력 완료');
  } catch (error) {
    console.error('스크립트 실행 중 오류 발생:', error);
  }
})();
