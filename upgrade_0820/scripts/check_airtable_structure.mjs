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

async function checkTableStructure() {
    console.log('🔍 Airtable 테이블 구조 확인 중...\n');
    
    const tables = [
        'Post Data Requests',
        'Medicontent Posts',
        '[Demo] Funnel Daily Data',
        '[Demo] Reputation Issues', 
        '[Demo] Channel Status',
        '[Demo] Performance Alerts'
    ];
    
    for (const tableName of tables) {
        try {
            console.log(`📋 ${tableName} 테이블 구조:`);
            
            // 첫 번째 레코드를 가져와서 필드명 확인
            const records = await base(tableName).select({ maxRecords: 1 }).all();
            
            if (records.length > 0) {
                const record = records[0];
                const fields = Object.keys(record.fields);
                
                console.log('필드명 목록:');
                fields.forEach(field => {
                    console.log(`  - ${field}`);
                });
                
                // 샘플 데이터도 출력
                console.log('\n샘플 데이터:');
                fields.forEach(field => {
                    console.log(`  ${field}: ${record.get(field)}`);
                });
            } else {
                console.log('  레코드가 없습니다.');
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
            
        } catch (error) {
            console.error(`❌ ${tableName} 테이블 확인 실패:`, error.message);
            console.log('\n' + '='.repeat(50) + '\n');
        }
    }
}

async function main() {
    console.log('🚀 Airtable 테이블 구조 확인을 시작합니다...\n');
    
    try {
        await checkTableStructure();
        console.log('\n🎉 테이블 구조 확인이 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 확인 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
