# -*- coding: utf-8 -*-
# 임플란트 전처리/추출 사전 + 유틸 (독립 모듈)

import re
from functools import lru_cache

# -----------------------------
# STOP (공용 + 필드별)
# -----------------------------
STOP_COMMON = {
    "부분","부위","상태","시행","사진","이미지","촬영","주의","안내","고객",
    "초진","재진","내원","방문","경과","기록","소견","판독","확인","평가","설명","동의",
    "예약","문의","연락","협의","서명","첨부","업로드","접수","결제","서류","문서",
    "예정","지속","반복","변경","보완","진행","완료","중단","재개","권유","필요","가능",
    "적용","조치","요청","제공","참고","공유","보고","등록","수정","확정","미정","보류",
    "오늘","어제","최근","금일","당일","주중","주말","이후","이전","이때","경우","기간",
    "일부","전체","대상","타원","자체","본원","외부","내부","추가","세부","상세","기본",
    "정상","이상","의심","경미","중등도","심함","개선","악화","발생","소실",
    "가급적","가능하면","우선","차후","향후","우선순위","선택","목적","방향","방안",
    "측면","좌측","우측","전측","후측","수치","정도","부분적","전반적","관련","비교","해당",
    "전달","반영","검토","적합","부적합","최소","최대","대략","약","등","및","등등",
    "케이스","증례","예시","예","사례","항목","항목별","항상","보통","일반","특이","의의",
    "유의","주의사항","권장","비고","참조","공지","공지사항","공지문",
}
STOP_FOR_SYMPTOM   = set() | STOP_COMMON                  # 증상은 넓게 (통증 유지)
STOP_FOR_PROCEDURE = {"치료","진료","검사"} | STOP_COMMON
STOP_FOR_TREATMENT = {"치료","치료중","치료계획"} | STOP_COMMON

