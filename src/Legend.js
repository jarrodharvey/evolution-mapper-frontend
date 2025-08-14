import React, { useState, useEffect } from 'react';
import { apiRequest } from './api-config';

const Legend = () => {
  const [legendData, setLegendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchLegend = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/api/legend');
        if (data.success && data.legend) {
          setLegendData(data.legend);
        } else {
          throw new Error('Failed to fetch legend data');
        }
      } catch (error) {
        console.error('Error fetching legend:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLegend();
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (loading) {
    return (
      <div className={`tree-legend ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="legend-header" onClick={toggleCollapse}>
          <span>Legend</span>
          <button className="legend-toggle" aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}>
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
        {!isCollapsed && <div className="legend-loading">Loading...</div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`tree-legend ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="legend-header" onClick={toggleCollapse}>
          <span>Legend</span>
          <button className="legend-toggle" aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}>
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
        {!isCollapsed && <div className="legend-error">Failed to load legend</div>}
      </div>
    );
  }

  return (
    <div className={`tree-legend ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="legend-header" onClick={toggleCollapse}>
        <span>Legend</span>
        <button className="legend-toggle" aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}>
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="legend-items">
          {legendData.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color[0] }}
              />
              <div className="legend-content">
                <div className="legend-label">{item.label[0]}</div>
                <div className="legend-description">{item.description[0]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Legend;