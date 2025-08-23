import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onRetry, showRetryButton = false, onDismiss }) => {
  return (
    <div className="error-display">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-message">
          <h3>Tree Generation Error</h3>
          <p>{error}</p>
        </div>
        <div className="error-actions">
          {showRetryButton && (
            <button onClick={onRetry} className="retry-button">
              Try Again
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="dismiss-button" title="Dismiss">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;