import React, { useState, useRef, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { apiRequest } from './api-config';
import Legend from './Legend';
import './App.css';

function App() {
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [treeHTML, setTreeHTML] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [showAncestorAges, setShowAncestorAges] = useState(false);
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
    setError(null);

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
        await generateRegularTree(commonNames, scientificNames);
      }
    } catch (error) {
      console.error('Error generating tree:', error);
      setError(`Error generating tree: ${error.message}`);
    } finally {
      setLoading(false);
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
    } else {
      const errorMessage = Array.isArray(data.error) ? data.error[0] : data.error;
      throw new Error(errorMessage || 'Tree generation failed');
    }
  };

  const generateDatedTree = async (commonNames, scientificNames) => {
    // First attempt with allow_partial_response=false to check for missing species
    try {
      console.log('Making dated tree request with species:', commonNames, scientificNames);
      const data = await apiRequest('/api/dated-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `common_names=${commonNames.join(',')}&scientific_names=${scientificNames.join(',')}&allow_partial_response=false`
      });
      
      console.log('Dated tree API response:', data);
      
      if (data.success && (data.success === true || data.success[0] === true)) {
        // Success - all species have ancestral data
        setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
        setShowFloatingControls(true);
      } else if (data.coverage && (Array.isArray(data.coverage) ? data.coverage[0] : data.coverage) === 'partial') {
        // Some species are missing ancestral data - notify user and retry with partial response
        const missingCommonNames = data.missing_common_names || [];
        const missingScientificNames = data.missing_scientific_names || [];
        const missingCount = missingCommonNames.length;
        
        // Create display names (prefer scientific names where available)
        const missingDisplayNames = missingCommonNames.map((common, index) => {
          const scientific = missingScientificNames[index];
          return scientific && scientific !== common ? `${common} (${scientific})` : common;
        });
        
        const displayNames = missingDisplayNames.slice(0, 3).join(', ');
        const moreText = missingDisplayNames.length > 3 ? ` and ${missingDisplayNames.length - 3} more` : '';
        
        setError(`${missingCount} species lack ancestral data and will be excluded: ${displayNames}${moreText}. Generating tree with remaining species...`);
        
        // Retry with allow_partial_response=true
        setTimeout(async () => {
          try {
            const retryData = await apiRequest('/api/dated-tree', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `common_names=${commonNames.join(',')}&scientific_names=${scientificNames.join(',')}&allow_partial_response=true`
            });
            
            if (retryData.success && (retryData.success === true || retryData.success[0] === true)) {
              setTreeHTML(Array.isArray(retryData.html) ? retryData.html[0] : retryData.html);
              setShowFloatingControls(true);
              // Keep the error message visible longer in tree view so users can see which species were dropped
              setTimeout(() => setError(null), 10000); // 10 seconds instead of 5
            } else {
              const errorMessage = Array.isArray(retryData.error) ? retryData.error[0] : retryData.error;
              throw new Error(errorMessage || 'Dated tree generation failed');
            }
          } catch (retryError) {
            throw new Error(`Failed to generate partial dated tree: ${retryError.message}`);
          }
        }, 2000); // 2 second delay to show the warning
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
    setError(null);

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
            await generateDatedTree(commonNames, scientificNames);
          } catch (datedTreeError) {
            // Re-throw with clearer context - this will be caught by the outer try-catch
            // but the error handling in generateTree() will show the proper message
            throw datedTreeError;
          }
        } else {
          // For regular tree, we can use the HTML that was already generated
          setTreeHTML(Array.isArray(data.html) ? data.html[0] : data.html);
          setShowFloatingControls(true);
        }
      } else {
        throw new Error('Failed to get random species');
      }
    } catch (error) {
      console.error('Error in random species function:', error);
      // Provide more specific error message based on context
      if (showAncestorAges && error.message.includes('chronogram')) {
        setError(`Ancestral age data: ${error.message}`);
      } else if (showAncestorAges) {
        setError(`Error generating dated tree: ${error.message}`);
      } else {
        setError(`Error getting random species: ${error.message}`);
      }
    } finally {
      setLoading(false);
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
                  onChange={setSelectedSpecies}
                  placeholder="Search species..."
                  noOptionsMessage={({ inputValue }) => 
                    inputValue.length < 2 
                      ? 'Type 2+ characters'
                      : `No species found`
                  }
                  className="floating-species-select"
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
                    onChange={(e) => setShowAncestorAges(e.target.checked)}
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
              onChange={setSelectedSpecies}
              placeholder="Search for species (e.g., whale, human, dog)..."
              noOptionsMessage={({ inputValue }) => 
                inputValue.length < 2 
                  ? 'Type 2+ characters to search'
                  : `No species found matching "${inputValue}"`
              }
              className="species-select"
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
                  onChange={(e) => setShowAncestorAges(e.target.checked)}
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

        {!showFloatingControls && error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {treeHTML && showFloatingControls && (
          <div className="tree-display floating-mode">
            {error && (
              <div className="floating-error-message">
                <p>{error}</p>
              </div>
            )}
            <div className="tree-container">
              <iframe
                ref={iframeRef}
                width="100%"
                height={getTreeHeight()}
                frameBorder="0"
                title="Phylogenetic Tree"
                className="tree-iframe"
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