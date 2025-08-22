import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || '전체';

    // 최신 전환율 데이터 조회
    const conversionRecords = await base('Demo Homepage Conversion Rates')
      .select({
        filterByFormula: `{Subject} = '${subject}'`,
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: 1
      })
      .firstPage();

    if (conversionRecords.length === 0) {
      return NextResponse.json({
        currentRate: 4.2,
        changeRate: -0.3,
        averageSessionDuration: '2분 35초',
        bounceRate: 35
      });
    }

    const record = conversionRecords[0];
    const sessionDurationSeconds = record.get('Average Session Duration') as number || 155;
    const minutes = Math.floor(sessionDurationSeconds / 60);
    const seconds = sessionDurationSeconds % 60;

    return NextResponse.json({
      currentRate: record.get('Conversion Rate') as number || 4.2,
      changeRate: record.get('Change Rate') as number || -0.3,
      averageSessionDuration: `${minutes}분 ${seconds}초`,
      bounceRate: record.get('Bounce Rate') as number || 35
    });

  } catch (error) {
    console.error('전환율 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '전환율 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
