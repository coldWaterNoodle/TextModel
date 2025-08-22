import { getFunnelDailyData, FunnelDataRecord } from '@/services/airtable';
import { FilterableData } from './FilterableData';

export async function DataAnalysisSection() {
    // Fetch initial data on the server
    const initialData = await getFunnelDailyData('전체');

    return <FilterableData initialData={initialData} />;
}
