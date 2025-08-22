import Airtable, { FieldSet, Attachment } from 'airtable';

// Today Channel News 타입 정의
export interface TodayChannelNewsRecord extends FieldSet {
    ID: string;
    Channel: '네이버 카페' | '플레이스 리뷰';
    Action: '신규 수집' | '댓글 기회' | '답변 필요';
    Counts: number;
    Date: string;
}

// 타입 정의
export interface FunnelDataRecord extends FieldSet {
    Date: string;
    Subject: string;
    Impressions: number;
    Clicks: number;
    Conversions: number;
    Bookings: number;
    Revenue: number;
    // FunnelChart에서 사용하는 필드들
    general_node_search: number;
    brand_node_search: number;
    brand_to_blog_direct: number;
    brand_to_site_direct: number;
    general_to_blog_direct: number;
    general_to_site_direct: number;
    homepage_node_total: number;
    blog_node_total: number;
    placeDetailPV: number;
    bookingPageVisits: number;
    bookings: number;
    blog_to_place_detail: number;
    place_list_to_detail: number;
    homepage_to_place_detail: number;
    place_to_booking_page: number;
    homepage_to_booking_page_direct: number;
    booking_page_to_requests: number;
    place_ad_node_total: number;
    place_ad_to_detail: number;
    general_search_to_detail: number;
    brand_search_to_detail: number;
    map_rank: number;
    cafe_view: number;
}

export interface ReputationIssueRecord extends FieldSet {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChannelStatusRecord extends FieldSet {
    id: string;
    channel: string;
    status: '정상' | '주의' | '오류';
    performance: string;
    lastUpdated: string;
}

export interface PerformanceAlertRecord extends FieldSet {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    status: string;
    createdAt: string;
}

export interface MedicontentPost extends FieldSet {
    id: string;
    title: string;
    type: '유입 포스팅' | '전환 포스팅';
    status: '대기' | '병원 작업 중' | '리걸케어 작업 중' | '작업 완료' | '자료 제공 필요' | '초안 검토 필요';
    publishDate: string;
    keywords: string[];
    treatmentType: string;
    htmlId?: string;
    content?: string;
    seoScore?: number;
    legalScore?: number;
    createdAt: string;
    updatedAt: string;
}

export interface PostDataRequest extends FieldSet {
    id: string;
    postId: string;
    conceptMessage: string;
    patientCondition: string;
    treatmentProcessMessage: string;
    treatmentResultMessage: string;
    additionalMessage: string;
    beforeImages: Attachment[];
    processImages: Attachment[];
    afterImages: Attachment[];
    beforeImagesText?: string;
    processImagesText?: string;
    afterImagesText?: string;
    submittedAt: string;
    status: '대기' | '처리 중' | '완료';
}

export interface PostReview extends FieldSet {
    id: string;
    postId: string;
    seoScore: number;
    legalScore: number;
    seoChecklist: string;
    legalChecklist: string;
    reviewedAt: string;
    reviewer: string;
}

export interface PostCommunication extends FieldSet {
    id: string;
    postId: string;
    sender: 'hospital' | 'legalcare';
    senderName: string;
    content: string;
    timestamp: string;
    type: 'comment' | 'status_change' | 'file_upload';
}

// 블로그 관련 타입 정의
export interface BlogPost extends FieldSet {
    id: string;
    postId: string;
    postTitle: string;
    blogUrl: string;
    targetKeyword: string;
    subject: string;
    campaignName?: string;
    publishDate: string;
    status: '정상' | '순위하락' | '미노출';
    currentRank?: number;
    previousRank?: number;
    isActive: boolean;
    author: string;
    seoScore?: number;
    legalStatus: '안전' | '주의' | '위험';
    totalViews: number;
    totalInflow: number;
    conversions?: number;
}

export interface BlogWeeklyMetrics extends FieldSet {
    id: string;
    postId: string;
    weekStart: string;
    weekNumber: number;
    weeklyViews: number;
    weeklyInflow: number;
    weeklyRank?: number;
    weeklyPlaceClicks: number;
    weeklyConversions: number;
    weeklyConversionRate: number;
    topKeywords?: string; // 콤마로 구분된 상위 3개 키워드
}

export interface BlogCampaign extends FieldSet {
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    subjectCluster: string;
    targetInflow: number;
}

export interface CampaignTarget extends FieldSet {
    id: string;
    campaignId: string;
    postId: string;
    postTitle: string;
    postType: '유입' | '전환';
    publishDate: string;
    keywords: string; // 콤마로 구분된 키워드
    targetInflow: number;
    achievedInflow: number;
    rank?: number;
    seoScore?: number;
    legalStatus: '안전' | '주의' | '위험';
    status?: 'normal' | 'warning' | 'error';
}

export interface BlogBenchmarkRanking extends FieldSet {
    id: string;
    hospitalName: string;
    keyword: string;
    weekStart: string;
    ranking: number;
}

// 설정 관련 타입
export interface HospitalSettings extends FieldSet {
    id?: string;
    hospitalName: string;
    businessNumber: string;
    representativeName: string;
    postalCode: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
}

export interface BenchmarkSettings extends FieldSet {
    id?: string;
    benchmarkHospitals: string[]; // CSV로 저장/로드
}

export interface BenchmarkHospitalRow extends FieldSet {
    id?: string;
    hospitalName: string;
    order: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// 카페 포스트
export interface CafePost extends FieldSet {
    id: string;
    postKey: string;
    clubId: string;
    articleId: string;
    cafeName: string;
    title: string;
    author: string;
    date: string;
    views: number;
    commentsCount: number;
    mentionedClinics: string;
    relatedTreatments: string;
    sentiment: string;
    link: string;
}

export interface CafeWeeklyTotal {
    weekStart: string;
    views: number;
}

export interface CafeWeeklyViewRow extends FieldSet {
    postKey: string;
    weekStart: string;
    views: number;
}

export interface CafeReportRow extends FieldSet {
    id?: string;
    postKey?: string;
    cafeName: string;
    title: string;
    author?: string;
    date: string;
    views?: number;
    commentsCount?: number;
    mentionedClinics?: string;
    relatedTreatments?: string;
    sentiment?: string;
    link?: string;
    content?: string;
    textAnalysis?: string;
    metaAnalysis?: string;
    authorAnalysis?: string;
    recommendation?: string;
}

export interface CafeHospitalWeeklyStats extends FieldSet {
    statsKey: string;
    hospitalName: string;
    weekStart: string;
    subject: string;
    totalViews: number;
    postCount: number;
    createdAt?: string;
}

export interface CafeHospitalMonthlyStats extends FieldSet {
    statsKey: string;
    hospitalName: string;
    month: string;
    subject: string;
    totalViews: number;
    postCount: number;
    createdAt?: string;
}

export interface CafeStatsByName extends FieldSet {
    statsKey: string;
    hospitalName: string;
    cafeName: string;
    weekStart?: string;
    month?: string;
    subject: string;
    totalViews: number;
    postCount: number;
    createdAt?: string;
}

export interface IntegrationSettings extends FieldSet {
    id?: string;
    emrType: string;
    emrApiKey: string;
}

export interface AppUser extends FieldSet {
    id?: string;
    name: string;
    email: string;
    role: '원장' | '관리자' | '직원' | '간호사';
    status: '활성' | '비활성';
    lastLogin?: string;
}

export interface BillingSettings extends FieldSet {
    id?: string;
    plan: string;
    nextBillingDate: string;
    usagePercent: number;
    paymentLast4?: string;
    paymentExpiry?: string;
}

// 네이버 플레이스 관련 타입 정의
export interface PlaceAnalysisReport extends FieldSet {
    reportId: string;
    keyword: string;
    analysisDate: string;
    competitors: string[]; // Competitor 레코드 ID 배열
    tierSummaryChart: Attachment[];
    growthDrivers: string;
    actionPlans: string[]; // ActionPlan 레코드 ID 배열
}

export interface Competitor extends FieldSet {
    hospitalName: string;
    currentRank: number;
    currentTier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Tier 5';
    previousRank: number;
    previousTier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Tier 5';
    visitorReviews: number;
    visitorReviewChange: number;
    blogReviews: number;
    blogReviewChange: number;
    linkedReport: string[]; // PlaceAnalysisReport 레코드 ID
}

export interface ActionPlan extends FieldSet {
    planId: string;
    targetHospital: string;
    currentStatus: string;
    goal: string;
    solution: string;
    planDetails: string;
    expectedKpi: string;
    linkedReport: string[]; // PlaceAnalysisReport 레코드 ID
}

// 신규 플레이스 채널 타입 정의
export interface PlaceRanking extends FieldSet {
    Keyword: string;
    Week: string;
    Rank: number;
}

export interface PlaceDetail extends FieldSet {
    Week: string;
    TotalPV: number;
}

export interface PlaceReview extends FieldSet {
    id?: string;
    ReviewId: string;
    Score: number;
    Content: string;
    ChannelId: string;
    AuthorAt: string;
    Reply?: string;
    Category?: string;
    'Report Status'?: '검토 요청' | '검토 완료' | '삭제 진행 중' | '삭제 완료';
    'Reply Status'?: '답변 완료' | 'AI 답변 생성하기';
}

export interface PlaceReviewWord extends FieldSet {
    Word: string;
    Count: number;
}

export interface PlaceReviewReport extends FieldSet {
    id?: string;
    // Base fields similar to CafeReportRow
    title: string;
    link: string;
    author: string;
    date: string;
    content: string;
    cafeName: string; // Assuming reviews might have a source name
    
    // Analysis fields similar to CafeReportRow
    textAnalysis: string;
    metaAnalysis: string;
    authorAnalysis: string;
    recommendation: string;
}

// Airtable 설정
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable API 키와 Base ID가 필요합니다.');
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// 신규: Today Channel News 데이터 조회 함수
export async function getTodayChannelNews(): Promise<TodayChannelNewsRecord[]> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const records = await base('Today Channel News')
            .select({
                filterByFormula: `IS_SAME({Date}, '${today}', 'day')`
            })
            .all();
        
