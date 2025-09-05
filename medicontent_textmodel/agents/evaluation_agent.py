# -*- coding: utf-8 -*-
"""
EvaluationAgent (FINAL) - 통합 평가 시스템
- 프롬프트: test_prompt/llm_evaluation_prompt.txt, seo_evaluation_prompt.txt, llm_regeneration_prompt.txt
- 로그: 기본 test_logs/use/ (CLI로 변경 가능)
- 기준: test_data/evaluation_criteria.json (의료법), seo_evaluation_criteria.json (SEO)
- 체크리스트 CSV: test_data/medical_ad_checklist.csv (또는 /mnt/test_data/medical_ad_checklist.csv)
- 리포트 MD: test_data/medical-ad-report.md (또는 /mnt/test_data/medical-ad-report.md)

기능 요약
1) title/content 강인 추출(재귀) - TXT 파일에서 제목/본문 분리
2) 의료법 평가: 규칙 스코어러 + LLM 평가 → 융합 스코어 → 위반 판정
3) SEO 품질 평가: 실제 측정값 + LLM 평가 → 등급 판정 (A/B/C/D)
4) 스코어 융합: final_score = max(rule_score, llm_score) (의료법만)
5) 우선순위 가중 총점: 의료법(0~100), SEO(합계)
6) 임계 비교: evaluation_criteria.json(엄격/표준/유연), seo_criteria.json(우수/양호/보통)
7) 재생성 프롬프트 적용 → 재평가, Regen-Fit(0~100) 산출
8) 통합 평가: 의료법 + SEO 동시 실행 (기본값)

평가 모드
- both (기본): 의료법 + SEO 둘 다 실행
- medical: 의료법 평가만 (compliance_level, violation_status 포함)
- seo: SEO 평가만 (grade, pass_status, actual_value 포함)

CLI
- --criteria (엄격|표준|유연), --evaluation-mode (both|medical|seo)
- --max_loops, --auto-yes, --log-dir, --pattern, --debug
- --csv (--csv-path), --report (--report-path)

필수: .env에 GEMINI_API_KEY
"""

import os
import re
import csv
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Tuple, Union, Iterable

import google.generativeai as genai
from dotenv import load_dotenv

import unicodedata
from kiwipiepy import Kiwi


# ===== 경로 기본 =====
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LOG_DIR = ROOT / "test_logs" / "use"
PROMPTS_DIR = ROOT / "test_prompt"
DATA_DIR = ROOT / "test_data"

# ===== HTML 파싱 함수 =====
def extract_title_and_content_from_html(html_file_path: str) -> tuple[str, str]:
    """HTML 파일에서 제목(텍스트)과 본문(HTML 코드)을 추출"""
    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # BeautifulSoup을 사용한 파싱
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 제목 추출 (h1, title 태그 등에서)
            title = ""
            if soup.find('h1'):
                title = soup.find('h1').get_text(strip=True)
            elif soup.find('title'):
                title = soup.find('title').get_text(strip=True)
            
            # 본문 추출 (HTML 코드 그대로 - DOCTYPE부터 끝까지)
            content = html_content
            
            print(f"📝 HTML에서 추출:")
            print(f"   제목: {title[:50]}..." if len(title) > 50 else f"   제목: {title}")
            print(f"   본문 HTML 크기: {len(content)}자 (전체 HTML 코드 포함)")
            print(f"   HTML 시작: {content[:100]}...")
            print(f"   HTML 끝: ...{content[-100:]}")
            
            return title, content
            
        except ImportError:
            print("⚠️ BeautifulSoup이 없어 간단한 정규식으로 파싱합니다.")
            # BeautifulSoup이 없는 경우 간단한 정규식 사용
            title_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
            title = title_match.group(1).strip() if title_match else ""
            
            # Content는 전체 HTML 코드 그대로 (DOCTYPE부터 끝까지)
            content = html_content
            
            return title, content
            
    except Exception as e:
        print(f"❌ HTML 파싱 실패: {str(e)}")
        return "", ""

