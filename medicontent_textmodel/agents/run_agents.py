import os
import argparse
import json
from input_agent import InputAgent
#from plan_agent import PlanAgent
#from title_agent import TitleAgent
#from content_agent import ContentAgent
# from image_agent import ImageAgent 
# from eval_agent import EvalAgent
# from final_assembler import FinalAssembler


def load_env(env_path: str = ".env"):
    """
    Load environment variables from .env file.
    """
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_path)


def parse_args():

    parser = argparse.ArgumentParser(description="블로그 자동화 멀티 에이전트 실행기")
    parser.add_argument(
        'mode', nargs='?', choices=['test', 'use'], default='use',
        help="모드 선택: 'test' 또는 'use' (기본: 'use')"
    )
    parser.add_argument(
        '--env', default='.env',
        help="환경변수 파일 경로 (기본: env)"
    )
    parser.add_argument(
        '--skip-input', action="store_true",
        help="InputAgent 실행 건너뛰기 (기존 input_log 사용)"
    )
    parser.add_argument(
        '--input-file', 
        help="input_data JSON 파일 경로 (UI 데이터 형식)"
    )
    parser.add_argument(
        '--terminal-mode', action="store_true",
        help="터미널 입력 모드 활성화 (input_data 없이 대화형 입력)"
    )
    return parser.parse_args()


