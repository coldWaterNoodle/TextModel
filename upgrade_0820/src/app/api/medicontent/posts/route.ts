import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET() {
    try {
        const posts = await AirtableService.getPosts();
        return NextResponse.json(posts);
    } catch (error) {
        console.error('포스트 조회 API 오류:', error);
        return NextResponse.json(
            { error: '포스트 조회에 실패했습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, type, status, publishDate, keywords, treatmentType } = body;

        // 새 포스트 생성 로직 (AirtableService에 추가 필요)
        // const newPost = await AirtableService.createPost({ ... });

        return NextResponse.json({ message: '포스트가 생성되었습니다.' });
    } catch (error) {
        console.error('포스트 생성 API 오류:', error);
        return NextResponse.json(
            { error: '포스트 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
