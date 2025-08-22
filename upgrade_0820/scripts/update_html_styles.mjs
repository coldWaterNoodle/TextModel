import Airtable from 'airtable';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Airtable 설정
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable API 키와 Base ID가 필요합니다.');
    process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// 수정된 HTML 콘텐츠 (가로 스크롤 방지)
const updatedPostContents = {
    'DI001': {
        title: '디지털 임플란트, 정확도 99%의 혁신적 치료',
        content: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>디지털 임플란트, 정확도 99%의 혁신적 치료</title>
    <meta name="description" content="3D 스캔과 컴퓨터 설계를 통한 정밀한 디지털 임플란트 치료로 치아를 완벽하게 복원하세요.">
    <style>
        body { 
            font-family: 'Noto Sans KR', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 100%; 
            margin: 0; 
            padding: 0; 
            overflow-x: hidden;
            word-wrap: break-word;
        }
        h1 { 
            color: #2563eb; 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 10px; 
            font-size: 1.8rem;
            margin-top: 0;
        }
        h2 { 
            color: #1e40af; 
            margin-top: 30px; 
            font-size: 1.4rem;
        }
        h3 {
            font-size: 1.2rem;
            margin-top: 20px;
        }
        .highlight { 
            background-color: #fef3c7; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .step { 
            background-color: #f0f9ff; 
            padding: 15px; 
            border-left: 4px solid #2563eb; 
            margin: 15px 0; 
        }
        .benefit { 
            background-color: #f0fdf4; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        ol, ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        p {
            margin-bottom: 15px;
        }
        strong {
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9rem;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        @media (max-width: 768px) {
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.2rem; }
            h3 { font-size: 1.1rem; }
            .highlight, .step, .benefit { padding: 12px; }
        }
    </style>
</head>
<body>
    <h1>디지털 임플란트, 정확도 99%의 혁신적 치료</h1>
    
    <div class="highlight">
        <p><strong>치아를 잃은 후 가장 걱정되는 것은 무엇일까요?</strong></p>
        <p>많은 분들이 임플란트 수술의 정확성과 예측 가능성에 대해 걱정하십니다. 하지만 이제 <strong>디지털 임플란트</strong>로 그런 걱정을 해결할 수 있습니다.</p>
    </div>

    <h2>디지털 임플란트란?</h2>
    <p>디지털 임플란트는 3D 구강 스캔과 컴퓨터 설계를 통해 환자의 구강 상태를 정밀하게 분석하고, 최적의 임플란트 위치와 각도를 결정하는 혁신적인 치료 방법입니다.</p>

    <h2>기존 임플란트와의 차이점</h2>
    <div class="step">
        <h3>1. 정밀한 진단</h3>
        <p>3D CT 스캔을 통해 골밀도, 신경 위치, 혈관 분포를 정확히 파악합니다.</p>
    </div>
    
    <div class="step">
        <h3>2. 컴퓨터 설계</h3>
        <p>전용 소프트웨어로 임플란트의 정확한 위치, 각도, 깊이를 설계합니다.</p>
    </div>
    
    <div class="step">
        <h3>3. 가이드 제작</h3>
        <p>설계된 정보를 바탕으로 수술 가이드를 3D 프린터로 제작합니다.</p>
    </div>

    <h2>디지털 임플란트의 장점</h2>
    <div class="benefit">
        <strong>✅ 정확도 99%</strong> - 컴퓨터 설계로 인체 오차를 최소화
    </div>
    <div class="benefit">
        <strong>✅ 수술 시간 단축</strong> - 가이드 사용으로 수술 시간 50% 단축
    </div>
    <div class="benefit">
        <strong>✅ 예측 가능성</strong> - 수술 전 결과를 미리 확인 가능
    </div>
    <div class="benefit">
        <strong>✅ 안전성 향상</strong> - 신경 손상 위험 최소화
    </div>

    <h2>치료 과정</h2>
    <ol>
        <li><strong>1차 상담</strong> - 구강 검사 및 3D CT 촬영</li>
        <li><strong>컴퓨터 설계</strong> - 임플란트 위치 및 각도 설계</li>
        <li><strong>가이드 제작</strong> - 3D 프린터로 수술 가이드 제작</li>
        <li><strong>임플란트 수술</strong> - 가이드를 이용한 정밀 수술</li>
        <li><strong>보철물 제작</strong> - 개인 맞춤형 보철물 제작</li>
    </ol>

    <div class="highlight">
        <p><strong>디지털 임플란트는 단순한 기술이 아닙니다.</strong></p>
        <p>환자의 안전과 만족을 최우선으로 하는 혁신적인 치료 방법입니다. 정확도 99%의 디지털 임플란트로 당신의 치아를 완벽하게 복원해보세요.</p>
    </div>

    <p style="text-align: center; margin-top: 40px; color: #666;">
        <strong>내이튼치과</strong>에서 디지털 임플란트로 당신의 아름다운 미소를 되찾으세요.
    </p>
</body>
</html>`
    },
    'DI002': {
        title: '기존 임플란트 vs 디지털 임플란트, 차이점은?',
        content: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기존 임플란트 vs 디지털 임플란트, 차이점은?</title>
    <meta name="description" content="기존 임플란트와 디지털 임플란트의 차이점을 비교해보고, 왜 디지털 임플란트가 더 정확하고 안전한지 알아보세요.">
    <style>
        body { 
            font-family: 'Noto Sans KR', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 100%; 
            margin: 0; 
            padding: 0; 
            overflow-x: hidden;
            word-wrap: break-word;
        }
        h1 { 
            color: #2563eb; 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 10px; 
            font-size: 1.8rem;
            margin-top: 0;
        }
        h2 { 
            color: #1e40af; 
            margin-top: 30px; 
            font-size: 1.4rem;
        }
        h3 {
            font-size: 1.2rem;
            margin-top: 20px;
        }
        .comparison { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 20px 0; 
        }
        .traditional, .digital { 
            padding: 20px; 
            border-radius: 8px; 
        }
        .traditional { 
            background-color: #fef2f2; 
            border: 2px solid #fecaca; 
        }
        .digital { 
            background-color: #f0f9ff; 
            border: 2px solid #93c5fd; 
        }
        .highlight { 
            background-color: #fef3c7; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .advantage { 
            background-color: #f0fdf4; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        ol, ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        p {
            margin-bottom: 15px;
        }
        strong {
            font-weight: 600;
        }
        @media (max-width: 768px) {
            .comparison {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.2rem; }
            h3 { font-size: 1.1rem; }
            .highlight, .traditional, .digital { padding: 12px; }
        }
    </style>
</head>
<body>
    <h1>기존 임플란트 vs 디지털 임플란트, 차이점은?</h1>
    
    <div class="highlight">
        <p>임플란트 치료를 고려하고 계신다면, <strong>기존 임플란트</strong>와 <strong>디지털 임플란트</strong> 중 어떤 방법을 선택해야 할지 고민이 되실 것입니다. 두 방법의 차이점을 자세히 비교해보겠습니다.</p>
    </div>

    <div class="comparison">
        <div class="traditional">
            <h2>기존 임플란트</h2>
            <h3>진단 방법</h3>
            <p>• 일반 X-ray 촬영</p>
            <p>• 육안으로 골 상태 확인</p>
            <p>• 경험에 의존한 판단</p>
            
            <h3>수술 방법</h3>
            <p>• 자유핸드 수술</p>
            <p>• 실시간으로 위치 조정</p>
            <p>• 의사의 숙련도에 의존</p>
            
            <h3>정확도</h3>
            <p>• 85-90%</p>
            <p>• 인체 오차 발생 가능</p>
        </div>
        
        <div class="digital">
            <h2>디지털 임플란트</h2>
            <h3>진단 방법</h3>
            <p>• 3D CT 스캔</p>
            <p>• 컴퓨터 분석</p>
            <p>• 정확한 데이터 기반</p>
            
            <h3>수술 방법</h3>
            <p>• 수술 가이드 사용</p>
            <p>• 미리 설계된 위치</p>
            <p>• 일관된 결과</p>
            
            <h3>정확도</h3>
            <p>• 99%</p>
            <p>• 예측 가능한 결과</p>
        </div>
    </div>

    <h2>디지털 임플란트가 더 좋은 이유</h2>
    
    <div class="advantage">
        <strong>🎯 정확성</strong> - 컴퓨터 설계로 인체 오차를 최소화하여 정확도 99% 달성
    </div>
    
    <div class="advantage">
        <strong>⏰ 시간 단축</strong> - 수술 가이드 사용으로 수술 시간을 50% 단축
    </div>
    
    <div class="advantage">
        <strong>🛡️ 안전성</strong> - 신경과 혈관의 정확한 위치 파악으로 안전성 향상
    </div>
    
    <div class="advantage">
        <strong>📊 예측 가능성</strong> - 수술 전 결과를 미리 확인할 수 있어 환자 만족도 향상
    </div>

    <h2>실제 사례 비교</h2>
    
    <h3>기존 임플란트 사례</h3>
    <p>60대 남성 환자 - 상악 좌측 구치부 임플란트 수술</p>
    <ul>
        <li>수술 시간: 2시간 30분</li>
        <li>통증: 수술 후 3일간 지속</li>
        <li>결과: 만족스러웠으나 약간의 불편함 호소</li>
    </ul>
    
    <h3>디지털 임플란트 사례</h3>
    <p>동일 연령대 환자 - 상악 우측 구치부 디지털 임플란트 수술</p>
    <ul>
        <li>수술 시간: 1시간 15분</li>
        <li>통증: 수술 후 1일만 지속</li>
        <li>결과: 매우 만족스러움, 자연스러운 느낌</li>
    </ul>

    <div class="highlight">
        <p><strong>결론적으로, 디지털 임플란트는 기존 임플란트의 모든 단점을 보완한 혁신적인 치료 방법입니다.</strong></p>
        <p>정확성, 안전성, 예측 가능성 모든 면에서 우수한 결과를 제공하여 환자의 만족도를 크게 향상시킵니다.</p>
    </div>

    <p style="text-align: center; margin-top: 40px; color: #666;">
        <strong>내이튼치과</strong>에서 최신 디지털 임플란트 기술로 당신의 치아를 완벽하게 복원하세요.
    </p>
</body>
</html>`
    },
    'DI003': {
        title: '디지털 임플란트 가격, 투명한 비용 안내',
        content: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>디지털 임플란트 가격, 투명한 비용 안내</title>
    <meta name="description" content="디지털 임플란트의 투명한 가격 정보와 비용 구성 요소를 자세히 안내합니다.">
    <style>
        body { 
            font-family: 'Noto Sans KR', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 100%; 
            margin: 0; 
            padding: 0; 
            overflow-x: hidden;
            word-wrap: break-word;
        }
        h1 { 
            color: #2563eb; 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 10px; 
            font-size: 1.8rem;
            margin-top: 0;
        }
        h2 { 
            color: #1e40af; 
            margin-top: 30px; 
            font-size: 1.4rem;
        }
        h3 {
            font-size: 1.2rem;
            margin-top: 20px;
        }
        .price-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 0.9rem;
        }
        .price-table th, .price-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        .price-table th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
        }
        .highlight { 
            background-color: #fef3c7; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .cost-breakdown { 
            background-color: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .warning { 
            background-color: #fef2f2; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #ef4444; 
        }
        ol, ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        p {
            margin-bottom: 15px;
        }
        strong {
            font-weight: 600;
        }
        @media (max-width: 768px) {
            .price-table {
                font-size: 0.8rem;
            }
            .price-table th, .price-table td {
                padding: 6px 4px;
            }
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.2rem; }
            h3 { font-size: 1.1rem; }
            .highlight, .cost-breakdown, .warning { padding: 12px; }
        }
    </style>
