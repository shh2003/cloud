// backend/controllers/stockController.js
const kisService = require('../services/kisService');

// 주식 검색
exports.searchStocks = async (req, res) => {
  try {
    const { keyword } = req.query;
    const stocks = kisService.searchStocks(keyword);

    res.json({
      success: true,
      stocks
    });
  } catch (error) {
    console.error('주식 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '주식 검색에 실패했습니다.'
    });
  }
};

// 주식 현재가 조회
exports.getStockPrice = async (req, res) => {
  try {
    const { stockCode } = req.params;

    if (!stockCode) {
      return res.status(400).json({
        success: false,
        message: '종목 코드를 입력해주세요.'
      });
    }

    const stockData = await kisService.getCurrentPrice(stockCode);

    res.json({
      success: true,
      data: stockData
    });
  } catch (error) {
    console.error('주식 시세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주식 정보 조회에 실패했습니다.'
    });
  }
};

// 주식 차트 데이터 조회
exports.getStockChart = async (req, res) => {
  try {
    const { stockCode } = req.params;
    const { period = 30 } = req.query;

    if (!stockCode) {
      return res.status(400).json({
        success: false,
        message: '종목 코드를 입력해주세요.'
      });
    }

    const chartData = await kisService.getDailyChart(
      stockCode,
      parseInt(period, 10)
    );

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('차트 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '차트 데이터 조회에 실패했습니다.'
    });
  }
};

// 인기 종목 (TOP 10) - 순차 호출로 변경해서 초당 호출 제한 회피
exports.getPopularStocks = async (req, res) => {
  try {
    const popularCodes = [
      '005930', // 삼성전자
      '000660', // SK하이닉스
      '035420', // NAVER
      '035720', // 카카오
      '207940', // 삼성바이오로직스
      '068270', // 셀트리온
      '373220', // LG에너지솔루션
      '051910', // LG화학
      '006400', // 삼성SDI
      '028260'  // 삼성물산
    ];

    const stocksData = [];

    for (const code of popularCodes) {
      const data = await kisService.getCurrentPrice(code);
      stocksData.push(data);

      // 초당 거래건수 초과 방지용 딜레이
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    res.json({
      success: true,
      stocks: stocksData
    });
  } catch (error) {
    console.error('인기 종목 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '인기 종목 조회에 실패했습니다.'
    });
  }
};
