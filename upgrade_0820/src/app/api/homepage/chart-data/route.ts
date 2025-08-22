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
    const chartType = searchParams.get('chartType') || 'seo-score';

    let records;
    let data;

    switch (chartType) {
      case 'seo-score':
        records = await base('Demo Homepage SEO Scores')
          .select({
            filterByFormula: `{Subject} = '${subject}'`,
            sort: [{ field: 'Date', direction: 'asc' }],
            maxRecords: dateRange === '주간' ? 7 : 30
          })
          .firstPage();

        data = records.map(record => ({
          date: record.get('Date') as string,
          score: record.get('SEO Score') as number || 85,
          maxScore: record.get('Max Score') as number || 100
        }));
        break;

      case 'search-inflow':
        records = await base('Demo Homepage Search Inflow')
          .select({
            filterByFormula: `{Subject} = '${subject}'`,
            sort: [{ field: 'Date', direction: 'asc' }],
            maxRecords: dateRange === '주간' ? 7 : 30
          })
          .firstPage();

        data = records.map(record => ({
          date: record.get('Date') as string,
          organicInflow: record.get('Organic Inflow') as number || 0,
          directInflow: record.get('Direct Inflow') as number || 0,
          totalInflow: record.get('Total Inflow') as number || 0
        }));
        break;

      case 'conversion-rate':
        records = await base('Demo Homepage Conversion Rates')
          .select({
            filterByFormula: `{Subject} = '${subject}'`,
            sort: [{ field: 'Date', direction: 'asc' }],
            maxRecords: dateRange === '주간' ? 7 : 30
          })
          .firstPage();

        data = records.map(record => ({
          date: record.get('Date') as string,
          conversionRate: record.get('Conversion Rate') as number || 0,
          sessionDuration: record.get('Average Session Duration') as number || 0,
          bounceRate: record.get('Bounce Rate') as number || 0
        }));
        break;

      default:
        return NextResponse.json({ error: '지원하지 않는 차트 타입입니다.' }, { status: 400 });
    }

    // 데이터가 없으면 더미 데이터 반환
    if (data.length === 0) {
      const days = dateRange === '주간' ? 7 : 30;
      const today = new Date();
      
      data = Array.from({ length: days }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1 - i));
        
        switch (chartType) {
          case 'seo-score':
            return {
              date: date.toISOString().split('T')[0],
              score: 80 + Math.floor(Math.random() * 15),
              maxScore: 100
            };
          case 'search-inflow':
            return {
              date: date.toISOString().split('T')[0],
              organicInflow: 800 + Math.floor(Math.random() * 400),
              directInflow: 200 + Math.floor(Math.random() * 200),
              totalInflow: 1000 + Math.floor(Math.random() * 600)
            };
          case 'conversion-rate':
            return {
              date: date.toISOString().split('T')[0],
              conversionRate: 3.5 + Math.random() * 2,
              sessionDuration: 120 + Math.floor(Math.random() * 60),
              bounceRate: 30 + Math.floor(Math.random() * 20)
            };
          default:
            return { date: date.toISOString().split('T')[0] };
        }
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('차트 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '차트 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
