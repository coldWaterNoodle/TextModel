'use server';

import { ChartsAndCampaignsClientWrapper } from './ChartsAndCampaignsClientWrapper';

async function getChartData(periodType: string = '주간', subject: string = '전체') {
  const res = await fetch(`http://localhost:3000/api/blog/chart-data?periodType=${periodType}&subject=${subject}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

async function getActiveCampaign() {
  const res = await fetch('http://localhost:3000/api/blog/campaign/active', { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function BlogChartsAndCampaigns() {
  const [initialChartData, activeCampaign] = await Promise.all([
    getChartData(),
    getActiveCampaign()
  ]);

  return (
    <ChartsAndCampaignsClientWrapper
      initialChartData={initialChartData}
      activeCampaign={activeCampaign}
    />
  );
}
