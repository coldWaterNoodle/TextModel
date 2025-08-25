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
        
        agent = InputAgent()
        input_data = agent.collect(mode=args.mode)

        if input_data is None:
            print("❌ InputAgent 실행 실패")
            return
        print("✅ InputAgent 완료")
    else:
        print("📂 InputAgent 건너뛰기 - 기존 input_log 사용")

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
        content_result = content_run(mode=args.mode)  # 최신 title.json 자동 탐지
        
        if content_result is None:
            print("❌ ContentAgent 실행 실패")
            return
        
        print("✅ ContentAgent 완료")
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