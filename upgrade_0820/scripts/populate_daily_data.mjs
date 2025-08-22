import Airtable from 'airtable';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// --- Configuration ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { NEXT_PUBLIC_AIRTABLE_API_KEY: AIRTABLE_API_KEY, NEXT_PUBLIC_AIRTABLE_BASE_ID: AIRTABLE_BASE_ID } = process.env;
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing env variables');
  process.exit(1);
}
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const TABLE_NAME = '[Demo] Funnel Daily Data';

// --- Main ---
async function main() {
  console.log(`🚀 Populating daily data into "${TABLE_NAME}"...`);

  // 1. Clear existing data
  const existingRecords = await base(TABLE_NAME).select({ fields: [] }).all();
  if (existingRecords.length > 0) {
    const ids = existingRecords.map(r => r.id);
    for (let i = 0; i < ids.length; i += 10) {
      await base(TABLE_NAME).destroy(ids.slice(i, i + 10));
    }
    console.log(`- Cleared ${ids.length} old records.`);
  }

  // 2. Generate virtual daily data
  const startDate = new Date('2024-08-01');
  const endDate = new Date('2025-08-20');
  const recordsToCreate = [];

  const funnelDataPath = path.resolve(process.cwd(), '../blog_automation/demo/data/service/funnel_monthly.json');
  const monthlyData = JSON.parse(await fs.readFile(funnelDataPath, 'utf-8'));
  
  const allKeys = new Set();
  monthlyData.forEach(record => Object.keys(record).forEach(key => allKeys.add(key)));
  
  const monthlyAverage = {};
  const keys = Array.from(allKeys).filter(k => k !== 'month');
  
  keys.forEach(key => {
    monthlyAverage[key] = monthlyData.reduce((sum, d) => sum + (d[key] || 0), 0) / monthlyData.length;
  });
  
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split('T')[0];
    
    // 신경치료 data
    const neuroData = { Date: dateString, '진료과목': '신경치료' };
    keys.forEach(key => {
        neuroData[key] = Math.round(monthlyAverage[key] / 30 * (0.8 + Math.random() * 0.4));
    });
    neuroData['map_rank'] = Math.floor(Math.random() * 3) + 1;
    recordsToCreate.push({ fields: neuroData });

    // 임플란트 data
    const implantData = { Date: dateString, '진료과목': '임플란트' };
    keys.forEach(key => {
        implantData[key] = Math.round(monthlyAverage[key] / 30 * 0.2 * (0.8 + Math.random() * 0.4));
    });
    implantData['map_rank'] = Math.floor(Math.random() * 6) + 19;
    recordsToCreate.push({ fields: implantData });
  }

  // 3. Insert data into Airtable
  console.log(`- Generated ${recordsToCreate.length} daily records. Inserting...`);
  for (let i = 0; i < recordsToCreate.length; i += 10) {
    const chunk = recordsToCreate.slice(i, i + 10);
    await base(TABLE_NAME).create(chunk);
  }

  console.log('\n🎉 Daily data population completed!');
}

main().catch(error => {
  console.error('\n❌ An error occurred:', error);
  process.exit(1);
});
