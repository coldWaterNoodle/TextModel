import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 특정 포스트의 순위 추이 데이터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const data = await AirtableService.getBlogRankingTrends(postId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('순위 추이 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '순위 추이 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
