import React from 'react';

function MobileThemeToggle({ isDarkMode, onToggle, className = '' }) {
  return (
    <button
      type="button"
      className={`mobile-theme-toggle ${isDarkMode ? 'active' : ''} ${className}`.trim()}
      role="switch"
      aria-checked={isDarkMode}
      aria-label={isDarkMode ? 'Switch mobile theme to light mode' : 'Switch mobile theme to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
      onClick={onToggle}
    >
      <span className="mobile-theme-toggle-icon" aria-hidden="true">
        {isDarkMode ? '☾' : '☀'}
      </span>
      <span className="mobile-theme-toggle-track" aria-hidden="true">
        <span className="mobile-theme-toggle-thumb" />
      </span>
    </button>
  );
}

export default MobileThemeToggle;
