'use server';

import { KpiCard } from '@/components/channels/KpiCard';
import { KpiCardClientWrapper } from './KpiCardClientWrapper';

async function getCampaignStatus() {
  const res = await fetch('http://localhost:3000/api/blog/campaign/status', { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function getSearchInflow(subject: string = '전체') {
  const res = await fetch(`http://localhost:3000/api/blog/search-inflow?subject=${subject}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function getPlaceConversion(subject: string = '전체') {
  const res = await fetch(`http://localhost:3000/api/blog/place-conversion?subject=${subject}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function BlogKpiCards() {
  const [campaignStatus, searchInflow, placeConversion] = await Promise.all([
    getCampaignStatus(),
    getSearchInflow(),
    getPlaceConversion()
  ]);

  return (
    <KpiCardClientWrapper
      initialCampaignStatus={campaignStatus}
      initialSearchInflow={searchInflow}
      initialPlaceConversion={placeConversion}
    />
  );
}
