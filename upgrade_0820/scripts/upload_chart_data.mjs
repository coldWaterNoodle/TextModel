import dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config();

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

// Blog Weekly Metrics에서 데이터를 읽어서 차트 데이터로 변환
async function processWeeklyMetricsData() {
  try {
    console.log('Blog Weekly Metrics 데이터 읽는 중...');
    
    // Blog Weekly Metrics 테이블에서 모든 데이터 조회
    const records = await base('Blog Weekly Metrics').select({
      sort: [{ field: 'Week Start', direction: 'asc' }]
    }).all();
    
    console.log(`${records.length}개의 주간 메트릭스 레코드 발견`);
    
    // 주간 데이터 집계
    const weeklyData = {};
    const monthlyData = {};
    
    records.forEach(record => {
      const weekStart = record.get('Week Start');
      const subject = record.get('Subject') || '전체';
      const views = record.get('Views') || 0;
      const inflow = record.get('Inflow') || 0;
      const placeClicks = record.get('Place Clicks') || 0;
      const conversions = record.get('Conversions') || 0;
      
      // 날짜 처리
      let date;
      if (typeof weekStart === 'number' && weekStart > 40000) {
        // Excel 날짜 형식 변환
        date = new Date((weekStart - 25569) * 86400 * 1000);
      } else if (typeof weekStart === 'string') {
        date = new Date(weekStart);
      } else {
        return; // 유효하지 않은 날짜는 건너뛰기
      }
      
      const dateStr = date.toISOString().split('T')[0];
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // 주간 데이터 집계
      if (!weeklyData[dateStr]) {
        weeklyData[dateStr] = {
          '전체': { views: 0, inflow: 0, placeClicks: 0, conversions: 0 },
          '임플란트': { views: 0, inflow: 0, placeClicks: 0, conversions: 0 },
          '신경치료': { views: 0, inflow: 0, placeClicks: 0, conversions: 0 }
        };
      }
      
      weeklyData[dateStr]['전체'].views += views;
      weeklyData[dateStr]['전체'].inflow += inflow;
      weeklyData[dateStr]['전체'].placeClicks += placeClicks;
      weeklyData[dateStr]['전체'].conversions += conversions;
      
      if (subject === '임플란트' || subject === '신경치료') {
        weeklyData[dateStr][subject].views += views;
        weeklyData[dateStr][subject].inflow += inflow;
        weeklyData[dateStr][subject].placeClicks += placeClicks;
        weeklyData[dateStr][subject].conversions += conversions;
      }
      
      // 월간 데이터 집계
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          '전체': { views: 0, inflow: 0, placeClicks: 0, conversions: 0 },
          '임플란트': { views: 0, inflow: 0, placeClicks: 0, conversions: 0 },
          '신경치료': { views: 0, inflow: 0, placeClicks: 0, conversions: 0 }
        };
      }
      
      monthlyData[monthKey]['전체'].views += views;
      monthlyData[monthKey]['전체'].inflow += inflow;
      monthlyData[monthKey]['전체'].placeClicks += placeClicks;
      monthlyData[monthKey]['전체'].conversions += conversions;
      
      if (subject === '임플란트' || subject === '신경치료') {
        monthlyData[monthKey][subject].views += views;
        monthlyData[monthKey][subject].inflow += inflow;
        monthlyData[monthKey][subject].placeClicks += placeClicks;
        monthlyData[monthKey][subject].conversions += conversions;
      }
    });
    
    // 차트 데이터 생성
    const chartData = [];
    
    // 주간 데이터 추가
    Object.entries(weeklyData).forEach(([date, subjects]) => {
      Object.entries(subjects).forEach(([subject, data]) => {
        if (data.views > 0 || data.inflow > 0) { // 데이터가 있는 경우만 추가
          chartData.push({
            fields: {
              'Date': date,
              'Period Type': '주간',
              'Subject': subject,
              'Views': data.views,
              'Inflow': data.inflow,
              'Place Clicks': data.placeClicks,
              'Conversion Rate': data.inflow > 0 ? Math.round((data.conversions / data.inflow) * 10000) / 100 : 0
            }
          });
        }
      });
    });
    
    // 월간 데이터 추가
    Object.entries(monthlyData).forEach(([monthKey, subjects]) => {
      Object.entries(subjects).forEach(([subject, data]) => {
        if (data.views > 0 || data.inflow > 0) { // 데이터가 있는 경우만 추가
          chartData.push({
            fields: {
              'Date': `${monthKey}-01`, // 월의 첫째 날로 설정
              'Period Type': '월간',
              'Subject': subject,
              'Views': data.views,
              'Inflow': data.inflow,
              'Place Clicks': data.placeClicks,
              'Conversion Rate': data.inflow > 0 ? Math.round((data.conversions / data.inflow) * 10000) / 100 : 0
            }
          });
        }
      });
    });
    
    console.log(`총 ${chartData.length}개의 차트 데이터 생성 완료`);
    return chartData;
    
  } catch (error) {
    console.error('Blog Weekly Metrics 데이터 처리 실패:', error);
    return [];
  }
}

async function uploadChartData() {
  try {
    console.log('Blog Chart Data 업로드 시작...');
    
    // 기존 데이터 삭제
    console.log('기존 Blog Chart Data 삭제 중...');
    const existingRecords = await base('Blog Chart Data').select().all();
    if (existingRecords.length > 0) {
      const recordIds = existingRecords.map(record => record.id);
      await base('Blog Chart Data').destroy(recordIds);
      console.log(`${existingRecords.length}개의 기존 레코드 삭제 완료`);
    }
    
    // Blog Weekly Metrics에서 데이터 처리
    const chartData = await processWeeklyMetricsData();
    
    if (chartData.length === 0) {
      console.log('처리할 데이터가 없습니다.');
      return;
    }
    
    // Airtable에 업로드 (한 번에 최대 10개씩)
    const batchSize = 10;
    for (let i = 0; i < chartData.length; i += batchSize) {
      const batch = chartData.slice(i, i + batchSize);
      await base('Blog Chart Data').create(batch);
      console.log(`${i + batch.length}/${chartData.length} 개 업로드 완료`);
    }
    
    console.log('✅ Blog Chart Data 업로드 완료');
    
  } catch (error) {
    console.error('❌ Blog Chart Data 업로드 실패:', error);
  }
}

uploadChartData();
