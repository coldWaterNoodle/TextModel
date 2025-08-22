'use client';

import React, { useState, useEffect, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import {
    ArrowLeft, Edit, Upload, MessageCircle, CheckCircle, XCircle, Paperclip, Send,
    Calendar, Tag, FileText, ShieldCheck, BarChart2, Info, HelpCircle,
} from 'lucide-react';
import AirtableService, { MedicontentPost, PostReview } from '@/services/airtable';
import { Attachment } from 'airtable';

const ScorePanel = ({ post, review, onTooltip }: { post: any; review: any; onTooltip: (src: string) => void }) => {
    const [tab, setTab] = useState<'SEO' | '의료법'>('SEO');
    
    // 검토 데이터에서 체크리스트 파싱
    const seoChecklist = review?.seoChecklist ? JSON.parse(review.seoChecklist) : [];
    const legalChecklist = review?.legalChecklist ? JSON.parse(review.legalChecklist) : [];
    
    const checklist = tab === 'SEO' ? seoChecklist : legalChecklist;
    const score = tab === 'SEO' ? (review?.seoScore || post.seoScore || 0) : (review?.legalScore || post.legalScore || 0);
    
    return (
        <div>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                검토 결과
            </h2>
            <div className="flex gap-2 mb-4 items-center">
                <div className="flex items-center gap-1">
                    <button
                        className={`px-4 py-1 rounded-t-lg font-semibold text-sm border-b-2 transition-colors flex items-center gap-1 ${tab === 'SEO' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-400 bg-transparent'}`}
                        onClick={() => setTab('SEO')}
                    >
                        SEO
                    </button>
                    <button
                        type="button"
                        aria-label="SEO 점수 산정 방식 안내"
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTooltip('/tooltip-seo-score.html');
                        }}
                    >
                        <HelpCircle size={16} className="text-gray-400" />
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        className={`px-4 py-1 rounded-t-lg font-semibold text-sm border-b-2 transition-colors flex items-center gap-1 ${tab === '의료법' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-400 bg-transparent'}`}
                        onClick={() => setTab('의료법')}
                    >
                        의료법
                    </button>
                    <button
                        type="button"
                        aria-label="의료법 검토 시스템 안내"
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTooltip('/tooltip-medlaw.html');
                        }}
                    >
                        <HelpCircle size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>
            <div className="mb-4">
                <div className={tab === 'SEO' ? 'bg-blue-50' : 'bg-green-50'}>
                    <div className="flex items-center gap-2 px-4 py-2">
                        {tab === 'SEO' ? (
                            <BarChart2 size={22} className="text-blue-600" />
                        ) : (
                            <ShieldCheck size={22} className="text-green-600" />
                        )}
                        <span className="font-bold text-lg">
                            {score}
                        </span>
                        <span className="text-sm text-gray-600">
                            {tab} 점수
                        </span>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-lg bg-white">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-2 py-2 font-semibold text-left">항목명</th>
                            <th className="px-2 py-2 font-semibold text-center">기준점수</th>
                            <th className="px-2 py-2 font-semibold text-left">포스트 검토 결과</th>
                            <th className="px-2 py-2 font-semibold text-center">점수</th>
                            <th className="px-2 py-2 font-semibold text-center">통과</th>
                        </tr>
                    </thead>
                    <tbody>
                        {checklist?.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-b-0">
                                <td className="px-2 py-2 whitespace-nowrap">
                                    {item.name}
                                </td>
                                <td className="px-2 py-2 text-center">
                                    {item.standardScore}
                                </td>
                                <td className="px-2 py-2">
                                    {item.result}
                                </td>
                                <td className="px-2 py-2 text-center">
                                    {item.resultScore}
                                </td>
                                <td className="px-2 py-2 text-center">
                                    {item.passed ? (
                                        <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                            통과
                                        </span>
                                    ) : (
                                        <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                                            미통과
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ReviewToolsPanel = ({ post }: { post: any }) => {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Edit size={16} />
                    수정 요청
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={16} />
                    승인
                </button>
            </div>
            <div className="flex gap-2">
                <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={16} />
                    피드백
                </button>
                <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    <XCircle size={16} />
                    거부
                </button>
            </div>
        </div>
    );
};

const ConversionPostToolsPanel = ({ post, onSaveForm }: { post: any; onSaveForm: () => Promise<void> }) => {
    const [saving, setSaving] = useState(false);
    const [tempSaved, setTempSaved] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleTemporarySave = async () => {
        setSaving(true);
        try {
            // 먼저 폼 데이터를 저장
            await onSaveForm();
            // 그 다음 상태를 '병원 작업 중'으로 변경
            await AirtableService.updatePostStatus(post.id, '병원 작업 중');
            setTempSaved(true);
        } catch (error) {
            console.error('임시 저장 실패:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            // 먼저 폼 데이터를 저장
            await onSaveForm();
            // 그 다음 상태를 '리걸케어 작업 중'으로 변경
            await AirtableService.updatePostStatus(post.id, '리걸케어 작업 중');
            setCompleted(true);
        } catch (error) {
            console.error('입력 완료 실패:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleTemporarySave}
                    disabled={saving}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        saving
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            저장 중...
                        </>
                    ) : tempSaved ? (
                        <>
                            <CheckCircle size={16} />
                            임시 저장됨
                        </>
                    ) : (
                        <>
                            <Upload size={16} />
                            임시 저장
                        </>
                    )}
                </button>
                <button 
                    onClick={handleComplete}
                    disabled={saving || completed}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        saving || completed
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            처리 중...
                        </>
                    ) : completed ? (
                        <>
                            <CheckCircle size={16} />
                            완료됨
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            입력 완료
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const DataRequestPanel = ({ post, onSaveForm }: { post: any; onSaveForm: (handleSubmit: () => Promise<void>) => void }) => {
    const [formData, setFormData] = useState({
        conceptMessage: '',
        patientCondition: '',
        treatmentProcessMessage: '',
        treatmentResultMessage: '',
        additionalMessage: '',
        beforeImagesText: '',
        processImagesText: '',
        afterImagesText: ''
    });
    const [images, setImages] = useState({
        beforeImages: [] as File[],
        processImages: [] as File[],
        afterImages: [] as File[]
    });
    const [uploadedImages, setUploadedImages] = useState<{
        beforeImages: Attachment[];
        processImages: Attachment[];
        afterImages: Attachment[];
    }>({
        beforeImages: [],
        processImages: [],
        afterImages: []
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // 기존 데이터 로드
    useEffect(() => {
        const loadExistingData = async () => {
            try {
                const postId = `post_${post.id}`;
                const existingData = await AirtableService.getDataRequest(postId);
                if (existingData) {
                    setFormData({
                        conceptMessage: existingData.conceptMessage || '',
                        patientCondition: existingData.patientCondition || '',
                        treatmentProcessMessage: existingData.treatmentProcessMessage || '',
                        treatmentResultMessage: existingData.treatmentResultMessage || '',
                        additionalMessage: existingData.additionalMessage || '',
                        beforeImagesText: existingData.beforeImagesText || '',
                        processImagesText: existingData.processImagesText || '',
                        afterImagesText: existingData.afterImagesText || ''
                    });
                    
                    // 기존 이미지 URL도 로드
                    setUploadedImages({
                        beforeImages: existingData.beforeImages || [],
                        processImages: existingData.processImages || [],
                        afterImages: existingData.afterImages || []
                    });
                    
                    console.log('기존 데이터 로드 완료:', existingData);
                }
            } catch (error) {
                console.error('기존 데이터 로드 실패:', error);
            }
        };

        if (post) {
            loadExistingData();
        }
    }, [post]);

    const handleImageUpload = async (type: 'beforeImages' | 'processImages' | 'afterImages', files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            console.log(`이미지 업로드: ${type}`, fileArray);
            
            // 파일을 상태에 추가
            setImages(prev => ({
                ...prev,
                [type]: [...prev[type], ...fileArray]
            }));

            // 서버에 이미지 업로드
            try {
                const formData = new FormData();
                fileArray.forEach(file => {
                    formData.append('files', file);
                });
                formData.append('postId', `post_${post.id}`);
                formData.append('imageType', type.replace('Images', '')); // 'beforeImages' -> 'before'

                const response = await fetch('/api/medicontent/upload-images', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('이미지 업로드 성공:', result.attachments);
                    
                    // 업로드된 URL을 상태에 추가
                    setUploadedImages(prev => ({
                        ...prev,
                        [type]: [...prev[type], ...result.attachments]
                    }));
                } else {
                    console.error('이미지 업로드 실패:', response.statusText);
                }
            } catch (error) {
                console.error('이미지 업로드 오류:', error);
            }
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        
        try {
            console.log('폼 데이터 저장 시작:', formData);
            console.log('업로드된 이미지 상태:', uploadedImages);
            
            const postId = `post_${post.id}`;
            const existingData = await AirtableService.getDataRequest(postId);
            
            // 업로드된 이미지 URL 사용
            const imageData = {
                beforeImages: uploadedImages.beforeImages.map(att => att.id),
                processImages: uploadedImages.processImages.map(att => att.id),
                afterImages: uploadedImages.afterImages.map(att => att.id)
            };
            
            console.log('저장할 이미지 attachment ID:', imageData);
            
            const requestData = {
                ...formData,
                ...imageData,
                postId: `post_${post.id}` // PUT 요청에서도 postId 추가
            };
            
            console.log('전체 저장 데이터:', requestData);
            
            if (existingData) {
                // 기존 데이터 업데이트
                console.log('기존 데이터 업데이트:', existingData.id);
                const response = await fetch('/api/medicontent/data-requests', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: existingData.id,
                        ...requestData
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API 응답 오류:', response.status, errorText);
                    throw new Error(`API 오류: ${response.status}`);
                }
                
                console.log('데이터 업데이트 성공');
            } else {
                // 새 데이터 생성
                console.log('새 데이터 생성:', postId);
                const response = await fetch('/api/medicontent/data-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API 응답 오류:', response.status, errorText);
                    throw new Error(`API 오류: ${response.status}`);
                }
                
                console.log('데이터 생성 성공');
            }
            
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('자료 요청 저장 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // handleSubmit 함수를 외부로 노출
    useEffect(() => {
        if (onSaveForm) {
            onSaveForm(handleSubmit);
        }
    }, [formData, uploadedImages]);



    return (
        <div className="space-y-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="py-1">
                        <Info className="h-6 w-6 text-blue-500 mr-3" />
                    </div>
                    <div>
                        <p className="font-bold text-blue-800">
                            자료를 제공해주세요
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            좌측의 템플릿 각 항목에 들어갈 내용과 사진을 우측 양식에 맞춰 제공해주시면,
                            저희가 멋진 콘텐츠로 제작해드리겠습니다.
                        </p>
                    </div>
                </div>
            </div>

            <form className="space-y-6">
                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        1. 질환에 대한 개념 설명에서 강조되어야 할 메시지가 있나요?
                    </label>
                    <textarea
                        value={formData.conceptMessage}
                        onChange={(e) => setFormData({...formData, conceptMessage: e.target.value})}
                        rows={3}
                        placeholder="예: 신경치료가 자연치를 보존하는 마지막 기회라는 점을 강조하고 싶습니다."
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        2. 환자는 처음 내원 시 어떤 상태였나요?
                    </label>
                    <textarea
                        value={formData.patientCondition}
                        onChange={(e) => setFormData({...formData, patientCondition: e.target.value})}
                        rows={3}
                        placeholder="예: 5년 전 치료받은 어금니에 극심한 통증과 함께 잇몸이 부어오른 상태로 내원하셨습니다."
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        3. 내원 시 찍은 사진을 업로드 후 간단한 설명을 작성해주세요
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div 
                            className="md:col-span-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex flex-col justify-center items-center"
                            onClick={() => document.getElementById('beforeImages')?.click()}
                        >
                            <Upload className="mx-auto text-gray-400" size={28} />
                            <input 
                                id="beforeImages"
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => handleImageUpload('beforeImages', e.target.files)}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <textarea
                                value={formData.beforeImagesText}
                                onChange={(e) => setFormData({...formData, beforeImagesText: e.target.value})}
                                rows={4}
                                placeholder="파노라마, X-ray, 구강 내 사진 등과 함께 어떤 상태였는지 간략하게 작성해주세요. 예: 초진 시 촬영한 파노라마 사진. 16번 치아 주변으로 광범위한 염증 소견이 관찰됨."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none h-full"
                            />
                        </div>
                    </div>
                    {(images.beforeImages.length > 0 || uploadedImages.beforeImages.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {images.beforeImages.map((file, index) => (
                                <div key={`file-${index}`} className="relative">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={`Before ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <button
                                        onClick={() => setImages(prev => ({
                                            ...prev,
                                            beforeImages: prev.beforeImages.filter((_, i) => i !== index)
                                        }))}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {uploadedImages.beforeImages.map((attachment, index) => (
                                <div key={`url-${index}`} className="relative">
                                    <img 
                                        src={attachment.thumbnails?.large?.url || attachment.url} 
                                        alt={attachment.filename}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        4. 치료 과정에서 강조되어야 할 메시지가 있나요?
                    </label>
                    <textarea
                        value={formData.treatmentProcessMessage}
                        onChange={(e) => setFormData({...formData, treatmentProcessMessage: e.target.value})}
                        rows={3}
                        placeholder="예: 미세 현미경을 사용하여 염증의 원인을 정확히 찾아내고, MTA 재료를 이용해 성공률을 높였습니다."
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        5. 치료 과정 사진을 업로드 후 간단한 설명을 작성해주세요
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div 
                            className="md:col-span-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex flex-col justify-center items-center"
                            onClick={() => document.getElementById('processImages')?.click()}
                        >
                            <Upload className="mx-auto text-gray-400" size={28} />
                            <input 
                                id="processImages"
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => handleImageUpload('processImages', e.target.files)}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <textarea
                                value={formData.processImagesText}
                                onChange={(e) => setFormData({...formData, processImagesText: e.target.value})}
                                rows={4}
                                placeholder="미세 현미경 사용 모습, MTA 충전 과정 등 치료 과정 사진과 함께 설명을 작성해주세요. 예: 미세현미경을 사용하여 근관 내부를 탐색하는 모습."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none h-full"
                            />
                        </div>
                    </div>
                    {(images.processImages.length > 0 || uploadedImages.processImages.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {images.processImages.map((file, index) => (
                                <div key={`file-${index}`} className="relative">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={`Process ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <button
                                        onClick={() => setImages(prev => ({
                                            ...prev,
                                            processImages: prev.processImages.filter((_, i) => i !== index)
                                        }))}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {uploadedImages.processImages.map((attachment, index) => (
                                <div key={`url-${index}`} className="relative">
                                    <img 
                                        src={attachment.thumbnails?.large?.url || attachment.url} 
                                        alt={attachment.filename}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        6. 치료 결과에 대해 강조되어야 할 메시지가 있나요?
                    </label>
                    <textarea
                        value={formData.treatmentResultMessage}
                        onChange={(e) => setFormData({...formData, treatmentResultMessage: e.target.value})}
                        rows={3}
                        placeholder="예: 치료 후 통증이 완전히 사라졌으며, 1년 후 검진에서도 재발 없이 안정적으로 유지되고 있습니다."
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        7. 치료 결과 사진을 업로드 후 간단한 설명을 작성해주세요
                    </label>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div 
                            className="md:col-span-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex flex-col justify-center items-center"
                            onClick={() => document.getElementById('afterImages')?.click()}
                        >
                            <Upload className="mx-auto text-gray-400" size={28} />
                            <input 
                                id="afterImages"
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => handleImageUpload('afterImages', e.target.files)}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <textarea
                                value={formData.afterImagesText}
                                onChange={(e) => setFormData({...formData, afterImagesText: e.target.value})}
                                rows={4}
                                placeholder="치료 전/후 비교 X-ray, 구강 내 사진 등 치료 결과 사진과 함께 설명을 작성해주세요. 예: 신경치료 완료 후 촬영한 파노라마 사진. 염증이 모두 제거되고 근관이 완벽하게 충전된 것을 확인할 수 있음."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none h-full"
                            />
                        </div>
                    </div>
                    {(images.afterImages.length > 0 || uploadedImages.afterImages.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {images.afterImages.map((file, index) => (
                                <div key={`file-${index}`} className="relative">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={`After ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <button
                                        onClick={() => setImages(prev => ({
                                            ...prev,
                                            afterImages: prev.afterImages.filter((_, i) => i !== index)
                                        }))}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {uploadedImages.afterImages.map((attachment, index) => (
                                <div key={`url-${index}`} className="relative">
                                    <img 
                                        src={attachment.thumbnails?.large?.url || attachment.url} 
                                        alt={attachment.filename}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-bold mb-2 text-gray-800">
                        8. 추가적으로 더하고 싶은 메시지가 있나요?
                    </label>
                    <textarea
                        value={formData.additionalMessage}
                        onChange={(e) => setFormData({...formData, additionalMessage: e.target.value})}
                        rows={3}
                        placeholder="환자 당부사항, 병원 철학 등 자유롭게 작성해주세요."
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </form>
        </div>
    );
};

const PostHeader = ({ post }: { post: any }) => (
    <div className="mb-6">
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${post.type === '유입 포스팅' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
            {post.type}
        </span>
        <h1 className="text-2xl font-bold text-gray-800 mt-2 sm:text-3xl">
            {post.title}
        </h1>
        <div className="flex items-center text-sm text-gray-500 flex-wrap mt-2">
            <span className="flex items-center mr-4">
                <Calendar size={14} className="mr-1.5" />
                발행 예정일: {post.publishDate ? new Date(post.publishDate).toLocaleDateString('ko-KR') : '날짜 미정'}
            </span>
            <span className="flex items-center">
                <Info size={14} className="mr-1.5" />
                상태: {post.status}
            </span>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
            {post.keywords?.map((keyword: string) => (
                <span
                    key={keyword}
                    className="bg-gray-200 text-gray-700 px-2 py-1 text-xs font-medium rounded-full flex items-center"
                >
                    <Tag size={12} className="mr-1" /> {keyword}
                </span>
            ))}
        </div>
    </div>
);

const PostDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
    const router = useRouter();
    const [post, setPost] = useState<MedicontentPost | null>(null);
    const [review, setReview] = useState<PostReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [popupSrc, setPopupSrc] = useState<string | null>(null);

    // params를 unwrap....edit
    const { id } = use(params);

    useEffect(() => {
        const fetchPostData = async () => {
            try {
                const postData = await AirtableService.getPost(id);
                if (postData) {
                    setPost(postData);
                    
                    // 검토 데이터도 함께 로드
                    const reviewData = await AirtableService.getPostReview(id);
                    setReview(reviewData);
                }
            } catch (error) {
                console.error('포스트 데이터 로드 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPostData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        notFound();
    }

    const renderRightPanel = () => {
        // 전환 포스팅인 경우 상태에 따라 다른 UI 표시
        if (post.type === '전환 포스팅') {
            if (post.status === '작업 완료') {
                // 작업 완료: SEO/의료법 검토 결과 + 검토 버튼들
                return (
                    <div className="space-y-8 flex flex-col h-full">
                        <ScorePanel post={post} review={review} onTooltip={setPopupSrc} />
                        <hr />
                        <div className="mt-auto pb-2">
                            <h3 className="text-lg font-bold mb-3 text-gray-800">
                                검토 및 피드백
                            </h3>
                            <ReviewToolsPanel post={post} />
                        </div>
                    </div>
                );
            } else {
                // 작업 완료가 아닌 경우: 자료 요청 폼 + 전환 포스팅용 버튼들
                let currentHandleSubmit: (() => Promise<void>) | null = null;
                
                return (
                    <div className="space-y-8 flex flex-col h-full">
                        <DataRequestPanel 
                            post={post} 
                            onSaveForm={(handleSubmit) => {
                                currentHandleSubmit = handleSubmit;
                            }}
                        />
                        <hr />
                        <div className="mt-auto pb-2">
                            <h3 className="text-lg font-bold mb-3 text-gray-800">
                                작업 관리
                            </h3>
                            <ConversionPostToolsPanel 
                                post={post} 
                                onSaveForm={async () => {
                                    if (currentHandleSubmit) {
                                        await currentHandleSubmit();
                                    }
                                }} 
                            />
                        </div>
                    </div>
                );
            }
        }
        
        // 유입 포스팅인 경우: 검토 결과 + 검토 버튼들
        return (
            <div className="space-y-8 flex flex-col h-full">
                <ScorePanel post={post} review={review} onTooltip={setPopupSrc} />
                <hr />
                <div className="mt-auto pb-2">
                    <h3 className="text-lg font-bold mb-3 text-gray-800">
                        검토 및 피드백
                    </h3>
                    <ReviewToolsPanel post={post} />
                </div>
            </div>
        );
    };

    const contentUrl = post.content ? null : (post.htmlId ? `/medicontent/posts/post-${post.htmlId}.html` : null);

    return (
        <div className="flex h-screen flex-col bg-gray-50/50 lg:flex-row overflow-hidden">
            {/* Left Panel: Content Preview */}
            <div className="flex h-1/2 w-full flex-col bg-white shadow-lg lg:h-full lg:w-auto lg:flex-1 z-10 min-w-0">
                <div className="p-4 border-b flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-md hover:bg-gray-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h2 className="font-semibold truncate">
                            {post.title}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {post.type} • {post.treatmentType}
                        </p>
                    </div>
                </div>
                {post.type === '전환 포스팅' && post.status !== '작업 완료' ? (
                    // 전환 포스팅이고 작업 완료가 아닌 경우: 템플릿 표시
                    <iframe
                        src="/medicontent/templates/conversion-template.html"
                        title="전환 포스팅 템플릿"
                        className="w-full flex-grow border-none"
                    />
                ) : post.content ? (
                    // HTML 콘텐츠가 있는 경우
                    <div className="flex-grow overflow-auto">
                        <div 
                            className="p-6 max-w-none"
                            style={{
                                maxWidth: '100%',
                                overflowX: 'hidden',
                                wordWrap: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                ) : contentUrl ? (
                    // HTML 파일이 있는 경우
                    <iframe
                        src={contentUrl}
                        title={post.title}
                        className="w-full flex-grow border-none"
                    />
                ) : (
                    // 콘텐츠가 없는 경우
                    <div className="flex-grow flex items-center justify-center bg-gray-100">
                        <div className="text-center text-gray-500">
                            <FileText size={48} className="mx-auto mb-4" />
                            <p className="text-xl font-semibold">
                                콘텐츠가 아직 없습니다.
                            </p>
                            <p>자료를 제공하면 업체에서 제작을 시작합니다.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Information and Tools */}
            <div className="h-1/2 w-full overflow-y-auto p-4 sm:p-8 lg:h-full lg:w-1/3 xl:w-2/5 min-w-0">
                <div className="w-full max-w-md mx-auto">
                    <PostHeader post={post} />
                    <hr className="my-8" />
                    {renderRightPanel()}
                </div>
            </div>
            
            {/* Popup Modal */}
            {popupSrc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">도움말</h3>
                            <button
                                onClick={() => setPopupSrc(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600">
                                {popupSrc === '/tooltip-seo-score.html' 
                                    ? 'SEO 점수는 제목 키워드 포함, 본문 키워드 밀도, 메타 설명 등을 종합적으로 평가합니다.'
                                    : '의료법 검토는 의료법 준수, 과장 표현 여부, 개인정보 보호 등을 확인합니다.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetailPage;
