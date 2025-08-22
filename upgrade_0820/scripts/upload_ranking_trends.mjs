import dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config();

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

// 벤치마크 병원 목록 (Benchmark Hospitals 테이블에서 가져올 예정)
let benchmarkHospitals = [];

// 순위 추이 데이터 생성
function generateRankingTrends(postId, publishDate, targetKeyword) {
  const trends = [];
  const startDate = new Date(publishDate);
  const today = new Date();
  
  // 게시일부터 현재까지 주간 단위로 데이터 생성
  let currentDate = new Date(startDate);
  let weekNumber = 0;
  
  // 각 포스트별로 3~8주 동안의 데이터 생성
  const totalWeeks = Math.floor(Math.random() * 6) + 3; // 3~8주
  
  while (weekNumber < totalWeeks) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 주의 시작일로 조정
    
    // 내 포스팅 순위 생성 (연속적인 순위 변화)
    let myRank;
    if (weekNumber === 0) {
      // 첫 주: 1-10위 사이
      myRank = Math.floor(Math.random() * 10) + 1;
    } else {
      // 이후 주: 이전 주 대비 ±3위 변동 (더 자연스러운 변화)
      const previousRank = trends[trends.length - 1]?.myRank || myRank;
      const change = Math.floor(Math.random() * 7) - 3; // -3 ~ +3
      myRank = Math.max(1, Math.min(50, previousRank + change));
    }
    
    // 벤치마크 병원 데이터 (랜덤하게 0개 또는 1개)
    const hasBenchmark = Math.random() < 0.3; // 30% 확률로 벤치마크 병원 등장
    
    if (hasBenchmark) {
      const benchmarkHospital = benchmarkHospitals[Math.floor(Math.random() * benchmarkHospitals.length)];
      
      // 벤치마크 병원 순위 생성 (내 순위보다 큰 값)
      const benchmarkRank = myRank + Math.floor(Math.random() * 15) + 5; // 내 순위 + 5~20
      
      trends.push({
        fields: {
          'Post ID': postId,
          'Week Start': weekStart.toISOString().split('T')[0],
          'My Rank': myRank,
          'Benchmark Hospital': benchmarkHospital,
          'Benchmark Rank': benchmarkRank
        }
      });
    } else {
      trends.push({
        fields: {
          'Post ID': postId,
          'Week Start': weekStart.toISOString().split('T')[0],
          'My Rank': myRank,
          'Benchmark Hospital': '',
          'Benchmark Rank': null
        }
      });
    }
    
    // 다음 주로 이동
    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;
  }
  
  return trends;
}

async function uploadRankingTrends() {
  try {
    console.log('Blog Ranking Trends 데이터 생성 시작...');
    
    // Benchmark Hospitals에서 병원 목록 조회
    console.log('Benchmark Hospitals 데이터 조회 중...');
    const benchmarkRecords = await base('Benchmark Hospitals').select().all();
    benchmarkHospitals = benchmarkRecords.map(record => record.get('Hospital Name')).filter(name => name);
    console.log(`${benchmarkHospitals.length}개의 벤치마크 병원 발견:`, benchmarkHospitals);
    
    // Blog Posts Summary에서 포스트 목록 조회
    console.log('Blog Posts Summary 데이터 조회 중...');
    const posts = await base('Blog Posts Summary').select().all();
    console.log(`${posts.length}개의 포스트 발견`);
    
    // 각 포스트에 대해 순위 추이 데이터 생성
    const allTrends = [];
    
    posts.forEach(post => {
      const postId = post.get('Post ID');
      const publishDate = post.get('Publish Date');
      const targetKeyword = post.get('Target Keyword');
      
      if (postId && publishDate) {
        const trends = generateRankingTrends(postId, publishDate, targetKeyword);
        allTrends.push(...trends);
      }
    });
    
    console.log(`${allTrends.length}개의 순위 추이 데이터 생성 완료`);
    
    // 기존 데이터 삭제 (배치로 처리)
    console.log('기존 Blog Ranking Trends 삭제 중...');
    const existingRecords = await base('Blog Ranking Trends').select().all();
    if (existingRecords.length > 0) {
      const recordIds = existingRecords.map(record => record.id);
      // 10개씩 배치로 삭제
      const deleteBatchSize = 10;
      for (let i = 0; i < recordIds.length; i += deleteBatchSize) {
        const batch = recordIds.slice(i, i + deleteBatchSize);
        await base('Blog Ranking Trends').destroy(batch);
      }
      console.log(`${existingRecords.length}개의 기존 레코드 삭제 완료`);
    }
    
    // 새 데이터 업로드
    console.log('Blog Ranking Trends 업로드 중...');
    const batchSize = 10;
    for (let i = 0; i < allTrends.length; i += batchSize) {
      const batch = allTrends.slice(i, i + batchSize);
      await base('Blog Ranking Trends').create(batch);
      console.log(`${i + batch.length}/${allTrends.length} 개 업로드 완료`);
    }
    
    console.log('✅ Blog Ranking Trends 업로드 완료');
    
  } catch (error) {
    console.error('❌ Blog Ranking Trends 업로드 실패:', error);
  }
}

uploadRankingTrends();
