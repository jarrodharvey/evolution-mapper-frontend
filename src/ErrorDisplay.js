import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onRetry, showRetryButton = false }) => {
  return (
    <div className="error-display">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-message">
          <h3>Tree Generation Error</h3>
          <p>{error}</p>
        </div>
        {showRetryButton && (
          <div className="error-actions">
            <button onClick={onRetry} className="retry-button">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;