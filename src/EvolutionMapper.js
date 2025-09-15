import React, { useState, useRef, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select';
import { apiRequest } from './api-config';
import Legend from './Legend';
import ProgressOverlay from './ProgressOverlay';
import ProgressChecklist from './ProgressChecklist';
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
  const [unavailableSpecies, setUnavailableSpecies] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [showProgressChecklist, setShowProgressChecklist] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const [legendType, setLegendType] = useState(null);
  const iframeRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const loadSpecies = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    
    try {
      const data = await apiRequest(`/api/species?search=${encodeURIComponent(inputValue)}&limit=10`);
      
      return data.species.map(species => ({
        value: species.common,
        label: `${species.common} (${species.scientific})${species.has_datelife ? ' 🕒' : ''}`,
        data: species
      }));
    } catch (error) {
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

    // Collapse the current tree before generating a new one
    if (treeHTML && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const commonAncestorNode = doc.getElementById('common_ancestor_node');
        if (commonAncestorNode) {
          // Create and dispatch a proper click event for SVG elements
          const clickEvent = new MouseEvent('click', {
            view: iframe.contentWindow,
            bubbles: true,
            cancelable: true
          });
          commonAncestorNode.dispatchEvent(clickEvent);
        }
      } catch (error) {
        // Silently handle tree collapse errors
      }
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
      
      
      await generateUnifiedTree(commonNames, scientificNames);
    } catch (error) {
      setError(`Error generating tree: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setCountdown(null);
    }
  };

  const fetchProgressToken = async () => {
    try {
      const response = await apiRequest('/api/get_progress_token');
      if (response.success && response.token) {
        return response.token;
      }
      throw new Error('Failed to get progress token');
    } catch (error) {
      throw error;
    }
  };

  const startProgressMonitoring = (token) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    const pollProgress = async () => {
      try {
        const response = await apiRequest(`/api/progress?progress_token=${token}`);
        setProgressData(response);
        
        // Stop polling if request is completed
        if (response.status === 'completed' || response.status === 'error') {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } catch (error) {
        // Continue polling on error - it might be a temporary issue
      }
    };
    
    // Start polling immediately and then every 2 seconds
    pollProgress();
    progressIntervalRef.current = setInterval(pollProgress, 2000);
  };

  const stopProgressMonitoring = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const generateUnifiedTree = async (commonNames, scientificNames) => {
    try {
      // Get progress token first
      setLoadingPhase('Preparing tree generation...');
      const token = await fetchProgressToken();
      setShowProgressChecklist(true);
      
      // Start monitoring progress
      startProgressMonitoring(token);
      
      // First, try to get the full tree with dates from the unified endpoint
      setLoadingPhase('Generating phylogenetic tree with ancestral data...');
      
      const data = await apiRequest('/api/full-tree-dated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `common_names=${commonNames.join(',')}&scientific_names=${scientificNames.join(',')}&progress_token=${token}&expansion_speed=3000`
      });
      
      
      if (data.success === true || data.success[0] === true) {
        // Success with the unified endpoint - store tree data but don't render yet
        const treeHtmlData = Array.isArray(data.html) ? data.html[0] : data.html;

        // Store legend type for legend API calls
        const legendTypeData = Array.isArray(data.legend_type) ? data.legend_type[0] : data.legend_type;
        setLegendType(legendTypeData);
        
        // Track and highlight species that lack ancestral data
        const missingCommonNames = data.missing_common_names || [];
        setDroppedSpecies(Array.isArray(missingCommonNames) ? missingCommonNames : []); // Set dropped species for highlighting
        
        // Track species that are unavailable/dropped due to unavailability
        const droppedCommonNames = data.dropped_common_names || [];
        setUnavailableSpecies(Array.isArray(droppedCommonNames) ? droppedCommonNames : []);
        
        if (missingCommonNames.length === 0) {
          // Reset dropped species when all have data
          setDroppedSpecies([]);
        }
        
        // Handle unavailable species error message
        if (droppedCommonNames.length > 0) {
          const unavailableCount = droppedCommonNames.length;
          const displayNames = droppedCommonNames.slice(0, 3).join(', ');
          const moreText = droppedCommonNames.length > 3 ? ` and ${droppedCommonNames.length - 3} more` : '';
          
          // Show error message for unavailable species
          setError(`${unavailableCount} species unavailable and excluded from tree: ${displayNames}${moreText}`);
          setTimeout(() => setError(null), 5000); // Clear after 5 seconds
        } else {
          // Reset unavailable species when all are available
          setUnavailableSpecies([]);
        }
        
        // Delay tree rendering until after progress widget disappears (3 seconds + small buffer)
        setTimeout(() => {
          setTreeHTML(treeHtmlData);
          setShowFloatingControls(true);
          
          // Show drag hint for trees with more than 7 species
          if (selectedSpecies.length > 7) {
            setShowDragHint(true);
          }
        }, 3200); // 200ms buffer after progress widget disappears
        
        return;
      } else {
        throw new Error(Array.isArray(data.error) ? data.error[0] : data.error || 'Unified tree generation failed');
      }
    } catch (error) {
      stopProgressMonitoring();
      throw new Error(`Tree generation failed: ${error.message}`);
    } finally {
      // Stop progress monitoring after a short delay to show completion
      setTimeout(() => {
        setShowProgressChecklist(false);
        setProgressData(null);
        stopProgressMonitoring();
      }, 3000);
    }
  };

  const pickRandomSpecies = async () => {
    // Collapse the current tree before generating a new one
    if (treeHTML && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const commonAncestorNode = doc.getElementById('common_ancestor_node');
        if (commonAncestorNode) {
          // Create and dispatch a proper click event for SVG elements
          const clickEvent = new MouseEvent('click', {
            view: iframe.contentWindow,
            bubbles: true,
            cancelable: true
          });
          commonAncestorNode.dispatchEvent(clickEvent);
        }
      } catch (error) {
        // Silently handle tree collapse errors
      }
    }

    setLoading(true);
    setLoadingPhase('Selecting random species...');
    setError(null);
    setTreeError(null);
    setCountdown(null);

    try {
      const count = Math.floor(Math.random() * 5) + 3; // Random between 3-7 species
      const data = await apiRequest(`/api/random-species?count=${count}`);
      
      if ((data.success === true || data.success[0] === true) && data.selected_species) {
        // Handle new API structure with common_names and scientific_names arrays
        const commonNames = data.selected_species.common_names || data.selected_species;
        const scientificNames = data.selected_species.scientific_names || [];
        const hasDatelife = data.selected_species.has_datelife || [];
        
        const randomOptions = commonNames.map((common, index) => ({
          value: common,
          label: `${common}${scientificNames[index] ? ` (${scientificNames[index]})` : ''}${hasDatelife[index] ? ' 🕒' : ''}`,
          data: { 
            common: common,
            scientific: scientificNames[index] || common,
            has_datelife: hasDatelife[index]
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
      setError(`Error getting random species: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setCountdown(null);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopProgressMonitoring();
    };
  }, []);

  // Add global console commands and keyboard shortcuts for copying and adding species
  useEffect(() => {
    window.cs = () => {
      if (selectedSpecies.length === 0) {
        console.log('No species selected');
        return;
      }
      
      const formattedSpecies = selectedSpecies.map(species => {
        const common = species.data.common;
        const scientific = species.data.scientific;
        return `${common} (${scientific})`;
      }).join(', ');
      
      console.log('About to copy:', formattedSpecies);
      console.log('Clipboard API available:', !!navigator.clipboard);
      console.log('Document has focus:', document.hasFocus());
      
      if (navigator.clipboard && document.hasFocus()) {
        navigator.clipboard.writeText(formattedSpecies).then(() => {
          console.log('Clipboard write successful');
        }).catch(err => {
          console.error('Clipboard write failed:', err);
          console.log('Text to copy manually:', formattedSpecies);
        });
      } else {
        // Fallback: create a temporary textarea and use execCommand (older method)
        const textarea = document.createElement('textarea');
        textarea.value = formattedSpecies;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            console.log('Copied via execCommand:', formattedSpecies);
          } else {
            console.log('execCommand copy failed, text to copy manually:', formattedSpecies);
          }
        } catch (err) {
          console.log('execCommand not supported, text to copy manually:', formattedSpecies);
        }
        document.body.removeChild(textarea);
      }
    };

    window.as = async (speciesString) => {
      if (!speciesString) {
        return;
      }
      
      // Split by comma and extract scientific names from parentheses
      const speciesEntries = speciesString.split(',').map(s => s.trim());
      const scientificNames = [];
      
      speciesEntries.forEach(entry => {
        const match = entry.match(/\(([^)]+)\)/);
        if (match) {
          scientificNames.push(match[1].trim());
        }
      });
      
      if (scientificNames.length === 0) {
        return;
      }
      
      // Search for each species and add them to the selection
      const newSpecies = [];
      const notFound = [];
      
      for (const scientificName of scientificNames) {
        try {
          const searchResults = await loadSpecies(scientificName);
          
          // Find exact match by scientific name
          const exactMatch = searchResults.find(result => 
            result.data.scientific && result.data.scientific.toLowerCase() === scientificName.toLowerCase()
          );
          
          if (exactMatch) {
            newSpecies.push(exactMatch);
          } else if (searchResults.length > 0) {
            // If no exact match, take the first result
            newSpecies.push(searchResults[0]);
          } else {
            notFound.push(scientificName);
          }
        } catch (error) {
          notFound.push(scientificName);
        }
      }
      
      if (newSpecies.length > 0) {
        setSelectedSpecies(prevSelected => {
          // Remove duplicates based on scientific name
          const existingScientificNames = prevSelected.map(s => s.data.scientific?.toLowerCase());
          const uniqueNewSpecies = newSpecies.filter(s => 
            !existingScientificNames.includes(s.data.scientific?.toLowerCase())
          );
          
          return [...prevSelected, ...uniqueNewSpecies];
        });
      }
    };
    
    // Cleanup function to remove global commands
    return () => {
      delete window.cs;
      delete window.as;
    };
  }, [selectedSpecies]);

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

  // Auto-hide drag hint after 8 seconds
  useEffect(() => {
    if (showDragHint) {
      const timer = setTimeout(() => {
        setShowDragHint(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [showDragHint]);

  const isValidSelection = selectedSpecies.length >= 3 && selectedSpecies.length <= 20;

  // Custom component for multi-value labels with dynamic clock formatting
  const MultiValueLabel = (props) => {
    const { data } = props;
    const isDropped = Array.isArray(droppedSpecies) ? droppedSpecies.includes(data.data.common) : false;
    const hasDatelife = data.data.has_datelife;
    
    // Parse the original label to extract text and clock
    const originalLabel = data.label;
    const hasClockInLabel = originalLabel.includes('🕒');
    
    // Only show red X if the species originally had has_datelife: true AND is dropped
    const shouldShowRedX = isDropped && hasDatelife;
    
    if (hasClockInLabel) {
      // Split the label to separate text from clock
      const labelWithoutClock = originalLabel.replace(' 🕒', '');
      
      return (
        <components.MultiValueLabel {...props}>
          {labelWithoutClock}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            {' 🕒'}
            {shouldShowRedX && (
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#e74c3c',
                fontWeight: 'bold',
                fontSize: '14px',
                textShadow: '0 0 2px white',
                pointerEvents: 'none'
              }}>
                ✗
              </span>
            )}
          </span>
        </components.MultiValueLabel>
      );
    }
    
    // For species without clocks in label, check if they should have had one
    if (shouldShowRedX) {
      return (
        <components.MultiValueLabel {...props}>
          {originalLabel}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            {' 🕒'}
            <span style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#e74c3c',
              fontWeight: 'bold',
              fontSize: '14px',
              textShadow: '0 0 2px white',
              pointerEvents: 'none'
            }}>
              ✗
            </span>
          </span>
        </components.MultiValueLabel>
      );
    }
    
    // If no clock and not dropped, just return the default component
    return <components.MultiValueLabel {...props} />;
  };

  // Custom styles for react-select to prevent clock symbol truncation and highlight unavailable species
  const getCustomStyles = () => ({
    multiValue: (provided, state) => {
      const isUnavailable = Array.isArray(unavailableSpecies) ? unavailableSpecies.includes(state.data.data.common) : false;
      return {
        ...provided,
        maxWidth: 'none', // Remove max-width constraints
        minWidth: 'fit-content', // Ensure it fits content including clock
        backgroundColor: isUnavailable ? '#fee' : provided.backgroundColor,
        border: isUnavailable ? '1px solid #e74c3c' : provided.border,
        margin: '1px 2px', // Reduce spacing between tags
        fontSize: '0.8rem', // Smaller font for tags
      };
    },
    multiValueLabel: (provided, state) => {
      const isUnavailable = Array.isArray(unavailableSpecies) ? unavailableSpecies.includes(state.data.data.common) : false;
      return {
        ...provided,
        whiteSpace: 'nowrap', // Prevent text wrapping
        overflow: 'visible', // Show content that would be hidden
        textOverflow: 'clip', // Don't add ellipsis
        maxWidth: 'none', // Remove max-width constraints
        minWidth: 'fit-content', // Ensure it fits the full content
        color: isUnavailable ? '#e74c3c' : provided.color,
        fontWeight: isUnavailable ? '600' : provided.fontWeight,
        padding: '2px 4px', // Reduce padding inside tags
        fontSize: '0.8rem', // Smaller font for tags
      };
    },
    multiValueRemove: (provided, state) => {
      const isUnavailable = Array.isArray(unavailableSpecies) ? unavailableSpecies.includes(state.data.data.common) : false;
      return {
        ...provided,
        color: isUnavailable ? '#e74c3c' : provided.color,
        padding: '0 2px', // Reduce padding on remove button
        ':hover': {
          backgroundColor: isUnavailable ? '#e74c3c' : provided[':hover'].backgroundColor,
          color: isUnavailable ? 'white' : provided[':hover'].color,
        },
      };
    },
    control: (provided, state) => ({
      ...provided,
      minHeight: showFloatingControls ? '44px' : 'auto', // Taller height in floating mode to use available space
      padding: showFloatingControls ? '4px' : provided.padding, // Increase padding in floating mode
    }),
    valueContainer: (provided) => ({
      ...provided,
      flexWrap: 'wrap', // Allow multi-values to wrap to new lines
      overflow: 'visible', // Don't hide overflowing content
      padding: showFloatingControls ? '2px 6px' : provided.padding, // Reduce padding in floating mode
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: showFloatingControls ? '32px' : provided.height, // Match control height in floating mode
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
    }),
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
          <p className="data-explanation">🕒 shows species in our age database - but age data for specific combinations may vary</p>
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
                    setDroppedSpecies([]); // Clear dropped species since combination changed
                    setUnavailableSpecies([]); // Clear unavailable species since combination changed
                  }}
                  placeholder="Search species..."
                  noOptionsMessage={({ inputValue }) => 
                    inputValue.length < 2 
                      ? 'Type 2+ characters'
                      : `No species found`
                  }
                  className="floating-species-select"
                  styles={getCustomStyles()}
                  components={{ MultiValueLabel }}
                />
              </div>
              
              <div className="floating-right-column">
                <div className="floating-species-info">
                  <span>Selected: {selectedSpecies.length} species</span>
                  {selectedSpecies.length < 3 && (
                    <span className="floating-warning">Need 3+ species</span>
                  )}
                  {selectedSpecies.length > 20 && (
                    <span className="floating-warning">Max 20 species</span>
                  )}
                  <span className="floating-clock-explanation">🕒 = species in age database</span>
                  <span className="floating-crossed-clock-explanation">
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                      🕒
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#e74c3c',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textShadow: '0 0 2px white'
                      }}>
                        ✗
                      </span>
                    </span>
                    {' = age data unavailable for this combination'}
                  </span>
                </div>
                
                <div className="floating-action-buttons">
                  <button 
                    onClick={generateTree}
                    disabled={!isValidSelection || loading}
                    className="floating-generate-button"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                  
                  <button 
                    onClick={pickRandomSpecies}
                    disabled={loading}
                    className="floating-random-button"
                  >
                    {loading ? 'Loading...' : 'Random'}
                  </button>
                  
                  <button 
                    className="floating-exit-button"
                    onClick={toggleFloatingControls}
                    aria-label="Exit tree view"
                  >
                    ← Exit Tree View
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <main 
        className={`App-main ${showFloatingControls ? 'floating-mode' : ''}`}
        style={showFloatingControls ? {
          paddingTop: isToolbarCollapsed ? '45px' : '60px'
        } : {}}
      >
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
                setDroppedSpecies([]); // Clear dropped species since combination changed
                setUnavailableSpecies([]); // Clear unavailable species since combination changed
              }}
              placeholder="Search for species (e.g., whale, human, dog)..."
              noOptionsMessage={({ inputValue }) => 
                inputValue.length < 2 
                  ? 'Type 2+ characters to search'
                  : `No species found matching "${inputValue}"`
              }
              className="species-select"
              styles={getCustomStyles()}
              components={{ MultiValueLabel }}
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

            
            {showProgressChecklist && progressData ? (
              <ProgressChecklist 
                show={showProgressChecklist}
                progressData={progressData}
              />
            ) : loading && !treeHTML ? (
              <div style={{ position: 'relative', minHeight: '200px' }}>
                <ProgressOverlay 
                  show={loading && !treeHTML}
                  message={loadingPhase}
                  showProgressBar={loadingPhase.includes('Generating')}
                  countdown={countdown}
                />
              </div>
            ) : null}
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
              {showDragHint && (
                <div className="drag-pan-hint">
                  <span className="drag-icon">👋</span>
                  <span className="hint-text">Drag to pan around the tree</span>
                </div>
              )}
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
              {showProgressChecklist && progressData && showFloatingControls ? (
                <div style={{ marginTop: '80px' }}>
                  <ProgressChecklist 
                    show={showProgressChecklist}
                    progressData={progressData}
                  />
                </div>
              ) : showProgressChecklist && progressData ? (
                <ProgressChecklist 
                  show={showProgressChecklist}
                  progressData={progressData}
                />
              ) : (
                <ProgressOverlay 
                  show={loading}
                  message={loadingPhase}
                  showProgressBar={loadingPhase.includes('Generating')}
                  countdown={countdown}
                />
              )}
              <Legend legendType={legendType} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EvolutionMapper;