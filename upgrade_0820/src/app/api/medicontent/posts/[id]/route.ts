import { NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

type Params = { params: Promise<{ id: string }> };

export async function GET(
    request: Request,
    { params }: Params
) {
    try {
        const { id } = await params;
        const post = await AirtableService.getPost(id);
        
        if (!post) {
            return NextResponse.json(
                { error: '포스트를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('포스트 조회 API 오류:', error);
        return NextResponse.json(
            { error: '포스트 조회에 실패했습니다.' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: Params
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (status) {
            await AirtableService.updatePostStatus(id, status);
        }

        return NextResponse.json({ message: '포스트가 업데이트되었습니다.' });
    } catch (error) {
        console.error('포스트 업데이트 API 오류:', error);
        return NextResponse.json(
            { error: '포스트 업데이트에 실패했습니다.' },
            { status: 500 }
        );
    }
}
