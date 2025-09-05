# agents/content_agent.py
# -*- coding: utf-8 -*-
"""
ContentAgent (7섹션 · 프롬프트 기반 · 이미지 바인딩 해석 · 의료광고 필터 · 로그 저장)
- 입력: 최신 input/plan/title 결과 자동 탐색 또는 경로 지정
- 프롬프트: test_prompt/content{1..7}_*.txt
- 모델: Gemini (GEMINI_API_KEY 필요)
- 저장:
    - 결과: test_logs/{mode}/{YYYYMMDD}/{timestamp}_content.json
    - 로그 : test_logs/{mode}/{YYYYMMDD}/{timestamp}_content_log.json
    - TXT : test_logs/{mode}/{YYYYMMDD}/{timestamp}_title_content_result.txt
"""

from __future__ import annotations

import os, re, json, time
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
import google.generativeai as genai

# 상단에 추가
import sys
# 프로젝트 루트: C:\818_text_model
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# 패키지로 실행될 때와 스크립트 실행될 때 모두 대비 (상대임포트 깨짐 방지)
if __package__ is None:
    __package__ = "agents"
# -------------------------------------------------------------------------

# 이제 아래처럼 일반 임포트 사용
from utils.html_converter import convert_content_to_html

# UI 모드에서 emote 이미지 가져오기 위한 import
import sys
import asyncio

# =========================
# 환경설정 / 모델
# =========================
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 필요합니다(.env)")
genai.configure(api_key=API_KEY)

class GeminiClient:
    def __init__(self, model="models/gemini-1.5-flash", temperature=0.65, max_output_tokens=4096):
        self.model = model
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens
        self.max_retries = 3
        self.retry_delay = 1.0

    def generate(self, prompt: str, temperature: Optional[float] = None) -> str:
        for attempt in range(self.max_retries):
            try:
                m = genai.GenerativeModel(self.model)
                resp = m.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=self.temperature if temperature is None else temperature,
                        max_output_tokens=self.max_output_tokens,
                        candidate_count=1,
                        top_p=0.95,
                        top_k=40,
                    ),
                )
                if getattr(resp, "text", None):
                    return resp.text
                if getattr(resp, "candidates", None):
                    parts = getattr(resp.candidates[0].content, "parts", [])
                    if parts and getattr(parts[0], "text", ""):
                        return parts[0].text
                raise ValueError("응답에 text 없음")
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                print(f"⚠️ Gemini 호출 실패 (시도 {attempt+1}/{self.max_retries}): {e}")
                time.sleep(self.retry_delay * (2 ** attempt))

gem = GeminiClient()

# =========================
# 유틸 (시간/경로/로딩)
# =========================
DEF_MODE = "use"

def _today() -> str: return datetime.now().strftime("%Y%m%d")
def _now() -> str:   return datetime.now().strftime("%Y%m%d_%H%M%S")

def _ensure_dir(p: Path): p.mkdir(parents=True, exist_ok=True)

def _mtime(p: Path) -> float:
    try: return p.stat().st_mtime
    except Exception: return 0.0

def _read(path: Path, default=""):
    try: return path.read_text(encoding="utf-8")
    except Exception: return default

def _json_load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def _get(d: Dict[str, Any], path: str, default=None):
    cur = d
    for k in path.split("."):
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return default
    return cur

# 최신 input 탐색 (신규/구형 모두)
def _latest_input(mode: str) -> Tuple[Optional[Path], Optional[dict]]:
    day = Path(f"test_logs/{mode}/{_today()}")
    patterns = ["*_input_logs.json", "*_input_log.json"]
    for pat in patterns:
        hits = sorted(day.glob(pat), key=_mtime, reverse=True)
        if hits:
            p = hits[0]
            try:
                data = _json_load(p)
                if isinstance(data, list) and data:
                    return p, data[-1]
                if isinstance(data, dict):
                    return p, data
            except Exception:
                pass
    root = Path(f"test_logs/{mode}")
    if not root.exists(): return None, None
    all_hits = sorted(list(root.rglob("*_input_logs.json")) + list(root.rglob("*_input_log.json")), key=_mtime, reverse=True)
    if not all_hits: return None, None
    p = all_hits[0]
    data = _json_load(p)
    if isinstance(data, list) and data: return p, data[-1]
    if isinstance(data, dict): return p, data
    return None, None

def _latest_plan(mode: str) -> Optional[Path]:
    day = Path(f"test_logs/{mode}/{_today()}")
    hits = sorted(day.glob("*_plan.json"), key=_mtime, reverse=True)
    if hits: return hits[0]
    root = Path(f"test_logs/{mode}")
    if not root.exists(): return None
    hits = sorted(root.rglob("*_plan.json"), key=_mtime, reverse=True)
    return hits[0] if hits else None

def _latest_title(mode: str) -> Optional[Path]:
    day = Path(f"test_logs/{mode}/{_today()}")
    hits = sorted(day.glob("*_title.json"), key=_mtime, reverse=True)
    if hits: return hits[0]
    root = Path(f"test_logs/{mode}")
    if not root.exists(): return None
    hits = sorted(root.rglob("*_title.json"), key=_mtime, reverse=True)
    return hits[0] if hits else None

# =========================
# 하이라이트 마커 정책 (증상/진료/치료)
# =========================
# 증상=SYM(노랑), 진료=DNA? -> DIA(주황), 치료/주제=TRT(연두)
SECTION_HIGHLIGHT_POLICY = {
    "1_intro": {
        "allow": {"TRT": (1, 1)},   # (문단당 최대, 섹션당 최대)
        "ban":   {"SYM", "DIA"},
        "notes": "도입은 주제/치료명만 TRT 1회. SYM/DIA 사용 금지."
    },
    "2_visit": {
        "allow": {"SYM": (1, 2), "DIA": (1, 1)},
        "ban":   {"TRT"},
        "notes": "환자 호소 중심: SYM 1~2회, 필요 시 DIA 1회. TRT 남발 금지."
    },
    "3_inspection": {
        "allow": {"DIA": (1, 2), "SYM": (1, 1)},
        "ban":   set(),
        "notes": "검사/판단 중심: DIA 1~2회, 보조로 SYM 1회."
    },
    "4_doctor_tip": {
        "allow": {"TRT": (1, 2), "DIA": (1, 1)},
        "ban":   set(),
        "notes": "실천 팁 핵심은 TRT 1~2회, 근거 설명은 DIA 1회."
    },
    "5_treatment": {
        "allow": {"TRT": (1, 3), "DIA": (1, 1)},
        "ban":   set(),
        "notes": "치료 과정/선택 이유는 TRT 2~3회, 근거는 DIA 1회."
    },
    "6_check_point": {
        "allow": {"TRT": (1, 2), "DIA": (1, 1)},
        "ban":   set(),
        "notes": "사후관리 수칙은 TRT 1~2회, 배경 설명은 DIA 1회."
    },
    "7_conclusion": {
        "allow": {"TRT": (1, 1), "DIA": (1, 1)},
        "ban":   set(),
        "notes": "핵심 회수: TRT 1회, 필요 시 DIA 1회."
    },
}

