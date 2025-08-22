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

// 디지털 임플란트 캠페인 데이터
const digitalImplantData = {
    posts: [
        {
            fields: {
                'Title': '디지털 임플란트, 정확도 99%의 혁신적 치료',
                'Type': '유입 포스팅',
                'Status': '작업 완료',
                'Publish Date': '2025-01-15',
                'Keywords': '디지털 임플란트, 정확도, 혁신적 치료, 3D 스캔',
                'Treatment Type': '임플란트',
                'HTML ID': 'DI001',
                'SEO Score': 92,
                'Legal Score': 95,
                'Created At': new Date('2025-01-10').toISOString(),
                'Updated At': new Date('2025-01-15').toISOString()
            }
        },
        {
            fields: {
                'Title': '기존 임플란트 vs 디지털 임플란트, 차이점은?',
                'Type': '유입 포스팅',
                'Status': '리걸케어 작업 중',
                'Publish Date': '2025-01-20',
                'Keywords': '기존 임플란트, 디지털 임플란트, 차이점, 비교',
                'Treatment Type': '임플란트',
                'HTML ID': 'DI002',
                'SEO Score': 88,
                'Legal Score': 90,
                'Created At': new Date('2025-01-12').toISOString(),
                'Updated At': new Date('2025-01-18').toISOString()
            }
        },
        {
            fields: {
                'Title': '디지털 임플란트 수술 과정, 단계별 설명',
                'Type': '전환 포스팅',
                'Status': '자료 제공 필요',
                'Publish Date': '2025-01-25',
                'Keywords': '디지털 임플란트, 수술 과정, 단계별, 치료 과정',
                'Treatment Type': '임플란트',
                'Created At': new Date('2025-01-14').toISOString(),
                'Updated At': new Date('2025-01-20').toISOString()
            }
        },
        {
            fields: {
                'Title': '디지털 임플란트 후기, 실제 환자 경험담',
                'Type': '전환 포스팅',
                'Status': '병원 작업 중',
                'Publish Date': '2025-01-30',
                'Keywords': '디지털 임플란트, 후기, 환자 경험, 실제 사례',
                'Treatment Type': '임플란트',
                'Created At': new Date('2025-01-16').toISOString(),
                'Updated At': new Date('2025-01-22').toISOString()
            }
        },
        {
            fields: {
                'Title': '디지털 임플란트 가격, 투명한 비용 안내',
                'Type': '유입 포스팅',
                'Status': '초안 검토 필요',
                'Publish Date': '2025-02-05',
                'Keywords': '디지털 임플란트, 가격, 비용, 투명한 안내',
                'Treatment Type': '임플란트',
                'HTML ID': 'DI003',
                'SEO Score': 85,
                'Legal Score': 88,
                'Created At': new Date('2025-01-18').toISOString(),
                'Updated At': new Date('2025-01-25').toISOString()
            }
        },
        {
            fields: {
                'Title': '디지털 임플란트 적합한 사람, 체크리스트',
                'Type': '유입 포스팅',
                'Status': '대기',
                'Publish Date': '2025-02-10',
                'Keywords': '디지털 임플란트, 적합한 사람, 체크리스트, 조건',
                'Treatment Type': '임플란트',
                'Created At': new Date('2025-01-20').toISOString(),
                'Updated At': new Date('2025-01-20').toISOString()
            }
        }
    ],
    dataRequests: [
        {
            fields: {
                'Post ID': 'rec_di_001', // 실제로는 생성된 포스트 ID로 연결
                'Concept Message': '디지털 임플란트의 핵심은 정확성과 예측 가능성입니다. 3D 스캔을 통해 환자의 구강 상태를 정밀하게 분석하고, 컴퓨터 설계를 통해 최적의 임플란트 위치와 각도를 결정합니다.',
                'Patient Condition': '상악 좌측 구치부 결손 환자, 잔존 치아 상태 양호, 골밀도 정상',
                'Treatment Process Message': '1단계: 3D 구강 스캔 → 2단계: 컴퓨터 설계 → 3단계: 가이드 제작 → 4단계: 정밀 수술 → 5단계: 보철물 제작',
                'Treatment Result Message': '수술 후 3개월 경과 관찰 결과, 골유착이 양호하고 기능 회복이 우수합니다. 환자 만족도도 높습니다.',
                'Additional Message': '디지털 임플란트는 기존 임플란트 대비 수술 시간이 단축되고, 예측 가능성이 높아 환자에게 더 안전한 치료를 제공합니다.',
                'Before Images': [],
                'Process Images': [],
                'After Images': [],
                'Submitted At': new Date('2025-01-22').toISOString(),
                'Status': '대기'
            }
        }
    ],
    reviews: [
        {
            fields: {
                'Post ID': 'rec_di_001',
                'SEO Score': 92,
                'Legal Score': 95,
                'SEO Checklist': JSON.stringify([
                    {
                        name: '제목 키워드 포함',
                        standardScore: 20,
                        result: '디지털 임플란트 키워드가 제목에 포함되어 있음',
                        resultScore: 20,
                        passed: true
                    },
                    {
                        name: '본문 키워드 밀도',
                        standardScore: 15,
                        result: '키워드 밀도가 적절함 (3.2%)',
                        resultScore: 15,
                        passed: true
                    },
                    {
                        name: '메타 설명',
                        standardScore: 10,
                        result: '메타 설명이 적절히 작성됨',
                        resultScore: 10,
                        passed: true
                    },
                    {
                        name: '내부 링크',
                        standardScore: 5,
                        result: '관련 포스트로의 내부 링크 포함',
                        resultScore: 5,
                        passed: true
                    }
                ]),
                'Legal Checklist': JSON.stringify([
                    {
                        name: '의료법 준수',
                        standardScore: 30,
                        result: '의료법을 준수하는 내용으로 작성됨',
                        resultScore: 30,
                        passed: true
                    },
                    {
                        name: '과장 표현 없음',
                        standardScore: 25,
                        result: '과장된 표현이 없음',
                        resultScore: 25,
                        passed: true
                    },
                    {
                        name: '개인정보 보호',
                        standardScore: 20,
                        result: '개인정보가 노출되지 않음',
                        resultScore: 20,
                        passed: true
                    },
                    {
                        name: '의료진 소개',
                        standardScore: 15,
                        result: '의료진 소개가 적절함',
                        resultScore: 15,
                        passed: true
                    }
                ]),
                'Reviewed At': new Date('2025-01-16').toISOString(),
                'Reviewer': '리걸케어'
            }
        },
        {
            fields: {
                'Post ID': 'rec_di_002',
                'SEO Score': 88,
                'Legal Score': 90,
                'SEO Checklist': JSON.stringify([
                    {
                        name: '제목 키워드 포함',
                        standardScore: 20,
                        result: '디지털 임플란트 키워드가 제목에 포함되어 있음',
                        resultScore: 20,
                        passed: true
                    },
                    {
                        name: '본문 키워드 밀도',
                        standardScore: 15,
                        result: '키워드 밀도가 다소 낮음 (2.1%)',
                        resultScore: 12,
                        passed: false
                    }
                ]),
                'Legal Checklist': JSON.stringify([
                    {
                        name: '의료법 준수',
                        standardScore: 30,
                        result: '의료법을 준수하는 내용으로 작성됨',
                        resultScore: 30,
                        passed: true
                    },
                    {
                        name: '과장 표현 없음',
                        standardScore: 25,
                        result: '과장된 표현이 없음',
                        resultScore: 25,
                        passed: true
                    }
                ]),
                'Reviewed At': new Date('2025-01-19').toISOString(),
                'Reviewer': '리걸케어'
            }
        }
    ],
    communications: [
        {
            fields: {
                'Post ID': 'rec_di_001',
                'Sender': 'legalcare',
                'Sender Name': '리걸케어',
                'Content': '디지털 임플란트 포스팅 초안 검토를 완료했습니다. SEO 점수 92점, 의료법 검토 95점으로 우수합니다.',
                'Timestamp': new Date('2025-01-16T10:30:00').toISOString(),
                'Type': 'comment'
            }
        },
        {
            fields: {
                'Post ID': 'rec_di_001',
                'Sender': 'hospital',
                'Sender Name': '김민준 원장',
                'Content': '검토 결과 확인했습니다. 이대로 발행 진행하겠습니다.',
                'Timestamp': new Date('2025-01-16T14:20:00').toISOString(),
                'Type': 'status_change'
            }
        },
        {
            fields: {
                'Post ID': 'rec_di_003',
                'Sender': 'hospital',
                'Sender Name': '최서원 실장',
                'Content': '디지털 임플란트 수술 과정 자료 요청드립니다. 수술 전후 사진과 함께 단계별 설명이 필요합니다.',
                'Timestamp': new Date('2025-01-20T09:15:00').toISOString(),
                'Type': 'comment'
            }
        },
        {
            fields: {
                'Post ID': 'rec_di_003',
                'Sender': 'legalcare',
                'Sender Name': '리걸케어',
                'Content': '자료 요청 확인했습니다. 자료 제공 양식을 보내드리겠습니다.',
                'Timestamp': new Date('2025-01-20T11:45:00').toISOString(),
                'Type': 'comment'
            }
        },
        {
            fields: {
                'Post ID': 'rec_di_004',
                'Sender': 'hospital',
                'Sender Name': '김민준 원장',
                'Content': '디지털 임플란트 후기 작성 중입니다. 실제 환자 사례를 포함하여 작성하겠습니다.',
                'Timestamp': new Date('2025-01-22T16:30:00').toISOString(),
                'Type': 'status_change'
            }
        }
    ]
};

