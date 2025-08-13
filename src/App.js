import React, { useState, useRef, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { apiRequest, API_CONFIG } from './api-config';
import './App.css';

function App() {
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [treeHTML, setTreeHTML] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      const speciesNames = selectedSpecies.map(species => species.value);
      const apiKey = process.env.REACT_APP_API_KEY || API_CONFIG.API_KEY;
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/tree?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `species=${speciesNames.join(',')}`
      });

      if (!response.ok) {
        throw new Error(`Tree generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setTreeHTML(data.html);
      } else {
        throw new Error(data.error || 'Tree generation failed');
      }
    } catch (error) {
      console.error('Error generating tree:', error);
      setError(`Error generating tree: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pickRandomSpecies = async () => {
    setLoading(true);
    setError(null);

    try {
      const count = Math.floor(Math.random() * 5) + 3; // Random between 3-7 species
      const data = await apiRequest(`/api/random-tree?count=${count}`);
      
      if (data.success && data.selected_species) {
        const randomOptions = data.selected_species.map(speciesName => ({
          value: speciesName,
          label: speciesName,
          data: { common: speciesName }
        }));
        setSelectedSpecies(randomOptions);
        setTreeHTML(data.html);
      } else {
        throw new Error('Failed to get random species');
      }
    } catch (error) {
      console.error('Error getting random species:', error);
      setError(`Error getting random species: ${error.message}`);
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Evolution Mapper</h1>
        <p>Select 3-20 species to see how they evolved!</p>
      </header>
      
      <main className="App-main">
        <div className="species-selector">
          <h2>Species Selection</h2>
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
        </div>

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

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {treeHTML && (
          <div className="tree-display">
            <h2>Evolutionary Tree</h2>
            <iframe
              ref={iframeRef}
              width="100%"
              height="600px"
              frameBorder="0"
              title="Phylogenetic Tree"
              className="tree-iframe"
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;