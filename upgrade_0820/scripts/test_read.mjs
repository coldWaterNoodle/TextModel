import Airtable from 'airtable';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableId = 'tbl6yzrnxlo1FffUu'; // The table ID you provided

if (!apiKey || !baseId) {
  console.error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not set in .env file.');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

async function testTableRead() {
  console.log(`Attempting to read from Table ID: ${tableId}...`);
  try {
    const records = await base(tableId).select({
      maxRecords: 1,
      view: "Grid view" // A default view name
    }).firstPage();

    if (records.length > 0) {
      console.log('✅ Success! Found at least one record.');
      console.log('Record data:', JSON.stringify(records[0].fields, null, 2));
    } else {
      console.log('🟡 Success! Connected to the table, but it is empty.');
    }
  } catch (error) {
    console.error('❌ Failed to read from the table.');
    console.error(error);
  }
}

testTableRead();
