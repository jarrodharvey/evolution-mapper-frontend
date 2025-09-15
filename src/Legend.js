import React, { useState, useEffect } from 'react';
import { apiRequest } from './api-config';

const Legend = ({ legendType }) => {
  const [legendData, setLegendData] = useState([]);
  const [actualType, setActualType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchLegend = async () => {
      try {
        setLoading(true);
        const url = legendType ? `/api/legend?type=${encodeURIComponent(legendType)}` : '/api/legend';
        const data = await apiRequest(url);
        if (data.success && data.legend) {
          // Store the actual type returned by the API
          const responseType = Array.isArray(data.type) ? data.type[0] : data.type;
          setActualType(responseType);

          // Convert object to array format with full metadata
          const legend = Object.entries(data.legend).map(([key, value]) => ({
            id: key,
            node_type: Array.isArray(value.node_type) ? value.node_type[0] : value.node_type,
            label: Array.isArray(value.label) ? value.label[0] : value.label,
            color: Array.isArray(value.color) ? value.color[0] : value.color,
            color_name: Array.isArray(value.color_name) ? value.color_name[0] : value.color_name,
            description: Array.isArray(value.description) ? value.description[0] : value.description,
            shape: Array.isArray(value.shape) ? value.shape[0] : value.shape,
            phylopic_data: value.phylopic_data || null
          }));

          setLegendData(legend);
        } else {
          throw new Error('Failed to fetch legend data');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLegend();
  }, [legendType]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getTypeDisplayInfo = (type) => {
    switch (type) {
      case 'no_dates':
        return { title: 'Legend', subtitle: 'Basic tree structure' };
      case 'mixed':
        return { title: 'Legend', subtitle: 'Age data + topology' };
      case 'dated':
        return { title: 'Legend', subtitle: 'Full age information' };
      case 'hybrid':
        return { title: 'Legend', subtitle: 'Combined data sources' };
      default:
        return { title: 'Legend', subtitle: null };
    }
  };

  if (loading) {
    const displayInfo = getTypeDisplayInfo(actualType);
    return (
      <div className={`tree-legend ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="legend-header" onClick={toggleCollapse}>
          <div className="legend-title-container">
            <span className="legend-title">{displayInfo.title}</span>
            {displayInfo.subtitle && !isCollapsed && (
              <span className="legend-subtitle">{displayInfo.subtitle}</span>
            )}
          </div>
          <button className="legend-toggle" aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}>
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
        {!isCollapsed && <div className="legend-loading">Loading...</div>}
      </div>
    );
  }

  if (error) {
    const displayInfo = getTypeDisplayInfo(actualType);
    return (
      <div className={`tree-legend ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="legend-header" onClick={toggleCollapse}>
          <div className="legend-title-container">
            <span className="legend-title">{displayInfo.title}</span>
            {displayInfo.subtitle && !isCollapsed && (
              <span className="legend-subtitle">{displayInfo.subtitle}</span>
            )}
          </div>
          <button className="legend-toggle" aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}>
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
        {!isCollapsed && <div className="legend-error">Failed to load legend</div>}
      </div>
    );
  }

  const displayInfo = getTypeDisplayInfo(actualType);
  const hasAgeData = actualType === 'mixed' || actualType === 'dated' || actualType === 'hybrid';

  return (
    <div className={`tree-legend ${isCollapsed ? 'collapsed' : ''} legend-type-${actualType || 'default'}`}>
      <div className="legend-header" onClick={toggleCollapse}>
        <div className="legend-title-container">
          <span className="legend-title">{displayInfo.title}</span>
          {displayInfo.subtitle && !isCollapsed && (
            <span className="legend-subtitle">{displayInfo.subtitle}</span>
          )}
        </div>
        <button className="legend-toggle" aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}>
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="legend-items">
          {Array.isArray(legendData) ? legendData.map((item, index) => {
            const isPhylopic = item.shape === 'phylopic' && item.phylopic_data;
            const isAgeRelated = item.node_type?.includes('ancestor');

            return (
              <div
                key={index}
                className={`legend-item ${item.node_type ? `legend-item-${item.node_type}` : ''} ${isAgeRelated ? 'age-related' : ''}`}
                title={`${item.label}: ${item.description}`}
              >
                <div className="legend-icon">
                  {isPhylopic ? (
                    <div className="legend-phylopic">
                      <img
                        src={item.phylopic_data.data_url[0]}
                        alt={`${item.phylopic_data.taxonomic_group[0]} silhouette`}
                        className="phylopic-silhouette"
                      />
                    </div>
                  ) : (
                    <div
                      className={`legend-color ${item.shape === 'circle' ? 'circle' : ''}`}
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </div>
                <div className="legend-content">
                  <div className="legend-label">
                    {item.label}
                    {item.color_name && (
                      <span className="legend-color-name">({item.color_name})</span>
                    )}
                  </div>
                  <div className="legend-description">{item.description}</div>
                  {isPhylopic && item.phylopic_data && (
                    <div className="legend-attribution">{item.phylopic_data.attribution[0]}</div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="legend-error">Invalid legend data format</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Legend;