# -----------------------------
# 온톨로지: 대표어 -> 동의어
# -----------------------------
IMPLANT_ONTOLOGY = {
    # 코어/수술
    "임플란트": ["implant","dental implant","implants"],
    "식립": ["fixture placement","fixture","implant placement","식립술","식립수술"],
    "발치와식립": ["immediate post-extraction implant","socket implant","발치 후 즉시식립","즉시 식립"],
    "즉시식립": ["immediate placement","즉시 식립","immediate implant"],
    "지연식립": ["delayed placement","지연 식립","delayed implant"],
    "무절개": ["flapless","flapless surgery","플랩리스"],
    "1차 수술": ["first stage","1차수술","two-stage (first)"],
    "2차 수술": ["second stage","2차수술","two-stage (second)"],
    "즉시부하": ["immediate loading","ILP","즉시 부하"],
    "조기부하": ["early loading","조기 부하"],
    "지연부하": ["delayed loading","지연 부하"],
    "가이드 수술": ["surgical guide","guided surgery","navigation surgery","네비게이션 수술","가이드서저리","디지털 가이드"],

    # 상악동 (SLA 제거)
    "상악동거상술": ["sinus lift","sinus augmentation","sinus elevation","상악동 거상술"],
    "상악동거상술(외측)": ["lateral window sinus lift","lateral approach","측벽 윈도우"],
    "상악동거상술(내측)": ["crestal approach","summers technique","오스테오톰","내측 접근"],

    # GBR/골/막
    "골이식": ["bone graft","GBR","guided bone regeneration","bone augmentation","ridge augmentation","증대술"],
    "자가골": ["autograft","autogenous bone","자가 골"],
    "동종골": ["allograft","동종 골"],
    "이종골": ["xenograft","bovine bone","이종 골"],
    "합성골": ["alloplast","β-TCP","HA","합성 골"],
    "차폐막": ["membrane","barrier membrane","collagen membrane","PTFE","dPTFE","티메쉬","Ti-mesh","티 메시","티-메쉬"],

    # 해부/결손
    "골질": ["bone quality","D1","D2","D3","D4"],
    "치조골": ["alveolar bone","ridge"],
    "치조정": ["crest","alveolar crest"],
    "협측골": ["buccal plate","buccal bone","협측"],
    "설측골": ["lingual plate","lingual bone","설측"],
    "골결손": ["dehiscence","fenestration","bone defect","골 결손","개창","윈도우"],

    # 부품/스캔/인상
    "어버트먼트": ["abutment","custom abutment","맞춤 어버트먼트"],
    "지대주": ["abutment","abut.","지대 주"],
    "힐링 어버트먼트": ["healing abutment","healing abut","힐링캡","힐링 캡"],
    "커버스크류": ["cover screw","coverscrew","커버 스크류"],
    "스캔바디": ["scan body","scanbody","스캔 바디"],
    "인상코핑": ["impression coping","coping","코핑"],
    "멀티유닛 어버트먼트": ["multi-unit abutment","MUA","멀티 유닛"],
    "UCLA 어버트먼트": ["UCLA abutment","UCLA"],
    "티베이스": ["ti-base","tibase","Ti base"],

    # 연결/플랫폼/보철 설계
    "내부헥스": ["internal hex","internal connection","internal","내부 헥스"],
    "외부헥스": ["external hex","external connection","external","외부 헥스"],
    "코니컬": ["conical","morse taper","morse","테이퍼"],
    "플랫폼 스위칭": ["platform switching","platform-shift","플랫폼스위칭"],
    "스크류고정": ["screw-retained","screw retained","스크류 고정"],
    "시멘트고정": ["cement-retained","cement retained","시멘트 고정"],

    # 보철 재료/형태
    "지르코니아 크라운": ["zirconia crown","zirconia","full-zirconia","모노리식 지르코니아"],
    "PFM": ["porcelain fused to metal","메탈 세라믹","메탈세라믹"],
    "리튬디실리케이트": ["lithium disilicate","e.max","이맥스"],
    "임시치아": ["provisional","temporary crown","temporary","임시 보철"],
    "교합조정": ["occlusal adjustment","occlusal adj","교합 조정"],

    # 위치
    "상악": ["maxilla","maxillary"],
    "하악": ["mandible","mandibular"],
    "전치부": ["anterior","anterior region","전치"],
    "구치부": ["posterior","posterior region","구치"],
    "상악동": ["maxillary sinus","sinus"],

    # 지표/영상/수치
    "초기 고정": ["primary stability","initial stability","ISQ","stability"],
    "ISQ": ["implant stability quotient","RFA","레조넌스 주파수 분석"],
    "삽입토크": ["insertion torque","torque","Ncm","뉴튼센티미터"],
    "CBCT": ["cone beam CT","cone-beam CT","3D CT","시비씨티"],
    "파노라마": ["panoramic","OPG","panorama","파노"],
    "치근단": ["periapical","PA","치근단 방사선"],

    # 연조직
    "결합조직이식": ["CTG","connective tissue graft","결합 조직 이식"],
    "유리치은이식": ["FGG","free gingival graft","유리 치은 이식"],
    "핑크에스테틱": ["pink esthetics","soft tissue profile","emergence profile","출현 프로파일"],

    # 합병증/유지
    "임플란트주위염": ["peri-implantitis","periimplantitis","임플란트 주위염"],
    "점막염": ["mucositis","peri-implant mucositis","점막 염"],
    "나사풀림": ["screw loosening","loosening"],
    "파절": ["fracture","chipping","파절/치핑"],
    "유지관리": ["maintenance","recall","follow-up","리콜","스케일링"],

    # 표면/브랜드 (SLA는 여기)
    "SLA 표면": ["SLA","SLActive","sand blasted large grit acid etched"],
    "오스템": ["Osstem","TS","TSIII","ETIII","오스템임플란트"],
    "덴티움": ["Dentium","SuperLine","Implantium","덴티움임플란트"],
    "스트라우만": ["Straumann","BLX","BLT"],
    "노벨": ["Nobel Biocare","Nobel","NobelActive","NobelReplace"],
    "아스트라": ["Astra Tech","Astra","EV"],
    "메가젠": ["MegaGen","AnyRidge","AnyOne","AnyTime"],
    "네오": ["NeoBiotech","IS-II","네오바이오텍"],
}

BRAND_KEYS = {"오스템","덴티움","스트라우만","노벨","아스트라","메가젠","네오"}

