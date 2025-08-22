import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 블로그 주간 메트릭스 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 추출
    const postId = searchParams.get('postId') || undefined;
    const weekStart = searchParams.get('weekStart') || undefined;

    // 데이터 조회
    const metrics = await AirtableService.getBlogWeeklyMetrics(postId, weekStart);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('블로그 메트릭스 조회 오류:', error);
    return NextResponse.json(
      { error: '블로그 메트릭스 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
