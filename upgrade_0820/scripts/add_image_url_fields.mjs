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
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
};

async function addImageUrlFields() {
    console.log('🔄 Post Data Requests 테이블에 이미지 URL 필드 추가 중...');
    
    try {
        // 1. 현재 테이블 구조 확인
        const response = await fetch(METADATA_API_URL, { headers: HEADERS });
        const { tables } = await response.json();
        const table = tables.find(t => t.name === 'Post Data Requests');
        
        if (!table) {
            throw new Error('Post Data Requests 테이블을 찾을 수 없습니다.');
        }

        console.log('📋 현재 필드 목록:');
        table.fields.forEach(field => {
            console.log(`- ${field.name} (${field.type})`);
        });

        // 2. 새로운 이미지 URL 필드 추가
        const newFields = [
            {
                name: 'Before Image URLs',
                type: 'multilineText',
                description: '내원 시 사진 URL들 (쉼표로 구분)'
            },
            {
                name: 'Process Image URLs',
                type: 'multilineText',
                description: '치료 과정 사진 URL들 (쉼표로 구분)'
            },
            {
                name: 'After Image URLs',
                type: 'multilineText',
                description: '치료 결과 사진 URL들 (쉼표로 구분)'
            }
        ];

        // 3. 테이블에 새 필드 추가
        const updateResponse = await fetch(`${METADATA_API_URL}/${table.id}`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({
                fields: [...table.fields, ...newFields]
            })
        });

        if (updateResponse.ok) {
            console.log('✅ 이미지 URL 필드 추가 완료');
            console.log('📋 추가된 필드:');
            newFields.forEach(field => {
                console.log(`- ${field.name} (${field.type})`);
            });
        } else {
            const error = await updateResponse.text();
            console.error('❌ 테이블 업데이트 실패:', error);
        }

    } catch (error) {
        console.error('❌ 이미지 URL 필드 추가 실패:', error.message);
    }
}

async function main() {
    console.log('🚀 Airtable 이미지 URL 필드 추가를 시작합니다...\n');
    
    try {
        await addImageUrlFields();
        console.log('\n🎉 이미지 URL 필드 추가가 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 추가 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
