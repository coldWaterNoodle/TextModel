/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 환경 변수 설정
  env: {
    NEXT_PUBLIC_AIRTABLE_API_KEY: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
    NEXT_PUBLIC_AIRTABLE_BASE_ID: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID,
    FASTAPI_BASE_URL: process.env.FASTAPI_BASE_URL,
  },
  
  // 웹팩 설정으로 모듈 해석 문제 해결
  webpack: (config, { isServer }) => {
    // 파일 시스템 fallback 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
