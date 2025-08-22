'use server';

import AirtableService from '@/services/airtable';
import { CafeChartsAndTable } from './CafeChartsAndTable';

export async function CafeChartsAndTableDataWrapper() {
    // Fetch initial data for charts and table
    const [posts, hospitalSettings] = await Promise.all([
        AirtableService.getCafePosts(1000),
        AirtableService.getHospitalSettings(),
    ]);
    const hospitalName = hospitalSettings?.hospitalName || '';

    return (
        <CafeChartsAndTable
            initialPosts={posts}
            hospitalName={hospitalName}
        />
    );
}
