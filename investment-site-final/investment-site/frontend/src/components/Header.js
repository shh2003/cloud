import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          📈 모의투자 플랫폼
        </Link>

        {isAuthenticated ? (
          <nav className="nav-menu">
            <Link to="/" className="nav-link">대시보드</Link>
            <Link to="/trading" className="nav-link">거래</Link>
            <Link to="/portfolio" className="nav-link">포트폴리오</Link>
            
            <div className="user-info">
              <span>{user?.username}님</span>
              <button onClick={handleLogout} className="logout-btn">
                로그아웃
              </button>
            </div>
          </nav>
        ) : (
          <nav className="nav-menu">
            <Link to="/login" className="nav-link">로그인</Link>
            <Link to="/register" className="nav-link">회원가입</Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