# 공통 마커 사용 규칙(LLM 가드레일용 텍스트)
MARKER_RULES_TEXT = (
    "하이라이트 마커 규칙:\n"
    "- 증상은 [[SYM]]..[[/SYM]] (노랑), 진료/판단은 [[DIA]]..[[/DIA]] (주황), 치료/주제는 [[TRT]]..[[/TRT]] (연두)로 감싼다.\n"
    "- 한 구절에는 하나의 마커만. 마커 중첩 금지. 링크/이미지/숫자 나열과 겹치지 않게 순수 텍스트만 감싼다.\n"
    "- 문단당 최대 1개. 섹션별 최대치는 섹션 정책에 따른다.\n"
)


# =========================
# 프롬프트 로딩/치환
# =========================
PROMPTS = {
    "1_intro":       Path("test_prompt/content1_intro_prompt.txt"),
    "2_visit":       Path("test_prompt/content2_visit_prompt.txt"),
    "3_inspection":  Path("test_prompt/content3_inspection_prompt.txt"),
    "4_doctor_tip":  Path("test_prompt/content4_doctor_tip_prompt.txt"),
    "5_treatment":   Path("test_prompt/content5_treatment_prompt.txt"),
    "6_check_point": Path("test_prompt/content6_check_point_prompt.txt"),
    "7_conclusion":  Path("test_prompt/content7_conclusion_prompt.txt"),
}

### 디버그용 프롬프트 로딩
print("프롬프트 로딩:", ", ".join(f"{k}={v.name}" for k, v in PROMPTS.items()))

def _render_template(tpl: str, ctx_vars: Dict[str, Any]) -> str:
    # 보호용: 이중 중괄호는 살림
    L, R = "§§L§§", "§§R§§"
    work = tpl.replace("{{", L).replace("}}", R)

    # {변수}만 안전 치환
    keys = list(ctx_vars.keys())
    if keys:
        pattern = re.compile(r"\{(" + "|".join(map(re.escape, keys)) + r")\}")
        work = pattern.sub(lambda m: str(ctx_vars.get(m.group(1), "")), work)

    return work.replace(L, "{{").replace(R, "}}")

# =========================
# JSON 파싱 & 텍스트 필터
# =========================
FORBIDDEN = [
    r"\b100%\b", r"무통증", r"완치", r"유일", r"최고", r"즉시\s*효과", r"파격", r"이벤트", r"특가",
    r"\d+\s*원", r"\d+\s*만원", r"가격\s*", r"전화\s*\d", r"http[s]?://", r"www\."
]
FORBIDDEN_RE = re.compile("|".join(FORBIDDEN))

def _clean_output(text: str) -> str:
    s = (text or "").strip()
    # 코드펜스 제거
    s = re.sub(r"^```(markdown|text)?", "", s).strip()
    s = re.sub(r"```$", "", s).strip()
    # 과도한 공백 정리
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    # 금칙어 간단 마스킹(완전 삭제 대신 안전표기)
    s = FORBIDDEN_RE.sub(lambda _: "(광고성 문구 제거)", s)
    return s

def _improve_readability(text: str) -> str:
    """
    문장 부호 뒤에 빈 줄을 추가하여 가독성 향상 및 이스케이프 문자 정리
    """
    if not text:
        return text
    
    # 1. 이스케이프된 줄바꿈 문자 정리
    text = text.replace('\\n\\n', '\n\n')
    text = text.replace('\\n', '\n')
    text = text.replace('\\t', ' ')
    
    # 2. 쉼표(,) 뒤에 단순 줄바꿈 추가
    text = re.sub(r'(,)(\s+)([가-힣A-Za-z0-9])', r'\1\n\3', text)
    
    # 3. 조건부 문장 부호 처리
    
    # 3-1. "" 안의 .!? 처리 (단순 줄바꿈)
    def quote_replacer(match):
        quote_content = match.group(1)
        # "" 안에서 .!? 뒤에 단순 줄바꿈 추가
        quote_content = re.sub(r'([?!.])(\s+)([가-힣A-Za-z0-9])', r'\1\n\3', quote_content)
        return f'"{quote_content}"'
    
    text = re.sub(r'"([^"]*)"', quote_replacer, text)
    
    # 3-2. <> 안의 내용을 임시로 보호하고, 일반 .!? 처리 후 복원
    angle_brackets_content = {}
    placeholder_counter = 0
    
    def preserve_angle_brackets(match):
        nonlocal placeholder_counter
        placeholder = f"__ANGLE_BRACKET_{placeholder_counter}__"
        angle_brackets_content[placeholder] = match.group(0)
        placeholder_counter += 1
        return placeholder
    
    # <> 내용을 플레이스홀더로 교체
    text = re.sub(r'<[^>]*>', preserve_angle_brackets, text)
    
    # 3-3. 일반적인 .!? 처리 (빈 줄 추가)
    patterns = [
        (r'([?!.])(\s+)(?!\n)([가-힣A-Za-z0-9])', r'\1\n\n\3'),  # .!? 뒤에 빈 줄 추가
        (r'([,])(\s+)(?!\n)([가-힣A-Za-z0-9])', r'\1\n\3'),      # , 뒤에 단순 줄바꿈만
        (r'(")(\s+)([가-힣A-Za-z0-9])', r'\1\n\n\3'),      # " 뒤에 빈 줄 추가  
        (r"(')(\s+)([가-힣A-Za-z0-9])", r'\1\n\n\3'),      # ' 뒤에 빈 줄 추가
        (r'(\*)(\s+)([가-힣A-Za-z0-9])', r'\1\n\n\3'),     # * 뒤에 빈 줄 추가 (이탈릭체)
        # 이모지 뒤에 빈 줄 추가 (포괄적 이모지 범위)
        (r'([\U0001F000-\U0001FFFF\U00002600-\U000027BF])(\s+)([가-힣A-Za-z0-9])', r'\1\n\n\3'),    ]
    
    result = text
    for pattern, replacement in patterns:
        result = re.sub(pattern, replacement, result)
    
    # 3-4. <> 내용을 다시 복원
    for placeholder, original_content in angle_brackets_content.items():
        result = result.replace(placeholder, original_content)
    
    # 4. 연속된 줄바꿈 정리 (3개 이상을 2개로)
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result.strip()

# 326라인 다음에 추가
def _improve_readability_except_emoji(text: str) -> str:
    """
    섹션6용: 이모지 이후 줄바꿈을 제외한 가독성 개선
    """
    if not text:
        return text
    
    # 1. 이스케이프된 줄바꿈 문자 정리
    text = text.replace('\\n\\n', '\n\n')
    text = text.replace('\\n', '\n')
    text = text.replace('\\t', ' ')
    
    # 2. 쉼표(,) 뒤에 단순 줄바꿈 추가
    text = re.sub(r'(,)(\s+)([가-힣A-Za-z0-9])', r'\1\n\3', text)
    
    # 3. 조건부 문장 부호 처리 (이모지 제외)
    
    # 3-1. "" 안의 .!? 처리 (단순 줄바꿈)
    def quote_replacer(match):
        quote_content = match.group(1)
        quote_content = re.sub(r'([?!.])(\s+)([가-힣A-Za-z0-9])', r'\1\n\3', quote_content)
        return f'"{quote_content}"'
    
    text = re.sub(r'"([^"]*)"', quote_replacer, text)
    
    # 3-2. <> 안의 내용을 임시로 보호
    angle_brackets_content = {}
    placeholder_counter = 0
    
    def preserve_angle_brackets(match):
        nonlocal placeholder_counter
        placeholder = f"__ANGLE_BRACKET_{placeholder_counter}__"
        angle_brackets_content[placeholder] = match.group(0)
        placeholder_counter += 1
        return placeholder
    
    text = re.sub(r'<[^>]*>', preserve_angle_brackets, text)
    
    # 3-3. 일반적인 .!? 처리 (빈 줄 추가) - 이모지 패턴 제외
    patterns = [
        (r'([?!.])(\s+)(?!\n)([가-힣A-Za-z0-9])', r'\1\n\n\3'),  # .!? 뒤에 빈 줄 추가
        (r'([,])(\s+)(?!\n)([가-힣A-Za-z0-9])', r'\1\n\3'),      # , 뒤에 단순 줄바꿈만
        (r'(")(\s+)([가-힣A-Za-z0-9])', r'\1\n\n\3'),      # " 뒤에 빈 줄 추가  
        (r"(')(\s+)([가-힣A-Za-z0-9])", r'\1\n\n\3'),      # ' 뒤에 빈 줄 추가
        (r'(\*)(\s+)([가-힣A-Za-z0-9])', r'\1\n\n\3'),     # * 뒤에 빈 줄 추가 (이탈릭체)
        # 이모지 패턴은 제외
    ]
    
    result = text
    for pattern, replacement in patterns:
        result = re.sub(pattern, replacement, result)
    
    # 3-4. <> 내용을 다시 복원
    for placeholder, original_content in angle_brackets_content.items():
        result = result.replace(placeholder, original_content)
    
    # 4. 연속된 줄바꿈 정리 (3개 이상을 2개로)
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result.strip()

# 그리고 1183-1245 라인의 잘못된 함수 정의를 모두 제거

def _strip_quotes(s: str) -> str:
    s = (s or "").strip()
    if len(s) >= 2 and ((s[0] == s[-1] == '"') or (s[0] == s[-1] == "'")):
        return s[1:-1]
    return s

# 동물 이미지 GIF
import random
GIF_DIR = Path("test_data/test_image/gif")

_EMOTICON_MARK_RE = re.compile(r"\((행복|슬픔|신남|화남|일반|마무리|눈물)\)")
# Airtable URL 형태 처리 (v5.airtableusercontent.com 포함, 괄호 있음/없음 모두)
# 더 유연한 괄호 매칭 (전각괄호, 공백, 개행 등 허용)
_AIRTABLE_URL_RE = re.compile(r'[（\(]\s*(https://[^）\)]*airtableusercontent\.com[^）\)]*)\s*[）\)]')


_AIRTABLE_URL_NO_BRACKET_RE = re.compile(r'https://[^\s\)]*airtableusercontent\.com[^\s\)]*')
# 게시글 단위로 동물 고정 & 풀 캐시 & 사용된 이모티콘 추적
_SESSION: Dict[str, Any] = {"animal": None, "pool": None, "used_emoticons": set()}

def _scan_gif_pool_local() -> Dict[str, Dict[str, List[Dict[str, str]]]]:
    """로컬 파일 시스템에서 GIF 스캔"""
    pool: Dict[str, Dict[str, List[Dict[str, str]]]] = {}
    if not GIF_DIR.exists():
        return pool
    for p in GIF_DIR.glob("*.gif"):
        name = p.stem  # ex) 행복_토끼2
        parts = name.split("_", 1)
        if len(parts) < 2:
            continue
        category, animal_with_no = parts[0], parts[1]
        # 숫자 접미 제거
        animal = re.sub(r"\d+$", "", animal_with_no)
        animal = animal.strip()
        d = pool.setdefault(animal, {})
        d.setdefault(category, []).append({
            "filename": p.name,
            "url": str(p),
            "alt": f"{category} {animal} 이모티콘",
            "source": "local"
        })
    return pool

def _scan_gif_pool_airtable() -> Dict[str, Dict[str, List[Dict[str, str]]]]:
    """Airtable에서 GIF 정보 로딩 (로컬용 - 소문자 필드명)"""
    pool: Dict[str, Dict[str, List[Dict[str, str]]]] = {}
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from pyairtable import Api
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Emote Images')
        
        # Active 필드가 빈 값이므로 모든 레코드 가져오기
        records = table.all()
        
        for record in records:
            fields = record['fields']
            
            emotion = fields.get('Emotion')  # 대문자 필드명
            animal = fields.get('Animal')    # 대문자 필드명
            name = fields.get('Name', f"{emotion}_{animal}" if emotion and animal else f"record_{record['id']}")
            files = fields.get('File', [])   # 대문자 필드명
            
            if not emotion or not animal or not files:
                continue
            
            file_info = files[0]
            file_url = file_info['url']
            
            d = pool.setdefault(animal, {})
            d.setdefault(emotion, []).append({
                "filename": file_info['filename'],
                "url": file_url,
                "alt": f"{emotion} {animal} 이모티콘",
                "source": "airtable"
            })
                
        return pool
        
    except Exception as e:
        print(f"❌ Airtable GIF 로드 실패: {e}")
        return {}

def _scan_gif_pool_airtable_ui() -> Dict[str, Dict[str, List[Dict[str, str]]]]:
    """Airtable에서 GIF 정보 로딩 (UI용 - 대문자 필드명)"""
    pool: Dict[str, Dict[str, List[Dict[str, str]]]] = {}
    
    try:
        # API 경로를 sys.path에 추가
        api_dir = ROOT_DIR / "api"
        if str(api_dir) not in sys.path:
            sys.path.insert(0, str(api_dir))
        
        from routes import get_emote_images_from_db
        
        # 동기 함수 호출
        emotes = get_emote_images_from_db(active_only=True)
        
        print(f"🔍 UI GIF Pool: routes.py에서 {len(emotes)}개 emote 이미지 로드됨")
        
        for emote in emotes:
            emotion = emote.get("emotion", "일반")  # routes.py에서는 소문자로 반환됨
            animal = emote.get("animal", "토끼")    # routes.py에서는 소문자로 반환됨
            filename = emote.get("filename", "")
            url = emote.get("url", "")
            name = emote.get("name", "")
            
            print(f"🔍 emote: emotion='{emotion}', animal='{animal}', filename='{filename}', name='{name}'")
            
            if not emotion or not animal or not url:
                print(f"⚠️ 필수 필드 누락: emotion={emotion}, animal={animal}, url={bool(url)}")
                continue
            
            d = pool.setdefault(animal, {})
            d.setdefault(emotion, []).append({
                "filename": filename or name or f"emote_{emote.get('id', 'unknown')}.gif",
                "url": url,
                "alt": f"{emotion} {animal} 이모티콘",
                "source": "airtable_ui"
            })
            print(f"✅ GIF 추가: {animal} → {emotion}")
                
        print(f"🎯 UI GIF Pool 구성 완료: {len(pool)}개 동물, 총 {sum(len(cats) for cats in pool.values())}개 카테고리")
        for animal, categories in pool.items():
            print(f"  - {animal}: {list(categories.keys())}")
            
        return pool
        
    except Exception as e:
        print(f"❌ Airtable UI GIF 로드 실패: {e}")
        import traceback
        traceback.print_exc()
        return {}

