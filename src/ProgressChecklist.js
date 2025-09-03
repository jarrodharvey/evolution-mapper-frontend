import React from 'react';
import './ProgressChecklist.css';

const ProgressChecklist = ({ show, progressData }) => {
  if (!show || !progressData || !progressData.steps) return null;

  const getStepDisplayName = (step) => {
    const stepNames = {
      request_started: 'Request Started',
      validating_input: 'Validating Input',
      database_lookup: 'Database Lookup',
      parallel_queries: 'ROTL and DateLife Queries',
      datelife_processing: 'Processing DateLife Age Data',
      network_conversion: 'Converting Tree to Network Format',
      creating_visualization: 'Creating Tree Visualization',
      request_completed: 'Request Completed'
    };
    return stepNames[step] || step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⟳';
      default:
        return '○';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in-progress';
      default:
        return 'pending';
    }
  };

  // Group steps by their names to handle duplicates (in_progress followed by completed)
  const stepGroups = {};
  if (Array.isArray(progressData.steps)) {
    progressData.steps.forEach(step => {
      if (step && step.step) {
        if (!stepGroups[step.step]) {
          stepGroups[step.step] = [];
        }
        stepGroups[step.step].push(step);
      }
    });
  }

  // For each step group, use the latest status and completion timestamp for sorting
  const consolidatedSteps = Object.keys(stepGroups).map(stepName => {
    const stepVersions = stepGroups[stepName];
    const latestStep = stepVersions[stepVersions.length - 1];
    
    // Find the completion timestamp (when status becomes "completed")
    const completedStep = stepVersions.find(step => step.status === 'completed');
    const completionTimestamp = completedStep ? completedStep.timestamp : latestStep.timestamp;
    
    return {
      step: stepName,
      status: latestStep.status,
      timestamp: latestStep.timestamp,
      completionTimestamp: completionTimestamp,
      ...latestStep
    };
  }).sort((a, b) => {
    // Sort by completion timestamp - completed steps come first in chronological order
    // In-progress steps come after all completed steps
    if (a.status === 'completed' && b.status === 'completed') {
      return new Date(a.completionTimestamp) - new Date(b.completionTimestamp);
    } else if (a.status === 'completed' && b.status !== 'completed') {
      return -1; // Completed steps come first
    } else if (a.status !== 'completed' && b.status === 'completed') {
      return 1; // Completed steps come first
    } else {
      // Both in progress, sort by latest timestamp
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
  });

  // If no steps are available yet, show a loading message
  if (consolidatedSteps.length === 0) {
    return (
      <div className="progress-checklist-inline">
        <div className="progress-checklist-content">
          <div className="progress-checklist-header">
            <h3>Initializing Tree Generation...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-checklist-inline">
      <div className="progress-checklist-content">
        <div className="progress-checklist-header">
          <h3>Tree Generation Progress</h3>
        </div>
        <div className="progress-checklist">
          {consolidatedSteps.map((step, index) => (
            <div 
              key={`${step.step}-${index}`} 
              className={`progress-step ${getStatusClass(step.status)}`}
            >
              <span className="progress-step-icon">
                {getStatusIcon(step.status)}
              </span>
              <span className="progress-step-name">
                {getStepDisplayName(step.step)}
              </span>
              {step.duration_seconds && (
                <span className="progress-step-duration">
                  ({step.duration_seconds.toFixed(1)}s)
                </span>
              )}
            </div>
          ))}
        </div>
        {progressData.status === 'completed' && (
          <div className="progress-summary">
            Total time: {progressData.steps.find(s => s.step === 'request_completed')?.total_duration_seconds?.toFixed(1) || 'N/A'}s
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressChecklist;