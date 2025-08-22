import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET() {
    try {
        // 우선 행 단위 테이블을 사용하고, 없으면 CSV 백필드 사용
        const rows = await AirtableService.getBenchmarkHospitalRows();
        if (rows.length > 0) {
            return NextResponse.json({ benchmarkHospitals: rows.map(r => r.hospitalName) });
        }
        const fallback = await AirtableService.getBenchmarkSettings();
        return NextResponse.json(fallback || { benchmarkHospitals: [] });
    } catch (error) {
        console.error('벤치마크 설정 조회 API 오류:', error);
        return NextResponse.json({ error: '벤치마크 설정 조회 실패' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const arr: string[] = Array.isArray(body?.benchmarkHospitals) ? body.benchmarkHospitals : [];
        // 행 단위 저장 + CSV 필드 동시 유지
        await AirtableService.setBenchmarkHospitalRows(arr);
        return NextResponse.json({ ok: true, count: arr.length });
    } catch (error) {
        console.error('벤치마크 설정 저장 API 오류:', error);
        return NextResponse.json({ error: '벤치마크 설정 저장 실패' }, { status: 500 });
    }
}