def _scan_gif_pool(use_airtable: bool = False, ui_mode: bool = False) -> Dict[str, Dict[str, List[Dict[str, str]]]]:
    """GIF 풀 스캔 - 로컬 또는 Airtable"""
    if use_airtable:
        if ui_mode:
            print("🔍 UI 모드로 Airtable GIF Pool 스캔 중...")
            pool = _scan_gif_pool_airtable_ui()
        else:
            print("🔍 로컬 모드로 Airtable GIF Pool 스캔 중...")
            pool = _scan_gif_pool_airtable()
        if pool:  # Airtable 성공
            return pool
        else:  # Airtable 실패 시 로컬로 폴백
            print("🔄 Airtable 실패, 로컬로 폴백...")
            return _scan_gif_pool_local()
    else:
        return _scan_gif_pool_local()

def _pick_animal_once(state: Dict[str, Any], pool: Dict[str, Dict[str, List[Dict[str, str]]]], preferred: Optional[str] = None) -> Optional[str]:
    """동물 한 번 선택해서 세션에 고정"""
    if state.get("chosen_animal"):
        return state["chosen_animal"]
    candidates = list(pool.keys())
    if not candidates:
        return None
    if preferred and preferred in candidates:
        state["chosen_animal"] = preferred
        return preferred
    # 랜덤 고정
    animal = random.choice(candidates)
    state["chosen_animal"] = animal
    return animal

def _pick_gif_by(animal: str, category: str, pool: Dict[str, Dict[str, List[Dict[str, str]]]]) -> Optional[Dict[str, str]]:
    """특정 동물과 감정으로 GIF 선택"""
    candidates = (pool.get(animal, {}) or {}).get(category, [])
    if not candidates:
        return None
    return random.choice(candidates)

def _gif_pool_cached(use_airtable: bool = False, ui_mode: bool = False) -> Dict[str, Dict[str, List[Dict[str, str]]]]:
    """캐시된 GIF 풀 반환"""
    if _SESSION["pool"] is None:
        _SESSION["pool"] = _scan_gif_pool(use_airtable=use_airtable, ui_mode=ui_mode)
    return _SESSION["pool"]

def _reset_gif_session():
    """새 게시글 시작 시 GIF 세션 초기화"""
    print("🔄 GIF 세션 초기화 - 중복 방지용 used_emoticons 리셋")
    _SESSION["animal"] = None
    _SESSION["pool"] = None
    _SESSION["used_emoticons"] = set()
    print(f"✅ GIF 세션 초기화 완료 - used_emoticons: {len(_SESSION['used_emoticons'])}개")



# =========================
# 이미지 태그 변환 통합 함수
# =========================
def _convert_urls_to_img_tags(text: str, sec_key: str, use_airtable: bool = False, ui_mode: bool = False) -> Tuple[str, List[Dict[str, str]]]:
    """
    모든 URL을 <img> 태그로 변환하는 통합 함수
    - 이모티콘 마커: (행복), (슬픔) 등 → Airtable에서 URL 찾아서 <img> 태그
    - Airtable URL: 괄호 있음/없음 모두 → <img> 태그
    - 기존 <img> 태그는 보호
    - 중복 방지 적용
    """
    if not text:
        return text, []

    pool = _gif_pool_cached(use_airtable=use_airtable, ui_mode=ui_mode)
    images_log: List[Dict[str, str]] = []
    processed_urls = set()

    # 1. 기존 <img> 태그를 임시로 보호
    img_placeholders = {}
    placeholder_counter = 0
    
    def protect_existing_img_tag(match):
        nonlocal placeholder_counter
        img_tag = match.group(0)
        placeholder = f"__EXISTING_IMG_{placeholder_counter}__"
        img_placeholders[placeholder] = img_tag
        placeholder_counter += 1
        return placeholder
    
    text = re.sub(r'<img[^>]*src="[^"]*"[^>]*>', protect_existing_img_tag, text)

    def find_emoticon_url(emotion: str, animal: str = None) -> Optional[str]:
        """Airtable에서 emotion과 animal로 URL 찾기"""
        if not pool:
            return None
        
        if not animal:
            animal = _SESSION.get("animal")
            if not animal:
                animal = random.choice(list(pool.keys()))
                _SESSION["animal"] = animal
        
        media = _pick_gif_by(animal, emotion, pool)
        if media:
            return media["url"]
        
        if emotion != "일반":
            media = _pick_gif_by(animal, "일반", pool)
            if media:
                return media["url"]
        
        return None

    def process_emoticon_marker(match) -> str:
        """이모티콘 마커를 처리 - HTML 태그는 생성하지 않고 images_log에만 추가"""
        emotion = match.group(1)
        url = find_emoticon_url(emotion)
        
        if not url:
            return ""
        
        url_key = f"url_{hash(url) % 10000}"
        if url_key in _SESSION.get("used_emoticons", set()):
            return ""
            
        _SESSION["used_emoticons"].add(url_key)
        images_log.append({
            "filename": f"emoticon_{emotion}.gif", 
            "url": url, 
            "path": url,
            "alt": f"{emotion} 이모티콘", 
            "position": "emoticon",
            "is_emoticon": True
        })

        # HTML 태그는 생성하지 않고 마커만 제거
        return ""

    def process_url(match) -> str:
        """URL을 처리 - HTML 태그는 생성하지 않고 images_log에만 추가"""
        url = match.group(1) if match.groups() else match.group(0)
        
        if url in processed_urls:
            return ""
        
        processed_urls.add(url)
        images_log.append({
            "filename": f"url_{hash(url) % 10000}.gif", 
            "url": url, 
            "path": url,
            "alt": "", 
            "position": "emoticon",
            "is_emoticon": True
        })
        
        # HTML 태그는 생성하지 않고 마커만 제거
        return ""

    # 2. 이모티콘 마커 처리: (신남), (슬픔) 등
    text = _EMOTICON_MARK_RE.sub(process_emoticon_marker, text)
    
    # 3. 괄호가 있는 URL 처리: (https://...)
    text = _AIRTABLE_URL_RE.sub(process_url, text)
    
    # 4. 괄호가 없는 URL 처리: https://...
    def process_standalone_url(match):
        url = match.group(0)
        
        if url in processed_urls:
            return url
            
        start_pos = match.start()
        text_before = text[:start_pos]
        img_match = re.search(r'<img[^>]*src="[^"]*"[^>]*>', text_before)
        if img_match and img_match.end() > start_pos - 100:
            return url
            
        processed_urls.add(url)
        images_log.append({
            "filename": f"url_{hash(url) % 10000}.gif", 
            "url": url, 
            "path": url,
            "alt": "", 
            "position": "emoticon",
            "is_emoticon": True
        })
        
        # HTML 태그는 생성하지 않고 마커만 제거
        return ""
    
    text = re.sub(r'https://[^\s가-힣]*', process_standalone_url, text)
    
    # 5. 보호된 기존 <img> 태그를 다시 복원
    for placeholder, img_tag in img_placeholders.items():
        text = text.replace(placeholder, img_tag)
    
    return text, images_log

