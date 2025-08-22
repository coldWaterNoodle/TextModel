'use client';

import React, { useState, useEffect } from 'react';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SubjectFilter } from '@/components/dashboard/SubjectFilter';
import { KpiCard } from '@/components/channels/KpiCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Search, Filter, ArrowDownUp, Download, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  SeoScore, 
  SearchInflow, 
  ConversionRate, 
  SeoScoreTrend, 
  InflowTrend, 
  ConversionTrend, 
  PagePerformance, 
  CompetitorAnalysis 
} from '@/types/homepage';

interface CombinedChartData {
  date: string;
  seoScore: number;
  searchInflow: number;
  conversionRate: number;
}

export default function HomepagePage() {
  const [dateRange, setDateRange] = useState('주간');
  const [subject, setSubject] = useState('전체');
  const [loading, setLoading] = useState(true);
  
  // KPI 데이터
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [searchInflow, setSearchInflow] = useState<SearchInflow | null>(null);
  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  
  // 통합 차트 데이터
  const [combinedChartData, setCombinedChartData] = useState<CombinedChartData[]>([]);
  
  // 페이지 성과 데이터
  const [topConversionPages, setTopConversionPages] = useState<PagePerformance[]>([]);
  const [topBouncePages, setTopBouncePages] = useState<PagePerformance[]>([]);
  
  // 경쟁사 데이터
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);

  // 데이터 가져오기
  useEffect(() => {
    fetchData();
  }, [subject, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // KPI 데이터 가져오기 (더미 데이터 사용)
      setSeoScore({
        currentScore: 85,
        maxScore: 100,
        improvementItems: ['메타 디스크립션 3개', '이미지 alt 텍스트 12개', '페이지 속도 개선'],
        imageAltTextCount: 12,
        pageSpeedStatus: 'needs-improvement',
        metaDescriptionIssues: 3
      });

      setSearchInflow({
        totalInflow: 800, // 월 800건 수준으로 조정
        changeRate: 15,
        organicSearchRatio: 0.75,
        directInflowRatio: 0.25,
        topLandingPages: [
          { pageUrl: '/implant', pageTitle: '임플란트 치료', inflowCount: 320 },
          { pageUrl: '/nerve-treatment', pageTitle: '신경치료', inflowCount: 280 },
          { pageUrl: '/', pageTitle: '홈페이지', inflowCount: 200 }
        ]
      });

      setConversionRate({
        currentRate: 4.2,
        changeRate: -0.3,
        averageSessionDuration: '2분 35초',
        bounceRate: 35
      });

      // 통합 차트 데이터 가져오기
      const ts = Date.now();
      const chartResponse = await fetch(`/api/homepage/combined-chart-data?subject=${subject}&dateRange=${dateRange}&t=${ts}`, { cache: 'no-store' });
      if (chartResponse.ok) {
        setCombinedChartData(await chartResponse.json());
      }

      // 페이지 성과 데이터 가져오기 (더미 데이터 사용)
      setTopConversionPages([
        { pageUrl: '/implant', pageTitle: '임플란트 치료', conversionRate: 6.8, bounceRate: 28, sessionDuration: 185, pageViews: 320 },
        { pageUrl: '/nerve-treatment', pageTitle: '신경치료', conversionRate: 5.2, bounceRate: 32, sessionDuration: 165, pageViews: 280 },
        { pageUrl: '/consultation', pageTitle: '상담 예약', conversionRate: 4.8, bounceRate: 35, sessionDuration: 145, pageViews: 210 },
        { pageUrl: '/doctors', pageTitle: '의료진 소개', conversionRate: 3.9, bounceRate: 38, sessionDuration: 125, pageViews: 180 },
        { pageUrl: '/location', pageTitle: '오시는 길', conversionRate: 3.2, bounceRate: 42, sessionDuration: 95, pageViews: 150 }
      ]);

      setTopBouncePages([
        { pageUrl: '/news', pageTitle: '공지사항', conversionRate: 1.2, bounceRate: 68, sessionDuration: 45, pageViews: 80 },
        { pageUrl: '/gallery', pageTitle: '치료 사례', conversionRate: 2.1, bounceRate: 65, sessionDuration: 75, pageViews: 120 },
        { pageUrl: '/insurance', pageTitle: '보험 안내', conversionRate: 1.8, bounceRate: 62, sessionDuration: 85, pageViews: 95 },
        { pageUrl: '/faq', pageTitle: '자주 묻는 질문', conversionRate: 2.5, bounceRate: 58, sessionDuration: 105, pageViews: 110 },
        { pageUrl: '/contact', pageTitle: '문의하기', conversionRate: 1.5, bounceRate: 55, sessionDuration: 65, pageViews: 75 }
      ]);

      // 경쟁사 데이터 가져오기 (Benchmark Hospitals에서)
      const competitorsResponse = await fetch('/api/homepage/competitors');
      if (competitorsResponse.ok) {
        setCompetitors(await competitorsResponse.json());
      } else {
        // 더미 데이터 사용
        setCompetitors([
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
        ]);
      }

    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // SEO 점수 상태에 따른 색상
  const getSeoScoreColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 전환율 변화에 따른 색상
  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">홈페이지 분석</h1>
          <p className="text-gray-600">내이튼치과 홈페이지 트래픽 및 성과를 모니터링합니다.</p>
        </div>

        {/* 1. 최상단 섹션 (KPI 카드 3개) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard
            title="SEO 점수"
            value={seoScore ? `${seoScore.currentScore}/${seoScore.maxScore}` : "85/100"}
            description={seoScore?.improvementItems.length ? `개선 필요: ${seoScore.improvementItems[0]}` : "개선 필요: 메타 디스크립션 3개"}
            change="SEO 진단 리포트"
            changeType="action"
            footer={`이미지 alt 텍스트 ${seoScore?.imageAltTextCount || 12}개, 페이지 속도 개선`}
          />
          <KpiCard
            title="검색 유입량"
            value={searchInflow ? `${searchInflow.totalInflow.toLocaleString()}명` : "12,450명"}
            description={`자연 검색 ${Math.round((searchInflow?.organicSearchRatio || 0.75) * 100)}% vs 직접 유입 ${Math.round((searchInflow?.directInflowRatio || 0.25) * 100)}%`}
            change={`${searchInflow?.changeRate || 15}%`}
            changeType={searchInflow?.changeRate && searchInflow.changeRate >= 0 ? "increase" : "decrease"}
            filters={['전체', '임플란트', '신경치료']}
            footer={`TOP 랜딩 페이지 ${searchInflow?.topLandingPages.length || 3}개`}
          />
          <KpiCard
            title="예약 전환율"
            value={`${conversionRate?.currentRate || 4.2}%`}
            description={`평균 체류시간: ${conversionRate?.averageSessionDuration || '2분 35초'}`}
            change={`${conversionRate?.changeRate || -0.3}%`}
            changeType={conversionRate?.changeRate && conversionRate.changeRate >= 0 ? "increase" : "decrease"}
            filters={['전체', '임플란트', '신경치료']}
            footer={`이탈률: ${conversionRate?.bounceRate || 35}%`}
          />
        </div>

        {/* 2. 두번째 섹션 (통합 차트 영역) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 필터 바 */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <DateFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            <SubjectFilter selectedSubject={subject} onSelectSubject={setSubject} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">성과 추이</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData}>
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="seoScore" stroke="#3b82f6" strokeWidth={2} name="SEO 점수" />
                  <Line yAxisId="left" type="monotone" dataKey="searchInflow" stroke="#10b981" strokeWidth={2} name="검색 유입량" />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#8b5cf6" strokeWidth={2} name="예약 전환율" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* 3. 세번째 섹션 (페이지 성과 분석) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">페이지 성과 분석</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">예약 전환율 상위 페이지</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>페이지</TableHead>
                    <TableHead>전환율</TableHead>
                    <TableHead>이탈률</TableHead>
                    <TableHead>체류시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topConversionPages.slice(0, 5).map((page, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm">{page.pageTitle}</div>
                          <div className="text-xs text-gray-500">{page.pageUrl}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {page.conversionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{page.bounceRate.toFixed(1)}%</TableCell>
                      <TableCell>{Math.floor(page.sessionDuration / 60)}분 {page.sessionDuration % 60}초</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">이탈률 상위 페이지</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>페이지</TableHead>
                    <TableHead>이탈률</TableHead>
                    <TableHead>전환율</TableHead>
                    <TableHead>체류시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBouncePages.slice(0, 5).map((page, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm">{page.pageTitle}</div>
                          <div className="text-xs text-gray-500">{page.pageUrl}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {page.bounceRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{page.conversionRate.toFixed(1)}%</TableCell>
                      <TableCell>{Math.floor(page.sessionDuration / 60)}분 {page.sessionDuration % 60}초</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* 4. 네번째 섹션 (경쟁사 분석) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">경쟁사 분석</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>경쟁사</TableHead>
                <TableHead>SEO 점수</TableHead>
                <TableHead>검색 유입량</TableHead>
                <TableHead>전환율</TableHead>
                <TableHead>랭킹 키워드</TableHead>
                <TableHead>백링크</TableHead>
                <TableHead>웹사이트</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{competitor.competitorName}</TableCell>
                  <TableCell>
                    <Badge variant={competitor.seoScore >= 80 ? "default" : competitor.seoScore >= 60 ? "secondary" : "destructive"}>
                      {competitor.seoScore}/100
                    </Badge>
                  </TableCell>
                  <TableCell>{competitor.searchInflow.toLocaleString()}</TableCell>
                  <TableCell>{competitor.conversionRate.toFixed(1)}%</TableCell>
                  <TableCell>{competitor.rankingKeywords}</TableCell>
                  <TableCell>{competitor.backlinks.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={competitor.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
