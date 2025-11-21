import React, { useState, useEffect } from 'react';
import { stockAPI, tradeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StockChart from '../components/StockChart';
import './Trading.css';

function Trading() {
  const { user } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockPrice, setStockPrice] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [popularStocks, setPopularStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  // 매수/매도 상태
  const [orderType, setOrderType] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [currentBalance, setCurrentBalance] = useState(user?.currentBalance || 10000000);

  // 인기 종목 불러오기
  useEffect(() => {
    loadPopularStocks();
  }, []);

  // 선택된 주식 정보 불러오기
  useEffect(() => {
    if (selectedStock) {
      loadStockData(selectedStock.code);

      // 실시간 시세 업데이트 (10초마다)
      const interval = setInterval(() => {
        updateStockPrice(selectedStock.code);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [selectedStock]);

  const loadPopularStocks = async () => {
    try {
      const result = await stockAPI.getPopular();
      if (result.success) {
        setPopularStocks(result.stocks);
      }
    } catch (error) {
      console.error('인기 종목 로딩 실패:', error);
    }
  };

  const loadStockData = async (stockCode) => {
    setLoading(true);
    try {
      // 현재가 조회
      const priceResult = await stockAPI.getPrice(stockCode);
      if (priceResult.success) {
        setStockPrice(priceResult.data);
      }

      // 차트 데이터 조회
      const chartResult = await stockAPI.getChart(stockCode, 30);
      if (chartResult.success) {
        setChartData(chartResult.data);
      }
    } catch (error) {
      console.error('주식 데이터 로딩 실패:', error);
      alert('주식 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateStockPrice = async (stockCode) => {
    try {
      const priceResult = await stockAPI.getPrice(stockCode);
      if (priceResult.success) {
        setStockPrice(priceResult.data);
      }
    } catch (error) {
      console.error('시세 업데이트 실패:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      return;
    }

    try {
      const result = await stockAPI.search(searchKeyword);
      if (result.success) {
        setSearchResults(result.stocks);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색에 실패했습니다.');
    }
  };

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSearchResults([]);
    setSearchKeyword('');
    setQuantity(1);
  };

  const handleOrder = async () => {
    if (!selectedStock || !stockPrice) {
      alert('주식을 선택해주세요.');
      return;
    }

    if (quantity <= 0) {
      alert('수량을 입력해주세요.');
      return;
    }

    const totalAmount = stockPrice.currentPrice * quantity;
    const orderTypeText = orderType === 'BUY' ? '매수' : '매도';

    // 매수 시 잔액 확인
    if (orderType === 'BUY' && currentBalance < totalAmount) {
      alert('잔액이 부족합니다.');
      return;
    }

    const confirmed = window.confirm(
      `${selectedStock.name} ${quantity}주를 ${orderTypeText}하시겠습니까?\n총 금액: ${totalAmount.toLocaleString()}원`
    );

    if (!confirmed) return;

    setOrderLoading(true);

    try {
      const orderData = {
        stockCode: selectedStock.code,
        stockName: selectedStock.name,
        quantity: parseInt(quantity),
        price: stockPrice.currentPrice
      };
      //선택된 종목의 코드, 이름, 주문 수량, 현재가를 기반으로 orderData 객체를 생성
      let result;
      if (orderType === 'BUY') {
        result = await tradeAPI.buy(orderData);
      } else {
        result = await tradeAPI.sell(orderData);
      }

      if (result.success) {
        alert(result.message);
        setCurrentBalance(result.data.balanceAfter);
        setQuantity(1);

        // 사용자 정보 업데이트
        const savedUser = JSON.parse(localStorage.getItem('user'));
        savedUser.currentBalance = result.data.balanceAfter;
        localStorage.setItem('user', JSON.stringify(savedUser));
      }
    } catch (error) {
      console.error('주문 처리 실패:', error);
      alert(error.response?.data?.message || '주문 처리에 실패했습니다.');
    } finally {
      setOrderLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getPriceChangeClass = (changePrice) => {
    if (changePrice > 0) return 'price-up';
    if (changePrice < 0) return 'price-down';
    return '';
  };

  const canAffordQuantity = Math.floor(currentBalance / (stockPrice?.currentPrice || 1));

  return (
    <div className="trading-container">
      <div className="trading-header">
        <h1>주식 거래</h1>
        <div className="balance-info">
          <span>보유 현금:</span>
          <strong>{formatCurrency(currentBalance)}원</strong>
        </div>
      </div>

      <div className="trading-layout">
        {/* 왼쪽: 주식 검색 및 인기 종목 */}
        <div className="trading-sidebar">
          <div className="search-section">
            <h3>종목 검색</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="종목명 또는 코드 입력"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}>검색</button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((stock) => (
                  <div
                    key={stock.code}
                    className="search-result-item"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <span className="stock-name">{stock.name}</span>
                    <span className="stock-code">{stock.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="popular-section">
            <h3>인기 종목</h3>
            <div className="popular-stocks">
              {popularStocks.map((stock, index) => (
                <div
                  key={stock.stockCode}
                  className="popular-stock-item"
                  onClick={() => handleSelectStock({ code: stock.stockCode, name: stock.stockName })}
                >
                  <div className="stock-rank">{index + 1}</div>
                  <div className="stock-info">
                    <div className="stock-name">{stock.stockName}</div>
                    <div className="stock-price">
                      <span>{formatCurrency(stock.currentPrice)}원</span>
                      <span className={getPriceChangeClass(stock.changePrice)}>
                        {stock.changePrice > 0 ? '+' : ''}{formatCurrency(stock.changePrice)}
                        ({stock.changeRate > 0 ? '+' : ''}{stock.changeRate}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 중앙: 차트 및 주식 정보 */}
        <div className="trading-main">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : selectedStock && stockPrice ? (
            <>
              <div className="stock-header">
                <h2>{stockPrice.stockName}</h2>
                <span className="stock-code">({selectedStock.code})</span>
                <span className="realtime-badge">🔴 실시간</span>
              </div>

              <div className="stock-price-info">
                <div className="current-price">
                  <span className="price">{formatCurrency(stockPrice.currentPrice)}원</span>
                  <span className={`change ${getPriceChangeClass(stockPrice.changePrice)}`}>
                    {stockPrice.changePrice > 0 ? '+' : ''}{formatCurrency(stockPrice.changePrice)}원
                    ({stockPrice.changeRate > 0 ? '+' : ''}{stockPrice.changeRate}%)
                  </span>
                </div>

                <div className="price-details">
                  <div className="price-item">
                    <span>고가</span>
                    <strong>{formatCurrency(stockPrice.highPrice)}원</strong>
                  </div>
                  <div className="price-item">
                    <span>저가</span>
                    <strong>{formatCurrency(stockPrice.lowPrice)}원</strong>
                  </div>
                  <div className="price-item">
                    <span>거래량</span>
                    <strong>{formatCurrency(stockPrice.volume)}</strong>
                  </div>
                </div>
              </div>

              {chartData && <StockChart data={chartData} stockName={stockPrice.stockName} />}
            </>
          ) : (
            <div className="no-selection">
              <p>주식을 검색하거나 인기 종목에서 선택해주세요</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 매수/매도 */}
        <div className="trading-order">
          <div className="order-tabs">
            <button
              className={`order-tab ${orderType === 'BUY' ? 'active buy' : ''}`}
              onClick={() => setOrderType('BUY')}
            >
              매수
            </button>
            <button
              className={`order-tab ${orderType === 'SELL' ? 'active sell' : ''}`}
              onClick={() => setOrderType('SELL')}
            >
              매도
            </button>
          </div>

          {selectedStock && stockPrice ? (
            <div className="order-form">
              <div className="order-info">
                <div className="info-row">
                  <span>현재가</span>
                  <strong>{formatCurrency(stockPrice.currentPrice)}원</strong>
                </div>
                {orderType === 'BUY' && (
                  <div className="info-row">
                    <span>매수 가능</span>
                    <strong>{formatCurrency(canAffordQuantity)}주</strong>
                  </div>
                )}
              </div>

              <div className="order-input">
                <label>수량</label>
                <div className="quantity-input">
                  <input
                    type="number"
                    min="1"
                    max={orderType === 'BUY' ? canAffordQuantity : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  {orderType === 'BUY' && (
                    <button
                      className="max-btn"
                      onClick={() => setQuantity(canAffordQuantity)}
                    >
                      최대
                    </button>
                  )}
                </div>
              </div>

              <div className="order-total">
                <span>주문 금액</span>
                <strong>{formatCurrency(stockPrice.currentPrice * quantity)}원</strong>
              </div>

              <button
                className={`order-button ${orderType === 'BUY' ? 'buy' : 'sell'}`}
                onClick={handleOrder}
                disabled={orderLoading}
              >
                {orderLoading ? '처리 중...' : orderType === 'BUY' ? '매수하기' : '매도하기'}
              </button>
            </div>
          ) : (
            <div className="no-stock-selected">
              주식을 선택해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Trading;