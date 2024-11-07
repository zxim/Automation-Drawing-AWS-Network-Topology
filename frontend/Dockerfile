# Node.js 이미지를 기반으로 설정
FROM node:14

# 작업 디렉토리 설정
WORKDIR /app

# 환경 변수 설정: 폴링 모드 사용 (Docker 환경에서 파일 변경 감지)
ENV CHOKIDAR_USEPOLLING=true

# 패키지 파일 복사 및 종속성 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# React 개발 서버 시작
CMD ["npm", "start"]
