// backend/routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 주식 검색
router.get('/search', stockController.searchStocks);

// 주식 현재가 조회
router.get('/price/:stockCode', stockController.getStockPrice);

// 주식 차트 데이터 조회
router.get('/chart/:stockCode', stockController.getStockChart);

// 인기 종목 조회
router.get('/popular', stockController.getPopularStocks);

module.exports = router;
