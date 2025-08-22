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

async function checkSubjects() {
    console.log('🔍 진료과목 필드 값 확인 중...\n');
    
    try {
        const records = await base('[Demo] Funnel Daily Data').select().all();
        
        console.log(`📊 총 ${records.length}개의 레코드가 있습니다.\n`);
        
        // 진료과목별로 그룹화
        const subjects = {};
        
        records.forEach(record => {
            const subject = record.get('진료과목');
            if (subject) {
                if (!subjects[subject]) {
                    subjects[subject] = 0;
                }
                subjects[subject]++;
            }
        });
        
        console.log('📋 진료과목별 레코드 수:');
        Object.entries(subjects).forEach(([subject, count]) => {
            console.log(`  - ${subject}: ${count}개`);
        });
        
        console.log('\n📅 최근 5개 레코드의 진료과목:');
        records.slice(-5).forEach((record, index) => {
            const date = record.get('Date');
            const subject = record.get('진료과목');
            console.log(`  ${index + 1}. ${date} - ${subject}`);
        });
        
    } catch (error) {
        console.error('❌ 진료과목 확인 실패:', error.message);
    }
}

async function main() {
    console.log('🚀 진료과목 확인을 시작합니다...\n');
    
    try {
        await checkSubjects();
        console.log('\n🎉 진료과목 확인이 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 확인 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
