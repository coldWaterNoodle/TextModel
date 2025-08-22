import Airtable from 'airtable';
import { promises as fsPromises, createReadStream } from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { Readable } from 'stream';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
config({ path: path.join(__dirname, '..', '.env') });


// Airtable 설정
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable API 키와 Base ID가 필요합니다.');
    process.exit(1);
}

const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
};
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);


// 데이터 파일 경로
const DATA_DIR = path.resolve(__dirname, '../data/place');
const RANKING_KEYWORDS = ['동탄 치과', '동탄역 치과', '동탄 임플란트', '동탄 신경치료 치과'];
const STATS_CSV_PATH = path.join(__dirname, '..', '..', 'blog_automation', 'place_stat_crawler', 'data', 'processed', 'NATENCLINIC', 'NATENCLINIC_2025_07_integrated_statistics.csv');
console.log('Trying to read CSV from:', STATS_CSV_PATH); // 경로 확인용 로그
const REVIEW_CSV_PATH = path.resolve(DATA_DIR, 'natenclinic_review.csv');
const REVIEW_REPLY_CSV_PATH = path.resolve(DATA_DIR, 'natenclinic_review_reply.csv');

// 테이블 스키마 정의
const tableSchemas = [
    {
        name: 'Place Ranking',
        fields: [
            { name: 'Keyword', type: 'singleLineText' },
            { name: 'Week', type: 'date', options: { dateFormat: { name: 'iso' } } },
            { name: 'Rank', type: 'number', options: { precision: 0 } },
        ]
    },
    {
        name: 'Place Detail',
        fields: [
            { name: 'Week', type: 'date', options: { dateFormat: { name: 'iso' } } },
            { name: 'TotalPV', type: 'number', options: { precision: 0 } },
        ]
    },
    {
        name: 'Place Review',
        fields: [
            { name: 'ReviewId', type: 'singleLineText' },
            { name: 'Score', type: 'number', options: { precision: 1 } },
            { name: 'Content', type: 'multilineText' },
            { name: 'ChannelId', type: 'singleLineText' },
            { name: 'AuthorAt', type: 'dateTime', options: { timeZone: 'Asia/Seoul', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
            { name: 'Reply', type: 'multilineText' },
        ]
    },
    {
        name: 'Place Review Word',
        fields: [
            { name: 'Word', type: 'singleLineText' },
            { name: 'Count', type: 'number', options: { precision: 0 } },
        ]
    }
];

/**
 * 테이블 생성
 */
async function createTable(tableName, fields) {
    try {
        console.log(`✨ 테이블 "${tableName}" 생성 중...`);
        
        const createResponse = await fetch(METADATA_API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ name: tableName, fields: fields }),
        });
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            if (errorText.includes('already exists')) {
                console.log(`⚠️ 테이블 "${tableName}"이 이미 존재합니다.`);
                return base.table(tableName);
            } else {
                throw new Error(`Failed to create table "${tableName}": ${errorText}`);
            }
        }
        
        console.log(`✅ 테이블 "${tableName}" 생성 완료`);
        return base.table(tableName);
    } catch (error) {
        console.error(`❌ 테이블 "${tableName}" 생성 실패:`, error.message);
        throw error;
    }
}

/**
 * 데이터 일괄 삭제
 */
async function clearTable(tableName) {
    console.log(`Clearing data from ${tableName}...`);
    try {
        const records = await base(tableName).select().all();
        const recordIds = records.map(record => record.id);
        for (let i = 0; i < recordIds.length; i += 10) {
            const batch = recordIds.slice(i, i + 10);
            await base(tableName).destroy(batch);
        }
        console.log(`Successfully cleared ${recordIds.length} records from ${tableName}.`);
    } catch (error) {
        if (error.message.includes('NOT_FOUND')) {
          console.log(`Table ${tableName} not found, skipping clearing.`);
        } else {
          console.error(`Error clearing table ${tableName}:`, error);
        }
    }
}

/**
 * 데이터 일괄 생성
 */
async function batchCreate(tableName, recordsData) {
  console.log(`Creating ${recordsData.length} records in ${tableName}...`);
  for (let i = 0; i < recordsData.length; i += 10) {
    const batch = recordsData.slice(i, i + 10).map(record => ({ fields: record }));
    try {
      await base(tableName).create(batch);
    } catch (error) {
      console.error(`Error creating batch for ${tableName}:`, error);
      console.error('Failed batch:', JSON.stringify(batch, null, 2));
    }
  }
  console.log(`Successfully created ${recordsData.length} records in ${tableName}.`);
}

