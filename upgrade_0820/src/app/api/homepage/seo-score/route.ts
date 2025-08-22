import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || '전체';
    const dateRange = searchParams.get('dateRange') || '주간';

    // 최신 SEO 점수 데이터 조회
    const seoScoreRecords = await base('Demo Homepage SEO Scores')
      .select({
        filterByFormula: `{Subject} = '${subject}'`,
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: 1
      })
      .firstPage();

    if (seoScoreRecords.length === 0) {
      return NextResponse.json({
        currentScore: 85,
        maxScore: 100,
        improvementItems: ['메타 디스크립션 3개', '이미지 alt 텍스트 12개', '페이지 속도 개선'],
        imageAltTextCount: 12,
        pageSpeedStatus: 'needs-improvement',
        metaDescriptionIssues: 3
      });
    }

    const record = seoScoreRecords[0];
    const improvementItems = record.get('Improvement Items') as string || '';
    
    return NextResponse.json({
      currentScore: record.get('SEO Score') as number || 85,
      maxScore: record.get('Max Score') as number || 100,
      improvementItems: improvementItems ? improvementItems.split(',').map(item => item.trim()) : [],
      imageAltTextCount: record.get('Image Alt Text Count') as number || 12,
      pageSpeedStatus: record.get('Page Speed Status') as string || 'needs-improvement',
      metaDescriptionIssues: record.get('Meta Description Issues') as number || 3
    });

  } catch (error) {
    console.error('SEO 점수 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: 'SEO 점수 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