# ===== UI Checklist 로그 생성 함수 =====
def generate_ui_checklist_logs(evaluation_data: Dict[str, Any], base_log_path: str):
    """evaluation 로그에서 SEO/의료법 UI checklist 로그 생성"""
    
    criteria = evaluation_data.get('modes', {}).get('criteria', '')
    by_item = evaluation_data.get('scores', {}).get('by_item', {})
    
    # criteria로 SEO vs 의료법 구분
    is_legal = criteria in ['엄격', '표준', '유연']
    is_seo = criteria in ['우수', '양호', '보통']
    
    # UI checklist 형태로 변환 (원래 변수명 유지)
    checklist = []
    for item_id, item_data in by_item.items():
        if is_seo:
            checklist_item = {
                "name": item_data.get("name"),                    # 항목명
                "threshold": item_data.get("threshold"),          # 기준점수
                "final_score": item_data.get("final_score"),     # 점수
                "grade": item_data.get("grade"),                 # SEO 등급 (A/B/C/D)
                "pass_status": item_data.get("pass_status"),     # SEO 통과상태 (O/X)
                "actual_value": item_data.get("actual_value", 0) # 실제 측정값
            }
        elif is_legal:
            checklist_item = {
                "name": item_data.get("name"),                            # 항목명
                "threshold": item_data.get("threshold"),                  # 기준점수
                "final_score": item_data.get("final_score"),             # 점수
                "compliance_level": item_data.get("compliance_level"),   # 의료법 준수수준
                "violation_status": item_data.get("violation_status")    # 의료법 위반상태 (적합/부적합)
            }
        else:
            # 기본값 (구 버전 호환용)
            checklist_item = {
                "name": item_data.get("name"),
                "threshold": item_data.get("threshold"),
                "final_score": item_data.get("final_score")
            }
        checklist.append(checklist_item)
    
    # 파일명 생성 (after 또는 기본 evaluation 패턴)
    if is_seo:
        if '_evaluation_after.json' in base_log_path:
            ui_log_path = base_log_path.replace('_evaluation_after.json', '_seo_ui_checklist_after.json')
        else:
            ui_log_path = base_log_path.replace('_evaluation.json', '_seo_ui_checklist.json')
        log_type = "SEO"
    elif is_legal:
        if '_evaluation_after.json' in base_log_path:
            ui_log_path = base_log_path.replace('_evaluation_after.json', '_legal_ui_checklist_after.json')
        else:
            ui_log_path = base_log_path.replace('_evaluation.json', '_legal_ui_checklist.json')
        log_type = "의료법"
    else:
        print(f"알 수 없는 criteria: {criteria}")
        return None
    
    # UI checklist 로그 저장
    try:
        with open(ui_log_path, 'w', encoding='utf-8') as f:
            json.dump(checklist, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {log_type} UI checklist 로그 저장: {Path(ui_log_path).name}")
        print(f"📊 {len(checklist)}개 항목, criteria: {criteria}")
        
        return ui_log_path
        
    except Exception as e:
        print(f"❌ UI checklist 로그 저장 실패: {e}")
        return None

# ===== DB 업데이트 함수 =====
def auto_update_medicontent_posts(evaluation_data: Dict[str, Any], evaluation_file_path: str) -> bool:
    """evaluation 완료 후 자동으로 Medicontent Posts 테이블 업데이트"""
    try:
        print("🔄 Evaluation 완료 - 자동 DB 업데이트 시작...")
        
        # evaluation 데이터에서 필요한 정보 추출 (criteria, score만)
        criteria = evaluation_data.get("modes", {}).get("criteria", "")
        weighted_total = evaluation_data.get("scores", {}).get("weighted_total", 0)
        
        # 타임스탬프 추출 (evaluation 파일명 우선, source_log는 백업)
        timestamp = None
        import re
        
        # 1. evaluation 파일명에서 먼저 추출 시도 (UI 체크리스트와 동일한 타임스탬프)
        eval_filename = Path(evaluation_file_path).stem
        timestamp_match = re.search(r'(\d{8}_\d{6})', eval_filename)
        if timestamp_match:
            timestamp = timestamp_match.group(1)
            print(f"🔍 evaluation 파일에서 타임스탬프 추출: {timestamp}")
        
        # 2. 백업: source_log에서 타임스탬프 추출 시도  
        if not timestamp:
            source_log = evaluation_data.get("input", {}).get("source_log", "")
            if source_log:
                timestamp_match = re.search(r'(\d{8}_\d{6})', source_log)
                if timestamp_match:
                    timestamp = timestamp_match.group(1)
                    print(f"🔍 source_log에서 타임스탬프 추출: {timestamp}")
        
        if not timestamp:
            print("⚠️ 타임스탬프를 찾을 수 없어 DB 업데이트를 건너뜁니다.")
            return False
        
        print(f"🔍 추출된 타임스탬프: {timestamp}")
        
        # criteria에 따라 SEO Score vs Legal Score 구분
        is_legal_score = criteria in ["엄격", "표준", "유연"]
        is_seo_score = criteria in ["우수", "양호", "보통"]
        
        # PostID 기반 매칭으로 content.json 찾기 (기존/새로운 경로 구조 모두 고려)
        eval_dir = Path(evaluation_file_path).parent
        base_use_dir = ROOT / "test_logs" / "use"
        
        search_dirs = [
            eval_dir,  # 현재 evaluation 파일이 있는 폴더
            eval_dir.parent if eval_dir.parent != base_use_dir else eval_dir,  # 상위 폴더
            base_use_dir,  # test_logs/use/
            base_use_dir / "results",  # 기존 results/ 폴더
        ]
        
        # 모든 날짜 폴더들도 추가 (YYYYMMDD 형태)
        if base_use_dir.exists():
            for date_dir in base_use_dir.iterdir():
                if date_dir.is_dir() and date_dir.name.isdigit() and len(date_dir.name) == 8:
                    search_dirs.append(date_dir)
        
        # results 폴더의 모든 날짜/타임스탬프 폴더들도 추가
        results_dir = base_use_dir / "results" 
        if results_dir.exists():
            for sub_dir in results_dir.iterdir():
                if sub_dir.is_dir():
                    search_dirs.append(sub_dir)
        
        content_file = None
        matched_post_id = None
        
        # 모든 디렉토리에서 content.json 파일들 스캔 (최신순)
        all_content_files = []
        for search_dir in search_dirs:
            if search_dir.exists():
                if "**" in str(search_dir):
                    # 특별한 glob 패턴 처리
                    base_dir = search_dir.parent
                    if base_dir.exists():
                        all_content_files.extend(list(base_dir.glob("**/*_content.json")))
                else:
                    all_content_files.extend(list(search_dir.glob("**/*_content.json")))
        
        # 중복 제거 및 최신순 정렬
        content_files = sorted(list(set(all_content_files)), key=lambda x: x.stat().st_mtime, reverse=True)
        
        for cf in content_files:
            try:
                with open(cf, 'r', encoding='utf-8') as f:
                    content_data = json.load(f)
                
                # ✅ content.json의 meta 섹션에서 Post Id 직접 추출 (우선순위 1)
                post_id = None
                if 'meta' in content_data:
                    meta = content_data['meta']
                    if 'post_id' in meta and meta['post_id']:
                        post_id = str(meta['post_id'])
                        print(f"🔍 PostID 추출 (meta): post_id = {post_id}")
                    elif 'post_data_request_id' in meta and meta['post_data_request_id']:
                        post_id = str(meta['post_data_request_id'])
                        print(f"🔍 PostID 추출 (meta): post_data_request_id = {post_id}")
                
                # Post Id를 찾지 못한 경우에만 input_source에서 찾기 (우선순위 2)
                if not post_id:
                    input_source = content_data.get("meta", {}).get("input_source", "")
                    if not input_source:
                        continue
                    
                    # input_source 경로를 절대 경로로 변환
                    if not Path(input_source).is_absolute():
                        input_file = ROOT / input_source
                    else:
                        input_file = Path(input_source)
                    
                    if not input_file.exists():
                        continue
                    
                    # input_source에서 PostID 추출
                    with open(input_file, 'r', encoding='utf-8') as f:
                        input_logs = json.load(f)
                    
                    # PostID 추출 로직 (Post Id로 통일)
                    if isinstance(input_logs, list) and input_logs:
                        # 가장 최신 로그부터 확인 (업데이트된 로그가 마지막에 있을 가능성)
                        for log_entry in reversed(input_logs):
                            if isinstance(log_entry, dict):
                                # Post Id 필드 우선 확인
                                if 'Post Id' in log_entry and log_entry['Post Id']:
                                    post_id = str(log_entry['Post Id'])
                                    print(f"🔍 PostID 추출 (list, 최신순): Post Id = {post_id}")
                                    break
                                # 백업: 다른 필드들 확인
                                for field in ['postId', 'postDataRequestId', 'medicontentPostId']:
                                    if field in log_entry and log_entry[field]:
                                        post_id = str(log_entry[field])
                                        print(f"🔍 PostID 추출 (list, 최신순): {field} = {post_id}")
                                        break
                                if post_id:
                                    break
                    elif isinstance(input_logs, dict):
                        # Post Id 필드 우선 확인
                        if 'Post Id' in input_logs and input_logs['Post Id']:
                            post_id = str(input_logs['Post Id'])
                            print(f"🔍 PostID 추출 (dict): Post Id = {post_id}")
                        else:
                            # 백업: 다른 필드들 확인
                            for field in ['postId', 'postDataRequestId', 'medicontentPostId']:
                                if field in input_logs and input_logs[field]:
                                    post_id = str(input_logs[field])
                                    print(f"🔍 PostID 추출 (dict): {field} = {post_id}")
                                    break
                
                if post_id:
                    content_file = cf
                    matched_post_id = post_id
                    print(f"✅ PostID 기반 Content 파일 발견: {content_file}")
                    print(f"🔍 추출된 PostID: {matched_post_id}")
                    break
                    
            except Exception as e:
                continue
        
        if not content_file or not matched_post_id:
            print("⚠️ PostID를 추출할 수 있는 content.json을 찾을 수 없습니다.")
            return False
        
        # content.json과 같은 디렉토리에서 HTML 파일 찾기
        content_dir = content_file.parent
        content_stem = content_file.stem.replace("_content", "")  # 타임스탬프 부분 추출
        
        html_files = []
        html_patterns = [
            f"{content_stem}.html",
            f"{content_stem}_content.html", 
            f"{content_stem}_result.html"
        ]
        
        for pattern in html_patterns:
            html_files.extend(list(content_dir.glob(pattern)))
            if html_files:
                break
        
        html_file = html_files[0] if html_files else None
        if html_file:
            print(f"✅ HTML 파일 발견: {html_file}")
        else:
            print(f"⚠️ content.json과 연관된 HTML 파일을 찾을 수 없습니다.")
            print(f"   검색한 패턴: {html_patterns}")
        
        # 이미 추출된 PostID 사용
        post_id = matched_post_id
        print(f"🔍 사용할 PostID: {post_id}")
        
        # Medicontent Posts 및 Post Reviews 테이블 업데이트
        load_dotenv()
        
        try:
            from pyairtable import Api
            
            api = Api(os.getenv('AIRTABLE_API_KEY'))
            posts_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Medicontent Posts')
            reviews_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Post Reviews')
            
            # PostID로 직접 매칭
            print(f"🔍 Medicontent Posts에서 PostID '{post_id}'와 매칭되는 레코드 검색...")
            
            matched_record = None
            
            # Post Id 필드로 검색
            records = []
            try:
                records = posts_table.all(formula=f"{{Post Id}} = '{post_id}'")
                if records:
                    print(f"✅ PostID 매칭 성공!")
                else:
                    print(f"⚠️ Post Id '{post_id}'에 해당하는 레코드를 찾을 수 없습니다.")
            except Exception as e:
                print(f"❌ Post Id 검색 실패: {e}")
                records = []
            
            if records:
                matched_record = records[0]
                print(f"✅ PostID 매칭 성공!")
                print(f"   찾은 PostID: {post_id}")
                print(f"   Record ID: {matched_record['id']}")
            else:
                print(f"❌ PostID '{post_id}'에 해당하는 레코드를 찾을 수 없습니다.")
                
                # 디버깅: 전체 레코드 목록 출력
                all_records = posts_table.all()
                print("📋 전체 Medicontent Posts 레코드 목록:")
                for i, record in enumerate(all_records[:10]):  # 처음 10개만 출력
                    record_post_id = record['fields'].get('Post Id', '')
                    title = record['fields'].get('Title', '')[:50] if record['fields'].get('Title') else ''
                    print(f"   {i+1}. PostID: '{record_post_id}', Title: '{title}...'")
                    if i > 5:  # 너무 많으면 생략
                        print(f"   ... ({len(all_records) - 10}개 더)")
                        break
                return False
            
            record_id = matched_record['id']
            
            # HTML 파일에서 제목과 본문 추출
            title = ""
            content = ""
            if html_file:
                title, content = extract_title_and_content_from_html(str(html_file))
            else:
                print("⚠️ HTML 파일이 없어 제목과 본문을 추출할 수 없습니다.")
            
            # 현재 레코드에서 기존 SEO Score와 Legal Score 확인
            current_fields = matched_record['fields']
            existing_seo_score = current_fields.get('SEO Score')
            existing_legal_score = current_fields.get('Legal Score')
            current_status = current_fields.get('Status', '')
            
            print(f"📊 현재 레코드 상태:")
            print(f"   기존 SEO Score: {existing_seo_score} ({'있음' if existing_seo_score else '없음'})")
            print(f"   기존 Legal Score: {existing_legal_score} ({'있음' if existing_legal_score else '없음'})")
            print(f"   현재 Status: '{current_status}'")
            print(f"🔍 이번 평가 타입 - is_seo_score: {is_seo_score}, is_legal_score: {is_legal_score}")
            
            # HTML ID 생성 (content 파일명에서 추출)
            html_id = content_file.stem  # ex: 20250825_205923_content
            
            # 업데이트할 데이터 준비 (Status는 나중에 결정)
            update_data = {
                'HTML ID': html_id
            }
            
            # 제목과 본문 추가
            if title:
                update_data['Title'] = title
                print(f"📝 제목 추가: {title[:50]}...")
            
            if content:
                update_data['Content'] = content
                print(f"📝 HTML 본문 추가: {len(content)}자 (전체 HTML 파일)")
            
            # SEO Score 또는 Legal Score 추가
            if is_seo_score:
                update_data['SEO Score'] = weighted_total
                print(f"📈 SEO Score 설정: {weighted_total} (criteria: {criteria})")
            elif is_legal_score:
                update_data['Legal Score'] = weighted_total
                print(f"⚖️ Legal Score 설정: {weighted_total} (criteria: {criteria})")
            
            # 둘 다 있을 때만 작업 완료로 변경 (동시 평가 시에만 완료 처리)
            will_have_seo = existing_seo_score or is_seo_score
            will_have_legal = existing_legal_score or is_legal_score
            
            print(f"🔄 Score 상태 확인:")
            print(f"   기존 SEO Score: {existing_seo_score} ({'있음' if existing_seo_score else '없음'})")
            print(f"   기존 Legal Score: {existing_legal_score} ({'있음' if existing_legal_score else '없음'})")
            print(f"   이번에 추가할 SEO Score: {'있음' if is_seo_score else '없음'}")
            print(f"   이번에 추가할 Legal Score: {'있음' if is_legal_score else '없음'}")
            print(f"   결과 - will_have_seo: {will_have_seo}, will_have_legal: {will_have_legal}")
            
            if will_have_seo and will_have_legal:
                update_data['Status'] = '작업 완료'
                print(f"✅ SEO Score와 Legal Score 모두 있음 → Status: '작업 완료'로 변경")
            else:
                print(f"⏳ 아직 한쪽 Score만 있음 → Status 유지 ('{current_status}')")
                print(f"   SEO Score: {'✅' if will_have_seo else '❌'}")
                print(f"   Legal Score: {'✅' if will_have_legal else '❌'}")
            
            # Airtable 업데이트 실행 - Medicontent Posts
            posts_table.update(record_id, update_data)
            
            # Post Reviews 테이블도 업데이트
            try:
                print(f"🔍 Post Reviews 테이블 업데이트 시작...")
                print(f"🔍 사용할 Post ID: '{post_id}'")
                print(f"🔍 평가 기준: {criteria} (SEO: {is_seo_score}, Legal: {is_legal_score})")
                
                # 기존 Post Review 레코드 검색 (Post Id로 통일)
                existing_reviews = []
                
                # 먼저 Post Reviews 테이블에 접근 가능한지 확인
                try:
                    all_reviews = reviews_table.all()
                    print(f"✅ Post Reviews 테이블 접근 성공. 총 레코드 수: {len(all_reviews)}")
                except Exception as table_error:
                    print(f"❌ Post Reviews 테이블 접근 실패: {table_error}")
                    raise table_error
                
                # Post ID 필드로 검색 (Post Reviews는 'Post ID' 사용)
                try:
                    existing_reviews = reviews_table.all(formula=f"{{Post ID}} = '{post_id}'")
                    if existing_reviews:
                        print(f"✅ Post Reviews에서 Post ID '{post_id}' 검색 성공")
                    else:
                        print(f"⚠️ Post ID '{post_id}'에 해당하는 Post Review 레코드가 없습니다.")
                except Exception as e:
                    print(f"❌ Post Reviews 검색 실패: {e}")
                    existing_reviews = []
                
                print(f"🔍 Post Reviews에서 PostID '{post_id}' 검색 결과: {len(existing_reviews)}개 레코드")
                
                # UI checklist JSON 생성
                checklist_json = ""
                ui_log_path = ""
                
                # evaluation 파일에서 타임스탬프 추출하여 체크리스트 찾기
                eval_file = Path(evaluation_file_path)
                eval_stem = eval_file.stem
                
                # evaluation 파일명에서 타임스탬프 추출 (YYYYMMDD_HHMMSS)
                eval_timestamp_match = re.search(r'(\d{8}_\d{6})', eval_stem)
                if eval_timestamp_match:
                    eval_timestamp = eval_timestamp_match.group(1)
                    print(f"🔍 evaluation 파일에서 체크리스트용 타임스탬프 추출: {eval_timestamp}")
                    
                    ui_patterns = []
                    if is_seo_score:
                        # SEO 체크리스트 패턴들 (최초 + 재생성)
                        ui_patterns = [
                            f"{eval_timestamp}_seo_ui_checklist.json",
                            f"{eval_timestamp}_seo_ui_checklist_after.json"
                        ]
                    else:
                        # Legal 체크리스트 패턴들 (최초 + 재생성)
                        ui_patterns = [
                            f"{eval_timestamp}_legal_ui_checklist.json",
                            f"{eval_timestamp}_legal_ui_checklist_after.json"
                        ]
                else:
                    print(f"⚠️ evaluation 파일에서 타임스탬프를 찾을 수 없습니다: {eval_stem}")
                    ui_patterns = []
                
                # UI checklist 파일을 찾을 검색 디렉토리들
                ui_search_dirs = [
                    eval_file.parent,  # evaluation 파일이 있는 폴더
                    eval_file.parent.parent,  # 상위 폴더
                    base_use_dir,  # test_logs/use/
                    base_use_dir / "results",  # results/ 폴더
                ]
                
                # 모든 날짜 폴더와 results의 하위 폴더들도 추가
                if base_use_dir.exists():
                    for date_dir in base_use_dir.iterdir():
                        if date_dir.is_dir() and date_dir.name.isdigit() and len(date_dir.name) == 8:
                            ui_search_dirs.append(date_dir)
                
                results_dir = base_use_dir / "results"
                if results_dir.exists():
                    for sub_dir in results_dir.iterdir():
                        if sub_dir.is_dir():
                            ui_search_dirs.append(sub_dir)
                
                ui_files = []
                for pattern in ui_patterns:
                    for search_dir in ui_search_dirs:
                        if search_dir.exists():
                            found_files = list(search_dir.glob(pattern))
                            ui_files.extend(found_files)
                    if ui_files:
                        break
                
                if ui_files:
                    ui_file = ui_files[0]
                    print(f"✅ UI checklist 파일 발견: {ui_file}")
                    
                    # UI checklist JSON 읽기
                    with open(ui_file, 'r', encoding='utf-8') as f:
                        checklist_json = f.read()
                    print(f"📄 체크리스트 JSON 읽기 완료: {len(checklist_json)}자")
                    print(f"📄 체크리스트 JSON 미리보기: {checklist_json[:200]}...")
                else:
                    print(f"⚠️ UI checklist 파일을 찾을 수 없습니다: {ui_patterns}")
                    print("   체크리스트 파일이 없어도 점수는 업데이트합니다.")
                    checklist_json = ""
                
                # Post Reviews 업데이트 데이터 준비
                review_update_data = {
                    'Reviewer': '리걸케어',
                    'Reviewed At': datetime.now().isoformat()
                }
                
                # SEO 점수와 체크리스트 처리
                if is_seo_score:
                    review_update_data['SEO Score'] = weighted_total
                    if checklist_json:
                        # 체크리스트 JSON 크기 제한 (Airtable 제한 고려)
                        if len(checklist_json) > 100000:  # 100KB 제한
                            print(f"⚠️ SEO Checklist JSON이 너무 큽니다 ({len(checklist_json)}자). 크기를 줄입니다.")
                            checklist_json = checklist_json[:100000]
                        review_update_data['SEO Checklist'] = checklist_json
                        print(f"✅ SEO Checklist JSON 저장: {len(checklist_json)}자")
                
                # Legal 점수와 체크리스트 처리 (SEO와 별도로 처리)
                if is_legal_score:
                    review_update_data['Legal Score'] = weighted_total
                    if checklist_json:
                        # 체크리스트 JSON 크기 제한 (Airtable 제한 고려)
                        if len(checklist_json) > 100000:  # 100KB 제한
                            print(f"⚠️ Legal Checklist JSON이 너무 큽니다 ({len(checklist_json)}자). 크기를 줄입니다.")
                            checklist_json = checklist_json[:100000]
                        review_update_data['Legal Checklist'] = checklist_json  
                        print(f"✅ Legal Checklist JSON 저장: {len(checklist_json)}자")
                
                if existing_reviews:
                    # 기존 레코드 업데이트
                    review_record_id = existing_reviews[0]['id']
                    existing_data = existing_reviews[0]['fields']
                    print(f"🔧 기존 Post Review 레코드 업데이트: {review_record_id}")
                    
                    # 기존 데이터와 새 데이터 병합 (기존 점수/체크리스트 보존)
                    merged_data = existing_data.copy()
                    merged_data.update(review_update_data)
                    
                    print(f"📝 기존 데이터: {existing_data}")
                    print(f"📝 새 데이터: {review_update_data}")
                    print(f"📝 병합된 데이터: {merged_data}")
                    
                    reviews_table.update(review_record_id, merged_data)
                    print(f"✅ Post Review 업데이트 완료: {post_id}")
                else:
                    # 새 레코드 생성
                    review_update_data['Post ID'] = post_id
                    print(f"🔧 새 Post Review 레코드 생성")
                    print(f"📝 생성 데이터: {review_update_data}")
                    reviews_table.create(review_update_data)
                    print(f"✅ Post Review 생성 완료: {post_id}")
                    
            except Exception as review_error:
                print(f"⚠️ Post Reviews 업데이트 실패 (Medicontent Posts는 성공): {review_error}")
                import traceback
                print(f"🔍 Post Reviews 업데이트 실패 상세:")
                traceback.print_exc()
            
            print(f"✅ Medicontent Posts 자동 업데이트 완료!")
            print(f"   Content 파일: {content_file.name}")
            print(f"   PostID: {post_id}")
            print(f"   Record ID: {record_id}")
            print(f"   Status: 작업 완료")
            print(f"   Title: {title[:50]}..." if title else "")
            print(f"   Content length: {len(content)}")
            print(f"   Score: {weighted_total} ({criteria})")
            
            return True
            
        except ImportError:
            print("⚠️ pyairtable 라이브러리가 없어 DB 업데이트를 건너뜁니다.")
            return False
        except Exception as e:
            print(f"❌ Airtable 업데이트 실패: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e:
        print(f"❌ 자동 DB 업데이트 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

EVAL_PROMPT_PATH = PROMPTS_DIR / "llm_evaluation_prompt.txt"
REGEN_PROMPT_PATH = PROMPTS_DIR / "llm_regeneration_prompt.txt"
SEO_PROMPT_PATH = PROMPTS_DIR / "seo_evaluation_prompt.txt"
CRITERIA_PATH = DATA_DIR / "evaluation_criteria.json"
SEO_CRITERIA_PATH = DATA_DIR / "seo_evaluation_criteria.json"
DEFAULT_CSV_PATHS = [DATA_DIR / "medical_ad_checklist.csv", Path("/mnt/test_data/medical_ad_checklist.csv")]
DEFAULT_REPORT_PATHS = [DATA_DIR / "medical-ad-report.md", Path("/mnt/test_data/medical-ad-report.md")]

# ===== 체크리스트 명칭 =====
CHECKLIST_NAMES = {
    1: "허위·과장 표현", 2: "치료경험담", 3: "비급여 진료비 할인", 4: "사전심의 미이행",
    5: "치료 전후 사진", 6: "전문의 허위 표시", 7: "환자 유인·알선", 8: "비의료인 의료광고",
    9: "객관적 근거 부족", 10: "비교 광고", 11: "기사형 광고", 12: "부작용 정보 누락",
    13: "인증·보증 허위표시", 14: "가격 정보 오표시", 15: "연락처 정보 오류",
}

SEO_CHECKLIST_NAMES = {
    1: "제목 글자수 (공백 포함)", 2: "제목 글자수 (공백 제외)", 3: "본문 글자수 (공백 포함)",
    4: "본문 글자수 (공백 제외)", 5: "총 형태소 개수", 6: "총 음절 개수",
    7: "총 단어 개수", 8: "어뷰징 단어 개수", 9: "본문 이미지", 10: "백링크 존재 여부"
}

# ===== 리포트 가중치 (기본값) =====
DEFAULT_REPORT_WEIGHTS = {
    "1": 8.6, "2": 8.0, "3": 8.0, "4": 8.0, "5": 7.0,
    "6": 7.0, "7": 8.0, "8": 7.4, "9": 6.4, "10": 6.4,
    "11": 6.0, "12": 6.0, "13": 6.0, "14": 6.0, "15": 5.5
}

# ===== 규칙 엔진 기본 패턴(부족분은 CSV에서 보강) =====
BASE_PATTERNS = {
    1: [r"\b100\s*%\b", r"부작용\s*없(음|다)", r"\b최고\b", r"\b유일(한)?\b", r"완전\s*무통"],
    2: [r"후기|경험담|리뷰", r"만족도", r"치료\s*과정", r"치료\s*결과", r"협찬|제공\s*받"],
    3: [r"\d{1,3}\s?%(\s*할인)?", r"이벤트\s*가", r"행사\s*가", r"\b원\s*부터\b"],
    4: [r"심의번호", r"심의\s*미이행|미심의"],
    5: [r"\b전후\b", r"\bbefore\b", r"\bafter\b", r"!\[.*\]\(.*\)", r"<img[^>]+>"],
    6: [r"전문의", r"전문병원", r"임플란트\s*전문의", r"교정\s*전문병원"],
    7: [r"리뷰\s*이벤트", r"추첨", r"사은품", r"리뷰\s*작성\s*시", r"대가|포인트|기프티콘"],
    8: [r"인플루언서|일반인\s*광고", r"제휴\s*포스팅"],
    9: [r"임상결과|연구결과|데이터", r"근거\s*없(음|다)"],
    10:[r"타\s*병원|다른\s*병원", r"최초|최고|유일\s*비교", r"보다\s*낫"],
    11:[r"기사형|보도자료|인터뷰\s*형태", r"전문가\s*의견\s*형식"],
    12:[r"부작용|주의사항|개인차", r"리스크|합병증"],
    13:[r"인증|상장|감사장|추천", r"공식\s*인증"],
    14:[r"원\s*부터|최저가|할인\s*가", r"추가\s*비용|부가세"],
    15:[r"병원명|주소|전화|연락처", r"오류|불일치"],
}

# ===== SEO 메트릭 계산 (정제 유틸 추가) =====
# --- SEO 측정 전용: 이미지 감지+정제 ---
_IMG_EXT_RE = r'(?:jpg|jpeg|png|gif)'
_MKDOWN_IMG_RE = re.compile(r'!\[[^\]]*\]\(([^)]+)\)', re.IGNORECASE)   # ![alt](url)
_HTML_IMG_RE   = re.compile(r'<img\b[^>]*\bsrc\s*=[^>]*>', re.IGNORECASE)  # <img src=""> 개수로 카운팅
_PAREN_IMG_RE  = re.compile(r'\(([^()\s]+?\.' + _IMG_EXT_RE + r')\)', re.IGNORECASE)  # (file.ext)

def _clean_text_for_json(text: str) -> str:
    """JSON 안전을 위한 텍스트 정제 - 제어 문자 제거"""
    if not isinstance(text, str):
        return ""
    
    # 제어 문자 제거 (JSON에서 허용되지 않는 문자들)
    import unicodedata
    cleaned = ""
    for char in text:
        # 제어 문자인지 확인 (U+0000 ~ U+001F, U+007F ~ U+009F)
        if unicodedata.category(char).startswith('C'):
            # 제어 문자는 공백으로 대체
            cleaned += ' '
        else:
            cleaned += char
    
    # 추가 정제: 특수 제어 문자들
    cleaned = cleaned.replace('\x00', ' ')  # null character
    cleaned = cleaned.replace('\x01', ' ')  # start of heading
    cleaned = cleaned.replace('\x02', ' ')  # start of text
    cleaned = cleaned.replace('\x03', ' ')  # end of text
    cleaned = cleaned.replace('\x04', ' ')  # end of transmission
    cleaned = cleaned.replace('\x05', ' ')  # enquiry
    cleaned = cleaned.replace('\x06', ' ')  # acknowledge
    cleaned = cleaned.replace('\x07', ' ')  # bell
    cleaned = cleaned.replace('\x08', ' ')  # backspace
    cleaned = cleaned.replace('\x0b', ' ')  # vertical tab
    cleaned = cleaned.replace('\x0c', ' ')  # form feed
    cleaned = cleaned.replace('\x0e', ' ')  # shift out
    cleaned = cleaned.replace('\x0f', ' ')  # shift in
    cleaned = cleaned.replace('\x10', ' ')  # data link escape
    cleaned = cleaned.replace('\x11', ' ')  # device control 1
    cleaned = cleaned.replace('\x12', ' ')  # device control 2
    cleaned = cleaned.replace('\x13', ' ')  # device control 3
    cleaned = cleaned.replace('\x14', ' ')  # device control 4
    cleaned = cleaned.replace('\x15', ' ')  # negative acknowledge
    cleaned = cleaned.replace('\x16', ' ')  # synchronous idle
    cleaned = cleaned.replace('\x17', ' ')  # end of transmission block
    cleaned = cleaned.replace('\x18', ' ')  # cancel
    cleaned = cleaned.replace('\x19', ' ')  # end of medium
    cleaned = cleaned.replace('\x1a', ' ')  # substitute
    cleaned = cleaned.replace('\x1b', ' ')  # escape
    cleaned = cleaned.replace('\x1c', ' ')  # file separator
    cleaned = cleaned.replace('\x1d', ' ')  # group separator
    cleaned = cleaned.replace('\x1e', ' ')  # record separator
    cleaned = cleaned.replace('\x1f', ' ')  # unit separator
    cleaned = cleaned.replace('\x7f', ' ')  # delete
    
    # 연속된 공백을 하나로 축약
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned

def _extract_images_and_clean_text(raw: str) -> Tuple[str, int]:
    """
    - 이미지 개수: 마크다운/HTML/괄호형 파일명 3종을 합산 (중복 방지 위해 순차 제거)
    - 정제 텍스트: 이미지 표현(마크다운/HTML/괄호형 파일명) 모두 제거,
                  줄바꿈/탭→공백, 공백 다중 → 1칸으로 축약
    """
    if not isinstance(raw, str):
        return "", 0

    text = raw

    # 1) 마크다운 이미지: 카운트 & 제거
    md_hits = _MKDOWN_IMG_RE.findall(text)
    text = _MKDOWN_IMG_RE.sub(' ', text)

    # 2) HTML 이미지: 카운트 & 제거
    html_hits = _HTML_IMG_RE.findall(text)
    text = _HTML_IMG_RE.sub(' ', text)

    # 3) 괄호형 파일명: 카운트 & 제거  e.g., (ab.png)
    paren_hits = _PAREN_IMG_RE.findall(text)
    text = _PAREN_IMG_RE.sub(' ', text)

    # 4) 줄바꿈/탭 제거(→ 공백 1칸), 공백 다중 축약
    text = text.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    
    # 5) JSON 안전을 위한 추가 정제
    text = _clean_text_for_json(text)

    image_count = len(md_hits) + len(html_hits) + len(paren_hits)
    return text, image_count

def _calculate_morphemes(text: str) -> int:
    """형태소 개수 계산 (kiwipiepy 사용)"""
    kiwi = Kiwi()

    # 형태소 토큰화
    tokens = kiwi.tokenize(text)
    print(f"DEBUG - 전체 토큰 개수: {len(tokens)}")

    # 내용어만 추출
    KEEP = {"NNG","NNP","NNB","NP","NR","VV","VA","VX","VCP","VCN","MM"}
    content = [t for t in tokens if t.tag in KEEP]
    print(f"DEBUG - 내용어 토큰 개수: {len(content)}")
    
    # 복합명사 간단히 결합 (인접 NNG + NNG)
    final_tokens = []
    i = 0
    while i < len(content):
        if content[i].tag == "NNG" and i+1 < len(content) and content[i+1].tag == "NNG":
            combined = content[i].form + content[i+1].form
            final_tokens.append(combined)
            print(f"DEBUG - 복합명사: {content[i].form} + {content[i+1].form} -> {combined}")
            i += 2
        elif content[i].tag in {"VV","VA","VX"} and i+1 < len(content) and content[i+1].tag == "VX":
            # 보조용언(VX) 합치기
            combined = content[i].form + content[i+1].form + '다'
            final_tokens.append(combined)
            print(f"DEBUG - 보조용언: {content[i].form} + {content[i+1].form} -> {combined}")
            i += 2
        elif content[i].tag in {"VV","VA","VCP","VCN"}:
            # 동사/형용사 -> '다' 붙여 표제어화
            lemma = content[i].form + "다"
            final_tokens.append(lemma)
            i += 1
        else:
            final_tokens.append(content[i].form)
            i += 1

    print(f"DEBUG - 최종 형태소 개수: {len(final_tokens)}")
    print(f"DEBUG - 최종 형태소 예시: {final_tokens[:10]}")
    return len(final_tokens)

def _count_syllables_extended(text: str) -> int:
    # 숫자/기호/이모지/마크업 간단 제거 후 어절 카운트
    clean = re.sub(r'[*_`<>\[\]()…·•“”"\'!?.,:;]|[\U0001F300-\U0001FAFF]', ' ', text)
    words = re.findall(r'[가-힣A-Za-z]+', clean)  # 한글/영문 덩어리만
    return len(words)

def _preprocess_for_count(text: str) -> str:
    """ 마크업/이모지/짧은 헤딩/담화표지/영문/숫자 정리"""
    s = unicodedata.normalize('NFC', text)

    # 마크업/따옴표/이모지류 제거
    s = re.sub(r'[*_`]+', ' ', s)
    s = re.sub(r'[“”″‟＂"『』《》【】]', ' ', s)
    s = re.sub(r'[\U0001F300-\U0001FAFF\U00002700-\U000027BF]+', ' ', s)

    # 짧은 헤딩 라인 컷(구두점 거의 없는 1~4어절)
    lines = [ln.strip() for ln in s.splitlines()]
    pruned = []
    for ln in lines:
        if not ln: continue
        if re.fullmatch(r'[<>\[\]()\-–—~·•]+', ln): continue
        if len(ln.split()) <= 4 and not re.search(r'[.,?!:;…·]|[0-9]', ln):
            continue
        pruned.append(ln)
    s = ' '.join(pruned)

    # 담화 표지 컷(필요시 추가)
    FILLERS = ["안녕하세요", "여러분", "자", "그럼", "오늘은", "함께",
               "어떠셨나요", "감사합니다", "마무리", "참고하세요"]
    for f in FILLERS:
        s = re.sub(rf'\b{re.escape(f)}\b', ' ', s)

    # 숫자/백분율/영문 표준화(이후 카운트 제외)
    s = re.sub(r'\b\d+(\.\d+)?\s*%\b', ' ', s)      # % 지우기
    s = re.sub(r'\b\d{1,4}([.,]\d{3})+(\.\d+)?\b', ' ', s)  # 1,234,567.89
    s = re.sub(r'\b\d+(\.\d+)?\b', ' ', s)          # 일반 숫자
    s = re.sub(r'\b[a-zA-Z]{2,}\b', ' ', s)         # 영문 단어 제거

    s = re.sub(r'\s{2,}', ' ', s).strip()
    return s

def total_word_count(text: str,
                     include_modifiers: bool = False,  # 수식언 제외(158 프리셋)
                     noun_run_merge_k: int = 4,        # 명사 4개까지 병합(158 프리셋)
                     unique: bool = True               # 유니크 카운트(158 프리셋)
                     ) -> int:
    """전처리 + 형태소 정규화 기반 '총 단어 개수' 집계(내부 알고리즘 근사)"""
    text = _preprocess_for_count(text)

    kiwi = Kiwi()
    toks = kiwi.tokenize(text)

    NOUN = {"NNG","NNP","NNB","NR"}
    VERB = {"VV","VA","VCP","VCN"}
    KEEP = set(NOUN) | VERB | {"VX"}
    if include_modifiers:
        KEEP |= {"MM","MAG","MAJ"}

    content = [t for t in toks if t.tag in KEEP]

    # 표제어화
    pairs = [(t.form + "다", t.tag) if t.tag in VERB else (t.form, t.tag)
             for t in content]

    # 보조용언 체인 병합: (VV|VA) + (VX)+
    merged = []
    i, L = 0, len(pairs)
    while i < L:
        f, tag = pairs[i]
        if tag in {"VV","VA"}:
            j, acc = i+1, f
            while j < L and pairs[j][1] == "VX":
                acc += pairs[j][0]; j += 1
            merged.append((acc, "VV"))
            i = j
        else:
            merged.append((f, tag)); i += 1

    # 연속 명사 병합: 최대 k개
    final = []
    i, L = 0, len(merged)
    while i < L:
        f, tag = merged[i]
        if tag in NOUN and noun_run_merge_k >= 2:
            run = [f]; j = i+1
            while j < L and merged[j][1] in NOUN and len(run) < noun_run_merge_k:
                run.append(merged[j][0]); j += 1
            final.append(''.join(run)); i = j
        else:
            final.append(f); i += 1

    return len(set(final)) if unique else len(final)

def count_backlinks_in_html(html_content: str) -> int:
    """HTML에서 외부 백링크 개수 계산"""
    from urllib.parse import urlparse

    if not html_content:
        return 0
    
    href_pattern = r'<a[^>]*href=["\']([^"\']*)["\'][^>]*>'
    matches = re.findall(href_pattern, html_content, re.IGNORECASE)

    external_links = 0
    for url in matches:
        # 내부 링크 재외 (#, 상대경로, javascript, mailto: 등)
        if (url.startswith('http://') or url.startswith('https://')) and \
            not url.startswith('#') and \
            not url.startswith('javascript:') and \
            not url.startswith('mailto:') :
                external_links += 1
                
    return external_links

def calculate_seo_metrics(title: str, content: str, html_content: str = None) -> Dict[str, int]:
    """SEO 평가용 실제 측정값 (렌더 결과 기준: 이미지/alt/파일명 제거, 줄바꿈 제외)
    
    Args:
        title: 제목 텍스트 (TXT에서 추출)
        content: 본문 텍스트 (TXT에서 추출) 
        html_content: HTML 콘텐츠 (본문 이미지 개수 계산용, 없으면 content에서 계산)
    """
    import re

    # 입력 텍스트 정제 (JSON 안전)
    title = _clean_text_for_json(title) if title else ""
    content = _clean_text_for_json(content) if content else ""
    html_content = _clean_text_for_json(html_content) if html_content else ""

    # --- 제목(그대로) ---
    title_with_space = len(title)
    title_without_space = len(title.replace(" ", ""))
    print(f"DEBUG - 제목: '{title}'")
    print(f"DEBUG - 공백 포함: {title_with_space}, 공백 제외: {title_without_space}")

    # --- 본문: 정제 (TXT 기준) ---
    cleaned, _ = _extract_images_and_clean_text(content)  # TXT에서는 이미지 개수 무시

    # 3/4. 본문 글자수
    content_with_space = len(cleaned)
    content_without_space = len(re.sub(r'\s+', '', cleaned))  # 모든 공백 제거(개행 포함)

    # 5. 형태소(정제 텍스트 기준)
    morpheme_count = _calculate_morphemes(cleaned)

    # 6. 음절(정제 텍스트 기준)
    syllable_count = _count_syllables_extended(cleaned)

    # 7. 단어(정제 텍스트 기준)
    word_count = total_word_count(cleaned, include_modifiers=False, noun_run_merge_k=4, unique=True)

    # 8. 어뷰징 단어(정제 텍스트 기준)
    abusing_patterns = [
        r'19금', r'성인', r'유해', r'도박', r'불법', r'사기',
        r'100%', r'완전무료', r'대박', r'짱', r'헐', r'1등', r'최고', r'최강', r'완벽', r'보장', r'완치', r'치료보장',
        r'즉시', r'당일', r'바로', r'지금\s*당장', r'반드시', r'절대', r'무조건',
        r'전부', r'전세계', r'국내유일', r'독점', r'유일무이', r'베스트', r'프리미엄',
        r'명품', r'초특가', r'파격', r'무료', r'공짜', r'할인', r'이벤트', r'사은품',
        r'한정', r'마감임박', r'재고소진', r'선착순', r'단독', r'최초', r'유일',
        r'완전', r'필수', r'강력추천'
    ]
    abusing_count = sum(len(re.findall(pat, cleaned, re.IGNORECASE)) for pat in abusing_patterns)

    # 9. 본문 이미지 개수 - HTML에서 <img> 태그만 계산
    if html_content:
        # HTML에서 <img> 태그 개수만 계산
        html_img_count = len(_HTML_IMG_RE.findall(html_content))
        print(f"DEBUG - 본문 이미지: HTML에서 <img> 태그 {html_img_count}개 발견")
        image_count = html_img_count
    else:
        # HTML이 없으면 기존 방식으로 TXT에서 계산
        _, image_count = _extract_images_and_clean_text(content)
        print(f"DEBUG - 본문 이미지: TXT에서 {image_count}개 발견 (HTML 없음)")
    
    # 10. 외부 백링크 개수 - HTML에서 <a> 태그만 계산
    backlink_count = 0
    if html_content:
        backlink_count = count_backlinks_in_html(html_content)
        print(f"DEBUG - 외부 백링크: HTML에서 {backlink_count}개 발견")
    else:
        print(f"DEBUG - 외부 백링크: HTML 없음")

    return {
        1: title_with_space,
        2: title_without_space,
        3: content_with_space,
        4: content_without_space,
        5: morpheme_count,
        6: syllable_count,
        7: word_count,
        8: abusing_count,
        9: image_count,
        10: backlink_count
    }

# ===== 유틸 =====
def _nowstamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def _ensure_timestamp_log_dir(base_log_dir: Path, timestamp: str = None) -> Path:
    """날짜별 {YYYYMMDD} 디렉토리 생성"""
    if timestamp is None:
        timestamp = _nowstamp()
    
    # 타임스탬프에서 날짜 부분만 추출 (YYYYMMDD_HHMMSS -> YYYYMMDD)
    date_part = timestamp.split('_')[0] if '_' in timestamp else timestamp[:8]
    
    date_dir = base_log_dir / date_part
    date_dir.mkdir(parents=True, exist_ok=True)
    return date_dir

def _read_text(p: Path) -> str:
    if not p.exists():
        raise FileNotFoundError(f"파일 없음: {p}")
    return p.read_text(encoding="utf-8")

def _read_json(p: Path) -> Any:
    if not p.exists():
        raise FileNotFoundError(f"파일 없음: {p}")
    return json.loads(p.read_text(encoding="utf-8"))

def _write_json(p: Path, obj: Any):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def _latest(log_dir: Path, glob_pat: Union[str, List[str]]) -> Path:
    # log_dir가 날짜 폴더라면 그 안에서 직접 탐색, 아니면 최신 날짜 폴더 선택
    if log_dir.name.isdigit() and len(log_dir.name) == 8:  # YYYYMMDD 형태인지 확인
        search_dirs = [log_dir]
    else:
        search_dirs = []
        
        # 1. 날짜 폴더들 찾기 (YYYYMMDD)
        date_dirs = [p for p in log_dir.iterdir() if p.is_dir() and p.name.isdigit() and len(p.name) == 8]
        if date_dirs:
            search_dirs.extend(date_dirs)
        
        # 2. results 폴더가 있으면 그 안의 폴더들도 확인
        results_dir = log_dir / "results"
        if results_dir.exists():
            for sub_dir in results_dir.iterdir():
                if sub_dir.is_dir():
                    search_dirs.append(sub_dir)
        
        if not search_dirs:
            raise FileNotFoundError(f"날짜 폴더를 찾을 수 없습니다: {log_dir}")

    # 모든 검색 디렉토리에서 파일 찾기
    patterns = glob_pat if isinstance(glob_pat, list) else [glob_pat]
    candidates: List[Path] = []
    
    for search_dir in search_dirs:
        for pat in patterns:
            candidates.extend(list(search_dir.glob(pat)))

    if not candidates:
        # 첫 번째 검색 디렉토리의 파일 목록 표시
        first_dir = search_dirs[0] if search_dirs else log_dir
        listing = "\n".join(sorted([p.name for p in first_dir.glob('*')]))
        raise FileNotFoundError(
            f"최신 파일을 찾을 수 없습니다: {[str(d) for d in search_dirs]}/{patterns}\n"
            f"첫 번째 디렉토리({first_dir}) 파일 목록:\n{listing if listing else '(비어 있음)'}"
        )

    candidates.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    return candidates[0]

# ===== LLM =====
def _setup_llm():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY가 .env에 없습니다.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-pro")

def _extract_json(raw: str) -> Dict[str, Any]:
    if not raw:
        raise ValueError("LLM 응답이 비어 있습니다.")
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start:end+1]
    text = text.strip().strip("`").strip()
    
    # JSON 파싱 전에 디버깅 정보 출력
    print(f"DEBUG - JSON 파싱 시도 중...")
    print(f"DEBUG - 텍스트 길이: {len(text)}")
    if len(text) > 2000:
        print(f"DEBUG - 텍스트 앞부분 (2000자): {text[:2000]}")
        print(f"DEBUG - 텍스트 뒷부분 (2000자): {text[-2000:]}")
    else:
        print(f"DEBUG - 전체 텍스트: {text}")
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}")
        print(f"❌ 오류 위치: line {e.lineno}, column {e.colno}")
        if e.lineno == 1 and e.colno > 1800:
            print(f"❌ 문제가 되는 부분 (1810-1820자): {text[1810:1820] if len(text) > 1820 else '텍스트가 너무 짧음'}")
        
        # JSON 수정 시도
        print("🔧 JSON 수정 시도 중...")
        try:
            # 일반적인 JSON 오류 수정
            fixed_text = text
            
            # 1. 따옴표 문제 수정
            fixed_text = re.sub(r'([^\\])\"([^"]*)\"([^\\])', r'\1"\2"\3', fixed_text)
            
            # 2. 쉼표 누락 수정 (마지막 항목 뒤 쉼표 제거)
            fixed_text = re.sub(r',\s*}', '}', fixed_text)
            fixed_text = re.sub(r',\s*]', ']', fixed_text)
            
            # 3. 중괄호/대괄호 불일치 수정
            open_braces = fixed_text.count('{')
            close_braces = fixed_text.count('}')
            if open_braces > close_braces:
                fixed_text += '}' * (open_braces - close_braces)
            elif close_braces > open_braces:
                fixed_text = fixed_text.rstrip('}') + '}' * (close_braces - open_braces)
            
            print(f"🔧 수정된 JSON 길이: {len(fixed_text)}")
            return json.loads(fixed_text)
            
        except json.JSONDecodeError as e2:
            print(f"❌ JSON 수정 후에도 파싱 실패: {e2}")
            print(f"❌ 원본 텍스트를 그대로 반환합니다.")
            # 최후의 수단: 빈 결과 반환
            return {
                "평가결과": {str(i): 0 for i in range(1, 11)},
                "총점": 0,
                "세부등급": {str(i): "D" for i in range(1, 11)},
                "개선필요항목": ["JSON 파싱 오류"],
                "상세분석": "LLM 응답의 JSON 형식이 올바르지 않습니다."
            }

def _call_llm(model, prompt: str) -> Dict[str, Any]:
    resp = model.generate_content(prompt)
    text = getattr(resp, "text", "") or ""
    if not text:
        try:
            cand0 = resp.candidates[0]
            parts = getattr(getattr(cand0, "content", None), "parts", []) or []
            text = "".join(getattr(p, "text", "") for p in parts if getattr(p, "text", ""))
        except Exception:
            pass
    if not text:
        raise RuntimeError("LLM 응답 파싱 실패(빈 응답). 프롬프트 또는 안전필터 확인.")
    
    # JSON 파싱 전에 텍스트 정제
    text = _clean_text_for_json(text)
    
    try:
        return _extract_json(text)
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON 파싱 실패, 텍스트 정제 후 재시도: {e}")
        # 추가 정제 시도
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return _extract_json(text)

# ===== 재귀 탐색 도구 =====
def _iter_paths(obj: Any, prefix: Tuple=()) -> Iterable[Tuple[Tuple, Any]]:
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _iter_paths(v, prefix + (k,))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _iter_paths(v, prefix + (i,))
    else:
        yield (prefix, obj)

def _path_to_str(path: Tuple) -> str:
    return ".".join(str(p) for p in path)

TITLE_KEY_HINTS = ["title","post_title","page_title","doc_title","headline","h1"]
CONTENT_KEY_HINTS = ["content","body","post_content","article","markdown","md","html","text",
                     "paragraph","paragraphs","section","sections","blocks","document","value"]

def _score_title_candidate(s: str) -> float:
    if not isinstance(s, str): return -1
    l = len(s.strip())
    if l < 3: return -1
    score = 0.0
    if 10 <= l <= 120: score += 2.0
    elif l <= 200: score += 1.0
    if sum(ch in "#*{}[]" for ch in s) > 5: score -= 0.5
    return score + min(l/200.0, 1.0)

def _normalize_block_to_text(val: Any) -> str:
    if isinstance(val, str):
        return val
    if isinstance(val, list):
        parts = []
        for it in val:
            if isinstance(it, str):
                parts.append(it)
            elif isinstance(it, dict):
                for k in ["text","content","paragraph","markdown","md","html","value"]:
                    v = it.get(k)
                    if isinstance(v, str) and v.strip():
                        parts.append(v)
                        break
        return "\n\n".join(p for p in parts if p.strip())
    if isinstance(val, dict):
        for k in ["markdown","md","html","text","content","body","value"]:
            v = val.get(k)
            if isinstance(v, str) and v.strip():
                return v
        for k in ["paragraphs","sections","blocks"]:
            v = val.get(k)
            if isinstance(v, list) and v:
                s = _normalize_block_to_text(v)
                if s.strip(): return s
    return ""

def _extract_title_content(clog: Dict[str, Any]) -> Tuple[str, str, Dict[str, Any]]:
    cand_titles: List[Tuple[str, str, float]] = []
    cand_contents: List[Tuple[str, str, int]] = []
    for path, val in _iter_paths(clog):
        pstr = _path_to_str(path)
        key_lower = str(path[-1]).lower() if path else ""

        # 디버그 출력 추가
        if "title" in key_lower:
            print(f"DEBUG - 발견된 title 관련 키: path={pstr}, key_lower='{key_lower}', val='{val}', 매치={any(key_lower == h for h in TITLE_KEY_HINTS)}")
    
        if any(key_lower == h for h in TITLE_KEY_HINTS) and isinstance(val, str):
            s = val.strip()
            if s: 
                score = _score_title_candidate(s)
                print(f"DEBUG - title 후보 추가: '{s}', score={score}")
                cand_titles.append((pstr, s, score))
                
        if any(h in key_lower for h in CONTENT_KEY_HINTS):
            text = _normalize_block_to_text(val)
            if not text and isinstance(val, str):
                text = val
            if isinstance(text, str) and text.strip():
                cand_contents.append((pstr, text, len(text)))
    title, title_path = "", ""
    if cand_titles:
        cand_titles.sort(key=lambda x: x[2], reverse=True)
        title_path, title, _ = cand_titles[0]
    else:
        # 먼저 최상위 레벨의 title 키를 직접 확인 (우선순위)
        for k in ["title", "Title", "post_title"]:
            if k in clog and isinstance(clog[k], str) and clog[k].strip():
                title = clog[k].strip()
                title_path = k
                break
        
        # 직접 키 접근이 실패한 경우에만 selected.title 확인
        if not title:
            if isinstance(clog.get("selected"), dict) and isinstance(clog["selected"].get("title"), str):
                title = clog["selected"]["title"].strip()
                title_path = "selected.title"
    content, content_path = "", ""
    if cand_contents:
        cand_contents.sort(key=lambda x: (x[2] >= 300, x[2]), reverse=True)
        content_path, content, _ = cand_contents[0]
    else:
        if isinstance(clog.get("content"), list):
            content = "\n\n".join(map(str, clog["content"])); content_path = "content(list)"
        if not content:
            for parent in ["result","data"]:
                if isinstance(clog.get(parent), dict):
                    v = clog[parent].get("content") or clog[parent].get("body") or clog[parent].get("post_content")
                    s = _normalize_block_to_text(v)
                    if s.strip():
                        content = s.strip(); content_path = f"{parent}.content/body/post_content"; break
    dbg = {
        "title_path": title_path,
        "content_path": content_path,
        "title_candidates": [{"path":p,"len":len(v),"score":sc} for (p,v,sc) in cand_titles[:5]],
        "content_candidates": [{"path":p,"len":l} for (p,_,l) in cand_contents[:5]],
    }
    return title.strip(), content.strip(), dbg

# ===== CSV 로드/규칙 컴파일 =====
def _find_existing(paths: List[Path]) -> Path:
    for p in paths:
        if p.exists(): return p
    raise FileNotFoundError(f"경로들 중 파일이 없습니다: {paths}")

def load_checklist_csv(path: Path) -> List[Dict[str, str]]:
    rows = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            # 헤더 예: 번호,항목명,항목설명,평가방법,위반위험도
            rows.append({k.strip(): (v.strip() if isinstance(v,str) else v) for k,v in r.items()})
    return rows

def compile_patterns(rows: List[Dict[str,str]]) -> Dict[int, List[re.Pattern]]:
    patterns: Dict[int, List[re.Pattern]] = {}
    for r in rows:
        try:
            idx = int(r.get("번호") or r.get("no") or r.get("index"))
        except Exception:
            continue
        p_list = BASE_PATTERNS.get(idx, []).copy()
        eval_method = (r.get("평가방법") or "").replace("<br>", "\n")
        # 키워드 후보 추출(간단)
        for kw in ["최고","유일","완전","100%","부작용 없음","이벤트","할인","전후","before","after",
                   "리뷰","후기","협찬","가격","원부터","심의번호","전문의","전문병원","주의사항","부작용","개인차",
                   "인증","상장","감사장","추천","기사형","보도자료","인터뷰","타 병원","최초","유일"]:
            if kw in eval_method and kw not in p_list:
                p_list.append(re.escape(kw))
        try:
            patterns[idx] = [re.compile(p, flags=re.I) for p in p_list]
        except re.error:
            # 잘못된 패턴은 스킵
            patterns[idx] = [re.compile(re.escape(p), flags=re.I) for p in p_list if p]
    return patterns

def rule_score_item(idx: int, text: str, pats: Dict[int, List[re.Pattern]]) -> Tuple[int, List[str]]:
    if idx not in pats or not pats[idx]:
        return 0, []
    hits = []
    for rgx in pats[idx]:
        m = rgx.search(text)
        if m: hits.append(m.group(0))
    if not hits: return 0, []
    # 휴리스틱 스코어링
    strong = any(re.search(r"100\s*%|부작용\s*없", h, re.I) for h in hits)
    if idx == 1 and strong: return 5, hits
    if idx in [3,5,7,14] and len(hits) >= 2: return 5, hits
    # 기본: 1개 발견=2, 2개 이상=3 (필요시 세분화)
    return (2 if len(hits) == 1 else 3), hits

def rule_score_all(title: str, content: str, pats: Dict[int, List[re.Pattern]]) -> Dict[str, Dict[str, Any]]:
    text = f"{title}\n\n{content}"
    results: Dict[str, Dict[str, Any]] = {}
    for i in range(1, 16):
        s, hits = rule_score_item(i, text, pats)
        results[str(i)] = {"score": s, "hits": hits}
    return results

# ===== 가중 총점 =====
def parse_report_weights(md_path: Path) -> Dict[str, float]:
    # 간단 파서: 3.1 테이블 라인에서 숫자 추출 (없으면 DEFAULT 사용)
    try:
        md = _read_text(md_path)
        lines = md.splitlines()
        weights = {}
        in_table = False
        for ln in lines:
            if "| 순위 |" in ln and "우선순위 점수" in ln:
                in_table = True
                continue
            if in_table:
                if ln.strip().startswith("|------"):
                    continue
                if not ln.strip().startswith("|"):
                    break
                # | 1 | 허위·과장 표현 | 8.6 | ...
                cells = [c.strip() for c in ln.strip().strip("|").split("|")]
                if len(cells) >= 3:
                    name = cells[1]; w_str = cells[2]
                    # name → index 역매핑
                    idx = None
                    for k,v in CHECKLIST_NAMES.items():
                        if v in name:
                            idx = k; break
                    if idx:
                        try:
                            weights[str(idx)] = float(w_str)
                        except:
                            pass
        return weights if weights else DEFAULT_REPORT_WEIGHTS
    except Exception:
        return DEFAULT_REPORT_WEIGHTS

def weighted_total(final_scores: Dict[str,int], weights: Dict[str,float], evaluation_mode: str = "medical") -> float:
    if evaluation_mode == "seo":
        # SEO 모드: 실제 점수의 합계를 그대로 사용
        return round(sum(final_scores.get(str(i), 0) for i in range(1, 11)), 1)
    else:
        # 의료법 모드: 기존 방식 (5점 만점 기준)
        num = sum((final_scores.get(k,0)/5.0) * weights[k] for k in weights)
        den = sum(weights.values())
        return round((num/den)*100, 1) if den else 0.0

# ===== 임계 비교 =====
def over_threshold(scores: Dict[str, int], criteria: Dict[str, Dict[str, int]], mode: str, evaluation_mode: str = "medical") -> List[int]:
    th = criteria.get(mode)
    if not th:
        raise ValueError(f"criteria 모드가 올바르지 않습니다: {mode}")
    violations = []
    for k, v in scores.items():
        key = str(k)
        try:
            idx = int(key)
        except ValueError:
            continue
        limit = th.get(key, 5)
        # SEO와 의료법 평가 기준 다르게 적용
        if evaluation_mode == "seo":
            if v <= limit:  # SEO: 점수가 낮으면 위반
                violations.append(idx)
        else:
            if v >= limit:  # 의료법: 점수가 높으면 위반
                violations.append(idx)
    return violations

def map_stage(violations: List[int]) -> str:
    if any(v in [1,2,3,5,7,9,12,14] for v in violations):
        return "content"
    if any(v in [6,10,11] for v in violations):
        return "both"
    if any(v in [4,8,15] for v in violations):
        return "content"
    return "content"

# ===== 패치 적용 =====
def apply_patches(title: str, content: str, patch_obj: Dict[str, Any]) -> Tuple[str, str]:
    new_title, new_content = title, content
    for u in patch_obj.get("patch_units", []):
        typ = u.get("type")
        scope = u.get("scope")
        before = u.get("before", "")
        after = u.get("after", "")
        if scope == "title":
            if typ == "replace":
                new_title = new_title.replace(before, after) if before else after
            elif typ == "insert":
                new_title = after
            elif typ == "delete" and before:
                new_title = new_title.replace(before, "")
        else:
            if typ == "replace" and before and before in new_content:
                new_content = new_content.replace(before, after)
            elif typ == "insert" and after:
                new_content += "\n\n" + after
            elif typ == "delete" and before:
                new_content = new_content.replace(before, "")
    return new_title, new_content

# ===== 프롬프트 빌드 =====
def build_eval_prompt(title: str, content: str, prompt_path: Path = EVAL_PROMPT_PATH, seo_metrics: Dict[int, int] = None) -> str:
    # 입력 텍스트 정제 (JSON 안전)
    title = _clean_text_for_json(title) if title else ""
    content = _clean_text_for_json(content) if content else ""
    
    base = _read_text(prompt_path)

    # SEO 모드에서 실제 측정값과 정답을 프롬프트에 포함
    if seo_metrics and "seo_evaluation_prompt" in str(prompt_path):
        # 각 항목별 정확한 점수 계산
        def get_correct_score(item_num, value):
            if item_num == 1:  # 제목 글자수 (공백 포함)
                if 26 <= value <= 55 : return 11
                elif 16 <= value <= 25 or 56 <= value <= 69 : return 8
                elif 8 <= value <= 15 or 70 <= 80 : return 5
                else: return 2
            elif item_num == 2:  # 제목 글자수 (공백 제외)
                if 19 <= value <= 40: return 11
                elif 14 <= value <= 18 or 41<= value <= 50: return 8
                elif 8 <= value <= 13 or 51 <= value <=62: return 5
                else: return 2
            elif item_num == 3:  # 본문 글자수 (공백 포함)
                if 1233 <= value <= 2628: return 15
                elif 986 <= value <= 1232 or 2629 <= value <= 3664 : return 12
                elif 542 <= value <= 985 or 3665 <= value <= 4523 : return 9
                else: return 5
            elif item_num == 4:  # 본문 글자수 (공백 제외)
                if 936 <= value <= 1997: return 15
                elif 685 <= value <= 935 or 1998 <= value <= 2634 : return 12
                elif 423 <= value <= 684 or 2635 <= value <= 3529 : return 9
                else: return 5
            elif item_num == 5:  # 총 형태소 개수
                if 249 <= value <= 482 : return 7
                elif 193 <= value <= 248 or 483 <= value <= 562: return 5
                elif  128 <= value <= 192 or 563 <= value <= 694: return 3
                else: return 1
            elif item_num == 6:  # 총 음절 개수
                if 298 <= value <= 632: return 7
                elif 214 <= value <= 297 or 633 <= value <= 825: return 5
                elif 152 <= value <= 213 or 826 <= value <= 998: return 3
                else: return 1
            elif item_num == 7:  # 총 단어 개수
                if 82 <= value <= 193: return 7
                elif 54 <= value <= 81 or 194 <= value <= 289 : return 5
                elif 31 <= value <= 53 or 290 <= value <=412: return 3
                else: return 1
            elif item_num == 8:  # 어뷰징 단어 개수
                if 0 <= value <= 7: return 7
                elif 8 <= value <= 14: return 5
                elif 15 <= value <= 21: return 3
                else: return 0
            elif item_num == 9:  # 본문 이미지
                if 3 <= value <= 11: return 7
                elif 4 <= value <= 11: return 5
                elif 4 <= value <= 11: return 3
                else: return 0
            elif item_num == 10: # 백링크 존재 여부
                if value >= 1 : return 13
                else: return 0
            return 0

        metrics_text = f"""

실제 측정값과 정답:
1. 제목 글자수 (공백 포함): {seo_metrics.get(1, 0)}글자 → {get_correct_score(1, seo_metrics.get(1, 0))}점
2. 제목 글자수 (공백 제외): {seo_metrics.get(2, 0)}글자 → {get_correct_score(2, seo_metrics.get(2, 0))}점  
3. 본문 글자수 (공백 포함): {seo_metrics.get(3, 0)}글자 → {get_correct_score(3, seo_metrics.get(3, 0))}점
4. 본문 글자수 (공백 제외): {seo_metrics.get(4, 0)}글자 → {get_correct_score(4, seo_metrics.get(4, 0))}점
5. 총 형태소 개수: {seo_metrics.get(5, 0)}개 → {get_correct_score(5, seo_metrics.get(5, 0))}점
6. 총 음절 개수: {seo_metrics.get(6, 0)}개 → {get_correct_score(6, seo_metrics.get(6, 0))}점
7. 총 단어 개수: {seo_metrics.get(7, 0)}개 → {get_correct_score(7, seo_metrics.get(7, 0))}점
8. 어뷰징 단어 개수: {seo_metrics.get(8, 0)}개 → {get_correct_score(8, seo_metrics.get(8, 0))}점
9. 본문 이미지: {seo_metrics.get(9, 0)}개 → {get_correct_score(9, seo_metrics.get(9, 0))}점
10. 백링크 존재 여부: {seo_metrics.get(10, 0)}개 → {get_correct_score(10, seo_metrics.get(10, 0))}점

위의 정답 점수를 그대로 사용하세요! 다른 점수를 부여하지 마세요!"""
        base = base + metrics_text

    enforce = "\n\n반드시 위의 출력 형식의 JSON만 출력하고, 추가 설명은 쓰지 마십시오."
    return base.replace("[여기에 제목 입력]", title).replace("[여기에 본문 입력]", content) + enforce

def build_regen_prompt(title: str, content: str, criteria_mode: str,
                       violations: List[int], hints: List[str]) -> str:
    # 입력 텍스트 정제 (JSON 안전)
    title = _clean_text_for_json(title) if title else ""
    content = _clean_text_for_json(content) if content else ""
    
    base = _read_text(REGEN_PROMPT_PATH)
    vnames = [f"{CHECKLIST_NAMES[i]}({i})" for i in violations]
    violations_json = json.dumps(vnames, ensure_ascii=False)
    hints_json = json.dumps(hints or [], ensure_ascii=False)
    prompt = (base
              .replace("{title}", title)
              .replace("{content}", content)
              .replace("{criteria}", criteria_mode)
              .replace("{violations}", violations_json)
              .replace("{hints}", hints_json))
    return prompt

# ===== 재생성 적합도(0~100) =====
RISK_KEYWORDS = {
    "부작용": [r"부작용", r"주의사항", r"개인차", r"합병증"],
    "가격고지": [r"가격", r"비용", r"추가\s*비용", r"부가세"],
    "근거제시": [r"연구|임상|데이터|근거|가이드라인"],
    "유인삭제": [r"리뷰\s*이벤트|추첨|사은품|기프티콘|대가"],
    "과장완화": [r"100\s*%|최고|유일|완전\s*무통|부작용\s*없"],
}

def _presence_rate(text: str, patterns: List[str]) -> float:
    if not patterns: return 0.0
    hits = sum(1 for p in patterns if re.search(p, text, re.I))
    return hits / len(patterns)

def regen_fit_score(before_over: List[int], after_over: List[int],
                    before_text: str, after_text: str,
                    tips: List[str]) -> Dict[str, Any]:
    # 1) 위반해소율
    b = len(before_over); a = len(after_over)
    risk_reduction = (b - a) / b if b else 1.0

    # 2) 권고 반영율
    adherence_checks = []
    for t in tips:
        t = str(t)
        key = None
        if any(k in t for k in ["부작용","주의","개인차"]): key = "부작용"
        elif any(k in t for k in ["가격","비용","부가세"]): key = "가격고지"
        elif any(k in t for k in ["연구","임상","데이터","근거"]): key = "근거제시"
        elif any(k in t for k in ["리뷰","이벤트","추첨","사은품","대가","기프티콘"]): key = "유인삭제"
        elif any(k in t for k in ["100%","최고","유일","완전","무통","과장","절대"]): key = "과장완화"

        if key:
            pats = RISK_KEYWORDS[key]
            if key in ["부작용","가격고지","근거제시"]:
                adherence_checks.append(_presence_rate(after_text, pats))
            else:
                before_r = _presence_rate(before_text, pats)
                after_r  = _presence_rate(after_text, pats)
                adherence_checks.append(1.0 if after_r < before_r else 0.0)

    guideline_adherence = sum(adherence_checks)/len(adherence_checks) if adherence_checks else 0.0

    # 3) 흐름 안정성
    def stats(s: str):
        paras = [p for p in s.split("\n\n") if p.strip()]
        sents = re.split(r"[.!?]\s+|[.\n]\s+", s)
        chars = len(s)
        return {
            "paras": len(paras) or 1,
            "sents": len([x for x in sents if x.strip()]) or 1,
            "chars": chars or 1
        }
    sb = stats(before_text); sa = stats(after_text)

    def stable_ratio(a,b): return max(0.0, 1.0 - abs(a-b)/max(a,1))
    flow = 0.5*stable_ratio(sa["paras"], sb["paras"]) + 0.3*stable_ratio(sa["sents"], sb["sents"]) + 0.2*stable_ratio(sa["chars"], sb["chars"])
    flow = max(0.0, min(flow, 1.0))

    final = round((0.5*risk_reduction + 0.3*guideline_adherence + 0.2*flow)*100)
    return {
        "risk_reduction_rate": round(risk_reduction, 3),
        "guideline_adherence": round(guideline_adherence, 3),
        "flow_stability": round(flow, 3),
        "score_0_100": final
    }

def get_seo_grade_by_actual_value(actual_value: int, item_num: int) -> str:
    """실제 측정값을 기준으로 SEO 등급 판정 (A/B/C/D) - 수정된 기준"""
    
    # content_evaluation_prompt.txt의 등급 기준 (min, max만 사용)
    grade_criteria = {
        1: {
            'A': [(26, 55)], 
            'B': [(16, 25), (56, 69)], 
            'C': [(8, 15), (70, 80)], 
            'D': [(0, 7), (81, 999)]
        },        # 제목 글자수 (공백 포함)
        2: {
            'A': [(19, 40)], 
            'B': [(14, 18), (41, 50)], 
            'C': [(8, 13), (51, 62)], 
            'D': [(0, 7), (63, 999)]
        },         # 제목 글자수 (공백 제외)
        3: {
            'A': [(1233, 2628)], 
            'B': [(986, 1232), (2629, 3664)], 
            'C': [(542, 985), (3665, 4523)], 
            'D': [(0, 541), (4524, 999999)]
        },     # 본문 글자수 (공백 포함)
        4: {
            'A': [(936, 1997)], 
            'B': [(685, 935), (1998, 2634)], 
            'C': [(423, 684), (2635, 3529)], 
            'D': [(0, 422), (3530, 999999)]
        },       # 본문 글자수 (공백 제외)
        5: {
            'A': [(249, 482)], 
            'B': [(193, 248), (483, 562)], 
            'C': [(128, 192), (563, 694)], 
            'D': [(0, 127), (695, 999999)]
        },          # 총 형태소 개수
        6: {
            'A': [(298, 632)], 
            'B': [(214, 297), (633, 825)], 
            'C': [(152, 213), (826, 998)], 
            'D': [(0, 151), (999, 999999)]
        },          # 총 음절 개수
        7: {
            'A': [(82, 193)], 
            'B': [(54, 81), (194, 289)], 
            'C': [(31, 53), (290, 412)], 
            'D': [(0, 30), (413, 999999)]
        },              # 총 단어 개수
        8: {
            'A': [(0, 7)], 
            'B': [(8, 14), (22, 30)], 
            'C': [(15, 21), (31, 40)], 
            'D': [(0, 21), (41, 999)]
        },                   # 어뷰징 단어 개수
        9: {
            'A': [(3, 11)], 
            'B': [(4, 11), (12, 21)], 
            'C': [(4, 11), (22, 30)], 
            'D': [(0, 3), (31, 999)]
        },               # 본문 이미지
        10: {
            'A': [(1, 999)], 
            'D': [(0, 0)]
        },               # 백링크 존재 여부
    }
    
    if item_num not in grade_criteria:
        return "N/A"
    
    criteria = grade_criteria[item_num]
    
    # 값이 속한 구간을 찾아서 해당 등급 반환
    for grade, ranges in criteria.items():
        for min_val, max_val in ranges:
            if min_val <= actual_value <= max_val:
                return grade
    
    # 어떤 구간에도 속하지 않으면 가장 가까운 구간의 등급 선택
    closest_grade = "D"
    min_distance = float('inf')
    
    for grade, ranges in criteria.items():
        for min_val, max_val in ranges:
            distance = min(abs(actual_value - min_val), abs(actual_value - max_val))
            if distance < min_distance:
                min_distance = distance
                closest_grade = grade
    
    return closest_grade

def get_pass_status_by_threshold(final_score: int, threshold: int, evaluation_mode: str) -> str:
    """final_score와 threshold 비교로 통과 여부 판정 (O/X)"""
    if evaluation_mode == "seo":
        return "O" if final_score >= threshold else "X"
    else:
        return "O" if final_score <= threshold else "X"

def get_medical_compliance_level_by_item(final_score: int, item_num: int) -> str:
    """의료법 각 항목별 점수에 따른 구체적인 준수 수준 반환"""
    
    # 각 항목별 점수-등급 매핑
    item_grade_mapping = {
        1: {0: "객관적 표현만 사용", 2: "경미한 과장 표현", 5: "명백한 허위·과장 표현"},
        2: {0: "치료경험담 없음", 3: "일반적인 후기 수준", 5: "대가성 치료경험담 또는 구체적 치료효과 서술"},
        3: {0: "가격 관련 내용 없음", 3: "불명확한 할인 정보", 5: "허위 할인 정보 또는 할인 전 가격 미표시"},
        4: {0: "심의번호 표시 또는 심의 면제 대상", 2: "심의번호 누락", 5: "명백한 미심의 의료광고"},
        5: {0: "전후 사진 없음", 3: "간접적인 사진", 5: "직접적인 전후 비교사진"},
        6: {0: "적절한 자격 표시", 3: "모호한 표현", 5: "허위 전문의 표시"},
        7: {0: "유인 행위 없음", 3: "간접적 유인", 5: "직접적 유인·알선"},
        8: {0: "의료인이 작성한 광고", 2: "광고 주체 모호", 5: "비의료인이 작성한 의료광고"},
        9: {0: "충분한 근거 제시", 2: "부족한 근거", 4: "근거 없는 효과 주장"},
        10: {0: "비교 내용 없음", 2: "간접적 비교", 4: "직접적 비교 광고"},
        11: {0: "일반 광고 형태", 2: "기사형 의심", 4: "명백한 기사형 광고"},
        12: {0: "충분한 정보 제공", 2: "부족한 정보", 3: "중요 정보 누락"},
        13: {0: "공식 인증만 표시", 2: "모호한 인증", 4: "허위 인증 표시"},
        14: {0: "정확한 가격 정보", 2: "불명확한 표시", 4: "허위 가격 표시"},
        15: {0: "정확한 정보", 1: "일부 불일치", 3: "허위 정보"}
    }
    
    if item_num not in item_grade_mapping:
        return "알 수 없는 항목"
    
    item_mapping = item_grade_mapping[item_num]
    
    if final_score in item_mapping:
        return item_mapping[final_score]
    
    closest_score = min(item_mapping.keys(), key=lambda x: abs(x - final_score))
    return item_mapping[closest_score]

def get_medical_violation_status(final_score: int, threshold: int) -> str:
    """의료법 평가 점수에 따른 위반 상태 반환 (적합/부적합)"""
    return "적합" if final_score <= threshold else "부적합"

# ===== 메인 루프 =====
def run_single_mode(criteria_mode: str = "표준",
        max_loops: int = 2,
        auto_yes: bool = False,
        log_dir: Union[str, None] = None,
        pattern: Union[str, None] = None,
        debug: bool = False,
        csv_path: Union[str, None] = None,
        report_path: Union[str, None] = None,
        evaluation_mode: str = "medical"):

    # 로그 디렉토리 (타임스탬프별 폴더 생성)
    base_log_dir = Path(log_dir) if log_dir else DEFAULT_LOG_DIR
    current_timestamp = _nowstamp()
    log_dir_path = _ensure_timestamp_log_dir(base_log_dir, current_timestamp)

    # 탐색 패턴을 TXT 파일로 변경
    patterns = [p.strip() for p in (pattern.split(",") if pattern else []) if p.strip()]
    search_patterns = patterns or [
        "*_title_content_result.txt",
        "*title_content*.txt", 
        "*content*.txt",
        "*_content_result.txt"
    ]

    # 0) TXT 파일 로드
    content_path = _latest(log_dir_path, search_patterns)
    
    # TXT 파일 읽기
    txt_content = _read_text(content_path)
    
    # 첫 줄을 제목으로, 나머지를 본문으로 분리
    lines = txt_content.split('\n')
    if lines:
        title = lines[0].strip()
        content = '\n'.join(lines[2:]).strip() if len(lines) > 2 else ""  # 첫 줄 제목, 둘째 줄 공백, 셋째 줄부터 본문
    else:
        title = ""
        content = ""
    
    print(f"DEBUG - TXT에서 추출된 제목: '{title}'")
    print(f"DEBUG - TXT에서 추출된 본문 길이: {len(content)}")
    
    if not title:
        raise ValueError(f"{content_path.name}에서 제목을 찾을 수 없습니다.")

    # 콘텐츠가 없으면 더미 콘텐츠 사용
    if not content:
        content = "제목 평가용 더미 콘텐츠입니다."

    # HTML 파일 찾기 (SEO 모드에서 본문 이미지 계산용)
    html_content = None
    html_file = None
    if evaluation_mode == "seo":
        # TXT 파일과 같은 디렉토리에서 연관된 HTML 파일 찾기
        txt_dir = content_path.parent
        txt_stem = content_path.stem
        
        # 가능한 HTML 파일 패턴들
        html_patterns = [
            f"{txt_stem}.html",                    # 20250825_205923_title_content_result.html
            f"{txt_stem.replace('_title_content_result', '')}.html",  # 20250825_205923.html
            f"{txt_stem.replace('_content_result', '')}.html",        # 20250825_205923.html  
            f"{txt_stem.replace('_result', '')}.html",                # 20250825_205923_title_content.html
        ]
        
        # 추가로 타임스탬프 부분만 사용한 패턴들
        timestamp_part = txt_stem.split('_')[0] + '_' + txt_stem.split('_')[1] if '_' in txt_stem else txt_stem
        html_patterns.extend([
            f"{timestamp_part}.html",
            f"{timestamp_part}_content.html",
            f"{timestamp_part}_result.html"
        ])
        
        for pattern in html_patterns:
            html_candidate = txt_dir / pattern
            if html_candidate.exists():
                html_file = html_candidate
                try:
                    html_content = _read_text(html_file)
                    print(f"✅ HTML 파일 발견: {html_file.name} ({len(html_content)}자)")
                    break
                except Exception as e:
                    print(f"⚠️ HTML 파일 읽기 실패 {html_file.name}: {e}")
                    continue
        
        if not html_file:
            print(f"⚠️ HTML 파일을 찾을 수 없습니다. TXT 파일에서 이미지 개수 계산")
            print(f"   검색한 패턴: {html_patterns}")

    # SEO 모드에서 실제 측정값 계산 (HTML 콘텐츠 포함)
    seo_metrics = {}
    if evaluation_mode == "seo":
        seo_metrics = calculate_seo_metrics(title, content, html_content)

    # 1) 기준/CSV/리포트 가중치 로드
    if evaluation_mode == "seo":
        criteria = _read_json(SEO_CRITERIA_PATH)
        eval_prompt_path = SEO_PROMPT_PATH
    else:
        criteria = _read_json(CRITERIA_PATH)
        eval_prompt_path = EVAL_PROMPT_PATH
    if evaluation_mode == "medical":
        csv_file = Path(csv_path) if csv_path else _find_existing(DEFAULT_CSV_PATHS)
        rows = load_checklist_csv(csv_file)
        pats = compile_patterns(rows)
        report_file = Path(report_path) if report_path else _find_existing(DEFAULT_REPORT_PATHS)
        weights = parse_report_weights(report_file)
        # 2) 규칙 기반 사전 스코어
        rule_all = rule_score_all(title, content, pats)
    else:
        # SEO 모드에서는 규칙 기반 평가 건너뛰기
        rule_all = {}
        weights = {str(i): 1.0 for i in range(1, 11)}  # SEO는 9개 -> 10개 항목

    # 3) LLM 평가
    model = _setup_llm()
    if evaluation_mode == "seo":
        eval_prompt = build_eval_prompt(title, content, eval_prompt_path, seo_metrics)
    else:
        eval_prompt = build_eval_prompt(title, content, eval_prompt_path)
    result = _call_llm(model, eval_prompt)
    llm_scores: Dict[str, int] = result.get("평가결과", {}) or {}
    analysis: str = result.get("상세분석", "") or ""
    tips: List[str] = result.get("권고수정", []) or []

    def fuse(rule_all: Dict[str, Dict[str,Any]], llm_scores: Dict[str,int]) -> Dict[str,int]:
        fused = {}
        max_items = 10 if evaluation_mode == "seo" else 15 # 9->10으로 변경
        for i in range(1,max_items + 1):
            r = int(rule_all.get(str(i),{}).get("score",0))
            l = int(llm_scores.get(str(i),0))
            fused[str(i)] = max(r,l)
        return fused

    final_scores = fuse(rule_all, llm_scores)

    # 4) 판정/가중 총점
    violations_before = over_threshold(final_scores, criteria, criteria_mode, evaluation_mode)
    print(f"DEBUG - final_scores: {final_scores}")
    print(f"DEBUG - criteria[{criteria_mode}]: {criteria.get(criteria_mode)}")
    weighted_total_before = weighted_total(final_scores, weights, evaluation_mode)

    history: List[Dict[str, Any]] = []
    loop = 0
    patched_once = False
    title_before, content_before = title, content
    applied_patch_obj = None  # 패치 객체 초기화

    while True:
        loop += 1
        history.append({
            "loop": loop,
            "rule_scores": {k:v["score"] for k,v in rule_all.items()},
            "llm_scores": llm_scores,
            "final_scores": final_scores,
            "violations": violations_before,
            "analysis": analysis,
            "tips": tips
        })

        if not violations_before or loop >= max_loops:
            # 최종 산출 JSON
            out = {
                "input": {
                    "source_log": content_path.name,
                    "title": title,
                    "content": content,
                    "content_len": len(content)
                },
                "modes": {"criteria": criteria_mode},
                "scores": {
                    "by_item": {
                        str(i): {
                            "name": (SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]),
                            "rule_score": int(rule_all.get(str(i),{}).get("score",0)),
                            "llm_score": int(llm_scores.get(str(i),0)),
                            "final_score": int(final_scores.get(str(i),0)),
                            "threshold": criteria[criteria_mode].get(str(i),5),
                            "passed": int(final_scores.get(str(i),0)) <= criteria[criteria_mode].get(str(i),5),
                            "evidence": {
                                "regex_hits": rule_all.get(str(i),{}).get("hits",[]),
                            },
                            **({"actual_value": seo_metrics.get(i, 0)} if evaluation_mode == "seo" else {}),
                            
                            # 의료법 전용 필드 추가
                            **({"compliance_level": get_medical_compliance_level_by_item(
                                int(final_scores.get(str(i),0)), i
                            )} if evaluation_mode == "medical" else {}),
                            **({"violation_status": get_medical_violation_status(
                                int(final_scores.get(str(i),0)), 
                                criteria[criteria_mode].get(str(i),5)
                            )} if evaluation_mode == "medical" else {}),
                            
                            # SEO 전용 필드 추가
                            **({"grade": get_seo_grade_by_actual_value(seo_metrics.get(i, 0), i)} if evaluation_mode == "seo" else {}),
                            **({"pass_status": get_pass_status_by_threshold(
                                int(final_scores.get(str(i),0)), 
                                criteria[criteria_mode].get(str(i),5), 
                                evaluation_mode
                            )} if evaluation_mode == "seo" else {})
                        } for i in range(1, 11 if evaluation_mode == "seo" else 16)
                    },
                    "weighted_total": weighted_total_before,
                    "llm_total_raw": sum(int(llm_scores.get(str(i),0)) for i in range(1, 11 if evaluation_mode == "seo" else 16)),
                    "rule_total_proxy": sum(int(rule_all.get(str(i),{}).get("score",0)) for i in range(1, 11 if evaluation_mode == "seo" else 16))
                },
                "violations": {
                    "over_threshold": violations_before,
                    "names": [(SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]) for i in violations_before]
                },
                "regen_fit": {
                    "applied": patched_once
                },
                "notes": {
                    "recommendations": tips,
                    "report_weights": weights
                },
                "title": title,
                "content": content
            }

            # 재생성이 있었으면 적합도 계산
            if patched_once:
                b_over = history[0]["violations"]
                a_over = violations_before
                before_text = f"{title_before}\n\n{content_before}"
                after_text  = f"{title}\n\n{content}"
                rf = regen_fit_score(b_over, a_over, before_text, after_text, tips)
                out["regen_fit"].update({
                    "before_over_threshold": len(b_over),
                    "after_over_threshold": len(a_over),
                    **rf
                })

            # 재생성 후 최종 평가 결과는 _after 접미사 추가
            if patched_once:
                out_path = log_dir_path / f"{current_timestamp}_evaluation_after.json"
            else:
                out_path = log_dir_path / f"{current_timestamp}_evaluation.json"
            _write_json(out_path, out)
            
            # ⭐ UI checklist 로그 생성
            generate_ui_checklist_logs(out, str(out_path))

            if patched_once:
                patched_path = log_dir_path / f"{current_timestamp}_content.patched.json"
                # 패치 정보와 함께 저장
                patched_data = {
                    "title": title,
                    "content": content,
                    "patch_log": {
                        "original_title": title_before,
                        "original_content": content_before,
                        "patch_applied": applied_patch_obj if applied_patch_obj else {"patch_units": [], "notes": "패치 정보 없음"},
                        "violations_resolved": violations_before,
                        "criteria_mode": criteria_mode,
                        "timestamp": current_timestamp
                    }
                }
                _write_json(patched_path, patched_data)

            print(("✅ 기준 충족. " if not violations_before else "⚠️ 반복 상한 도달. ") +
                  f"결과 저장: {out_path.name}")
            return

        # 필요 시 재생성
        if not auto_yes:
            yn = input(f"기준 초과 항목 {violations_before}가 있습니다. 국소 수정 진행할까요? (Y/n): ").strip().lower()
            if yn and yn.startswith("n"):
                # 재생성 거부 시에도 평가 결과 저장
                out = {
                    "input": {
                        "source_log": content_path.name,
                        "title": title,
                        "content": content,
                        "content_len": len(content)
                    },
                    "modes": {"criteria": criteria_mode},
                    "scores": {
                        "by_item": {
                            str(i): {
                                "name": (SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]),
                                "rule_score": int(rule_all.get(str(i),{}).get("score",0)),
                                "llm_score": int(llm_scores.get(str(i),0)),
                                "final_score": int(final_scores.get(str(i),0)),
                                "threshold": criteria[criteria_mode].get(str(i),5),
                                "passed": int(final_scores.get(str(i),0)) <= criteria[criteria_mode].get(str(i),5),
                                "evidence": {
                                    "regex_hits": rule_all.get(str(i),{}).get("hits",[]),
                                },
                                **({"actual_value": seo_metrics.get(i, 0)} if evaluation_mode == "seo" else {}),
                                
                                # 의료법 전용 필드 추가
                                **({"compliance_level": get_medical_compliance_level_by_item(
                                    int(final_scores.get(str(i),0)), i
                                )} if evaluation_mode == "medical" else {}),
                                **({"violation_status": get_medical_violation_status(
                                    int(final_scores.get(str(i),0)), 
                                    criteria[criteria_mode].get(str(i),5)
                                )} if evaluation_mode == "medical" else {}),
                                
                                # SEO 전용 필드 추가
                                **({"grade": get_seo_grade_by_actual_value(seo_metrics.get(i, 0), i)} if evaluation_mode == "seo" else {}),
                                **({"pass_status": get_pass_status_by_threshold(
                                    int(final_scores.get(str(i),0)), 
                                    criteria[criteria_mode].get(str(i),5), 
                                    evaluation_mode
                                )} if evaluation_mode == "seo" else {})
                            } for i in range(1, 9 if evaluation_mode == "seo" else 16)
                        },
                        "weighted_total": weighted_total_before,
                        "llm_total_raw": sum(int(llm_scores.get(str(i),0)) for i in range(1, 9 if evaluation_mode == "seo" else 16)),
                        "rule_total_proxy": sum(int(rule_all.get(str(i),{}).get("score",0)) for i in range(1, 9 if evaluation_mode == "seo" else 16))
                    },
                    "violations": {
                        "over_threshold": violations_before,
                        "names": [(SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]) for i in violations_before]
                    },
                    "regen_fit": {
                        "applied": False,  # 재생성 거부했으므로 False
                        "user_declined": True  # 사용자가 거부했다는 표시
                    },
                    "notes": {
                        "recommendations": tips,
                        "report_weights": weights
                    },
                    "title": title,
                    "content": content
                }
        
                out_path = log_dir_path / f"{current_timestamp}_evaluation.json"
                _write_json(out_path, out)
                print(f"⚠️ 재생성 거부. 원본 평가 결과 저장: {out_path.name}")
                
                # ⭐ UI checklist 로그 생성
                generate_ui_checklist_logs(out, str(out_path))
                
                # 평가 결과 반환 (재생성하지 않은 경우 evaluation.json)
                return {
                    "status": "completed",
                    "scores": {
                        "weighted_total": weighted_total_before,
                        "criteria": criteria_mode,
                        "evaluation_mode": evaluation_mode
                    },
                    "evaluation_file": str(out_path)
                }
                

        # ⭐ 재생성 전 평가 결과 저장 (BEFORE)
        before_out = {
            "input": {
                "source_log": content_path.name,
                "title": title,
                "content": content,
                "content_len": len(content)
            },
            "modes": {"criteria": criteria_mode},
            "scores": {
                "by_item": {
                    str(i): {
                        "name": (SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]),
                        "rule_score": int(rule_all.get(str(i),{}).get("score",0)),
                        "llm_score": int(llm_scores.get(str(i),0)),
                        "final_score": int(final_scores.get(str(i),0)),
                        "threshold": criteria[criteria_mode].get(str(i),5),
                        "passed": int(final_scores.get(str(i),0)) <= criteria[criteria_mode].get(str(i),5),
                        "evidence": {
                            "regex_hits": rule_all.get(str(i),{}).get("hits",[]),
                        },
                        **({"actual_value": seo_metrics.get(i, 0)} if evaluation_mode == "seo" else {}),
                        
                        # 의료법 전용 필드 추가
                        **({"compliance_level": get_medical_compliance_level_by_item(
                            int(final_scores.get(str(i),0)), i
                        )} if evaluation_mode == "medical" else {}),
                        **({"violation_status": get_medical_violation_status(
                            int(final_scores.get(str(i),0)), 
                            criteria[criteria_mode].get(str(i),5)
                        )} if evaluation_mode == "medical" else {}),
                        
                        # SEO 전용 필드 추가
                        **({"grade": get_seo_grade_by_actual_value(seo_metrics.get(i, 0), i)} if evaluation_mode == "seo" else {}),
                        **({"pass_status": get_pass_status_by_threshold(
                            int(final_scores.get(str(i),0)), 
                            criteria[criteria_mode].get(str(i),5), 
                            evaluation_mode
                        )} if evaluation_mode == "seo" else {})
                    } for i in range(1, 11 if evaluation_mode == "seo" else 16)
                },
                "weighted_total": weighted_total_before,
                "llm_total_raw": sum(int(llm_scores.get(str(i),0)) for i in range(1, 11 if evaluation_mode == "seo" else 16)),
                "rule_total_proxy": sum(int(rule_all.get(str(i),{}).get("score",0)) for i in range(1, 11 if evaluation_mode == "seo" else 16))
            },
            "violations": {
                "over_threshold": violations_before,
                "names": [(SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]) for i in violations_before]
            },
            "regen_fit": {
                "applied": False,
                "stage": "before_regeneration"
            },
            "notes": {
                "recommendations": tips,
                "report_weights": weights
            },
            "title": title,
            "content": content
        }
        
        # 최초 평가 결과 저장 (evaluation.json)
        eval_out_path = log_dir_path / f"{current_timestamp}_evaluation.json"
        _write_json(eval_out_path, before_out)
        print(f"💾 최초 평가 결과 저장: {eval_out_path.name}")
        
        # ⭐ 최초 UI checklist 로그 생성
        generate_ui_checklist_logs(before_out, str(eval_out_path))

        # 재생성 → 패치
        stage = map_stage(violations_before)
        regen_prompt = build_regen_prompt(title, content, criteria_mode, violations_before, tips)
        patch_obj = _call_llm(model, regen_prompt)
        title, content = apply_patches(title, content, patch_obj)
        patched_once = True
        
        # 패치 객체를 나중에 사용할 수 있도록 저장
        applied_patch_obj = patch_obj

        # ⭐ 재평가 사이클: 규칙 + LLM + SEO메트릭 모두 다시 계산
        if evaluation_mode == "medical":
            rule_all = rule_score_all(title, content, pats)
        else:
            rule_all = {}
        
        # ⭐ SEO 모드에서 재생성 후 메트릭 재계산!
        if evaluation_mode == "seo":
            # 재생성 후에도 HTML 콘텐츠를 동일하게 사용 (이미지 개수는 HTML 기준 유지)
            seo_metrics = calculate_seo_metrics(title, content, html_content)  # ← 재계산!
            eval_prompt = build_eval_prompt(title, content, eval_prompt_path, seo_metrics)
        else:
            eval_prompt = build_eval_prompt(title, content, eval_prompt_path)
            
        result = _call_llm(model, eval_prompt)
        llm_scores = result.get("평가결과", {}) or {}
        analysis = result.get("상세분석", "") or ""
        tips = result.get("권고수정", []) or []
        max_items = 9 if evaluation_mode == "seo" else 15
        final_scores = {str(i): max(int(rule_all.get(str(i),{}).get("score",0)),
                                    int(llm_scores.get(str(i),0))) for i in range(1,max_items + 1)}
        violations_before = over_threshold(final_scores, criteria, criteria_mode, evaluation_mode)
        weighted_total_before = weighted_total(final_scores, weights, evaluation_mode)
        
        # 최종 평가 결과 생성 (after)
        after_out = {
            "input": {
                "source_log": content_path.name,
                "title": title,
                "content": content,
                "content_len": len(content)
            },
            "modes": {"criteria": criteria_mode},
            "scores": {
                "by_item": {
                    str(i): {
                        "name": (SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]),
                        "rule_score": int(rule_all.get(str(i),{}).get("score",0)),
                        "llm_score": int(llm_scores.get(str(i),0)),
                        "final_score": int(final_scores.get(str(i),0)),
                        "threshold": criteria[criteria_mode].get(str(i),5),
                        "passed": int(final_scores.get(str(i),0)) <= criteria[criteria_mode].get(str(i),5),
                        "evidence": {
                            "regex_hits": rule_all.get(str(i),{}).get("hits",[]),
                        },
                        **({"actual_value": seo_metrics.get(i, 0)} if evaluation_mode == "seo" else {}),
                        
                        # 의료법 전용 필드 추가
                        **({"compliance_level": get_medical_compliance_level_by_item(
                            int(final_scores.get(str(i),0)), i
                        )} if evaluation_mode == "medical" else {}),
                        **({"violation_status": get_medical_violation_status(
                            int(final_scores.get(str(i),0)), 
                            criteria[criteria_mode].get(str(i),5)
                        )} if evaluation_mode == "medical" else {}),
                        
                        # SEO 전용 필드 추가
                        **({"grade": get_seo_grade_by_actual_value(seo_metrics.get(i, 0), i)} if evaluation_mode == "seo" else {}),
                        **({"pass_status": get_pass_status_by_threshold(
                            int(final_scores.get(str(i),0)), 
                            criteria[criteria_mode].get(str(i),5), 
                            evaluation_mode
                        )} if evaluation_mode == "seo" else {})
                    } for i in range(1, 11 if evaluation_mode == "seo" else 16)
                },
                "weighted_total": weighted_total_before,
                "llm_total_raw": sum(int(llm_scores.get(str(i),0)) for i in range(1, 11 if evaluation_mode == "seo" else 16)),
                "rule_total_proxy": sum(int(rule_all.get(str(i),{}).get("score",0)) for i in range(1, 11 if evaluation_mode == "seo" else 16))
            },
            "violations": {
                "over_threshold": violations_before,
                "names": [(SEO_CHECKLIST_NAMES[i] if evaluation_mode == "seo" else CHECKLIST_NAMES[i]) for i in violations_before]
            },
            "regen_fit": {
                "applied": patched_once,
                "stage": "after_regeneration" if patched_once else "no_regeneration"
            },
            "notes": {
                "recommendations": tips,
                "report_weights": weights
            },
            "title": title,
            "content": content
        }
        
        # after 결과 저장
        after_out_path = log_dir_path / f"{current_timestamp}_evaluation_after.json"
        _write_json(after_out_path, after_out)
        
        # ⭐ after UI checklist 로그 생성
        generate_ui_checklist_logs(after_out, str(after_out_path))
        
        print(f"✅ 최종 평가 결과 저장: {after_out_path.name}")
        
        # 평가 결과 반환 (재생성된 경우 after 파일)
        return {
            "status": "completed",
            "scores": {
                "weighted_total": weighted_total_before,
                "criteria": criteria_mode,
                "evaluation_mode": evaluation_mode
            },
            "evaluation_file": str(after_out_path)
        }

