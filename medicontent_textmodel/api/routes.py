# medicontent_textmodel/api/routes.py - 수정된 버전
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import sys
import os
from pathlib import Path
import json
from datetime import datetime
import requests
from dotenv import load_dotenv
load_dotenv()

# agents 폴더를 Python 경로에 추가
current_dir = Path(__file__).parent.parent
sys.path.append(str(current_dir / "agents"))

router = APIRouter()

# ===== 특정 로그 검색 함수 =====
def find_specific_log(mode: str, target_case_id: str = None, target_post_id: str = None, 
                     target_date: str = None, target_log_path: str = None) -> Optional[dict]:
    """
    다양한 조건으로 특정 input_log를 찾아서 반환
    
    Args:
        mode: "use" 또는 "test"
        target_case_id: 찾을 case_id
        target_post_id: 찾을 postId 
        target_date: 찾을 날짜 (YYYYMMDD)
        target_log_path: 직접 지정할 로그 파일 경로
        
    Returns:
        찾은 로그 데이터(dict) 또는 None
    """
    
    try:
        # 1. 직접 로그 파일 경로가 지정된 경우
        if target_log_path:
            log_path = Path(target_log_path)
            if log_path.exists():
                with open(log_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list) and data:
                        return data[-1]  # 배열이면 마지막 원소
                    elif isinstance(data, dict):
                        return data
            return None
        
        # 2. 날짜별 검색 범위 설정
        search_dirs = []
        if target_date:
            # 특정 날짜 폴더만 검색
            date_dir = Path(f"test_logs/{mode}/{target_date}")
            if date_dir.exists():
                search_dirs = [date_dir]
        else:
            # 모든 날짜 폴더 검색 (최신순)
            mode_dir = Path(f"test_logs/{mode}")
            if mode_dir.exists():
                date_dirs = [d for d in mode_dir.iterdir() 
                           if d.is_dir() and d.name.isdigit() and len(d.name) == 8]
                search_dirs = sorted(date_dirs, reverse=True)  # 최신 날짜부터
        
        # 3. 각 검색 디렉토리에서 로그 파일 찾기
        for search_dir in search_dirs:
            log_files = sorted(list(search_dir.glob("*_input_logs.json")) + 
                             list(search_dir.glob("*_input_log.json")),
                             key=lambda x: x.stat().st_mtime, reverse=True)
            
            for log_file in log_files:
                try:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        logs_data = json.load(f)
                        
                    # 로그 데이터가 배열인 경우
                    if isinstance(logs_data, list):
                        for log_entry in reversed(logs_data):  # 최신 로그부터 검색
                            if _match_log_criteria(log_entry, target_case_id, target_post_id):
                                print(f"✅ 조건에 맞는 로그 발견: {log_file}")
                                return log_entry
                    
                    # 로그 데이터가 딕셔너리인 경우
                    elif isinstance(logs_data, dict):
                        if _match_log_criteria(logs_data, target_case_id, target_post_id):
                            print(f"✅ 조건에 맞는 로그 발견: {log_file}")
                            return logs_data
                            
                except Exception as e:
                    print(f"⚠️ 로그 파일 읽기 실패: {log_file} - {e}")
                    continue
        
        return None
        
    except Exception as e:
        print(f"❌ 로그 검색 중 오류: {e}")
        return None

def _match_log_criteria(log_entry: dict, target_case_id: str, target_post_id: str) -> bool:
    """로그 엔트리가 검색 조건과 일치하는지 확인"""
    if target_case_id and log_entry.get("case_id") == target_case_id:
        return True
    if target_post_id and log_entry.get("postId") == target_post_id:
        return True
    return False

# 요청 모델 (Post Data Requests 테이블 구조와 일치)
class ContentGenerationRequest(BaseModel):
    postId: str  # Medicontent Posts에서 가져온 Post ID
    conceptMessage: str = ""  # 질환 개념 강조 메시지
    patientCondition: str = ""  # 내원 시 환자 상태
    treatmentProcessMessage: str = ""  # 치료 과정 강조 메시지
    treatmentResultMessage: str = ""  # 치료 결과 강조 메시지
    additionalMessage: str = ""  # 추가 메시지
    beforeImages: List[Union[str, Dict[str, Any]]] = []  # 내원 시 사진 (문자열 또는 Airtable 객체)
    processImages: List[Union[str, Dict[str, Any]]] = []  # 치료 과정 사진 (문자열 또는 Airtable 객체)
    afterImages: List[Union[str, Dict[str, Any]]] = []  # 치료 결과 사진 (문자열 또는 Airtable 객체)
    beforeImagesText: str = ""  # 내원 시 사진 설명
    processImagesText: str = ""  # 치료 과정 사진 설명
    afterImagesText: str = ""  # 치료 결과 사진 설명
    includeEvaluation: bool = True  # Evaluation 실행 여부 (기본값: True)

# 헬퍼 함수: 이미지 데이터에서 filename 추출
def extract_filename(image_data: Union[str, Dict[str, Any]]) -> str:
    """이미지 데이터에서 filename을 추출합니다."""
    if isinstance(image_data, str):
        return image_data
    elif isinstance(image_data, dict):
        return image_data.get("filename", "")
    return ""

