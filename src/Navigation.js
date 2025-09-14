import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ hideInTreeView = false }) {
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
      </div>
    </nav>
  );
}

export default Navigation;