import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('--- Environment Variable Test ---');
if (apiKey) {
  console.log('✅ AIRTABLE_API_KEY: Loaded successfully (hidden for security)');
  console.log(`   (Value starts with: "${apiKey.substring(0, 7)}...")`);
} else {
  console.log('❌ AIRTABLE_API_KEY: Not found!');
}

if (baseId) {
  console.log('✅ AIRTABLE_BASE_ID: Loaded successfully');
  console.log(`   (Value: ${baseId})`);
} else {
  console.log('❌ AIRTABLE_BASE_ID: Not found!');
}
console.log('-------------------------------');