# Airtable 연동 함수들
async def save_to_post_data_requests(data: ContentGenerationRequest):
    """Post Data Requests 테이블에 저장"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        # Python Airtable 라이브러리 사용
        from pyairtable import Api
        
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Post Data Requests')
        
        # UI와 동일한 형태로 Post Data Requests 테이블에 저장
        current_time = datetime.now()
        record_data = {
            'Post ID': data.postId,
            'Concept Message': data.conceptMessage,
            'Patient Condition': data.patientCondition,
            'Treatment Process Message': data.treatmentProcessMessage,
            'Treatment Result Message': data.treatmentResultMessage,
            'Additional Message': data.additionalMessage,
            'Before Images': data.beforeImages if data.beforeImages else [],
            'Process Images': data.processImages if data.processImages else [],
            'After Images': data.afterImages if data.afterImages else [],
            'Before Images Texts': data.beforeImagesText,
            'Process Images Texts': data.processImagesText,
            'After Images Texts': data.afterImagesText,
            'Created At': current_time.strftime('%Y-%m-%d %H:%M:%S'),
            'Submitted At': current_time.strftime('%Y-%m-%d %H:%M'),
            'Status': '대기'
        }
        
        result = table.create(record_data)
        return result['id']  # 생성된 레코드 ID 반환
        
    except Exception as e:
        print(f"❌ Post Data Requests 저장 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

async def update_post_data_request_status(record_id: str, status: str, results: Dict = None):
    """Post Data Requests 상태 업데이트"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from pyairtable import Api
        
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Post Data Requests')
        
        update_data = {
            'Status': status
        }
        
        # 완료 시 결과 데이터를 새로운 필드에 저장
        if status == '완료' and results:
            import json
            import re
            
            # HTML 태그 제거 함수
            def strip_html(html_content):
                if not html_content:
                    return ''
                # HTML 태그 제거
                clean = re.sub(r'<[^>]+>', '', str(html_content))
                # 연속된 공백과 줄바꿈 정리
                clean = re.sub(r'\s+', ' ', clean).strip()
                return clean
            
            update_data.update({
                'Title': results.get('title', ''),
                'Content': strip_html(results.get('content', '')),  # HTML 태그 제거한 순수 텍스트
                'Plan': json.dumps(results.get('plan', {}), ensure_ascii=False, indent=2),  # JSON 문자열
                'Evaluation': ''  # 일단 비워둠
            })
        
        table.update(record_id, update_data)
        
    except Exception as e:
        print(f"❌ 상태 업데이트 실패: {str(e)}")
        raise