def run(criteria_mode: str = "표준",
        max_loops: int = 2,
        auto_yes: bool = False,
        log_dir: Union[str, None] = None,
        pattern: Union[str, None] = None,
        debug: bool = False,
        csv_path: Union[str, None] = None,
        report_path: Union[str, None] = None,
        evaluation_mode: str = "both"):
    """
    메인 실행 함수 - 기본적으로 의료법과 SEO 둘 다 실행
    """
    
    print(f"🚀 Evaluation 시작 - evaluation_mode: {evaluation_mode}")
    print(f"📋 매개변수 확인: criteria_mode={criteria_mode}, max_loops={max_loops}, auto_yes={auto_yes}")
    
    if evaluation_mode == "both":
        print("🔄 순차 평가 모드: 의료법 → SEO 평가를 순차 실행합니다")
        print("=" * 60)
        
        # log_dir_path 정의
        log_dir_path = Path(log_dir) if log_dir else DEFAULT_LOG_DIR
        
        # 1) 의료법 평가 실행
        print("📋 1단계: 의료법 평가 실행 중...")
        medical_criteria_modes = {
            "엄격": "엄격",
            "표준": "표준", 
            "유연": "유연"
        }
        medical_criteria = medical_criteria_modes.get(criteria_mode, "표준")
        
        try:
            run_single_mode(
                criteria_mode=medical_criteria,
                max_loops=max_loops,
                auto_yes=auto_yes,
                log_dir=log_dir,
                pattern=pattern,
                debug=debug,
                csv_path=csv_path,
                report_path=report_path,
                evaluation_mode="medical"
            )
            print("✅ 의료법 평가 완료!")
            
            # 의료법 평가 완료 후 DB 업데이트
            try:
                # 의료법 평가 파일에서 타임스탬프 추출하여 content.json 찾기 (최초 + 재생성 모두 검색)
                medical_eval_files = list(log_dir_path.glob("**/*_evaluation.json")) + list(log_dir_path.glob("**/*_evaluation_after.json"))
                if medical_eval_files:
                    latest_medical_eval = max(medical_eval_files, key=lambda x: x.stat().st_mtime)
                    print(f"🔍 의료법 평가 파일 발견: {latest_medical_eval}")
                    
                    # 평가 파일에서 실제 데이터 읽기
                    with open(latest_medical_eval, 'r', encoding='utf-8') as f:
                        medical_eval_data = json.load(f)
                    
                    content_file = _find_content_file_for_evaluation(str(latest_medical_eval), log_dir_path)
                    if content_file:
                        auto_update_medicontent_posts(medical_eval_data, str(latest_medical_eval))
                        print("✅ 의료법 평가 결과 DB 업데이트 완료!")
                    else:
                        print("⚠️ content.json 파일을 찾을 수 없어 DB 업데이트를 건너뜁니다.")
                else:
                    print("⚠️ 의료법 평가 파일을 찾을 수 없어 DB 업데이트를 건너뜁니다.")
            except Exception as update_e:
                print(f"⚠️ 의료법 평가 결과 DB 업데이트 실패: {update_e}")
                
        except Exception as e:
            print(f"❌ 의료법 평가 실패: {e}")
        
        print("-" * 60)
        
        # 2) SEO 평가 실행  
        print("📈 2단계: SEO 평가 실행 중...")
        seo_criteria_modes = {
            "엄격": "우수",
            "표준": "양호",
            "유연": "보통"
        }
        seo_criteria = seo_criteria_modes.get(criteria_mode, "양호")
        
        try:
            run_single_mode(
                criteria_mode=seo_criteria,
                max_loops=max_loops,
                auto_yes=auto_yes,
                log_dir=log_dir,
                pattern=pattern,
                debug=debug,
                csv_path=csv_path,
                report_path=report_path,
                evaluation_mode="seo"
            )
            print("✅ SEO 평가 완료!")
            
            # SEO 평가 완료 후 DB 업데이트
            try:
                # SEO 평가 파일에서 타임스탬프 추출하여 content.json 찾기 (최초 + 재생성 모두 검색)
                seo_eval_files = list(log_dir_path.glob("**/*_evaluation.json")) + list(log_dir_path.glob("**/*_evaluation_after.json"))
                if seo_eval_files:
                    latest_seo_eval = max(seo_eval_files, key=lambda x: x.stat().st_mtime)
                    print(f"🔍 SEO 평가 파일 발견: {latest_seo_eval}")
                    
                    # 평가 파일에서 실제 데이터 읽기
                    with open(latest_seo_eval, 'r', encoding='utf-8') as f:
                        seo_eval_data = json.load(f)
                    
                    content_file = _find_content_file_for_evaluation(str(latest_seo_eval), log_dir_path)
                    if content_file:
                        auto_update_medicontent_posts(seo_eval_data, str(latest_seo_eval))
                        print("✅ SEO 평가 결과 DB 업데이트 완료!")
                    else:
                        print("⚠️ content.json 파일을 찾을 수 없어 DB 업데이트를 건너뜁니다.")
                else:
                    print("⚠️ SEO 평가 파일을 찾을 수 없어 DB 업데이트를 건너뜁니다.")
            except Exception as update_e:
                print(f"⚠️ SEO 평가 결과 DB 업데이트 실패: {update_e}")
                
        except Exception as e:
            print(f"❌ SEO 평가 실패: {e}")
        
        print("=" * 60)
        print("🎉 순차 평가 완료! 의료법과 SEO 평가가 각각 독립적으로 실행되었습니다.")
        
        # both 모드 완료 후 Status를 '작업 완료'로 업데이트
        try:
            print("🔄 both 모드 완료 - Status를 '작업 완료'로 업데이트 중...")
            
            # content.json 파일에서 Post ID 추출
            content_files = list(log_dir_path.glob("**/*_content.json"))
            if content_files:
                latest_content = max(content_files, key=lambda x: x.stat().st_mtime)
                
                with open(latest_content, 'r', encoding='utf-8') as f:
                    content_data = json.load(f)
                
                # Post ID 추출
                post_id = None
                if 'meta' in content_data:
                    meta = content_data['meta']
                    if 'post_id' in meta and meta['post_id']:
                        post_id = str(meta['post_id'])
                    elif 'post_data_request_id' in meta and meta['post_data_request_id']:
                        post_id = str(meta['post_data_request_id'])
                
                if post_id:
                    # Airtable에서 Medicontent Posts 레코드 찾기
                    load_dotenv()
                    from pyairtable import Api
                    
                    api = Api(os.getenv('AIRTABLE_API_KEY'))
                    posts_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Medicontent Posts')
                    
                    # Post ID로 레코드 검색
                    records = posts_table.all(formula=f"{{Post Id}} = '{post_id}'")
                    if records:
                        record_id = records[0]['id']
                        

                    else:
                        print(f"⚠️ Post ID '{post_id}'에 해당하는 레코드를 찾을 수 없습니다.")
                else:
                    print("⚠️ content.json에서 Post ID를 추출할 수 없습니다.")
            else:
                print("⚠️ content.json 파일을 찾을 수 없습니다.")
                
        except Exception as e:
            print(f"⚠️ Status 업데이트 실패: {e}")
        
        # 평가 결과 반환을 위해 최신 로그에서 점수 정보 추출
        try:
            # 최신 evaluation 로그에서 점수 정보 추출
            log_dir_path = Path(log_dir) if log_dir else DEFAULT_LOG_DIR
            
            # 의료법과 SEO 결과를 각각 찾기
            medical_score = None
            seo_score = None
            
            # 최신 평가 파일들 찾기
            eval_files = sorted(log_dir_path.glob("*_evaluation*.json"), key=lambda x: x.stat().st_mtime, reverse=True)
            
            for eval_file in eval_files[:5]:  # 최근 5개 파일만 확인
                try:
                    with open(eval_file, 'r', encoding='utf-8') as f:
                        eval_data = json.load(f)
                    
                    # 의료법 결과인지 SEO 결과인지 판단
                    modes = eval_data.get("modes", {})
                    criteria = modes.get("criteria", "")
                    scores = eval_data.get("scores", {})
                    weighted_total_val = scores.get("weighted_total", 0)
                    
                    if criteria in ["엄격", "표준", "유연"] and medical_score is None:
                        medical_score = weighted_total_val
                        print(f"📋 의료법 점수 추출: {medical_score} (기준: {criteria})")
                    elif criteria in ["우수", "양호", "보통"] and seo_score is None:
                        seo_score = weighted_total_val
                        print(f"📈 SEO 점수 추출: {seo_score} (기준: {criteria})")
                    
                    # 둘 다 찾으면 종료
                    if medical_score is not None and seo_score is not None:
                        break
                        
                except Exception as e:
                    print(f"⚠️ 평가 파일 읽기 실패: {eval_file.name} - {e}")
                    continue
            
            # 결과 구조체 생성
            result = {
                "status": "completed",
                "scores": {
                    "medical_score": medical_score,
                    "seo_score": seo_score,
                    "weighted_total": seo_score or medical_score  # 사용 가능한 점수 반환
                },
                "evaluation_mode": "both"
            }
            
            print(f"📊 최종 반환 결과: {result}")
            return result
            
        except Exception as e:
            print(f"⚠️ 점수 추출 실패: {e}")
            return {
                "status": "completed", 
                "scores": {"weighted_total": 0},
                "evaluation_mode": "both"
            }
    else:
        # 개별 모드 실행
        print(f"🎯 개별 평가 모드: {evaluation_mode} 평가만 실행합니다")
        run_single_mode(
            criteria_mode=criteria_mode,
            max_loops=max_loops,
            auto_yes=auto_yes,
            log_dir=log_dir,
            pattern=pattern,
            debug=debug,
            csv_path=csv_path,
            report_path=report_path,
            evaluation_mode=evaluation_mode
        )

