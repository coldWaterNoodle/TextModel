import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 블로그 KPI 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 추출
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // 날짜 범위 설정
    const dateRange = startDate && endDate 
      ? { start: startDate, end: endDate }
      : undefined;

    // KPI 데이터 조회
    const kpiData = await AirtableService.getBlogKpiData(dateRange);

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error('블로그 KPI 조회 오류:', error);
    return NextResponse.json(
      { error: '블로그 KPI 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
