// backend/server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const connectRedis = require("connect-redis");
const { createClient } = require("redis");
require("dotenv").config();

// DB 연결
require("./config/database");

const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const tradeRoutes = require("./routes/tradeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ===================== Redis + Session 설정 =====================

// 1) connect-redis export 형태 정규화 함수
function resolveRedisStore(connectRedisModule) {
  let exp = connectRedisModule;

  // ESModule 형태 (default, RedisStore 등) 처리
  if (exp && typeof exp === "object") {
    if (exp.default) exp = exp.default;
    if (exp.RedisStore) exp = exp.RedisStore;
  }

  // v5 스타일 (function(session) { ... }) 인지 시도
  if (typeof exp === "function") {
    try {
      // v5 인 경우: 함수에 session 넣으면 Store 클래스가 반환됨
      const maybeStore = exp(session);
      if (typeof maybeStore === "function") {
        return maybeStore; // v5 스타일
      }
    } catch (e) {
      // v7 이상에서는 class라서 호출하면 지금처럼 에러가 나는데, 그건 무시하고 그대로 class로 사용
    }
  }

  // 그 외에는 exp 자체가 Store class 라고 보고 사용
  return exp;
}

const RedisStore = resolveRedisStore(connectRedis);

// 2) Redis client 생성
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "redis",
    port: 6379,
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis 연결 오류:", err);
});

redisClient
  .connect()
  .then(() => console.log("✅ Redis 연결 성공"))
  .catch((err) => console.error("❌ Redis 초기 연결 실패:", err));

// 3) RedisStore 인스턴스
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "sess:",
});

// 4) 세션 미들웨어
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1시간
    },
  })
);

// ====================== 공통 미들웨어 ======================

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================== 라우트 ======================

app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/trades", tradeRoutes);

// 세션 확인용 테스트 엔드포인트
app.get("/api/session-test", (req, res) => {
  if (!req.session.viewCount) req.session.viewCount = 0;
  req.session.viewCount += 1;

  res.json({
    success: true,
    backend: process.env.BACKEND_NAME || "unknown",
    sessionID: req.sessionID,
    viewCount: req.session.viewCount,
  });
});

// 기본 라우트
app.get("/", (req, res) => {
  res.json({
    message: "모의투자 사이트 API 서버",
    backend: process.env.BACKEND_NAME || "unknown",
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "요청한 리소스를 찾을 수 없습니다.",
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error("🔥 서버 에러:", err.stack);
  res.status(500).json({
    success: false,
    message: "서버 내부 오류가 발생했습니다.",
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(
    `🚀 ${process.env.BACKEND_NAME || "backend"} 서버가 포트 ${PORT}에서 실행 중입니다.`
  );
});

module.exports = app;