# =========================
# [NEW] 전역 dedup/경로정규화/해시/페어링 유틸
# =========================
import hashlib  # [NEW]

def _norm_path(p: str) -> str:  # [NEW]
    p = (p or "").strip().replace("\\", "/")
    p = re.sub(r"[?#].*$", "", p)  # 쿼리/프래그먼트 제거
    return p.lower()

def _file_hash_safe(p: str) -> Optional[str]:  # [NEW]
    """
    동일 파일이 경로만 다른 복사본일 수 있어, 해시를 우선 키로 사용(선택).
    실패 시 None 반환하여 경로 기반으로 대체.
    """
    try:
        with open(p, "rb") as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception:
        return None

def _dedup_key_for_image(im: Dict[str, str]) -> str:  # [NEW]
    path = _norm_path(im.get("path", ""))
    h = _file_hash_safe(path)
    return f"hash:{h}" if h else f"path:{path}"

def _limit_for_section(sec_key: str) -> int:  # [NEW]
    return {
        "1_intro": 1,
        "2_visit": 2,
        "3_inspection": 2,
        "4_doctor_tip": 2,
        "5_treatment": 6,
        "6_check_point": 1,
        "7_conclusion": 6,
    }.get(sec_key, 2)

_BEFORE_RE = re.compile(r"(?:^|[\s_\-])(전|before)(?:$|[\s_\-])", re.I)   # [NEW]
_AFTER_RE  = re.compile(r"(?:^|[\s_\-])(후|after)(?:$|[\s_\-])", re.I)    # [NEW]

def _pair_before_after(images: List[Dict[str, str]]) -> List[Dict[str, str]]:  # [NEW]
    """
    Q7 전/후 페어링 정렬: 파일명/alt에서 전/후 단서를 찾아 '전→후' 순으로 근접 배치
    단순 휴리스틱: index 순서 유지하되, 전/후 후보를 분리 후 interleave
    """
    befores, afters, others = [], [], []
    for im in images:
        keyspace = f"{im.get('filename','')} {im.get('alt','')}"
        if _BEFORE_RE.search(keyspace):
            befores.append(im)
        elif _AFTER_RE.search(keyspace):
            afters.append(im)
        else:
            others.append(im)
    paired: List[Dict[str, str]] = []
    n = max(len(befores), len(afters))
    for i in range(n):
        if i < len(befores): paired.append(befores[i])
        if i < len(afters):  paired.append(afters[i])
    return paired + others

def _dedup_and_limit_images(section_key: str,
                            images: List[Dict[str, str]],
                            used_keys: set) -> List[Dict[str, str]]:  # [NEW]
    """
    - inline 이미지는 렌더 대상 아님 → 배열에서 제외(로그는 별개)  
    - emoticon 이미지는 HTML 렌더링에 포함됨
    - 전역 dedup(해시 우선, 실패 시 경로)
    - 섹션별 상한 적용
    - Q7은 전/후 페어링 정렬
    """
    # 0) inline 제외 (emoticon은 포함, assemble에서 무시되지만 로그 혼입 방지)
    # filtered = [im for im in images if (im.get("position") or "").lower() != "inline"]
    filtered = images
    # 1) 전역 dedup
    unique: List[Dict[str, str]] = []
    section_processed = set()  # 섹션 내 중복 방지
    
    for im in filtered:
        # URL이 있으면 path로 사용, 없으면 이미지 제외
        path = im.get("path") or ""
        url = im.get("url") or ""
        
        if url:
            # URL이 있으면 path도 URL로 설정
            im["path"] = url
        elif path and path.startswith(('http://', 'https://')):
            # path가 이미 URL이면 그대로
            pass
        elif path and not path.startswith(('http://', 'https://')):
            # 로컬 path면 그대로 유지 (기존 로컬 이미지용)
            pass
        else:
            # URL도 path도 없으면 이미지 제외
            print(f"⚠️ 이미지 제외 (URL 없음): {im.get('filename', 'unknown')}")
            continue

        # 섹션 내 중복 체크
        img_key = f"{path}_{im.get('position', '')}"
        if img_key in section_processed:
            print(f"⚠️ 섹션 내 중복 이미지 제외: {path}")
            continue
        section_processed.add(img_key)

        # 전역 중복 체크
        key = _dedup_key_for_image(im)
        if key in used_keys:
            print(f"⚠️ 전역 중복 이미지 제외: {path} (position: {im.get('position', 'none')})")
            continue
        used_keys.add(key)
        unique.append(im)
        print(f"✅ 이미지 통과: {path} (position: {im.get('position', 'none')})")

    # 2) Q7 페어링
    if section_key == "7_conclusion":
        unique = _pair_before_after(unique)

    # 3) 섹션별 상한
    limit = _limit_for_section(section_key)
    
    # 이모티콘 이미지 개수 카운트
    emoticon_count = len([im for im in unique if im.get('position') == 'emoticon'])
    print(f"📊 섹션 {section_key} 이미지 현황: 총 {len(unique)}개 (이모티콘 {emoticon_count}개)")
    
    if len(unique) > limit:
        print(f"⚠️ 섹션 {section_key} 이미지 제한: {len(unique)} → {limit}")
        unique = unique[:limit]

    return unique

# =========================
# 이미지 바인딩 해석
# =========================



