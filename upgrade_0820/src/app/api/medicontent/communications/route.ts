import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (postId) {
            // 특정 포스트의 커뮤니케이션 조회
            const communications = await AirtableService.getPostCommunications(postId);
            return NextResponse.json(communications);
        } else {
            // 전체 활동 피드 조회
            const activities = await AirtableService.getRecentActivity();
            return NextResponse.json(activities);
        }
    } catch (error) {
        console.error('커뮤니케이션 조회 API 오류:', error);
        return NextResponse.json(
            { error: '커뮤니케이션 조회에 실패했습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postId, sender, senderName, content, type } = body;

        await AirtableService.addCommunication({
            postId,
            sender,
            senderName,
            content,
            type
        });

        return NextResponse.json({ message: '메시지가 전송되었습니다.' });
    } catch (error) {
        console.error('커뮤니케이션 추가 API 오류:', error);
        return NextResponse.json(
            { error: '메시지 전송에 실패했습니다.' },
            { status: 500 }
        );
    }
}
