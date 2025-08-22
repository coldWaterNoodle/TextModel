import Airtable from 'airtable';
import fetch from 'node-fetch';
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

const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
};

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function addPostIdField() {
    console.log('🔧 Post Data Requests 테이블에 Post Id 필드 추가 중...');
    
    try {
        // 테이블 정보 가져오기
        const response = await fetch(METADATA_API_URL, { headers: HEADERS });
        if (!response.ok) throw new Error(`Failed to fetch tables: ${await response.text()}`);
        const { tables } = await response.json();
        
        const table = tables.find(t => t.name === 'Post Data Requests');
        if (!table) {
            throw new Error('Post Data Requests 테이블을 찾을 수 없습니다.');
        }
        
        // Post Id 필드가 이미 있는지 확인
        const existingField = table.fields.find(f => f.name === 'Post Id');
        if (existingField) {
            console.log('✅ Post Id 필드가 이미 존재합니다.');
            return;
        }
        
        // Post Id 필드 추가
        const addFieldResponse = await fetch(`${METADATA_API_URL}/${table.id}/fields`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                name: 'Post Id',
                type: 'singleLineText',
            }),
        });
        
        if (!addFieldResponse.ok) {
            throw new Error(`Failed to add Post Id field: ${await addFieldResponse.text()}`);
        }
        
        console.log('✅ Post Id 필드 추가 완료');
        
    } catch (error) {
        console.error('❌ Post Id 필드 추가 실패:', error.message);
    }
}

async function createConversionPostDataRequests() {
    console.log('📝 전환 포스팅용 자료 요청 데이터 생성 중...');
    
    try {
        // 전환 포스팅인 포스트들 가져오기
        const conversionPosts = await base('Medicontent Posts')
            .select({
                filterByFormula: `{Type} = '전환 포스팅'`
            })
            .all();
        
        for (const post of conversionPosts) {
            const postId = `post_${post.id}`;
            
            // 이미 해당 포스트의 자료 요청이 있는지 확인
            const existingRequests = await base('Post Data Requests')
                .select({
                    filterByFormula: `{Post Id} = '${postId}'`
                })
                .all();
            
            if (existingRequests.length === 0) {
                // 새로운 자료 요청 생성
                await base('Post Data Requests').create({
                    'Post Id': postId,
                    'Concept Message': '',
                    'Patient Condition': '',
                    'Treatment Process Message': '',
                    'Treatment Result Message': '',
                    'Additional Message': '',
                    'Submitted At': new Date().toISOString(),
                    'Status': '대기'
                });
                
                console.log(`✅ ${post.get('Title')} 자료 요청 생성 완료`);
            } else {
                console.log(`ℹ️ ${post.get('Title')} 자료 요청이 이미 존재합니다.`);
            }
        }
        
    } catch (error) {
        console.error('❌ 전환 포스팅 자료 요청 생성 실패:', error.message);
    }
}

async function main() {
    console.log('🚀 Post Id 필드 추가 및 전환 포스팅 데이터 생성을 시작합니다...\n');
    
    try {
        // 1. Post Id 필드 추가
        await addPostIdField();
        
        // 2. 전환 포스팅용 자료 요청 생성
        await createConversionPostDataRequests();
        
        console.log('\n🎉 Post Id 필드 추가 및 전환 포스팅 데이터 생성이 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 작업 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
