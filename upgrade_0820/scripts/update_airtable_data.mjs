import Airtable from 'airtable';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';


// --- Configuration ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env file.');
  process.exit(1);
}
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function clearTable(tableName) {
    console.log(`- Clearing all records from "${tableName}"...`);
    const records = await base(tableName).select().all();
    if(records.length === 0) {
        console.log(`- Table "${tableName}" is already empty.`);
        return;
    }
    const recordIds = records.map(r => r.id);
    for (let i = 0; i < recordIds.length; i += 10) {
        const chunk = recordIds.slice(i, i + 10);
        await base(tableName).destroy(chunk);
    }
    console.log(`- Cleared ${recordIds.length} records.`);
}

async function main() {
    console.log('🚀 Updating Airtable data based on the new scenario...');

    const tablesToClear = ['[Demo] KPI Metrics', '[Demo] Competitor Stats', '[Demo] Funnel Monthly Data'];
    for(const table of tablesToClear) {
        await clearTable(table);
    }

    // --- 1. Populate KPI Metrics ---
    console.log('✍️ Populating new data for "[Demo] KPI Metrics"...');
    const kpiData = [
        // Strong points: 신경치료, 충치치료
        { fields: { 'Metric': '총 예약 수', 'Value': 75, 'Change': 0.08, 'Period': '지난 달 대비', '진료과목': '신경치료' } },
        { fields: { 'Metric': '총 유입량', 'Value': 5500, 'Change': 0.12, 'Period': '지난 달 대비', '진료과목': '신경치료' } },
        { fields: { 'Metric': '총 예약 수', 'Value': 50, 'Change': 0.05, 'Period': '지난 달 대비', '진료과목': '충치치료' } },
        // Weak point: 임플란트
        { fields: { 'Metric': '총 예약 수', 'Value': 15, 'Change': -0.10, 'Period': '지난 달 대비', '진료과목': '임플란트' } },
        { fields: { 'Metric': '총 유입량', 'Value': 1200, 'Change': -0.05, 'Period': '지난 달 대비', '진료과목': '임플란트' } },
        // Others
        { fields: { 'Metric': '총 예약 수', 'Value': 12, 'Change': 0.02, 'Period': '지난 달 대비', '진료과목': '심미치료' } },
        // Common metrics
        { fields: { 'Metric': '리뷰 평점', 'Value': 4.8, 'Change': 0.02, 'Period': '지난 달 대비', '진료과목': '공통' } },
        { fields: { 'Metric': '예약 전환율', 'Value': 7.8, 'Change': -0.05, 'Period': '지난 달 대비', '진료과목': '공통' } },
    ];
    await base('[Demo] KPI Metrics').create(kpiData);
    console.log('- Populated KPI data.');

    // --- 2. Populate Competitor Stats ---
    console.log('✍️ Populating new data for "[Demo] Competitor Stats"...');
    const competitorData = [
        // Our hospital
        { fields: { 'HospitalName': '우리병원', 'Metric': '리뷰 평점', 'Value': 4.8, '진료과목': '공통'} },
        { fields: { 'HospitalName': '우리병원', 'Metric': '방문자 수', 'Value': 5500, '진료과목': '신경치료'} },
        { fields: { 'HospitalName': '우리병원', 'Metric': '방문자 수', 'Value': 1200, '진료과목': '임플란트'} },
        // Competitor A (strong in implants)
        { fields: { 'HospitalName': 'A 경쟁병원', 'Metric': '리뷰 평점', 'Value': 4.7, '진료과목': '공통'} },
        { fields: { 'HospitalName': 'A 경쟁병원', 'Metric': '방문자 수', 'Value': 4000, '진료과목': '신경치료'} },
        { fields: { 'HospitalName': 'A 경쟁병원', 'Metric': '방문자 수', 'Value': 8000, '진료과목': '임플란트'} },
    ];
    await base('[Demo] Competitor Stats').create(competitorData);
    console.log('- Populated Competitor Stats data.');

    // --- 3. Populate Funnel Monthly Data ---
    console.log('✍️ Populating new data for "[Demo] Funnel Monthly Data"...');
    const funnelDataPath = path.resolve(process.cwd(), '../blog_automation/demo/data/service/funnel_monthly.json');
    const funnelData = JSON.parse(await fs.readFile(funnelDataPath, 'utf-8'));
    
    // Create categorized funnel data
    const categorizedFunnelData = [];
    funnelData.forEach(monthData => {
        const 신경치료Data = { ...monthData, '진료과목': '신경치료' };
        if (신경치료Data.month) {
            신경치료Data.Month = 신경치료Data.month;
            delete 신경치료Data.month;
        }
        categorizedFunnelData.push({ fields: 신경치료Data });

        const implantData = { ...monthData, '진료과목': '임플란트' };
        for(const key in implantData) {
            if(typeof implantData[key] === 'number') {
                implantData[key] = Math.round(implantData[key] * 0.2);
            }
        }
        if (implantData.month) {
            implantData.Month = implantData.month;
            delete implantData.month;
        }
        categorizedFunnelData.push({ fields: implantData });
    });

    for (let i = 0; i < categorizedFunnelData.length; i += 10) {
        const chunk = categorizedFunnelData.slice(i, i + 10);
        await base('[Demo] Funnel Monthly Data').create(chunk);
    }
    console.log('- Populated Funnel Monthly data.');


    console.log('\n🎉 Airtable data update completed successfully!');
}

main().catch(error => {
    console.error('\n❌ An error occurred during data update:', error);
    process.exit(1);
});