def main():
    # 1. 인자 파싱 및 환경변수 로드
    args = parse_args()
    load_env(args.env)

    print(f"🚀 에이전트 체인 실행 시작 (모드: {args.mode})")

    # 2. Input 데이터 준비(선택적)
    if not args.skip_input:
        print("\n" + "="*60)
        print("📝 1단계: InputAgent 실행")
        print("="*60)
        
        # input_data 준비
        input_data_for_agent = None
        
        if args.input_file and os.path.exists(args.input_file):
            # JSON 파일에서 input_data 로드
            print(f"📂 JSON 파일에서 input_data 로드: {args.input_file}")
            try:
                with open(args.input_file, 'r', encoding='utf-8') as f:
                    input_data_for_agent = json.load(f)
                print("✅ JSON 파일 로드 성공")
            except Exception as e:
                print(f"❌ JSON 파일 로드 실패: {e}")
                return
        elif args.terminal_mode:
            # 터미널 모드: input_data 없이 대화형 입력
            print("🖥️ 터미널 모드: 대화형 입력 활성화")
            input_data_for_agent = None
        elif args.input_file:
            print(f"❌ 지정된 파일을 찾을 수 없습니다: {args.input_file}")
            return
        else:
            # 기본값: input_data 없이 실행 (기존 동작 유지)
            print("ℹ️ input_data 없이 InputAgent 실행")
        
        agent = InputAgent(input_data=input_data_for_agent)
        input_data = agent.collect(mode=args.mode)

        if input_data is None:
            print("❌ InputAgent 실행 실패 - 하지만 2.5단계는 계속 진행")
        else:
            print("✅ InputAgent 완료")
    else:
        print("📂 InputAgent 건너뛰기 - 기존 input_log 사용")

    # 2.5. 이미지 URL 업데이트 단계 (input 완료 후 30초 대기하면서 처리)
    print("\n" + "="*60)
    print("🔄 2.5단계: 이미지 URL 업데이트 (30초 대기)")
    print("="*60)
    
    import time
    print("⏳ Input 처리 완료 후 30초 대기 중... (Airtable 업데이트 시간 확보)")
    time.sleep(30)
    print("✅ 대기 완료, 이미지 URL 업데이트 시작")
    
    try:
        # 최신 input_log 찾기
        import json
        from pathlib import Path
        from datetime import datetime
        
        log_dir = Path(f"test_logs/{args.mode}/{datetime.now().strftime('%Y%m%d')}")
        if log_dir.exists():
            input_files = list(log_dir.glob("*_input_logs.json"))
            if input_files:
                latest_input_file = max(input_files, key=lambda p: p.stat().st_mtime)
                print(f"📂 최신 input_log: {latest_input_file}")
                
                with open(latest_input_file, 'r', encoding='utf-8') as f:
                    input_logs = json.load(f)
                
                # 최신 로그 항목 가져오기
                if isinstance(input_logs, list) and input_logs:
                    latest_input = input_logs[-1]
                    post_id = latest_input.get("postId")
                    
                    if post_id:
                        print(f"🔄 postId로 Airtable에서 최신 이미지 URL 가져오기: {post_id}")
                        
                        # API 경로 추가
                        import sys
                        api_dir = Path(__file__).parent.parent / "api"
                        if str(api_dir) not in sys.path:
                            sys.path.insert(0, str(api_dir))
                        
                        # Content GIF 로직과 동일한 방식으로 간단하게 처리
                        try:
                            import asyncio
                            from routes import get_input_data_from_db
                            
                            # Airtable에서 최신 데이터 가져오기
                            fresh_data = asyncio.run(get_input_data_from_db(post_id))
                            
                            if fresh_data:
                                print("✅ Airtable에서 최신 이미지 URL 데이터 받아옴")
                                
                                # 이미지 필드별로 URL 업데이트
                                img_fields = ["question3_visit_images", "question5_therapy_images", "question7_result_images"]
                                updated_count = 0
                                
                                for field in img_fields:
                                    if fresh_data.get(field) and latest_input.get(field):
                                        fresh_imgs = fresh_data[field]
                                        old_imgs = latest_input[field]
                                        
                                        # 기존 이미지들의 URL을 fresh 데이터의 URL로 업데이트
                                        for i, old_img in enumerate(old_imgs):
                                            if i < len(fresh_imgs):
                                                fresh_img = fresh_imgs[i]
                                                if fresh_img.get("url"):
                                                    old_img["url"] = fresh_img["url"]
                                                    old_img["path"] = fresh_img["url"]
                                                    updated_count += 1
                                                    print(f"  ✅ {field}[{i}]: URL 업데이트됨")
                                
                                if updated_count > 0:
                                    # 업데이트된 로그를 파일에 저장
                                    with open(latest_input_file, 'w', encoding='utf-8') as f:
                                        json.dump(input_logs, f, ensure_ascii=False, indent=2)
                                    print(f"💾 input_log 파일 업데이트 완료 ({updated_count}개 이미지)")
                                else:
                                    print("⚠️ 업데이트할 URL이 없음")
                            else:
                                print("⚠️ Airtable에서 최신 데이터를 받지 못함")
                                
                        except Exception as e:
                            print(f"⚠️ URL 업데이트 실패: {e}")
                            import traceback
                            traceback.print_exc()
                    else:
                        print("ℹ️ postId가 없어서 URL 업데이트 건너뜀")
                else:
                    print("⚠️ input_log가 비어있음")
            else:
                print("⚠️ input_log 파일을 찾을 수 없음")
        else:
            print(f"⚠️ 로그 디렉토리가 없음: {log_dir}")
            
    except Exception as e:
        print(f"⚠️ 이미지 URL 업데이트 단계 실패: {e}")
        print("➡️ 기존 로그로 계속 진행")
        import traceback
        traceback.print_exc()
    
    print("✅ 이미지 URL 업데이트 단계 완료")

    # 3. PlanAgent 실행 (최신 input_logs.json 자동 탐지)
    print("\n" + "="*60)
    print("🎯 2단계: PlanAgent 실행")
    print("="*60)
    
    try:
        from plan_agent import main as plan_main
        plan_result = plan_main(mode=args.mode)  # input_data=None으로 최신 로그 자동 탐지
        
        if plan_result is None:
            print("❌ PlanAgent 실행 실패")
            return
        
        print("✅ PlanAgent 완료")
    except Exception as e:
        print(f"❌ PlanAgent 실행 실패: {e}")
        return

    # 4. TitleAgent 실행 (최신 plan.json 자동 탐지)
    print("\n" + "="*60)
    print("📰 3단계: TitleAgent 실행")
    print("="*60)
    
    try:
        from title_agent import run as title_run
        title_result = title_run(mode=args.mode)  # 최신 plan.json 자동 탐지
        
        if title_result is None:
            print("❌ TitleAgent 실행 실패")
            return
        
        print("✅ TitleAgent 완료")
    except Exception as e:
        print(f"❌ TitleAgent 실행 실패: {e}")
        return

    # 5. ContentAgent 실행 (최신 title.json 자동 탐지)
    print("\n" + "="*60)
    print("📄 4단계: ContentAgent 실행")
    print("="*60)
    
    try:
        from content_agent import run as content_run
        # UI 모드 결정: input_file이 있으면 UI 모드로 간주
        ui_mode = bool(args.input_file and not args.terminal_mode)
        content_result = content_run(mode=args.mode, ui_mode=ui_mode)  # ui_mode 전달
        
        if content_result is None:
            print("❌ ContentAgent 실행 실패")
            return
        
        mode_text = "UI 버전" if ui_mode else "로컬 버전"
        print(f"✅ ContentAgent 완료 ({mode_text})")
    except Exception as e:
        print(f"❌ ContentAgent 실행 실패: {e}")
        return

    # 6. EvaluationAgent 실행 (최신 content TXT 자동 탐지)
    print("\n" + "="*60)
    print("⚖️ 5단계: EvaluationAgent 실행")
    print("="*60)
    
    try:
        from evaluation_agent import run as evaluation_run
        
        evaluation_run(
            criteria_mode="표준",
            max_loops=2,
            auto_yes=True,  # 자동 실행
            log_dir=f"test_logs/{args.mode}",
            evaluation_mode="medical"
        )
        
        print("✅ EvaluationAgent 완료")
    except Exception as e:
        print(f"❌ EvaluationAgent 실행 실패: {e}")
        import traceback
        traceback.print_exc()

    # 7. 완료 메시지
    print("\n" + "="*80)
    print("🎉 전체 에이전트 체인 실행 완료!")
    print("="*80)
    
    print("📁 생성된 로그 파일 확인:")
    print(f"   test_logs/{args.mode}/[날짜]/")
    print("   - *_input_logs.json (InputAgent)")
    print("   - *_plan.json (PlanAgent)")
    print("   - *_title.json (TitleAgent)")
    print("   - *_content*.json + *.txt (ContentAgent)")
    print("   - *_evaluation.json (EvaluationAgent)")

    # image_agent = ImageAgent()
    # images, image_candidates, image_eval_info, _ = image_agent.generate(content)

    # eval_agent = EvalAgent()
    # quality_report = eval_agent.evaluate(plan, title, content, images)

    # assembler = FinalAssembler()
    # final_output = assembler.assemble(
    #     plan=plan,
    #     title=title,
    #     content=content,
    #     images=images,
    #     evaluation=quality_report
    # )

    # if args.mode == 'test':
    #     print("🔍 [FINAL OUTPUT]", json.dumps(final_output, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()