def _resolve_images_for_section(plan_sec: Dict[str, Any], input_row: Dict[str, Any], use_airtable: bool = False, ui_mode: bool = False) -> List[Dict[str, str]]:
    """
    확장 사항:
    - 배열 소스에 random 선택 지원: image_binding 항목에 "random": true
    - GIF 자동 선택 지원:
        * image_binding 항목에 {"from":"gif_pool", "category":"행복", "position":"bottom", "animal":"토끼"} 등
        * category 미지정 시 ["일반"] 시도, 섹션7(마무리)는 plan에서 category="마무리" 주길 권장
        * animal 미지정 시 글 단위로 랜덤 1종 고정
        * 여러 후보 카테고리를 시도하려면 "category_try": ["행복","일반"] 사용
    - 기존 동작(명함/hospital.business_card, question*_images 배열)은 그대로 유지
    - ⭐ NEW: input의 Google Drive URL을 content에서 Airtable URL로 변환
    """
    binds = plan_sec.get("image_binding") or []
    out: List[Dict[str, str]] = []

    for b in binds:
        src = b.get("from", "")
        limit = int(b.get("limit", 1))
        position = b.get("position", "top")

        # 1) GIF 풀에서 선택 (감정/일반/마무리 등)
        if src == "gif_pool":
            pool = _gif_pool_cached(use_airtable=use_airtable, ui_mode=ui_mode)
            
            # 동물 한 번 고정 (선호 동물이 오면 그걸 우선)
            preferred_animal = b.get("animal")  # 예: "토끼" / "햄스터" 등
            animal = _pick_animal_once(_SESSION, pool, preferred=preferred_animal)
            
            if animal:
                # 카테고리 후보: category_try > category > 기본 ["일반"]
                cat_try = b.get("category_try") or []
                if not cat_try:
                    cat = (b.get("category") or "").strip()
                    cat_try = [cat] if cat else ["일반"]

                picked = None
                for cat in cat_try:
                    picked = _pick_gif_by(animal, cat, pool)
                    if picked:
                        break

                if picked:
                    out.append({
                        "filename": picked["filename"],
                        "url": picked["url"],
                        "path": picked["url"],  # 호환성을 위해 path도 URL로 설정
                        "alt": picked["alt"],
                        "position": position
                    })
            continue

        # 2) 병원 명함 고정
        if src == "hospital.business_card":
            continue

        # 3) 배열 소스 (visit/therapy/result 등)
        keys = [k.strip() for k in src.split("|") if k.strip()]
        arr = []
        for k in keys:
            val = _get(input_row, k, [])
            if isinstance(val, list) and val:
                arr = val
                break
        if not arr:
            continue

        # offset 옵션: {"offset": 1} - 배열에서 건너뛸 요소 수
        offset = int(b.get("offset", 0))
        start_idx = max(0, offset)
        end_idx = start_idx + limit
        
        # 랜덤 옵션: {"random": true}
        is_random = bool(b.get("random", False))
        sliced_arr = arr[start_idx:end_idx] if not is_random else arr[start_idx:]
        chosen = (random.sample(sliced_arr, min(limit, len(sliced_arr))) if is_random else sliced_arr)

        for it in chosen:
            fn = it.get("filename", "")
            url = it.get("url", "")
            path = it.get("path", "")
            
            # URL 우선 사용
            if url:
                final_path = url
            elif path and path.startswith(('http://', 'https://')):
                final_path = path
            elif path and not path.startswith(('http://', 'https://')):
                # 로컬 path (기존 로컬 이미지용)
                final_path = path
            else:
                # URL도 path도 없으면 이미지 제외
                print(f"⚠️ 이미지 제외 (URL 없음): {fn}")
                continue
            
            entry = {
                "filename": fn,
                "path": final_path,
                "position": position
            }
            
            # URL이 있으면 별도로도 저장
            if url:
                entry["url"] = url

            # --- ALT 보강: description 없으면 다른 후보 키/파일명으로 채움 ---
            desc = (it.get("description") or "").strip()
            if not desc:
                # 입력에서 흔히 쓰일 수 있는 대체 키들 순회
                desc = (it.get("alt") or it.get("title") or it.get("label") or "").strip()
            if not desc:
                # 파일명 기반 폴백(확장자/언더스코어 제거)
                base = (fn or Path(final_path).name or "").rsplit(".", 1)[0]
                base = re.sub(r"[_\-]+", " ", base).strip()
                desc = base or "이미지"

            entry["alt"] = desc  # 항상 alt를 넣도록!

            # input 이미지와 content 이모티콘 gif 구분
            if "airtableusercontent.com" in final_path and not it.get("description"):
                # description이 '없을 때만' 이모티콘으로 간주 (콘텐츠 gif)
                entry["is_emoticon"] = True
            else:
                entry["is_emoticon"] = False

            out.append(entry)

    return out


# =========================
# 섹션 생성
# =========================
SECTION_TITLE_MAP = {
    "1_intro": "서론",
    "2_visit": "내원·방문",
    "3_inspection": "검사·진단",
    "4_doctor_tip": "⭐ 의료진 TIP ⭐",
    "5_treatment": "치료 과정",
    "6_check_point": "☑️ Checkpoint",
    "7_conclusion": "마무리·결과",
}

def _build_ctx_vars(plan: Dict[str, Any], input_row: Dict[str, Any], title_obj: Dict[str, Any]) -> Dict[str, Any]:
    # city = _get(input_row, "city", "")
    # district = _get(input_row, "district", "")
    # region_phrase = (_get(input_row, "region_phrase", "") or f"{city} {district}".strip()).strip()
    # 지역명 비활성화 - 제목과 content에서 지역명 제외
    city = ""
    district = ""
    region_phrase = ""

    return {
        "title": _get(title_obj, "selected.title", ""),
        "hospital_name": _get(input_row, "hospital.name", ""),
        "save_name": _get(input_row, "hospital.save_name", ""),
        # "city": city,
        # "district": district, 
        # "region_phrase": region_phrase,
        # 지역명 비활성화
        "city": "",
        "district": "",
        "region_phrase": "",
        "category": _get(input_row, "category", ""),
        "selected_symptom": _get(input_row, "selected_symptom", ""),
        "selected_procedure": _get(input_row, "selected_procedure", ""),
        "selected_treatment": _get(input_row, "selected_treatment", ""),
        "tooth_numbers": ", ".join(_get(input_row, "tooth_numbers", []) or []),
        "question1_concept": _get(input_row, "question1_concept", ""),
        "question2_condition": _get(input_row, "question2_condition", ""),
        "question4_treatment": _get(input_row, "question4_treatment", ""),
        "question6_result": _get(input_row, "question6_result", ""),
        "question8_extra": _get(input_row, "question8_extra", ""),
        "representative_persona": _get(input_row, "representative_persona", ""),
        "map_link": _get(input_row, "hospital.map_link", ""),

    }

