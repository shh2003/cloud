// frontend/src/services/api.js
import axios from 'axios';

/**
 * 실행 환경에 따라 API 기본 URL을 자동으로 결정
 * - Docker + Nginx reverse-proxy: window.location.origin + '/api'
 * - CRA 환경변수 설정 시: REACT_APP_API_BASE_URL 사용
 * - 그 외(로컬 백엔드만 실행): http://localhost:5000/api
 */
const getApiBaseUrl = () => {
  // 1) 환경변수 우선 (ex: REACT_APP_API_BASE_URL=/api)
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // 2) 브라우저 환경이면 현재 origin 기준
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // 3) fallback: 로컬 백엔드 직통
  return 'http://localhost:5000/api';
};

const API_URL = getApiBaseUrl();
console.log('[API] baseURL =', API_URL);

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ====================== 인증 API ======================

export const authAPI = {
  // 회원가입
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 로그인
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // 내 정보 가져오기
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// ====================== 주식 API ======================

export const stockAPI = {
  // 주식 검색
  search: async (keyword) => {
    const response = await api.get('/stocks/search', {
      params: { keyword }
    });
    return response.data;
  },

  // 주식 현재가 조회
  getPrice: async (stockCode) => {
    const response = await api.get(`/stocks/price/${stockCode}`);
    return response.data;
  },

  // 주식 차트 데이터
  getChart: async (stockCode, period = 30) => {
    const response = await api.get(`/stocks/chart/${stockCode}`, {
      params: { period }
    });
    return response.data;
  },

  // 인기 종목
  getPopular: async () => {
    const response = await api.get('/stocks/popular');
    return response.data;
  }
};

// ====================== 거래 API ======================

export const tradeAPI = {
  // 주식 매수
  buy: async (orderData) => {
    const response = await api.post('/trades/buy', orderData);
    return response.data;
  },

  // 주식 매도
  sell: async (orderData) => {
    const response = await api.post('/trades/sell', orderData);
    return response.data;
  },

  // 내 포트폴리오 조회
  getPortfolio: async () => {
    const response = await api.get('/trades/portfolio');
    return response.data;
  },

  // 거래 내역 조회
  getHistory: async (limit = 50) => {
    const response = await api.get('/trades/history', {
      params: { limit }
    });
    return response.data;
  }
};

export default api;
