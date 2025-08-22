'use client';

import { useState, useEffect } from 'react';
import { KpiCard } from '@/components/channels/KpiCard';

type SubjectFilter = '전체' | '임플란트' | '신경치료';

interface CampaignStatus { normalCount: number; totalCount: number; currentCampaignName: string; }
interface SearchInflow { total: number; changeRate: number; topKeywords: string[]; }
interface PlaceConversion { rate: number; changeRate: number; topPosts: string[]; }

interface KpiCardClientWrapperProps {
  initialCampaignStatus: CampaignStatus | null;
  initialSearchInflow: SearchInflow | null;
  initialPlaceConversion: PlaceConversion | null;
}

export function KpiCardClientWrapper({
  initialCampaignStatus,
  initialSearchInflow,
  initialPlaceConversion
}: KpiCardClientWrapperProps) {
  const [campaignStatus, setCampaignStatus] = useState(initialCampaignStatus);
  const [searchInflowData, setSearchInflowData] = useState(initialSearchInflow);
  const [placeConversionData, setPlaceConversionData] = useState(initialPlaceConversion);
  
  const [kpiFilters, setKpiFilters] = useState({
    searchInflow: '전체' as SubjectFilter,
    placeConversion: '전체' as SubjectFilter
  });

  useEffect(() => {
    const fetchSearchInflowData = async () => {
      try {
        const response = await fetch(`/api/blog/search-inflow?subject=${kpiFilters.searchInflow}`);
        if (response.ok) setSearchInflowData(await response.json());
      } catch (error) { console.error('검색 유입량 데이터 조회 실패:', error); }
    };
    fetchSearchInflowData();
  }, [kpiFilters.searchInflow]);

  useEffect(() => {
    const fetchPlaceConversionData = async () => {
      try {
        const response = await fetch(`/api/blog/place-conversion?subject=${kpiFilters.placeConversion}`);
        if (response.ok) setPlaceConversionData(await response.json());
      } catch (error) { console.error('플레이스 전환 데이터 조회 실패:', error); }
    };
    fetchPlaceConversionData();
  }, [kpiFilters.placeConversion]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KpiCard
        title="캠페인 현황"
        value={`정상 노출 ${campaignStatus?.normalCount ?? 0}/${campaignStatus?.totalCount ?? 0}`}
        description={`현재 캠페인: ${campaignStatus?.currentCampaignName ?? '정보 없음'}`}
        change="캠페인 관리"
        changeType="action"
        footer={campaignStatus?.totalCount && campaignStatus.totalCount > campaignStatus.normalCount ? `⚠️ 주의: ${campaignStatus.totalCount - campaignStatus.normalCount}개` : '모든 포스트 정상'}
      />
      <KpiCard
        title="검색 유입량"
        value={`${searchInflowData?.total ?? 0} 회`}
        description="네이버 검색 유입 분석"
        change={`${(searchInflowData?.changeRate ?? 0) > 0 ? '+' : ''}${searchInflowData?.changeRate ?? 0}%`}
        changeType={(searchInflowData?.changeRate ?? 0) >= 0 ? 'increase' : 'decrease'}
        filters={['전체', '임플란트', '신경치료']}
        selectedFilter={kpiFilters.searchInflow}
        onFilterChange={(value) => setKpiFilters(prev => ({ ...prev, searchInflow: value as SubjectFilter }))}
        footer={searchInflowData?.topKeywords?.join(', ') ?? 'TOP 3 유입 키워드'}
      />
      <KpiCard
        title="플레이스 전환"
        value={`${placeConversionData?.rate ?? 0}%`}
        description="블로그 to 플레이스 클릭"
        change={`${(placeConversionData?.changeRate ?? 0) > 0 ? '+' : ''}${placeConversionData?.changeRate ?? 0}%`}
        changeType={(placeConversionData?.changeRate ?? 0) >= 0 ? 'increase' : 'decrease'}
        filters={['전체', '임플란트', '신경치료']}
        selectedFilter={kpiFilters.placeConversion}
        onFilterChange={(value) => setKpiFilters(prev => ({ ...prev, placeConversion: value as SubjectFilter }))}
      />
    </div>
  );
}
