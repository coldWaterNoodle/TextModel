import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// --- Configuration ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env file.');
  process.exit(1);
}

const METADATA_API_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
const HEADERS = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

const SUBJECT_FIELD_SCHEMA = {
  name: '진료과목',
  type: 'singleSelect',
  options: {
    choices: [
      { name: '공통' },
      { name: '임플란트' },
      { name: '신경치료' },
      { name: '충치치료' },
      { name: '심미치료' },
    ],
  },
};

const TABLES_TO_UPDATE = [
    '[Demo] KPI Metrics',
    '[Demo] Competitor Stats',
    '[Demo] Funnel Monthly Data'
];

async function main() {
    console.log('🚀 Starting Airtable schema update...');

    // 1. Get existing tables to find their IDs
    const response = await fetch(METADATA_API_URL, { headers: HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch tables: ${await response.text()}`);
    const { tables } = await response.json();

    for (const tableName of TABLES_TO_UPDATE) {
        const table = tables.find(t => t.name === tableName);
        if (!table) {
            console.warn(`- Table "${tableName}" not found. Skipping.`);
            continue;
        }

        const existingField = table.fields.find(f => f.name === '진료과목');
        if (existingField) {
            console.log(`- Field "진료과목" already exists in "${tableName}". Skipping.`);
            continue;
        }

        console.log(`✨ Adding field "진료과목" to "${tableName}"...`);
        const createFieldResponse = await fetch(`${METADATA_API_URL}/${table.id}/fields`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(SUBJECT_FIELD_SCHEMA),
        });

        if (!createFieldResponse.ok) {
            throw new Error(`Failed to add field to "${tableName}": ${await createFieldResponse.text()}`);
        }
        console.log(`✅ Field added successfully to "${tableName}".`);
    }
    
    console.log('\n🎉 Airtable schema update completed successfully!');
}

main().catch(error => {
    console.error('\n❌ An error occurred during schema update:');
    console.error(error);
    process.exit(1);
});
