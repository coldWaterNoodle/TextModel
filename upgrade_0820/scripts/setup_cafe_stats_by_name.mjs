import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Airtable from 'airtable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

const tables = [
    {
        name: 'Cafe Stats By Name Weekly',
        description: '카페별 주간 통계 (병원별, 주제별)',
        fields: [
            { name: 'Stats Key', type: 'singleLineText', description: 'Hospital-WeekStart-Subject-CafeName 조합 키' },
            { name: 'Hospital Name', type: 'singleLineText' },
            { name: 'Cafe Name', type: 'singleLineText' },
            { name: 'Week Start', type: 'date', options: { dateFormat: { name: 'iso' } } },
            { name: 'Subject', type: 'singleLineText', description: '전체/임플란트/신경치료' },
            { name: 'Total Views', type: 'number', options: { precision: 0 } },
            { name: 'Post Count', type: 'number', options: { precision: 0 } },
            { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } }
        ]
    },
    {
        name: 'Cafe Stats By Name Monthly',
        description: '카페별 월간 통계 (병원별, 주제별)',
        fields: [
            { name: 'Stats Key', type: 'singleLineText', description: 'Hospital-Month-Subject-CafeName 조합 키' },
            { name: 'Hospital Name', type: 'singleLineText' },
            { name: 'Cafe Name', type: 'singleLineText' },
            { name: 'Month', type: 'singleLineText', description: 'YYYY-MM 형식' },
            { name: 'Subject', type: 'singleLineText', description: '전체/임플란트/신경치료' },
            { name: 'Total Views', type: 'number', options: { precision: 0 } },
            { name: 'Post Count', type: 'number', options: { precision: 0 } },
            { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } }
        ]
    }
];

async function createTable(tableConfig) {
    const { name, description, fields } = tableConfig;
    
    console.log(`Creating table: ${name}`);
    
    try {
        const response = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                fields
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`Failed to create table ${name}:`, error);
            return false;
        }

        const result = await response.json();
        console.log(`✓ Table ${name} created successfully`);
        return true;
    } catch (error) {
        console.error(`Error creating table ${name}:`, error);
        return false;
    }
}

async function main() {
    console.log('Starting Airtable table creation for Cafe Stats by Name...');
    
    for (const table of tables) {
        await createTable(table);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Table creation completed!');
}

main().catch(console.error);
