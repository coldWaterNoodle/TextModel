import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 블로그 포스트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 추출
    const status = searchParams.get('status') || undefined;
    const subject = searchParams.get('subject') || undefined;
    const campaignName = searchParams.get('campaignName') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // 필터 객체 생성
    const filters: any = {};
    if (status) filters.status = status;
    if (subject) filters.subject = subject;
    if (campaignName) filters.campaignName = campaignName;
    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate };
    }

    // 데이터 조회
    const posts = await AirtableService.getBlogPostsSummary(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('블로그 포스트 조회 오류:', error);
    return NextResponse.json(
      { error: '블로그 포스트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
