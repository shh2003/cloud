// backend/services/kisService.js
const axios = require('axios');
const path = require('path');
require('dotenv').config({
  // 필요하면 경로 조정
  path: path.join(__dirname, '..', '.env')
});

class KISService {
  constructor() {
    this.appKey = process.env.KIS_APP_KEY;
    this.appSecret = process.env.KIS_APP_SECRET;
    this.baseURL = process.env.KIS_API_URL || 'https://openapi.koreainvestment.com:9443';
    this.mockMode = process.env.KIS_MOCK_MODE === 'true';
    this.accessToken = null;
    this.tokenExpiry = null;

    // 초당 호출 제한 대비용 간단 슬로틀링
    this.lastCallTime = 0;
    this.minInterval = 150; // ms, 필요하면 200~250으로 늘려도 됨

    console.log('[KIS ENV CHECK]', {
      KIS_APP_KEY: this.appKey ? '***loaded***' : null,
      KIS_APP_SECRET: this.appSecret ? '***loaded***' : null,
      KIS_API_URL: this.baseURL,
      KIS_MOCK_MODE: process.env.KIS_MOCK_MODE
    });
  }

  async _throttle() {
    const now = Date.now();
    const diff = now - this.lastCallTime;
    if (diff < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - diff));
    }
    this.lastCallTime = Date.now();
  }

  // 액세스 토큰 발급
  async getAccessToken() {
    if (this.mockMode) {
      console.log(' MOCK 모드: 가상 토큰 사용');
      return 'mock_token';
    } 
    // 외부 KIS 서버가 죽어도 서비스가 멈추지 않도록 가짜 토큰을 사용

    // 토큰이 유효하면 재사용
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('기존 토큰 재사용');
      return this.accessToken;
    }

    try {
      console.log('한국투자증권 API 토큰 발급 시도...');
      console.log('API URL:', this.baseURL);
      // KIS 서버에 인증 요청
      const response = await axios.post(`${this.baseURL}/oauth2/tokenP`, {
        grant_type: 'client_credentials',
        appkey: this.appKey,
        appsecret: this.appSecret
      });
     
      this.accessToken = response.data.access_token;
      // 토큰 만료 시간 설정 (발급 후 23시간)
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

      console.log('토큰 발급 성공');
      return this.accessToken;
    } catch (error) {
      console.error('액세스 토큰 발급 실패:', error.response?.data || error.message);
      console.error('MOCK 모드로 전환을 고려하세요 (KIS_MOCK_MODE=true)');

      // 에러 발생 시 자동으로 MOCK 모드로 전환
      console.log('자동으로 MOCK 모드로 전환합니다...');
      this.mockMode = true;
      return 'mock_token';
    }
  }

  // 현재가 조회
  async getCurrentPrice(stockCode) {
    if (this.mockMode) {
      console.log(`📊 MOCK 모드: ${stockCode} 모의 데이터 반환`);
      return this.getMockCurrentPrice(stockCode);
    }

    await this._throttle();

    try {
      console.log(`📈 ${stockCode} 현재가 조회 시도...`);
      const token = await this.getAccessToken();

      // 토큰이 mock_token이면 자동으로 mock 데이터 반환
      if (token === 'mock_token' || this.mockMode) {
        return this.getMockCurrentPrice(stockCode);
      }

      const response = await axios.get(
        `${this.baseURL}/uapi/domestic-stock/v1/quotations/inquire-price`,
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
            appkey: this.appKey,
            appsecret: this.appSecret,
            tr_id: 'FHKST01010100'
          },
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: stockCode
          }
        }
      );

      const data = response.data.output;
      console.log(`✅ ${stockCode} 현재가 조회 성공`);

      return {
        stockCode: stockCode,
        // 이름이 없을 때 코드/알수없음으로 기본값 처리
        stockName: data.hts_kor_isnm || stockCode || '알수없음',
        currentPrice: parseInt(data.stck_prpr),
        changePrice: parseInt(data.prdy_vrss),
        changeRate: parseFloat(data.prdy_ctrt),
        highPrice: parseInt(data.stck_hgpr),
        lowPrice: parseInt(data.stck_lwpr),
        openPrice: parseInt(data.stck_oprc),
        volume: parseInt(data.acml_vol)
      };
    } catch (error) {
      console.error(`❌ ${stockCode} 현재가 조회 실패:`, error.response?.data || error.message);
      console.log(`🔄 ${stockCode} MOCK 데이터로 전환`);
      return this.getMockCurrentPrice(stockCode);
    }
  }

  // 일별 차트 데이터 조회
  async getDailyChart(stockCode, period = 30) {
    if (this.mockMode) {
      console.log(`📊 MOCK 모드: ${stockCode} 차트 모의 데이터 반환`);
      return this.getMockChartData(stockCode, period);
    }

    await this._throttle();

    try {
      console.log(`📈 ${stockCode} 차트 데이터 조회 시도...`);
      const token = await this.getAccessToken();

      // 토큰이 mock_token이면 자동으로 mock 데이터 반환
      if (token === 'mock_token' || this.mockMode) {
        return this.getMockChartData(stockCode, period);
      }

      const response = await axios.get(
        `${this.baseURL}/uapi/domestic-stock/v1/quotations/inquire-daily-price`,
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
            appkey: this.appKey,
            appsecret: this.appSecret,
            tr_id: 'FHKST01010400'
          },
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: stockCode,
            FID_PERIOD_DIV_CODE: 'D',
            FID_ORG_ADJ_PRC: '0'
          }
        }
      );

      const chartData = response.data.output.slice(0, period).reverse();
      console.log(`✅ ${stockCode} 차트 데이터 조회 성공`);

      return chartData.map(item => ({
        date: item.stck_bsop_date,
        open: parseInt(item.stck_oprc),
        high: parseInt(item.stck_hgpr),
        low: parseInt(item.stck_lwpr),
        close: parseInt(item.stck_clpr),
        volume: parseInt(item.acml_vol)
      }));
    } catch (error) {
      console.error(`❌ ${stockCode} 차트 데이터 조회 실패:`, error.response?.data || error.message);
      console.log(`🔄 ${stockCode} 차트 MOCK 데이터로 전환`);
      return this.getMockChartData(stockCode, period);
    }
  }

  // 모의 현재가 데이터
  getMockCurrentPrice(stockCode) {
    const mockStocks = {
      '005930': { name: '삼성전자', price: 95200, change: 500, changeRate: 0.71 },
      '000660': { name: 'SK하이닉스', price: 145000, change: -2000, changeRate: -1.36 },
      '035420': { name: 'NAVER', price: 205500, change: 3000, changeRate: 1.48 },
      '035720': { name: '카카오', price: 48500, change: -500, changeRate: -1.02 },
      '207940': { name: '삼성바이오로직스', price: 950000, change: 10000, changeRate: 1.06 },
      '068270': { name: '셀트리온', price: 185000, change: -3000, changeRate: -1.6 },
      '373220': { name: 'LG에너지솔루션', price: 420000, change: 5000, changeRate: 1.2 }
    };

    const stock = mockStocks[stockCode] || {
      name: '알수없음',
      price: 10000,
      change: 0,
      changeRate: 0
    };

    return {
      stockCode,
      stockName: stock.name || stockCode || '알수없음',
      currentPrice: stock.price,
      changePrice: stock.change,
      changeRate: stock.changeRate,
      highPrice: Math.floor(stock.price * 1.03),
      lowPrice: Math.floor(stock.price * 0.97),
      openPrice: Math.floor(stock.price * 0.99),
      volume: Math.floor(Math.random() * 10000000)
    };
  }

  // 모의 차트 데이터
  getMockChartData(stockCode, period) {
    const basePrice = 50000;
    const chartData = [];
    const today = new Date();

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // 주말 제외
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      const randomChange = (Math.random() - 0.5) * 2000;
      const close = Math.floor(basePrice + randomChange + (Math.random() - 0.5) * 1000);
      const open = Math.floor(close + (Math.random() - 0.5) * 500);
      const high = Math.max(open, close) + Math.floor(Math.random() * 300);
      const low = Math.min(open, close) - Math.floor(Math.random() * 300);

      chartData.push({
        date: date.toISOString().split('T')[0].replace(/-/g, ''),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 5000000) + 1000000
      });
    }

    return chartData;
  }

  // 주식 검색 (모의 데이터)
  searchStocks(keyword) {
    const stocks = [
      { code: '005930', name: '삼성전자', market: 'KOSPI' },
      { code: '000660', name: 'SK하이닉스', market: 'KOSPI' },
      { code: '035420', name: 'NAVER', market: 'KOSPI' },
      { code: '035720', name: '카카오', market: 'KOSPI' },
      { code: '207940', name: '삼성바이오로직스', market: 'KOSPI' },
      { code: '068270', name: '셀트리온', market: 'KOSPI' },
      { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' },
      { code: '051910', name: 'LG화학', market: 'KOSPI' },
      { code: '006400', name: '삼성SDI', market: 'KOSPI' },
      { code: '028260', name: '삼성물산', market: 'KOSPI' }
    ];

    if (!keyword) return stocks;

    return stocks.filter(stock =>
      stock.name.includes(keyword) || stock.code.includes(keyword)
    );
  }
}

module.exports = new KISService();
