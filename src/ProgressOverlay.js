import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Portal } from '@mui/material';
import './ProgressOverlay.css';

const STEP_LABELS = {
  request_started: 'Request started',
  validating_input: 'Validating input',
  database_lookup: 'Checking species data',
  parallel_queries: 'Running ROTL & DateLife queries',
  datelife_processing: 'Processing age data',
  network_conversion: 'Preparing tree network',
  creating_visualization: 'Rendering visualization',
  request_completed: 'Wrapping up results',
};

const formatStepLabel = (step) => {
  if (!step) return '';
  if (STEP_LABELS[step]) {
    return STEP_LABELS[step];
  }
  return step
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getActiveSteps = (progressData) => {
  if (!progressData || !Array.isArray(progressData.steps)) {
    return [];
  }

  const latestByStep = new Map();
  progressData.steps.forEach((entry) => {
    if (!entry || !entry.step) {
      return;
    }
    latestByStep.set(entry.step, entry);
  });

  return Array.from(latestByStep.values())
    .filter((entry) => entry.status === 'in_progress')
    .sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return aTime - bTime;
    })
    .map((entry) => ({
      key: entry.step,
      label: formatStepLabel(entry.step),
    }));
};

const ProgressOverlay = ({ show, message, countdown = null, progressData }) => {
  if (!show) return null;

  const activeSteps = getActiveSteps(progressData);
  const displayMessage = message || 'Tree generation in progress...';

  return (
    <Portal>
      <div className="progress-overlay">
        <div className="progress-content">
          <div className="progress-wheel-wrapper">
            <CircularProgress size={72} thickness={5} aria-label="Tree generation in progress" />
            {activeSteps.length > 0 && (
              <ul className="progress-active-steps">
                {activeSteps.map(({ key, label }) => (
                  <li key={key} className="progress-active-step">
                    <span className="progress-step-marker" aria-hidden="true" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="progress-message">
            {displayMessage}
            {countdown !== null && (
              <span className="progress-countdown"> ({countdown}s)</span>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProgressOverlay;
