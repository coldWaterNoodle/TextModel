import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || '전체';
    const pageType = searchParams.get('pageType') || 'conversion'; // conversion 또는 bounce

    // 페이지 성과 데이터 조회
    const pageRecords = await base('Demo Homepage Top Pages')
      .select({
        filterByFormula: `AND({Subject} = '${subject}', {Page Type} = '${pageType}')`,
        sort: pageType === 'conversion' 
          ? [{ field: 'Conversion Rate', direction: 'desc' }]
          : [{ field: 'Bounce Rate', direction: 'desc' }],
        maxRecords: 10
      })
      .firstPage();

    if (pageRecords.length === 0) {
      // 더미 데이터 반환
      const dummyData = pageType === 'conversion' 
        ? [
            { pageUrl: '/implant', pageTitle: '임플란트 치료', conversionRate: 6.8, bounceRate: 28, sessionDuration: 185, pageViews: 3200 },
            { pageUrl: '/nerve-treatment', pageTitle: '신경치료', conversionRate: 5.2, bounceRate: 32, sessionDuration: 165, pageViews: 2800 },
            { pageUrl: '/consultation', pageTitle: '상담 예약', conversionRate: 4.8, bounceRate: 35, sessionDuration: 145, pageViews: 2100 },
            { pageUrl: '/doctors', pageTitle: '의료진 소개', conversionRate: 3.9, bounceRate: 38, sessionDuration: 125, pageViews: 1800 },
            { pageUrl: '/location', pageTitle: '오시는 길', conversionRate: 3.2, bounceRate: 42, sessionDuration: 95, pageViews: 1500 }
          ]
        : [
            { pageUrl: '/news', pageTitle: '공지사항', conversionRate: 1.2, bounceRate: 68, sessionDuration: 45, pageViews: 800 },
            { pageUrl: '/gallery', pageTitle: '치료 사례', conversionRate: 2.1, bounceRate: 65, sessionDuration: 75, pageViews: 1200 },
            { pageUrl: '/insurance', pageTitle: '보험 안내', conversionRate: 1.8, bounceRate: 62, sessionDuration: 85, pageViews: 950 },
            { pageUrl: '/faq', pageTitle: '자주 묻는 질문', conversionRate: 2.5, bounceRate: 58, sessionDuration: 105, pageViews: 1100 },
            { pageUrl: '/contact', pageTitle: '문의하기', conversionRate: 1.5, bounceRate: 55, sessionDuration: 65, pageViews: 750 }
          ];

      return NextResponse.json(dummyData);
    }

    const data = pageRecords.map(record => ({
      pageUrl: record.get('Page URL') as string,
      pageTitle: record.get('Page Title') as string,
      conversionRate: record.get('Conversion Rate') as number || 0,
      bounceRate: record.get('Bounce Rate') as number || 0,
      sessionDuration: record.get('Session Duration') as number || 0,
      pageViews: record.get('Page Views') as number || 0
    }));

    return NextResponse.json(data);

  } catch (error) {
    console.error('상위 페이지 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '상위 페이지 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