        return records.map((record): TodayChannelNewsRecord => ({
            ID: record.get('ID') as string,
            Channel: record.get('Channel') as '네이버 카페' | '플레이스 리뷰',
            Action: record.get('Action') as '신규 수집' | '댓글 기회' | '답변 필요',
            Counts: record.get('Counts') as number || 0,
            Date: record.get('Date') as string,
        }));
    } catch (error) {
        console.error('Today Channel News 조회 실패:', error);
        return [];
    }
}

// 대시보드용 데이터 조회 함수들 (기존 호환성을 위해 유지)
export async function getFunnelDailyData(subject: string = '전체'): Promise<FunnelDataRecord[]> {
    try {
        let records;
        
        if (subject === '전체') {
            // 전체일 때는 모든 데이터를 가져옴
            records = await base('[Demo] Funnel Daily Data').select().all();
        } else {
            // 특정 진료과목일 때는 필터링
            records = await base('[Demo] Funnel Daily Data')
                .select({
                    filterByFormula: `{진료과목} = '${subject}'`
                })
                .all();
        }
        
        const mappedRecords = records.map((record): FunnelDataRecord => ({
            Date: record.get('Date') as string,
            Subject: record.get('진료과목') as string,
            // FunnelChart에서 사용하는 필드명으로 매핑
            general_node_search: (record.get('general_node_search') as number) || 0,
            brand_node_search: (record.get('brand_node_search') as number) || 0,
            brand_to_blog_direct: (record.get('brand_to_blog_direct') as number) || 0,
            brand_to_site_direct: (record.get('brand_to_site_direct') as number) || 0,
            general_to_blog_direct: (record.get('general_to_blog_direct') as number) || 0,
            general_to_site_direct: (record.get('general_to_site_direct') as number) || 0,
            homepage_node_total: (record.get('homepage_node_total') as number) || 0,
            blog_node_total: (record.get('blog_node_total') as number) || 0,
            placeDetailPV: (record.get('placeDetailPV') as number) || 0,
            bookingPageVisits: (record.get('bookingPageVisits') as number) || 0,
            bookings: (record.get('bookings') as number) || 0,
            blog_to_place_detail: (record.get('blog_to_place_detail') as number) || 0,
            place_list_to_detail: (record.get('place_list_to_detail') as number) || 0,
            homepage_to_place_detail: (record.get('homepage_to_place_detail') as number) || 0,
            place_to_booking_page: (record.get('place_to_booking_page') as number) || 0,
            homepage_to_booking_page_direct: (record.get('homepage_to_booking_page_direct') as number) || 0,
            booking_page_to_requests: (record.get('booking_page_to_requests') as number) || 0,
            place_ad_node_total: (record.get('place_ad_node_total') as number) || 0,
            place_ad_to_detail: (record.get('place_ad_to_detail') as number) || 0,
            general_search_to_detail: (record.get('general_search_to_detail') as number) || 0,
            brand_search_to_detail: (record.get('brand_search_to_detail') as number) || 0,
            map_rank: (record.get('map_rank') as number) || 0,
            cafe_view: (record.get('cafe_view') as number) || 0,
            // 기존 호환성을 위한 필드들
            Impressions: (record.get('general_node_search') as number) || 0,
            Clicks: (record.get('placeDetailPV') as number) || 0,
            Conversions: (record.get('bookingPageVisits') as number) || 0,
            Bookings: (record.get('bookings') as number) || 0,
            Revenue: 0
        }));

        // 날짜 순으로 정렬 (오래된 날짜부터 최신 날짜까지)
        return mappedRecords.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    } catch (error) {
        console.error('퍼널 데이터 조회 실패:', error);
        return [];
    }
}

