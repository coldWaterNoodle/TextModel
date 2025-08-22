import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || '전체';

    // 최신 검색 유입량 데이터 조회
    const inflowRecords = await base('Demo Homepage Search Inflow')
      .select({
        filterByFormula: `{Subject} = '${subject}'`,
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: 1
      })
      .firstPage();

    if (inflowRecords.length === 0) {
      return NextResponse.json({
        totalInflow: 12450,
        changeRate: 15,
        organicSearchRatio: 0.75,
        directInflowRatio: 0.25,
        topLandingPages: [
          { pageUrl: '/implant', pageTitle: '임플란트 치료', inflowCount: 3200 },
          { pageUrl: '/nerve-treatment', pageTitle: '신경치료', inflowCount: 2800 },
          { pageUrl: '/', pageTitle: '홈페이지', inflowCount: 2100 }
        ]
      });
    }

    const record = inflowRecords[0];
    const totalInflow = record.get('Total Inflow') as number || 12450;
    const organicInflow = record.get('Organic Inflow') as number || 9337;
    const directInflow = record.get('Direct Inflow') as number || 3113;

    return NextResponse.json({
      totalInflow,
      changeRate: record.get('Change Rate') as number || 15,
      organicSearchRatio: organicInflow / totalInflow,
      directInflowRatio: directInflow / totalInflow,
      topLandingPages: [
        { pageUrl: '/implant', pageTitle: '임플란트 치료', inflowCount: 3200 },
        { pageUrl: '/nerve-treatment', pageTitle: '신경치료', inflowCount: 2800 },
        { pageUrl: '/', pageTitle: '홈페이지', inflowCount: 2100 }
      ]
    });

  } catch (error) {
    console.error('검색 유입량 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '검색 유입량 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
