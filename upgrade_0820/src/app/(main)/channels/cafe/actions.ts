'use server';

import { CafePost } from '@/services/airtable';

type KpiSubject = '전체' | '임플란트' | '신경치료';

export async function calculateCafeKpis(
    posts: CafePost[],
    hospitalName: string,
    subject: KpiSubject
) {
    if (!posts || posts.length === 0) {
        return {
            share: { value: '0%', delta: '0%' },
            views: { value: '0', delta: '0%' },
        };
    }

    const monthKey = (iso?: string) => (iso || '').slice(0, 7);
    const months = Array.from(new Set(posts.map(r => monthKey(r.date)).filter(Boolean))).sort();
    const lastM = months[months.length - 1];
    const prevM = months[months.length - 2];
    const rowsOf = (ym?: string) => (ym ? posts.filter(r => monthKey(r.date) === ym) : []);
    const sumViews = (arr: CafePost[]) => arr.reduce((s, r) => s + (r.views || 0), 0);
    const containsOur = (mc: string) => !!(mc && hospitalName && mc.includes(hospitalName));
    
    const filterBy = (arr: CafePost[]) => subject === '전체' ? arr : arr.filter(r => (r.relatedTreatments || '').includes(subject));

    // 조회수
    const rowsNowForViews = filterBy(rowsOf(lastM)).filter(r => containsOur(r.mentionedClinics));
    const rowsPrevForViews = filterBy(rowsOf(prevM)).filter(r => containsOur(r.mentionedClinics));
    const viewsNow = sumViews(rowsNowForViews);
    const viewsPrev = sumViews(rowsPrevForViews);
    const viewsDelta = viewsPrev > 0 ? Math.round(((viewsNow - viewsPrev) / viewsPrev) * 100) : 0;

    // 점유율
    const denomNow = sumViews(rowsOf(lastM));
    const denomPrev = sumViews(rowsOf(prevM));
    const numerNow = sumViews(rowsNowForViews);
    const numerPrev = sumViews(rowsPrevForViews);
    const shareNow = denomNow > 0 ? Math.round(100 * numerNow / denomNow) : 0;
    const sharePrev = denomPrev > 0 ? Math.round(100 * numerPrev / denomPrev) : 0;
    const shareDelta = shareNow - sharePrev;

    return {
        share: { value: `${shareNow}%`, delta: `${shareDelta >= 0 ? '+' : ''}${shareDelta}%` },
        views: { value: viewsNow.toLocaleString(), delta: `${viewsDelta >= 0 ? '+' : ''}${viewsDelta}%` },
    };
}
