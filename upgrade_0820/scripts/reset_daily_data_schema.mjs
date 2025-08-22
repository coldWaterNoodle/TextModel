import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// --- Configuration ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { NEXT_PUBLIC_AIRTABLE_API_KEY: AIRTABLE_API_KEY, NEXT_PUBLIC_AIRTABLE_BASE_ID: AIRTABLE_BASE_ID } = process.env;
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing NEXT_PUBLIC_AIRTABLE_API_KEY or NEXT_PUBLIC_AIRTABLE_BASE_ID in .env file.');
  process.exit(1);
}
const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

const OLD_TABLE_NAME = '[Demo] Funnel Monthly Data';
const NEW_TABLE_NAME = '[Demo] Funnel Daily Data';

async function main() {
  console.log('🚀 Resetting Airtable schema for daily data...');

  // 1. Get existing tables
  const response = await fetch(METADATA_API_URL, { headers: HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch tables: ${await response.text()}`);
  const { tables } = await response.json();

  // 2. Delete the old monthly table if it exists
  const oldTable = tables.find(t => t.name === OLD_TABLE_NAME);
  if (oldTable) {
    console.log(`- Deleting old table: "${OLD_TABLE_NAME}"...`);
    const deleteResponse = await fetch(`${METADATA_API_URL}/${oldTable.id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    // Ignore 404 error, as it means the table is already gone.
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error(`Failed to delete table: ${await deleteResponse.text()}`);
    }
    console.log(`- Table deleted or already gone.`);
  } else {
      console.log(`- Old table "${OLD_TABLE_NAME}" not found. Skipping deletion.`);
  }

  // 3. Create the new daily table if it doesn't exist
  const newTable = tables.find(t => t.name === NEW_TABLE_NAME);
  if (newTable) {
      console.log(`- New table "${NEW_TABLE_NAME}" already exists. Skipping creation.`);
  } else {
      console.log(`✨ Creating new table: "${NEW_TABLE_NAME}"...`);
      const funnelDataPath = path.resolve(process.cwd(), '../blog_automation/demo/data/service/funnel_monthly.json');
      const funnelDataSample = JSON.parse(await fs.readFile(funnelDataPath, 'utf-8'))[0];
      
      const allKeys = new Set(Object.keys(funnelDataSample));
      // Ensure all potential keys from the full dataset are included for robustness
      const funnelData = JSON.parse(await fs.readFile(funnelDataPath, 'utf-8'));
      funnelData.forEach(record => Object.keys(record).forEach(key => allKeys.add(key)));

      const dailyFields = Array.from(allKeys).map(key => {
        const fieldSpec = {
          name: key === 'month' ? 'Date' : key,
          type: key === 'month' ? 'date' : 'number',
          options: key === 'month' ? { dateFormat: { name: 'iso' } } : { precision: 0 }
        };
        if (key === '진료과목') {
            fieldSpec.type = 'singleSelect';
            fieldSpec.options = { choices: [{ name: '임플란트' }, { name: '신경치료' }] };
        }
        return fieldSpec;
      });
      
      // Add '진료과목' if it wasn't in the sample
      if (!allKeys.has('진료과목')) {
        dailyFields.push({ name: '진료과목', type: 'singleSelect', options: { choices: [{ name: '임플란트' }, { name: '신경치료' }] } });
      }

      const createResponse = await fetch(METADATA_API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ name: NEW_TABLE_NAME, fields: dailyFields }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create table: ${await createResponse.text()}`);
      }
      console.log(`✅ New table "${NEW_TABLE_NAME}" created successfully.`);
  }

  console.log('\n🎉 Schema reset completed!');
}

main().catch(error => {
  console.error('\n❌ An error occurred:', error);
  process.exit(1);
});