# ===== CLI =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--criteria", default="표준", help="엄격 | 표준 | 유연")
    parser.add_argument("--max_loops", type=int, default=2)
    parser.add_argument("--auto-yes", action="store_true")
    parser.add_argument("--log-dir", default=str(DEFAULT_LOG_DIR), help="로그 디렉토리(기본: test_logs/test)")
    parser.add_argument("--pattern", default="", help="탐색 패턴(쉼표로 여러 개). 비우면 기본 패턴 리스트 사용")
    parser.add_argument("--csv-path", default="", help="medical_ad_checklist.csv 경로(미지정 시 기본 경로/ /mnt/data 탐색)")
    parser.add_argument("--report-path", default="", help="medical-ad-report.md 경로(미지정 시 기본 경로/ /mnt/data 탐색)")
    parser.add_argument("--debug", action="store_true", help="추출 후보/경로 디버그 로그 저장")
    parser.add_argument("--evaluation-mode", default="both", choices=["medical", "seo", "both"], help="평가 모드 (medical: 의료법만, seo: SEO만, both: 둘 다 - 기본값)")
    args = parser.parse_args()

    run(criteria_mode=args.criteria,
        max_loops=args.max_loops,
        auto_yes=args.auto_yes,
        log_dir=args.log_dir,
        pattern=args.pattern,
        debug=args.debug,
        csv_path=(args.csv_path or None),
        report_path=(args.report_path or None),
        evaluation_mode=args.evaluation_mode)


