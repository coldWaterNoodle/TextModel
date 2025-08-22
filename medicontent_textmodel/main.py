# medicontent_textmodel/main.py - 수정된 버전
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# routes 임포트
from api import routes

app = FastAPI(
    title="MediContent TextModel API",
    description="의료 컨텐츠 생성 및 평가 API",
    version="1.0.0"
)

# CORS 설정 (Next.js와 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routes.py의 라우터 등록 ⭐ 중요!
app.include_router(routes.router)

@app.get("/")
async def root():
    return {"message": "MediContent TextModel API 실행 중!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)