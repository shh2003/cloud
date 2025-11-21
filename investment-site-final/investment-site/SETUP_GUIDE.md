# 모의투자 사이트 - 설치 및 실행 가이드

## 📋 프로젝트 개요
실시간 차트를 기반으로 한 모의투자 웹 애플리케이션입니다.
현재는 회원가입, 로그인, 대시보드의 기본 기능이 구현되어 있습니다.

## 🛠 기술 스택
### 백엔드
- Node.js
- Express.js
- MySQL
- JWT 인증
- bcrypt (비밀번호 암호화)

### 프론트엔드
- React
- React Router
- Axios
- Context API (상태 관리)

## 📁 프로젝트 구조
```
investment-site/
├── backend/
│   ├── config/
│   │   └── database.js          # DB 연결 설정
│   ├── controllers/
│   │   └── authController.js    # 인증 컨트롤러
│   ├── middleware/
│   │   └── auth.js              # JWT 미들웨어
│   ├── routes/
│   │   └── authRoutes.js        # 인증 라우트
│   ├── server.js                # Express 서버
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   └── PrivateRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Dashboard.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── database/
    └── schema.sql               # DB 스키마
```

## 🚀 설치 및 실행 방법

### 1. MySQL 데이터베이스 설정

MySQL을 설치하고 실행한 후:

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 테이블 생성
source database/schema.sql

# 또는 직접 SQL 실행
CREATE DATABASE investment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE investment_db;
# schema.sql의 내용을 복사해서 실행
```

### 2. 백엔드 설정

```bash
# 백엔드 폴더로 이동
cd backend

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 데이터베이스 정보 수정

# 서버 실행
npm start

# 또는 개발 모드로 실행 (자동 재시작)
npm run dev
```

### 3. .env 파일 설정 예시
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=investment_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# 한국투자증권 API (선택사항)
KIS_APP_KEY=your_app_key_here
KIS_APP_SECRET=your_app_secret_here
KIS_API_URL=https://openapi.koreainvestment.com:9443
KIS_MOCK_MODE=true
```

**주의**: `KIS_MOCK_MODE=true`로 설정하면 실제 API 호출 없이 모의 데이터로 작동합니다.
실제 한국투자증권 API를 사용하려면:
1. [KIS Developers](https://apiportal.koreainvestment.com) 에서 회원가입
2. 모의투자 앱 생성 및 API Key 발급
3. .env 파일에 키 입력 후 `KIS_MOCK_MODE=false`로 변경

### 4. 프론트엔드 설정

새 터미널을 열고:

```bash
# 프론트엔드 폴더로 이동
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm start
```

## 🌐 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 📝 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 내 정보 조회 (인증 필요)

### 주식 API
- `GET /api/stocks/search?keyword=삼성` - 주식 검색
- `GET /api/stocks/price/:stockCode` - 주식 현재가 조회
- `GET /api/stocks/chart/:stockCode?period=30` - 주식 차트 데이터
- `GET /api/stocks/popular` - 인기 종목 Top 10

### 요청 예시

**회원가입**
```json
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "fullName": "홍길동"
}
```

**로그인**
```json
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

**주식 현재가 조회**
```
GET /api/stocks/price/005930
Authorization: Bearer {token}
```

## ✅ 현재 구현된 기능
- [x] 회원가입 (초기 자본금 1천만원 자동 지급)
- [x] 로그인/로그아웃
- [x] JWT 기반 인증
- [x] 대시보드 (기본 정보 표시)
- [x] 주식 검색 기능
- [x] 실시간 주식 시세 조회 (한국투자증권 API 연동)
- [x] 주식 차트 표시 (Chart.js)
- [x] 인기 종목 Top 10
- [x] **실시간 시세 자동 업데이트 (10초마다)**
- [x] **주식 매수 기능 (실제 거래 처리)**
- [x] **주식 매도 기능 (실제 거래 처리)**
- [x] **포트폴리오 자동 업데이트**
- [x] **거래 내역 저장 및 조회**
- [x] **잔액 관리 및 실시간 반영**
- [x] **포트폴리오 페이지 (보유 종목, 수익률 조회)**
- [x] 반응형 디자인

## 🔜 다음 단계 (예정)
- [ ] 실시간 WebSocket 시세 업데이트
- [ ] 차트 기간 선택 기능 (1주, 1개월, 3개월, 1년)
- [ ] 관심 종목 추가/삭제
- [ ] 수익률 통계 및 차트
- [ ] 랭킹 시스템 (다른 사용자와 수익률 비교)

## 🐳 도커 변환 계획
나중에 다음과 같은 도커 구조로 변환 예정:
1. 역방향 프록시 (Nginx)
2. DB 컨테이너 (MySQL)
3. 프론트엔드 컨테이너 (React)
4. 백엔드 컨테이너 1 (Node.js)
5. 백엔드 컨테이너 2 (Python/Java 등)
6. 세션 공유 서버 (Redis)

## 🔧 문제 해결

### MySQL 연결 오류
- MySQL이 실행 중인지 확인
- .env 파일의 DB 정보가 올바른지 확인
- 데이터베이스가 생성되었는지 확인

### CORS 오류
- 백엔드에서 cors가 올바르게 설정되었는지 확인
- 포트 번호가 일치하는지 확인

### 토큰 만료
- 로그아웃 후 다시 로그인

## 📞 지원
질문이나 문제가 있으면 이슈를 생성해주세요!