async def update_medicontent_post_status(post_id: str, status: str):
    """Medicontent Posts 테이블의 상태 업데이트"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from pyairtable import Api
        
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Medicontent Posts')
        
        print(f"🔍 Post ID 필드로 레코드 검색: {post_id}")
        
        # ✅ 올바른 방식: Post ID 필드 값으로 검색
        try:
            records = table.all(formula=f"{{Post Id}} = '{post_id}'")
            
            if not records:
                # 대체 검색: postId 필드로도 시도
                records = table.all(formula=f"{{postId}} = '{post_id}'")
                
            if not records:
                raise ValueError(f"Post ID {post_id}에 해당하는 레코드를 찾을 수 없습니다.")
                
            record = records[0]  # 첫 번째 매칭 레코드 사용
            print(f"✅ 레코드 발견: Post ID {post_id} → Record ID {record['id']}")
            
        except Exception as e:
            print(f"❌ Post ID {post_id}에 해당하는 레코드를 찾을 수 없음: {e}")
            raise ValueError(f"Post ID {post_id}에 해당하는 레코드를 찾을 수 없습니다.")
        
        current_time = datetime.now()
        
        # 업데이트 전 현재 상태 확인
        current_status = record['fields'].get('Status', 'N/A')
        print(f"📋 업데이트 전 상태: '{current_status}'")
        print(f"📋 업데이트할 상태: '{status}'")
        
        update_data = {
            'Status': status
        }
        # Updated At 필드는 Airtable에서 자동으로 계산되므로 수동 설정 불필요
        
        # Created At이 없는 경우 현재 시간으로 설정
        existing_created_at = record['fields'].get('Created At')
        if not existing_created_at:
            update_data['Created At'] = current_time.strftime('%Y-%m-%d %H:%M:%S')
            print(f"✅ Created At 필드 추가: {update_data['Created At']}")
        else:
            print(f"ℹ️ Created At 이미 존재: {existing_created_at}")
        
        print(f"🔄 실제 업데이트 요청: {update_data}")
        result = table.update(record['id'], update_data)
        print(f"🔍 업데이트 결과: {result}")
        
        # 업데이트 후 상태 재확인
        updated_record = table.get(record['id'])
        updated_status = updated_record['fields'].get('Status', 'N/A')
        print(f"📋 업데이트 후 상태: '{updated_status}'")
        
        if updated_status == status:
            print(f"✅ Medicontent Posts 상태 업데이트 성공: {record['id']} ({post_id}) → {status}")
        else:
            print(f"❌ Medicontent Posts 상태 업데이트 실패: 예상 '{status}', 실제 '{updated_status}'")
            raise Exception(f"상태 업데이트 실패: 예상 '{status}', 실제 '{updated_status}'")
        
    except Exception as e:
        print(f"❌ Medicontent Posts 상태 업데이트 실패: {str(e)}")
        raise

@router.get("/")
async def root():
    return {
        "service": "MediContent TextModel API",
        "version": "1.0.0",
        "status": "running",
        "description": "의료 컨텐츠 생성 및 평가 AI 시스템",
        "endpoints": {
            "health": "/health",
            "main_pipeline": "/api/all-agents", 
            "test_pipeline": "/api/half-agents",
            "input_processing": "/api/input-agent",
            "logs": "/api/logs/list"
        },
        "docs": "/docs"
    }

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "medicontent-textmodel"}










@router.post("/api/half-agents")
async def half_agents_pipeline(request: dict):
    """
    테스트용: Plan → Title → Content → Evaluation 파이프라인 실행
    - 최신 input_log를 읽어서 plan부터 evaluation까지 실행
    - 특정 로그 선택 지원: case_id, postId, 날짜 등으로 지정 가능
    """
    try:
        print("🚀 Half-Agents 파이프라인 실행 시작 (Plan → Title → Content → Evaluation)")
        
        # 환경변수 로드
        from dotenv import load_dotenv
        load_dotenv()
        
        # 에이전트들 import (함수 기반)
        from plan_agent import main as plan_main
        from title_agent import run as title_run
        from content_agent import run as content_run
        from evaluation_agent import run
        
        mode = request.get("mode", "use")
        input_data = request.get("input_data")  # None이면 최신 input_log 사용
        
        # ✨ 새로운 기능: 특정 로그 선택 옵션
        target_case_id = request.get("target_case_id")  # 특정 case_id 지정
        target_post_id = request.get("target_post_id")  # 특정 postId 지정
        target_date = request.get("target_date")        # 특정 날짜 지정 (YYYYMMDD)
        target_log_path = request.get("target_log_path") # 직접 로그 파일 경로 지정
        
        # 특정 로그 데이터 찾기 (DB 우선, 로그 파일 Fallback)
        if target_case_id or target_post_id or target_date or target_log_path:
            print(f"🔍 특정 로그 검색 중... case_id={target_case_id}, post_id={target_post_id}, date={target_date}")
            
            input_data = None
            
            # ✨ DB에서 먼저 시도 (postId가 있을 때만)
            if target_post_id:
                try:
                    print(f"📋 DB에서 Post Data Requests 조회: {target_post_id}")
                    input_data = await get_input_data_from_db(target_post_id)
                    if input_data:
                        print(f"✅ DB에서 데이터를 찾았습니다: case_id={input_data.get('case_id', 'N/A')}")
                    else:
                        print("⚠️ DB에서 데이터를 찾지 못함, 로그 파일에서 검색...")
                except Exception as e:
                    print(f"⚠️ DB 조회 실패: {e}, 로그 파일에서 검색...")
            
            # DB에서 못 찾으면 기존 로그 파일에서 찾기 (fallback)
            if not input_data:
                input_data = find_specific_log(mode, target_case_id, target_post_id, target_date, target_log_path)
                if input_data:
                    print(f"✅ 로그 파일에서 데이터를 찾았습니다: case_id={input_data.get('case_id', 'N/A')}")
                else:
                    print("❌ DB와 로그 파일 모두에서 데이터를 찾을 수 없습니다. 최신 로그를 사용합니다.")
                    input_data = None
        
        # Step 1: PlanAgent 실행
        print("🚀 Step 1: PlanAgent 실행...")
        plan = plan_main(mode='use', input_data=input_data)
        if not plan:
            raise Exception("Plan 생성 실패")
        
        # Step 2: TitleAgent 실행
        print("🚀 Step 2: TitleAgent 실행...")
        title = title_run(mode='use')
        if not title:
            raise Exception("Title 생성 실패")
        
        # Step 3: ContentAgent 실행
        print("🚀 Step 3: ContentAgent 실행...")
        content = content_run(mode='use')
        if not content:
            raise Exception("Content 생성 실패")
        
        full_article = content  # content_run에서 완성된 글을 반환
        
        # Step 5: EvaluationAgent 실행
        print("🚀 Step 5: EvaluationAgent 실행...")
        evaluation_result = run(
            criteria_mode="표준",
            max_loops=2,
            auto_yes=True,
            log_dir="test_logs/use",
            evaluation_mode="both"
        )
        
        print("✅ Half-Agents 파이프라인 완료!")
        
        return {
            "status": "success",
            "message": "Half-Agents 파이프라인 실행 완료",
            "results": {
                "title": title.get('title') if isinstance(title, dict) else str(title),
                "content": full_article,
                "plan": plan,
                "evaluation": {
                    "final_evaluation": evaluation_result if evaluation_result else "평가 실행됨"
                }
            }
        }
        
    except Exception as e:
        print(f"❌ Half-Agents 파이프라인 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/all-agents")
async def all_agents_pipeline(request: ContentGenerationRequest):
    """
    실제용: Input → Plan → Title → Content → Evaluation 전체 파이프라인
    UI 입력 → Post Data Requests 저장 → 텍스트 생성 → Evaluation → 결과 업데이트
    """
    
    record_id = None
    
    try:
        # 1단계: 이미 생성된 입력 로그 찾기
        print("📝 Step 1: 기존 입력 로그 찾기...")
        input_data = find_specific_log("use", target_post_id=request.postId)
        if not input_data:
            raise Exception(f"Post ID {request.postId}에 대한 입력 로그를 찾을 수 없습니다. input-only를 먼저 실행해주세요.")
        
        print(f"✅ 입력 로그 발견: case_id={input_data.get('case_id', 'N/A')}")
        
        # 2단계: 환경변수 로드
        from dotenv import load_dotenv
        load_dotenv()
        
        # 3단계: 상태를 '처리 중'으로 변경
        print("🔄 Step 2: 상태를 '처리 중'으로 변경...")
        from pyairtable import Api
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Post Data Requests')
        records = table.all(formula=f"{{Post ID}} = '{request.postId}'")
        if not records:
            raise Exception(f"Post ID {request.postId}에 대한 Post Data Requests 레코드를 찾을 수 없습니다.")
        record_id = records[0]['id']
        await update_post_data_request_status(record_id, '처리 중')
        
        # 4단계: 에이전트들 import (함수 기반)
        try:
            from plan_agent import main as plan_main
            from title_agent import run as title_run
            from content_agent import run as content_run
            from evaluation_agent import run as evaluation_run
            print("✅ 에이전트 모듈 import 완료")
        except ImportError as import_error:
            print(f"❌ 에이전트 import 실패: {import_error}")
            raise Exception(f"에이전트 모듈을 찾을 수 없습니다: {import_error}")
        
        print("🚀 Step 3: PlanAgent 실행...")
        plan = plan_main(mode='use')  # 이미 저장된 input 로그를 자동으로 찾아서 사용
        if not plan:
            raise Exception("Plan 생성 실패")
        
        print("🚀 Step 4: TitleAgent 실행...")
        title = title_run(mode='use')  # 이미 저장된 plan 로그를 자동으로 찾아서 사용
        if not title:
            raise Exception("Title 생성 실패")
        
        print("🚀 Step 5: ContentAgent 실행...")
        # ✨ Airtable 연동으로 content_agent 실행
        content = content_run(mode='use')
        if not content:
            raise Exception("Content 생성 실패")
        
        # title과 content 분리 (API에서는 title과 content 분리 필요)
        title = content.get("title", "")
        content_text = content.get("assembled_markdown", "")
        
        # content에서 첫 줄 제목 제거
        content_lines = content_text.split('\n')
        if content_lines and content_lines[0].strip() == title.strip():
            # 첫 줄이 제목과 같으면 제거하고, 그 다음 빈 줄도 제거
            content_lines = content_lines[1:]
            if content_lines and content_lines[0].strip() == '':
                content_lines = content_lines[1:]
            content_text = '\n'.join(content_lines)
        
        full_article = {
            "title": title,
            "content": content_text,
            "sections": content.get("sections", {}),
            "meta": content.get("meta", {})
        }
        
        # 7단계: EvaluationAgent 실행 (옵션)
        evaluation_result = None
        if request.includeEvaluation:
            print("🚀 Step 6: EvaluationAgent 실행...")
            evaluation_result = evaluation_run(
                criteria_mode="표준",
                max_loops=2,
                auto_yes=True,
                log_dir="test_logs/use",
                evaluation_mode="both"
            )
        else:
            print("⏩ Step 6: EvaluationAgent 건너뜀 (includeEvaluation=False)")
        
        print("✅ All-Agents 파이프라인 완료!")
        
        # 8단계: 결과를 Post Data Requests에 업데이트 (상태: 완료)
        # Title 추출 (title_agent의 selected.title 사용)
        print(f"🔍 Title 객체 타입: {type(title)}")
        if isinstance(title, dict):
            print(f"🔍 Title 객체 키들: {list(title.keys())}")
        
        extracted_title = ""
        if isinstance(title, dict):
            if 'selected' in title and isinstance(title['selected'], dict):
                extracted_title = title['selected'].get('title', '')
                print(f"🎯 Title 추출 방법: selected.title")
            elif 'title' in title:
                extracted_title = title.get('title', '')
                print(f"🎯 Title 추출 방법: title")
        else:
            extracted_title = str(title)
            print(f"🎯 Title 추출 방법: str() 변환")
        
        # Content 추출 (content_agent의 assembled_markdown 사용 - title_content_result.txt와 동일)
        print(f"🔍 Content 객체 타입: {type(content)}")
        if isinstance(content, dict):
            print(f"🔍 Content 객체 키들: {list(content.keys())}")
        
        extracted_content = ""
        if isinstance(content, dict):
            extracted_content = content.get('assembled_markdown', '')
            if extracted_content:
                print(f"🎯 Content 추출 방법: assembled_markdown (길이: {len(extracted_content)})")
            else:
                # assembled_markdown이 없을 경우 대체 방법
                print("⚠️ assembled_markdown 필드가 비어있음, 다른 필드 확인...")
                for key, value in content.items():
                    if isinstance(value, str) and len(value) > 100:  # 100자 이상의 문자열 필드
                        print(f"🔍 대체 가능한 필드: {key} (길이: {len(value)})")
        else:
            extracted_content = str(content)
            print(f"🎯 Content 추출 방법: str() 변환")
        
        results = {
            "title": extracted_title,
            "content": extracted_content,
            "plan": plan,
            "evaluation": {
                "final_evaluation": evaluation_result if evaluation_result else "평가 실행 안 함"
            }
        }
        
        print(f"💾 추출된 Title: '{extracted_title[:50]}{'...' if len(extracted_title) > 50 else ''}'")
        print(f"💾 추출된 Content 길이: {len(extracted_content)} 글자")
        
        print("💾 Step 7: 결과를 Airtable에 저장...")
        try:
            await update_post_data_request_status(record_id, '완료', results)
            print("✅ Post Data Requests 업데이트 완료")
        except Exception as update_error:
            print(f"❌ Post Data Requests 업데이트 실패: {update_error}")
            # 중요한 작업이므로 예외를 다시 발생시킴
            raise
        
        print("🔄 Step 8: Medicontent Posts 상태를 '작업 완료'로 업데이트...")
        try:
            await update_medicontent_post_status(request.postId, '작업 완료')
            print("✅ Medicontent Posts 상태 업데이트 완료")
        except Exception as medicontent_error:
            print(f"❌ Medicontent Posts 상태 업데이트 실패: {medicontent_error}")
            # Medicontent Posts 상태 업데이트 실패해도 전체 파이프라인은 성공으로 처리
            # 하지만 로그는 남김
        
        return {
            "status": "success",
            "message": "All-Agents 파이프라인 실행 완료",
            "record_id": record_id,
            "results": results
        }
        
    except Exception as e:
        print(f"❌ All-Agents 파이프라인 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        
        if record_id:
            try:
                await update_post_data_request_status(record_id, '대기', {
                    "error": str(e),
                    "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M')
                })
                print(f"ℹ️ 에러 발생으로 상태를 '대기'로 되돌림")
            except Exception as update_error:
                print(f"❌ 상태 업데이트도 실패: {update_error}")
        
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/logs/list")
async def get_logs_list(mode: str = "use", limit: int = 50):
    """
    로그 목록을 가져오는 API
    - 날짜별로 정리된 input_log 파일들의 목록과 간단한 정보 반환
    """
    try:
        print(f"🔍 로그 목록 조회 요청 (mode: {mode}, limit: {limit})")
        
        logs_info = []
        mode_dir = Path(f"test_logs/{mode}")
        
        if not mode_dir.exists():
            return {
                "status": "success",
                "message": f"{mode} 모드의 로그 폴더가 존재하지 않습니다.",
                "logs": []
            }
        
        # 날짜 폴더들 탐색 (최신순)
        date_dirs = sorted([d for d in mode_dir.iterdir() 
                          if d.is_dir() and d.name.isdigit() and len(d.name) == 8],
                         reverse=True)
        
        for date_dir in date_dirs:
            # 각 날짜 폴더의 input_log 파일들 탐색
            log_files = sorted(list(date_dir.glob("*_input_logs.json")) + 
                             list(date_dir.glob("*_input_log.json")),
                             key=lambda x: x.stat().st_mtime, reverse=True)
            
            for log_file in log_files:
                try:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        logs_data = json.load(f)
                    
                    # 파일 내의 각 로그 엔트리 정보 추출
                    if isinstance(logs_data, list):
                        for i, log_entry in enumerate(reversed(logs_data)):
                            log_info = _extract_log_info(log_entry, log_file, f"entry_{len(logs_data)-i}")
                            if log_info:
                                logs_info.append(log_info)
                                
                    elif isinstance(logs_data, dict):
                        log_info = _extract_log_info(logs_data, log_file, "single")
                        if log_info:
                            logs_info.append(log_info)
                    
                    # limit 체크
                    if len(logs_info) >= limit:
                        break
                        
                except Exception as e:
                    print(f"⚠️ 로그 파일 처리 실패: {log_file} - {e}")
                    continue
            
            if len(logs_info) >= limit:
                break
        
        # 시간순으로 정렬 (최신순)
        logs_info.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        print(f"✅ 로그 목록 조회 완료: {len(logs_info)}개 발견")
        
        return {
            "status": "success", 
            "message": f"{len(logs_info)}개의 로그를 찾았습니다.",
            "logs": logs_info[:limit]
        }
        
    except Exception as e:
        print(f"❌ 로그 목록 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=f"로그 목록 조회 실패: {str(e)}")

def _extract_log_info(log_entry: dict, log_file: Path, entry_id: str) -> dict:
    """로그 엔트리에서 UI에 표시할 요약 정보 추출"""
    try:
        return {
            "case_id": log_entry.get("case_id", "N/A"),
            "postId": log_entry.get("postId", "N/A"),  
            "timestamp": log_entry.get("timestamp", log_entry.get("created_at", "N/A")),
            "category": log_entry.get("category", "N/A"),
            "hospital_name": log_entry.get("hospital", {}).get("name", "N/A"),
            "concept_preview": log_entry.get("question1_concept", "")[:50] + "..." if log_entry.get("question1_concept") else "내용 없음",
            "status": log_entry.get("status", "unknown"),
            "file_path": str(log_file),
            "entry_id": entry_id,
            "date": log_file.parent.name  # 날짜 폴더명 (YYYYMMDD)
        }
    except Exception as e:
        print(f"⚠️ 로그 정보 추출 실패: {e}")
        return None


@router.post("/api/input-agent")
async def input_agent_only(request: dict):
    """
    UI에서 입력받은 데이터를 input_agent에만 전달하는 엔드포인트
    - DB 저장은 Next.js에서 처리
    - 백엔드는 로컬 로그 저장만 담당
    - 업데이트 모드 지원 (기존 로그 업데이트)
    """
    try:
        print("🔍 InputAgent 단독 실행 요청 받음")
        print(f"📝 받은 데이터: {json.dumps(request, ensure_ascii=False, indent=2)}")
        
        # 업데이트 모드 확인
        is_update = request.get("updateMode", False)
        existing_case_id = request.get("existingCaseId")
        
        print(f"🔄 업데이트 모드: {is_update}, 기존 case_id: {existing_case_id}")
        
        # input_agent 실행 (로컬 로그 저장)
        from input_agent import InputAgent
        
        # ✅ UI에서 보낸 실제 데이터는 request["input_data"] 안에 있음
        actual_input_data = request.get("input_data", request)  # input_data가 없으면 전체 request 사용
        input_agent = InputAgent(input_data=actual_input_data)
        
        if is_update:
            # 업데이트 모드: 기존 로그 업데이트
            
            # 기존 case_id 찾기 (existingCaseId가 있으면 사용, 없으면 postId로 찾기)
            if existing_case_id:
                target_case_id = existing_case_id
                print(f"📝 전달받은 case_id로 업데이트 시도: {target_case_id}")
            else:
                # postId를 기반으로 기존 case_id 찾기
                post_id = request.get("postId")
                if post_id:
                    target_case_id = input_agent.find_case_id_by_post_id(post_id, mode="use")
                    if target_case_id:
                        print(f"📝 postId로 찾은 case_id로 업데이트 시도: {target_case_id}")
                    else:
                        print(f"⚠️ postId {post_id}에 해당하는 기존 case_id를 찾을 수 없음")
                        target_case_id = None
                else:
                    print("⚠️ postId가 없어 기존 case_id를 찾을 수 없음")
                    target_case_id = None
            
            if target_case_id:
                # 새로운 데이터 준비
                result = input_agent.collect(mode="use")
                
                # 기존 로그 업데이트
                updated = input_agent.update_log(target_case_id, result, mode="use")
                
                if updated:
                    print("✅ 기존 로그 업데이트 성공")
                    
                    # isFinalSave가 true일 때만 Medicontent Posts 상태를 '리걸케어 작업 중'으로 변경
                    is_final_save = request.get("isFinalSave", False)
                    if "postId" in request and is_final_save:
                        try:
                            await update_medicontent_post_status(request["postId"], '리걸케어 작업 중')
                            print(f"✅ Medicontent Posts 상태 업데이트 완료 (최종 저장): {request['postId']} → '리걸케어 작업 중'")
                        except Exception as e:
                            print(f"⚠️ Medicontent Posts 상태 업데이트 실패: {e}")
                    elif "postId" in request:
                        print(f"ℹ️ 임시 저장이므로 상태 변경하지 않음: {request['postId']}")
                    
                    return {
                        "status": "success",
                        "message": "기존 로그 업데이트 완료",
                        "case_id": target_case_id,
                        "log_updated": True,
                        "log_saved": False
                    }
                else:
                    print("⚠️ 기존 로그를 찾을 수 없어 새로 저장됨")
                    
                    # isFinalSave가 true일 때만 Medicontent Posts 상태를 '리걸케어 작업 중'으로 변경
                    is_final_save = request.get("isFinalSave", False)
                    if "postId" in request and is_final_save:
                        try:
                            await update_medicontent_post_status(request["postId"], '리걸케어 작업 중')
                            print(f"✅ Medicontent Posts 상태 업데이트 완료 (최종 저장): {request['postId']} → '리걸케어 작업 중'")
                        except Exception as e:
                            print(f"⚠️ Medicontent Posts 상태 업데이트 실패: {e}")
                    elif "postId" in request:
                        print(f"ℹ️ 임시 저장이므로 상태 변경하지 않음: {request['postId']}")
                    
                    return {
                        "status": "success",
                        "message": "기존 로그를 찾을 수 없어 새로 저장됨",
                        "case_id": result.get("case_id"),
                        "log_updated": False,
                        "log_saved": True
                    }
            else:
                # target_case_id를 찾을 수 없는 경우 새로 저장
                print("⚠️ 업데이트할 대상을 찾을 수 없어 새로 저장")
                result = input_agent.collect(mode="use")
                
                # isFinalSave가 true일 때만 Medicontent Posts 상태를 '리걸케어 작업 중'으로 변경
                is_final_save = request.get("isFinalSave", False)
                if "postId" in request and is_final_save:
                    try:
                        await update_medicontent_post_status(request["postId"], '리걸케어 작업 중')
                        print(f"✅ Medicontent Posts 상태 업데이트 완료 (최종 저장): {request['postId']} → '리걸케어 작업 중'")
                    except Exception as e:
                        print(f"⚠️ Medicontent Posts 상태 업데이트 실패: {e}")
                elif "postId" in request:
                    print(f"ℹ️ 임시 저장이므로 상태 변경하지 않음: {request['postId']}")
                
                return {
                    "status": "success",
                    "message": "업데이트할 대상을 찾을 수 없어 새로 저장됨",
                    "case_id": result.get("case_id"),
                    "log_updated": False,
                    "log_saved": True
                }
        else:
            # 새로 저장 모드
            result = input_agent.collect(mode="use")
            
            print("✅ InputAgent 실행 완료 (로컬 로그 저장됨)")
            print(f"📤 결과: case_id={result.get('case_id', 'N/A')}")
            
            # isFinalSave가 true일 때만 Medicontent Posts 상태를 '리걸케어 작업 중'으로 변경
            is_final_save = request.get("isFinalSave", False)
            if "postId" in request and is_final_save:
                try:
                    await update_medicontent_post_status(request["postId"], '리걸케어 작업 중')
                    print(f"✅ Medicontent Posts 상태 업데이트 완료 (최종 저장): {request['postId']} → '리걸케어 작업 중'")
                except Exception as e:
                    print(f"⚠️ Medicontent Posts 상태 업데이트 실패: {e}")
            elif "postId" in request:
                print(f"ℹ️ 임시 저장이므로 상태 변경하지 않음: {request['postId']}")
            
            return {
                "status": "success",
                "message": "input_agent 실행 완료 - 로컬 로그 저장됨",
                "case_id": result.get("case_id"),
                "log_saved": True,
                "log_updated": False
            }
        
    except Exception as e:
        print(f"❌ InputAgent 실행 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "status": "error", 
            "message": f"input_agent 실행 실패: {str(e)}",
            "log_saved": False,
            "log_updated": False
        }

# ===== DB 처리 함수들 =====

async def get_input_data_from_db(target_id: str) -> Optional[dict]:
    """
    DB(Airtable)의 Post Data Requests에서 해당 ID의 최신 데이터를 가져와서
    input_agent 형식으로 변환하여 반환
    
    Args:
        target_id: 검색할 ID (레코드 ID 또는 Post ID)
        
    Returns:
        input_agent 형식의 딕셔너리 또는 None
    """
    try:
        from pyairtable import Api
        import re
        
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        base_id = os.getenv('AIRTABLE_BASE_ID')
        
        if not api or not base_id:
            return None
        
        # ✅ 단순화: target_id를 그대로 Post ID로 사용
        actual_post_id = target_id
        
        # ✅ Post Data Requests 검색
        data_requests_table = api.table(base_id, 'Post Data Requests')
        
        # ✅ Post Data Requests 테이블에서 정확한 필드명으로 검색
        try:
            all_records = data_requests_table.all()
            records = []
            
            for record in all_records:
                fields = record['fields']
                # Post Data Requests의 정확한 필드명: 'Post ID' (모두 대문자)
                stored_post_id = fields.get('Post ID')  # Post Data Requests는 'Post ID'
                
                if stored_post_id == actual_post_id:
                    records.append(record)
                    break
                    
        except Exception as e:
            return None
                
        if not records:
            return None
            
        # 최신 레코드 선택 (created_time 기준)
        latest_record = max(records, key=lambda x: x.get('createdTime', ''))
        record_data = latest_record['fields']
        record_id = latest_record['id']  # 프록시 URL 생성용
        
        print(f"🔍 Post Data Requests 데이터:")
        print(f"  - Record ID: {record_id}")
        print(f"  - Before Images: {len(record_data.get('Before Images', []))}개")
        print(f"  - Process Images: {len(record_data.get('Process Images', []))}개")  
        print(f"  - After Images: {len(record_data.get('After Images', []))}개")
        
        # Hospital 정보 가져오기
        hospital_table = api.table(base_id, 'Hospital')
        hospital_records = hospital_table.all()
        
        if not hospital_records:
            return None
            
        hospital_info = hospital_records[0]['fields']  # 첫 번째 병원 정보 사용
        
        # input_agent 형식으로 변환
        hospital_name = hospital_info.get("hospitalName", "")
        sanitized_name = re.sub(r'[^가-퟈a-zA-Z0-9]', '_', hospital_name)
        sanitized_name = re.sub(r'_+', '_', sanitized_name).strip('_').lower()
        
        input_data = {
            "hospital": {
                "name": hospital_name,
                "save_name": sanitized_name,
                "address": f"{hospital_info.get('addressLine1', '')} {hospital_info.get('addressLine2', '')}".strip(),
                "phone": hospital_info.get("phone", "")
            },
            "category": record_data.get("treatmentType", "임플란트"),
            "question1_concept": record_data.get("Concept Message") or record_data.get("conceptMessage", ""),
            "question2_condition": record_data.get("Patient Condition") or record_data.get("patientCondition", ""),
            "question3_visit_images": convert_attachments_to_images(
                record_data.get("Before Images") or record_data.get("beforeImages", []),
                record_data.get("Before Images Texts") or record_data.get("beforeImagesText", ""),
                record_id
            ),
            "question4_treatment": record_data.get("Treatment Process Message") or record_data.get("treatmentProcessMessage", ""),
            "question5_therapy_images": convert_attachments_to_images(
                record_data.get("Process Images") or record_data.get("processImages", []),
                record_data.get("Process Images Texts") or record_data.get("processImagesText", ""),
                record_id
            ),
            "question6_result": record_data.get("Treatment Result Message") or record_data.get("treatmentResultMessage", ""),
            "question7_result_images": convert_attachments_to_images(
                record_data.get("After Images") or record_data.get("afterImages", []),
                record_data.get("After Images Texts") or record_data.get("afterImagesText", ""),
                record_id
            ),
            "question8_extra": record_data.get("Additional Message") or record_data.get("additionalMessage", ""),
            "include_tooth_numbers": False,
            "tooth_numbers": [],
            "persona_candidates": [],
            "representative_persona": "",
            "postId": actual_post_id,
            "case_id": record_data.get("case_id") or f"db_{actual_post_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": record_data.get("createdTime", datetime.now().isoformat()),
            "mode": "use",
            "status": "from_db"
        }
        
        print(f"✅ InputAgent 데이터 변환 완료:")
        print(f"  - case_id: {input_data['case_id']}")
        print(f"  - postId: {input_data['postId']}")
        print(f"  - 텍스트 필드: {len([k for k, v in input_data.items() if k.startswith('question') and isinstance(v, str) and v])}개")
        print(f"  - 이미지 필드: {len([k for k, v in input_data.items() if k.endswith('_images') and v])}개")
        
        return input_data
        
    except Exception as e:
        return None


def convert_attachments_to_images(attachments, descriptions_text: str = "", record_id: str = ""):
    """
    Airtable attachment 배열을 input_agent의 이미지 형식으로 변환
    
    Args:
        attachments: Airtable attachment 객체 리스트
        descriptions_text: 쉼표로 구분된 설명 텍스트
        record_id: Airtable record ID (프록시 URL 생성용)
        
    Returns:
        input_agent 형식의 이미지 리스트
    """
    if not attachments:
        return []
    
    # 설명 텍스트를 이미지 개수만큼 분리
    descriptions = []
    if descriptions_text:
        descriptions = [desc.strip() for desc in descriptions_text.split(',')]
    
    result = []
    for i, attachment in enumerate(attachments):
        if not isinstance(attachment, dict):
            continue
        
        # 🔍 디버깅: attachment 기본 정보
        print(f"🔍 Attachment {i+1}: {attachment.get('filename', 'NO_FILENAME')} (ID: {attachment.get('id', 'NO_ID')})")
        print(f"    Available fields: {list(attachment.keys())}")
            
        description = descriptions[i] if i < len(descriptions) else ""
        filename = attachment.get("filename", f"image_{i+1}.jpg")
        
        image_info = {
            "filename": filename,
            "description": description
        }
        
        # 🔧 Airtable URL 우선 추출 (강화된 로직)
        attachment_id = attachment.get("id", "")
        attachment_url = None
        
        # 1순위: 직접 attachment.url 확인
        if attachment.get("url"):
            attachment_url = attachment["url"]
            print(f"✅ 직접 URL 발견: {attachment_url}")
            
        # 2순위: thumbnails에서 URL 찾기
        elif attachment.get("thumbnails"):
            thumbnails = attachment["thumbnails"]
            if thumbnails.get("large", {}).get("url"):
                attachment_url = thumbnails["large"]["url"]
                print(f"✅ Large thumbnail URL 발견: {attachment_url}")
            elif thumbnails.get("small", {}).get("url"):
                attachment_url = thumbnails["small"]["url"] 
                print(f"✅ Small thumbnail URL 발견: {attachment_url}")
            elif thumbnails.get("full", {}).get("url"):
                attachment_url = thumbnails["full"]["url"]
                print(f"✅ Full thumbnail URL 발견: {attachment_url}")
                
        # 3순위: 프록시 URL 생성 (fallback)
        elif record_id and attachment_id:
            proxy_url = f"/airtable/attachments/{record_id}/images/{i}"
            attachment_url = proxy_url
            print(f"⚠️ 실제 URL 없음, 프록시 URL 생성: {proxy_url}")
            
        else:
            print(f"❌ 모든 URL 추출 실패:")
            print(f"  - record_id: {record_id}")
            print(f"  - attachment_id: {attachment_id}")
            print(f"  - attachment keys: {list(attachment.keys())}")
            if attachment.get("thumbnails"):
                print(f"  - thumbnails keys: {list(attachment['thumbnails'].keys())}")
            print(f"🔍 전체 구조: {json.dumps(attachment, indent=2)}")
            continue
            
        # attachment_url이 있는 경우에만 여기까지 도달
        image_info["url"] = attachment_url
        image_info["path"] = attachment_url
        image_info["record_id"] = record_id
        image_info["attachment_id"] = attachment_id
        
        result.append(image_info)
    
    return result


def get_emote_images_from_db(active_only: bool = True) -> list[dict]:
    """
    Airtable 'Emote Images' 테이블에서 이모트 이미지를 가져옵니다.
    """
    try:
        from pyairtable import Api
        
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        base_id = os.getenv('AIRTABLE_BASE_ID')
        table = api.table(base_id, 'Emote Images')
        
        # Active 필드가 빈 값이므로 필터링 없이 모든 레코드 가져오기
        records = table.all()
        
        results = []
        for rec in records:
            fields = rec.get("fields", {})
            file_info = fields.get("File", [])
            
            # 🔧 강화된 URL 추출 (Emote Images용)
            attachment_url = ""
            filename = ""
            
            if file_info:
                attachment = file_info[0]
                filename = attachment.get("filename", "")
                
                # 1순위: 직접 URL 확인
                if attachment.get("url"):
                    attachment_url = attachment["url"]
                    print(f"✅ Emote 직접 URL 발견: {attachment_url}")
                    
                # 2순위: thumbnails에서 URL 찾기
                elif attachment.get("thumbnails"):
                    thumbnails = attachment["thumbnails"]
                    if thumbnails.get("large", {}).get("url"):
                        attachment_url = thumbnails["large"]["url"]
                        print(f"✅ Emote Large thumbnail URL 발견: {attachment_url}")
                    elif thumbnails.get("small", {}).get("url"):
                        attachment_url = thumbnails["small"]["url"]
                        print(f"✅ Emote Small thumbnail URL 발견: {attachment_url}")
                    elif thumbnails.get("full", {}).get("url"):
                        attachment_url = thumbnails["full"]["url"]
                        print(f"✅ Emote Full thumbnail URL 발견: {attachment_url}")
                    else:
                        print(f"⚠️ Emote thumbnails 있지만 URL 없음: {list(thumbnails.keys())}")
                else:
                    print(f"❌ Emote URL 없음: {filename}")
                    print(f"  - Available keys: {list(attachment.keys())}")
            
            results.append({
                "name": fields.get("Name", ""),
                "emotion": fields.get("Emotion", ""),
                "animal": fields.get("Animal", ""),
                "filename": filename,
                "url": attachment_url,
                "path": attachment_url,  # UI 모드에서 사용할 path 설정
                "id": rec.get("id", "")
            })
        
        return results
        
    except Exception as e:
        print(f"❌ Emote Images 연결 오류: {str(e)}")
        return []

# ===== 이미지 URL 테스트용 엔드포인트 =====
@router.get("/images")
def get_images(field: str = "Images"):
    """Airtable에서 직접 이미지 URL을 가져오는 테스트 엔드포인트"""
    BASE_ID = os.getenv('AIRTABLE_BASE_ID')
    TABLE_NAME = "Post Data Requests"  # 기본 테이블명
    AIRTABLE_TOKEN = os.getenv('AIRTABLE_API_KEY')
    
    if not all([BASE_ID, AIRTABLE_TOKEN]):
        raise HTTPException(status_code=500, detail="Airtable 설정이 누락되었습니다")
    
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"
    headers = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}
    
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        results = []
        for record in data.get("records", []):
            files = record.get("fields", {}).get(field, [])
            urls = [f["url"] for f in files if "url" in f]
            
            # 프록시 URL도 생성해서 표시
            proxy_urls = []
            for i, file in enumerate(files):
                if file.get("id"):
                    proxy_url = f"/airtable/attachments/{record['id']}/images/{i}"
                    proxy_urls.append(proxy_url)
            
            results.append({
                "record_id": record["id"],
                "field_name": field,
                "direct_urls": urls,
                "proxy_urls": proxy_urls,
                "total_files": len(files),
                "urls_found": len(urls),
                "proxy_urls_generated": len(proxy_urls)
            })
        return results
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Airtable API 오류: {str(e)}")

