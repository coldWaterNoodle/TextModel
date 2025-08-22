import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 캠페인 현황 조회
export async function GET(request: NextRequest) {
  try {
    const status = await AirtableService.getCampaignStatus();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('캠페인 현황 조회 오류:', error);
    return NextResponse.json(
      { error: '캠페인 현황 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
