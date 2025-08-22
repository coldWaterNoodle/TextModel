import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET() {
    try {
        const data = await AirtableService.getIntegrationSettings();
        return NextResponse.json(data || {});
    } catch (error) {
        console.error('연동 설정 조회 API 오류:', error);
        return NextResponse.json({ error: '연동 설정 조회 실패' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        await AirtableService.upsertIntegrationSettings(body);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('연동 설정 저장 API 오류:', error);
        return NextResponse.json({ error: '연동 설정 저장 실패' }, { status: 500 });
    }
}