async function clearExistingData() {
    console.log('🗑️ 기존 데이터 삭제 중...');
    
    const tables = ['Medicontent Posts', 'Post Data Requests', 'Post Reviews', 'Post Communications'];
    
    for (const tableName of tables) {
        try {
            const records = await base(tableName).select().all();
            if (records.length > 0) {
                const recordIds = records.map(r => r.id);
                for (let i = 0; i < recordIds.length; i += 10) {
                    const chunk = recordIds.slice(i, i + 10);
                    await base(tableName).destroy(chunk);
                }
                console.log(`✅ ${tableName}: ${recordIds.length}개 레코드 삭제 완료`);
            }
        } catch (error) {
            console.error(`❌ ${tableName} 데이터 삭제 실패:`, error.message);
        }
    }
}

async function insertData(tableName, records) {
    try {
        console.log(`📝 ${tableName}에 데이터 삽입 중...`);
        
        for (let i = 0; i < records.length; i += 10) {
            const chunk = records.slice(i, i + 10);
            await base(tableName).create(chunk);
        }
        
        console.log(`✅ ${tableName}: ${records.length}개 레코드 삽입 완료`);
    } catch (error) {
        console.error(`❌ ${tableName} 데이터 삽입 실패:`, error.message);
    }
}

async function generateDigitalImplantData() {
    console.log('🚀 디지털 임플란트 캠페인 데이터 생성을 시작합니다...\n');
    
    try {
        // 1. 기존 데이터 삭제
        await clearExistingData();
        
        // 2. 새 데이터 삽입
        await insertData('Medicontent Posts', digitalImplantData.posts);
        await insertData('Post Data Requests', digitalImplantData.dataRequests);
        await insertData('Post Reviews', digitalImplantData.reviews);
        await insertData('Post Communications', digitalImplantData.communications);
        
        console.log('\n🎉 디지털 임플란트 캠페인 데이터 생성이 완료되었습니다!');
        console.log('\n📊 생성된 데이터:');
        console.log(`  - 포스트: ${digitalImplantData.posts.length}개`);
        console.log(`  - 자료 요청: ${digitalImplantData.dataRequests.length}개`);
        console.log(`  - 검토 결과: ${digitalImplantData.reviews.length}개`);
        console.log(`  - 커뮤니케이션: ${digitalImplantData.communications.length}개`);
        
    } catch (error) {
        console.error('\n❌ 데이터 생성 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
generateDigitalImplantData();
