export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 홈페이지 차트 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('dateRange') as '주간' | '월간' || '주간';
    const subject = searchParams.get('subject') as '전체' | '임플란트' | '신경치료' || '전체';
    
    const data = await AirtableService.getHomepageChartData(periodType, subject);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('홈페이지 차트 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '홈페이지 차트 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