</head>
<body>
    <h1>디지털 임플란트 가격, 투명한 비용 안내</h1>
    
    <div class="highlight">
        <p>많은 분들이 임플란트 치료를 고려할 때 가장 궁금해하는 것이 바로 <strong>가격</strong>입니다. 디지털 임플란트의 투명한 가격 정보를 자세히 안내해드리겠습니다.</p>
    </div>

    <h2>디지털 임플란트 가격표</h2>
    
    <table class="price-table">
        <thead>
            <tr>
                <th>치료 종류</th>
                <th>기존 임플란트</th>
                <th>디지털 임플란트</th>
                <th>차이점</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>단일 임플란트</td>
                <td>150만원</td>
                <td>180만원</td>
                <td>+30만원</td>
            </tr>
            <tr>
                <td>전체 임플란트 (상하악)</td>
                <td>1,200만원</td>
                <td>1,400만원</td>
                <td>+200만원</td>
            </tr>
            <tr>
                <td>올온4 임플란트</td>
                <td>800만원</td>
                <td>900만원</td>
                <td>+100만원</td>
            </tr>
        </tbody>
    </table>

    <h2>비용 구성 요소</h2>
    
    <div class="cost-breakdown">
        <h3>디지털 임플란트 비용에 포함되는 항목</h3>
        <ul>
            <li><strong>3D CT 촬영</strong> - 정밀한 구강 분석</li>
            <li><strong>컴퓨터 설계</strong> - 전용 소프트웨어 사용</li>
            <li><strong>수술 가이드 제작</strong> - 3D 프린터 제작</li>
            <li><strong>임플란트 수술</strong> - 정밀 수술</li>
            <li><strong>보철물 제작</strong> - 개인 맞춤형</li>
            <li><strong>사후 관리</strong> - 1년간 무료 검진</li>
        </ul>
    </div>

    <h2>왜 디지털 임플란트가 더 비쌀까요?</h2>
    
    <p>디지털 임플란트가 기존 임플란트보다 비싼 이유는 다음과 같습니다:</p>
    
    <ol>
        <li><strong>고가의 장비</strong> - 3D CT, 컴퓨터 설계 소프트웨어, 3D 프린터 등</li>
        <li><strong>전문 인력</strong> - 디지털 설계 전문가 필요</li>
        <li><strong>정밀한 재료</strong> - 고품질 임플란트 및 보철물</li>
        <li><strong>시간과 노력</strong> - 설계부터 제작까지 더 많은 시간 투자</li>
    </ol>

    <h2>분할 결제 및 할인 혜택</h2>
    
    <div class="highlight">
        <h3>분할 결제 옵션</h3>
        <ul>
            <li>무이자 12개월 분할 결제</li>
            <li>무이자 24개월 분할 결제 (일부 카드)</li>
            <li>현금 할인 5%</li>
        </ul>
    </div>

    <h2>주의사항</h2>
    
    <div class="warning">
        <p><strong>⚠️ 너무 저렴한 가격에 주의하세요!</strong></p>
        <p>시중에 너무 저렴한 디지털 임플란트 광고가 많습니다. 하지만 실제로는:</p>
        <ul>
            <li>기존 임플란트를 디지털 임플란트로 속이는 경우</li>
            <li>필요한 장비가 없는 경우</li>
            <li>숨겨진 비용이 추가되는 경우</li>
        </ul>
        <p>반드시 정확한 치료 과정과 포함 항목을 확인하시기 바랍니다.</p>
    </div>

    <h2>투명한 가격 정책</h2>
    
    <p>내이튼치과는 다음과 같은 투명한 가격 정책을 운영합니다:</p>
    
    <ul>
        <li>모든 비용을 사전에 명확히 안내</li>
        <li>숨겨진 비용 없음</li>
        <li>치료 과정 중 추가 비용 발생 시 즉시 안내</li>
        <li>사후 관리 비용 포함</li>
    </ul>

    <div class="highlight">
        <p><strong>디지털 임플란트는 투자할 가치가 있는 치료입니다.</strong></p>
        <p>정확성과 안전성을 고려할 때, 추가 비용은 충분히 합리적입니다. 당신의 치아 건강과 만족도를 위해 최고의 치료를 선택하세요.</p>
    </div>

    <p style="text-align: center; margin-top: 40px; color: #666;">
        <strong>내이튼치과</strong>에서 투명한 가격으로 최고의 디지털 임플란트 치료를 받으세요.
    </p>
</body>
</html>`
    }
};

async function updateHtmlStyles() {
    console.log('🎨 HTML 스타일 업데이트 중...');
    
    for (const [htmlId, content] of Object.entries(updatedPostContents)) {
        try {
            // 해당 HTML ID를 가진 포스트 찾기
            const records = await base('Medicontent Posts')
                .select({
                    filterByFormula: `{HTML ID} = '${htmlId}'`
                })
                .all();
            
            if (records.length > 0) {
                const record = records[0];
                await base('Medicontent Posts').update(record.id, {
                    'Content': content.content
                });
                console.log(`✅ ${htmlId} HTML 스타일 업데이트 완료`);
            }
        } catch (error) {
            console.error(`❌ ${htmlId} HTML 스타일 업데이트 실패:`, error.message);
        }
    }
}

async function main() {
    console.log('🚀 HTML 스타일 업데이트를 시작합니다...\n');
    
    try {
        await updateHtmlStyles();
        console.log('\n🎉 HTML 스타일 업데이트가 완료되었습니다!');
        
    } catch (error) {
        console.error('\n❌ 업데이트 중 오류가 발생했습니다:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main();
