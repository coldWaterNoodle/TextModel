import dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config();

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

async function uploadBlogSummary() {
  try {
    console.log('Blog Posts Summary 데이터 생성 시작...');
    
    // 1. Blog Posts 데이터 조회
    console.log('Blog Posts 데이터 조회 중...');
    const blogPosts = await base('Blog Posts').select().all();
    console.log(`${blogPosts.length}개의 Blog Posts 레코드 발견`);
    
    // 2. Blog Weekly Metrics 데이터 조회
    console.log('Blog Weekly Metrics 데이터 조회 중...');
    const weeklyMetrics = await base('Blog Weekly Metrics').select().all();
    console.log(`${weeklyMetrics.length}개의 Blog Weekly Metrics 레코드 발견`);
    
    // 3. Blog Weekly Rankings 데이터 조회
    console.log('Blog Weekly Rankings 데이터 조회 중...');
    const weeklyRankings = await base('Blog Weekly Rankings').select().all();
    console.log(`${weeklyRankings.length}개의 Blog Weekly Rankings 레코드 발견`);
    
    // 4. 데이터 조인 및 집계
    const summaryData = [];
    
    blogPosts.forEach(post => {
      const postId = post.get('Post ID');
      if (!postId) return;
      
      // Blog Weekly Metrics에서 해당 Post ID의 데이터 집계
      const postMetrics = weeklyMetrics.filter(metric => metric.get('Post ID') === postId);
      const totalViews = postMetrics.reduce((sum, metric) => sum + (metric.get('Views') || 0), 0);
      const totalInflow = postMetrics.reduce((sum, metric) => sum + (metric.get('Inflow') || 0), 0);
      const totalConversions = postMetrics.reduce((sum, metric) => sum + (metric.get('Conversions') || 0), 0);
      
      // Blog Weekly Rankings에서 해당 Post ID의 최고 순위 찾기
      const postRankings = weeklyRankings.filter(ranking => ranking.get('Post ID') === postId);
      const bestRank = postRankings.length > 0 
        ? Math.min(...postRankings.map(r => r.get('Rank') || Infinity))
        : null;
      
      // 현재 순위 (가장 최근 데이터)
      const currentRank = postRankings.length > 0 
        ? postRankings[postRankings.length - 1].get('Rank')
        : null;
      
      // 상태 결정
      let status = '신규';
      if (currentRank && bestRank) {
        if (currentRank <= bestRank + 5) {
          status = '정상';
        } else {
          status = '순위하락';
        }
      }
      
      // 날짜 처리
      let publishDate = post.get('Publish Date');
      if (typeof publishDate === 'number' && publishDate > 40000) {
        // Excel 날짜 형식 변환
        publishDate = new Date((publishDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
      }
      
      summaryData.push({
        fields: {
          'Post ID': postId,
          'Post Title': post.get('Post Title') || post.get('Title') || post.get('title') || '',
          'Target Keyword': post.get('Target Keyword') || '',
          'Subject': (() => {
            const subject = post.get('Subject');
            if (subject === '임플란트' || subject === '신경치료') {
              return subject;
            }
            return '전체';
          })(),
          'Publish Date': publishDate,
          'Blog URL': post.get('Blog URL') || '',
          'Total Views': totalViews,
          'Total Inflow': totalInflow,
          'Total Conversions': totalConversions,
          'Best Rank': bestRank,
          'Current Rank': currentRank,
          'Status': status,
          'SEO Score': post.get('SEO Score') || 85,
          'Legal Status': post.get('Legal Status') || '안전'
        }
      });
    });
    
    console.log(`${summaryData.length}개의 요약 데이터 생성 완료`);
    
    // 5. 기존 데이터 삭제 (배치로 처리)
    console.log('기존 Blog Posts Summary 삭제 중...');
    const existingRecords = await base('Blog Posts Summary').select().all();
    if (existingRecords.length > 0) {
      const recordIds = existingRecords.map(record => record.id);
      // 10개씩 배치로 삭제
      const deleteBatchSize = 10;
      for (let i = 0; i < recordIds.length; i += deleteBatchSize) {
        const batch = recordIds.slice(i, i + deleteBatchSize);
        await base('Blog Posts Summary').destroy(batch);
      }
      console.log(`${existingRecords.length}개의 기존 레코드 삭제 완료`);
    }
    
    // 6. 새 데이터 업로드
    console.log('Blog Posts Summary 업로드 중...');
    const batchSize = 10;
    for (let i = 0; i < summaryData.length; i += batchSize) {
      const batch = summaryData.slice(i, i + batchSize);
      await base('Blog Posts Summary').create(batch);
      console.log(`${i + batch.length}/${summaryData.length} 개 업로드 완료`);
    }
    
    console.log('✅ Blog Posts Summary 업로드 완료');
    
  } catch (error) {
    console.error('❌ Blog Posts Summary 업로드 실패:', error);
  }
}

uploadBlogSummary();
