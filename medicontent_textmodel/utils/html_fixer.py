"""
HTML을 React에서 사용할 때 발생하는 문제들을 해결하는 간단한 유틸리티
"""
import re

def fix_html_for_react(html_content: str) -> str:
    """HTML 콘텐츠를 React에서 안전하게 사용할 수 있도록 수정"""
    
    # 1. class → className
    html_content = re.sub(r'\bclass="([^"]*)"', r'className="\1"', html_content)
    html_content = re.sub(r"\bclass='([^']*)'", r"className='\1'", html_content)
    
    # 2. for → htmlFor
    html_content = re.sub(r'\bfor="([^"]*)"', r'htmlFor="\1"', html_content)
    html_content = re.sub(r"\bfor='([^']*)'", r"htmlFor='\1'", html_content)
    
    # 3. 자체 닫힘 태그 수정
    self_closing_tags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base']
    for tag in self_closing_tags:
        pattern = rf'<{tag}([^>]*?)(?<!/)>'
        html_content = re.sub(pattern, rf'<{tag}\1 />', html_content, flags=re.IGNORECASE)
    
    # 4. HTML 주석 제거 (React에서 문제될 수 있음)
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
    
    # 5. 기본적인 HTML 엔티티 정리
    html_content = html_content.replace('&nbsp;', ' ')
    html_content = html_content.replace('&amp;', '&')
    html_content = html_content.replace('&lt;', '<')
    html_content = html_content.replace('&gt;', '>')
    
    # 6. 빈 속성 수정 (checked, disabled 등)
    html_content = re.sub(r'\b(checked|disabled|readonly|selected|multiple)\b(?!=)', r'\1={true}', html_content)
    
    return html_content

def extract_body_content(html_content: str) -> str:
    """전체 HTML에서 body 내용만 추출"""
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, flags=re.DOTALL | re.IGNORECASE)
    if body_match:
        return body_match.group(1).strip()
    return html_content

def clean_html_for_dangerouslySetInnerHTML(html_content: str) -> str:
    """dangerouslySetInnerHTML에 안전하게 사용할 수 있도록 HTML 정리"""
    
    # 1. DOCTYPE, html, head, body 태그 제거
    html_content = re.sub(r'<!DOCTYPE[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</?html[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<head>.*?</head>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # body 내용만 추출
    html_content = extract_body_content(html_content)
    
    # 2. script 태그 제거 (보안상 위험)
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # 3. 이벤트 핸들러 제거 (React에서 작동하지 않음)
    event_attrs = ['onclick', 'onmouseover', 'onmouseout', 'onload', 'onerror']
    for attr in event_attrs:
        html_content = re.sub(rf'{attr}="[^"]*"', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(rf"{attr}='[^']*'", '', html_content, flags=re.IGNORECASE)
    
    # 4. 잘못된 중첩 태그 수정 (기본적인 경우만)
    html_content = re.sub(r'<p[^>]*>(\s*<div)', r'\1', html_content)  # p 안에 div
    html_content = re.sub(r'</div>\s*</p>', r'</div>', html_content)
    
    return html_content.strip()

# 빠른 사용을 위한 함수
def make_react_safe(html_content: str, extract_body: bool = True) -> str:
    """HTML을 React에서 안전하게 사용할 수 있도록 처리"""
    if extract_body:
        html_content = clean_html_for_dangerouslySetInnerHTML(html_content)
    else:
        html_content = fix_html_for_react(html_content)
    
    return html_content
