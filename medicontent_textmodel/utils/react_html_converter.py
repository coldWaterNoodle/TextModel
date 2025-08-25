import re
from pathlib import Path
from typing import Dict, Any

class ReactHTMLConverter:
    """HTML을 React/JSX 호환 형태로 변환하는 클래스"""
    
    def __init__(self):
        # React에서 문제가 되는 HTML 속성들 매핑
        self.html_to_jsx_attrs = {
            'class': 'className',
            'for': 'htmlFor',
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'maxlength': 'maxLength',
            'cellpadding': 'cellPadding',
            'cellspacing': 'cellSpacing',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
        }
        
        # 자체 닫힘 태그들
        self.self_closing_tags = {
            'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 
            'col', 'embed', 'source', 'track', 'wbr'
        }
        
    def convert_html_to_jsx(self, html_content: str) -> str:
        """HTML을 JSX 호환 형태로 변환"""
        content = html_content
        
        # 1. HTML 속성을 JSX 속성으로 변환
        content = self._convert_attributes(content)
        
        # 2. 자체 닫힘 태그 수정
        content = self._fix_self_closing_tags(content)
        
        # 3. 스타일 속성을 객체 형태로 변환
        content = self._convert_style_attributes(content)
        
        # 4. HTML 엔티티 정리
        content = self._clean_html_entities(content)
        
        # 5. 주석 제거 (JSX에서 문제될 수 있음)
        content = self._remove_html_comments(content)
        
        # 6. DOCTYPE 및 html, head, body 태그 제거 (React 컴포넌트에서는 불필요)
        content = self._remove_document_structure(content)
        
        return content
    
    def _convert_attributes(self, content: str) -> str:
        """HTML 속성을 JSX 속성으로 변환"""
        for html_attr, jsx_attr in self.html_to_jsx_attrs.items():
            # class="..." → className="..."
            pattern = rf'\b{html_attr}="([^"]*)"'
            content = re.sub(pattern, rf'{jsx_attr}="\1"', content, flags=re.IGNORECASE)
            
            # class='...' → className='...'
            pattern = rf"\b{html_attr}='([^']*)'"
            content = re.sub(pattern, rf"{jsx_attr}='\1'", content, flags=re.IGNORECASE)
        
        return content
    
    def _fix_self_closing_tags(self, content: str) -> str:
        """자체 닫힘 태그를 JSX 형태로 수정"""
        for tag in self.self_closing_tags:
            # <img ...> → <img ... />
            pattern = rf'<{tag}([^>]*?)(?<!/)>'
            content = re.sub(pattern, rf'<{tag}\1 />', content, flags=re.IGNORECASE)
        
        return content
    
    def _convert_style_attributes(self, content: str) -> str:
        """인라인 스타일을 React 객체 형태로 변환"""
        def style_replacer(match):
            style_content = match.group(1)
            # CSS 속성들을 camelCase로 변환하고 객체 형태로 만들기
            style_pairs = []
            for item in style_content.split(';'):
                if ':' in item:
                    prop, value = item.split(':', 1)
                    prop = prop.strip()
                    value = value.strip().strip('"\'')
                    
                    # CSS 속성을 camelCase로 변환
                    prop_camel = self._to_camel_case(prop)
                    
                    # 숫자 값들 처리
                    if value.isdigit():
                        style_pairs.append(f'{prop_camel}: {value}')
                    else:
                        style_pairs.append(f'{prop_camel}: "{value}"')
            
            if style_pairs:
                style_obj = '{' + ', '.join(style_pairs) + '}'
                return f'style={style_obj}'
            return 'style={{}}'
        
        # style="..." 패턴 찾기
        content = re.sub(r'style="([^"]*)"', style_replacer, content, flags=re.IGNORECASE)
        content = re.sub(r"style='([^']*)'", style_replacer, content, flags=re.IGNORECASE)
        
        return content
    
    def _to_camel_case(self, css_prop: str) -> str:
        """CSS 속성을 camelCase로 변환"""
        components = css_prop.split('-')
        return components[0] + ''.join(x.capitalize() for x in components[1:])
    
    def _clean_html_entities(self, content: str) -> str:
        """HTML 엔티티 정리"""
        entities = {
            '&nbsp;': ' ',
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&',
            '&quot;': '"',
            '&#39;': "'",
        }
        
        for entity, replacement in entities.items():
            content = content.replace(entity, replacement)
        
        return content
    
    def _remove_html_comments(self, content: str) -> str:
        """HTML 주석 제거"""
        return re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    def _remove_document_structure(self, content: str) -> str:
        """DOCTYPE, html, head, body 태그 제거하고 body 내용만 추출"""
        # DOCTYPE 제거
        content = re.sub(r'<!DOCTYPE[^>]*>', '', content, flags=re.IGNORECASE)
        
        # body 태그 내용만 추출
        body_match = re.search(r'<body[^>]*>(.*?)</body>', content, flags=re.DOTALL | re.IGNORECASE)
        if body_match:
            content = body_match.group(1)
        
        # 남은 html, head 태그 제거
        content = re.sub(r'</?html[^>]*>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'<head>.*?</head>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        return content.strip()

def convert_html_for_react(html_file_path: Path, output_path: Path = None) -> str:
    """HTML 파일을 React 호환 형태로 변환"""
    converter = ReactHTMLConverter()
    
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    jsx_content = converter.convert_html_to_jsx(html_content)
    
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(jsx_content)
        print(f"React 호환 HTML 저장: {output_path}")
    
    return jsx_content

def create_react_component_template(jsx_content: str, component_name: str = "BlogContent") -> str:
    """JSX 콘텐츠로 React 컴포넌트 템플릿 생성"""
    template = f'''import React from 'react';

const {component_name} = () => {{
    return (
        <div className="blog-content">
{jsx_content}
        </div>
    );
}};

export default {component_name};
'''
    return template

# 사용 예시
if __name__ == "__main__":
    # HTML 파일을 React 호환 형태로 변환
    html_path = Path("templates/blog_template.html")
    if html_path.exists():
        jsx_content = convert_html_for_react(html_path)
        
        # React 컴포넌트 템플릿 생성
        component_code = create_react_component_template(jsx_content)
        
        # 결과 저장
        output_path = Path("output/BlogTemplate.tsx")
        output_path.parent.mkdir(exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(component_code)
        
        print(f"React 컴포넌트 생성 완료: {output_path}")
