import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import MobileThemeToggle from './MobileThemeToggle';
import './Navigation.css';

function Navigation({ hideInTreeView = false, isMobileDarkMode = false, onMobileThemeToggle }) {
  const location = useLocation();
  
  if (hideInTreeView) {
    return null;
  }
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🧬 Evolution Mapper
        </Link>
        
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Explore
          </Link>
          <Link
            to="/about"
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
          >
            About
          </Link>
          <Link
            to="/attributions"
            className={`nav-link ${location.pathname === '/attributions' ? 'active' : ''}`}
          >
            Attributions
          </Link>
        </div>

        {onMobileThemeToggle && (
          <MobileThemeToggle
            isDarkMode={isMobileDarkMode}
            onToggle={onMobileThemeToggle}
            className="nav-theme-toggle"
          />
        )}
      </div>
    </nav>
  );
}

export default Navigation;
