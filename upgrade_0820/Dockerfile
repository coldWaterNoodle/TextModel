# 1. 의존성 설치 및 빌드
FROM node:18-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --legacy-peer-deps

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN npm run build

# 2. 프로덕션 이미지 생성
FROM node:18-alpine

WORKDIR /app

# 빌드 단계에서 생성된 파일들 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# 애플리케이션 실행
CMD ["npm", "start"]
