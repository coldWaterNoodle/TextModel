import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 검색 유입량 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') as '전체' | '임플란트' | '신경치료' || '전체';
    
    const data = await AirtableService.getSearchInflowData(subject);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('검색 유입량 조회 오류:', error);
    return NextResponse.json(
      { error: '검색 유입량 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
