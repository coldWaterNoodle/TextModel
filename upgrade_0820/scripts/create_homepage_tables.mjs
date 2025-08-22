import dotenv from 'dotenv';
import Airtable from 'airtable';

// 환경변수 로드
dotenv.config({ path: '.env' });

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

// 테이블 생성 함수
async function createTable(tableName, fields) {
  try {
    console.log(`테이블 "${tableName}" 생성 중...`);
    
    // 테이블이 이미 존재하는지 확인
    try {
      await base(tableName).select({ maxRecords: 1 }).firstPage();
      console.log(`테이블 "${tableName}" 이미 존재함`);
      return true;
    } catch (error) {
      console.log(`테이블 "${tableName}" 생성 필요`);
    }
    
    // Airtable API로 테이블 생성 (실제로는 수동으로 생성해야 함)
    console.log(`테이블 "${tableName}"을 Airtable에서 수동으로 생성해주세요.`);
    console.log('필드 구조:', JSON.stringify(fields, null, 2));
    
    return false;
  } catch (error) {
    console.error(`테이블 "${tableName}" 생성 실패:`, error);
    return false;
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
      // 주제별 가중치 설정
      let seoBase = 80;
      let inflowBase = 8000;
      let conversionBase = 4.0;
      
      if (subject === '임플란트') {
        seoBase = 85;
        inflowBase = 10000;
        conversionBase = 4.5;
      } else if (subject === '신경치료') {
        seoBase = 82;
        inflowBase = 9000;
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
        Date: weekStart.toISOString().split('T')[0],
        Subject: subject,
        'SEO Score': Math.round(seoBase + Math.random() * 10 + timeProgress * 5),
        'Search Inflow': Math.round((inflowBase + Math.random() * 2000) * seasonalFactor),
        'Conversion Rate': Math.round((conversionBase + Math.random() * 1.5) * 100) / 100,
        'Search Keyword': searchKeyword,
        'Organic Inflow': Math.round((inflowBase * 0.75 + Math.random() * 1000) * seasonalFactor),
        'Direct Inflow': Math.round((inflowBase * 0.25 + Math.random() * 500) * seasonalFactor),
        'Session Duration': Math.round(120 + Math.random() * 60),
        'Bounce Rate': Math.round(30 + Math.random() * 20),
        'Page Views': Math.round(inflowBase * 1.5 + Math.random() * 1000)
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 7); // 다음 주로
  }
  
  return data;
}

// 데이터 입력 함수
async function insertData(tableName, data) {
  try {
    console.log(`테이블 "${tableName}"에 데이터 입력 중...`);
    
    // 배치로 데이터 입력 (Airtable은 한 번에 최대 10개 레코드)
    const batchSize = 10;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
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

// 메인 실행 함수
async function main() {
  console.log('홈페이지 Airtable 테이블 생성 및 데이터 입력 시작...');
  
  // 1. 통합 데이터 테이블 구조
  const combinedTableFields = [
    { name: 'Date', type: 'date' },
    { name: 'Subject', type: 'singleSelect', options: ['전체', '임플란트', '신경치료'] },
    { name: 'SEO Score', type: 'number' },
    { name: 'Search Inflow', type: 'number' },
    { name: 'Conversion Rate', type: 'number' },
    { name: 'Search Keyword', type: 'singleSelect', options: ['임플란트', '신경치료', '기타'] },
    { name: 'Organic Inflow', type: 'number' },
    { name: 'Direct Inflow', type: 'number' },
    { name: 'Session Duration', type: 'number' },
    { name: 'Bounce Rate', type: 'number' },
    { name: 'Page Views', type: 'number' }
  ];
  
  // 2. 테이블 생성
  await createTable('Demo Homepage Combined Data', combinedTableFields);
  
  // 3. 가상 데이터 생성
  const homepageData = generateHomepageData();
  console.log(`생성된 데이터 수: ${homepageData.length}개`);
  
  // 4. 데이터 입력
  await insertData('Demo Homepage Combined Data', homepageData);
  
  console.log('홈페이지 Airtable 테이블 생성 및 데이터 입력 완료!');
}

// 스크립트 실행
main().catch(console.error);
