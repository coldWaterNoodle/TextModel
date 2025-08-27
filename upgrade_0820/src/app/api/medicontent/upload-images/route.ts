import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

export async function POST(request: NextRequest) {
    console.log('🚀 이미지 업로드 API 호출됨');
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        console.error('❌ Airtable 환경변수 누락:', {
            AIRTABLE_API_KEY: AIRTABLE_API_KEY ? '설정됨' : '누락',
            AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? '설정됨' : '누락'
        });
        return NextResponse.json({ error: 'Airtable 환경 변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    try {
        console.log('📝 FormData 파싱 시작...');
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const postId = formData.get('postId') as string;
        const imageType = formData.get('imageType') as 'before' | 'process' | 'after';
        
        console.log('📊 요청 데이터:', {
            filesCount: files.length,
            postId,
            imageType,
            fileNames: files.map(f => f.name)
        });

        if (!files || files.length === 0) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        }
        if (!postId || !imageType) {
            return NextResponse.json({ error: 'Post ID와 이미지 타입이 필요합니다.' }, { status: 400 });
        }

        // 1. Post Data Request 레코드 ID 가져오기 (없으면 생성)
        console.log('🔍 Post Data Request 레코드 찾기/생성 시작...');
        const recordId = await AirtableService.findOrCreateDataRequest(postId);
        console.log('✅ Post Data Request 레코드 ID:', recordId);

        const attachmentFieldMap = {
            before: 'Before Images',
            process: 'Process Images',
            after: 'After Images',
        };
        const attachmentFieldName = attachmentFieldMap[imageType];

        const uploadedAttachments = [];

        console.log('📁 파일 업로드 시작...');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`📎 파일 ${i + 1}/${files.length} 처리 중: ${file.name} (${file.type})`);
            
            if (!file.type.startsWith('image/')) {
                console.log('⚠️  이미지가 아닌 파일 스킵:', file.type);
                continue;
            }

            console.log('🔄 파일 변환 중...');
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64File = buffer.toString('base64');

            // 2. Airtable Content API로 업로드
            const uploadUrl = `https://content.airtable.com/v0/${AIRTABLE_BASE_ID}/${recordId}/${encodeURIComponent(attachmentFieldName)}/uploadAttachment`;
            console.log('🌐 업로드 URL:', uploadUrl);

            console.log('📡 Airtable API 요청 시작...');
            const airtableResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file: base64File,
                    filename: file.name,
                    contentType: file.type,
                }),
            });

            console.log('📋 Airtable API 응답 상태:', airtableResponse.status, airtableResponse.statusText);
            
            if (!airtableResponse.ok) {
                const errorText = await airtableResponse.text();
                console.error('❌ Airtable 업로드 실패:', {
                    status: airtableResponse.status,
                    statusText: airtableResponse.statusText,
                    body: errorText
                });
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(`Airtable 업로드 실패: ${errorData.error?.message || 'Unknown error'}`);
                } catch (parseError) {
                    throw new Error(`Airtable 업로드 실패: ${airtableResponse.status} ${airtableResponse.statusText}`);
                }
            }

            const responseData = await airtableResponse.json();
            console.log('Airtable API 응답:', JSON.stringify(responseData, null, 2));
            
            // 응답에서 새로 추가된 첨부파일 정보를 찾습니다.
            // 응답에 fields 객체가 있고, 해당 필드명이 배열인 경우에만 find를 시도합니다.
            const attachments = responseData?.fields?.[attachmentFieldName];
            if (Array.isArray(attachments)) {
                const newAttachment = attachments.find(
                    (att: any) => att.filename === file.name
                );
                if (newAttachment) {
                    uploadedAttachments.push(newAttachment);
                }
            } else if (responseData.id && responseData.fields) {
                // 만약 전체 레코드가 반환되었다면, 해당 필드에서 마지막 요소를 새 첨부파일로 간주할 수 있습니다.
                // 하지만 이 방법은 동시성 문제가 있을 수 있어 완벽하지 않습니다.
                // 우선은 위에서처럼 직접 찾는 것을 시도하고, 실패 시 이 부분을 활성화하거나 다른 방법을 강구합니다.
            }
        }

        return NextResponse.json({
            message: 'Airtable에 이미지 업로드 완료',
            attachments: uploadedAttachments,
        });
    } catch (error) {
        console.error('❌ 이미지 업로드 API 오류:', error);
        console.error('스택 트레이스:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            { 
                error: '이미지 업로드에 실패했습니다.',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
