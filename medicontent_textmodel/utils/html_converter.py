import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

class BlogHTMLConverter:
    def __init__(self, template_path: str = "templates/blog_template.html"):
        self.template_path = Path(template_path)
        self.template = self._load_template()
    
    def _load_template(self) -> str:
        """HTML 템플릿 로드"""
        if self.template_path.exists():
            return self.template_path.read_text(encoding='utf-8')
        else:
            # 기본 템플릿 반환 (위의 템플릿 코드)
            return self._get_default_template()
    
    def _get_default_template(self) -> str:
        """기본 HTML 템플릿 반환"""
        return """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; margin: 0; padding: 20px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        .meta {{ color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }}
        .intro {{ background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        section {{ margin: 20px 0; padding: 15px; background: #fff; border-left: 4px solid #3498db; }}
        figure {{ text-align: center; margin: 20px 0; }}
        img {{ max-width: 100%; height: auto; border-radius: 5px; }}
        figcaption {{ font-style: italic; color: #7f8c8d; margin-top: 5px; }}
        .footer-notice {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 30px; font-size: 0.9em; }}
        .hashtags {{ margin-top: 20px; }}
        .hashtags a {{ color: #3498db; text-decoration: none; margin-right: 10px; }}
    </style>
</head>
<body>
    <div className="container">
        <h1>{title}</h1>
        <div className="meta">
            <span>카테고리: {category}</span> | 
            <span>작성자: {author_name}</span> | 
            <span>작성일: {formatted_date}</span>
        </div>
        
        {intro_section}
        
        <main>
            {sections_html}
        </main>
        
        <div className="footer-notice">
            {footer_notice}
        </div>
        
        <div className="hashtags">
            {hashtags_html}
        </div>
    </div>
</body>
</html>"""
    
    def _get_react_body_template(self) -> str:
        """React용 body 내용만 반환"""
        return """<div className="container">
    <h1>{title}</h1>
    <div className="meta">
        <span>카테고리: {category}</span> | 
        <span>작성자: {author_name}</span> | 
        <span>작성일: {formatted_date}</span>
    </div>
    
    {intro_section}
    
    <main>
        {sections_html}
    </main>
    
    <div className="footer-notice">
        {footer_notice}
    </div>
    
    <div className="hashtags">
        {hashtags_html}
    </div>
</div>"""
    
    def convert_json_to_html(self, json_path: Path, react_mode: bool = False) -> str:
        """JSON 파일을 HTML로 변환
        
        Args:
            json_path: JSON 파일 경로
            react_mode: True면 React 호환 형태로 생성 (body 내용만)
        """
        data = json.loads(json_path.read_text(encoding='utf-8'))
        
        # 템플릿 변수 생성
        template_vars = {
            'title': data.get('title', '제목 없음'),
            'category': self._extract_category(data),
            'author_name': self._extract_author(data),
            'formatted_date': self._format_date(data),
            'intro_section': self._build_intro_section(data, react_mode),
            'sections_html': self._build_sections_html(data, react_mode),
            'footer_notice': self._build_footer_notice(data),
            'hashtags_html': self._build_hashtags(data)
        }
        
        # React 모드면 body 내용만 사용
        if react_mode:
            html_content = self._get_react_body_template()
        else:
            html_content = self.template
            
        for key, value in template_vars.items():
            html_content = html_content.replace(f'{{{key}}}', str(value))
        
        return html_content
    
    def _extract_category(self, data: Dict) -> str:
        """카테고리 추출 (제목에서 추론)"""
        title = data.get('title', '').lower()
        if '신경치료' in title or '치수염' in title:
            return '신경치료'
        elif '임플란트' in title:
            return '임플란트'
        elif '교정' in title:
            return '치아교정'
        else:
            return '일반진료'
    
    def _extract_author(self, data: Dict) -> str:
        """작성자 정보 추출"""
        # meta 정보에서 추출하거나 기본값 사용
        return "치과의사 000"
    
    def _format_date(self, data: Dict) -> str:
        """날짜 포맷팅"""
        if 'meta' in data and 'timestamp' in data['meta']:
            timestamp = data['meta']['timestamp']
            # 20250818_111939 형태를 "2025. 8. 18. 11:19" 형태로 변환
            try:
                dt = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
                return dt.strftime("%Y. %m. %d. %H:%M")
            except:
                pass
        return datetime.now().strftime("%Y. %m. %d. %H:%M")
    
    def _build_intro_section(self, data: Dict, react_mode: bool = False) -> str:
        """인트로 섹션 생성"""
        css_class = "className" if react_mode else "class"
        intro_html = f'<div {css_class}="intro">'
        
        # sections에서 intro 찾기
        if 'sections' in data:
            intro_section = data['sections'].get('1_intro')
            if intro_section and 'text' in intro_section:
                intro_text = self._markdown_to_html_simple(intro_section['text'], react_mode)
                intro_html += f"<p>{intro_text}</p>"
        
        intro_html += "</div>"
        return intro_html
    
    def _build_sections_html(self, data: Dict, react_mode: bool = False) -> str:
        """섹션들을 HTML로 변환"""
        if 'sections' not in data:
            return ""
        
        sections_html = ""
        section_order = ['2_visit', '3_inspection', '4_doctor_tip', '5_treatment', '6_check_point', '7_conclusion']
        
        for section_key in section_order:
            if section_key in data['sections']:
                section_data = data['sections'][section_key]
                sections_html += self._build_single_section(section_data, section_key, react_mode)
        
        return sections_html
    
    def _build_single_section(self, section_data: Dict, section_key: str, react_mode: bool = False) -> str:
        """개별 섹션 HTML 생성"""
        css_class = "className" if react_mode else "class"
        section_html = '<section>'
    
        # 섹션 제목
        if 'title' in section_data:
            section_html += f'<h2 {css_class}="section-title">{section_data["title"]}</h2>'
    
        # 섹션 내용
        if 'text' in section_data:
            text_html = self._markdown_to_html_simple(section_data['text'], react_mode)
            section_html += text_html
    
        # 이미지들
        if 'images' in section_data:
            section_html += self._build_images_html(section_data['images'], react_mode)
    
        section_html += '</section>'
        return section_html
    
    def _build_images_html(self, images: List[Dict], react_mode: bool = False) -> str:
        """이미지들을 HTML로 변환"""
        images_html = ""
        for img in images:
            original_path = img.get('path', '')
            alt_text = img.get('alt', '')
        
            # 상대 경로 추가
            if original_path and not original_path.startswith('../'):
                img_path = f"../../../{original_path}"
            else:
                img_path = original_path
        
            if react_mode:
                # React 모드: style을 객체로
                style_obj = '{width: "100%", maxWidth: "500px", height: "auto"}'
                images_html += f'''
            <figure>
                <img src="{img_path}" alt="{alt_text}" style={style_obj} />
                <figcaption>{alt_text}</figcaption>
            </figure>
            '''
            else:
                # 일반 HTML 모드
                images_html += f'''
            <figure>
                <img src="{img_path}" alt="{alt_text}" style="width: 100% !important; max-width:500px !important; height:auto;">
                <figcaption>{alt_text}</figcaption>
            </figure>
            '''
        return images_html
    
    def _build_hashtags(self, data: Dict) -> str:
        """해시태그 생성"""
        title = data.get('title', '')
        
        # 제목에서 키워드 추출해서 해시태그 생성
        hashtags = []
        keywords = ['치과', '신경치료', '치수염', '임플란트', '교정']
        
        for keyword in keywords:
            if keyword in title:
                hashtags.append(f'<a href="#">#{keyword}</a>')
        
        return '\n'.join(hashtags)
    
    def _build_footer_notice(self, data: Dict) -> str:
        """푸터 공지사항 생성"""
        return '''
        치과의사 000이 직접 작성하는 블로그입니다.<br>
        본 포스팅은 56조 제 1항의 의료법을 준수하여 작성되었습니다.<br>
        실제 내원 환자분의 동의하에 공개된 사진이며,<br>
        동일한 환자분께 동일한 조건에서 촬영한 사진을 활용하였습니다.<br>
        다만 개인에 따라 진료 및 치료방법이 다르게 적용될 수 있으며,<br>
        효과와 부작용이 다르게 나타날 수 있는 점을 안내드립니다.<br>
        진료 전 전문 의료진과의 충분한 상담을 권해드립니다.
        '''
    
    def _markdown_to_html_simple(self, text: str, react_mode: bool = False) -> str:
            """간단한 마크다운 → HTML 변환 (113259 방식으로 통일)"""
            if not text:
                return ""
            # 1. 이스케이프된 줄바꿈 문자 정리
            text = text.replace('\\n\\n', '\n\n')
            text = text.replace('\\n', '\n')
                    # 6. **굵게** → <strong>굵게</strong>
            text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
            # 7. *기울임* → <em>기울임</em>
            text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
            # 2. 추가 단어 단위 줄바꿈 (기존 쉼표 줄바꿈 유지하면서)
            text = self._add_word_breaks_safe(text)
            # 3. GIF 경로를 실제 이미지로 변환 (경로만 있는 형태)
            def replace_gif_path(m):
                path = m.group(1).replace("\\", "/")
                if react_mode:
                    style_obj = '{width: "auto", height: "auto", maxWidth: "100px"}'
                    return f'\n\n<img src="../../../{path}" alt="" style={style_obj} />'
                else:
                    return f'\n\n<img src="../../../{path}" alt="" style="width:auto; height:auto; max-width:100px;">'
            text = re.sub(r'\(([^)]+\.gif)\)', replace_gif_path, text)
            # 4. 모든 줄바꿈을 <br>로 변환 (113259 방식)
            if react_mode:
                text = text.replace('\n\n', '<br /><br />')  # React 자체 닫힘 태그
                text = text.replace('\n', '<br />')
            else:
                text = text.replace('\n\n', '<br><br>')  # 빈 줄 → <br><br>
                text = text.replace('\n', '<br>')        # 단일 줄바꿈 → <br>
            # 5. 하나의 <p> 태그로 감싸기
            text = f'<p>{text}</p>'
            return text

    def _add_word_breaks_safe(self, text: str) -> str:
        """기존 줄바꿈을 유지하면서 긴 줄만 3-6단어씩 끊기"""
        lines = text.split('\n')
        result = []
    
        for line in lines:
            line = line.strip()
            if not line:
                result.append('')
                continue
            
            # 이미 짧은 줄이거나 쉼표가 있는 줄은 그대로 유지
            words = line.split()
            if len(words) <= 5:
                result.append(line)
            else:
                # 긴 줄만 3-5단어씩 끊기
                chunks = []
                current_chunk = []
            
                for word in words:
                    current_chunk.append(word)
                
                    # 3-5단어가 모이면 끊기
                    if len(current_chunk) >= 3:
                        # 자연스러운 끊는 지점 찾기
                        if (word.endswith(('요', '다', '죠', '네', '까', '나')) or 
                            len(current_chunk) >= 6):
                            chunks.append(' '.join(current_chunk))
                            current_chunk = []
            
                # 남은 단어들
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
            
                result.extend(chunks)
    
        return '\n'.join(result)

# 사용 예시
def convert_content_to_html(json_path: Path, output_path: Path = None, react_mode: bool = False):
    """content.json을 HTML로 변환하는 메인 함수"""
    converter = BlogHTMLConverter()
    html_content = converter.convert_json_to_html(json_path, react_mode)
    
    if not output_path:
        if react_mode:
            output_path = json_path.with_suffix('.react.html')
        else:
            output_path = json_path.with_suffix('.html')
    
    output_path.write_text(html_content, encoding='utf-8')
    mode_text = "React 호환 HTML" if react_mode else "HTML"
    print(f"{mode_text} 변환 완료: {output_path}")
    return output_path