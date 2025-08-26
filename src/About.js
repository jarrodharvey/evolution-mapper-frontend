import React, { useState, useEffect } from 'react';
import { apiRequest } from './api-config';
import './About.css';

function About() {
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCitations = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/api/citations');
        
        if (data.success && data.success[0] === true) {
          setCitations(data.citations || []);
        } else {
          throw new Error('Failed to fetch citations');
        }
      } catch (error) {
        console.error('Error fetching citations:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCitations();
  }, []);

  const formatCitation = (citationText) => {
    return citationText
      .split('\n\n')
      .filter(citation => citation.trim())
      .map((citation, index) => (
        <p key={index} className="citation-text">
          {citation.trim()}
        </p>
      ));
  };

  return (
    <div className="about-container">
      <div className="about-content">
        <header className="about-header">
          <h1>About Evolution Mapper</h1>
          <p className="about-description">
            Evolution Mapper is an interactive tool for visualizing phylogenetic relationships 
            between species, helping you explore the evolutionary tree of life.
          </p>
        </header>

        <section className="developer-section">
          <h2>Developer</h2>
          <div className="developer-info">
            <h3>Jarrod Harvey</h3>
            <p>Evolution Mapper was developed by Jarrod Harvey as a tool for exploring evolutionary relationships through interactive phylogenetic trees.</p>
          </div>
        </section>

        <section className="repository-section">
          <h2>Source Code</h2>
          <div className="repositories">
            <div className="repo-link">
              <h3>Frontend Repository</h3>
              <a 
                href="https://github.com/jarrodharvey/evolution-mapper-frontend" 
                target="_blank" 
                rel="noopener noreferrer"
                className="repo-url"
              >
                https://github.com/jarrodharvey/evolution-mapper-frontend
              </a>
              <p>React-based frontend for the Evolution Mapper application</p>
            </div>
            
            <div className="repo-link">
              <h3>Backend Repository</h3>
              <a 
                href="https://github.com/jarrodharvey/evolution-mapper-backend" 
                target="_blank" 
                rel="noopener noreferrer"
                className="repo-url"
              >
                https://github.com/jarrodharvey/evolution-mapper-backend
              </a>
              <p>R-based backend API providing phylogenetic data and tree generation</p>
            </div>
          </div>
        </section>

        <section className="citations-section">
          <h2>Citations & Acknowledgments</h2>
          <p className="citations-intro">
            Evolution Mapper leverages several open-source R packages and scientific databases. 
            Please cite the following packages and datasets when using this tool in academic work:
          </p>
          
          {loading && (
            <div className="citations-loading">
              <p>Loading citations...</p>
            </div>
          )}
          
          {error && (
            <div className="citations-error">
              <p>Error loading citations: {error}</p>
            </div>
          )}
          
          {!loading && !error && citations.length > 0 && (
            <div className="citations-list">
              {citations.map((item, index) => (
                <div key={index} className="citation-item">
                  <div className="citation-packages">
                    <strong>Packages:</strong> {item.packages.join(', ')}
                  </div>
                  <div className="citation-details">
                    {item.citation.map((citation, citIndex) => (
                      <div key={citIndex} className="citation-entry">
                        {formatCitation(citation)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default About;