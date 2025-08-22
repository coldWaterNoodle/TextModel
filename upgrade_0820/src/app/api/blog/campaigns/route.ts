import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 블로그 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 추출
    const status = searchParams.get('status') as '진행중' | '완료' | '예정' | null;

    // 데이터 조회
    const campaigns = await AirtableService.getBlogCampaigns(status || undefined);

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('블로그 캠페인 조회 오류:', error);
    return NextResponse.json(
      { error: '블로그 캠페인 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
