'use client';

import React, { useState, useEffect } from 'react';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SubjectFilter } from '@/components/dashboard/SubjectFilter';
import { KpiCard } from '@/components/channels/KpiCard';
import { Area, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Filter, ArrowDownUp, Download, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BlogPost {
  id: string;
  postId: string;
  postTitle: string;
  blogUrl: string;
  targetKeyword: string;
  subject: string;
  publishDate: string;
  status: string;
  currentRank?: number;
  previousRank?: number;
  totalViews: number;
  totalInflow: number;
  conversions?: number;
}

interface BlogKpiData {
  campaignStatus?: { active: number; total: number; warningCount: number };
  searchInflow?: { total: number; changeRate: number; topKeywords: string[] };
  placeConversion?: { rate: number; changeRate: number; topPosts: string[] };
}

interface BlogWeeklyMetrics {
  weekStart: string;
  weeklyViews: number;
  weeklyInflow: number;
  weeklyConversions: number;
}

interface ChartData {
  date: string;
  views: number;
  inflow: number;
  conversions: number;
  conversionRate: number;
}

interface PostTypeData {
  name: string;
  value: number;
  percentage: number;
}

interface CampaignItem {
  date: string;
  postId: string;
  title: string;
  keywords: string[];
  targetInflow?: number;
  achievedInflow: number;
  progressPercent: number;
  rank?: number;
  seoScore?: number;
  legalStatus?: string;
  postType?: string;
}

interface ActiveCampaign {
  campaign: {
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    subjectCluster: string;
  };
  targetInflow: number;
  achievedInflow: number;
  progressPercent: number;
  items: CampaignItem[];
}

export default function BlogPage() {
  const [dateRange, setDateRange] = useState('주간');
  const [subject, setSubject] = useState('전체');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [kpiData, setKpiData] = useState<BlogKpiData | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [postTypeData, setPostTypeData] = useState<PostTypeData[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<ActiveCampaign | null>(null);
  const [campaignStatus, setCampaignStatus] = useState<{ normalCount: number; totalCount: number; currentCampaignName: string } | null>(null);
  const [searchInflowData, setSearchInflowData] = useState<{ total: number; changeRate: number; topKeywords: string[] } | null>(null);
  const [placeConversionData, setPlaceConversionData] = useState<{ rate: number; changeRate: number; topPosts: string[] } | null>(null);
  const [chartData, setChartData] = useState<{ date: string; views: number; inflow: number; placeClicks: number; conversionRate: number }[]>([]);
  const [kpiFilters, setKpiFilters] = useState({
    searchInflow: '전체' as '전체' | '임플란트' | '신경치료',
    placeConversion: '전체' as '전체' | '임플란트' | '신경치료'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [rankingTrends, setRankingTrends] = useState<{ weekStart: string; myRank: number; benchmarkHospital?: string; benchmarkRank?: number }[]>([]);

  // 데이터 가져오기
  useEffect(() => {
    fetchData();
  }, []);

  // 필터 변경 시 차트 데이터 재조회
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/blog/chart-data?periodType=${dateRange === '주간' ? '주간' : '월간'}&subject=${subject}`);
        if (response.ok) {
          const result = await response.json();
          setChartData(result);
        }
      } catch (error) {
        console.error('차트 데이터 조회 실패:', error);
      }
    };

    fetchChartData();
  }, [dateRange, subject]);

  // 페이지네이션 계산
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPost(null); // 페이지 변경 시 선택된 포스트 초기화
  };

  // 선택된 포스트 변경 시 순위 추이 데이터 가져오기
  useEffect(() => {
    const fetchRankingTrends = async () => {
      if (selectedPost?.postId) {
        try {
          const response = await fetch(`/api/blog/ranking-trends/${selectedPost.postId}`);
          if (response.ok) {
            const data = await response.json();
            setRankingTrends(data);
          }
        } catch (error) {
          console.error('순위 추이 데이터 조회 실패:', error);
          setRankingTrends([]);
        }
      } else {
        setRankingTrends([]);
      }
    };

    fetchRankingTrends();
  }, [selectedPost]);

  // 검색 유입량 필터 변경 시 데이터 재조회
  useEffect(() => {
    const fetchSearchInflowData = async () => {
      try {
        const response = await fetch(`/api/blog/search-inflow?subject=${kpiFilters.searchInflow}`);
        if (response.ok) {
          const result = await response.json();
          setSearchInflowData(result);
        }
      } catch (error) {
        console.error('검색 유입량 데이터 조회 실패:', error);
      }
    };

    fetchSearchInflowData();
  }, [kpiFilters.searchInflow]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, subject]);

  // 플레이스 전환 필터 변경 시 데이터 재조회
  useEffect(() => {
    const fetchPlaceConversionData = async () => {
      try {
        const response = await fetch(`/api/blog/place-conversion?subject=${kpiFilters.placeConversion}`);
        if (response.ok) {
          const result = await response.json();
          setPlaceConversionData(result);
        }
      } catch (error) {
        console.error('플레이스 전환 데이터 조회 실패:', error);
      }
    };

    fetchPlaceConversionData();
  }, [kpiFilters.placeConversion]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // KPI 데이터 조회
      const kpiResponse = await fetch('/api/blog/kpi');
      const kpiResult = await kpiResponse.json();
      setKpiData(kpiResult);

      // 포스트 목록 조회
      const params = new URLSearchParams();
      if (subject !== '전체') params.append('subject', subject);
      
      const postsResponse = await fetch(`/api/blog/posts${params.toString() ? '?' + params.toString() : ''}`);
      const postsResult = await postsResponse.json();
      setPosts(postsResult.posts || []);

      // 차트 데이터 조회
      const chartResponse = await fetch(`/api/blog/chart-data?periodType=${dateRange === '주간' ? '주간' : '월간'}&subject=${subject}`);
      if (chartResponse.ok) {
        const chartResult = await chartResponse.json();
        setChartData(chartResult);
      }

      // 활성 캠페인 조회
      const campaignResponse = await fetch('/api/blog/campaign/active');
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        setActiveCampaign(campaignData);
      }

      // 캠페인 현황 조회
      const statusResponse = await fetch('/api/blog/campaign/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setCampaignStatus(statusData);
      }

      // 검색 유입량 데이터 조회
      const searchInflowResponse = await fetch(`/api/blog/search-inflow?subject=${kpiFilters.searchInflow}`);
      if (searchInflowResponse.ok) {
        const searchInflowResult = await searchInflowResponse.json();
        setSearchInflowData(searchInflowResult);
      }

      // 플레이스 전환 데이터 조회
      const placeConversionResponse = await fetch(`/api/blog/place-conversion?subject=${kpiFilters.placeConversion}`);
      if (placeConversionResponse.ok) {
        const placeConversionResult = await placeConversionResponse.json();
        setPlaceConversionData(placeConversionResult);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">네이버 블로그 분석</h1>
          <p className="text-gray-600">네이버 블로그에서 내이튼치과 언급 현황 및 경쟁 분석을 모니터링합니다.</p>
        </div>

        {/* 1. 최상단 섹션 (KPI 카드 3개) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </>
          ) : (
            <>
              <KpiCard
                title="캠페인 현황"
                value={`정상 노출 ${campaignStatus?.normalCount ?? 0}/${campaignStatus?.totalCount ?? 0}`}
                description={`현재 캠페인: ${campaignStatus?.currentCampaignName ?? '캠페인 정보 없음'}`}
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
                onFilterChange={(value) => setKpiFilters(prev => ({ ...prev, searchInflow: value as '전체' | '임플란트' | '신경치료' }))}
                footer={searchInflowData?.topKeywords?.join(', ') ?? 'TOP 3 유입 키워드 표시'}
              />
              <KpiCard
                title="플레이스 전환"
                value={`${placeConversionData?.rate ?? 0}%`}
                description="블로그 to 플레이스 클릭"
                change={`${(placeConversionData?.changeRate ?? 0) > 0 ? '+' : ''}${placeConversionData?.changeRate ?? 0}%`}
                changeType={(placeConversionData?.changeRate ?? 0) >= 0 ? 'increase' : 'decrease'}
                filters={['전체', '임플란트', '신경치료']}
                selectedFilter={kpiFilters.placeConversion}
                onFilterChange={(value) => setKpiFilters(prev => ({ ...prev, placeConversion: value as '전체' | '임플란트' | '신경치료' }))}
              />
            </>
          )}
        </div>

        {/* 2. 두번째 섹션 (차트와 캠페인) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 좌측 차트 영역 */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
            {/* 필터 바 */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <DateFilter selectedRange={dateRange} onSelectRange={setDateRange} />
              <SubjectFilter selectedSubject={subject} onSelectSubject={setSubject} />
            </div>
            
            <h3 className="text-lg font-semibold mb-4 text-gray-800">블로그 성과 분석</h3>
            <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return dateRange === '주간' 
                            ? `${date.getMonth() + 1}/${date.getDate()}`
                            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        }}
                      />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        formatter={(value: any) => value.toLocaleString()}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return dateRange === '주간'
                            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
                            : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="views"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="조회수"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="inflow"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="검색 유입량"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="placeClicks"
                        fill="#ffc658"
                        name="플레이스 클릭"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    데이터를 불러오는 중...
                  </div>
                )}
              </div>
            </div>

          {/* 우측 캠페인 현황 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col h-[500px]">
            <div className="flex items-center mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">진행 중 캠페인</h2>
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ml-2 cursor-pointer" title="도움말">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>
            </div>
            {activeCampaign ? (
              <>
                {/* 캠페인 정보 박스 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-4 shrink-0">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <p className="text-slate-600">
                      <span className="font-bold text-slate-800">기간:</span> {new Date(activeCampaign.campaign.periodStart).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\. /g, '.').slice(0, -1)} ~ {new Date(activeCampaign.campaign.periodEnd).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\. /g, '.').slice(0, -1)}
                    </p>
                    <p className="font-semibold text-slate-800">주제 클러스터: {activeCampaign.campaign.subjectCluster}</p>
                  </div>
                  <div className="text-xs">
                    <div className="flex justify-between mb-1">
                      <p className="text-slate-600">달성 유입량: <span className="font-bold text-slate-900">{activeCampaign.achievedInflow}</span></p>
                      <p className="text-slate-600">목표 유입량: <span className="font-bold text-slate-900">{activeCampaign.targetInflow}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2 relative">
                        <div 
                          className="bg-teal-500 h-2 rounded-full"
                          style={{ width: `${Math.min((activeCampaign.achievedInflow / activeCampaign.targetInflow) * 100, 100)}%` }}
                        ></div>
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 h-[150%] w-px bg-slate-400"
                          style={{ left: '100%' }}
                        ></div>
                      </div>
                      <span className="font-bold text-teal-600 text-base">{Math.round((activeCampaign.achievedInflow / activeCampaign.targetInflow) * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* 포스트 진행 항목 리스트 */}
                <div className="space-y-3 pr-2 -mr-2 overflow-y-auto flex-grow min-h-0">
                  {activeCampaign.items.map((item, index) => {
                    const date = new Date(item.date);
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayOfWeek = dayNames[date.getDay()];
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const isCompleted = item.progressPercent >= 100;
                    
                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start gap-3">
                            <div className="text-center w-10 shrink-0">
                              <p className="text-gray-500">{dayOfWeek}</p>
                              <p className="text-[10px] text-gray-500 font-bold">{month}/{day}</p>
                            </div>
                            <div>
                              <span className={`inline-block px-2 py-0.5 mb-1 rounded-full font-semibold ${
                                item.postType === '전환' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.postType || '유입'} 포스팅
                              </span>
                              <h3 className="font-bold text-sm text-gray-800 leading-snug">{item.title}</h3>
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-12 pl-1 space-y-2 text-gray-600">
                          {/* 키워드 */}
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
                              <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
                            </svg>
                            <p>{item.keywords.join(', ')}</p>
                          </div>
                          
                          {/* 진행률 */}
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                              <line x1="18" x2="18" y1="20" y2="10"></line>
                              <line x1="12" x2="12" y1="20" y2="4"></line>
                              <line x1="6" x2="6" y1="20" y2="14"></line>
                            </svg>
                            <div className="w-full">
                              <div className="flex justify-between text-[11px] mb-0.5">
                                <span>{item.achievedInflow} / {item.targetInflow}</span>
                                <span className="font-bold">{Math.round(item.progressPercent)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 relative">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(item.progressPercent * 100 / activeCampaign.progressPercent, 100)}%` }}
                                ></div>
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 h-[150%] w-px bg-slate-400"
                                  style={{ left: `${Math.min(100 / activeCampaign.progressPercent * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 순위 */}
                          {item.rank && (
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                <polyline points="16 7 22 7 22 13"></polyline>
                              </svg>
                              <p>현재 순위: <span className="font-bold text-gray-800">{item.rank}위</span></p>
                            </div>
                          )}
                          
                          {/* SEO/의료법 */}
                          {(item.seoScore || item.legalStatus) && (
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                                <path d="M12 8V4H8"></path>
                                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                <path d="M2 14h2"></path>
                                <path d="M20 14h2"></path>
                                <path d="M15 13v2"></path>
                                <path d="M9 13v2"></path>
                              </svg>
                              <div className="flex items-center gap-3">
                                {item.seoScore && (
                                  <div className="flex items-center gap-1">
                                    SEO: <span className="font-bold text-green-600">{item.seoScore}점</span>
                                  </div>
                                )}
                                {item.legalStatus && (
                                  <div className="flex items-center gap-1">
                                    의료법: <span className={`font-bold ${
                                      item.legalStatus === '안전' ? 'text-green-600' : 
                                      item.legalStatus === '주의' ? 'text-yellow-600' : 
                                      'text-red-600'
                                    }`}>{item.legalStatus}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                진행 중인 캠페인이 없습니다.
              </div>
            )}
          </div>
        </div>
        
        {/* 3. 세번째 섹션 (분할 레이아웃) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 좌측 테이블 */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">포스팅 목록</h3>
            {/* 테이블 */}
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">제목</TableHead>
                    <TableHead className="w-32">타겟키워드</TableHead>
                    <TableHead className="w-24">진료과목</TableHead>
                    <TableHead className="w-24">게시일</TableHead>
                    <TableHead className="w-20">조회수</TableHead>
                    <TableHead className="w-24">검색 유입량</TableHead>
                    <TableHead className="w-20">전환수</TableHead>
                    <TableHead className="w-20">순위</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentPosts.length > 0 ? (
                    currentPosts.map((post) => (
                      <TableRow 
                        key={post.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedPost(post)}
                      >
                        <TableCell className="font-medium w-48">
                          <div className="flex items-center gap-2">
                            {post.status === '순위하락' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                            {post.status === '정상' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span className="truncate max-w-xs">{post.postTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-32">{post.targetKeyword}</TableCell>
                        <TableCell className="w-24">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                            {post.subject || '전체'}
                          </span>
                        </TableCell>
                        <TableCell className="w-24">{post.publishDate ? new Date(post.publishDate).toLocaleDateString('ko-KR') : '-'}</TableCell>
                        <TableCell className="w-20">{post.totalViews.toLocaleString()}</TableCell>
                        <TableCell className="w-24">{post.totalInflow.toLocaleString()}</TableCell>
                        <TableCell className="w-20">{post.conversions?.toLocaleString() || '0'}</TableCell>
                        <TableCell className="w-20">
                          {post.currentRank ? (
                            <div className="flex items-center gap-1">
                              <span>{post.currentRank}위</span>
                              {post.currentRank && post.previousRank && (
                                <span className={`text-xs ${
                                  post.currentRank < post.previousRank ? 'text-green-500' : 
                                  post.currentRank > post.previousRank ? 'text-red-500' : 
                                  'text-gray-500'
                                }`}>
                                  {post.currentRank < post.previousRank ? '↑' : 
                                   post.currentRank > post.previousRank ? '↓' : '-'}
                                </span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  총 {posts.length}개 중 {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, posts.length)}개 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 우측 상세 패널 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">포스팅 상세 분석</h3>
            {selectedPost ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">{selectedPost.postTitle}</h4>
                  <a 
                    href={selectedPost.blogUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    블로그에서 보기 →
                  </a>
                </div>
                
                {/* 순위 추이 차트 */}
                {rankingTrends.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-3">순위 추이</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={rankingTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis 
                            dataKey="weekStart" 
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            domain={['dataMin - 5', 'dataMax + 5']}
                            tickFormatter={(value) => `${value}위`}
                          />
                          <Tooltip 
                            formatter={(value: any) => `${value}위`}
                            labelFormatter={(label) => {
                              const date = new Date(label);
                              return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="myRank"
                            stroke="#8884d8"
                            strokeWidth={2}
                            name="내 포스팅"
                            dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                          />
                          {rankingTrends.some(item => item.benchmarkHospital && item.benchmarkRank !== undefined) && (
                            <Line
                              type="monotone"
                              dataKey="benchmarkRank"
                              stroke="#82ca9d"
                              strokeWidth={2}
                              name={rankingTrends.find(item => item.benchmarkHospital && item.benchmarkRank !== undefined)?.benchmarkHospital || '벤치마크'}
                              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">타겟 키워드</p>
                    <p className="font-medium">{selectedPost.targetKeyword}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">진료과목</p>
                    <p className="font-medium">{selectedPost.subject}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">현재 순위</p>
                    <p className="font-medium">{selectedPost.currentRank ? `${selectedPost.currentRank}위` : '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">상태</p>
                    <p className="font-medium">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        selectedPost.status === '정상' ? 'bg-green-100 text-green-700' :
                        selectedPost.status === '순위하락' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedPost.status === '정상' && <CheckCircle className="w-3 h-3" />}
                        {selectedPost.status === '순위하락' && <AlertCircle className="w-3 h-3" />}
                        {selectedPost.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-700 mb-2">성과 지표</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 조회수</span>
                      <span className="font-medium">{selectedPost.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 유입량</span>
                      <span className="font-medium">{selectedPost.totalInflow.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                포스팅을 선택하여 상세 정보를 확인하세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
