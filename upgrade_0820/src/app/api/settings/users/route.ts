import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET() {
    try {
        const data = await AirtableService.getUsers();
        return NextResponse.json(data);
    } catch (error) {
        console.error('사용자 조회 API 오류:', error);
        return NextResponse.json({ error: '사용자 조회 실패' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        await AirtableService.addUser(body);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('사용자 생성 API 오류:', error);
        return NextResponse.json({ error: '사용자 생성 실패' }, { status: 500 });
    }
}


