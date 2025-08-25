/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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
