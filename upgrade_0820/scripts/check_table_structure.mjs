import Airtable from 'airtable';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

const META_URL = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
const HEADERS = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

(async () => {
  try {
    const listRes = await fetch(META_URL, { headers: HEADERS });
    if (!listRes.ok) throw new Error(`Airtable 테이블 목록 조회 실패: ${await listRes.text()}`);
    const list = await listRes.json();

    const homepageTable = list.tables.find(t => t.name === 'Demo Homepage Combined Data');
    if (homepageTable) {
      console.log('Demo Homepage Combined Data 테이블 구조:');
      console.log(JSON.stringify(homepageTable.fields, null, 2));
    } else {
      console.log('Demo Homepage Combined Data 테이블을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('오류 발생:', error);
  }
})();
