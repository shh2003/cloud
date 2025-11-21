-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS investment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE investment_db;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  initial_balance DECIMAL(15, 2) DEFAULT 10000000.00,
  current_balance DECIMAL(15, 2) DEFAULT 10000000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 포트폴리오 테이블 (나중에 사용)
CREATE TABLE IF NOT EXISTS portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stock_symbol VARCHAR(20) NOT NULL,
  stock_name VARCHAR(100),
  quantity INT NOT NULL,
  avg_purchase_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2),
  total_invested DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2),
  profit_loss DECIMAL(15, 2),
  profit_loss_percent DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_stock_symbol (stock_symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 거래 내역 테이블 (나중에 사용)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stock_symbol VARCHAR(20) NOT NULL,
  stock_name VARCHAR(100),
  transaction_type ENUM('BUY', 'SELL') NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  commission DECIMAL(15, 2) DEFAULT 0,
  balance_after DECIMAL(15, 2) NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 테스트 데이터 (선택사항)
-- INSERT INTO users (username, email, password, full_name) 
-- VALUES ('testuser', 'test@example.com', '$2a$10$...', '테스트 사용자');
