'use client';

import React, { useEffect, useState } from 'react';

type HospitalForm = {
    hospitalName: string;
    businessNumber: string;
    representativeName: string;
    postalCode: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
};

export default function HospitalInfoPage() {
    const [form, setForm] = useState<HospitalForm>({
        hospitalName: '',
        businessNumber: '',
        representativeName: '',
        postalCode: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        fax: '',
        email: '',
        website: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/settings/hospital');
                const data = await res.json();
                setForm(prev => ({ ...prev, ...data }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const onSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings/hospital', {
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
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">병원 정보</h1>
                <p className="text-gray-600 mb-6">병원의 기본 정보를 관리합니다.</p>

                {loading ? (
                    <div className="text-gray-500">로딩 중...</div>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">기본 정보</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">병원명</label>
                                    <input name="hospitalName" value={form.hospitalName} onChange={onChange} type="text" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">사업자 등록번호</label>
                                    <input name="businessNumber" value={form.businessNumber} onChange={onChange} type="text" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">대표자명</label>
                                    <input name="representativeName" value={form.representativeName} onChange={onChange} type="text" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">주소</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex gap-2">
                                    <input name="postalCode" value={form.postalCode} onChange={onChange} type="text" placeholder="우편번호" className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <input name="addressLine1" value={form.addressLine1} onChange={onChange} type="text" placeholder="기본 주소" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <input name="addressLine2" value={form.addressLine2} onChange={onChange} type="text" placeholder="상세 주소" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">연락처</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">대표 전화번호</label>
                                    <input name="phone" value={form.phone} onChange={onChange} type="tel" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">팩스 번호</label>
                                    <input name="fax" value={form.fax} onChange={onChange} type="tel" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                                    <input name="email" value={form.email} onChange={onChange} type="email" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">홈페이지 URL</label>
                                    <input name="website" value={form.website} onChange={onChange} type="url" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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


