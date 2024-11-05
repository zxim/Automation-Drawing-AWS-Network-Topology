# frontend/Dockerfile

# Node.js 이미지를 기반으로 설정
FROM node:14

# 작업 디렉터리 설정
WORKDIR /app

# 종속성 설치
COPY package.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# React 개발 서버 시작
CMD ["npm", "start"]