def _build_section_prompt(sec_key: str, sec_plan: Dict[str, Any], base_ctx: Dict[str, Any]) -> str:
    # 외부 프롬프트 + 컨텍스트(JSON) + 섹션 가이드(요약/금지/필수)
    p_path = PROMPTS.get(sec_key)
    prompt_txt = _read(p_path, default=f"[{sec_key}]에 대한 본문을 한국어로 작성하세요.")
    prompt_txt = _render_template(prompt_txt, base_ctx)

    # 섹션별 하이라이트 정책 병합
    policy = SECTION_HIGHLIGHT_POLICY.get(sec_key, {"allow": {}, "ban": set(), "notes": ""})
    # 사람이 읽을 수 있는 정책 설명(LLM 유도용)
    allow_hints = []
    for mk, (per_paragraph, per_section) in policy.get("allow", {}).items():
        allow_hints.append(f"{mk}: 문단당 {per_paragraph}개, 섹션당 최대 {per_section}개")
    allow_text = ("허용 마커 — " + ", ".join(allow_hints)) if allow_hints else "허용 마커 — 없음"
    ban_text = ("금지 마커 — " + ", ".join(sorted(policy.get("ban", [])))) if policy.get("ban") else "금지 마커 — 없음"
    notes_text = policy.get("notes", "")

    guide = {
        "section_key": sec_key,
        "section_title": SECTION_TITLE_MAP.get(sec_key, sec_key),
        "summary": sec_plan.get("summary", ""),
        "must_include": sec_plan.get("must_include", []),
        "may_include": sec_plan.get("may_include", []),
        "must_not_include": sec_plan.get("must_not_include", []),
        "style_rules": [
            "의료광고법 위반 표현 금지(가격/이벤트/과장/단정/유일/무통증/완치 등).",
            "정보제공 목적의 중립적 톤. 개인차/주의 유의미 암시.",
            "같은 문장·메시지 반복 금지, 문장 길이·줄바꿈은 자연스럽게.",
        ],
        "format_rules": [
            "불필요한 헤딩/번호 매기기 금지(프롬프트가 요구한 경우 제외).",
            "이모지는 프롬프트가 요구한 경우에만 제한적으로 사용.",
            # ↓↓↓ 마커 공통 규칙(전 섹션 공통) ↓↓↓
            MARKER_RULES_TEXT,
            f"[섹션별 마커 정책] {allow_text}; {ban_text}. {notes_text}"
        ],
        # JSON에도 남겨두면 로깅/디버깅 용이
        "highlight_policy": {
            "allow": policy.get("allow", {}),
            "ban": list(policy.get("ban", [])),
            "notes": notes_text
        }
    }

    # 시스템 지시 강화: 마커 사용을 강하게 요구
    sys_dir = (
      "You are a Korean medical blog writer. Follow all rules. "
      "Return PLAIN TEXT only (no JSON, no backticks). "
      "If a highlight-worthy phrase appears, wrap it with the correct marker: "
      "[[SYM]]..[[/SYM]], [[DIA]]..[[/DIA]], [[TRT]]..[[/TRT]] according to the section policy."
    )

    final = (
        f"{sys_dir}\n\n"
        f"INSTRUCTION\n{prompt_txt}\n\n"
        f"CONTEXT(JSON)\n{json.dumps(base_ctx, ensure_ascii=False, indent=2)}\n\n"
        f"SECTION_GUIDE(JSON)\n{json.dumps(guide, ensure_ascii=False, indent=2)}\n\n"
        f"Write the section now:"
    )
    return final


# =========================
# 본문 조립
# =========================
def _assemble_markdown(sections_out: Dict[str, Dict[str, Any]]) -> str:
    parts: List[str] = []
    for k in ["1_intro","2_visit","3_inspection","4_doctor_tip","5_treatment","6_check_point","7_conclusion"]:
        sec = sections_out.get(k)
        if not sec: continue
        
        text = sec.get("text", "").rstrip()
        included_urls = set()
        
        # 텍스트에 이미 포함된 URL 추출
        url_pattern = re.compile(r'https://[^\s\)]*')
        included_urls.update(url_pattern.findall(text))
        img_pattern = re.compile(r'<img[^>]+src="([^"]+)"')
        included_urls.update(img_pattern.findall(text))
        
        processed_images = set()
        
        # top 이미지 추가
        imgs_top = [im for im in sec.get("images", []) if im.get("position") == "top"]
        for im in imgs_top:
            img_path = im.get("path", "")
            if img_path not in included_urls and img_path not in processed_images:
                parts.append(f"![{im.get('alt','')}]({img_path})")
                processed_images.add(img_path)
        
        # 텍스트 추가
        parts.append(text)
        
        # bottom 이미지 추가
        imgs_bottom = [im for im in sec.get("images", []) if im.get("position") == "bottom"]
        for im in imgs_bottom:
            img_path = im.get("path", "")
            if img_path not in included_urls and img_path not in processed_images:
                parts.append(f"![{im.get('alt','')}]({img_path})")
                processed_images.add(img_path)
        

        
        parts.append("")  # 섹션 사이 공백줄
    return "\n".join(parts).strip()

# =========================
# 통합 함수 사용
# =========================
_IMG_MD_RE = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')

def _to_title_content_result(title: str, md: str) -> str:
    """
    - 첫 줄에 제목
    - 공백 줄 1개  
    - 본문에서 ![ALT](PATH)를 ALT만 남기기 (경로 제거, 꺽쇠 제거)
    - 모든 이미지 경로는 제거하고 alt 텍스트만 유지
    """
    body = md or ""
    
    # Markdown 이미지 ![ALT](PATH) 처리 - alt 텍스트만 남기기
    def _img_repl(m: re.Match):
        alt = (m.group(1) or "").strip()
        if alt:
            return f"\n{alt}\n"
        else:
            return ""

    body = _IMG_MD_RE.sub(_img_repl, body)
    
    # 연속된 줄바꿈 정리
    body = re.sub(r"\n{3,}", "\n\n", body).strip()

    title_line = (title or "").strip()
    if title_line:
        return f"{title_line}\n\n{body}".strip()
    return body

# =========================
# 저장
# =========================
    
def _save_json(mode: str, name: str, payload: dict) -> Path:
    out_dir = Path(f"test_logs/{mode}/{_today()}")
    _ensure_dir(out_dir)
    p = out_dir / f"{_now()}_{name}.json"


    p.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return p

