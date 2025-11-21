import React, { useState, useEffect } from 'react';
import { tradeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Portfolio.css';

function Portfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' or 'history'

  useEffect(() => {
    loadPortfolio();
    loadTransactions();
  }, []);

  const loadPortfolio = async () => {
    try {
      const result = await tradeAPI.getPortfolio();
      if (result.success) {
        setPortfolio(result.portfolio);
      }
    } catch (error) {
      console.error('포트폴리오 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const result = await tradeAPI.getHistory(50);
      if (result.success) {
        setTransactions(result.transactions);
      }
    } catch (error) {
      console.error('거래 내역 로딩 실패:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR');
  };

  // 총 평가금액 계산
  const totalValue = portfolio.reduce((sum, item) => {
    return sum + parseFloat(item.current_value || 0);
  }, 0);

  // 총 투자금액
  const totalInvested = portfolio.reduce((sum, item) => {
    return sum + parseFloat(item.total_invested || 0);
  }, 0);

  // 총 손익
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // 총 자산 (현금 + 주식)
  const totalAssets = (user?.currentBalance || 0) + totalValue;

  return (
    <div className="portfolio-container">
      <h1>내 포트폴리오</h1>

      {/* 자산 요약 */}
      <div className="asset-summary">
        <div className="summary-card">
          <h3>총 자산</h3>
          <div className="amount large">{formatCurrency(totalAssets)}원</div>
        </div>
        <div className="summary-card">
          <h3>보유 현금</h3>
          <div className="amount">{formatCurrency(user?.currentBalance || 0)}원</div>
        </div>
        <div className="summary-card">
          <h3>주식 평가액</h3>
          <div className="amount">{formatCurrency(totalValue)}원</div>
        </div>
        <div className="summary-card">
          <h3>총 손익</h3>
          <div className={`amount ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
            {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}원
            <span className="percent">
              ({totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="portfolio-tabs">
        <button
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          보유 종목
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          거래 내역
        </button>
      </div>

      {/* 보유 종목 */}
      {activeTab === 'portfolio' && (
        <div className="portfolio-content">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : portfolio.length === 0 ? (
            <div className="empty-state">
              <p>보유 중인 주식이 없습니다.</p>
              <p>주식 거래 페이지에서 매수를 시작해보세요!</p>
            </div>
          ) : (
            <div className="portfolio-table-container">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>종목명</th>
                    <th>보유수량</th>
                    <th>평균매입가</th>
                    <th>현재가</th>
                    <th>평가금액</th>
                    <th>손익</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item) => {
                    const profitLoss = parseFloat(item.profit_loss || 0);
                    const profitLossPercent = parseFloat(item.profit_loss_percent || 0);
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="stock-info">
                            <strong>{item.stock_name}</strong>
                            <span className="stock-code">({item.stock_symbol})</span>
                          </div>
                        </td>
                        <td>{formatCurrency(item.quantity)}주</td>
                        <td>{formatCurrency(item.avg_purchase_price)}원</td>
                        <td>{formatCurrency(item.current_price)}원</td>
                        <td>{formatCurrency(item.current_value)}원</td>
                        <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                          {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}원
                        </td>
                        <td className={profitLossPercent >= 0 ? 'profit' : 'loss'}>
                          {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 거래 내역 */}
      {activeTab === 'history' && (
        <div className="portfolio-content">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>거래 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="portfolio-table-container">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>거래일시</th>
                    <th>종목명</th>
                    <th>구분</th>
                    <th>수량</th>
                    <th>체결가</th>
                    <th>거래금액</th>
                    <th>거래후잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.transaction_date)}</td>
                      <td>
                        <div className="stock-info">
                          <strong>{tx.stock_name}</strong>
                          <span className="stock-code">({tx.stock_symbol})</span>
                        </div>
                      </td>
                      <td>
                        <span className={`trade-type ${tx.transaction_type === 'BUY' ? 'buy' : 'sell'}`}>
                          {tx.transaction_type === 'BUY' ? '매수' : '매도'}
                        </span>
                      </td>
                      <td>{formatCurrency(tx.quantity)}주</td>
                      <td>{formatCurrency(tx.price)}원</td>
                      <td>{formatCurrency(tx.total_amount)}원</td>
                      <td>{formatCurrency(tx.balance_after)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Portfolio;
