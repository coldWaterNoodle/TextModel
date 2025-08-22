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

async function updatePostStatus() {
    console.log('🔄 전환 포스팅 상태 업데이트 중...');
    
    try {
        // 전환 포스팅 중 하나를 '작업 완료' 상태로 변경
        const conversionPosts = await base('Medicontent Posts')
            .select({
                filterByFormula: `{Type} = '전환 포스팅'`
            })
            .all();
        
        if (conversionPosts.length > 0) {
            const firstPost = conversionPosts[0];
            const title = firstPost.get('Title');
            
            await base('Medicontent Posts').update(firstPost.id, {
                'Status': '작업 완료',
                'Updated At': new Date().toISOString()
            });
            
            console.log(`✅ "${title}" 상태를 '작업 완료'로 업데이트 완료`);
        } else {
            console.log('ℹ️ 업데이트할 전환 포스팅이 없습니다.');
        }
        
    } catch (error) {
        console.error('❌ 포스트 상태 업데이트 실패:', error.message);
    }
}

async function main() {
    console.log('🚀 전환 포스팅 상태 업데이트를 시작합니다...\n');
    
    try {
        await updatePostStatus();
        console.log('\n🎉 전환 포스팅 상태 업데이트가 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 업데이트 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
