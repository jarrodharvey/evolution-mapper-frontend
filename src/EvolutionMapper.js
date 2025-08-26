import React, { useState, useRef, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { apiRequest } from './api-config';
import Legend from './Legend';
import ProgressOverlay from './ProgressOverlay';
import ErrorDisplay from './ErrorDisplay';

function EvolutionMapper({ onTreeViewChange }) {
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [treeHTML, setTreeHTML] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState(null);
  const [treeError, setTreeError] = useState(null); // For iframe area errors
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [droppedSpecies, setDroppedSpecies] = useState([]);
  const iframeRef = useRef(null);

  const loadSpecies = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    
    try {
      const data = await apiRequest(`/api/species?search=${encodeURIComponent(inputValue)}&limit=10`);
      
      return data.species.map(species => ({
        value: species.common,
        label: `${species.common} (${species.scientific})`,
        data: species
      }));
    } catch (error) {
      console.error('Error loading species:', error);
      setError(`Error searching species: ${error.message}`);
      return [];
    }
  };

  const generateTree = async () => {
    if (selectedSpecies.length < 3) {
      setError('Please select at least 3 species to generate a tree.');
      return;
    }
    if (selectedSpecies.length > 20) {
      setError('Please select no more than 20 species.');
      return;
    }

    setLoading(true);
    setLoadingPhase('Preparing tree generation...');
    setError(null);
    setTreeError(null);
    setCountdown(null);

    try {
      const commonNames = selectedSpecies.map(species => species.data.common);
      const scientificNames = selectedSpecies.map(species => 
        species.data.scientific || species.data.common // Fallback to common name if scientific not available
      );
      
      console.log('Selected species structure:', selectedSpecies);
      console.log('Extracted common names:', commonNames);
      console.log('Extracted scientific names:', scientificNames);
      
      await generateUnifiedTree(commonNames, scientificNames);
    } catch (error) {
      console.error('Error generating tree:', error);
      setError(`Error generating tree: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setCountdown(null);
    }
  };

  const generateUnifiedTree = async (commonNames, scientificNames) => {
    try {
      // First, try to get the full tree with dates from the unified endpoint
      setLoadingPhase('Generating phylogenetic tree with ancestral data...');
      console.log('Making unified tree request with species:', commonNames, scientificNames);
      
      const data = await apiRequest('/api/full-tree-dated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `common_names=${commonNames.join(',')}&scientific_names=${scientificNames.join(',')}`
      });
      
      console.log('Full tree dated API response:', data);
      
      if (data.success === true || data.success[0] === true) {
        // Success with the unified endpoint
        setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
        setShowFloatingControls(true);
        
        // Track and highlight species that lack ancestral data
        const missingCommonNames = data.missing_common_names || [];
        setDroppedSpecies(missingCommonNames); // Set dropped species for highlighting
        
        if (missingCommonNames.length > 0) {
          const missingCount = missingCommonNames.length;
          const displayNames = missingCommonNames.slice(0, 3).join(', ');
          const moreText = missingCommonNames.length > 3 ? ` and ${missingCommonNames.length - 3} more` : '';
          
          console.warn(`${missingCount} species lack ancestral age data: ${displayNames}${moreText}`);
          // Show brief, non-blocking notification
          setError(`Note: ${missingCount} species lack ancestral age data: ${displayNames}${moreText}`);
          setTimeout(() => setError(null), 5000); // Clear after 5 seconds
        } else {
          // Reset dropped species when all have data
          setDroppedSpecies([]);
        }
        return;
      } else {
        throw new Error(Array.isArray(data.error) ? data.error[0] : data.error || 'Unified tree generation failed');
      }
    } catch (error) {
      throw new Error(`Tree generation failed: ${error.message}`);
    }
  };

  const pickRandomSpecies = async () => {
    setLoading(true);
    setLoadingPhase('Selecting random species...');
    setError(null);
    setTreeError(null);
    setCountdown(null);

    try {
      const count = Math.floor(Math.random() * 5) + 3; // Random between 3-7 species
      const data = await apiRequest(`/api/random-tree?count=${count}`);
      
      if ((data.success === true || data.success[0] === true) && data.selected_species) {
        // Handle new API structure with common_names and scientific_names arrays
        const commonNames = data.selected_species.common_names || data.selected_species;
        const scientificNames = data.selected_species.scientific_names || [];
        
        const randomOptions = commonNames.map((common, index) => ({
          value: common,
          label: scientificNames[index] ? `${common} (${scientificNames[index]})` : common,
          data: { 
            common: common,
            scientific: scientificNames[index] || common
          }
        }));
        setSelectedSpecies(randomOptions);
        
        // Use unified tree generation approach
        setLoadingPhase('Generating random tree...');
        await generateUnifiedTree(commonNames, scientificNames);
      } else {
        throw new Error('Failed to get random species');
      }
    } catch (error) {
      console.error('Error in random species function:', error);
      setError(`Error getting random species: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setCountdown(null);
    }
  };

  useEffect(() => {
    if (onTreeViewChange) {
      onTreeViewChange(showFloatingControls);
    }
  }, [showFloatingControls, onTreeViewChange]);

  useEffect(() => {
    if (treeHTML && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      doc.open();
      doc.write(treeHTML);
      doc.close();
      
      const style = doc.createElement('style');
      style.textContent = `
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: Arial, sans-serif;
        }
        .tree-container { 
          max-width: 100%; 
        }
      `;
      doc.head.appendChild(style);
    }
  }, [treeHTML]);

  const isValidSelection = selectedSpecies.length >= 3 && selectedSpecies.length <= 20;

  // Custom styles for react-select to highlight dropped species
  const getCustomStyles = () => ({
    multiValue: (provided, state) => {
      const isDropped = droppedSpecies.includes(state.data.data.common);
      return {
        ...provided,
        backgroundColor: isDropped ? '#fee' : provided.backgroundColor,
        border: isDropped ? '1px solid #e74c3c' : provided.border,
      };
    },
    multiValueLabel: (provided, state) => {
      const isDropped = droppedSpecies.includes(state.data.data.common);
      return {
        ...provided,
        color: isDropped ? '#e74c3c' : provided.color,
        fontWeight: isDropped ? '600' : provided.fontWeight,
      };
    },
    multiValueRemove: (provided, state) => {
      const isDropped = droppedSpecies.includes(state.data.data.common);
      return {
        ...provided,
        color: isDropped ? '#e74c3c' : provided.color,
        ':hover': {
          backgroundColor: isDropped ? '#e74c3c' : provided[':hover'].backgroundColor,
          color: isDropped ? 'white' : provided[':hover'].color,
        },
      };
    },
  });

  const getTreeHeight = () => {
    if (!treeHTML) return '600px';
    if (showFloatingControls) {
      return '100%'; // Use flexbox instead of fixed height
    }
    return '600px'; // Default height when expanded
  };

  const toggleFloatingControls = () => {
    setShowFloatingControls(!showFloatingControls);
  };

  return (
    <div className={`evolution-mapper-container ${showFloatingControls ? 'floating-mode' : ''}`}>
      {!showFloatingControls && (
        <header className="App-header">
          <h1>Evolution Mapper</h1>
          <p>Select 3-20 species to see how they evolved!</p>
        </header>
      )}
      
      {showFloatingControls && (
        <div className={`floating-toolbar ${isToolbarCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="floating-collapse-button"
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            aria-label={isToolbarCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
          >
            {isToolbarCollapsed ? '▼' : '▲'}
          </button>
          
          {!isToolbarCollapsed && (
            <>
              <button 
                className="floating-exit-button"
                onClick={toggleFloatingControls}
                aria-label="Exit tree view"
              >
                ← Exit Tree View
              </button>
              
              <div className="floating-species-picker">
                <AsyncSelect
                  isMulti
                  cacheOptions
                  defaultOptions={false}
                  loadOptions={loadSpecies}
                  value={selectedSpecies}
                  onChange={(species) => {
                    setSelectedSpecies(species);
                    setTreeError(null); // Clear tree error when species change
                  }}
                  placeholder="Search species..."
                  noOptionsMessage={({ inputValue }) => 
                    inputValue.length < 2 
                      ? 'Type 2+ characters'
                      : `No species found`
                  }
                  className="floating-species-select"
                  styles={getCustomStyles()}
                />
              </div>
              
              <div className="floating-species-info">
                <span>Selected: {selectedSpecies.length} species</span>
                {selectedSpecies.length < 3 && (
                  <span className="floating-warning">Need 3+ species</span>
                )}
                {selectedSpecies.length > 20 && (
                  <span className="floating-warning">Max 20 species</span>
                )}
              </div>
              
              
              <div className="floating-action-buttons">
                <button 
                  onClick={pickRandomSpecies}
                  disabled={loading}
                  className="floating-random-button"
                >
                  {loading ? 'Loading...' : 'Random'}
                </button>
                
                <button 
                  onClick={generateTree}
                  disabled={!isValidSelection || loading}
                  className="floating-generate-button"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <main className={`App-main ${showFloatingControls ? 'floating-mode' : ''}`}>
        {!showFloatingControls && (
          <div className="species-selector">
            <div className="species-selector-header">
              <h2>Species Selection</h2>
            </div>
            
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions={false}
              loadOptions={loadSpecies}
              value={selectedSpecies}
              onChange={(species) => {
                setSelectedSpecies(species);
                setTreeError(null); // Clear tree error when species change
              }}
              placeholder="Search for species (e.g., whale, human, dog)..."
              noOptionsMessage={({ inputValue }) => 
                inputValue.length < 2 
                  ? 'Type 2+ characters to search'
                  : `No species found matching "${inputValue}"`
              }
              className="species-select"
              styles={getCustomStyles()}
            />
            
            <div className="selection-info">
              <p>Selected: {selectedSpecies.length} species</p>
              {selectedSpecies.length < 3 && (
                <p className="warning">Please select at least 3 species</p>
              )}
              {selectedSpecies.length > 20 && (
                <p className="warning">Please select no more than 20 species</p>
              )}
            </div>
            
          </div>
        )}

        {!showFloatingControls && (
          <div className="action-buttons">
            <button 
              onClick={pickRandomSpecies}
              disabled={loading}
              className="random-button"
            >
              {loading ? 'Loading...' : 'Pick species for me'}
            </button>
            
            <button 
              onClick={generateTree}
              disabled={!isValidSelection || loading}
              className="generate-button"
            >
              {loading ? 'Generating...' : 'Show me how they evolved!'}
            </button>
          </div>
        )}

        {!showFloatingControls && (
          <>
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)} className="dismiss-error-button" title="Dismiss">
                  ×
                </button>
              </div>
            )}
            <div style={{ position: 'relative', minHeight: '200px' }}>
              <ProgressOverlay 
                show={loading && !treeHTML}
                message={loadingPhase}
                showProgressBar={loadingPhase.includes('Generating')}
                countdown={countdown}
              />
            </div>
          </>
        )}

        {showFloatingControls && (
          <div className="tree-display floating-mode">
            {error && (
              <div className="floating-error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)} className="dismiss-floating-error-button" title="Dismiss">
                  ×
                </button>
              </div>
            )}
            <div className="tree-container" style={{ position: 'relative' }}>
              {treeHTML ? (
                <iframe
                  ref={iframeRef}
                  width="100%"
                  height={getTreeHeight()}
                  frameBorder="0"
                  title="Phylogenetic Tree"
                  className="tree-iframe"
                />
              ) : treeError ? (
                <ErrorDisplay 
                  error={treeError} 
                  onRetry={() => {
                    setTreeError(null);
                    generateTree();
                  }}
                  onDismiss={() => setTreeError(null)}
                  showRetryButton={true}
                />
              ) : null}
              <ProgressOverlay 
                show={loading}
                message={loadingPhase}
                showProgressBar={loadingPhase.includes('Generating')}
                countdown={countdown}
              />
              <Legend />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EvolutionMapper;