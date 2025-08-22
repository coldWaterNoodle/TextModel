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
if (!API_KEY || !BASE_ID) {
  console.error('Airtable API 키와 Base ID가 필요합니다.');
  process.exit(1);
}

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

const DATA_DIR = join(__dirname, '..', '..', 'blog_automation', 'cafe_analysis', 'data', 'historical_processed');

function monthToNum(ym) {
  const [y, m] = ym.split('-').map(Number);
  return y * 100 + m;
}

function* iterJsonFiles(startYm = '2024-07', endYm = '2025-07') {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_analyzed.json'));
  // 2024-07 ~ 2025-07 범위에서 startYm 이상만 처리
  const START = monthToNum(startYm);
  const END = monthToNum(endYm);
  const sorted = files.slice().sort();
  for (const f of sorted) {
    const ym = f.slice(0, 7); // YYYY-MM
    const val = monthToNum(ym);
    const inRange = val >= START && val <= END;
    if (!inRange) continue;
    yield join(DATA_DIR, f);
  }
}

function shiftMonth(dateStr) {
  // 입력 예: '2024.06.30' 또는 '2024.06.30.'
  const clean = dateStr.replace(/\.$/, '');
  const [Y, M, D] = clean.split('.').map(s => s.trim()).map(Number);
  const dt = new Date(Date.UTC(Y, M - 1, D));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  const iso = dt.toISOString().slice(0, 10);
  return iso; // YYYY-MM-DD
}

function distributeWeekly(totalViews, startISO) {
  let remaining = Math.max(0, Math.floor(totalViews || 0));
  const weekViews = [];
  for (let i = 1; i <= 4; i++) {
    const v = Math.floor(remaining / 2);
    weekViews.push(v);
    remaining -= v;
  }
  weekViews.push(remaining);
  // 주 시작일 계산
  const starts = [];
  const baseDate = new Date(startISO + 'T00:00:00Z');
  for (let i = 0; i < 5; i++) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() + i * 7);
    starts.push(d.toISOString().slice(0, 10));
  }
  return weekViews.map((v, i) => ({ index: i + 1, start: starts[i], views: v }));
}

async function upsertCafePost(rec) {
  const key = `${rec.club_id}-${rec.article_id}`;
  const dateISO = shiftMonth(rec.date);
  const commentsCount = Array.isArray(rec.comments) ? rec.comments.length : 0;
  const mentioned = Array.isArray(rec.analysis?.mentioned_clinics) ? rec.analysis.mentioned_clinics.join(',') : '';
  const treatments = Array.isArray(rec.analysis?.related_treatments) ? rec.analysis.related_treatments.join(',') : '';
  // 감성: clinic_sentiments의 가장 부정/긍정 우선 규칙(간단화: 부정 있으면 부정, 아니면 긍정 있으면 긍정, 아니면 중립)
  const sentiments = Array.isArray(rec.analysis?.clinic_sentiments) ? rec.analysis.clinic_sentiments.map(s => s.sentiment) : [];
  let sentiment = '중립';
  if (sentiments.includes('부정')) sentiment = '부정'; else if (sentiments.includes('긍정')) sentiment = '긍정';

  // 기존 레코드 조회
  const existing = await base('Cafe Posts').select({ filterByFormula: `{Post Key} = '${key}'`, maxRecords: 1 }).all();
  const fields = {
    'Post Key': key,
    'Club ID': rec.club_id,
    'Article ID': rec.article_id,
    'Cafe Name': rec.cafe_name || '',
    'Title': rec.title || '',
    'Author': rec.author || '',
    'Date': dateISO,
    'Views': rec.views || 0,
    'Comments Count': commentsCount,
    'Mentioned Clinics': mentioned,
    'Related Treatments': treatments,
    'Sentiment': sentiment,
    'Link': rec.link || '',
  };
  if (existing.length === 0) {
    await base('Cafe Posts').create(fields);
  } else {
    await base('Cafe Posts').update(existing[0].id, fields);
  }

  // 주간 조회수 분배 저장
  const weeks = distributeWeekly(rec.views || 0, dateISO);
  // 기존 주간 레코드 삭제 후 재작성(간단성)
  const existingWeekly = await base('Cafe Weekly Views').select({ filterByFormula: `{Post Key} = '${key}'` }).all();
  if (existingWeekly.length > 0) {
    const ids = existingWeekly.map(r => r.id);
    for (let i = 0; i < ids.length; i += 10) await base('Cafe Weekly Views').destroy(ids.slice(i, i + 10));
  }
  const rows = weeks.map(w => ({ fields: { 'Post Key': key, 'Week Index': w.index, 'Week Start': w.start, 'Views': w.views } }));
  for (let i = 0; i < rows.length; i += 10) await base('Cafe Weekly Views').create(rows.slice(i, i + 10));
}

async function main() {
  const startArg = process.argv[2] || '2024-07';
  const endArg = process.argv[3] || '2025-07';
  console.log(`🚀 Import cafe processed data (shift month + weekly views) range: ${startArg} ~ ${endArg}`);
  let total = 0;
  for (const filePath of iterJsonFiles(startArg, endArg)) {
    const arr = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const rec of arr) {
      await upsertCafePost(rec);
      total += 1;
    }
  }
  console.log(`✅ Done. Upserted ${total} posts with weekly views.`);
}

main().catch(err => { console.error(err); process.exit(1); });


