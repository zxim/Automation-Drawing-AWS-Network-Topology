# Python 이미지를 사용한 기본 설정
FROM python:3.9-slim

# 작업 디렉터리 설정
WORKDIR /app

# 필요한 패키지 설치
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 환경 변수 설정
ENV FLASK_APP=app.py
ENV FLASK_ENV=development  

# 소스 코드 복사
COPY . .

# Flask 서버 실행
CMD ["flask", "run", "--host=0.0.0.0"]
