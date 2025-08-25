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

// FastAPI 백엔드에 데이터 전달하는 함수
async function sendToInputAgent(data: any, isUpdate: boolean = false) {
    try {
        console.log('🚀 sendToInputAgent 시작:', { postId: data.postId, isUpdate });
        
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
                    // 1. postId를 직접 record ID로 사용 (단순화)
                    console.log(`🔍 1단계: postId로 Medicontent Posts 직접 조회: ${data.postId}`);
                    const recordId = data.postId;
                    console.log(`🔍 1단계: record ID 사용: ${recordId}`);
                    const medicontentPost = await AirtableService.getPost(recordId);
                    console.log(`🔍 1단계 결과:`, medicontentPost);
                    
                    if (medicontentPost) {
                        medicontentRecordId = medicontentPost.id; // Medicontent Posts record ID
                        medicontentPostId = medicontentPost.postId; // Medicontent Posts Post Id (동일값)
                        postData = medicontentPost;
                        
                        console.log(`✅ Medicontent Posts 조회 성공:`);
                        console.log(`   - Record ID: ${medicontentRecordId}`);
                        console.log(`   - Post Id: ${medicontentPostId}`);
                        
                        // 2. Post Data Requests에서 attachment 데이터 가져오기 (이미지용)
                        const postDataRequestId = data.postId;
                        const postDataRequest = await AirtableService.getDataRequestById(postDataRequestId);
                        console.log(`🔍 2단계: Post Data Requests attachment 조회:`, postDataRequest);
                        
                        if (postDataRequest) {
                            actualImageData = {
                                beforeImages: postDataRequest.beforeImages || [],
                                processImages: postDataRequest.processImages || [],
                                afterImages: postDataRequest.afterImages || []
                            };
                            console.log(`🔍 actualImageData:`, actualImageData);
                        } else {
                            console.warn('⚠️ Post Data Requests를 찾을 수 없음 (attachment 조회 실패)');
                        }
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
            question3_visit_images: (data.beforeImages || []).map((img: string, index: number) => {
                const attachments = Array.isArray(actualImageData?.beforeImages) ? actualImageData.beforeImages : [];
                
                // attachment 찾기 - img가 ID가 아닐 수도 있으므로 여러 방법으로 시도
                let attachment = attachments.find((att: any) => att.id === img);
                if (!attachment) {
                    // ID로 찾지 못하면 filename이나 name으로 찾기 시도
                    attachment = attachments.find((att: any) => 
                        att.filename === img || att.name === img || 
                        att.url?.includes(img) || att.url?.endsWith(img)
                    );
                }
                
                console.log('🔍 beforeImages attachment 검색:', { 
                    searchTerm: img, 
                    foundAttachment: attachment,
                    allAttachments: attachments.map(a => ({ 
                        id: a?.id, 
                        filename: a?.filename, 
                        name: a?.name,
                        url: a?.url 
                    })) 
                });
                
                const descriptions = splitImageDescriptions(data.beforeImagesText || "", data.beforeImages?.length || 0);
                console.log('🔍 beforeImagesText 원본:', data.beforeImagesText);
                console.log('🔍 분리된 descriptions:', descriptions);
                console.log('🔍 현재 index:', index, '해당 description:', descriptions[index]);
                
                // filename 우선순위: filename > name > url에서 파일명 추출 > 원본 img 값
                let finalFilename = img; // fallback
                if (attachment) {
                    if (attachment.filename) {
                        finalFilename = attachment.filename;
                    } else if (attachment.name) {
                        finalFilename = attachment.name;
                    } else if (attachment.url) {
                        // URL에서 파일명 추출 시도
                        const urlParts = attachment.url.split('/');
                        const lastPart = urlParts[urlParts.length - 1];
                        if (lastPart && lastPart.includes('.')) {
                            finalFilename = lastPart;
                        }
                    }
                } else {
                    // attachment를 찾지 못한 경우, img 자체가 파일명일 수 있음
                    console.log('⚠️ attachment를 찾지 못함, img 값을 파일명으로 사용:', img);
                }
                
                console.log('🔍 최종 filename:', finalFilename);
                
                return {
                    filename: finalFilename,
                    description: descriptions[index] || ""
                };
            }),
            question4_treatment: data.treatmentProcessMessage || "",
            question5_therapy_images: (data.processImages || []).map((img: string, index: number) => {
                const attachments = Array.isArray(actualImageData?.processImages) ? actualImageData.processImages : [];
                
                // attachment 찾기 - img가 ID가 아닐 수도 있으므로 여러 방법으로 시도
                let attachment = attachments.find((att: any) => att.id === img);
                if (!attachment) {
                    attachment = attachments.find((att: any) => 
                        att.filename === img || att.name === img || 
                        att.url?.includes(img) || att.url?.endsWith(img)
                    );
                }
                
                console.log('🔍 processImages attachment 검색:', { 
                    searchTerm: img, 
                    foundAttachment: attachment,
                    allAttachments: attachments.map(a => ({ 
                        id: a?.id, 
                        filename: a?.filename, 
                        name: a?.name,
                        url: a?.url 
                    })) 
                });
                
                const descriptions = splitImageDescriptions(data.processImagesText || "", data.processImages?.length || 0);
                console.log('🔍 processImagesText 원본:', data.processImagesText);
                console.log('🔍 분리된 descriptions:', descriptions);
                console.log('🔍 현재 index:', index, '해당 description:', descriptions[index]);
                
                // filename 우선순위: filename > name > url에서 파일명 추출 > 원본 img 값
                let finalFilename = img; // fallback
                if (attachment) {
                    if (attachment.filename) {
                        finalFilename = attachment.filename;
                    } else if (attachment.name) {
                        finalFilename = attachment.name;
                    } else if (attachment.url) {
                        const urlParts = attachment.url.split('/');
                        const lastPart = urlParts[urlParts.length - 1];
                        if (lastPart && lastPart.includes('.')) {
                            finalFilename = lastPart;
                        }
                    }
                } else {
                    console.log('⚠️ attachment를 찾지 못함, img 값을 파일명으로 사용:', img);
                }
                
                return {
                    filename: finalFilename,
                    description: descriptions[index] || ""
                };
            }),
            question6_result: data.treatmentResultMessage || "",
            question7_result_images: (data.afterImages || []).map((img: string, index: number) => {
                const attachments = Array.isArray(actualImageData?.afterImages) ? actualImageData.afterImages : [];
                
                // attachment 찾기 - img가 ID가 아닐 수도 있으므로 여러 방법으로 시도
                let attachment = attachments.find((att: any) => att.id === img);
                if (!attachment) {
                    attachment = attachments.find((att: any) => 
                        att.filename === img || att.name === img || 
                        att.url?.includes(img) || att.url?.endsWith(img)
                    );
                }
                
                console.log('🔍 afterImages attachment 검색:', { 
                    searchTerm: img, 
                    foundAttachment: attachment,
                    allAttachments: attachments.map(a => ({ 
                        id: a?.id, 
                        filename: a?.filename, 
                        name: a?.name,
                        url: a?.url 
                    })) 
                });
                
                const descriptions = splitImageDescriptions(data.afterImagesText || "", data.afterImages?.length || 0);
                console.log('🔍 afterImagesText 원본:', data.afterImagesText);
                console.log('🔍 분리된 descriptions:', descriptions);
                console.log('🔍 현재 index:', index, '해당 description:', descriptions[index]);
                
                // filename 우선순위: filename > name > url에서 파일명 추출 > 원본 img 값
                let finalFilename = img; // fallback
                if (attachment) {
                    if (attachment.filename) {
                        finalFilename = attachment.filename;
                    } else if (attachment.name) {
                        finalFilename = attachment.name;
                    } else if (attachment.url) {
                        const urlParts = attachment.url.split('/');
                        const lastPart = urlParts[urlParts.length - 1];
                        if (lastPart && lastPart.includes('.')) {
                            finalFilename = lastPart;
                        }
                    }
                } else {
                    console.log('⚠️ attachment를 찾지 못함, img 값을 파일명으로 사용:', img);
                }
                
                return {
                    filename: finalFilename,
                    description: descriptions[index] || ""
                };
            }),
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

        // FastAPI input_agent 엔드포인트 호출
        console.log('🚀 FastAPI 호출 시작:', `${fastApiUrl}/api/input-agent`);
        console.log('📤 전송할 데이터 크기:', JSON.stringify(inputAgentData).length);
        
        const response = await fetch(`${fastApiUrl}/api/input-agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputAgentData)
        });

        console.log('📡 FastAPI 응답 상태:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ FastAPI input_agent 전송 성공:', result);
            return result;
        } else {
            const errorText = await response.text();
            console.error('❌ FastAPI input_agent 전송 실패:', response.statusText);
            console.error('❌ FastAPI 에러 응답:', errorText);
            throw new Error(`FastAPI 응답 실패: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ FastAPI input_agent 전송 오류:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('📨 POST 요청 시작 - 자료 요청 제출');
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
                // postId를 직접 record ID로 사용 (단순화)
                const recordId = postId;
                const medicontentPost = await AirtableService.getPost(recordId);
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
                    
                    await AirtableService.updatePostStatus(medicontentPost.id, '병원 작업 중');
                    console.log('✅ Medicontent Posts 상태 변경: 병원 작업 중');
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
            actualPostDataRequestPostId, // Post Data Requests의 record ID (recXXXXX)
            actualPostDataRequestPostIdFull, // Post Data Requests의 full ID (post_recXXXXX)
            actualMedicontentPostId, // Medicontent Posts의 실제 Post Id
            actualMedicontentRecordId // Medicontent Posts의 record ID
        };
        
        try {
            const inputAgentResult = await sendToInputAgent(dataWithRealPostIds);
            console.log('✅ FastAPI input_agent 등록 완료');
            
            return NextResponse.json({ 
                message: '자료 요청이 제출되었습니다.',
                airtable: '저장 완료',
                inputAgent: '등록 완료'
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
        console.error('자료 요청 제출 API 오류:', error);
        
        // 구체적인 에러 메시지 제공
        let errorMessage = '자료 요청 제출에 실패했습니다.';
        
        if (error instanceof Error) {
            // 병원 정보 관련 에러인 경우 구체적인 메시지 제공
            if (error.message.includes('병원 정보가 등록되지 않았습니다')) {
                errorMessage = error.message;
            }
            // Airtable 관련 에러인 경우
            else if (error.message.includes('Airtable') || error.message.includes('base')) {
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
                // postId를 직접 record ID로 사용 (단순화)
                const recordId = postId;
                const medicontentPost = await AirtableService.getPost(recordId);
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
                    
                    await AirtableService.updatePostStatus(medicontentPost.id, '병원 작업 중');
                    console.log('✅ Medicontent Posts 상태 변경 (PUT): 병원 작업 중');
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
            actualPostDataRequestPostId, // Post Data Requests의 record ID (recXXXXX)
            actualPostDataRequestPostIdFull, // Post Data Requests의 full ID (post_recXXXXX)
            actualMedicontentPostId, // Medicontent Posts의 실제 Post Id
            actualMedicontentRecordId // Medicontent Posts의 record ID
        };
        
        try {
            const inputAgentResult = await sendToInputAgent(dataWithRealPostIds, true); // 업데이트 모드로 호출
            console.log('✅ FastAPI input_agent 업데이트 완료');
            
            return NextResponse.json({ 
                message: '자료 요청이 업데이트되었습니다.',
                airtable: '업데이트 완료',
                inputAgent: '업데이트 완료'
            });
        } catch (fastApiError) {
            console.warn('⚠️ FastAPI 업데이트 실패, Airtable만 업데이트됨:', fastApiError);
            
            return NextResponse.json({ 
                message: '자료 요청이 업데이트되었습니다.',
                warning: 'FastAPI 연동 실패 (백엔드 로그 미저장)'
            });
        }
    } catch (error) {
        console.error('자료 요청 업데이트 API 오류:', error);
        
        // 구체적인 에러 메시지 제공
        let errorMessage = '자료 요청 업데이트에 실패했습니다.';
        
        if (error instanceof Error) {
            // 병원 정보 관련 에러인 경우 구체적인 메시지 제공
            if (error.message.includes('병원 정보가 등록되지 않았습니다')) {
                errorMessage = error.message;
            }
            // Airtable 관련 에러인 경우
            else if (error.message.includes('Airtable') || error.message.includes('base')) {
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
