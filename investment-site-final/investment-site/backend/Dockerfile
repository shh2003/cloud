# investment-site/backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 복사
COPY . .

# .env는 빌드할 때 같이 복사되도록 (민감하면 나중에 env_file로 변경 가능)
# 이 Dockerfile과 같은 폴더에 .env가 있어야 함

EXPOSE 5000

CMD ["npm", "start"]
