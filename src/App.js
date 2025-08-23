import React, { useState, useRef, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { apiRequest } from './api-config';
import Legend from './Legend';
import ProgressOverlay from './ProgressOverlay';
import ErrorDisplay from './ErrorDisplay';
import './App.css';

function App() {
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [treeHTML, setTreeHTML] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState(null);
  const [treeError, setTreeError] = useState(null); // For iframe area errors
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [showAncestorAges, setShowAncestorAges] = useState(false);
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
      
      if (showAncestorAges) {
        await generateDatedTree(commonNames, scientificNames);
      } else {
        setLoadingPhase('Generating phylogenetic tree...');
        await generateRegularTree(commonNames, scientificNames);
      }
    } catch (error) {
      console.error('Error generating tree:', error);
      // Check if this is an ancestral age error that should be shown in iframe
      if (showAncestorAges && (error.message.includes('ancestral age data') || error.message.includes('chronogram'))) {
        setTreeError(error.message);
        setTreeHTML(null); // Clear any existing tree
        setShowFloatingControls(true); // Show floating controls so user can adjust settings
      } else {
        setError(`Error generating tree: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setCountdown(null);
    }
  };

  const generateRegularTree = async (commonNames, scientificNames) => {
    const data = await apiRequest('/api/tree', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `common_names=${commonNames.join(',')}&scientific_names=${scientificNames.join(',')}`
    });
    if (data.success === true || data.success[0] === true) {
      setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
      setShowFloatingControls(true);
      setDroppedSpecies([]); // Reset dropped species for regular tree
    } else {
      const errorMessage = Array.isArray(data.error) ? data.error[0] : data.error;
      throw new Error(errorMessage || 'Tree generation failed');
    }
  };

  const generateDatedTree = async (commonNames, scientificNames) => {
    // Single API call with allow_partial_response=true to get both missing species info and tree HTML
    try {
      setLoadingPhase('Checking ancestral data availability...');
      console.log('Making dated tree request with species:', commonNames, scientificNames);
      const data = await apiRequest('/api/dated-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `common_names=${commonNames.join(',')}&scientific_names=${scientificNames.join(',')}&allow_partial_response=true`
      });
      
      console.log('Dated tree API response:', data);
      
      if (data.success && (data.success === true || data.success[0] === true)) {
        const coverage = Array.isArray(data.coverage) ? data.coverage[0] : data.coverage;
        const missingCommonNames = data.missing_common_names || [];
        const missingScientificNames = data.missing_scientific_names || [];
        
        if (coverage === 'partial' && missingCommonNames.length > 0) {
          // Some species are missing ancestral data - show user feedback with same timing as before
          const missingCount = missingCommonNames.length;
          
          // Create display names (prefer scientific names where available)
          const missingDisplayNames = missingCommonNames.map((common, index) => {
            const scientific = missingScientificNames[index];
            return scientific && scientific !== common ? `${common} (${scientific})` : common;
          });
          
          const displayNames = missingDisplayNames.slice(0, 3).join(', ');
          const moreText = missingDisplayNames.length > 3 ? ` and ${missingDisplayNames.length - 3} more` : '';
          
          setError(`${missingCount} species lack ancestral data and will be excluded: ${displayNames}${moreText}. Generating tree with remaining species...`);
          
          // Set dropped species for highlighting
          setDroppedSpecies(missingCommonNames);
          
          // Show countdown and simulate the previous timing experience
          let timeLeft = 2;
          setCountdown(timeLeft);
          setLoadingPhase(`Continuing with available species...`);
          
          const countdownInterval = setInterval(() => {
            timeLeft--;
            setCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(countdownInterval);
            }
          }, 1000);
          
          setTimeout(() => {
            setCountdown(null);
            setLoadingPhase('Generating tree with remaining species...');
            
            // Display the tree HTML that was already generated in the single API response
            setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
            setShowFloatingControls(true);
            // Keep droppedSpecies state for highlighting - don't reset here
            // Clear error message after shorter delay since it won't show in tree view
            setTimeout(() => setError(null), 3000); // 3 seconds
          }, 2000); // 2 second delay to show the warning
        } else {
          // Complete coverage - all species have ancestral data
          setLoadingPhase('Generating tree with ancestral ages...');
          setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
          setShowFloatingControls(true);
          setDroppedSpecies([]); // Reset dropped species since all species have data
        }
      } else if (data.coverage === 'none' || (Array.isArray(data.coverage) ? data.coverage[0] : data.coverage) === 'none' || (data.error && (Array.isArray(data.error) ? data.error[0] : data.error).includes('No chronogram data available'))) {
        // No species have ancestral data available
        throw new Error('None of the selected species have ancestral age data available. Please try different species or uncheck "Show ancestor ages" to generate a regular tree.');
      } else {
        const errorMessage = Array.isArray(data.error) ? data.error[0] : data.error;
        throw new Error(errorMessage || 'Dated tree generation failed');
      }
    } catch (error) {
      throw error;
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
        
        // Respect the "Show ancestor ages" checkbox
        if (showAncestorAges) {
          // For dated tree, we need to call the dated tree API
          // Handle dated tree errors separately from random species errors
          try {
            setLoadingPhase('Generating random tree with ancestral ages...');
            await generateDatedTree(commonNames, scientificNames);
          } catch (datedTreeError) {
            // Re-throw with clearer context - this will be caught by the outer try-catch
            // but the error handling in generateTree() will show the proper message
            throw datedTreeError;
          }
        } else {
          // For regular tree, we can use the HTML that was already generated
          setLoadingPhase('Loading random tree...');
          setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
          setShowFloatingControls(true);
        }
      } else {
        throw new Error('Failed to get random species');
      }
    } catch (error) {
      console.error('Error in random species function:', error);
      // Provide more specific error message based on context
      if (showAncestorAges && (error.message.includes('chronogram') || error.message.includes('ancestral age data'))) {
        setTreeError(error.message);
        setTreeHTML(null); // Clear any existing tree
        setShowFloatingControls(true); // Show floating controls
      } else if (showAncestorAges) {
        setTreeError(`Error generating dated tree: ${error.message}`);
        setTreeHTML(null);
        setShowFloatingControls(true);
      } else {
        setError(`Error getting random species: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setCountdown(null);
    }
  };

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
    <div className={`App ${showFloatingControls ? 'floating-mode' : ''}`}>
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
              
              <div className="floating-options">
                <label className="floating-checkbox-control">
                  <input
                    type="checkbox"
                    checked={showAncestorAges}
                    onChange={(e) => {
                      setShowAncestorAges(e.target.checked);
                      if (!e.target.checked) {
                        setDroppedSpecies([]);
                      }
                      setTreeError(null); // Clear tree error when settings change
                    }}
                  />
                  Show ancestor ages
                </label>
                {showAncestorAges && (
                  <span className="floating-warning">Species without ancestral data will be dropped</span>
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
            
            <div className="tree-options">
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={showAncestorAges}
                  onChange={(e) => {
                    setShowAncestorAges(e.target.checked);
                    if (!e.target.checked) {
                      setDroppedSpecies([]);
                    }
                    setTreeError(null); // Clear tree error when settings change
                  }}
                />
                Show ancestor ages
              </label>
              {showAncestorAges && (
                <p className="warning">
                  Warning: Species ancestral data is incomplete. Any species without ancestral data will be dropped.
                </p>
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
            {error && !error.includes('species lack ancestral data and will be excluded') && (
              <div className="floating-error-message">
                <p>{error}</p>
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

export default App;