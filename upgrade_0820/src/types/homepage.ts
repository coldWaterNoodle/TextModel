// 홈페이지 관련 데이터 타입 정의

// SEO 점수 관련 타입
export interface SeoScore {
  currentScore: number;
  maxScore: number;
  improvementItems: string[];
  imageAltTextCount: number;
  pageSpeedStatus: 'good' | 'needs-improvement' | 'poor';
  metaDescriptionIssues: number;
}

// 검색 유입량 관련 타입
export interface SearchInflow {
  totalInflow: number;
  changeRate: number;
  organicSearchRatio: number;
  directInflowRatio: number;
  topLandingPages: {
    pageUrl: string;
    pageTitle: string;
    inflowCount: number;
  }[];
}

// 예약 전환율 관련 타입
export interface ConversionRate {
  currentRate: number;
  changeRate: number;
  averageSessionDuration: string; // "2분 35초" 형태
  bounceRate: number;
}

// 차트 데이터 타입
export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface SeoScoreTrend {
  date: string;
  score: number;
  maxScore: number;
}

export interface InflowTrend {
  date: string;
  organicInflow: number;
  directInflow: number;
  totalInflow: number;
}

export interface ConversionTrend {
  date: string;
  conversionRate: number;
  sessionDuration: number; // 초 단위
  bounceRate: number;
}

// 유저 플로우 관련 타입
export interface UserFlowNode {
  id: string;
  name: string;
  value: number;
}

export interface UserFlowLink {
  source: string;
  target: string;
  value: number;
}

export interface UserFlowData {
  nodes: UserFlowNode[];
  links: UserFlowLink[];
}

// 페이지 성과 관련 타입
export interface PagePerformance {
  pageUrl: string;
  pageTitle: string;
  conversionRate: number;
  bounceRate: number;
  sessionDuration: number;
  pageViews: number;
}

// 경쟁사 분석 타입
export interface CompetitorAnalysis {
  competitorName: string;
  websiteUrl: string;
  seoScore: number;
  searchInflow: number;
  conversionRate: number;
  rankingKeywords: number;
  backlinks: number;
}

// 홈페이지 전체 데이터 타입
export interface HomepageData {
  seoScore: SeoScore;
  searchInflow: SearchInflow;
  conversionRate: ConversionRate;
  seoScoreTrend: SeoScoreTrend[];
  inflowTrend: InflowTrend[];
  conversionTrend: ConversionTrend[];
  userFlow: UserFlowData;
  topConversionPages: PagePerformance[];
  topBouncePages: PagePerformance[];
  competitors: CompetitorAnalysis[];
}

// 필터 타입
export interface HomepageFilters {
  dateRange: '주간' | '월간' | '분기';
  subject: '전체' | '임플란트' | '신경치료';
  device?: '전체' | '데스크톱' | '모바일';
}
