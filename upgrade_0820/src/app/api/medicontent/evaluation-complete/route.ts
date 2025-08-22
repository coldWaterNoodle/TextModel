import { NextRequest, NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';
import * as fs from 'fs';
import * as path from 'path';

// evaluation 결과 JSON에서 점수와 criteria 추출
function extractEvaluationData(evaluationData: any) {
    const criteria = evaluationData.modes?.criteria || '';
    const weightedTotal = evaluationData.scores?.weighted_total || 0;
    
    // criteria에 따라 SEO Score vs Legal Score 구분
    const isLegalScore = ['엄격', '표준', '유연'].includes(criteria);
    const isSeoScore = ['우수', '양호', '보통'].includes(criteria);
    
    return {
        criteria,
        score: weightedTotal,
        isLegalScore,
        isSeoScore
    };
}

// HTML 파일에서 제목과 본문 추출
function extractContentFromHtml(htmlFilePath: string) {
    try {
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        
        // 제목 추출 (title 태그에서)
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : '';
        
        // 본문 추출 (main 태그 내용에서)
        const mainMatch = htmlContent.match(/<main>(.*?)<\/main>/s);
        let content = '';
        
        if (mainMatch) {
            // HTML 태그 제거하고 텍스트만 추출
            content = mainMatch[1]
                .replace(/<[^>]*>/g, ' ')  // HTML 태그 제거
                .replace(/\s+/g, ' ')      // 연속된 공백을 단일 공백으로
                .trim();
        }
        
        return { title, content };
    } catch (error) {
        console.error('HTML 파일 읽기 실패:', error);
        return { title: '', content: '' };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { evaluationFilePath, htmlId } = await request.json();
        
        console.log('🔍 evaluation 완료 처리 시작:', { evaluationFilePath, htmlId });
        
        // 1. evaluation JSON 파일 읽기
        if (!fs.existsSync(evaluationFilePath)) {
            throw new Error(`evaluation 파일을 찾을 수 없습니다: ${evaluationFilePath}`);
        }
        
        const evaluationData = JSON.parse(fs.readFileSync(evaluationFilePath, 'utf-8'));
        const evalInfo = extractEvaluationData(evaluationData);
        
        // 2. HTML 파일 경로 생성 및 내용 추출
        const htmlFileName = `${htmlId}.html`;
        const htmlFilePath = path.join(path.dirname(evaluationFilePath), htmlFileName);
        
        const { title, content } = extractContentFromHtml(htmlFilePath);
        
        // 3. Medicontent Posts 테이블에서 해당 post 찾기 (HTML ID로)
        const posts = await AirtableService.getPosts();
        const targetPost = posts.find(post => post.htmlId === htmlId);
        
        if (!targetPost) {
            throw new Error(`HTML ID "${htmlId}"에 해당하는 포스트를 찾을 수 없습니다.`);
        }
        
        // 4. 업데이트할 데이터 준비
        const updateData: any = {
            'Status': '작업 완료',
            'Title': title,
            'Content': content,
            'Updated At': new Date().toISOString()
        };
        
        // 5. SEO Score 또는 Legal Score 업데이트
        if (evalInfo.isSeoScore) {
            updateData['SEO Score'] = evalInfo.score;
            console.log(`📊 SEO Score 업데이트: ${evalInfo.score} (criteria: ${evalInfo.criteria})`);
        } else if (evalInfo.isLegalScore) {
            updateData['Legal Score'] = evalInfo.score;
            console.log(`⚖️ Legal Score 업데이트: ${evalInfo.score} (criteria: ${evalInfo.criteria})`);
        }
        
        // 6. Airtable 업데이트
        await AirtableService.updatePost(targetPost.id, updateData);
        
        console.log('✅ Medicontent Posts 업데이트 완료:', {
            postId: targetPost.id,
            title: title.substring(0, 50) + '...',
            contentLength: content.length,
            scoreType: evalInfo.isSeoScore ? 'SEO' : evalInfo.isLegalScore ? 'Legal' : 'None',
            score: evalInfo.score
        });
        
        return NextResponse.json({
            status: 'success',
            message: 'evaluation 결과가 성공적으로 처리되었습니다.',
            data: {
                postId: targetPost.id,
                htmlId,
                title,
                contentLength: content.length,
                scoreType: evalInfo.isSeoScore ? 'SEO' : evalInfo.isLegalScore ? 'Legal' : 'None',
                score: evalInfo.score,
                criteria: evalInfo.criteria
            }
        });
        
    } catch (error) {
        console.error('❌ evaluation 완료 처리 실패:', error);
        return NextResponse.json(
            { 
                error: 'evaluation 완료 처리에 실패했습니다.',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
