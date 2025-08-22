import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Airtable from 'airtable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function aggregateStats() {
    console.log('Starting cafe stats by name aggregation...');
    
    // 1. 병원 정보 가져오기
    const hospitalRecords = await base('Settings - Hospital').select({ maxRecords: 1 }).all();
    if (!hospitalRecords.length) {
        console.error('No hospital settings found');
        return;
    }
    const hospitalName = hospitalRecords[0].get('Hospital Name');
    console.log(`Hospital: ${hospitalName}`);
    
    // 2. 모든 카페 게시글 가져오기
    console.log('Fetching all cafe posts...');
    const posts = await base('Cafe Posts').select({ maxRecords: 10000 }).all();
    console.log(`Found ${posts.length} posts`);
    
    // 3. 우리 병원이 언급된 게시글 필터링
    const mentionedPosts = posts.filter(post => {
        const mentionedClinics = post.get('Mentioned Clinics') || '';
        return mentionedClinics.includes(hospitalName);
    });
    console.log(`Found ${mentionedPosts.length} posts mentioning ${hospitalName}`);
    
    // 4. Post Key 목록 추출
    const postKeys = mentionedPosts.map(p => p.get('Post Key')).filter(Boolean);
    
    // 5. 주간 조회수 데이터 가져오기
    console.log('Fetching weekly views...');
    const weeklyViews = await base('Cafe Weekly Views').select({ maxRecords: 50000 }).all();
    console.log(`Found ${weeklyViews.length} weekly view records`);
    
    // 6. 우리 병원 관련 주간 조회수만 필터링
    const ourWeeklyViews = weeklyViews.filter(v => postKeys.includes(v.get('Post Key')));
    console.log(`Found ${ourWeeklyViews.length} weekly views for our posts`);
    
    // 7. Post Key -> Post 매핑 생성
    const postByKey = {};
    mentionedPosts.forEach(post => {
        const key = post.get('Post Key');
        if (key) postByKey[key] = post;
    });
    
    // 8. 주제별로 게시글 분류
    const subjects = ['전체', '임플란트', '신경치료'];
    
    // 9. 카페별 주간 통계 집계
    console.log('Aggregating weekly stats by cafe...');
    const weeklyStatsByCafe = new Map();
    
    subjects.forEach(subject => {
        ourWeeklyViews.forEach(view => {
            const postKey = view.get('Post Key');
            const post = postByKey[postKey];
            if (!post) return;
            
            const cafeName = post.get('Cafe Name') || '알수없음';
            const weekStart = view.get('Week Start');
            const views = view.get('Views') || 0;
            const treatments = post.get('Related Treatments') || '';
            
            // 주제 필터 적용
            if (subject !== '전체' && !treatments.includes(subject)) return;
            
            const key = `${hospitalName}-${weekStart}-${subject}-${cafeName}`;
            
            if (!weeklyStatsByCafe.has(key)) {
                weeklyStatsByCafe.set(key, {
                    'Stats Key': key,
                    'Hospital Name': hospitalName,
                    'Cafe Name': cafeName,
                    'Week Start': weekStart,
                    'Subject': subject,
                    'Total Views': 0,
                    'Post Count': new Set(),
                    'Created At': new Date().toISOString()
                });
            }
            
            const stat = weeklyStatsByCafe.get(key);
            stat['Total Views'] += views;
            stat['Post Count'].add(postKey);
        });
    });
    
    // Post Count를 실제 숫자로 변환
    weeklyStatsByCafe.forEach(stat => {
        stat['Post Count'] = stat['Post Count'].size;
    });
    
    // 10. 카페별 월간 통계 집계
    console.log('Aggregating monthly stats by cafe...');
    const monthlyStatsByCafe = new Map();
    
    subjects.forEach(subject => {
        ourWeeklyViews.forEach(view => {
            const postKey = view.get('Post Key');
            const post = postByKey[postKey];
            if (!post) return;
            
            const cafeName = post.get('Cafe Name') || '알수없음';
            const weekStart = view.get('Week Start');
            const month = weekStart.slice(0, 7); // YYYY-MM
            const views = view.get('Views') || 0;
            const treatments = post.get('Related Treatments') || '';
            
            // 주제 필터 적용
            if (subject !== '전체' && !treatments.includes(subject)) return;
            
            const key = `${hospitalName}-${month}-${subject}-${cafeName}`;
            
            if (!monthlyStatsByCafe.has(key)) {
                monthlyStatsByCafe.set(key, {
                    'Stats Key': key,
                    'Hospital Name': hospitalName,
                    'Cafe Name': cafeName,
                    'Month': month,
                    'Subject': subject,
                    'Total Views': 0,
                    'Post Count': new Set(),
                    'Created At': new Date().toISOString()
                });
            }
            
            const stat = monthlyStatsByCafe.get(key);
            stat['Total Views'] += views;
            stat['Post Count'].add(postKey);
        });
    });
    
    // Post Count를 실제 숫자로 변환
    monthlyStatsByCafe.forEach(stat => {
        stat['Post Count'] = stat['Post Count'].size;
    });
    
    // 11. 기존 데이터 삭제
    console.log('Clearing existing stats...');
    const existingWeekly = await base('Cafe Stats By Name Weekly').select().all();
    for (let i = 0; i < existingWeekly.length; i += 10) {
        const batch = existingWeekly.slice(i, i + 10).map(r => r.id);
        if (batch.length > 0) {
            await base('Cafe Stats By Name Weekly').destroy(batch);
        }
    }
    
    const existingMonthly = await base('Cafe Stats By Name Monthly').select().all();
    for (let i = 0; i < existingMonthly.length; i += 10) {
        const batch = existingMonthly.slice(i, i + 10).map(r => r.id);
        if (batch.length > 0) {
            await base('Cafe Stats By Name Monthly').destroy(batch);
        }
    }
    
    // 12. 새 데이터 저장
    console.log('Saving weekly stats by cafe...');
    const weeklyRecords = Array.from(weeklyStatsByCafe.values());
    for (let i = 0; i < weeklyRecords.length; i += 10) {
        const batch = weeklyRecords.slice(i, i + 10).map(record => ({ fields: record }));
        if (batch.length > 0) {
            await base('Cafe Stats By Name Weekly').create(batch);
        }
    }
    console.log(`Saved ${weeklyRecords.length} weekly stat records`);
    
    console.log('Saving monthly stats by cafe...');
    const monthlyRecords = Array.from(monthlyStatsByCafe.values());
    for (let i = 0; i < monthlyRecords.length; i += 10) {
        const batch = monthlyRecords.slice(i, i + 10).map(record => ({ fields: record }));
        if (batch.length > 0) {
            await base('Cafe Stats By Name Monthly').create(batch);
        }
    }
    console.log(`Saved ${monthlyRecords.length} monthly stat records`);
    
    console.log('Aggregation completed!');
}

aggregateStats().catch(console.error);
