import React, { useState, useEffect } from 'react';
import { apiRequest } from './api-config';
import './AttributionsPage.css';

function AttributionsPage() {
  const [attributions, setAttributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttributions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest('/api/attributions');

        if (data.success && data.success[0] === true) {
          const allAttributions = [];

          // Process PhyloPic attributions
          if (data.phylopic_attributions) {
            const phylopicCount = Object.keys(data.phylopic_attributions).length;

            allAttributions.push({
              title: `PhyloPic Silhouettes (${phylopicCount} images)`,
              author: 'Various Contributors',
              source: 'PhyloPic',
              source_url: 'https://www.phylopic.org/',
              license: 'Public Domain',
              description: `${phylopicCount} silhouette images used in phylogenetic trees.`
            });
          }

          // Process Wikipedia/Wikimedia attributions
          if (data.wikipedia_attributions) {
            Object.values(data.wikipedia_attributions).forEach(item => {
              const licenseInfo = item.detailed_license_info || {};
              const artist = licenseInfo.artist && licenseInfo.artist[0] ? licenseInfo.artist[0] : 'Unknown';
              const license = licenseInfo.license && licenseInfo.license[0] ? licenseInfo.license[0] : 'Creative Commons License';
              const credit = licenseInfo.credit && licenseInfo.credit[0] ? licenseInfo.credit[0] : '';

              allAttributions.push({
                title: `${item.entity_label[0]} (${item.taxonomic_name[0]})`,
                author: artist,
                source: 'Wikimedia Commons',
                source_url: item.image_url[0],
                license: license,
                description: `${item.attribution[0]}${credit && credit !== 'Unknown' ? ` - ${credit}` : ''}`
              });
            });
          }

          // Process Unsplash attributions
          if (data.unsplash_attributions) {
            Object.values(data.unsplash_attributions).forEach(item => {
              allAttributions.push({
                title: `${item.taxonomic_group[0]} Image`,
                author: item.photographer_name[0],
                source: 'Unsplash',
                source_url: item.unsplash_url[0],
                license: 'Unsplash License',
                description: `Photo for ${item.taxonomic_group[0]} - ${item.alt_description[0]}`
              });
            });
          }

          setAttributions(allAttributions);
        } else {
          throw new Error('Failed to fetch attributions');
        }
      } catch (err) {
        setError(err.message);
        setAttributions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributions();
  }, []);

  if (loading) {
    return (
      <div className="attributions-page">
        <div className="container">
          <h1>Image Attributions</h1>
          <div className="loading">Loading attributions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attributions-page">
        <div className="container">
          <h1>Image Attributions</h1>
          <div className="error">Error loading attributions: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="attributions-page">
      <div className="container">
        <h1>Image Attributions</h1>
        <p className="attribution-description">
          This page contains attributions for all images used in Evolution Mapper.
        </p>

        {attributions.length === 0 ? (
          <div className="no-attributions">No attributions found.</div>
        ) : (
          <div className="attributions-list">
            {attributions.map((attribution, index) => (
              <div key={index} className="attribution-item">
                {attribution.title && (
                  <h3 className="attribution-title">{attribution.title}</h3>
                )}
                {attribution.author && (
                  <p className="attribution-author">Author: {attribution.author}</p>
                )}
                {attribution.source && (
                  <p className="attribution-source">
                    Source: {attribution.source_url ? (
                      <a href={attribution.source_url} target="_blank" rel="noopener noreferrer">
                        {attribution.source}
                      </a>
                    ) : (
                      attribution.source
                    )}
                  </p>
                )}
                {attribution.license && (
                  <p className="attribution-license">License: {attribution.license}</p>
                )}
                {attribution.description && (
                  <p className="attribution-description">{attribution.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttributionsPage;