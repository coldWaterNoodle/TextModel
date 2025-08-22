import Airtable from 'airtable';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
if (!API_KEY || !BASE_ID) { console.error('Airtable env missing'); process.exit(1); }
const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

const CSV_PATH = join(__dirname, '..', '..', 'blog_automation', 'data', 'archive', 'Blog Posts.csv');
const POST_SEARCH_CSV = join(__dirname, '..', '..', 'blog_automation', 'data', 'data_input', 'post-searchQuery.csv');

function parseCSV(path) {
  const text = fs.readFileSync(path, 'utf-8').trim();
  const [header, ...rows] = text.split(/\r?\n/);
  const cols = header.split(',');
  return rows.map(line => {
    const tokens = line.split(',');
    // postId는 첫 토큰
    const postId = tokens[0];
    // URL 토큰의 인덱스 탐색
    let urlIdx = -1;
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i].startsWith('http')) { urlIdx = i; break; }
    }
    const title = tokens.slice(1, urlIdx).join(',');
    const url = tokens[urlIdx];
    const targetKeyword = tokens[urlIdx + 1];
    const subject = tokens[urlIdx + 2];
    const date = tokens[urlIdx + 3];
    const blogInflow = tokens[urlIdx + 4];
    const views = tokens[urlIdx + 5];
    const rank_high = tokens[urlIdx + 6] || '';
    const rank_low = tokens[urlIdx + 7] || '';
    return { postId, title, URL: url, targetKeyword, Subject: subject, date, blogInflow, views, rank_high, rank_low };
  });
}

function isoFromExcelOrString(v) {
  // 값이 YYYYMMDD나 Excel 일수 형태가 아니므로 임시: 이미 YYYYMMDD가 아닌 값들 → 2024-08-01 기준으로 순증가 불가
  // CSV의 date 컬럼은 정수(예: 45780). Excel serial date 기준으로 1899-12-30 offset.
  const serial = Number(v);
  if (!Number.isFinite(serial)) return '2024-08-01';
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const d = new Date(epoch.getTime() + serial * 86400000);
  return d.toISOString().slice(0, 10);
}

function weekStarts(iso) {
  const base = new Date(iso + 'T00:00:00Z');
  return [0,7,14,21].map(off => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + off);
    return d.toISOString().slice(0,10);
  });
}

function splitWeekly(total) {
  const t = Math.max(0, Math.round(Number(total)||0));
  const w1 = Math.floor(t/2);
  const w2 = Math.floor((t - w1)/2);
  const w3 = Math.floor((t - w1 - w2)/2);
  const w4 = t - w1 - w2 - w3;
  return [w1,w2,w3,w4];
}

function seededRand(min, max, seed) {
  // simple LCG
  let x = Math.imul(1664525, seed >>> 0) + 1013904223;
  x = (x >>> 0) / 2**32;
  return Math.floor(min + x * (max - min + 1));
}

async function upsertBlogPost(row) {
  const postId = row.postId;
  const title = row.title;
  const url = row.URL;
  const targetKeyword = row.targetKeyword;
  const subject = row.Subject;
  const dateISO = isoFromExcelOrString(row.date);
  const author = '내이튼치과의원';

  const ex = await base('Blog Posts').select({ filterByFormula: `{Post ID} = '${postId}'`, maxRecords: 1 }).all();
  const fields = { 'Post ID': postId, 'Title': title, 'URL': url, 'Target Keyword': targetKeyword, 'Subject': subject, 'Publish Date': dateISO, 'Author': author };
  if (ex.length === 0) await base('Blog Posts').create(fields); else await base('Blog Posts').update(ex[0].id, fields);

  // weekly metrics
  const weeks = weekStarts(dateISO);
  const viewsW = splitWeekly(row.views);
  const inflowW = splitWeekly(row.blogInflow);

  // place clicks: views/40~views/50 랜덤
  const weeklyRows = weeks.map((wStart, i) => {
    const v = viewsW[i];
    const inflow = inflowW[i];
    const seed = Number(String(postId).slice(-6)) + i;
    const pc = Math.max(0, seededRand(Math.floor(v/50), Math.max(Math.floor(v/40), Math.floor(v/50)), seed));
    const conv = Math.round(pc * 0.3);
    return { fields: { 'Week Start': wStart, 'Post ID': postId, 'Subject': subject, 'Views': v, 'Inflow': inflow, 'Place Clicks': pc, 'Conversions': conv } };
  });

  // clear existing and insert
  const exM = await base('Blog Weekly Metrics').select({ filterByFormula: `{Post ID} = '${postId}'` }).all();
  if (exM.length > 0) {
    const ids = exM.map(r => r.id);
    for (let i=0;i<ids.length;i+=10) await base('Blog Weekly Metrics').destroy(ids.slice(i,i+10));
  }
  for (let i=0;i<weeklyRows.length;i+=10) await base('Blog Weekly Metrics').create(weeklyRows.slice(i,i+10));

  // weekly rank: high->low over 4 weeks if present
  const rh = row.rank_high, rl = row.rank_low;
  const exR = await base('Blog Weekly Rankings').select({ filterByFormula: `AND({Post ID} = '${postId}', {Source} = 'Naver')` }).all();
  if (exR.length > 0) {
    const ids = exR.map(r => r.id);
    for (let i=0;i<ids.length;i+=10) await base('Blog Weekly Rankings').destroy(ids.slice(i,i+10));
  }
  if (rh && rl) {
    const start = Number(rh), end = Number(rl);
    const step = (end - start) / 3;
    for (let i=0;i<4;i++) {
      const rank = Math.round(start + step * i);
      await base('Blog Weekly Rankings').create({ 'Week Start': weeks[i], 'Keyword': targetKeyword || '', 'Hospital ID': await getClientId(), 'Post ID': postId, 'Rank': rank, 'Source': 'Naver' });
    }
  }
}

async function getClientId() {
  // Settings - Hospital 에 Client ID 필드가 있다고 가정
  try {
    const recs = await base('Settings - Hospital').select({ maxRecords: 1 }).all();
    if (recs.length === 0) return 'CLIENT';
    return recs[0].get('Client ID') || 'CLIENT';
  } catch { return 'CLIENT'; }
}

async function getBenchmarkHospitals() {
  try {
    const recs = await base('Benchmark Hospitals').select().all();
    if (recs.length === 0) return [];
    return recs.map(r => (r.get('Hospital Name') || '').toString()).filter(Boolean);
  } catch { return []; }
}

async function addCampaignSamples() {
  // 캠페인 마스터 1건 + 타깃 6건(요청 표) 업서트
  const campaignId = 'CMP-2024-IMPLANT';
  const name = '2024 임플란트 집중';
  const pStart = '2025-06-23';
  const pEnd = '2025-07-06';
  const subject = '임플란트';
  const targetInflow = 300;
  const now = new Date().toISOString();
  const ex = await base('Blog Campaigns').select({ filterByFormula: `{Campaign ID} = '${campaignId}'`, maxRecords: 1 }).all();
  const payload = { 'Campaign ID': campaignId, 'Name': name, 'Period Start': pStart, 'Period End': pEnd, 'Subject Cluster': subject, 'Target Inflow': targetInflow, 'Created At': now, 'Updated At': now };
  if (ex.length === 0) await base('Blog Campaigns').create(payload); else await base('Blog Campaigns').update(ex[0].id, payload);

  const items = [
    { date: '2025-08-11', title: '임플란트 과정 A to Z: 상담부터 수술 후 관리까지', kw: '임플란트 과정, 임플란트 통증', achieved: 95, planned: 80, rank: 3, seo: 95, legal: '안전' },
    { date: '2025-08-13', title: '네비게이션 임플란트 vs 일반 임플란트, 차이점과 장점은?', kw: '네비게이션 임플란트, 디지털 임플란트', achieved: 80, planned: 70, rank: 5, seo: 92, legal: '안전' },
    { date: '2025-08-13', title: '화성 하늘동치과의 수면 임플란트, 통증 걱정 없이 편안하게', kw: '수면 임플란트, 화성 임플란트 치과', achieved: 55, planned: 50, rank: 12, seo: 88, legal: '안전' },
    { date: '2025-08-13', title: '임플란트 건강보험 적용 기준, 2025년 최신 정보', kw: '임플란트 보험, 어르신 임플란트', achieved: 35, planned: 40, rank: 18, seo: 98, legal: '안전' },
    { date: '2025-08-13', title: '임플란트 후 식사, 언제부터 어떻게 해야 할까?', kw: '임플란트 후 식사, 임플란트 관리', achieved: 25, planned: 35, rank: 25, seo: 93, legal: '안전' },
    { date: '2025-08-13', title: '임플란트 재수술, 왜 필요할까? 잘하는 병원 선택 기준', kw: '임플란트 재수술, 임플란트 부작용', achieved: 14, planned: 25, rank: 40, seo: 90, legal: '안전' },
  ];
  // Campaign Targets 업서트: postId 매칭은 제목으로 Blog Posts 조회 → 없으면 dummy postId
  for (const it of items) {
    const recs = await base('Blog Posts').select({ filterByFormula: `{Title} = '${it.title}'`, maxRecords: 1 }).all();
    const postId = (recs[0] && recs[0].get('Post ID')) || `DUMMY-${Math.random().toString(36).slice(2,8)}`;
    const exT = await base('Campaign Targets').select({ filterByFormula: `AND({Campaign ID} = '${campaignId}', {Post ID} = '${postId}')`, maxRecords: 1 }).all();
    const fields = { 'Campaign ID': campaignId, 'Post ID': postId, 'Planned Inflow': it.planned, 'Keywords': it.kw, 'SEO Score': it.seo, 'Legal Status': it.legal };
    if (exT.length === 0) await base('Campaign Targets').create(fields); else await base('Campaign Targets').update(exT[0].id, fields);
  }
}