# =========================
# 실행
# =========================
def run(mode: str = DEF_MODE,
        input_path: Optional[str|Path] = None,
        plan_path: Optional[str|Path] = None,
        title_path: Optional[str|Path] = None,
        use_airtable: bool = True,
        ui_mode: bool = True) -> Dict[str, Any]:

    # 0) GIF 세션 초기화 (새 게시글 시작)
    _reset_gif_session()
    
    # 1) 입력 수집
    if input_path:
        inp_path = Path(input_path); inp_row = _json_load(inp_path)
        if isinstance(inp_row, list) and inp_row: inp_row = inp_row[-1]
        inp_src = str(inp_path)
    else:
        found_path, row = _latest_input(mode)
        if row is None:
            raise FileNotFoundError("최신 *_input_log(s).json을 찾지 못했습니다. 먼저 InputAgent를 실행하세요.")
        inp_row, inp_src = row, str(found_path)

    if plan_path:
        plan = _json_load(Path(plan_path)); plan_src = plan_path
    else:
        p = _latest_plan(mode)
        if not p: raise FileNotFoundError("최신 *_plan.json을 찾지 못했습니다. 먼저 PlanAgent를 실행하세요.")
        plan = _json_load(p); plan_src = str(p)

    if title_path:
        title_obj = _json_load(Path(title_path)); title_src = title_path
    else:
        t = _latest_title(mode)
        if not t: raise FileNotFoundError("최신 *_title.json을 찾지 못했습니다. 먼저 TitleAgent를 실행하세요.")
        title_obj = _json_load(t); title_src = str(t)

    # 2) 컨텍스트 준비
    base_ctx = _build_ctx_vars(plan, inp_row, title_obj)
    order = _get(plan, "content_plan.sections_order", []) or ["1_intro","2_visit","3_inspection","4_doctor_tip","5_treatment","6_check_point","7_conclusion"]
    sections_plan: Dict[str, Any] = _get(plan, "content_plan.sections", {}) or {}

    # 3) 섹션별 생성
    sections_out: Dict[str, Dict[str, Any]] = {}
    log_detail: Dict[str, Any] = {"sections": {}}

    used_image_keys: set = set()  # [NEW] 전역 dedup 키 저장소

    for k in order:
        sec_plan = sections_plan.get(k, {})
        prompt = _build_section_prompt(k, sec_plan, base_ctx)
        raw = gem.generate(prompt)
        text = _clean_output(raw)
        # ✅ 통합 함수로 URL을 <img> 태그로 변환
        text, emoticon_imgs = _convert_urls_to_img_tags(text, k, use_airtable, ui_mode)
        # ✅ 가독성 개선을 나중에 적용 (이미지 태그 보호)
        if k == "6_check_point":
            # 섹션6에서는 이모지 이후 줄바꿈 제외
            text = _improve_readability_except_emoji(text)
        else:
            text = _improve_readability(text)

        # 후보 이미지 수집
        images = _resolve_images_for_section(sec_plan, inp_row, use_airtable, ui_mode)

        # 로그용 inline도 합치되, 렌더 중복 방지를 위해 dedup 단계에서 inline 제거
        if emoticon_imgs:
            images.extend(emoticon_imgs)

        # [NEW] 전역 dedup + 섹션 상한 + Q7 전/후 페어링
        images = _dedup_and_limit_images(k, images, used_image_keys)

        sections_out[k] = {
            "title": SECTION_TITLE_MAP.get(k, k),
            "text": text,
            "images": images
        }
        log_detail["sections"][k] = {
            "prompt_path": str(PROMPTS.get(k, "")),
            "prompt_rendered_preview": prompt[:1200],
            "llm_raw_preview": raw[:1200],
            "used_summary": sec_plan.get("summary", ""),
            "resolved_images": images,
        }

    # 4) 최종 조립 → 복붙용 문자열 생성
    md = _assemble_markdown(sections_out)
    
    # ✅ 두 번째: gif 이모티콘 URL을 받은 후에만 이미지 태그 생성
    title_content_result = _to_title_content_result(base_ctx.get("title", ""), md)

    # 5) 저장 (assembled_markdown에 복붙용 문자열을 저장하고, title_content_result 필드는 제거)
    result = {
        "meta": {
            "mode": mode,
            "timestamp": _now(),
            "model": gem.model,
            "temperature": gem.temperature,
            "max_output_tokens": gem.max_output_tokens,
            "plan_source": plan_src,
            "input_source": inp_src,
            "title_source": title_src,
            "case_id": _get(inp_row, "case_id", ""),
            "post_id": _get(inp_row, "postId", ""),  # ✅ Post Id 추가
            "post_data_request_id": _get(inp_row, "postDataRequestId", ""),  # ✅ Post Data Request ID 추가
        },
        "title": base_ctx.get("title", ""),
        "sections": sections_out,
        "assembled_markdown": title_content_result,  # ✅ 복붙용 문자열로 교체
    }
    out_path = _save_json(mode, "content", result)
    # HTML 버전 저장 (Airtable URL 사용)
    html_path = convert_content_to_html(out_path)
    print(f"🌐 HTML 저장: {html_path}")

    # UI에서 접근할 수 있도록 HTML 파일을 public 디렉토리로 복사
    try:
        import shutil
        # UI 프로젝트의 public 디렉토리 경로
        ui_public_dir = Path("upgrade_0820/public/medicontent/posts")
        ui_public_dir.mkdir(parents=True, exist_ok=True)
        
        # HTML ID 생성 (timestamp 기반)
        html_id = out_path.stem.replace("_content", "")  # 예: 20250812_141055
        ui_html_path = ui_public_dir / f"post-{html_id}.html"
        
        # HTML 파일 복사
        shutil.copy2(html_path, ui_html_path)
        print(f"🌐 UI용 HTML 복사: {ui_html_path}")
        
        # Airtable에 HTML ID 업데이트
        try:
            from dotenv import load_dotenv
            load_dotenv()
            
            from pyairtable import Api
            api = Api(os.getenv('AIRTABLE_API_KEY'))
            posts_table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Medicontent Posts')
            
            # medicontentRecordId 우선 사용, 없으면 Post Id로 폴백
            medicontent_record_id = _get(inp_row, "medicontentRecordId", "")
            if medicontent_record_id:
                # record ID로 직접 조회 (가장 빠름)
                posts_table.update(medicontent_record_id, {'HTML ID': out_path.stem})
                print(f"✅ Airtable HTML ID 업데이트 완료 (Record ID 직접): {out_path.stem}")
            else:
                # 폴백: Post Id로 조회
                post_id = _get(inp_row, "postId", "") or _get(inp_row, "Post Id", "")
                if post_id:
                    records = posts_table.all(formula=f"OR({{Post Id}} = '{post_id}', {{Post ID}} = '{post_id}')")
                    if records:
                        record_id = records[0]['id']
                        posts_table.update(record_id, {'HTML ID': out_path.stem})
                        print(f"✅ Airtable HTML ID 업데이트 완료 (Post Id 매칭): {out_path.stem}")
                    else:
                        print(f"⚠️ Post Id로 레코드를 찾을 수 없음: {post_id}")
                else:
                    print(f"⚠️ Post Id가 없어 HTML ID 업데이트를 건너뜀")
                
        except Exception as e:
            print(f"⚠️ Airtable HTML ID 업데이트 실패: {e}")
        
    except Exception as e:
        print(f"⚠️ UI용 HTML 복사 실패: {e}")

    # 동일 내용 TXT 저장
    out_dir = out_path.parent
    ts_prefix = out_path.stem.replace("_content", "")  # 예: 20250812_141055
    txt_path = out_dir / f"{ts_prefix}_title_content_result.txt"
    txt_path.write_text(title_content_result, encoding="utf-8")

    # 로그
    log = {
        "meta": {
            "mode": mode,
            "timestamp": _now(),
            "success": True,
        },
        "context_vars": base_ctx,
        "output_paths": {
            "content_path": str(out_path),
            "title_content_txt": str(txt_path),
        },
        **log_detail,
    }
    log_path = _save_json(mode, "content_log", log)

    print(f"✅ Content 저장: {out_path}")
    print(f"🧾 로그 저장: {log_path}")
    print(f"📝 복붙용 TXT 저장: {txt_path}")

    return result


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="ContentAgent — plan/title/input 기반 7섹션 본문 생성")
    ap.add_argument("--mode", default=DEF_MODE, choices=["test","use"])
    ap.add_argument("--input", default="", help="*_input_log(s).json 경로(미지정 시 최신)")
    ap.add_argument("--plan",  default="", help="*_plan.json 경로(미지정 시 최신)")
    ap.add_argument("--title", default="", help="*_title.json 경로(미지정 시 최신)")
    ap.add_argument("--use-airtable", action="store_true", help="Airtable에서 GIF 이모티콘 로드 (기본: 로컬)")
    args = ap.parse_args()

    run(mode=args.mode,
        input_path=(args.input or None),
        plan_path=(args.plan or None),
        title_path=(args.title or None),
        use_airtable=args.use_airtable)