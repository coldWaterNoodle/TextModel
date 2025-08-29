import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// 이미지 설명을 각 이미지별로 분리하는 함수
function splitImageDescriptions(descriptionsText: string, imageCount: number): string[] {
    console.log('🔍 splitImageDescriptions 입력:', { descriptionsText, imageCount });
    
    if (!descriptionsText || !descriptionsText.trim()) {
        console.log('🔍 설명 텍스트가 비어있음, 빈 배열 반환');
        return Array(imageCount).fill("");
    }
    
    // 다양한 구분자로 분리 시도 (쉼표, 줄바꿈, 세미콜론, 파이프)
    let descriptions = descriptionsText
        .split(/[,\n;|]/)
        .map(desc => desc.trim())
        .filter(desc => desc.length > 0);
    
    console.log('🔍 1차 분리 결과:', descriptions);
    
    // 만약 분리된 설명의 개수가 1개이고 이미지 개수가 여러 개라면,
    // 하나의 설명이 모든 이미지에 적용되는 것으로 간주
    if (descriptions.length === 1 && imageCount > 1) {
        console.log('🔍 설명이 1개, 이미지가 여러 개 - 모든 이미지에 동일한 설명 적용');
        return Array(imageCount).fill(descriptions[0]);
    }
    
    // 설명 개수와 이미지 개수가 맞지 않는 경우 처리
    const result = [];
    for (let i = 0; i < imageCount; i++) {
        if (i < descriptions.length) {
            result.push(descriptions[i]);
        } else if (descriptions.length > 0) {
            // 설명이 부족하면 빈 문자열로 채움 (마지막 설명 반복 대신)
            console.log(`🔍 ${i}번째 이미지: 설명 부족으로 빈 문자열 사용`);
            result.push("");
        } else {
            result.push("");
        }
    }
    
    console.log('🔍 최종 분리 결과:', result);
    return result;
}

