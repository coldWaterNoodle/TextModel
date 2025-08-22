import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// 이미지 설명을 각 이미지별로 분리하는 함수
function splitImageDescriptions(descriptionsText: string, imageCount: number): string[] {
    if (!descriptionsText) {
        return Array(imageCount).fill("");
    }
    
    // 쉼표나 줄바꿈으로 분리
    const descriptions = descriptionsText
        .split(/,|\n/)
        .map(desc => desc.trim())
        .filter(desc => desc.length > 0);
    
    // 설명이 이미지 개수보다 적으면 마지막 설명을 반복
    const result = [];
    for (let i = 0; i < imageCount; i++) {
        if (i < descriptions.length) {
            result.push(descriptions[i]);
        } else if (descriptions.length > 0) {
            result.push(descriptions[descriptions.length - 1]);
        } else {
            result.push("");
        }
    }
    
    return result;
}

// FastAPI 백엔드에 데이터 전달하는 함수
async function sendToInputAgent(data: any, isUpdate: boolean = false) {
    try {
        // FastAPI 서버 URL (환경변수로 설정 가능)
        const fastApiUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';
        
        // 실제 등록된 병원 정보 가져오기
        const hospitalInfo = await AirtableService.getHospitalSettings();
        console.log('📋 실제 등록된 병원 정보:', hospitalInfo);
        
        if (!hospitalInfo) {
            throw new Error('병원 정보가 등록되지 않았습니다. 설정에서 병원 정보를 먼저 등록해주세요.');
        }
        
        let actualImageData = null;
        let postData = null;
        if (data.postId) {
            try {
                actualImageData = await AirtableService.getDataRequest(data.postId);
                
                // Post Data Request의 Post ID에서 "post_" 접두사 제거하여 실제 record ID 얻기
                const actualRecordId = data.postId.replace('post_', '');
                postData = await AirtableService.getPost(actualRecordId);
            } catch (error) {
                console.warn('Airtable 이미지 데이터 가져오기 실패:', error);
            }
        }
        
        // 실제 파일명을 사용하여 이미지 매핑
        const mapImages = (attachmentIds: string[], fieldName: string, description: string) => {
            if (!actualImageData || !attachmentIds?.length) {
                return attachmentIds.map((id: string) => ({ filename: id, description: description || "" }));
            }
            
            const attachments = actualImageData[fieldName] || [];
            return attachmentIds.map((id: string) => {
                const attachment = Array.isArray(attachments) ? attachments.find((att: any) => att.id === id) : null;
                return {
                    filename: attachment?.filename || id,
                    description: description || ""
                };
            });
        };

        // UI 데이터를 input_agent 형식으로 변환
        const inputAgentData = {
            hospital: {
                name: hospitalInfo.hospitalName,
                save_name: hospitalInfo.hospitalName.replace(/[^가-힣a-zA-Z0-9]/g, '_').toLowerCase(),
                address: `${hospitalInfo.addressLine1} ${hospitalInfo.addressLine2 || ''}`.trim(),
                phone: hospitalInfo.phone
            },
            category: postData?.treatmentType || "",
            question1_concept: data.conceptMessage || "",
            question2_condition: data.patientCondition || "", 
            question3_visit_images: (data.beforeImages || []).map((img: string, index: number) => {
                const attachments = Array.isArray(actualImageData?.beforeImages) ? actualImageData.beforeImages : [];
                const attachment = attachments.find((att: any) => att.id === img);
                const descriptions = splitImageDescriptions(data.beforeImagesText || "", data.beforeImages?.length || 0);
                return {
                    filename: attachment?.filename || img,
                    description: descriptions[index] || ""
                };
            }),
            question4_treatment: data.treatmentProcessMessage || "",
            question5_therapy_images: (data.processImages || []).map((img: string, index: number) => {
                const attachments = Array.isArray(actualImageData?.processImages) ? actualImageData.processImages : [];
                const attachment = attachments.find((att: any) => att.id === img);
                const descriptions = splitImageDescriptions(data.processImagesText || "", data.processImages?.length || 0);
                return {
                    filename: attachment?.filename || img,
                    description: descriptions[index] || ""
                };
            }),
            question6_result: data.treatmentResultMessage || "",
            question7_result_images: (data.afterImages || []).map((img: string, index: number) => {
                const attachments = Array.isArray(actualImageData?.afterImages) ? actualImageData.afterImages : [];
                const attachment = attachments.find((att: any) => att.id === img);
                const descriptions = splitImageDescriptions(data.afterImagesText || "", data.afterImages?.length || 0);
                return {
                    filename: attachment?.filename || img,
                    description: descriptions[index] || ""
                };
            }),
            question8_extra: data.additionalMessage || "",
            include_tooth_numbers: false,
            tooth_numbers: [],
            persona_candidates: [],
            representative_persona: "",
            postId: data.postId, // 추가 정보로 postId 포함
            updateMode: isUpdate, // 업데이트 모드 여부
            existingCaseId: data.caseId || null, // 기존 case_id가 있다면 전달
            isFinalSave: data.isFinalSave || false // 최종 저장 여부 플래그
        };

        // FastAPI input_agent 엔드포인트 호출
        const response = await fetch(`${fastApiUrl}/api/input-agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputAgentData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ FastAPI input_agent 전송 성공:', result);
            return result;
        } else {
            console.error('❌ FastAPI input_agent 전송 실패:', response.statusText);
            throw new Error(`FastAPI 응답 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ FastAPI input_agent 전송 오류:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('POST 요청 데이터:', body);
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
        await AirtableService.submitDataRequest(dataToSubmit);
        console.log('✅ Airtable 저장 완료');

        // 2. FastAPI input_agent에 데이터 전달 (백엔드 로그용)
        try {
            const inputAgentResult = await sendToInputAgent(dataToSubmit);
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
        return NextResponse.json(
            { error: '자료 요청 제출에 실패했습니다.' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('PUT 요청 데이터:', body);
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

        // 2. FastAPI input_agent에도 업데이트된 데이터 전달 (백엔드 로그용)
        try {
            const inputAgentResult = await sendToInputAgent(dataToUpdate, true); // 업데이트 모드로 호출
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
        return NextResponse.json(
            { error: '자료 요청 업데이트에 실패했습니다.' },
            { status: 500 }
        );
    }
}
