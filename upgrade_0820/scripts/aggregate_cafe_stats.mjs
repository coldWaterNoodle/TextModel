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
    console.log('Starting cafe stats aggregation...');
    
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
    
    // 7. 주제별로 게시글 분류
    const subjects = ['전체', '임플란트', '신경치료'];
    const postsBySubject = {};
    
    subjects.forEach(subject => {
        if (subject === '전체') {
            postsBySubject[subject] = mentionedPosts;
        } else {
            postsBySubject[subject] = mentionedPosts.filter(p => {
                const treatments = p.get('Related Treatments') || '';
                return treatments.includes(subject);
            });
        }
    });
    
    // 8. 주간 통계 집계
    console.log('Aggregating weekly stats...');
    const weeklyStats = new Map();
    
    subjects.forEach(subject => {
        const subjectPostKeys = postsBySubject[subject].map(p => p.get('Post Key')).filter(Boolean);
        const subjectWeeklyViews = ourWeeklyViews.filter(v => subjectPostKeys.includes(v.get('Post Key')));
        
        // 주별로 합산
        const weekMap = {};
        subjectWeeklyViews.forEach(v => {
            const weekStart = v.get('Week Start');
            const views = v.get('Views') || 0;
            if (!weekMap[weekStart]) {
                weekMap[weekStart] = { views: 0, posts: new Set() };
            }
            weekMap[weekStart].views += views;
            weekMap[weekStart].posts.add(v.get('Post Key'));
        });
        
        // 결과 저장
        Object.entries(weekMap).forEach(([weekStart, data]) => {
            const key = `${hospitalName}-${weekStart}-${subject}`;
            weeklyStats.set(key, {
                'Stats Key': key,
                'Hospital Name': hospitalName,
                'Week Start': weekStart,
                'Subject': subject,
                'Total Views': data.views,
                'Post Count': data.posts.size,
                'Created At': new Date().toISOString()
            });
        });
    });
    
    // 9. 월간 통계 집계
    console.log('Aggregating monthly stats...');
    const monthlyStats = new Map();
    
    subjects.forEach(subject => {
        const subjectPostKeys = postsBySubject[subject].map(p => p.get('Post Key')).filter(Boolean);
        const subjectWeeklyViews = ourWeeklyViews.filter(v => subjectPostKeys.includes(v.get('Post Key')));
        
        // 월별로 합산
        const monthMap = {};
        subjectWeeklyViews.forEach(v => {
            const weekStart = v.get('Week Start');
            const month = weekStart.slice(0, 7); // YYYY-MM
            const views = v.get('Views') || 0;
            if (!monthMap[month]) {
                monthMap[month] = { views: 0, posts: new Set() };
            }
            monthMap[month].views += views;
            monthMap[month].posts.add(v.get('Post Key'));
        });
        
        // 결과 저장
        Object.entries(monthMap).forEach(([month, data]) => {
            const key = `${hospitalName}-${month}-${subject}`;
            monthlyStats.set(key, {
                'Stats Key': key,
                'Hospital Name': hospitalName,
                'Month': month,
                'Subject': subject,
                'Total Views': data.views,
                'Post Count': data.posts.size,
                'Created At': new Date().toISOString()
            });
        });
    });
    
    // 10. 기존 데이터 삭제
    console.log('Clearing existing stats...');
    const existingWeekly = await base('Cafe Hospital Weekly Stats').select().all();
    for (let i = 0; i < existingWeekly.length; i += 10) {
        const batch = existingWeekly.slice(i, i + 10).map(r => r.id);
        if (batch.length > 0) {
            await base('Cafe Hospital Weekly Stats').destroy(batch);
        }
    }
    
    const existingMonthly = await base('Cafe Hospital Monthly Stats').select().all();
    for (let i = 0; i < existingMonthly.length; i += 10) {
        const batch = existingMonthly.slice(i, i + 10).map(r => r.id);
        if (batch.length > 0) {
            await base('Cafe Hospital Monthly Stats').destroy(batch);
        }
    }
    
    // 11. 새 데이터 저장
    console.log('Saving weekly stats...');
    const weeklyRecords = Array.from(weeklyStats.values());
    for (let i = 0; i < weeklyRecords.length; i += 10) {
        const batch = weeklyRecords.slice(i, i + 10).map(record => ({ fields: record }));
        if (batch.length > 0) {
            await base('Cafe Hospital Weekly Stats').create(batch);
        }
    }
    console.log(`Saved ${weeklyRecords.length} weekly stat records`);
    
    console.log('Saving monthly stats...');
    const monthlyRecords = Array.from(monthlyStats.values());
    for (let i = 0; i < monthlyRecords.length; i += 10) {
        const batch = monthlyRecords.slice(i, i + 10).map(record => ({ fields: record }));
        if (batch.length > 0) {
            await base('Cafe Hospital Monthly Stats').create(batch);
        }
    }
    console.log(`Saved ${monthlyRecords.length} monthly stat records`);
    
    console.log('Aggregation completed!');
}

aggregateStats().catch(console.error);
