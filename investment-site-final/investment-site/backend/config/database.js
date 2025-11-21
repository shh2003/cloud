// backend/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// 환경변수 + 기본값 설정 (Docker / 로컬 모두 고려)
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',        // Docker 내부 기본: mysql 서비스 이름
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'investment_db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('[DB] 설정:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

// MySQL 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// Promise 기반 쿼리 사용
const promisePool = pool.promise();

// 연결 테스트
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL 연결 실패:', err.message);
    return;
  }
  console.log('✅ MySQL 데이터베이스 연결 성공!');
  connection.release();
});

module.exports = promisePool;
