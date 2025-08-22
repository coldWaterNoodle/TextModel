import { NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET() {
  try {
    const posts = await AirtableService.getCafePosts(100);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('카페 포스트 API 오류:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}


