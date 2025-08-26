# medicontent_textmodel/api/routes.py - 수정된 버전
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
from pathlib import Path
import json
from datetime import datetime
import requests

# agents 폴더를 Python 경로에 추가
current_dir = Path(__file__).parent.parent
sys.path.append(str(current_dir / "agents"))

router = APIRouter()

# 요청 모델 (Post Data Requests 테이블 구조와 일치)
class ContentGenerationRequest(BaseModel):
    postId: str  # Medicontent Posts에서 가져온 Post ID
    conceptMessage: str = ""  # 질환 개념 강조 메시지
    patientCondition: str = ""  # 내원 시 환자 상태
    treatmentProcessMessage: str = ""  # 치료 과정 강조 메시지
    treatmentResultMessage: str = ""  # 치료 결과 강조 메시지
    additionalMessage: str = ""  # 추가 메시지
    beforeImages: List[str] = []  # 내원 시 사진 (attachment IDs)
    processImages: List[str] = []  # 치료 과정 사진 (attachment IDs)
    afterImages: List[str] = []  # 치료 결과 사진 (attachment IDs)
    beforeImagesText: str = ""  # 내원 시 사진 설명
    processImagesText: str = ""  # 치료 과정 사진 설명
    afterImagesText: str = ""  # 치료 결과 사진 설명

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
        
        # 완료 시 결과 데이터 추가
        if status == '완료' and results:
            update_data.update({
                'Generated Title': results.get('title', ''),
                'Generated Content': results.get('content', ''),
                'Completed At': datetime.now().strftime('%Y-%m-%d %H:%M')
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
        
        print(f"🔍 PostID로 레코드 검색: {post_id}")
        
        # ⭐ Post Data Requests의 Post ID는 post_recXXXXXX 형태
        # Medicontent Posts의 record ID는 recXXXXXX 형태
        # 따라서 post_ 접두사를 제거해서 실제 record ID로 직접 조회
        if post_id.startswith('post_'):
            record_id = post_id[5:]  # post_recXXXXXX → recXXXXXX
        else:
            record_id = post_id
            
        print(f"🔍 추출된 Record ID: {record_id}")
        
        try:
            record = table.get(record_id)
            print(f"✅ 레코드 발견: PostID {post_id} → Record ID {record_id}")
        except Exception as e:
            print(f"❌ Record ID {record_id}에 해당하는 레코드를 찾을 수 없음: {e}")
            raise ValueError(f"Record ID {record_id}에 해당하는 레코드를 찾을 수 없습니다.")
        
        current_time = datetime.now()
        update_data = {
            'Status': status,
            'Updated At': current_time.strftime('%Y-%m-%d %H:%M')
        }
        
        # Created At이 없는 경우 현재 시간으로 설정
        existing_created_at = record['fields'].get('Created At')
        if not existing_created_at:
            update_data['Created At'] = current_time.strftime('%Y-%m-%d %H:%M:%S')
            print(f"✅ Created At 필드 추가: {update_data['Created At']}")
        else:
            print(f"ℹ️ Created At 이미 존재: {existing_created_at}")
        
        table.update(record_id, update_data)
        print(f"✅ Medicontent Posts 상태 업데이트 완료: {record_id} ({post_id}) → {status}")
        
    except Exception as e:
        print(f"❌ Medicontent Posts 상태 업데이트 실패: {str(e)}")
        raise

@router.get("/")
async def root():
    return {"message": "MediContent TextModel API Routes"}

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "medicontent-textmodel"}

@router.post("/api/medicontent/update-post-status")
async def update_post_status_endpoint(request: Dict[str, str]):
    """PostID 선택 시 Medicontent Posts 상태 업데이트"""
    try:
        post_id = request.get('postId')
        status = request.get('status', '병원 작업 중')
        
        print(f"🔄 PostID 상태 업데이트: {post_id} → {status}")
        
        await update_medicontent_post_status(post_id, status)
        
        return {
            "status": "success",
            "message": f"상태가 '{status}'로 업데이트되었습니다.",
            "postId": post_id
        }
        
    except Exception as e:
        print(f"❌ 상태 업데이트 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="상태 업데이트에 실패했습니다.")


@router.post("/api/generate-content-complete")
async def generate_content_complete(request: ContentGenerationRequest):
    """완전한 워크플로우: UI 입력 → Post Data Requests 저장 → 텍스트 생성 → 결과 업데이트"""
    
    record_id = None
    
    try:
        # 1단계: Post Data Requests에 저장 (상태: 대기)
        print("📝 Step 1: Post Data Requests에 저장...")
        record_id = await save_to_post_data_requests(request)
        print(f"✅ 레코드 생성 완료: {record_id}")
        
        # 2단계: 상태를 '처리 중'으로 변경
        print("🔄 Step 2: 상태를 '처리 중'으로 변경...")
        await update_post_data_request_status(record_id, '처리 중')
        
        # 3단계: 환경변수 로드
        from dotenv import load_dotenv
        load_dotenv()
        
        # 4단계: 에이전트들 import
        from input_agent import InputAgent
        from plan_agent import PlanAgent
        from title_agent import TitleAgent
        from content_agent import ContentAgent
        
        # 5단계: Settings - Hospital 테이블에서 병원 정보 조회
        from pyairtable import Api
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        hospital_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Hospital')
        
        # 단일 병원 정보 조회 (첫 번째 레코드)
        try:
            hospital_records = hospital_table.all()
            if hospital_records:
                hospital_record = hospital_records[0]['fields']
                hospital_name = hospital_record.get('Hospital Name', '병원')
                hospital_address = hospital_record.get('Address', '')
                hospital_phone = hospital_record.get('Phone', '')
            else:
                raise Exception("Hospital 테이블에 데이터가 없음")
        except Exception as e:
            print(f"⚠️ Settings - Hospital 테이블 조회 실패: {e}, 기본값 사용")
            hospital_name = "내이튼치과의원"
            hospital_address = "B동 507호 라스플로레스 경기도 화성시 동탄대로 537"
            hospital_phone = "031-526-2246"
        
        # 이미지 설명 분리 함수 (쉼표와 줄바꿈 모두 지원)
        def split_descriptions(text: str, count: int) -> List[str]:
            if not text.strip():
                return ["" for _ in range(count)]
            
            # 쉼표와 줄바꿈으로 분리
            import re
            # 쉼표나 줄바꿈으로 분리하되, 연속된 구분자는 하나로 처리
            parts = re.split(r'[,\n]+', text)
            # 빈 문자열 제거하고 양쪽 공백 제거
            descriptions = [part.strip() for part in parts if part.strip()]
            
            # count만큼 결과 리스트 구성
            result = []
            for i in range(count):
                result.append(descriptions[i] if i < len(descriptions) else "")
            return result
        
        # UI 데이터를 InputAgent 형식으로 변환
        input_data = {
            "hospital": {
                "name": hospital_name,
                "save_name": hospital_name,
                "address": hospital_address,
                "phone": hospital_phone
            },
            "category": "일반진료",
            "question1_concept": request.conceptMessage,
            "question2_condition": request.patientCondition,
            "question3_visit_images": [
                {"filename": img, "description": desc}
                for img, desc in zip(
                    request.beforeImages,
                    split_descriptions(request.beforeImagesText, len(request.beforeImages))
                )
            ],
            "question4_treatment": request.treatmentProcessMessage,
            "question5_therapy_images": [
                {"filename": img, "description": desc}
                for img, desc in zip(
                    request.processImages,
                    split_descriptions(request.processImagesText, len(request.processImages))
                )
            ],
            "question6_result": request.treatmentResultMessage,
            "question7_result_images": [
                {"filename": img, "description": desc}
                for img, desc in zip(
                    request.afterImages,
                    split_descriptions(request.afterImagesText, len(request.afterImages))
                )
            ],
            "question8_extra": request.additionalMessage,
            "include_tooth_numbers": False,
            "tooth_numbers": [],
            "persona_candidates": [],
            "representative_persona": ""
        }
        
        # 6단계: 전체 파이프라인 실행
        print("🚀 Step 3: InputAgent 실행...")
        input_agent = InputAgent(input_data=input_data)
        input_result = input_agent.collect(mode="use")
        
        print("🚀 Step 4: PlanAgent 실행...")
        plan_agent = PlanAgent()
        plan, plan_candidates, plan_eval_info, _ = plan_agent.generate(
            input_data=input_result,
            mode='cli',
            rounds=2
        )
        
        print("🚀 Step 5: TitleAgent 실행...")
        title_agent = TitleAgent()
        title, title_candidates, title_eval_info, _ = title_agent.generate(
            input_data=plan,
            mode='cli',
            rounds=2
        )
        
        print("🚀 Step 6: ContentAgent 실행...")
        content_agent = ContentAgent()
        content, content_candidates, content_eval_info, _ = content_agent.generate(
            input_data={**input_result, **plan, 'title': title},
            mode='use'
        )
        
        # 7단계: 전체 글 생성
        full_article = content_agent.format_full_article(
            content, 
            input_data={**input_result, **plan, 'title': title}
        )
        
        print("✅ 텍스트 생성 완료!")
        
        # 8단계: 결과를 Post Data Requests에 업데이트 (상태: 완료)
        results = {
            "title": title.get('title') if isinstance(title, dict) else str(title),
            "content": full_article,
            "plan": plan,
            "evaluation": {
                "plan_evaluation": plan_eval_info,
                "title_evaluation": title_eval_info,
                "content_evaluation": content_eval_info
            }
        }
        
        print("💾 Step 7: 결과를 Airtable에 저장...")
        await update_post_data_request_status(record_id, '완료', results)
        
        print("💾 Step 7: 결과를 Airtable에 저장...")
        await update_post_data_request_status(record_id, '완료', results)
        
        # ⭐ 여기에 추가!
        print("🔄 Step 8: Medicontent Posts 상태를 '리걸케어 작업 중'으로 업데이트...")
        await update_medicontent_post_status(request.postId, '리걸케어 작업 중')
        
        return {
            "status": "success",
            "postId": request.postId,
            "recordId": record_id,
            "results": results,
            "message": "메디컨텐츠 생성 및 DB 저장 완료!"
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ 오류 발생: {str(e)}")
        print(f"상세: {error_details}")
        
        # 오류 발생 시 상태를 '대기'로 되돌리기
        if record_id:
            try:
                await update_post_data_request_status(record_id, '대기')
            except:
                pass
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": f"텍스트 생성 실패: {str(e)}",
                "details": error_details,
                "recordId": record_id
            }
        )

@router.post("/api/evaluate-content")
async def evaluate_content(request: Dict[str, Any]):
    """생성된 콘텐츠 평가"""
    try:
        from evaluation_agent import EvaluationAgent
        
        # 평가 실행
        evaluation_agent = EvaluationAgent()
        # evaluation_result = evaluation_agent.run(...)
        
        return {
            "status": "success",
            "evaluation": "평가 결과",
            "message": "평가 완료"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
from fastapi import BackgroundTasks
import asyncio

@router.post("/api/trigger-text-generation")
async def trigger_text_generation(request: Dict[str, str], background_tasks: BackgroundTasks):
    """텍스트 생성을 백그라운드에서 실행하도록 트리거"""
    try:
        post_id = request.get('postId')
        
        # 백그라운드 작업으로 텍스트 생성 실행
        background_tasks.add_task(generate_and_update_content, post_id)
        
        return {
            "status": "success", 
            "message": "텍스트 생성이 백그라운드에서 시작되었습니다.",
            "postId": post_id
        }
        
    except Exception as e:
        print(f"❌ 백그라운드 작업 트리거 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# async def generate_and_update_content(post_id: str):
#     """백그라운드에서 실행되는 텍스트 생성 + Medicontent Posts 업데이트"""
#     try:
#         print(f"🚀 백그라운드 텍스트 생성 시작: {post_id}")
        
#         # 1. Post Data Requests에서 데이터 조회
#         from dotenv import load_dotenv
#         load_dotenv()
        
#         from pyairtable import Api
#         api = Api(os.getenv('AIRTABLE_API_KEY'))
#         post_data_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Post Data Requests')
        
#         # postId로 데이터 검색
#         records = post_data_table.all(formula=f"{{Post ID}} = '{post_id}'")
        
#         if not records:
#             print(f"❌ Post Data Requests에서 {post_id} 데이터를 찾을 수 없음")
#             return
        
#         record = records[0]
        
#         # 2. 텍스트 생성 파이프라인 실행
#         input_data = {
#             "hospital": {
#                 "name": "테스트 병원",
#                 "save_name": "test_hospital", 
#                 "address": "서울특별시 강남구",
#                 "phone": "02-1234-5678"
#             },
#             "category": "일반진료",
#             "question1_concept": record['fields'].get('Concept Message', ''),
#             "question2_condition": record['fields'].get('Patient Condition', ''),
#             "question3_visit_images": [{"filename": img.strip(), "description": ""} 
#                                      for img in (record['fields'].get('Before Images', '') or '').split(',') if img.strip()],
#             "question4_treatment": record['fields'].get('Treatment Process Message', ''),
#             "question5_therapy_images": [{"filename": img.strip(), "description": ""} 
#                                        for img in (record['fields'].get('Process Images', '') or '').split(',') if img.strip()],
#             "question6_result": record['fields'].get('Treatment Result Message', ''),
#             "question7_result_images": [{"filename": img.strip(), "description": ""} 
#                                       for img in (record['fields'].get('After Images', '') or '').split(',') if img.strip()],
#             "question8_extra": record['fields'].get('Additional Message', ''),
#             "include_tooth_numbers": False,
#             "tooth_numbers": [],
#             "persona_candidates": [],
#             "representative_persona": ""
#         }
        
#         # 에이전트들 실행
#         from input_agent import InputAgent
#         from plan_agent import PlanAgent
#         from title_agent import TitleAgent
#         from content_agent import ContentAgent
        
#         print("🔄 InputAgent 실행...")
#         input_agent = InputAgent(input_data=input_data)
#         input_result = input_agent.collect(mode="use")
        
#         print("🔄 PlanAgent 실행...")
#         plan_agent = PlanAgent()
#         plan, plan_candidates, plan_eval_info, _ = plan_agent.generate(
#             input_data=input_result, mode='cli', rounds=2
#         )
        
#         print("🔄 TitleAgent 실행...")
#         title_agent = TitleAgent()
#         title, title_candidates, title_eval_info, _ = title_agent.generate(
#             input_data=plan, mode='cli', rounds=2
#         )
        
#         print("🔄 ContentAgent 실행...")
#         content_agent = ContentAgent()
#         content, content_candidates, content_eval_info, _ = content_agent.generate(
#             input_data={**input_result, **plan, 'title': title}, mode='use'
#         )
        
#         # 전체 글 생성
#         full_article = content_agent.format_full_article(
#             content, input_data={**input_result, **plan, 'title': title}
#         )
        
#         # 3. Medicontent Posts 업데이트
#         medicontent_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Medicontent Posts')
        
#         # postId에서 실제 record ID 추출
#         record_id = post_id
#         if post_id.startswith('post_'):
#             record_id = post_id[5:]
        
#         # 생성된 결과로 업데이트
#         generated_title = title.get('title') if isinstance(title, dict) else str(title)
#         generated_keywords = input_result.get('primary_category', '일반진료')  # 임시
#         generated_treatment_type = input_result.get('primary_category', '일반진료')
        
#         update_data = {
#             'Title': generated_title,
#             'Keywords': generated_keywords,
#             'Treatment Type': generated_treatment_type,
#             'Content': full_article,
#             'Updated At': datetime.now().strftime('%Y-%m-%d %H:%M')
#         }
        
#         medicontent_table.update(record_id, update_data)
        
#         print(f"✅ 백그라운드 텍스트 생성 완료: {post_id}")
#         print(f"   제목: {generated_title}")
#         print(f"   카테고리: {generated_treatment_type}")
        
#     except Exception as e:
#         import traceback
#         error_details = traceback.format_exc()
#         print(f"❌ 백그라운드 텍스트 생성 실패: {str(e)}")
#         print(f"상세: {error_details}")

async def generate_and_update_content(post_id: str):
    """postid만 받아서 DB에서 데이터 조회 → 텍스트 생성"""
    try:
        print(f"🚀 PostID로 텍스트 생성 시작: {post_id}")
        
        # ⭐ 간단하게: postid만 전달
        input_data = {"postId": post_id}
        
        # InputAgent가 알아서 DB에서 데이터 가져오도록
        from input_agent import InputAgent
        input_agent = InputAgent(input_data=input_data)
        input_result = input_agent.collect(mode="use")
        
        # 나머지 plan/title/content 생성은 기존과 동일...
        
    except Exception as e:
        print(f"❌ PostID 텍스트 생성 실패: {str(e)}")

@router.post("/api/plan-agent")
async def plan_agent_only(request: dict):
    """
    PlanAgent 단독 실행 엔드포인트
    - 최신 input_log를 읽어서 plan 생성
    - 또는 input_data를 직접 전달받아 plan 생성
    """
    try:
        print("🔍 PlanAgent 단독 실행 요청 받음")
        print(f"📝 받은 데이터: {json.dumps(request, ensure_ascii=False, indent=2)}")
        
        # plan_agent import 및 실행
        from agents.plan_agent import main as plan_main
        
        # 모드 설정 (기본값: use)
        mode = request.get("mode", "use")
        
        # input_data가 있으면 전달, 없으면 None (최신 input_log 사용)
        input_data = request.get("input_data")
        
        print(f"🔄 PlanAgent 실행 중... (mode: {mode})")
        
        # plan_agent 실행
        plan_result = plan_main(mode=mode, input_data=input_data)
        
        if plan_result is None:
            return {
                "status": "error",
                "message": "PlanAgent 실행 실패 - input_log를 찾을 수 없거나 생성에 실패했습니다."
            }
        
        print("✅ PlanAgent 실행 완료")
        print(f"📤 plan 결과 미리보기: title_plan={plan_result.get('title_plan', {}).get('guidance', 'N/A')}")
        
        return {
            "status": "success",
            "message": "PlanAgent 실행 완료 - 로컬 로그 저장됨",
            "plan_result": plan_result,
            "case_id": plan_result.get("meta", {}).get("case_id"),
            "timestamp": plan_result.get("meta", {}).get("timestamp")
        }
        
    except Exception as e:
        print(f"❌ PlanAgent 실행 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "status": "error",
            "message": f"PlanAgent 실행 실패: {str(e)}"
        }

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
        from agents.input_agent import InputAgent
        
        input_agent = InputAgent(input_data=request)
        
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

