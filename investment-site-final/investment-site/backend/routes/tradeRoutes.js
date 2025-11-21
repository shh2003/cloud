const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const authMiddleware = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 주식 매수
router.post('/buy', tradeController.buyStock);

// 주식 매도
router.post('/sell', tradeController.sellStock);

// 내 포트폴리오 조회
router.get('/portfolio', tradeController.getMyPortfolio);

// 거래 내역 조회
router.get('/history', tradeController.getTransactionHistory);

module.exports = router;