// 1. Place Ranking 데이터 생성 (주석 처리)
/*
async function setupPlaceRanking() {
    const tableName = 'Place Ranking';
    const records = [];
    const today = new Date();
  
    for (let i = 0; i < 12; i++) { // 12주치 데이터 생성
        const week = new Date(today);
        week.setDate(today.getDate() - (i * 7));
        const weekString = week.toISOString().slice(0, 10);

        for (const keyword of RANKING_KEYWORDS) {
            let min, max;
            if (keyword === '동탄 치과') { [min, max] = [20, 25]; }
            else if (keyword === '동탄역 치과') { [min, max] = [7, 10]; }
            else if (keyword === '동탄 임플란트') { [min, max] = [15, 20]; }
            else { [min, max] = [5, 8]; }
            
            const rank = Math.floor(Math.random() * (max - min + 1)) + min;
            
            records.push({
                'Keyword': keyword,
                'Week': weekString,
                'Rank': rank,
            });
        }
    }
    await clearTable(tableName);
    await batchCreate(tableName, records);
}
*/

// 2. Place Detail 데이터 생성 (활성 상태 유지)
async function setupPlaceDetail() {
    const tableName = 'Place Detail';
    const dailyData = {};

    try {
        const fileContent = await fsPromises.readFile(STATS_CSV_PATH, 'utf-8');
        
        const results = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
        });

        for (const row of results.data) {
            const date = row.date;
            if (date) {
                if (!dailyData[date]) {
                    dailyData[date] = { date: date, total_pv: 0 };
                }
                dailyData[date].total_pv += parseFloat(row.pv) || 0;
            }
        }

        console.log(`Processing ${Object.keys(dailyData).length} days of data for Place Detail.`);
        const uniqueDailyData = Object.values(dailyData);
        const weeklyData = {};

        uniqueDailyData.forEach(row => {
            const date = new Date(row.date);
            const year = date.getFullYear();
            const week = getWeekNumber(date);
            const weekKey = `${year}-W${week}`;

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    'Week': getStartDateOfWeek(year, week),
                    'TotalPV': 0,
                };
            }
            weeklyData[weekKey]['TotalPV'] += row.total_pv;
        });
        
        const records = Object.values(weeklyData).map(week => ({
            ...week,
            TotalPV: Math.round(week.TotalPV)
        })).sort((a, b) => new Date(a.Week) - new Date(b.Week));
        
        console.log(`Creating ${records.length} weekly records for Place Detail.`);

        await clearTable(tableName);
        await batchCreate(tableName, records);
        
    } catch (error) {
        console.error(`Error processing Place Detail:`, error);
    }
}

// 3. Place Review 데이터 생성 (주석 처리)
/*
async function setupPlaceReviews() {
    const tableName = 'Place Review';
    const replies = {};
    const reviews = [];

    await new Promise((resolve, reject) => {
        createReadStream(REVIEW_REPLY_CSV_PATH).pipe(csv())
            .on('data', (row) => { replies[row.id] = row.reply; })
            .on('end', resolve).on('error', reject);
    });

    await new Promise((resolve, reject) => {
        createReadStream(REVIEW_CSV_PATH).pipe(csv())
            .on('data', (row) => {
                reviews.push({
                    'ReviewId': row.id,
                    'Score': parseFloat(row.score),
                    'Content': row.content,
                    'ChannelId': row.channel_id,
                    'AuthorAt': row.author_at,
                    'Reply': replies[row.post_reply_id] || null,
                });
            })
            .on('end', resolve).on('error', reject);
    });
    
    await clearTable(tableName);
    await batchCreate(tableName, reviews);
    
    await setupWordCloud(reviews);
}
*/

// 4. 워드 클라우드 데이터 생성 (setupPlaceReviews 내부에서 호출되므로 별도 주석 불필요)
/*
async function setupWordCloud(reviews) {
    const tableName = 'Place Review Word';
    const wordCount = {};
    reviews.forEach(review => {
        if (review.Content) {
            const words = review.Content.split(/\s+/);
            words.forEach(word => {
                const cleanedWord = word.replace(/[.,!?]/g, '').toLowerCase();
                if (cleanedWord.length > 1) {
                    wordCount[cleanedWord] = (wordCount[cleanedWord] || 0) + 1;
                }
            });
        }
    });

    const records = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 50)
        .map(([word, count]) => ({ 'Word': word, 'Count': count }));
    
    await clearTable(tableName);
    await batchCreate(tableName, records);
}
*/

// Helper functions
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getStartDateOfWeek(year, week) {
    const d = new Date(year, 0, 1 + (week - 1) * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}


async function main() {
    console.log('🚀 네이버 플레이스 채널 데이터 설정을 시작합니다... (Place Detail만 진행)\n');
    
    try {
        // 1. 테이블 생성 (Place Detail만)
        const placeDetailSchema = tableSchemas.find(s => s.name === 'Place Detail');
        if (placeDetailSchema) {
            await createTable(placeDetailSchema.name, placeDetailSchema.fields);
        }
        console.log('\n📋 Place Detail 테이블 준비 완료\n');
        
        // 2. 데이터 삽입 (Place Detail만)
        // await setupPlaceRanking(); // 주석 처리
        await setupPlaceDetail();
        // await setupPlaceReviews(); // 주석 처리
        
        console.log('\n🎉 네이버 플레이스 채널 데이터 설정이 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 설정 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

main().catch(console.error);