def _find_content_file_for_evaluation(evaluation_file_path: str, log_dir_path: Path) -> Union[Path, None]:
    """
    평가 파일과 연관된 content.json 파일을 찾는 헬퍼 함수
    
    Args:
        evaluation_file_path: 평가 파일 경로
        log_dir_path: 로그 디렉토리 경로
        
    Returns:
        content.json 파일 경로 또는 None
    """
    try:
        # 1. evaluation.json 파일에서 source_log 읽기
        with open(evaluation_file_path, 'r', encoding='utf-8') as f:
            eval_data = json.load(f)
        
        source_log = eval_data.get("input", {}).get("source_log", "")
        if not source_log:
            print(f"⚠️ evaluation.json에서 source_log를 찾을 수 없습니다.")
            return None
        
        print(f"🔍 source_log에서 추출: {source_log}")
        
        # 2. source_log에서 타임스탬프 추출 (YYYYMMDD_HHMMSS)
        import re
        timestamp_match = re.search(r'(\d{8}_\d{6})', source_log)
        if not timestamp_match:
            print(f"⚠️ source_log에서 타임스탬프를 찾을 수 없습니다: {source_log}")
            return None
            
        timestamp = timestamp_match.group(1)
        print(f"🔍 source_log에서 추출한 타임스탬프: {timestamp}")
        
        # 3. content.json 파일 찾기
        content_patterns = [
            f"{timestamp}_content.json"
        ]
        
        # 검색할 디렉토리들
        search_dirs = [
            log_dir_path,  # 로그 디렉토리
            log_dir_path.parent,  # 상위 디렉토리
        ]
        
        # 날짜별 하위 디렉토리도 검색
        if log_dir_path.exists():
            for date_dir in log_dir_path.iterdir():
                if date_dir.is_dir() and date_dir.name.isdigit() and len(date_dir.name) == 8:
                    search_dirs.append(date_dir)
        
        # content.json 파일 검색
        for pattern in content_patterns:
            for search_dir in search_dirs:
                if search_dir.exists():
                    found_files = list(search_dir.glob(pattern))
                    if found_files:
                        content_file = found_files[0]
                        print(f"✅ content.json 파일 발견: {content_file}")
                        return content_file
        
        print(f"⚠️ 타임스탬프 {timestamp}에 해당하는 content.json 파일을 찾을 수 없습니다.")
        return None
        
    except Exception as e:
        print(f"❌ content.json 파일 검색 실패: {e}")
        return None