export async function getReputationIssues(): Promise<ReputationIssueRecord[]> {
    try {
        const records = await base('[Demo] Reputation Issues')
            .select()
            .all();
        
        return records.map((record): ReputationIssueRecord => ({
            id: record.id,
            type: record.get('Type') as string || 'N/A',
            title: record.get('Title') as string || 'N/A',
            description: record.get('Source') as string || 'N/A',
            severity: (record.get('Type') === '부정 리뷰' ? 'High' : 'Medium'),
            status: record.get('Status') as string || 'N/A',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error('평판 이슈 조회 실패:', error);
        return [];
    }
}

export async function getChannelStatus(): Promise<ChannelStatusRecord[]> {
    try {
        const records = await base('[Demo] Channel Status')
            .select()
            .all();
        
        return records.map((record): ChannelStatusRecord => ({
            id: record.id,
            channel: record.get('Channel') as string || 'N/A',
            status: record.get('Status') as '정상' | '주의' | '오류' || '주의',
            performance: record.get('Details') as string || 'N/A',
            lastUpdated: record.get('LastChecked') as string || new Date().toISOString()
        }));
    } catch (error) {
        console.error('채널 상태 조회 실패:', error);
        return [];
    }
}

export async function getPerformanceAlerts(): Promise<PerformanceAlertRecord[]> {
    try {
        const records = await base('[Demo] Performance Alerts')
            .select()
            .all();
        
        return records.map((record): PerformanceAlertRecord => ({
            id: record.id,
            type: record.get('Metric') as string || 'N/A',
            title: record.get('Metric') as string || 'N/A',
            description: record.get('Details') as string || 'N/A',
            severity: record.get('Priority') as 'High' | 'Medium' | 'Low' || 'Medium',
            status: 'active',
            createdAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error('성과 알림 조회 실패:', error);
        return [];
    }
}

// Airtable 서비스 클래스
export class AirtableService {
    // 포스트 관련 메서드
    static async getPosts(): Promise<MedicontentPost[]> {
        try {
            const records = await base('Medicontent Posts').select().all();
                    return records.map(record => ({
            id: record.id,
            title: record.get('Title') as string,
            type: record.get('Type') as '유입 포스팅' | '전환 포스팅',
            status: record.get('Status') as any,
            publishDate: record.get('Publish Date') as string,
            keywords: (record.get('Keywords') as string || '').split(', ').filter(k => k.trim()),
            treatmentType: record.get('Treatment Type') as string,
                            htmlId: record.get('HTML ID') as string,
                content: record.get('Content') as string,
                seoScore: record.get('SEO Score') as number,
                legalScore: record.get('Legal Score') as number,
                createdAt: record.get('Created At') as string,
                updatedAt: record.get('Updated At') as string,
        }));
  } catch (error) {
            console.error('포스트 조회 실패:', error);
    throw error;
  }
}

    static async getPost(id: string): Promise<MedicontentPost | null> {
        try {
            const record = await base('Medicontent Posts').find(id);
            return {
                id: record.id,
                title: record.get('Title') as string,
                type: record.get('Type') as '유입 포스팅' | '전환 포스팅',
                status: record.get('Status') as any,
                publishDate: record.get('Publish Date') as string,
                keywords: (record.get('Keywords') as string || '').split(', ').filter(k => k.trim()),
                treatmentType: record.get('Treatment Type') as string,
                htmlId: record.get('HTML ID') as string,
                content: record.get('Content') as string,
                seoScore: record.get('SEO Score') as number,
                legalScore: record.get('Legal Score') as number,
                createdAt: record.get('Created At') as string,
                updatedAt: record.get('Updated At') as string,
            };
        } catch (error) {
            console.error('포스트 조회 실패:', error);
            return null;
        }
    }

    static async updatePostStatus(id: string, status: string): Promise<void> {
        try {
            await base('Medicontent Posts').update(id, {
                'Status': status,
                'Updated At': new Date().toISOString()
            });
  } catch (error) {
            console.error('포스트 상태 업데이트 실패:', error);
    throw error;
  }
}

    static async updatePost(id: string, updateData: any): Promise<void> {
        try {
            await base('Medicontent Posts').update(id, updateData);
        } catch (error) {
            console.error('포스트 업데이트 실패:', error);
            throw error;
        }
    }

    // 자료 요청 관련 메서드
    static async getDataRequest(postId: string): Promise<PostDataRequest | null> {
        try {
            const records = await base('Post Data Requests')
                .select({
                    filterByFormula: `{Post ID} = '${postId}'`,
                    maxRecords: 1,
                })
                .all();

            if (records.length === 0) {
                return null;
            }
            
            const record = records[0];

            return {
    id: record.id,
                postId: record.get('Post ID') as string,
                conceptMessage: (record.get('Concept Message') as string) || '',
                patientCondition: (record.get('Patient Condition') as string) || '',
                treatmentProcessMessage: (record.get('Treatment Process Message') as string) || '',
                treatmentResultMessage: (record.get('Treatment Result Message') as string) || '',
                additionalMessage: (record.get('Additional Message') as string) || '',
                beforeImages: (record.get('Before Images') as Attachment[]) || [],
                processImages: (record.get('Process Images') as Attachment[]) || [],
                afterImages: (record.get('After Images') as Attachment[]) || [],
                beforeImagesText: (record.get('Before Images Texts') as string) || '',
                processImagesText: (record.get('Process Images Texts') as string) || '',
                afterImagesText: (record.get('After Images Texts') as string) || '',
                submittedAt: record.get('Submitted At') as string,
                status: record.get('Status') as any,
            };
        } catch (error) {
            console.error('자료 요청 조회 실패:', error);
            return null;
        }
    }

    static async findOrCreateDataRequest(postId: string): Promise<string> {
        try {
            const records = await base('Post Data Requests')
                .select({
                    filterByFormula: `{Post ID} = '${postId}'`,
                    maxRecords: 1,
                })
                .all();

            if (records.length > 0) {
                return records[0].id;
            } else {
                const newRecord = await base('Post Data Requests').create({
                    'Post ID': postId,
                    'Status': '병원 작업 중',
                });
                return newRecord.id;
            }
        } catch (error) {
            console.error('데이터 요청 레코드 찾기 또는 생성 실패:', error);
            throw error;
        }
    }

    static async submitDataRequest(data: Omit<PostDataRequest, 'id' | 'submittedAt' | 'status' | 'beforeImages' | 'processImages' | 'afterImages'>): Promise<void> {
        try {
            console.log('AirtableService.submitDataRequest 호출:', data);
            
            const recordData = {
                'Post ID': data.postId,
                'Concept Message': data.conceptMessage,
                'Patient Condition': data.patientCondition,
                'Treatment Process Message': data.treatmentProcessMessage,
                'Treatment Result Message': data.treatmentResultMessage,
                'Additional Message': data.additionalMessage,
                'Before Images Texts': data.beforeImagesText,
                'Process Images Texts': data.processImagesText,
                'After Images Texts': data.afterImagesText,
                'Submitted At': new Date().toISOString(),
                'Status': '대기'
            };
            
            console.log('Airtable에 생성할 레코드:', recordData);
            
            await base('Post Data Requests').create(recordData);
            
            console.log('Airtable 레코드 생성 성공');
        } catch (error) {
            console.error('자료 요청 제출 실패:', error);
            throw error;
        }
    }

    static async updateDataRequest(id: string, data: Partial<Omit<PostDataRequest, 'beforeImages' | 'processImages' | 'afterImages'>>): Promise<void> {
        try {
            console.log('AirtableService.updateDataRequest 호출:', { id, data });
            
            const updateData: any = {};
            
            if (data.conceptMessage !== undefined) updateData['Concept Message'] = data.conceptMessage;
            if (data.patientCondition !== undefined) updateData['Patient Condition'] = data.patientCondition;
            if (data.treatmentProcessMessage !== undefined) updateData['Treatment Process Message'] = data.treatmentProcessMessage;
            if (data.treatmentResultMessage !== undefined) updateData['Treatment Result Message'] = data.treatmentResultMessage;
            if (data.additionalMessage !== undefined) updateData['Additional Message'] = data.additionalMessage;
            if (data.beforeImagesText !== undefined) updateData['Before Images Texts'] = data.beforeImagesText;
            if (data.processImagesText !== undefined) updateData['Process Images Texts'] = data.processImagesText;
            if (data.afterImagesText !== undefined) updateData['After Images Texts'] = data.afterImagesText;
            
            if (data.status !== undefined) updateData['Status'] = data.status;
            
            console.log('Airtable에 업데이트할 데이터:', updateData);
            
            await base('Post Data Requests').update(id, updateData);
            
            console.log('Airtable 레코드 업데이트 성공');
        } catch (error) {
            console.error('자료 요청 업데이트 실패:', error);
            throw error;
        }
    }

    // 검토 결과 관련 메서드
    static async getPostReview(postId: string): Promise<PostReview | null> {
        try {
            const records = await base('Post Reviews')
                .select({
                    filterByFormula: `{Post ID} = '${postId}'`
                })
                .all();
            
            if (records.length === 0) return null;

            const record = records[0];
            return {
                id: record.id,
                postId: record.get('Post ID') as string,
                seoScore: record.get('SEO Score') as number,
                legalScore: record.get('Legal Score') as number,
                seoChecklist: record.get('SEO Checklist') as string,
                legalChecklist: record.get('Legal Checklist') as string,
                reviewedAt: record.get('Reviewed At') as string,
                reviewer: record.get('Reviewer') as string,
            };
        } catch (error) {
            console.error('검토 결과 조회 실패:', error);
            return null;
        }
    }

    static async submitPostReview(data: Omit<PostReview, 'id' | 'reviewedAt'>): Promise<void> {
        try {
            await base('Post Reviews').create({
                'Post ID': data.postId,
                'SEO Score': data.seoScore,
                'Legal Score': data.legalScore,
                'SEO Checklist': data.seoChecklist,
                'Legal Checklist': data.legalChecklist,
                'Reviewed At': new Date().toISOString(),
                'Reviewer': data.reviewer
            });
        } catch (error) {
            console.error('검토 결과 제출 실패:', error);
            throw error;
        }
    }

    // 커뮤니케이션 관련 메서드
    static async getPostCommunications(postId: string): Promise<PostCommunication[]> {
        try {
            const records = await base('Post Communications')
                .select({
                    filterByFormula: `{Post ID} = '${postId}'`,
                    sort: [{ field: 'Timestamp', direction: 'desc' }]
                })
                .all();
            
            return records.map(record => ({
            id: record.id,
                postId: record.get('Post ID') as string,
                sender: record.get('Sender') as 'hospital' | 'legalcare',
                senderName: record.get('Sender Name') as string,
                content: record.get('Content') as string,
                timestamp: record.get('Timestamp') as string,
                type: record.get('Type') as any,
            }));
        } catch (error) {
            console.error('커뮤니케이션 조회 실패:', error);
            return [];
        }
    }

    static async addCommunication(data: Omit<PostCommunication, 'id' | 'timestamp'>): Promise<void> {
        try {
            await base('Post Communications').create({
                'Post ID': data.postId,
                'Sender': data.sender,
                'Sender Name': data.senderName,
                'Content': data.content,
                'Timestamp': new Date().toISOString(),
                'Type': data.type
            });
        } catch (error) {
            console.error('커뮤니케이션 추가 실패:', error);
            throw error;
        }
    }

    // 전체 활동 피드 조회
    static async getRecentActivity(): Promise<PostCommunication[]> {
        try {
            const records = await base('Post Communications')
                .select({
                    sort: [{ field: 'Timestamp', direction: 'desc' }],
                    maxRecords: 10
                })
                .all();
            
            return records.map(record => ({
                id: record.id,
                postId: record.get('Post ID') as string,
                sender: record.get('Sender') as 'hospital' | 'legalcare',
                senderName: record.get('Sender Name') as string,
                content: record.get('Content') as string,
                timestamp: record.get('Timestamp') as string,
                type: record.get('Type') as any,
            }));
        } catch (error) {
            console.error('최근 활동 조회 실패:', error);
            return [];
        }
    }

    // ===== 설정: 병원 정보 =====
    static async getHospitalSettings(): Promise<HospitalSettings | null> {
        try {
            const records = await base('Settings - Hospital').select({ maxRecords: 1 }).all();
            if (records.length === 0) return null;
            const r = records[0];
            return {
                id: r.id,
                hospitalName: (r.get('Hospital Name') as string) || '',
                businessNumber: (r.get('Business Number') as string) || '',
                representativeName: (r.get('Representative Name') as string) || '',
                postalCode: (r.get('Postal Code') as string) || '',
                addressLine1: (r.get('Address Line1') as string) || '',
                addressLine2: (r.get('Address Line2') as string) || '',
                phone: (r.get('Phone') as string) || '',
                fax: (r.get('Fax') as string) || '',
                email: (r.get('Email') as string) || '',
                website: (r.get('Website') as string) || '',
            };
        } catch (error) {
            console.error('병원 설정 조회 실패:', error);
            return null;
        }
    }

    static async upsertHospitalSettings(data: HospitalSettings): Promise<void> {
        try {
            const records = await base('Settings - Hospital').select({ maxRecords: 1 }).all();
            const payload = {
                'Hospital Name': data.hospitalName || '',
                'Business Number': data.businessNumber || '',
                'Representative Name': data.representativeName || '',
                'Postal Code': data.postalCode || '',
                'Address Line1': data.addressLine1 || '',
                'Address Line2': data.addressLine2 || '',
                'Phone': data.phone || '',
                'Fax': data.fax || '',
                'Email': data.email || '',
                'Website': data.website || '',
            } as FieldSet;
            if (records.length === 0) {
                await base('Settings - Hospital').create(payload);
            } else {
                await base('Settings - Hospital').update(records[0].id, payload);
            }
        } catch (error) {
            console.error('병원 설정 저장 실패:', error);
            throw error;
        }
    }

    // ===== 설정: 벤치마크 병원 =====
    static async getBenchmarkSettings(): Promise<BenchmarkSettings | null> {
        try {
            const records = await base('Settings - Benchmark').select({ maxRecords: 1 }).all();
            if (records.length === 0) return null;
            const r = records[0];
            const csv = (r.get('Benchmark Hospitals') as string) || '';
            return {
                id: r.id,
                benchmarkHospitals: csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
        } catch (error) {
            console.error('벤치마크 설정 조회 실패:', error);
            return null;
        }
    }

    static async upsertBenchmarkSettings(data: BenchmarkSettings): Promise<void> {
        try {
            const records = await base('Settings - Benchmark').select({ maxRecords: 1 }).all();
            const payload = {
                'Benchmark Hospitals': (data.benchmarkHospitals || []).join(','),
            } as FieldSet;
            if (records.length === 0) {
                await base('Settings - Benchmark').create(payload);
            } else {
                await base('Settings - Benchmark').update(records[0].id, payload);
            }
        } catch (error) {
            console.error('벤치마크 설정 저장 실패:', error);
            throw error;
        }
    }

    // ===== 설정: 벤치마크 병원 (행 단위) =====
    static async getBenchmarkHospitalRows(): Promise<BenchmarkHospitalRow[]> {
        try {
            const records = await base('Benchmark Hospitals')
                .select({
                    sort: [{ field: 'Order', direction: 'asc' }]
                })
                .all();
            return records.map(r => ({
                id: r.id,
                hospitalName: (r.get('Hospital Name') as string) || '',
                order: (r.get('Order') as number) ?? 0,
                active: Boolean(r.get('Active')),
                createdAt: (r.get('Created At') as string) || undefined,
                updatedAt: (r.get('Updated At') as string) || undefined,
            }));
        } catch (error) {
            // 테이블 없거나 권한 없는 경우 빈 배열 반환
            console.error('벤치마크 병원(행) 조회 실패:', error);
            return [];
        }
    }

    static async setBenchmarkHospitalRows(names: string[]): Promise<void> {
        try {
            // 기존 레코드 삭제
            const existing = await base('Benchmark Hospitals').select().all();
            if (existing.length > 0) {
                const ids = existing.map(r => r.id);
                for (let i = 0; i < ids.length; i += 10) {
                    await base('Benchmark Hospitals').destroy(ids.slice(i, i + 10));
                }
            }

            // 새 레코드 생성
            const now = new Date().toISOString();
            const rows = names
                .filter(n => n && n.trim())
                .map((name, idx) => ({
                    fields: {
                        'Hospital Name': name.trim(),
                        'Order': idx + 1,
                        'Active': true as any,
                        'Created At': now,
                        'Updated At': now,
                    }
                }));
            for (let i = 0; i < rows.length; i += 10) {
                await base('Benchmark Hospitals').create(rows.slice(i, i + 10));
            }

            // 호환성을 위해 CSV 필드도 반영
            await AirtableService.upsertBenchmarkSettings({ benchmarkHospitals: names });
        } catch (error) {
            console.error('벤치마크 병원(행) 저장 실패:', error);
            throw error;
        }
    }

    // ===== 카페: 포스트 목록 =====
    static async getCafePosts(limit: number = 50): Promise<CafePost[]> {
        try {
            const records = await base('Cafe Posts')
                .select({
                    maxRecords: limit,
                    sort: [{ field: 'Date', direction: 'desc' }]
                })
                .all();
            return records.map(r => ({
                id: r.id,
                postKey: (r.get('Post Key') as string) || '',
                clubId: (r.get('Club ID') as string) || '',
                articleId: (r.get('Article ID') as string) || '',
                cafeName: (r.get('Cafe Name') as string) || '',
                title: (r.get('Title') as string) || '',
                author: (r.get('Author') as string) || '',
                date: (r.get('Date') as string) || '',
                views: (r.get('Views') as number) || 0,
                commentsCount: (r.get('Comments Count') as number) || 0,
                mentionedClinics: ((r.get('Mentioned Clinics') as string) || ''),
                relatedTreatments: ((r.get('Related Treatments') as string) || ''),
                sentiment: (r.get('Sentiment') as string) || '',
                link: (r.get('Link') as string) || ''
            }));
        } catch (error) {
            console.error('카페 포스트 조회 실패:', error);
            return [];
        }
    }

    static async getCafeWeeklyTotals(limit: number = 500): Promise<CafeWeeklyTotal[]> {
        try {
            const records = await base('Cafe Weekly Views')
                .select({
                    maxRecords: limit,
                    sort: [{ field: 'Week Start', direction: 'asc' }]
                })
                .all();
            const map: Record<string, number> = {};
            records.forEach(r => {
                const w = (r.get('Week Start') as string) || '';
                const v = (r.get('Views') as number) || 0;
                if (!w) return;
                map[w] = (map[w] || 0) + v;
            });
            return Object.entries(map).map(([weekStart, views]) => ({ weekStart, views })).sort((a,b)=>a.weekStart.localeCompare(b.weekStart));
        } catch (error) {
            console.error('카페 주간 합계 조회 실패:', error);
            return [];
        }
    }

    static async getCafeTopCafesByViews(limit: number = 5): Promise<{ name: string; views: number }[]> {
        try {
            const records = await base('Cafe Posts').select({ maxRecords: 500 }).all();
            const map: Record<string, number> = {};
            records.forEach(r => {
                const name = (r.get('Cafe Name') as string) || '알수없음';
                const views = (r.get('Views') as number) || 0;
                map[name] = (map[name] || 0) + views;
            });
            return Object.entries(map)
                .map(([name, views]) => ({ name, views }))
                .sort((a,b)=>b.views - a.views)
                .slice(0, limit);
        } catch (error) {
            console.error('카페 상위 조회수 집계 실패:', error);
            return [];
        }
    }

    static async getCafeWeeklyViews(limit: number = 5000): Promise<CafeWeeklyViewRow[]> {
        try {
            const records = await base('Cafe Weekly Views')
                .select({ maxRecords: limit })
                .all();
            return records.map(r => ({
                postKey: (r.get('Post Key') as string) || '',
                weekStart: (r.get('Week Start') as string) || '',
                views: (r.get('Views') as number) || 0,
            }));
        } catch (error) {
            console.error('카페 주간 조회수 조회 실패:', error);
            return [];
        }
    }

    static async getCafeWeeklyViewsByMentionedHospital(hospitalName: string, postKeys: string[]): Promise<{ weekStart: string; views: number }[]> {
        try {
            if (!postKeys || postKeys.length === 0) return [];
            
            const allViews = await AirtableService.getCafeWeeklyViews(10000);
            const filteredViews = allViews.filter(v => postKeys.includes(v.postKey));
            
            const map: Record<string, number> = {};
            filteredViews.forEach(v => {
                map[v.weekStart] = (map[v.weekStart] || 0) + v.views;
            });
            
            return Object.entries(map)
                .map(([weekStart, views]) => ({ weekStart, views }))
                .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
        } catch (error) {
            console.error('병원 언급 주간 조회수 조회 실패:', error);
            return [];
        }
    }

    static async getCafeNegativeReportByDate(dateIso: string, hospitalName: string): Promise<CafeReportRow[]> {
        try {
            // Cafe Posts Report 테이블을 직접 조회 (조건 없이 첫 번째 행만 가져옴)
            const records = await base('Cafe Posts Report')
                .select({ 
                    maxRecords: 1,
                })
                .all();
            
            return records.map(r => ({
                id: r.id,
                postKey: (r.get('Post Key') as string) || undefined,
                cafeName: (r.get('Cafe Name') as string) || '',
                title: (r.get('Title') as string) || '',
                author: (r.get('Author') as string) || undefined,
                date: (r.get('Date') as string) || '',
                views: (r.get('Views') as number) || 0,
                commentsCount: (r.get('Comments Count') as number) || 0,
                mentionedClinics: (r.get('Mentioned Clinics') as string) || '',
                relatedTreatments: (r.get('Related Treatments') as string) || '',
                sentiment: (r.get('Sentiment') as string) || '',
                link: (r.get('Link') as string) || '',
                content: (r.get('Content') as string) || '',
                textAnalysis: (r.get('Text Analysis') as string) || '',
                metaAnalysis: (r.get('Meta Analysis') as string) || '',
                authorAnalysis: (r.get('Author Analysis') as string) || '',
                recommendation: (r.get('Recommendation') as string) || '',
            } as CafeReportRow));
        } catch (error: any) {
            console.error('Cafe Posts Report 조회 실패:', error.message || error);
            return [];
        }
    }

    static async getCafeReportsByPostKeys(postKeys: string[]): Promise<CafeReportRow[]> {
        if (!postKeys || postKeys.length === 0) return [];
        try {
            const results: CafeReportRow[] = [];
            // Airtable formula 제한 고려, 30개씩 분할 조회
            for (let i = 0; i < postKeys.length; i += 30) {
                const chunk = postKeys.slice(i, i + 30);
                // Airtable에서는 작은따옴표는 두 번 반복하여 이스케이프
                const esc = (s: string) => s.replace(/'/g, "''");
                const formula = `OR(${chunk.map(k => `({Post Key} = '${esc(k)}')`).join(',')})`;
                const records = await base('Cafe Posts Report').select({
                    filterByFormula: formula,
                    maxRecords: 1000,
                }).all();
                results.push(
                    ...records.map(r => ({
                        id: r.id,
                        postKey: (r.get('Post Key') as string) || undefined,
                        cafeName: (r.get('Cafe Name') as string) || '',
                        title: (r.get('Title') as string) || '',
                        author: (r.get('Author') as string) || undefined,
                        date: (r.get('Date') as string) || '',
                        views: (r.get('Views') as number) || 0,
                        commentsCount: (r.get('Comments Count') as number) || 0,
                        mentionedClinics: (r.get('Mentioned Clinics') as string) || '',
                        relatedTreatments: (r.get('Related Treatments') as string) || '',
                        sentiment: (r.get('Sentiment') as string) || '',
                        link: (r.get('Link') as string) || '',
                        content: (r.get('Content') as string) || '',
                        textAnalysis: (r.get('Text Analysis') as string) || '',
                        metaAnalysis: (r.get('Meta Analysis') as string) || '',
                        authorAnalysis: (r.get('Author Analysis') as string) || '',
                        recommendation: (r.get('Recommendation') as string) || '',
                    } as CafeReportRow))
                );
            }
            return results;
        } catch (error) {
            console.error('Cafe Posts Report(Post Key) 조회 실패:', error);
            return [];
        }
    }

    // ===== 카페: 사전 집계 통계 =====
    static async getCafeHospitalWeeklyStats(hospitalName: string, subject: string): Promise<CafeHospitalWeeklyStats[]> {
        try {
            const records = await base('Cafe Hospital Weekly Stats')
                .select({
                    filterByFormula: `AND({Hospital Name} = '${hospitalName.replace(/'/g, "''")}', {Subject} = '${subject.replace(/'/g, "''")}')`,
                    sort: [{ field: 'Week Start', direction: 'asc' }]
                })
                .all();
            
            return records.map(r => ({
                statsKey: (r.get('Stats Key') as string) || '',
                hospitalName: (r.get('Hospital Name') as string) || '',
                weekStart: (r.get('Week Start') as string) || '',
                subject: (r.get('Subject') as string) || '',
                totalViews: (r.get('Total Views') as number) || 0,
                postCount: (r.get('Post Count') as number) || 0,
                createdAt: (r.get('Created At') as string) || undefined,
            }));
        } catch (error) {
            console.error('주간 통계 조회 실패:', error);
            return [];
        }
    }

    static async getCafeHospitalMonthlyStats(hospitalName: string, subject: string): Promise<CafeHospitalMonthlyStats[]> {
        try {
            const records = await base('Cafe Hospital Monthly Stats')
                .select({
                    filterByFormula: `AND({Hospital Name} = '${hospitalName.replace(/'/g, "''")}', {Subject} = '${subject.replace(/'/g, "''")}')`,
                    sort: [{ field: 'Month', direction: 'asc' }]
                })
                .all();
            
            return records.map(r => ({
                statsKey: (r.get('Stats Key') as string) || '',
                hospitalName: (r.get('Hospital Name') as string) || '',
                month: (r.get('Month') as string) || '',
                subject: (r.get('Subject') as string) || '',
                totalViews: (r.get('Total Views') as number) || 0,
                postCount: (r.get('Post Count') as number) || 0,
                createdAt: (r.get('Created At') as string) || undefined,
            }));
        } catch (error) {
            console.error('월간 통계 조회 실패:', error);
            return [];
        }
    }

    // 카페별 통계 조회 (파이 차트용)
    static async getCafeStatsByNameWeekly(hospitalName: string, subject: string, startDate: string, endDate: string): Promise<CafeStatsByName[]> {
        try {
            const records = await base('Cafe Stats By Name Weekly')
                .select({
                    filterByFormula: `AND(
                        {Hospital Name} = '${hospitalName.replace(/'/g, "''")}', 
                        {Subject} = '${subject.replace(/'/g, "''")}',
                        IS_AFTER({Week Start}, '${startDate}'),
                        IS_BEFORE({Week Start}, '${endDate}')
                    )`,
                    sort: [{ field: 'Total Views', direction: 'desc' }]
                })
                .all();
            
            // 카페별로 합산
            const cafeMap = new Map<string, CafeStatsByName>();
            records.forEach(r => {
                const cafeName = (r.get('Cafe Name') as string) || '';
                const views = (r.get('Total Views') as number) || 0;
                
                if (cafeMap.has(cafeName)) {
                    const existing = cafeMap.get(cafeName)!;
                    existing.totalViews += views;
                } else {
                    cafeMap.set(cafeName, {
                        statsKey: `${hospitalName}-${cafeName}-${subject}`,
                        hospitalName,
                        cafeName,
                        subject,
                        totalViews: views,
                        postCount: (r.get('Post Count') as number) || 0,
                    });
                }
            });
            
            return Array.from(cafeMap.values())
                .sort((a, b) => b.totalViews - a.totalViews)
                .slice(0, 10); // 상위 10개만 반환
        } catch (error) {
            console.error('카페별 주간 통계 조회 실패:', error);
            return [];
        }
    }

    static async getCafeStatsByNameMonthly(hospitalName: string, subject: string, startMonth: string, endMonth: string): Promise<CafeStatsByName[]> {
        try {
            const records = await base('Cafe Stats By Name Monthly')
                .select({
                    filterByFormula: `AND(
                        {Hospital Name} = '${hospitalName.replace(/'/g, "''")}', 
                        {Subject} = '${subject.replace(/'/g, "''")}',
                        {Month} >= '${startMonth}',
                        {Month} <= '${endMonth}'
                    )`,
                    sort: [{ field: 'Total Views', direction: 'desc' }]
                })
                .all();
            
            // 카페별로 합산
            const cafeMap = new Map<string, CafeStatsByName>();
            records.forEach(r => {
                const cafeName = (r.get('Cafe Name') as string) || '';
                const views = (r.get('Total Views') as number) || 0;
                
                if (cafeMap.has(cafeName)) {
                    const existing = cafeMap.get(cafeName)!;
                    existing.totalViews += views;
                } else {
                    cafeMap.set(cafeName, {
                        statsKey: `${hospitalName}-${cafeName}-${subject}`,
                        hospitalName,
                        cafeName,
                        subject,
                        totalViews: views,
                        postCount: (r.get('Post Count') as number) || 0,
                    });
                }
            });
            
            return Array.from(cafeMap.values())
                .sort((a, b) => b.totalViews - a.totalViews)
                .slice(0, 10); // 상위 10개만 반환
        } catch (error) {
            console.error('카페별 월간 통계 조회 실패:', error);
            return [];
        }
    }

    // ===== 설정: 시스템 연동 =====
    static async getIntegrationSettings(): Promise<IntegrationSettings | null> {
        try {
            const records = await base('Settings - Integration').select({ maxRecords: 1 }).all();
            if (records.length === 0) return null;
            const r = records[0];
            return {
                id: r.id,
                emrType: (r.get('EMR Type') as string) || '',
                emrApiKey: (r.get('EMR API Key') as string) || '',
            };
        } catch (error) {
            console.error('연동 설정 조회 실패:', error);
            return null;
        }
    }

    static async upsertIntegrationSettings(data: IntegrationSettings): Promise<void> {
        try {
            const records = await base('Settings - Integration').select({ maxRecords: 1 }).all();
            const payload = {
                'EMR Type': data.emrType || '',
                'EMR API Key': data.emrApiKey || '',
            } as FieldSet;
            if (records.length === 0) {
                await base('Settings - Integration').create(payload);
            } else {
                await base('Settings - Integration').update(records[0].id, payload);
            }
        } catch (error) {
            console.error('연동 설정 저장 실패:', error);
            throw error;
        }
    }

    // ===== 설정: 사용자 =====
    static async getUsers(): Promise<AppUser[]> {
        try {
            const records = await base('Users').select().all();
            return records.map(r => ({
                id: r.id,
                name: (r.get('Name') as string) || '',
                email: (r.get('Email') as string) || '',
                role: (r.get('Role') as any) || '직원',
                status: (r.get('Status') as any) || '활성',
                lastLogin: (r.get('Last Login') as string) || undefined,
            }));
        } catch (error) {
            console.error('사용자 목록 조회 실패:', error);
            return [];
        }
    }

    static async addUser(user: Omit<AppUser, 'id' | 'lastLogin'>): Promise<void> {
        try {
            await base('Users').create({
                'Name': user.name,
                'Email': user.email,
                'Role': user.role,
                'Status': user.status,
            });
        } catch (error) {
            console.error('사용자 추가 실패:', error);
            throw error;
        }
    }

    static async updateUser(id: string, user: Partial<AppUser>): Promise<void> {
        try {
            const payload: any = {};
            if (user.name !== undefined) payload['Name'] = user.name;
            if (user.email !== undefined) payload['Email'] = user.email;
            if (user.role !== undefined) payload['Role'] = user.role;
            if (user.status !== undefined) payload['Status'] = user.status;
            if (user.lastLogin !== undefined) payload['Last Login'] = user.lastLogin;
            await base('Users').update(id, payload);
        } catch (error) {
            console.error('사용자 업데이트 실패:', error);
            throw error;
        }
    }

    // ===== 설정: 결제 =====
    static async getBillingSettings(): Promise<BillingSettings | null> {
        try {
            const records = await base('Settings - Billing').select({ maxRecords: 1 }).all();
            if (records.length === 0) return null;
            const r = records[0];
            return {
                id: r.id,
                plan: (r.get('Plan') as string) || '',
                nextBillingDate: (r.get('Next Billing Date') as string) || '',
                usagePercent: (r.get('Usage Percent') as number) || 0,
                paymentLast4: (r.get('Payment Last4') as string) || undefined,
                paymentExpiry: (r.get('Payment Expiry') as string) || undefined,
            };
        } catch (error) {
            console.error('결제 설정 조회 실패:', error);
            return null;
        }
    }

    static async upsertBillingSettings(data: BillingSettings): Promise<void> {
        try {
            const records = await base('Settings - Billing').select({ maxRecords: 1 }).all();
            const payload = {
                'Plan': data.plan || '',
                'Next Billing Date': data.nextBillingDate || '',
                'Usage Percent': data.usagePercent ?? 0,
                'Payment Last4': data.paymentLast4 || '',
                'Payment Expiry': data.paymentExpiry || '',
            } as FieldSet;
            if (records.length === 0) {
                await base('Settings - Billing').create(payload);
            } else {
                await base('Settings - Billing').update(records[0].id, payload);
            }
        } catch (error) {
            console.error('결제 설정 저장 실패:', error);
            throw error;
        }
    }

    // ===== 블로그 관련 함수들 =====
    
    // 블로그 포스트 요약 조회 (Blog Posts Summary 테이블 사용)
    static async getBlogPostsSummary(filters?: { 
        status?: string; 
        subject?: string; 
        campaignName?: string;
        dateRange?: { start: string; end: string };
    }): Promise<BlogPost[]> {
        try {
            let query = base('Blog Posts Summary').select({
                sort: [{ field: 'Publish Date', direction: 'desc' }]
            });

            const records = await query.all();
            let filteredRecords = records;

            // 필터 적용
            if (filters) {
                if (filters.status) {
                    filteredRecords = filteredRecords.filter(r => 
                        r.get('Status') === filters.status
                    );
                }
                if (filters.subject) {
                    filteredRecords = filteredRecords.filter(r => 
                        r.get('Subject') === filters.subject
                    );
                }
                if (filters.dateRange) {
                    filteredRecords = filteredRecords.filter(r => {
                        const date = r.get('Publish Date') as string;
                        return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
                    });
                }
            }

            return filteredRecords.map(r => ({
                id: r.id,
                postId: r.get('Post ID') as string,
                postTitle: r.get('Post Title') as string,
                targetKeyword: r.get('Target Keyword') as string,
                subject: r.get('Subject') as string,
                publishDate: (() => {
                    const date = r.get('Publish Date');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                blogUrl: r.get('Blog URL') as string,
                totalViews: (r.get('Total Views') as number) || 0,
                totalInflow: (r.get('Total Inflow') as number) || 0,
                conversions: (r.get('Total Conversions') as number) || 0,
                currentRank: (r.get('Current Rank') as number) || undefined,
                previousRank: (r.get('Best Rank') as number) || undefined,
                status: (() => {
                    const status = r.get('Status') as string;
                    if (status === '정상' || status === '순위하락' || status === '미노출') {
                        return status;
                    }
                    return '정상';
                })(),
                seoScore: (r.get('SEO Score') as number) || 0,
                legalStatus: (() => {
                    const legalStatus = r.get('Legal Status') as string;
                    if (legalStatus === '안전' || legalStatus === '주의' || legalStatus === '위험') {
                        return legalStatus;
                    }
                    return '안전';
                })(),
                author: '내이튼치과의원',
                campaignName: '',
                isActive: true
            }));
        } catch (error) {
            console.error('블로그 포스트 요약 조회 실패:', error);
            return [];
        }
    }

    // 블로그 포스트 조회 (기존 함수 - 호환성 유지)
    static async getBlogPosts(filters?: { 
        status?: string; 
        subject?: string; 
        campaignName?: string;
        dateRange?: { start: string; end: string };
    }): Promise<BlogPost[]> {
        try {
            let query = base('Blog Posts').select({
                sort: [{ field: 'Publish Date', direction: 'desc' }]
            });

            const records = await query.all();
            let filteredRecords = records;

            // 필터 적용
            if (filters) {
                if (filters.status) {
                    filteredRecords = filteredRecords.filter(r => 
                        r.get('Status') === filters.status
                    );
                }
                if (filters.subject) {
                    filteredRecords = filteredRecords.filter(r => 
                        r.get('Subject') === filters.subject || r.get('subject') === filters.subject
                    );
                }
                if (filters.campaignName) {
                    filteredRecords = filteredRecords.filter(r => 
                        r.get('Campaign Name') === filters.campaignName
                    );
                }
                if (filters.dateRange) {
                    filteredRecords = filteredRecords.filter(r => {
                        const date = r.get('Publish Date') as string;
                        return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
                    });
                }
            }

            return filteredRecords.map(r => ({
                id: r.id,
                postId: (r.get('Post ID') as string) || (r.get('postId') as string) || '',
                postTitle: (r.get('Title') as string) || (r.get('title') as string) || '',
                blogUrl: (r.get('URL') as string) || (r.get('Blog URL') as string) || '',
                targetKeyword: (r.get('Target Keyword') as string) || (r.get('targetKeyword') as string) || '',
                subject: (r.get('Subject') as string) || (r.get('subject') as string) || '전체',
                campaignName: (r.get('Campaign Name') as string) || undefined,
                publishDate: (() => {
                    const date = r.get('Date') || r.get('date') || r.get('Publish Date');
                    // Excel 일수 형식인 경우 변환
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                status: (r.get('Status') as any) || '정상',
                currentRank: (r.get('Current Rank') as number) || (r.get('rank_high') as number) || undefined,
                previousRank: (r.get('Previous Rank') as number) || (r.get('rank_low') as number) || undefined,
                isActive: (r.get('Is Active') as boolean) !== false,
                author: (r.get('Author') as string) || '내이튼치과의원',
                seoScore: (r.get('SEO Score') as number) || undefined,
                legalStatus: (r.get('Legal Status') as any) || '안전',
                totalViews: (r.get('Views') as number) || (r.get('views') as number) || 0,
                totalInflow: (r.get('Blog Inflow') as number) || (r.get('blogInflow') as number) || 0,
                conversions: (r.get('Conversions') as number) || (r.get('conversions') as number) || 0,
            }));
        } catch (error) {
            console.error('블로그 포스트 조회 실패:', error);
            return [];
        }
    }

    // 블로그 주간 메트릭스 조회
    static async getBlogWeeklyMetrics(postId?: string, weekStart?: string): Promise<BlogWeeklyMetrics[]> {
        try {
            let query = base('Blog Weekly Metrics').select({
                sort: [{ field: 'Week Start', direction: 'desc' }]
            });

            const records = await query.all();
            let filteredRecords = records;

            if (postId) {
                filteredRecords = filteredRecords.filter(r => r.get('Post ID') === postId);
            }
            if (weekStart) {
                filteredRecords = filteredRecords.filter(r => r.get('Week Start') === weekStart);
            }

            return filteredRecords.map(r => ({
                id: r.id,
                postId: (r.get('Post ID') as string) || (r.get('postId') as string) || '',
                weekStart: (() => {
                    const date = r.get('Week Start') || r.get('weekStart');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                weekNumber: (r.get('Week Number') as number) || (r.get('weekNumber') as number) || 1,
                weeklyViews: (r.get('Weekly Views') as number) || (r.get('weeklyViews') as number) || 0,
                weeklyInflow: (r.get('Weekly Inflow') as number) || (r.get('weeklyInflow') as number) || 0,
                weeklyRank: (r.get('Weekly Rank') as number) || (r.get('weeklyRank') as number) || undefined,
                weeklyPlaceClicks: (r.get('Weekly Place Clicks') as number) || (r.get('weeklyPlaceClicks') as number) || 0,
                weeklyConversions: (r.get('Weekly Conversions') as number) || (r.get('weeklyConversions') as number) || 0,
                weeklyConversionRate: (r.get('Weekly Conversion Rate') as number) || (r.get('weeklyConversionRate') as number) || 0,
                topKeywords: (r.get('Top Keywords') as string) || (r.get('topKeywords') as string) || undefined,
            }));
        } catch (error) {
            console.error('블로그 주간 메트릭스 조회 실패:', error);
            return [];
        }
    }

    // 블로그 캠페인 조회
    static async getBlogCampaigns(status?: '진행중' | '완료' | '예정'): Promise<BlogCampaign[]> {
        try {
            let query = base('Blog Campaigns').select({
                sort: [{ field: 'Period Start', direction: 'desc' }]
            });

            const records = await query.all();
            let filteredRecords = records;

            // 현재는 Status 필드가 없으므로 모든 캠페인을 반환
            // TODO: Status 필드가 추가되면 필터링 로직 구현

            return filteredRecords.map(r => ({
                id: r.id,
                name: (r.get('Name') as string) || '',
                periodStart: (() => {
                    const date = r.get('Period Start');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                periodEnd: (() => {
                    const date = r.get('Period End');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                subjectCluster: (r.get('Subject Cluster') as string) || '',
                targetInflow: (r.get('Target Inflow') as number) || 0,
            }));
        } catch (error) {
            console.error('블로그 캠페인 조회 실패:', error);
            return [];
        }
    }

    // 블로그 벤치마크 랭킹 조회
    static async getBlogBenchmarkRankings(keyword?: string, weekStart?: string): Promise<BlogBenchmarkRanking[]> {
        try {
            let query = base('Blog Weekly Rankings').select({
                sort: [{ field: 'Week Start', direction: 'desc' }]
            });

            const records = await query.all();
            let filteredRecords = records;

            if (keyword) {
                filteredRecords = filteredRecords.filter(r => r.get('Keyword') === keyword);
            }
            if (weekStart) {
                filteredRecords = filteredRecords.filter(r => r.get('Week Start') === weekStart);
            }

            return filteredRecords.map(r => ({
                id: r.id,
                hospitalName: (r.get('Hospital Name') as string) || (r.get('hospitalName') as string) || '',
                keyword: (r.get('Keyword') as string) || (r.get('keyword') as string) || '',
                weekStart: (() => {
                    const date = r.get('Week Start') || r.get('weekStart');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                ranking: (r.get('Ranking') as number) || (r.get('ranking') as number) || 0,
            }));
        } catch (error) {
            console.error('블로그 벤치마크 랭킹 조회 실패:', error);
            return [];
        }
    }

    // 캠페인 타겟 조회
    static async getCampaignTargets(campaignId?: string): Promise<CampaignTarget[]> {
        try {
            let query = base('Campaign Targets').select({
                sort: [{ field: 'Publish Date', direction: 'desc' }]
            });

            const records = await query.all();
            let filteredRecords = records;

            if (campaignId) {
                // campaignId가 Blog Campaigns의 id인 경우, 해당 캠페인의 Campaign ID를 찾아서 필터링
                if (campaignId.startsWith('rec')) {
                    // Blog Campaigns에서 해당 id의 Campaign ID를 찾기
                    const campaignQuery = base('Blog Campaigns').select({
                        filterByFormula: `RECORD_ID() = '${campaignId}'`
                    });
                    const campaignRecords = await campaignQuery.all();
                    if (campaignRecords.length > 0) {
                        const actualCampaignId = campaignRecords[0].get('Campaign ID') as string;
                        filteredRecords = filteredRecords.filter(r => r.get('Campaign ID') === actualCampaignId);
                    }
                } else {
                    // campaignId가 이미 Campaign ID인 경우
                    filteredRecords = filteredRecords.filter(r => r.get('Campaign ID') === campaignId);
                }
            }

            return filteredRecords.map(r => ({
                id: r.id,
                campaignId: (r.get('Campaign ID') as string) || '',
                postId: (r.get('Post ID') as string) || '',
                postTitle: (r.get('Post Title') as string) || '',
                postType: (r.get('Post Type') as any) || '유입',
                publishDate: (() => {
                    const date = r.get('Publish Date');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                keywords: (r.get('Keywords') as string) || '',
                targetInflow: (r.get('Target Inflow') as number) || 0,
                achievedInflow: (r.get('Achieved Inflow') as number) || 0,
                rank: (r.get('Rank') as number) || undefined,
                seoScore: (r.get('SEO Score') as number) || undefined,
                legalStatus: (r.get('Legal Status') as any) || '안전',
                status: (r.get('Status') as any) || 'normal',
            }));
        } catch (error) {
            console.error('캠페인 타겟 조회 실패:', error);
            return [];
        }
    }

    // 캠페인 현황 데이터 조회
    static async getCampaignStatus(): Promise<{ normalCount: number; totalCount: number; currentCampaignName: string }> {
        try {
            const targets = await this.getCampaignTargets();
            const normalCount = targets.filter(t => t.status === 'normal').length;
            const totalCount = targets.length;
            
            // 현재 활성 캠페인 이름 가져오기
            const campaigns = await this.getBlogCampaigns();
            const currentCampaignName = campaigns.length > 0 ? campaigns[0].name : '진행 중인 캠페인 없음';
            
            return {
                normalCount,
                totalCount,
                currentCampaignName
            };
        } catch (error) {
            console.error('캠페인 현황 조회 실패:', error);
            return { normalCount: 0, totalCount: 0, currentCampaignName: '캠페인 정보 없음' };
        }
    }

    // 검색 유입량 데이터 조회 (최근 4주)
    static async getSearchInflowData(subject: '전체' | '임플란트' | '신경치료' = '전체'): Promise<{ total: number; changeRate: number; topKeywords: string[] }> {
        try {
            // 현재 4주 기간 계산
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 28); // 4주 = 28일
            
            // 이전 4주 기간 계산
            const prevEndDate = new Date(startDate);
            const prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - 28); // 이전 4주
            
            const endDateStr = endDate.toISOString().split('T')[0];
            const startDateStr = startDate.toISOString().split('T')[0];
            const prevEndDateStr = prevEndDate.toISOString().split('T')[0];
            const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
            
            // Blog Weekly Metrics 데이터 조회 (현재 4주 + 이전 4주)
            const query = base('Blog Weekly Metrics').select({
                filterByFormula: `AND(
                    IS_AFTER({Week Start}, '${prevStartDateStr}'),
                    IS_BEFORE({Week Start}, '${endDateStr}')
                )`
            });
            
            const records = await query.all();
            let filteredRecords = records;
            
            // Subject 필터링
            if (subject !== '전체') {
                filteredRecords = filteredRecords.filter(r => r.get('Subject') === subject);
            }
            
            // 현재 4주와 이전 4주 데이터 분리
            const currentRecords = filteredRecords.filter(r => {
                const weekStart = r.get('Week Start') as string;
                return weekStart >= startDateStr && weekStart < endDateStr;
            });
            
            const prevRecords = filteredRecords.filter(r => {
                const weekStart = r.get('Week Start') as string;
                return weekStart >= prevStartDateStr && weekStart < prevEndDateStr;
            });
            
            // Inflow 합산
            const currentTotal = currentRecords.reduce((sum, r) => sum + (r.get('Inflow') as number || 0), 0);
            const prevTotal = prevRecords.reduce((sum, r) => sum + (r.get('Inflow') as number || 0), 0);
            
            // 변화율 계산
            let changeRate = 0;
            if (prevTotal > 0) {
                changeRate = Math.round(((currentTotal - prevTotal) / prevTotal) * 100 * 10) / 10; // 소수점 첫째자리까지
            } else if (currentTotal > 0) {
                changeRate = 100; // 이전에 데이터가 없고 현재에 데이터가 있으면 100% 증가
            }
            
            // TOP 키워드 추출 (임시로 빈 배열)
            const topKeywords: string[] = []; // TODO: 키워드 데이터에서 추출
            
            return {
                total: currentTotal,
                changeRate,
                topKeywords
            };
        } catch (error) {
            console.error('검색 유입량 데이터 조회 실패:', error);
            return { total: 0, changeRate: 0, topKeywords: [] };
        }
    }

    // 플레이스 전환 데이터 조회 (최근 4주)
    static async getPlaceConversionData(subject: '전체' | '임플란트' | '신경치료' = '전체'): Promise<{ rate: number; changeRate: number; topPosts: string[] }> {
        try {
            // 현재 4주 기간 계산
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 28); // 4주 = 28일
            
            // 이전 4주 기간 계산
            const prevEndDate = new Date(startDate);
            const prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - 28); // 이전 4주
            
            const endDateStr = endDate.toISOString().split('T')[0];
            const startDateStr = startDate.toISOString().split('T')[0];
            const prevEndDateStr = prevEndDate.toISOString().split('T')[0];
            const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
            
            // Blog Weekly Metrics 데이터 조회 (현재 4주 + 이전 4주)
            const query = base('Blog Weekly Metrics').select({
                filterByFormula: `AND(
                    IS_AFTER({Week Start}, '${prevStartDateStr}'),
                    IS_BEFORE({Week Start}, '${endDateStr}')
                )`
            });
            
            const records = await query.all();
            let filteredRecords = records;
            
            // Subject 필터링
            if (subject !== '전체') {
                filteredRecords = filteredRecords.filter(r => r.get('Subject') === subject);
            }
            
            // 현재 4주와 이전 4주 데이터 분리
            const currentRecords = filteredRecords.filter(r => {
                const weekStart = r.get('Week Start') as string;
                return weekStart >= startDateStr && weekStart < endDateStr;
            });
            
            const prevRecords = filteredRecords.filter(r => {
                const weekStart = r.get('Week Start') as string;
                return weekStart >= prevStartDateStr && weekStart < prevEndDateStr;
            });
            
            // Place Clicks와 Inflow 합산
            const currentPlaceClicks = currentRecords.reduce((sum, r) => sum + (r.get('Place Clicks') as number || 0), 0);
            const currentInflow = currentRecords.reduce((sum, r) => sum + (r.get('Inflow') as number || 0), 0);
            const prevPlaceClicks = prevRecords.reduce((sum, r) => sum + (r.get('Place Clicks') as number || 0), 0);
            const prevInflow = prevRecords.reduce((sum, r) => sum + (r.get('Inflow') as number || 0), 0);
            
            // 전환율 계산
            const currentRate = currentInflow > 0 ? Math.round((currentPlaceClicks / currentInflow) * 100 * 10) / 10 : 0;
            const prevRate = prevInflow > 0 ? Math.round((prevPlaceClicks / prevInflow) * 100 * 10) / 10 : 0;
            
            // 변화율 계산
            let changeRate = 0;
            if (prevRate > 0) {
                changeRate = Math.round(((currentRate - prevRate) / prevRate) * 100 * 10) / 10;
            } else if (currentRate > 0) {
                changeRate = 100; // 이전에 전환율이 0이고 현재에 전환율이 있으면 100% 증가
            }
            
            // TOP 포스트 추출 (임시로 빈 배열)
            const topPosts: string[] = []; // TODO: 포스트 데이터에서 추출
            
            return {
                rate: currentRate,
                changeRate,
                topPosts
            };
        } catch (error) {
            console.error('플레이스 전환 데이터 조회 실패:', error);
            return { rate: 0, changeRate: 0, topPosts: [] };
        }
    }

    // 블로그 순위 추이 데이터 조회
    static async getBlogRankingTrends(postId: string): Promise<{ weekStart: string; myRank: number; benchmarkHospital?: string; benchmarkRank?: number }[]> {
        try {
            const query = base('Blog Ranking Trends').select({
                filterByFormula: `{Post ID} = '${postId}'`,
                sort: [{ field: 'Week Start', direction: 'asc' }]
            });
            
            const records = await query.all();
            
            return records.map(r => ({
                weekStart: (() => {
                    const date = r.get('Week Start');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                myRank: (r.get('My Rank') as number) || 0,
                benchmarkHospital: (r.get('Benchmark Hospital') as string) || undefined,
                benchmarkRank: (r.get('Benchmark Rank') as number) || undefined
            }));
        } catch (error) {
            console.error('블로그 순위 추이 데이터 조회 실패:', error);
            return [];
        }
    }

    // 블로그 차트 데이터 조회
    static async getBlogChartData(periodType: '주간' | '월간' = '주간', subject: '전체' | '임플란트' | '신경치료' = '전체'): Promise<{ date: string; views: number; inflow: number; placeClicks: number; conversionRate: number }[]> {
        try {
            // Blog Chart Data 테이블에서 데이터 조회
            const query = base('Blog Chart Data').select({
                filterByFormula: `AND(
                    {Period Type} = '${periodType}',
                    {Subject} = '${subject}'
                )`,
                sort: [{ field: 'Date', direction: 'desc' }]
            });
            
            const records = await query.all();
            
            // 주간 데이터인 경우 최근 12주만 필터링
            let filteredRecords = records;
            if (periodType === '주간') {
                filteredRecords = records.slice(0, 12);
            }
            
            // 날짜순으로 다시 정렬 (오름차순)
            const sortedRecords = Array.from(filteredRecords).sort((a, b) => {
                const dateA = new Date(a.get('Date') as string);
                const dateB = new Date(b.get('Date') as string);
                return dateA.getTime() - dateB.getTime();
            });
            
            return sortedRecords.map(r => ({
                date: (() => {
                    const date = r.get('Date');
                    if (typeof date === 'number' && date > 40000) {
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        return excelDate.toISOString().split('T')[0];
                    }
                    return (date as string) || '';
                })(),
                views: (r.get('Views') as number) || 0,
                inflow: (r.get('Inflow') as number) || 0,
                placeClicks: (r.get('Place Clicks') as number) || 0,
                conversionRate: (r.get('Conversion Rate') as number) || 0
            }));
        } catch (error) {
            console.error('블로그 차트 데이터 조회 실패:', error);
            return [];
        }
    }

    // 블로그 KPI 데이터 집계
    static async getBlogKpiData(dateRange?: { start: string; end: string }): Promise<{
        campaignStatus: { active: number; total: number; warningCount: number };
        searchInflow: { total: number; changeRate: number; topKeywords: string[] };
        placeConversion: { rate: number; changeRate: number; topPosts: string[] };
    }> {
        try {
            // 포스트 데이터 조회
            const posts = await this.getBlogPosts({ dateRange });
            const activeStatus = posts.filter(p => p.status === '정상');
            const warningStatus = posts.filter(p => p.status === '순위하락');

            // 현재 주간 메트릭스 조회
            const currentWeek = new Date();
            currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
            const weekStart = currentWeek.toISOString().split('T')[0];
            
            const metrics = await this.getBlogWeeklyMetrics(undefined, weekStart);
            
            // 집계 계산
            const totalInflow = metrics.reduce((sum, m) => sum + m.weeklyInflow, 0);
            const totalConversions = metrics.reduce((sum, m) => sum + m.weeklyConversions, 0);
            const avgConversionRate = metrics.length > 0 
                ? totalConversions / totalInflow * 100 
                : 0;

            // TOP 키워드 추출
            const keywordMap = new Map<string, number>();
            metrics.forEach(m => {
                if (m.topKeywords) {
                    m.topKeywords.split(',').forEach(kw => {
                        const trimmed = kw.trim();
                        keywordMap.set(trimmed, (keywordMap.get(trimmed) || 0) + 1);
                    });
                }
            });
            const topKeywords = Array.from(keywordMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([kw]) => kw);

            // TOP 성과 포스트
            const topPosts = metrics
                .sort((a, b) => b.weeklyConversionRate - a.weeklyConversionRate)
                .slice(0, 3)
                .map(m => {
                    const post = posts.find(p => p.postId === m.postId);
                    return post?.postTitle || '';
                })
                .filter(title => title);

            return {
                campaignStatus: {
                    active: activeStatus.length,
                    total: posts.length,
                    warningCount: warningStatus.length,
                },
                searchInflow: {
                    total: totalInflow,
                    changeRate: 23, // TODO: 이전 주 대비 계산
                    topKeywords,
                },
                placeConversion: {
                    rate: avgConversionRate,
                    changeRate: -2.1, // TODO: 이전 주 대비 계산
                    topPosts,
                },
            };
        } catch (error) {
            console.error('블로그 KPI 데이터 집계 실패:', error);
            return {
                campaignStatus: { active: 0, total: 0, warningCount: 0 },
                searchInflow: { total: 0, changeRate: 0, topKeywords: [] },
                placeConversion: { rate: 0, changeRate: 0, topPosts: [] },
            };
        }
    }

    // ===== 네이버 플레이스 분석 =====
    static async getPlaceAnalysisReports(): Promise<PlaceAnalysisReport[]> {
        try {
            const records = await base('PlaceAnalysisReport').select({
                sort: [{ field: 'analysisDate', direction: 'desc' }]
            }).all();
            return records.map(r => ({
                id: r.id,
                reportId: r.get('reportId') as string,
                keyword: r.get('keyword') as string,
                analysisDate: r.get('analysisDate') as string,
                competitors: (r.get('competitors') as string[]) || [],
                tierSummaryChart: (r.get('tierSummaryChart') as Attachment[]) || [],
                growthDrivers: r.get('growthDrivers') as string,
                actionPlans: (r.get('actionPlans') as string[]) || [],
            }));
        } catch (error) {
            console.error('플레이스 분석 보고서 조회 실패:', error);
            return [];
        }
    }

    static async getCompetitors(ids: string[]): Promise<Competitor[]> {
        if (!ids || ids.length === 0) return [];
        try {
            const filterFormula = `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`;
            const records = await base('Competitor').select({ filterByFormula: filterFormula }).all();
            return records.map(r => ({
                id: r.id,
                hospitalName: r.get('hospitalName') as string,
                currentRank: r.get('currentRank') as number,
                currentTier: r.get('currentTier') as any,
                previousRank: r.get('previousRank') as number,
                previousTier: r.get('previousTier') as any,
                visitorReviews: r.get('visitorReviews') as number,
                visitorReviewChange: r.get('visitorReviewChange') as number,
                blogReviews: r.get('blogReviews') as number,
                blogReviewChange: r.get('blogReviewChange') as number,
                linkedReport: (r.get('linkedReport') as string[]) || [],
            }));
        } catch (error) {
            console.error('경쟁사 정보 조회 실패:', error);
            return [];
        }
    }

    static async getActionPlans(ids: string[]): Promise<ActionPlan[]> {
        if (!ids || ids.length === 0) return [];
        try {
            const filterFormula = `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`;
            const records = await base('ActionPlan').select({ filterByFormula: filterFormula }).all();
            return records.map(r => ({
                id: r.id,
                planId: r.get('planId') as string,
                targetHospital: r.get('targetHospital') as string,
                currentStatus: r.get('currentStatus') as string,
                goal: r.get('goal') as string,
                solution: r.get('solution') as string,
                planDetails: r.get('planDetails') as string,
                expectedKpi: r.get('expectedKpi') as string,
                linkedReport: (r.get('linkedReport') as string[]) || [],
            }));
        } catch (error) {
            console.error('액션 플랜 정보 조회 실패:', error);
            return [];
        }
    }

    // 홈페이지 차트 데이터 조회
    static async getHomepageChartData(periodType: '주간' | '월간' = '주간', subject: '전체' | '임플란트' | '신경치료' = '전체'): Promise<{ date: string; seoScore: number; searchInflow: number; conversionRate: number }[]> {
        try {
            // Demo Homepage Combined Data 테이블에서 데이터 조회
            const query = base('Demo Homepage Combined Data').select({
                filterByFormula: `{Subject} = '${subject}'`,
                sort: [{ field: 'Date', direction: 'desc' }]
            });
            
            const records = await query.all();
            
            // 주간/월간 데이터 필터링
            let filteredRecords = records;
            if (periodType === '주간') {
                filteredRecords = records.slice(0, 12 * 7); // 12주 분량의 일일 데이터
            } else {
                filteredRecords = records.slice(0, 12 * 30); // 12개월 분량의 일일 데이터
            }
            
            // 날짜순으로 다시 정렬 (오름차순)
            const sortedRecords = Array.from(filteredRecords).sort((a, b) => {
                const dateA = new Date(a.get('Date') as string);
                const dateB = new Date(b.get('Date') as string);
                return dateA.getTime() - dateB.getTime();
            });
            
            // 주간/월간으로 그룹화하여 집계
            if (periodType === '주간') {
                const weeklyData: Array<{
                    date: string;
                    seoScore: number;
                    searchInflow: number;
                    conversionRate: number;
                }> = [];
                const groupedByWeek: Record<string, {
                    seoScore: number;
                    searchInflow: number;
                    conversionRate: number;
                    count: number;
                }> = {};
                
                sortedRecords.forEach(record => {
                    const date = record.get('Date');
                    if (date && typeof date === 'string') {
                        const dateStr = new Date(date).toISOString().split('T')[0];
                        const weekStart = new Date(dateStr);
                        const dayOfWeek = weekStart.getDay();
                        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        weekStart.setDate(weekStart.getDate() - daysToMonday);
                        const weekKey = weekStart.toISOString().split('T')[0];
                        
                        if (!groupedByWeek[weekKey]) {
                            groupedByWeek[weekKey] = {
                                seoScore: 0,
                                searchInflow: 0,
                                conversionRate: 0,
                                count: 0
                            };
                        }
                        
                        groupedByWeek[weekKey].seoScore += (record.get('SEO Score') as number) || 0;
                        groupedByWeek[weekKey].searchInflow += (record.get('Search Inflow') as number) || 0;
                        groupedByWeek[weekKey].conversionRate += (record.get('Conversion Rate') as number) || 0;
                        groupedByWeek[weekKey].count += 1;
                    }
                });
                
                Object.keys(groupedByWeek).sort().slice(-12).forEach(weekKey => {
                    const week = groupedByWeek[weekKey];
                    weeklyData.push({
                        date: weekKey,
                        seoScore: Math.round(week.seoScore / week.count),
                        searchInflow: week.searchInflow,
                        conversionRate: Math.round((week.conversionRate / week.count) * 100) / 100
                    });
                });
                
                return weeklyData;
            } else { // 월간
                const monthlyData: Array<{
                    date: string;
                    seoScore: number;
                    searchInflow: number;
                    conversionRate: number;
                }> = [];
                const groupedByMonth: Record<string, {
                    seoScore: number;
                    searchInflow: number;
                    conversionRate: number;
                    count: number;
                }> = {};
                
                sortedRecords.forEach(record => {
                    const date = record.get('Date');
                    if (date && typeof date === 'string') {
                        const dateStr = new Date(date).toISOString().split('T')[0];
                        const monthStart = new Date(dateStr);
                        monthStart.setDate(1);
                        const monthKey = monthStart.toISOString().split('T')[0];
                        
                        if (!groupedByMonth[monthKey]) {
                            groupedByMonth[monthKey] = {
                                seoScore: 0,
                                searchInflow: 0,
                                conversionRate: 0,
                                count: 0
                            };
                        }
                        
                        groupedByMonth[monthKey].seoScore += (record.get('SEO Score') as number) || 0;
                        groupedByMonth[monthKey].searchInflow += (record.get('Search Inflow') as number) || 0;
                        groupedByMonth[monthKey].conversionRate += (record.get('Conversion Rate') as number) || 0;
                        groupedByMonth[monthKey].count += 1;
                    }
                });
                
                Object.keys(groupedByMonth).sort().slice(-12).forEach(monthKey => {
                    const month = groupedByMonth[monthKey];
                    monthlyData.push({
                        date: monthKey,
                        seoScore: Math.round(month.seoScore / month.count),
                        searchInflow: month.searchInflow,
                        conversionRate: Math.round((month.conversionRate / month.count) * 100) / 100
                    });
                });
                
                return monthlyData;
            }
        } catch (error) {
            console.error('홈페이지 차트 데이터 조회 실패:', error);
            return [];
        }
    }

    // ===== 신규 네이버 플레이스 채널 함수들 =====

    static async getPlaceRankings(): Promise<PlaceRanking[]> {
        try {
            const records = await base('Place Ranking').select({
                sort: [{ field: 'Week', direction: 'desc' }]
            }).all();
            return records.map(r => r.fields as PlaceRanking);
        } catch (error) {
            console.error('플레이스 랭킹 조회 실패:', error);
            return [];
        }
    }

    static async getPlaceDetails(): Promise<PlaceDetail[]> {
        try {
            const records = await base('Place Detail').select({
                sort: [{ field: 'Week', direction: 'desc' }]
            }).all();
            return records.map(r => r.fields as PlaceDetail);
        } catch (error) {
            console.error('플레이스 상세 데이터 조회 실패:', error);
            return [];
        }
    }

    static async getPlaceReviews(page: number = 1, pageSize: number = 10): Promise<{ reviews: PlaceReview[], total: number }> {
        try {
            let allReviews: PlaceReview[] = [];
            await base('Place Review').select({
                sort: [{ field: 'AuthorAt', direction: 'desc' }]
            }).eachPage((records, fetchNextPage) => {
                allReviews.push(...records.map(r => {
                    const fields = r.fields;
                    return { 
                        id: r.id, 
                        ReviewId: fields['ReviewId'] as string,
                        Score: fields['Score'] as number,
                        Content: fields['Content'] as string,
                        ChannelId: fields['ChannelId'] as string,
                        AuthorAt: fields['AuthorAt'] as string,
                        Reply: fields['Reply'] as string,
                        Category: fields['Category'] as string,
                        'Report Status': fields['Report Status'] as any,
                        'Reply Status': fields['Reply Status'] as any,
                    } as PlaceReview;
                }));
                fetchNextPage();
            });

            const total = allReviews.length;
            const paginatedReviews = allReviews.slice((page - 1) * pageSize, page * pageSize);
            
            return { reviews: paginatedReviews, total };
        } catch (error) {
            console.error('플레이스 리뷰 조회 실패:', error);
            return { reviews: [], total: 0 };
        }
    }

    static async getPlaceReviewWords(): Promise<PlaceReviewWord[]> {
        try {
            const records = await base('Place Review Word').select({
                sort: [{ field: 'Count', direction: 'desc' }],
                maxRecords: 50
            }).all();
            return records.map(r => r.fields as PlaceReviewWord);
        } catch (error) {
            console.error('플레이스 리뷰 워드 클라우드 조회 실패:', error);
            return [];
        }
    }

    static async getPlaceReviewReports(): Promise<PlaceReviewReport[]> {
        try {
            const records = await base('Place Review Report').select().all();
            return records.map(r => {
                const fields = r.fields as any; // Allow access to raw field names
                return {
                    id: r.id,
                    title: fields['Title'], // Assuming 'Title' might exist from review
                    link: fields['Link'],
                    author: fields['Author'],
                    date: fields['Date'],
                    content: fields['content'], // Airtable might return lowercase
                    cafeName: fields['Channel ID'], // Or whatever the source field is
                    
                    textAnalysis: fields['Text Analysis'],
                    metaAnalysis: fields['Meta Analysis'],
                    authorAnalysis: fields['Author Analysis'],
                    recommendation: fields['Recommendation'],
                } as PlaceReviewReport;
            });
        } catch (error) {
            console.error('플레이스 리뷰 리포트 조회 실패:', error);
            return [];
        }
    }
}

export default AirtableService;
