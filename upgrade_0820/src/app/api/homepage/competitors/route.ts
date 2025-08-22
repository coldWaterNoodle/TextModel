import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest) {
  try {
    // Benchmark Hospitals에서 경쟁사 데이터 조회
    const benchmarkRecords = await base('Benchmark Hospitals')
      .select({
        maxRecords: 10
      })
      .firstPage();

    if (benchmarkRecords.length === 0) {
      // 더미 데이터 반환
      const dummyData = [
        {
          competitorName: '강남미소치과',
          websiteUrl: 'https://gangnam-miso.com',
          seoScore: 78,
          searchInflow: 200,
          conversionRate: 3.8,
          rankingKeywords: 142,
          backlinks: 1980
        },
        {
          competitorName: '서울스마일치과',
          websiteUrl: 'https://seoul-smile.com',
          seoScore: 72,
          searchInflow: 180,
          conversionRate: 3.5,
          rankingKeywords: 128,
          backlinks: 1650
        },
        {
          competitorName: '한강치과',
          websiteUrl: 'https://hangang-dental.com',
          seoScore: 68,
          searchInflow: 160,
          conversionRate: 3.2,
          rankingKeywords: 115,
          backlinks: 1420
        },
        {
          competitorName: '역삼프리미어치과',
          websiteUrl: 'https://yeoksam-premier.com',
          seoScore: 65,
          searchInflow: 150,
          conversionRate: 2.9,
          rankingKeywords: 98,
          backlinks: 1180
        }
      ];

      return NextResponse.json(dummyData);
    }

    const data = benchmarkRecords.map((record, index) => {
      const hospitalName = record.get('Hospital Name') || `병원${index + 1}`;
      const seoScore = 65 + Math.floor(Math.random() * 20); // 65-85 범위
      const searchInflow = 150 + Math.floor(Math.random() * 100); // 150-250 범위
      const conversionRate = 2.5 + Math.random() * 2; // 2.5-4.5 범위
      
      return {
        competitorName: hospitalName,
        websiteUrl: `https://${String(hospitalName).toLowerCase().replace(/\s+/g, '')}.com`,
        seoScore: seoScore,
        searchInflow: searchInflow,
        conversionRate: Math.round(conversionRate * 100) / 100,
        rankingKeywords: 80 + Math.floor(Math.random() * 80),
        backlinks: 800 + Math.floor(Math.random() * 1200)
      };
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('경쟁사 분석 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '경쟁사 분석 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
