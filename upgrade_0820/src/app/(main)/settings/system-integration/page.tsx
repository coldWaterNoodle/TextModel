'use client';

import React, { useEffect, useState } from 'react';

type IntegrationForm = {
    emrType: string;
    emrApiKey: string;
};

export default function SystemIntegrationPage() {
    const [form, setForm] = useState<IntegrationForm>({ emrType: '', emrApiKey: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/settings/integration');
                const data = await res.json();
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
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const onSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings/integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
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
                <h1 className="text-2xl font-bold text-gray-900 mb-1">시스템 연동</h1>
                <p className="text-gray-600 mb-6">외부 시스템과의 연동을 관리합니다.</p>
                {loading ? (
                    <div className="text-gray-500">로딩 중...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">EMR 종류</label>
                                <select name="emrType" value={form.emrType} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">선택하세요</option>
                                    <option value="차세대 EMR">차세대 EMR</option>
                                    <option value="메디컬 EMR">메디컬 EMR</option>
                                    <option value="스마트 EMR">스마트 EMR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">API 키</label>
                                <div className="flex gap-2">
                                    <input name="emrApiKey" value={form.emrApiKey} onChange={onChange} type={showKey ? 'text' : 'password'} className="flex-1 mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <button onClick={() => setShowKey(v => !v)} className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700">
                                        {showKey ? '숨기기' : '보기'}
                                    </button>
                                </div>
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
    );
}


