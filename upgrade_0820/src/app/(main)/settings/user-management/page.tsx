'use client';

import React, { useEffect, useState } from 'react';

type User = {
    id?: string;
    name: string;
    email: string;
    role: '원장' | '관리자' | '직원' | '간호사';
    status: '활성' | '비활성';
    lastLogin?: string;
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<User>({ name: '', email: '', role: '직원', status: '활성' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/users');
            const data = await res.json();
            setUsers(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value } as User));
    };

    const onAdd = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('create failed');
            setForm({ name: '', email: '', role: '직원', status: '활성' });
            await fetchUsers();
            setMessage('사용자가 추가되었습니다.');
        } catch (e) {
            console.error(e);
            setMessage('추가 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
                            <p className="text-gray-600">시스템 사용자와 권한을 관리합니다.</p>
                        </div>
                        <div className="flex gap-2">
                            <input name="name" value={form.name} onChange={onChange} placeholder="이름" className="px-3 py-2 border border-gray-300 rounded-lg" />
                            <input name="email" value={form.email} onChange={onChange} placeholder="이메일" className="px-3 py-2 border border-gray-300 rounded-lg" />
                            <select name="role" value={form.role} onChange={onChange} className="px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="원장">원장</option>
                                <option value="관리자">관리자</option>
                                <option value="직원">직원</option>
                                <option value="간호사">간호사</option>
                            </select>
                            <select name="status" value={form.status} onChange={onChange} className="px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="활성">활성</option>
                                <option value="비활성">비활성</option>
                            </select>
                            <button onClick={onAdd} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">추가</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">사용자 목록</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">이름</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">이메일</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">역할</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">최근 접속</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">상태</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td className="px-6 py-4" colSpan={5}>로딩 중...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td className="px-6 py-4" colSpan={5}>사용자가 없습니다.</td></tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.lastLogin || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${u.status === '활성' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{u.status}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {message && <div className="text-sm text-gray-600">{message}</div>}
            </div>
        </div>
    );
}


