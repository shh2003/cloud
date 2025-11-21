const db = require('../config/database');
const kisService = require('../services/kisService');

// 주식 매수
exports.buyStock = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { stockCode, stockName, quantity, price } = req.body;

    // 유효성 검사
    if (!stockCode || !quantity || !price) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '필수 정보를 입력해주세요.'
      });
    }

    if (quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상이어야 합니다.'
      });
    }

    // 총 거래 금액 계산 (수수료 없음 - 모의투자)
    const totalAmount = price * quantity;

    // 사용자 잔액 확인
    const [users] = await connection.query(
      'SELECT current_balance FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const currentBalance = parseFloat(users[0].current_balance);

    if (currentBalance < totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '잔액이 부족합니다.'
      });
    }

    // 잔액 차감
    const newBalance = currentBalance - totalAmount;
    await connection.query(
      'UPDATE users SET current_balance = ? WHERE id = ?',
      [newBalance, userId]
    );

    // 포트폴리오 확인 (이미 보유 중인지)
    const [existingPortfolio] = await connection.query(
      'SELECT * FROM portfolios WHERE user_id = ? AND stock_symbol = ?',
      [userId, stockCode]
    );

    if (existingPortfolio.length > 0) {
      // 기존 보유 종목 - 평균 매입가 재계산
      const portfolio = existingPortfolio[0];
      const oldQuantity = portfolio.quantity;
      const oldAvgPrice = parseFloat(portfolio.avg_purchase_price);
      const oldTotalInvested = parseFloat(portfolio.total_invested);

      const newQuantity = oldQuantity + quantity;
      const newTotalInvested = oldTotalInvested + totalAmount;
      const newAvgPrice = newTotalInvested / newQuantity;

      await connection.query(
        'UPDATE portfolios SET quantity = ?, avg_purchase_price = ?, total_invested = ?, current_price = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, newAvgPrice, newTotalInvested, price, portfolio.id]
      );
    } else {
      // 신규 매수
      await connection.query(
        'INSERT INTO portfolios (user_id, stock_symbol, stock_name, quantity, avg_purchase_price, current_price, total_invested) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, stockCode, stockName, quantity, price, price, totalAmount]
      );
    }

    // 거래 내역 저장
    await connection.query(
      'INSERT INTO transactions (user_id, stock_symbol, stock_name, transaction_type, quantity, price, total_amount, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, stockCode, stockName, 'BUY', quantity, price, totalAmount, newBalance]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '매수가 완료되었습니다.',
      data: {
        stockCode,
        stockName,
        quantity,
        price,
        totalAmount,
        balanceAfter: newBalance
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('매수 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '매수 처리 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 주식 매도
exports.sellStock = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { stockCode, quantity, price } = req.body;

    // 유효성 검사
    if (!stockCode || !quantity || !price) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '필수 정보를 입력해주세요.'
      });
    }

    if (quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상이어야 합니다.'
      });
    }

    // 포트폴리오 확인
    const [portfolio] = await connection.query(
      'SELECT * FROM portfolios WHERE user_id = ? AND stock_symbol = ?',
      [userId, stockCode]
    );

    if (portfolio.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '보유하고 있지 않은 종목입니다.'
      });
    }

    const holding = portfolio[0];

    if (holding.quantity < quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `보유 수량이 부족합니다. (보유: ${holding.quantity}주)`
      });
    }

    // 총 거래 금액 계산
    const totalAmount = price * quantity;

    // 사용자 잔액 업데이트
    const [users] = await connection.query(
      'SELECT current_balance FROM users WHERE id = ?',
      [userId]
    );

    const currentBalance = parseFloat(users[0].current_balance);
    const newBalance = currentBalance + totalAmount;

    await connection.query(
      'UPDATE users SET current_balance = ? WHERE id = ?',
      [newBalance, userId]
    );

    // 포트폴리오 업데이트
    const newQuantity = holding.quantity - quantity;

    if (newQuantity === 0) {
      // 전량 매도 - 포트폴리오에서 삭제
      await connection.query(
        'DELETE FROM portfolios WHERE id = ?',
        [holding.id]
      );
    } else {
      // 일부 매도 - 수량 및 총 투자금 업데이트
      const avgPrice = parseFloat(holding.avg_purchase_price);
      const newTotalInvested = avgPrice * newQuantity;

      await connection.query(
        'UPDATE portfolios SET quantity = ?, total_invested = ?, current_price = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, newTotalInvested, price, holding.id]
      );
    }

    // 거래 내역 저장
    await connection.query(
      'INSERT INTO transactions (user_id, stock_symbol, stock_name, transaction_type, quantity, price, total_amount, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, stockCode, holding.stock_name, 'SELL', quantity, price, totalAmount, newBalance]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '매도가 완료되었습니다.',
      data: {
        stockCode,
        stockName: holding.stock_name,
        quantity,
        price,
        totalAmount,
        balanceAfter: newBalance
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('매도 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '매도 처리 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 내 포트폴리오 조회
exports.getMyPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const [portfolios] = await db.query(
      'SELECT * FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    // 각 종목의 현재가 업데이트
    const updatedPortfolios = await Promise.all(
      portfolios.map(async (item) => {
        try {
          const stockData = await kisService.getCurrentPrice(item.stock_symbol);
          const currentPrice = stockData.currentPrice;
          const currentValue = currentPrice * item.quantity;
          const profitLoss = currentValue - parseFloat(item.total_invested);
          const profitLossPercent = (profitLoss / parseFloat(item.total_invested)) * 100;

          // DB 업데이트
          await db.query(
            'UPDATE portfolios SET current_price = ?, current_value = ?, profit_loss = ?, profit_loss_percent = ? WHERE id = ?',
            [currentPrice, currentValue, profitLoss, profitLossPercent, item.id]
          );

          return {
            ...item,
            current_price: currentPrice,
            current_value: currentValue,
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent
          };
        } catch (error) {
          console.error(`${item.stock_symbol} 시세 업데이트 실패:`, error);
          return item;
        }
      })
    );

    res.json({
      success: true,
      portfolio: updatedPortfolios
    });

  } catch (error) {
    console.error('포트폴리오 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '포트폴리오 조회에 실패했습니다.'
    });
  }
};

// 거래 내역 조회
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT ?',
      [userId, parseInt(limit)]
    );

    res.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('거래 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '거래 내역 조회에 실패했습니다.'
    });
  }
};
