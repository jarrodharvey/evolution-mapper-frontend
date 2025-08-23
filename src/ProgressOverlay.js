import React from 'react';
import './ProgressOverlay.css';

const ProgressOverlay = ({ show, message, showSpinner = true, showProgressBar = false, countdown = null }) => {
  if (!show) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-content">
        {showSpinner && (
          <div className="progress-spinner"></div>
        )}
        <div className="progress-message">
          {message}
          {countdown !== null && (
            <span className="progress-countdown"> ({countdown}s)</span>
          )}
        </div>
        {showProgressBar && (
          <div className="progress-bar">
            <div className="progress-bar-fill"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressOverlay;