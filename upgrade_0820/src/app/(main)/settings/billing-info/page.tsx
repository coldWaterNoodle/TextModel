'use client';

import React, { useEffect, useState } from 'react';

type BillingForm = {
    plan: string;
    nextBillingDate: string; // YYYY-MM-DD
    usagePercent: number;
    paymentLast4?: string;
    paymentExpiry?: string; // MM/YY
};

export default function BillingInfoPage() {
    const [form, setForm] = useState<BillingForm>({ plan: '', nextBillingDate: '', usagePercent: 0, paymentLast4: '', paymentExpiry: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/settings/billing');
                const data = await res.json();
                if (data?.nextBillingDate) {
                    // ISO -> YYYY-MM-DD
                    const d = new Date(data.nextBillingDate);
                    data.nextBillingDate = isNaN(d.getTime()) ? data.nextBillingDate : d.toISOString().slice(0,10);
                }
                setForm(prev => ({ ...prev, ...data }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === 'usagePercent' ? Number(value) : value }));
    };

    const onSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = { ...form };
            const res = await fetch('/api/settings/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('save failed');
            setMessage('저장되었습니다.');
        } catch (e) {
            console.error(e);
            setMessage('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">결제 정보</h1>
                    <p className="text-gray-600">구독 및 결제 정보를 관리합니다.</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    {loading ? (
                        <div className="text-gray-500">로딩 중...</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">플랜</label>
                                    <select name="plan" value={form.plan} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">선택</option>
                                        <option value="베이직">베이직</option>
                                        <option value="프로">프로</option>
                                        <option value="엔터프라이즈">엔터프라이즈</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">다음 결제일</label>
                                    <input name="nextBillingDate" value={form.nextBillingDate} onChange={onChange} type="date" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">사용량(%)</label>
                                    <input name="usagePercent" value={form.usagePercent} onChange={onChange} type="number" min={0} max={100} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">카드 끝 4자리</label>
                                    <input name="paymentLast4" value={form.paymentLast4 || ''} onChange={onChange} type="text" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">카드 만료(MM/YY)</label>
                                    <input name="paymentExpiry" value={form.paymentExpiry || ''} onChange={onChange} type="text" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="flex justify-end items-center gap-3">
                                {message && <span className="text-sm text-gray-600">{message}</span>}
                                <button onClick={onSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