async function main() {
  console.log('🚀 Import Blog Posts and Weekly Metrics...');
  // 1) 테이블 보장(별도 스크립트에서 실행하는 것이 이상적이지만 안전장치로 skip)
  // 2) CSV 로드
  const rows = parseCSV(CSV_PATH);
  const clientId = await getClientId();
  const benchNames = await getBenchmarkHospitals();
  for (const row of rows) {
    // upsert 기본 + 랭킹(우리/벤치)
    const postId = row.postId;
    await upsertBlogPost(row);
    // 벤치마크 랭킹 생성: 우리 랭크 기준 주변값 or 랜덤
    const dateISO = isoFromExcelOrString(row.date);
    const weeks = weekStarts(dateISO);
    const rh = row.rank_high, rl = row.rank_low;
    let ourRanks = [];
    if (rh && rl) {
      const start = Number(rh), end = Number(rl);
      const step = (end - start) / 3;
      ourRanks = [0,1,2,3].map(i => Math.round(start + step * i));
    }
    // 먼저 해당 postId의 기존 랭킹 모두 삭제
    const exAll = await base('Blog Weekly Rankings').select({ filterByFormula: `AND({Post ID} = '${postId}', {Source} = 'Naver')` }).all();
    if (exAll.length > 0) {
      const ids = exAll.map(r => r.id);
      for (let i=0;i<ids.length;i+=10) await base('Blog Weekly Rankings').destroy(ids.slice(i,i+10));
    }
    // 우리 병원 랭킹 재생성
    if (ourRanks.length === 4) {
      for (let i=0;i<4;i++) {
        await base('Blog Weekly Rankings').create({ 'Week Start': weeks[i], 'Keyword': row.targetKeyword || '', 'Hospital ID': clientId, 'Post ID': postId, 'Rank': ourRanks[i], 'Source': 'Naver' });
      }
    }
    // 벤치마크 병원 랭킹 생성
    for (const name of benchNames) {
      for (let i=0;i<4;i++) {
        const baseRank = ourRanks[i] || 20;
        const randOffset = seededRand(1, 10, Number(String(postId).slice(-6)) + i + name.length);
        const rank = Math.max(1, baseRank + (randOffset - 5));
        await base('Blog Weekly Rankings').create({ 'Week Start': weeks[i], 'Keyword': row.targetKeyword || '', 'Hospital ID': name, 'Post ID': postId, 'Rank': rank, 'Source': 'Naver' });
      }
    }
  }
  await addCampaignSamples();
  console.log('✅ Done');
}

main().catch(e => { console.error(e); process.exit(1); });


