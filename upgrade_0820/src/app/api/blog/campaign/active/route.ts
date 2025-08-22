import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

// GET: 활성 캠페인 조회
export async function GET(request: NextRequest) {
  try {
    // 현재 진행 중인 캠페인 조회
    const campaigns = await AirtableService.getBlogCampaigns('진행중');
    
    if (campaigns.length === 0) {
      return NextResponse.json(null);
    }

    // 가장 최근 캠페인 선택
    const activeCampaign = campaigns[0];
    
    // 해당 캠페인의 타겟 조회
    const targets = await AirtableService.getCampaignTargets(activeCampaign.id);
    
    // 포스트별 진행 항목 생성
    const items = targets.map(target => {
      const progressPercent = target.targetInflow > 0 
        ? (target.achievedInflow / target.targetInflow) * 100 
        : 0;
      
      return {
        date: target.publishDate,
        postId: target.postId,
        title: target.postTitle,
        keywords: target.keywords ? target.keywords.split(',').map(k => k.trim()) : [],
        targetInflow: target.targetInflow,
        achievedInflow: target.achievedInflow,
        progressPercent: Math.round(progressPercent * 10) / 10,
        rank: target.rank,
        seoScore: target.seoScore,
        legalStatus: target.legalStatus,
        postType: target.postType
      };
    });
    
    // 캠페인 전체 달성률 계산
    const totalAchievedInflow = items.reduce((sum, item) => sum + item.achievedInflow, 0);
    const totalTargetInflow = items.reduce((sum, item) => sum + item.targetInflow, 0);
    const campaignProgressPercent = totalTargetInflow > 0 
      ? (totalAchievedInflow / totalTargetInflow) * 100 
      : 0;
    
    return NextResponse.json({
      campaign: {
        id: activeCampaign.id,
        name: activeCampaign.name,
        periodStart: activeCampaign.periodStart,
        periodEnd: activeCampaign.periodEnd,
        subjectCluster: activeCampaign.subjectCluster
      },
      targetInflow: totalTargetInflow,
      achievedInflow: totalAchievedInflow,
      progressPercent: Math.round(campaignProgressPercent * 10) / 10,
      items: items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    });
  } catch (error) {
    console.error('활성 캠페인 조회 오류:', error);
    return NextResponse.json(
      { error: '활성 캠페인 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