# -----------------------------
# 정규화/역인덱스
# -----------------------------
def _norm_token(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"[-_/]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def build_alias_reverse_index(ontology: dict):
    rev = {}
    for rep, aliases in ontology.items():
        rev[_norm_token(rep)] = rep
        for a in aliases:
            rev[_norm_token(a)] = rep
    return rev

ALIAS_REV = build_alias_reverse_index(IMPLANT_ONTOLOGY)

def normalize_to_rep(surface: str) -> str:
    return ALIAS_REV.get(_norm_token(surface), surface)

# -----------------------------
# 복합/수치 패턴
# -----------------------------
COMPOUND_PATTERNS = [
    r"(?:상악\s*동|상악동)\s*(?:거상\s*술|거상술|증대술|증대)\b",
    r"(?:상악\s*동|상악동)\s*(?:내측|크레스타럴|crestal|summers)\s*(?:접근|거상\s*술|거상술)?",
    r"(?:상악\s*동|상악동)\s*(?:외측|측벽|lateral|window)\s*(?:접근|거상\s*술|거상술)?",
    r"(?:가이드|네비게이션|디지털)\s*(?:수술|서저리|가이드)\b",

    r"(?:골\s*이식|GBR|guided\s*bone\s*regeneration)\b",
    r"(?:자가\s*골|autograft|autogenous)\b",
    r"(?:동종\s*골|allograft)\b",
    r"(?:이종\s*골|xenograft|bovine)\b",
    r"(?:합성\s*골|alloplast|β-?TCP|HA)\b",
    r"(?:차폐\s*막|멤브레인|membrane|PTFE|dPTFE|Ti-?\s*mesh|티\s*-?\s*메시)\b",

    r"(?:내부\s*헥스|internal\s*hex|internal\s*connection|morse\s*taper|conical)\b",
    r"(?:외부\s*헥스|external\s*hex|external\s*connection)\b",
    r"(?:플랫폼\s*스위칭|platform\s*switch\w*)\b",

    r"(?:힐링\s*어버트먼트|healing\s*abut\w*|힐링\s*캡)\b",
    r"(?:멀티\s*유닛\s*어버트먼트|multi-?\s*unit\s*abut\w*|MUA)\b",
    r"(?:스캔\s*바디|scan\s*body)\b",
    r"(?:인상\s*코핑|impression\s*coping)\b",
    r"(?:오픈|클로즈[드]?)\s*트레이\s*(?:인상|임프레션)\b",

    r"(?:지르코니아\s*크라운|zirconia\s*crown|full-?\s*zirconia)\b",
    r"(?:PFM|메탈\s*세라믹|메탈세라믹)\b",
    r"(?:리튬\s*디실리케이트|lithium\s*disilicate|e\.?max)\b",
    r"(?:스크류\s*고정|screw-?\s*retained)\b",
    r"(?:시멘트\s*고정|cement-?\s*retained)\b",
    r"(?:교합\s*조정|occlusal\s*adjust\w*)\b",

    r"(?:상악|하악)\s*(?:전치|구치)\s*부\b",

    r"ISQ\s*(\d{2})(?:\s*[-/~]\s*(\d{2}))?",
    r"(?:insertion\s*)?torque\s*(\d{1,3})\s*(?:N\s*cm|Ncm)\b",
    r"(?:토크|삽입\s*토크)\s*(\d{1,3})\s*(?:N\s*cm|Ncm)\b",

    r"(?:직경|Ø|D)?\s*(\d(?:\.\d)?)\s*mm\s*[x×*]\s*(\d{1,2}(?:\.\d)?)\s*mm",
    r"(?:\b|\s)(\d(?:\.\d)?)\s*[x×*]\s*(\d{1,2}(?:\.\d)?)\s*mm\b",

    r"\bD[1-4]\b",

    r"(?:임플란트\s*주위\s*(?:염|염증)|peri-?\s*implantitis)\b",
    r"(?:점막\s*염|mucositis)\b",
    r"(?:나사\s*풀림|screw\s*loosening)\b",
    r"(?:파절|fracture|chipping)\b",

    r"(?:CBCT|cone\s*beam\s*CT|3D\s*CT|시비씨티)\b",
    r"(?:파노라마|panoramic|OPG)\b",
    r"(?:치근단|periapical|PA)\b",
]

# S/P/T 라우팅 대표 세트
TERMS_TREATMENT = {
    "임플란트","식립","발치와식립","즉시식립","지연식립","무절개",
    "상악동거상술","상악동거상술(외측)","상악동거상술(내측)",
    "골이식","자가골","동종골","이종골","합성골","차폐막",
    "지르코니아 크라운","PFM","리튬디실리케이트","임시치아",
    "스크류고정","시멘트고정","결합조직이식","유리치은이식",
}
TERMS_PROCEDURE = {
    "가이드 수술","스캔바디","인상코핑","멀티유닛 어버트먼트","UCLA 어버트먼트","티베이스",
    "내부헥스","외부헥스","코니컬","플랫폼 스위칭",
    "교합조정","CBCT","파노라마","치근단","초기 고정","ISQ","삽입토크",
}
TERMS_SYMPTOM = {"시림","교합통","자발통","출혈","부종","저작불편","심미불만"}
# (증상 세트는 필요시 확장)

def _tokenize(text: str) -> list:
    return re.findall(r"[A-Za-z가-힣0-9]+", text or "")

def _apply_patterns(text: str) -> list:
    hits = []
    for pat in COMPOUND_PATTERNS:
        for m in re.finditer(pat, text, flags=re.IGNORECASE):
            hits.append(m.group(0))
    return hits

@lru_cache(maxsize=256)
def extract_implant_terms(text: str) -> dict:
    """표면형 수집 → 대표어 정규화 → 브랜드/수치 메타 분리"""
    text = (text or "").strip()
    surfaces = _tokenize(text) + _apply_patterns(text)
    reps = [normalize_to_rep(s) for s in surfaces]

    # 메타: 브랜드/수치
    brands = sorted({r for r in reps if r in BRAND_KEYS})
    # 수치 캡처
    isq = re.findall(r"ISQ\s*(\d{2})(?:\s*[-/~]\s*(\d{2}))?", text, flags=re.IGNORECASE)
    torque = re.findall(r"(?:insertion\s*)?torque\s*(\d{1,3})\s*(?:N\s*cm|Ncm)", text, flags=re.IGNORECASE) \
           + re.findall(r"(?:토크|삽입\s*토크)\s*(\d{1,3})\s*(?:N\s*cm|Ncm)", text)
    size = re.findall(r"(?:직경|Ø|D)?\s*(\d(?:\.\d)?)\s*mm\s*[x×*]\s*(\d{1,2}(?:\.\d)?)\s*mm", text) \
         + re.findall(r"(?:\b|\s)(\d(?:\.\d)?)\s*[x×*]\s*(\d{1,2}(?:\.\d)?)\s*mm\b", text)

    # 대표어만 유지
    rep_list = [r for r in reps if r in IMPLANT_ONTOLOGY or r in TERMS_SYMPTOM]
    # 필드별 라우팅
    S, P, T = [], [], []
    for r in rep_list:
        if r in TERMS_TREATMENT:
            T.append(r)
        elif r in TERMS_PROCEDURE:
            P.append(r)
        elif r in TERMS_SYMPTOM:
            S.append(r)
        # 기타는 버림(노이즈 감소)

    # 필드별 STOP 적용
    def _clean(lst, stop):
        out = []
        seen = set()
        for w in lst:
            if w in stop or w in seen:
                continue
            seen.add(w)
            out.append(w)
        return out

    return {
        "symptoms": _clean(S, STOP_FOR_SYMPTOM)[:8],
        "procedures": _clean(P, STOP_FOR_PROCEDURE)[:8],
        "treatments": _clean(T, STOP_FOR_TREATMENT)[:8],
        "meta": {
            "brands": brands,
            "isq": isq,        # [("72","78"), ...] 혹은 [("72",""), ...]
            "torque": torque,  # ["35","40", ...]
            "size_mm": size,   # [("4.0","10"), ...]
        }
    }
