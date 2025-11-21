// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stockAPI, tradeAPI } from '../services/api';
import StockChart from '../components/StockChart';

function Dashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // 30초마다 실시간 인기 종목 업데이트
    const interval = setInterval(() => {
      loadTopStocks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStock) {
      loadChartData(selectedStock.stockCode);
    }
  }, [selectedStock]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const portfolioResult = await tradeAPI.getPortfolio();
      if (portfolioResult.success) {
        setPortfolio(portfolioResult.portfolio);
      }

      await loadTopStocks();
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopStocks = async () => {
    try {
      const result = await stockAPI.getPopular();
      if (result.success) {
        setTopStocks(result.stocks || []);

        if (!selectedStock && result.stocks && result.stocks.length > 0) {
          setSelectedStock(result.stocks[0]);
        }
      }
    } catch (error) {
      console.error('인기 종목 로딩 실패:', error);
    }
  };

  const loadChartData = async (stockCode) => {
    try {
      const result = await stockAPI.getChart(stockCode, 30);
      if (result.success) {
        setChartData(result.data);
      }
    } catch (error) {
      console.error('차트 데이터 로딩 실패:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const totalValue = portfolio.reduce((sum, item) => {
    return sum + parseFloat(item.current_value || 0);
  }, 0);

  const totalProfitLoss = portfolio.reduce((sum, item) => {
    return sum + parseFloat(item.profit_loss || 0);
  }, 0);

  const totalInvested = portfolio.reduce((sum, item) => {
    return sum + parseFloat(item.total_invested || 0);
  }, 0);

  const profitRate = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const getStockDisplayName = (stock) => {
    if (!stock) return '알수없음';
    return stock.stockName || stock.stockCode || '알수없음';
  };

  return (
    <div className="container">
      <h1>대시보드</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        환영합니다, <strong>{user?.fullName || user?.username}</strong>님!
      </p>

      <div className="dashboard">
        <div className="card">
          <h2>총 자산</h2>
          <div className="balance">
            {formatCurrency((user?.currentBalance || 0) + totalValue)}
          </div>
          <p style={{ marginTop: '0.5rem', color: '#666' }}>
            현금: {formatCurrency(user?.currentBalance || 0)}
          </p>
        </div>

        <div className="card">
          <h2>총 수익/손실</h2>
          <div className={`balance ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
            {totalProfitLoss >= 0 ? '+' : ''}
            {formatCurrency(totalProfitLoss)}
          </div>
          <p style={{ marginTop: '0.5rem', color: '#666' }}>
            수익률: {profitRate >= 0 ? '+' : ''}
            {profitRate.toFixed(2)}%
          </p>
        </div>

        <div className="card">
          <h2>보유 종목</h2>
          <div className="balance">
            {portfolio.length}개
          </div>
          <p style={{ marginTop: '0.5rem', color: '#666' }}>
            총 투자금액: {formatCurrency(totalInvested)}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🔥 실시간 인기 종목</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
            로딩 중...
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}
            >
              {topStocks.map((stock, index) => (
                <div
                  key={stock.stockCode || index}
                  onClick={() => setSelectedStock(stock)}
                  style={{
                    padding: '1rem',
                    background:
                      selectedStock?.stockCode === stock.stockCode
                        ? '#e8f5f1'
                        : 'white',
                    border:
                      selectedStock?.stockCode === stock.stockCode
                        ? '2px solid #4ecca3'
                        : '1px solid #eee',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStock?.stockCode !== stock.stockCode) {
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStock?.stockCode !== stock.stockCode) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#4ecca3',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </div>
                    <strong
                      style={{
                        fontSize: '1rem',
                        color: '#1a1a2e'
                      }}
                    >
                      {getStockDisplayName(stock)}
                    </strong>
                  </div>
                  <div
                    style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}
                  >
                    {formatCurrency(stock.currentPrice || 0)}원
                  </div>
                  <div
                    style={{
                      color: (stock.changePrice || 0) >= 0 ? '#e74c3c' : '#3498db',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    {(stock.changePrice || 0) >= 0 ? '+' : ''}
                    {formatCurrency(stock.changePrice || 0)}원
                    (
                    {(stock.changeRate || 0) >= 0 ? '+' : ''}
                    {(stock.changeRate || 0).toFixed
                      ? stock.changeRate.toFixed(2)
                      : stock.changeRate}
                    %)
                  </div>
                </div>
              ))}
            </div>

            {selectedStock && chartData && (
              <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>
                      {getStockDisplayName(selectedStock)}
                    </h2>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: '#1a1a2e'
                        }}
                      >
                        {formatCurrency(selectedStock.currentPrice || 0)}원
                      </span>
                      <span
                        style={{
                          fontSize: '1.1rem',
                          color:
                            (selectedStock.changePrice || 0) >= 0
                              ? '#e74c3c'
                              : '#3498db',
                          fontWeight: '500'
                        }}
                      >
                        {(selectedStock.changePrice || 0) >= 0 ? '+' : ''}
                        {formatCurrency(selectedStock.changePrice || 0)}원
                        (
                        {(selectedStock.changeRate || 0) >= 0 ? '+' : ''}
                        {(selectedStock.changeRate || 0).toFixed
                          ? selectedStock.changeRate.toFixed(2)
                          : selectedStock.changeRate}
                        %)
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    🔴 실시간
                  </span>
                </div>
                <StockChart
                  data={chartData}
                  stockName={getStockDisplayName(selectedStock)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