// FastAPI 백엔드에 데이터 전달하는 함수 (세 가지 모드 지원)
// mode: 'input-only' = 테스트용 - input 에이전트만 실행 (로그 저장만)
// mode: 'half-agents' = 테스트용 - plan→title→content→evaluation 실행
// mode: 'all-agents' = 실사용 - 전체 워크플로우 (input→plan→title→content→evaluation)
async function sendToFastAPI(data: any, isUpdate: boolean = false, mode: 'input-only' | 'half-agents' | 'all-agents' = 'all-agents') {
    try {
        console.log('🚀 sendToMedicontentGenerate 시작:', { postId: data.postId, isUpdate });
        
        // FastAPI 서버 URL (환경변수로 설정 가능)
        const fastApiUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';
        console.log('🔗 FastAPI URL:', fastApiUrl);
        
        // 실제 등록된 병원 정보 가져오기
        console.log('🔍 병원 정보 조회 시작...');
        const hospitalInfo = await AirtableService.getHospitalSettings();
        console.log('📋 실제 등록된 병원 정보:', hospitalInfo);
        
        if (!hospitalInfo) {
            console.error('❌ 병원 정보 없음 - Settings - Hospital 테이블이 비어있음');
            throw new Error('병원 정보가 등록되지 않았습니다. 설정 페이지에서 병원 정보를 먼저 등록해주세요.');
        }
        
        let actualImageData = null;
        let postData = null;
        let medicontentPostId = null;
        let medicontentRecordId = null;
        
        if (data.postId) {
            try {
                console.log('🔍 전달받은 이미지 데이터:', {
                    beforeImages: data.beforeImages,
                    processImages: data.processImages,
                    afterImages: data.afterImages
                });
                
                // 올바른 ID 매핑: UI postId로 직접 Medicontent Posts 조회
                try {
                    // 1. 받은 ID가 record ID인지 Post ID인지 판단해서 적절한 함수 사용
                    console.log(`🔍 1단계: 받은 ID로 Medicontent Posts 조회: ${data.postId}`);
                    
                    let medicontentPost;
                    // 원본 postId를 그대로 사용
                    console.log(`🔍 1단계: 원본 postId 사용: ${data.postId}`);
                    medicontentPost = await AirtableService.getPostByPostId(data.postId);
                    console.log(`🔍 1단계 결과:`, medicontentPost);
                    
                    // 디버깅: 조회 실패 시 실제 DB에 있는 Post ID 목록 확인
                    if (!medicontentPost) {
                        console.log('🔍 디버깅: 조회 실패, 실제 DB에 있는 Post ID 확인 중...');
                        const allPosts = await AirtableService.getPosts();
                        const postIds = allPosts.map(p => p.postId).filter(id => id);
                        console.log('📋 DB에 실제로 있는 Post ID 목록:');
                        postIds.slice(0, 10).forEach((id, idx) => {
                            console.log(`   ${idx + 1}. "${id}"`);
                            if (id === data.postId) {
                                console.log(`   ⭐ 정확히 일치하는 ID 발견!`);
                            } else if (id?.includes('recitOSncYZmkik')) {
                                console.log(`   🔍 유사한 ID: "${id}"`);
                            }
                        });
                        if (postIds.length > 10) {
                            console.log(`   ... 총 ${postIds.length}개 Post ID 존재`);
                        }
                    }
                    
                    if (medicontentPost) {
                        medicontentRecordId = medicontentPost.id; // Medicontent Posts record ID
                        medicontentPostId = medicontentPost.postId; // Medicontent Posts Post Id (동일값)
                        postData = medicontentPost;
                        
                        console.log(`✅ Medicontent Posts 조회 성공:`);
                        console.log(`   - Record ID: ${medicontentRecordId}`);
                        console.log(`   - Post Id: ${medicontentPostId}`);
                        
                        // 2. Post Data Requests에서 attachment 데이터 가져오기 (이미지용)
                        // ✅ 이미 저장된 데이터를 직접 사용 (DB 재조회 불필요)
                        console.log(`🔍 2단계: 저장된 attachment 데이터 사용`);
                        if (data.savedDataRequest) {
                            console.log(`✅ 저장된 데이터 직접 사용:`, {
                                beforeImages: data.savedDataRequest.get('Before Images'),
                                processImages: data.savedDataRequest.get('Process Images'),
                                afterImages: data.savedDataRequest.get('After Images')
                            });
                            actualImageData = {
                                beforeImages: data.savedDataRequest.get('Before Images') || [],
                                processImages: data.savedDataRequest.get('Process Images') || [],
                                afterImages: data.savedDataRequest.get('After Images') || []
                            };
                        } else {
                            // fallback: DB 조회 시도
                            console.log(`🔍 fallback: DB에서 실제 attachment 데이터 조회`);
                            try {
                                const savedDataRequest = await AirtableService.getDataRequest(data.postId);
                                if (savedDataRequest && savedDataRequest.beforeImages) {
                                    actualImageData = {
                                        beforeImages: savedDataRequest.beforeImages || [],
                                        processImages: savedDataRequest.processImages || [],
                                        afterImages: savedDataRequest.afterImages || []
                                    };
                                    console.log(`✅ DB에서 실제 attachment 데이터 조회 성공:`, actualImageData);
                                } else {
                                    console.warn(`⚠️ DB 조회 실패, 빈 배열로 초기화`);
                                    actualImageData = {
                                        beforeImages: [],
                                        processImages: [],
                                        afterImages: []
                                    };
                                }
                            } catch (attachmentError) {
                                console.warn('⚠️ attachment 데이터 조회 실패:', attachmentError);
                                actualImageData = {
                                    beforeImages: [],
                                    processImages: [],
                                    afterImages: []
                                };
                            }
                        }
                        console.log(`🔍 최종 actualImageData:`, actualImageData);
                    } else {
                        console.error('❌ UI postId로 Medicontent Posts를 찾을 수 없음:', data.postId);
                    }
                } catch (error) {
                    console.error('❌ ID 조회 중 에러 발생:', error);
                }
                
                // Airtable에서 가져오지 못했으면 fallback으로 임시 데이터 생성
                if (!actualImageData) {
                    console.log('📋 Fallback: 임시 attachment 데이터 생성');
                    actualImageData = {
                        beforeImages: data.beforeImages?.map((imgId: string) => ({ 
                            id: imgId, 
                            filename: `image_${imgId.substring(0, 8)}.jpg`,
                            name: `image_${imgId.substring(0, 8)}.jpg`,
                            url: `https://airtable.com/attachment/${imgId}`
                        })) || [],
                        processImages: data.processImages?.map((imgId: string) => ({ 
                            id: imgId, 
                            filename: `image_${imgId.substring(0, 8)}.jpg`,
                            name: `image_${imgId.substring(0, 8)}.jpg`,
                            url: `https://airtable.com/attachment/${imgId}`
                        })) || [],
                        afterImages: data.afterImages?.map((imgId: string) => ({ 
                            id: imgId, 
                            filename: `image_${imgId.substring(0, 8)}.jpg`,
                            name: `image_${imgId.substring(0, 8)}.jpg`,
                            url: `https://airtable.com/attachment/${imgId}`
                        })) || []
                    };
                }
            } catch (error) {
                console.warn('Airtable 데이터 가져오기 실패:', error);
            }
        }
        
        // actualImageData 로깅
        console.log('🔍 생성된 actualImageData:', actualImageData);

        // UI 데이터를 input_agent 형식으로 변환
        const inputAgentData = {
            hospital: {
                name: hospitalInfo.hospitalName,
                save_name: hospitalInfo.hospitalName.replace(/[^가-힣a-zA-Z0-9]/g, '_').toLowerCase(),
                address: `${hospitalInfo.addressLine1} ${hospitalInfo.addressLine2 || ''}`.trim(),
                phone: hospitalInfo.phone
            },
            category: postData?.treatmentType || "임플란트",
            question1_concept: data.conceptMessage || "",
            question2_condition: data.patientCondition || "", 
            question3_visit_images: (() => {
                // actualImageData가 있으면 (Airtable에서 조회한 완전한 객체들)
                if (actualImageData?.beforeImages && Array.isArray(actualImageData.beforeImages)) {
                    const descriptions = splitImageDescriptions(data.beforeImagesText || "", actualImageData.beforeImages.length);
                    return actualImageData.beforeImages.map((attachment: any, index: number) => ({
                        id: attachment.id,
                        filename: attachment.filename || attachment.name || attachment.id,
                        url: attachment.url,
                        description: descriptions[index] || "",
                        path: attachment.url || `test_data/test_image/${attachment.id}`
                    }));
                }
                // fallback: 기존 로직
                return (data.beforeImages || []).map((imgId: string, index: number) => {
                    const descriptions = splitImageDescriptions(data.beforeImagesText || "", data.beforeImages?.length || 0);
                    return {
                        id: imgId,
                        filename: imgId,
                        url: null,
                        description: descriptions[index] || "",
                        path: `test_data/test_image/${imgId}`
                    };
                });
            })(),
            question4_treatment: data.treatmentProcessMessage || "",
            question5_therapy_images: (() => {
                // actualImageData가 있으면 (Airtable에서 조회한 완전한 객체들)
                if (actualImageData?.processImages && Array.isArray(actualImageData.processImages)) {
                    const descriptions = splitImageDescriptions(data.processImagesText || "", actualImageData.processImages.length);
                    return actualImageData.processImages.map((attachment: any, index: number) => ({
                        id: attachment.id,
                        filename: attachment.filename || attachment.name || attachment.id,
                        url: attachment.url,
                        description: descriptions[index] || "",
                        path: attachment.url || `test_data/test_image/${attachment.id}`
                    }));
                }
                // fallback: 기존 로직
                return (data.processImages || []).map((imgId: string, index: number) => {
                    const descriptions = splitImageDescriptions(data.processImagesText || "", data.processImages?.length || 0);
                    return {
                        id: imgId,
                        filename: imgId,
                        url: null,
                        description: descriptions[index] || "",
                        path: `test_data/test_image/${imgId}`
                    };
                });
            })(),
            question6_result: data.treatmentResultMessage || "",
            question7_result_images: (() => {
                // actualImageData가 있으면 (Airtable에서 조회한 완전한 객체들)
                if (actualImageData?.afterImages && Array.isArray(actualImageData.afterImages)) {
                    const descriptions = splitImageDescriptions(data.afterImagesText || "", actualImageData.afterImages.length);
                    return actualImageData.afterImages.map((attachment: any, index: number) => ({
                        id: attachment.id,
                        filename: attachment.filename || attachment.name || attachment.id,
                        url: attachment.url,
                        description: descriptions[index] || "",
                        path: attachment.url || `test_data/test_image/${attachment.id}`
                    }));
                }
                // fallback: 기존 로직
                return (data.afterImages || []).map((imgId: string, index: number) => {
                    const descriptions = splitImageDescriptions(data.afterImagesText || "", data.afterImages?.length || 0);
                    return {
                        id: imgId,
                        filename: imgId,
                        url: null,
                        description: descriptions[index] || "",
                        path: `test_data/test_image/${imgId}`
                    };
                });
            })(),
            question8_extra: data.additionalMessage || "",
            include_tooth_numbers: false,
            tooth_numbers: [],
            persona_candidates: [],
            representative_persona: "",
            postId: data.postId, // Post Data Requests ID (기존 호환성)
            postDataRequestId: data.postId, // Post Data Requests ID (명시적)
            actualPostDataRequestPostId: data.actualPostDataRequestPostId || "", // Post Data Requests의 record ID (recXXXXX)
            actualPostDataRequestPostIdFull: data.actualPostDataRequestPostIdFull || data.actualMedicontentPostId || "", // 동기화된 Post Id (Medicontent Posts와 동일)
            medicontentPostId: data.actualMedicontentPostId || medicontentPostId || "", // Medicontent Posts의 실제 Post Id
            medicontentRecordId: data.actualMedicontentRecordId || medicontentRecordId || "", // Medicontent Posts의 실제 record ID
            updateMode: isUpdate, // 업데이트 모드 여부
            existingCaseId: data.caseId || null, // 기존 case_id가 있다면 전달
            isFinalSave: data.isFinalSave || false // 최종 저장 여부 플래그
        };

        // 모드에 따른 FastAPI 엔드포인트 및 데이터 구조 결정
        let endpoint: string;
        let requestData: any;
        
        if (mode === 'all-agents') {
            // 🚀 실사용: 전체 워크플로우 /api/all-agents
            endpoint = `${fastApiUrl}/api/all-agents`;
            console.log('🚀 FastAPI 호출 시작 (실사용 - 전체 워크플로우):', endpoint);
            console.log('🔍 DB에서 저장된 데이터를 다시 읽어와서 all-agents에 전달');
            
            // ✅ DB에서 실제 저장된 데이터 재조회
            let savedDataFromDB = null;
            try {
                // medicontentPostId가 있으면 그것으로 조회, 없으면 원본 data.postId로 시도
                const searchPostId = medicontentPostId || data.postId;
                if (searchPostId) {
                    // Post Data Requests에서 저장된 데이터 조회 (Post ID로)
                    console.log(`🔍 최신 Post Data Requests 조회 시도: ${searchPostId}`);
                    const savedDataRequest = await AirtableService.getDataRequest(searchPostId);
                    if (savedDataRequest) {
                        savedDataFromDB = {
                            postId: savedDataRequest.postId || data.postId,
                            conceptMessage: savedDataRequest.conceptMessage || "",
                            patientCondition: savedDataRequest.patientCondition || "",
                            treatmentProcessMessage: savedDataRequest.treatmentProcessMessage || "",
                            treatmentResultMessage: savedDataRequest.treatmentResultMessage || "",
                            additionalMessage: savedDataRequest.additionalMessage || "",
                            beforeImages: savedDataRequest.beforeImages || [],
                            processImages: savedDataRequest.processImages || [],
                            afterImages: savedDataRequest.afterImages || [],
                            beforeImagesText: savedDataRequest.beforeImagesText || "",
                            processImagesText: savedDataRequest.processImagesText || "",
                            afterImagesText: savedDataRequest.afterImagesText || ""
                        };
                        console.log('✅ DB에서 저장된 데이터 조회 성공:', savedDataFromDB);
                    } else {
                        console.warn('⚠️ DB에서 데이터를 찾을 수 없어서 원본 데이터 사용');
                    }
                }
            } catch (dbError) {
                console.warn('⚠️ DB 데이터 재조회 실패, 원본 데이터 사용:', dbError);
            }
            
            // ContentGenerationRequest 구조로 변환 (DB 데이터 우선, fallback으로 원본 데이터)
            const dataSource = savedDataFromDB || data;
            requestData = {
                postId: dataSource.postId || "",
                conceptMessage: dataSource.conceptMessage || "",
                patientCondition: dataSource.patientCondition || "",
                treatmentProcessMessage: dataSource.treatmentProcessMessage || "",
                treatmentResultMessage: dataSource.treatmentResultMessage || "",
                additionalMessage: dataSource.additionalMessage || "",
                beforeImages: dataSource.beforeImages || [],
                processImages: dataSource.processImages || [],
                afterImages: dataSource.afterImages || [],
                beforeImagesText: dataSource.beforeImagesText || "",
                processImagesText: dataSource.processImagesText || "",
                afterImagesText: dataSource.afterImagesText || ""
            };
        } else if (mode === 'half-agents') {
            // 🧪 테스트용: plan→title→content→evaluation /api/half-agents
            endpoint = `${fastApiUrl}/api/half-agents`;
            console.log('🚀 FastAPI 호출 시작 (테스트용 - half-agents):', endpoint);
            
            // dict 구조 (최신 input_log 사용 or 특정 로그 선택)
            requestData = {
                mode: "use",
                input_data: null,  // 최신 input_log 자동 사용
                
                // ✨ 특정 로그 선택 옵션 (UI에서 전달받을 수 있도록 확장)
                target_case_id: data.targetCaseId || null,    // 특정 case_id 지정
                target_post_id: data.targetPostId || null,    // 특정 postId 지정  
                target_date: data.targetDate || null,         // 특정 날짜 지정 (YYYYMMDD)
                target_log_path: data.targetLogPath || null   // 직접 로그 파일 경로 지정
            };
        } else {
            // 🔄 테스트용: Input 에이전트만 /api/input-agent  
            endpoint = `${fastApiUrl}/api/input-agent`;
            console.log('🚀 FastAPI 호출 시작 (테스트용 - input 전용):', endpoint);
            
            // input_data로 래핑
            requestData = {
                input_data: inputAgentData,
                options: {
                    async: false,
                    steps: ["plan", "title", "content", "evaluate"],
                    evaluation_mode: "medical"
                }
            };
        }
        
        console.log('📤 전송할 데이터 크기:', JSON.stringify(requestData).length);
        
        // AbortController로 타임아웃 제어 (2분)
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, 120000); // 2분 타임아웃
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                signal: abortController.signal
            });
            
            clearTimeout(timeoutId);

            console.log('📡 FastAPI 응답 상태:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ FastAPI ${mode} 모드 전송 성공:`, result);
                return result;
            } else {
                const errorText = await response.text();
                console.error(`❌ FastAPI ${mode} 모드 전송 실패:`, response.statusText);
                console.error('❌ FastAPI 에러 응답:', errorText);
                throw new Error(`FastAPI 응답 실패: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            // 타임아웃 에러 구분 처리
            if ((error as Error).name === 'AbortError') {
                console.error(`⏰ FastAPI ${mode} 모드 타임아웃 (2분 초과):`, error);
                throw new Error(`FastAPI 요청이 타임아웃되었습니다 (2분 초과)`);
            } else if (String(error).includes('Headers Timeout Error')) {
                console.error(`⏰ FastAPI ${mode} 모드 헤더 타임아웃:`, error);
                throw new Error(`FastAPI 연결에서 헤더 타임아웃이 발생했습니다`);
            } else {
                console.error(`❌ FastAPI ${mode} 모드 전송 오류:`, error);
                throw error;
            }
        }
    } catch (error) {
        console.error(`❌ sendToFastAPI 함수 실행 오류:`, error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('📨 POST 요청 시작 - 자료 요청 제출');
        
        // Airtable 연결 상태 확인
        const envCheck = AirtableService.checkEnvironment();
        if (!envCheck.valid) {
            console.error('❌ 환경 변수 누락:', envCheck.missing);
            return NextResponse.json(
                { error: `환경 변수가 누락되었습니다: ${envCheck.missing.join(', ')}` },
                { status: 500 }
            );
        }
        
        const connectionCheck = await AirtableService.checkConnection();
        if (!connectionCheck.connected) {
            console.error('❌ Airtable 연결 실패:', connectionCheck.error);
            return NextResponse.json(
                { error: `Airtable 연결에 실패했습니다: ${connectionCheck.error}` },
                { status: 500 }
            );
        }
        
        console.log('✅ Airtable 연결 상태 확인 완료');
        const body = await request.json();
        console.log('📋 POST 요청 데이터:', body);
        console.log('🔍 이미지 데이터 확인:', {
            beforeImages: body.beforeImages,
            processImages: body.processImages,
            afterImages: body.afterImages,
            beforeImagesText: body.beforeImagesText,
            processImagesText: body.processImagesText,
            afterImagesText: body.afterImagesText
        });
        
        const {
            postId,
            conceptMessage,
            patientCondition,
            treatmentProcessMessage,
            treatmentResultMessage,
            additionalMessage,
            beforeImages,
            processImages,
            afterImages,
            beforeImagesText,
            processImagesText,
            afterImagesText,
            isFinalSave = false
        } = body;

        const dataToSubmit = {
            postId,
            conceptMessage,
            patientCondition,
            treatmentProcessMessage,
            treatmentResultMessage,
            additionalMessage,
            beforeImages: beforeImages || [],
            processImages: processImages || [],
            afterImages: afterImages || [],
            beforeImagesText: beforeImagesText || "",
            processImagesText: processImagesText || "",
            afterImagesText: afterImagesText || "",
            isFinalSave: isFinalSave
        };

        console.log('Airtable에 제출할 데이터:', dataToSubmit);
        console.log('🔍 dataToSubmit 이미지 확인:', {
            beforeImages: dataToSubmit.beforeImages,
            processImages: dataToSubmit.processImages,
            afterImages: dataToSubmit.afterImages
        });

        // 1. Airtable에 저장 (UI용 데이터)
        const createdDataRequest = await AirtableService.submitDataRequest(dataToSubmit);
        console.log('✅ Airtable 저장 완료:', createdDataRequest);
        
        // 1.2. 실제 저장된 Post Data Requests의 Post ID들 추출
        const actualPostDataRequestPostId = createdDataRequest.get('Post ID'); // record ID (recXXXXX)
        let actualPostDataRequestPostIdFull = createdDataRequest.get('Post Id'); // full ID (post_recXXXXX) - 동기화를 위해 let 사용
        console.log('🔍 실제 저장된 Post Data Requests Post ID (record):', actualPostDataRequestPostId);
        console.log('🔍 실제 저장된 Post Data Requests Post Id (full):', actualPostDataRequestPostIdFull);

        // 1.5. Medicontent Posts 조회 및 상태 변경, 동시에 실제 Post Id 가져오기
        let actualMedicontentPostId = null;
        let actualMedicontentRecordId = null;
        try {
            if (postId) {
                // 받은 ID가 record ID인지 Post ID인지 판단해서 적절한 함수 사용 (POST)
                console.log(`🔍 POST: 받은 ID로 Medicontent Posts 조회: ${postId}`);
                
                let medicontentPost;
                // 원본 postId를 그대로 사용
                console.log(`🔍 POST: 원본 postId 사용: ${postId}`);
                medicontentPost = await AirtableService.getPostByPostId(postId);
                if (medicontentPost) {
                    actualMedicontentPostId = medicontentPost.postId; // 실제 Post Id 필드 값
                    actualMedicontentRecordId = medicontentPost.id; // record ID
                    console.log('🔍 실제 Medicontent Posts Post Id:', actualMedicontentPostId);
                    console.log('🔍 실제 Medicontent Posts Record ID:', actualMedicontentRecordId);
                    
                    // ⭐ 핵심: Post Data Requests의 Post Id를 Medicontent Posts와 동일하게 업데이트
                    if (actualMedicontentPostId && createdDataRequest.id) {
                        console.log('🔄 Post Data Requests의 Post Id를 Medicontent Posts와 동일하게 업데이트...');
                        await AirtableService.updateDataRequestPostId(createdDataRequest.id, actualMedicontentPostId);
                        console.log('✅ Post Data Requests Post Id 동기화 완료:', actualMedicontentPostId);
                        
                        // actualPostDataRequestPostIdFull도 동기화된 값으로 업데이트
                        actualPostDataRequestPostIdFull = actualMedicontentPostId;
                    }
                    
                    // 안전한 상태값 사용
                    await AirtableService.updatePostStatus(medicontentPost.id, '대기');
                    console.log('✅ Medicontent Posts 상태 변경: 대기 (안전한 기본값)');
                } else {
                    console.warn('⚠️ Medicontent Posts를 찾을 수 없어서 상태 변경 생략');
                }
            }
        } catch (statusError) {
            console.warn('⚠️ 포스트 상태 변경 실패:', statusError);
        }

        // 2. FastAPI input_agent에 실제 테이블별 Post ID들과 함께 데이터 전달
        const dataWithRealPostIds = {
            ...dataToSubmit,
            postId: actualPostDataRequestPostIdFull || actualMedicontentPostId || postId, // ✅ 실제 Post Id 사용
            actualPostDataRequestPostId, // Post Data Requests의 record ID (recXXXXX)
            actualPostDataRequestPostIdFull, // Post Data Requests의 full ID (post_recXXXXX)
            actualMedicontentPostId, // Medicontent Posts의 실제 Post Id
            actualMedicontentRecordId, // Medicontent Posts의 record ID
            
            // ✅ 저장된 데이터 직접 전달 (DB 재조회 없이 사용)
            savedDataRequest: createdDataRequest,
            
            // ✨ UI에서 전달받을 수 있는 추가 옵션들
            mode: body.mode || null,                    // 실행 모드 선택
            targetCaseId: body.targetCaseId || null,    // 특정 case_id 지정
            targetPostId: body.targetPostId || null,    // 특정 postId 지정
            targetDate: body.targetDate || null,        // 특정 날짜 지정
            targetLogPath: body.targetLogPath || null   // 직접 로그 파일 경로 지정
        };
        
        try {
            // 🔧 1단계: 먼저 input-only로 로그 생성
            console.log(`🎯 1단계: input-only 모드로 입력 로그 생성`);
            const inputResult = await sendToFastAPI(dataWithRealPostIds, false, 'input-only');
            console.log(`✅ FastAPI input-only 모드 완료`);
            
            // 🔧 2단계: all-agents로 전체 파이프라인 실행 (입력 로그 기반)
            const mode = dataWithRealPostIds.mode || 'all-agents';
            if (mode !== 'input-only') {
                console.log(`🎯 2단계: ${mode} 모드로 전체 파이프라인 실행`);
                const fastApiResult = await sendToFastAPI(dataWithRealPostIds, false, mode);
                console.log(`✅ FastAPI ${mode} 모드 완료`);
            }
            
            return NextResponse.json({ 
                message: '자료 요청이 제출되었습니다.',
                airtable: '저장 완료',
                medicontent: `input-only → ${mode} 단계별 파이프라인 완료`,
                fastapi: `input-only + ${mode} 모드 실행 완료`
            });
        } catch (fastApiError) {
            // FastAPI 전송 실패해도 Airtable은 저장된 상태이므로 부분 성공으로 처리
            console.warn('⚠️ FastAPI 전송 실패, Airtable만 저장됨:', fastApiError);
            
            return NextResponse.json({ 
                message: '자료 요청이 제출되었습니다.',
                warning: 'FastAPI 연동 실패 (백엔드 로그 미저장)'
            });
        }
    } catch (error) {
        console.error('자료 요청 제출 API 오류 - 에러 타입:', typeof error);
        console.error('자료 요청 제출 API 오류 - 에러 객체:', error);
        console.error('자료 요청 제출 API 오류 - 에러 메시지:', error instanceof Error ? error.message : String(error));
        console.error('자료 요청 제출 API 오류 - 에러 스택:', error instanceof Error ? error.stack : '스택 없음');
        
        // 구체적인 에러 메시지 제공
        let errorMessage = '자료 요청 제출에 실패했습니다.';
        
        if (error instanceof Error) {
            // 병원 정보 관련 에러인 경우 구체적인 메시지 제공
            if (error.message.includes('병원 정보가 등록되지 않았습니다')) {
                errorMessage = error.message;
            }
            // Airtable 관련 에러인 경우
            else if (error.message.includes('Airtable') || error.message.includes('base') || error.message.includes('자료 요청 업데이트 실패') || error.message.includes('포스트 상태 업데이트 실패')) {
                errorMessage = 'Airtable 연결에 실패했습니다. 네트워크 상태를 확인해주세요.';
            }
            // FastAPI 관련 에러인 경우  
            else if (error.message.includes('FastAPI')) {
                errorMessage = 'FastAPI 서버 연결에 실패했습니다. 백엔드 서버 상태를 확인해주세요.';
            }
            
            console.error('❌ 구체적인 에러:', error.message);
            console.error('❌ 에러 스택:', error.stack);
        }
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        console.log('📨 PUT 요청 시작 - 자료 요청 업데이트');
        
        // Airtable 연결 상태 확인
        const envCheck = AirtableService.checkEnvironment();
        if (!envCheck.valid) {
            console.error('❌ 환경 변수 누락:', envCheck.missing);
            return NextResponse.json(
                { error: `환경 변수가 누락되었습니다: ${envCheck.missing.join(', ')}` },
                { status: 500 }
            );
        }
        
        const connectionCheck = await AirtableService.checkConnection();
        if (!connectionCheck.connected) {
            console.error('❌ Airtable 연결 실패:', connectionCheck.error);
            return NextResponse.json(
                { error: `Airtable 연결에 실패했습니다: ${connectionCheck.error}` },
                { status: 500 }
            );
        }
        
        console.log('✅ Airtable 연결 상태 확인 완료');
        const body = await request.json();
        console.log('📋 PUT 요청 데이터:', body);
        console.log('🔍 PUT 이미지 데이터 확인:', {
            beforeImages: body.beforeImages,
            processImages: body.processImages,
            afterImages: body.afterImages,
            beforeImagesText: body.beforeImagesText,
            processImagesText: body.processImagesText,
            afterImagesText: body.afterImagesText
        });
        
        const {
            id,
            postId,
            conceptMessage,
            patientCondition,
            treatmentProcessMessage,
            treatmentResultMessage,
            additionalMessage,
            beforeImages,
            processImages,
            afterImages,
            beforeImagesText,
            processImagesText,
            afterImagesText,
            isFinalSave = false
        } = body;

        const dataToUpdate = {
            postId,
            conceptMessage,
            patientCondition,
            treatmentProcessMessage,
            treatmentResultMessage,
            additionalMessage,
            beforeImages: beforeImages || [],
            processImages: processImages || [],
            afterImages: afterImages || [],
            beforeImagesText: beforeImagesText || "",
            processImagesText: processImagesText || "",
            afterImagesText: afterImagesText || "",
            isFinalSave: isFinalSave
        };
        
        console.log('Airtable에 업데이트할 데이터:', { id, ...dataToUpdate });
        console.log('🔍 dataToUpdate 이미지 확인:', {
            beforeImages: dataToUpdate.beforeImages,
            processImages: dataToUpdate.processImages,
            afterImages: dataToUpdate.afterImages
        });
        
        // 1. Airtable 업데이트 (UI용 데이터)
        await AirtableService.updateDataRequest(id, dataToUpdate);
        console.log('✅ Airtable 업데이트 완료');
        
        // 1.2. 업데이트된 Post Data Requests 레코드 조회하여 실제 Post ID들 가져오기
        const updatedDataRequestRecord = await AirtableService.getDataRequestRecord(id);
        const actualPostDataRequestPostId = updatedDataRequestRecord.get('Post ID') as string; // record ID (recXXXXX)
        let actualPostDataRequestPostIdFull = updatedDataRequestRecord.get('Post Id') as string; // full ID (post_recXXXXX) - 동기화를 위해 let 사용
        console.log('🔍 업데이트된 Post Data Requests Post ID (record):', actualPostDataRequestPostId);
        console.log('🔍 업데이트된 Post Data Requests Post Id (full):', actualPostDataRequestPostIdFull);

        // 1.5. Medicontent Posts 조회 및 상태 변경, 동시에 Post Id 동기화
        let actualMedicontentPostId = null;
        let actualMedicontentRecordId = null;
        try {
            if (postId) {
                // 받은 ID가 record ID인지 Post ID인지 판단해서 적절한 함수 사용 (PUT)
                console.log(`🔍 PUT: 받은 ID로 Medicontent Posts 조회: ${postId}`);
                
                let medicontentPost;
                // 원본 postId를 그대로 사용
                console.log(`🔍 PUT: 원본 postId 사용: ${postId}`);
                medicontentPost = await AirtableService.getPostByPostId(postId);
                if (medicontentPost) {
                    actualMedicontentPostId = medicontentPost.postId; // 실제 Post Id 필드 값
                    actualMedicontentRecordId = medicontentPost.id; // record ID
                    console.log('🔍 실제 Medicontent Posts Post Id (PUT):', actualMedicontentPostId);
                    console.log('🔍 실제 Medicontent Posts Record ID (PUT):', actualMedicontentRecordId);
                    
                    // ⭐ 핵심: Post Data Requests의 Post Id를 Medicontent Posts와 동일하게 업데이트
                    if (actualMedicontentPostId && id) {
                        console.log('🔄 Post Data Requests의 Post Id를 Medicontent Posts와 동일하게 업데이트 (PUT)...');
                        await AirtableService.updateDataRequestPostId(id, actualMedicontentPostId);
                        console.log('✅ Post Data Requests Post Id 동기화 완료 (PUT):', actualMedicontentPostId);
                        
                        // actualPostDataRequestPostIdFull도 동기화된 값으로 업데이트
                        actualPostDataRequestPostIdFull = actualMedicontentPostId;
                    }
                    
                    // 안전한 상태값 사용
                    await AirtableService.updatePostStatus(medicontentPost.id, '대기');
                    console.log('✅ Medicontent Posts 상태 변경 (PUT): 대기 (안전한 기본값)');
                } else {
                    console.warn('⚠️ Medicontent Posts를 찾을 수 없어서 상태 변경 생략 (PUT)');
                }
            }
        } catch (statusError) {
            console.warn('⚠️ 포스트 상태 변경 실패 (PUT):', statusError);
        }

        // 2. FastAPI input_agent에 실제 테이블별 Post ID들과 함께 업데이트된 데이터 전달
        const dataWithRealPostIds = {
            ...dataToUpdate,
            postId: actualPostDataRequestPostIdFull || actualMedicontentPostId || dataToUpdate.postId, // ✅ 실제 Post Id 사용
            actualPostDataRequestPostId, // Post Data Requests의 record ID (recXXXXX)
            actualPostDataRequestPostIdFull, // Post Data Requests의 full ID (post_recXXXXX)
            actualMedicontentPostId, // Medicontent Posts의 실제 Post Id
            actualMedicontentRecordId, // Medicontent Posts의 record ID
            
            // ✨ UI에서 전달받을 수 있는 추가 옵션들 (PUT)
            mode: body.mode || null,                    // 실행 모드 선택
            targetCaseId: body.targetCaseId || null,    // 특정 case_id 지정
            targetPostId: body.targetPostId || null,    // 특정 postId 지정
            targetDate: body.targetDate || null,        // 특정 날짜 지정
            targetLogPath: body.targetLogPath || null   // 직접 로그 파일 경로 지정
        };
        
        try {
            // 🔧 1단계: 먼저 input-only로 로그 생성 (PUT)
            console.log(`🎯 1단계: input-only 모드로 입력 로그 생성 (PUT)`);
            const inputResult = await sendToFastAPI(dataWithRealPostIds, true, 'input-only'); // 업데이트 모드
            console.log(`✅ FastAPI input-only 모드 완료 (PUT)`);
            
            // 🔧 2단계: all-agents로 전체 파이프라인 실행 (입력 로그 기반)
            const mode = dataWithRealPostIds.mode || 'all-agents';
            if (mode !== 'input-only') {
                console.log(`🎯 2단계: ${mode} 모드로 전체 파이프라인 실행 (PUT)`);
                const fastApiResult = await sendToFastAPI(dataWithRealPostIds, true, mode); // 업데이트 모드
                console.log(`✅ FastAPI ${mode} 모드 완료 (PUT)`);
            }
            
            return NextResponse.json({ 
                message: '자료 요청이 업데이트되었습니다.',
                airtable: '업데이트 완료',
                medicontent: `input-only → ${mode} 단계별 파이프라인 완료`,
                fastapi: `input-only + ${mode} 모드 실행 완료`
            });
        } catch (fastApiError) {
            console.warn('⚠️ FastAPI 업데이트 실패, Airtable만 업데이트됨:', fastApiError);
            
            return NextResponse.json({ 
                message: '자료 요청이 업데이트되었습니다.',
                warning: 'FastAPI 연동 실패 (백엔드 로그 미저장)'
            });
        }
            } catch (error) {
            console.error('자료 요청 업데이트 API 오류 - 에러 타입:', typeof error);
            console.error('자료 요청 업데이트 API 오류 - 에러 객체:', error);
            console.error('자료 요청 업데이트 API 오류 - 에러 메시지:', error instanceof Error ? error.message : String(error));
            console.error('자료 요청 업데이트 API 오류 - 에러 스택:', error instanceof Error ? error.stack : '스택 없음');
            
            // 구체적인 에러 메시지 제공
            let errorMessage = '자료 요청 업데이트에 실패했습니다.';
            
            if (error instanceof Error) {
                // 병원 정보 관련 에러인 경우 구체적인 메시지 제공
                if (error.message.includes('병원 정보가 등록되지 않았습니다')) {
                    errorMessage = error.message;
                }
                // Airtable 관련 에러인 경우
                else if (error.message.includes('Airtable') || error.message.includes('base') || error.message.includes('자료 요청 업데이트 실패') || error.message.includes('포스트 상태 업데이트 실패')) {
                    errorMessage = 'Airtable 연결에 실패했습니다. 네트워크 상태를 확인해주세요.';
                }
                // FastAPI 관련 에러인 경우  
                else if (error.message.includes('FastAPI')) {
                    errorMessage = 'FastAPI 서버 연결에 실패했습니다. 백엔드 서버 상태를 확인해주세요.';
                }
                
                console.error('❌ 구체적인 에러:', error.message);
                console.error('❌ 에러 스택:', error.stack);
            }
            
            return NextResponse.json(
                { error: errorMessage },
                { status: 500 }
            );
        }
}
