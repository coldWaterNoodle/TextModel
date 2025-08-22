import Airtable from 'airtable';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Airtable 설정
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable API 키와 Base ID가 필요합니다.');
    process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function createConversionPostDataRequests() {
    console.log('📝 전환 포스팅용 자료 요청 데이터 생성 중...');
    
    try {
        // 전환 포스팅인 포스트들 가져오기
        const conversionPosts = await base('Medicontent Posts')
            .select({
                filterByFormula: `{Type} = '전환 포스팅'`
            })
            .all();
        
        console.log(`📊 전환 포스팅 ${conversionPosts.length}개 발견`);
        
        for (const post of conversionPosts) {
            const postId = `post_${post.id}`;
            const title = post.get('Title');
            
            // 이미 해당 포스트의 자료 요청이 있는지 확인
            const existingRequests = await base('Post Data Requests')
                .select({
                    filterByFormula: `{Post ID} = '${postId}'`
                })
                .all();
            
            if (existingRequests.length === 0) {
                // 새로운 자료 요청 생성
                await base('Post Data Requests').create({
                    'Post ID': postId,
                    'Concept Message': '',
                    'Patient Condition': '',
                    'Treatment Process Message': '',
                    'Treatment Result Message': '',
                    'Additional Message': '',
                    'Submitted At': new Date().toISOString(),
                    'Status': '대기'
                });
                
                console.log(`✅ "${title}" 자료 요청 생성 완료`);
            } else {
                console.log(`ℹ️ "${title}" 자료 요청이 이미 존재합니다.`);
            }
        }
        
    } catch (error) {
        console.error('❌ 전환 포스팅 자료 요청 생성 실패:', error.message);
    }
}

async function main() {
    console.log('🚀 전환 포스팅 자료 요청 데이터 생성을 시작합니다...\n');
    
    try {
        await createConversionPostDataRequests();
        console.log('\n🎉 전환 포스팅 자료 요청 데이터 생성이 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 생성 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
