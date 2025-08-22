'use client';

import React, { useEffect, useState } from 'react';

export default function BenchmarkHospitalsPage() {
    const [benchmarks, setBenchmarks] = useState<string[]>(['', '', '']);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/settings/benchmark');
                const data = await res.json();
                const arr = Array.isArray(data?.benchmarkHospitals) ? data.benchmarkHospitals : [];
                const merged = [arr[0] || '', arr[1] || '', arr[2] || ''];
                setBenchmarks(merged);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onChange = (idx: number, value: string) => {
        setBenchmarks(prev => prev.map((v, i) => (i === idx ? value : v)));
    };

    const onSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings/benchmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ benchmarkHospitals: benchmarks.filter(Boolean) }),
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
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">벤치마크 병원</h1>
                <p className="text-gray-600 mb-6">최대 3개의 경쟁 병원을 등록합니다.</p>
                {loading ? (
                    <div className="text-gray-500">로딩 중...</div>
                ) : (
                    <div className="space-y-4">
                        {[0,1,2].map(i => (
                            <div key={i}>
                                <label className="block text-sm font-medium text-gray-700">벤치마크 병원 {i+1}</label>
                                <input value={benchmarks[i]} onChange={e => onChange(i, e.target.value)} type="text" placeholder="예: 동탄치과" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                        ))}
                        <div className="flex justify-end items-center gap-3 pt-2">
                            {message && <span className="text-sm text-gray-600">{message}</span>}
                            <button onClick={onSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {saving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


