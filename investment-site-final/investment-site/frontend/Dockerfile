# investment-site/frontend/Dockerfile
FROM node:14-alpine     

WORKDIR /app

# 의존성 먼저 설치
COPY package*.json ./
RUN npm install

# 나머지 소스 복사
COPY . .

# CRA dev 서버를 컨테이너 밖에서도 접근 가능하게
ENV HOST=0.0.0.0
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

CMD ["npm", "start"]
