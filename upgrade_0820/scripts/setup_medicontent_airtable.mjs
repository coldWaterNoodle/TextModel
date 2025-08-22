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
    console.error('현재 환경 변수:');
    console.error('NEXT_PUBLIC_AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? '설정됨' : '설정되지 않음');
    console.error('NEXT_PUBLIC_AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID ? '설정됨' : '설정되지 않음');
    process.exit(1);
}

const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
};

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// 테이블 구조 정의
const tableSchemas = [
    {
        name: 'Medicontent Posts',
        fields: [
            { name: 'Title', type: 'singleLineText' },
            { name: 'Type', type: 'singleSelect', options: { choices: [{ name: '유입 포스팅' }, { name: '전환 포스팅' }] } },
            { name: 'Status', type: 'singleSelect', options: { choices: [
                { name: '대기' }, { name: '병원 작업 중' }, { name: '리걸케어 작업 중' }, 
                { name: '작업 완료' }, { name: '자료 제공 필요' }, { name: '초안 검토 필요' }
            ] } },
            { name: 'Publish Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
            { name: 'Keywords', type: 'multilineText' }, // 나중에 multipleSelects로 변경 가능
            { name: 'Treatment Type', type: 'singleSelect', options: { choices: [
                { name: '신경치료' }, { name: '임플란트' }, { name: '교정치료' }, 
                { name: '보철치료' }, { name: '예방치료' }
            ] } },
            { name: 'HTML ID', type: 'singleLineText' },
            { name: 'SEO Score', type: 'number', options: { precision: 0 } },
            { name: 'Legal Score', type: 'number', options: { precision: 0 } },
            { name: 'Created At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
            { name: 'Updated At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } }
        ]
    },
    {
        name: 'Post Data Requests',
        fields: [
            { name: 'Post ID', type: 'singleLineText' }, // 나중에 Link 필드로 변경 가능
            { name: 'Concept Message', type: 'multilineText' },
            { name: 'Patient Condition', type: 'multilineText' },
            { name: 'Treatment Process Message', type: 'multilineText' },
            { name: 'Treatment Result Message', type: 'multilineText' },
            { name: 'Additional Message', type: 'multilineText' },
            { name: 'Before Images', type: 'multipleAttachments' },
            { name: 'Process Images', type: 'multipleAttachments' },
            { name: 'After Images', type: 'multipleAttachments' },
            { name: 'Submitted At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
            { name: 'Status', type: 'singleSelect', options: { choices: [{ name: '대기' }, { name: '처리 중' }, { name: '완료' }] } }
        ]
    },
    {
        name: 'Post Reviews',
        fields: [
            { name: 'Post ID', type: 'singleLineText' }, // 나중에 Link 필드로 변경 가능
            { name: 'SEO Score', type: 'number', options: { precision: 0 } },
            { name: 'Legal Score', type: 'number', options: { precision: 0 } },
            { name: 'SEO Checklist', type: 'multilineText' }, // JSON 형태로 저장
            { name: 'Legal Checklist', type: 'multilineText' }, // JSON 형태로 저장
            { name: 'Reviewed At', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
            { name: 'Reviewer', type: 'singleLineText' }
        ]
    },
    {
        name: 'Post Communications',
        fields: [
            { name: 'Post ID', type: 'singleLineText' }, // 나중에 Link 필드로 변경 가능
            { name: 'Sender', type: 'singleSelect', options: { choices: [{ name: 'hospital' }, { name: 'legalcare' }] } },
            { name: 'Sender Name', type: 'singleLineText' },
            { name: 'Content', type: 'multilineText' },
            { name: 'Timestamp', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
            { name: 'Type', type: 'singleSelect', options: { choices: [{ name: 'comment' }, { name: 'status_change' }, { name: 'file_upload' }] } }
        ]
    }
];

// 샘플 데이터
const sampleData = {
    'Medicontent Posts': [
        {
            fields: {
                'Title': '신경치료, 치수염으로부터 치아를 구하는 최후의 수단',
                'Type': '유입 포스팅',
                'Status': '작업 완료',
                'Publish Date': '2025-01-20',
                'Keywords': '신경치료, 치수염, 치아보존',
                'Treatment Type': '신경치료',
                'HTML ID': '001',
                'SEO Score': 85,
                'Legal Score': 92,
                'Created At': new Date().toISOString(),
                'Updated At': new Date().toISOString()
            }
        },
        {
            fields: {
                'Title': '치근단염, 방치하면 치아를 잃을 수 있어요',
                'Type': '유입 포스팅',
                'Status': '초안 검토 필요',
                'Publish Date': '2025-01-22',
                'Keywords': '치근단염, 치아보존, 치료',
                'Treatment Type': '신경치료',
                'HTML ID': '002',
                'SEO Score': 78,
                'Legal Score': 85,
                'Created At': new Date().toISOString(),
                'Updated At': new Date().toISOString()
            }
        },
        {
            fields: {
                'Title': '신경치료로 해결되지 않는 경우, 치근단 절제술',
                'Type': '전환 포스팅',
                'Status': '자료 제공 필요',
                'Publish Date': '2025-01-25',
                'Keywords': '치근단 절제술, 신경치료, 치아보존',
                'Treatment Type': '신경치료',
                'Created At': new Date().toISOString(),
                'Updated At': new Date().toISOString()
            }
        },
        {
            fields: {
                'Title': '임플란트 vs 브릿지, 어떤 치료가 좋을까요?',
                'Type': '유입 포스팅',
                'Status': '리걸케어 작업 중',
                'Publish Date': '2025-01-28',
                'Keywords': '임플란트, 브릿지, 치아교체',
                'Treatment Type': '임플란트',
                'Created At': new Date().toISOString(),
                'Updated At': new Date().toISOString()
            }
        },
        {
            fields: {
                'Title': '교정치료, 나이와 상관없이 가능합니다',
                'Type': '유입 포스팅',
                'Status': '병원 작업 중',
                'Publish Date': '2025-02-01',
                'Keywords': '교정치료, 성인교정, 치아교정',
                'Treatment Type': '교정치료',
                'Created At': new Date().toISOString(),
                'Updated At': new Date().toISOString()
            }
        }
    ],
    'Post Communications': [
        {
            fields: {
                'Post ID': 'rec1', // 실제로는 생성된 레코드 ID로 연결
                'Sender': 'legalcare',
                'Sender Name': '리걸케어',
                'Content': '초안 검토를 요청하였습니다.',
                'Timestamp': new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
                'Type': 'comment'
            }
        },
        {
            fields: {
                'Post ID': 'rec1',
                'Sender': 'hospital',
                'Sender Name': '김민준 원장',
                'Content': "포스트 상태를 '발행 대기'로 변경했습니다.",
                'Timestamp': new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8시간 전
                'Type': 'status_change'
            }
        },
        {
            fields: {
                'Post ID': 'rec3',
                'Sender': 'hospital',
                'Sender Name': '최서원 실장',
                'Content': 'pdf 파일을 업로드했습니다.',
                'Timestamp': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
                'Type': 'file_upload'
            }
        }
    ]
};

async function createTable(tableName, fields) {
    try {
        console.log(`✨ 테이블 "${tableName}" 생성 중...`);
        
        const createResponse = await fetch(METADATA_API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ name: tableName, fields: fields }),
        });
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            if (errorText.includes('already exists')) {
                console.log(`⚠️ 테이블 "${tableName}"이 이미 존재합니다.`);
                return base.table(tableName);
            } else {
                throw new Error(`Failed to create table "${tableName}": ${errorText}`);
            }
        }
        
        console.log(`✅ 테이블 "${tableName}" 생성 완료`);
        return base.table(tableName);
    } catch (error) {
        console.error(`❌ 테이블 "${tableName}" 생성 실패:`, error.message);
        throw error;
    }
}

async function insertSampleData(tableName, records) {
    try {
        console.log(`"${tableName}"에 샘플 데이터 삽입 중...`);
        
        const table = base.table(tableName);
        const createdRecords = await table.create(records);
        
        console.log(`✅ "${tableName}"에 ${createdRecords.length}개 레코드 삽입 완료`);
        return createdRecords;
    } catch (error) {
        console.error(`❌ "${tableName}" 샘플 데이터 삽입 실패:`, error.message);
        throw error;
    }
}

async function setupMedicontentTables() {
    console.log('🚀 메디컨텐츠 에어테이블 구조 설정을 시작합니다...\n');
    
    try {
        // 1. 기존 테이블 확인
        const response = await fetch(METADATA_API_URL, { headers: HEADERS });
        if (!response.ok) {
            throw new Error(`Failed to fetch tables: ${await response.text()}`);
        }
        const { tables } = await response.json();
        const existingTableNames = new Set(tables.map(t => t.name));
        console.log('🔍 기존 테이블:', Array.from(existingTableNames));
        
        // 2. 테이블 생성
        for (const schema of tableSchemas) {
            if (!existingTableNames.has(schema.name)) {
                await createTable(schema.name, schema.fields);
            } else {
                console.log(`⚠️ 테이블 "${schema.name}"이 이미 존재합니다.`);
            }
        }
        
        console.log('\n📋 모든 테이블 생성 완료\n');
        
        // 3. 샘플 데이터 삽입
        for (const [tableName, records] of Object.entries(sampleData)) {
            if (records.length > 0) {
                await insertSampleData(tableName, records);
            }
        }
        
        console.log('\n🎉 메디컨텐츠 에어테이블 구조 설정이 완료되었습니다!');
        console.log('\n📊 생성된 테이블:');
        tableSchemas.forEach(schema => {
            console.log(`  - ${schema.name}`);
        });
        
    } catch (error) {
        console.error('\n❌ 설정 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    setupMedicontentTables();
}

export { setupMedicontentTables, tableSchemas, sampleData };
