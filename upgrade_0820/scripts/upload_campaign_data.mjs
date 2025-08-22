import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

// 먼저 캠페인 생성
const campaignData = {
  fields: {
    'Name': '2025년 8월 임플란트 캠페인',
    'Period Start': '2025-08-11',
    'Period End': '2025-08-13',
    'Subject Cluster': '임플란트',
    'Target Inflow': 300
  }
};

// 캠페인 타겟 데이터
const targetsData = [
  {
    publishDate: '2025-08-11',
    postTitle: '임플란트 과정 A to Z: 상담부터 수술 후 관리까지',
    keywords: '임플란트 과정, 임플란트 통증',
    achieved: 95,
    target: 80,
    rank: 3,
    seo: 95,
    postType: '유입'
  },
  {
    publishDate: '2025-08-13',
    postTitle: '네비게이션 임플란트 vs 일반 임플란트, 차이점과 장점은?',
    keywords: '네비게이션 임플란트, 디지털 임플란트',
    achieved: 80,
    target: 70,
    rank: 5,
    seo: 92,
    postType: '유입'
  },
  {
    publishDate: '2025-08-13',
    postTitle: '화성 하늘동치과의 수면 임플란트, 통증 걱정 없이 편안하게',
    keywords: '수면 임플란트, 화성 임플란트 치과',
    achieved: 55,
    target: 50,
    rank: 12,
    seo: 88,
    postType: '전환'
  },
  {
    publishDate: '2025-08-13',
    postTitle: '임플란트 건강보험 적용 기준, 2025년 최신 정보',
    keywords: '임플란트 보험, 어르신 임플란트',
    achieved: 35,
    target: 40,
    rank: 18,
    seo: 98,
    postType: '유입'
  },
  {
    publishDate: '2025-08-13',
    postTitle: '임플란트 후 식사, 언제부터 어떻게 해야 할까?',
    keywords: '임플란트 후 식사, 임플란트 관리',
    achieved: 25,
    target: 35,
    rank: 25,
    seo: 93,
    postType: '유입'
  },
  {
    publishDate: '2025-08-13',
    postTitle: '임플란트 재수술, 왜 필요할까? 잘하는 병원 선택 기준',
    keywords: '임플란트 재수술, 임플란트 부작용',
    achieved: 14,
    target: 25,
    rank: 40,
    seo: 90,
    postType: '전환'
  }
];

async function uploadData() {
  try {
    // 1. 캠페인 생성
    console.log('캠페인 생성 중...');
    const campaign = await base('Blog Campaigns').create(campaignData.fields);
    console.log('캠페인 생성 완료:', campaign.id);

    // 2. 캠페인 타겟 생성
    console.log('캠페인 타겟 생성 중...');
    const targetRecords = targetsData.map((target, index) => ({
      'Campaign ID': campaign.id,
      'Post ID': `post_${Date.now()}_${index}`,
      'Post Title': target.postTitle,
      'Post Type': target.postType,
      'Publish Date': target.publishDate,
      'Keywords': target.keywords,
      'Target Inflow': target.target,
      'Achieved Inflow': target.achieved,
      'Rank': target.rank,
      'SEO Score': target.seo,
      'Legal Status': '안전'
    }));

    for (const record of targetRecords) {
      await base('Campaign Targets').create(record);
    }
    console.log(`${targetRecords.length}개의 캠페인 타겟 생성 완료`);

    console.log('모든 데이터 업로드 완료!');
  } catch (error) {
    console.error('데이터 업로드 실패:', error);
  }
}

uploadData();
