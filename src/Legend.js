import React, { useState, useEffect } from 'react';
import { apiRequest } from './api-config';

const AgeGradientBar = ({ ageItems }) => {
  // Sort age items by estimated age (oldest first)
  const sortedAgeItems = [...ageItems].sort((a, b) => {
    // Priority for known age types
    if (a.node_type?.includes('old')) return -1;
    if (b.node_type?.includes('old')) return 1;
    if (a.node_type?.includes('young')) return 1;
    if (b.node_type?.includes('young')) return -1;
    // Fall back to alphabetical for other ancestor types
    return a.node_type?.localeCompare(b.node_type || '') || 0;
  });

  // Create gradient with all colors
  const gradientColors = sortedAgeItems.map(item => item.color).join(', ');

  return (
    <div className="age-gradient-container">
      <div className="age-gradient-labels">
        <span className="age-label-older">Older</span>
        <span className="age-label-younger">Younger</span>
      </div>
      <div className="age-gradient-bar-full" style={{
        background: `linear-gradient(to right, ${gradientColors})`
      }} />
    </div>
  );
};

const Legend = ({ legendType, isCollapsed: externalIsCollapsed, onCollapseChange }) => {
  const [legendData, setLegendData] = useState([]);
  const [actualType, setActualType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;

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
    const newCollapsedState = !isCollapsed;
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    } else {
      setInternalIsCollapsed(newCollapsedState);
    }
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
          {Array.isArray(legendData) ? (() => {
            // Separate age-related and non-age-related items
            // Only ancestor_old and ancestor_young go in gradient, ancestor_no_age shows as regular legend item
            const ageItems = legendData.filter(item =>
              item.node_type?.includes('ancestor') &&
              (item.node_type?.includes('old') || item.node_type?.includes('young'))
            );
            const nonAgeItems = legendData.filter(item =>
              !item.node_type?.includes('ancestor') ||
              item.node_type?.includes('ancestor_no_age') ||
              (item.node_type === 'ancestor') ||
              (item.node_type === 'phylopic')
            );

            // Show gradient if we have any age items
            const hasAgeGradient = ageItems.length > 0;

            // For all_dates, dated, and mixed types, categorize by color and shape
            const shouldCategorize = actualType === 'dated' || actualType === 'mixed' || actualType === 'all_dates';

            if (shouldCategorize) {
              // Separate by color vs shape categories
              const shapeItems = nonAgeItems.filter(item =>
                item.label?.includes('Ancestor within Named Taxonomic Group') ||
                item.label?.includes('Ancestor not in a named taxonomic group')
              );
              const colorItems = nonAgeItems.filter(item =>
                !item.label?.includes('Ancestor within Named Taxonomic Group') &&
                !item.label?.includes('Ancestor not in a named taxonomic group')
              );

              return (
                <div className="legend-columns-container">
                  {/* Color column */}
                  {(colorItems.length > 0 || hasAgeGradient) && (
                    <div className="legend-column">
                      <div className="legend-section-header">Color</div>
                      {colorItems.map((item, index) => {
                        return (
                          <div
                            key={`color-${index}`}
                            className={`legend-item ${item.node_type ? `legend-item-${item.node_type}` : ''}`}
                            title={`${item.label}: ${item.description}`}
                          >
                            <div className="legend-icon">
                              <div
                                className={`legend-color ${item.shape === 'circle' ? 'circle' : ''}`}
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                            <div className="legend-content">
                              <div className="legend-label">
                                {item.label}
                                {item.color_name && (
                                  <span className="legend-color-name">({item.color_name})</span>
                                )}
                              </div>
                              <div className="legend-description">{item.description}</div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Render age gradient bar in Color section */}
                      {hasAgeGradient && (
                        <>
                          <div className="legend-item">
                            <div className="legend-icon"></div>
                            <div className="legend-content">
                              <div className="legend-label">Ancestor Age</div>
                              <div className="legend-description">Color gradient showing relative age of ancestral nodes</div>
                            </div>
                          </div>
                          <AgeGradientBar ageItems={ageItems} />
                        </>
                      )}
                    </div>
                  )}

                  {/* Shape column */}
                  {shapeItems.length > 0 && (
                    <div className="legend-column">
                      <div className="legend-section-header">Shape</div>
                      {shapeItems.map((item, index) => {
                        const isPhylopic = item.shape === 'phylopic' && item.phylopic_data;
                        const isUnnamedAncestor = item.label?.includes('Ancestor not in a named taxonomic group');
                        const isNamedAncestor = item.label?.includes('Ancestor within Named Taxonomic Group');

                        return (
                          <div
                            key={`shape-${index}`}
                            className={`legend-item ${item.node_type ? `legend-item-${item.node_type}` : ''}`}
                            title={`${item.label}: ${item.description}`}
                          >
                            <div className="legend-icon">
                              {(() => {
                                if (isPhylopic) {
                                  // Show neutral black silhouette for named ancestors
                                  return (
                                    <div className="legend-phylopic">
                                      <img
                                        src={item.phylopic_data.data_url[0]}
                                        alt={`${item.phylopic_data.taxonomic_group[0]} silhouette`}
                                        className="phylopic-silhouette neutral-silhouette"
                                      />
                                    </div>
                                  );
                                } else {
                                  // Show hollow circle for unnamed ancestors
                                  return (
                                    <div className="legend-color circle hollow-circle" />
                                  );
                                }
                              })()}
                            </div>
                            <div className="legend-content">
                              <div className="legend-label">
                                {item.label}
                                <span className="legend-color-name">
                                  ({isPhylopic ? 'Silhouette' : 'Circle'})
                                </span>
                              </div>
                              <div className="legend-description">{item.description}</div>
                              {isPhylopic && item.phylopic_data && (
                                <div className="legend-attribution">{item.phylopic_data.attribution[0]}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              // Original rendering for no_dates type
              return (
                <>
                  {/* Render non-age items first */}
                  {nonAgeItems.map((item, index) => {
                  const isPhylopic = item.shape === 'phylopic' && item.phylopic_data;

                  return (
                    <div
                      key={`non-age-${index}`}
                      className={`legend-item ${item.node_type ? `legend-item-${item.node_type}` : ''}`}
                      title={`${item.label}: ${item.description}`}
                    >
                      <div className="legend-icon">
                        {(() => {
                          // Handle special ancestor group styling based on legend type
                          const isUnnamedAncestor = item.label?.includes('Ancestor not in a named taxonomic group');
                          const isNamedAncestor = item.label?.includes('Ancestor within Named Taxonomic Group');

                          if (isPhylopic) {
                            // For phylopic silhouettes
                            if (isNamedAncestor && actualType !== 'no_dates') {
                              // Show neutral black silhouette for named ancestors (except no_dates)
                              return (
                                <div className="legend-phylopic">
                                  <img
                                    src={item.phylopic_data.data_url[0]}
                                    alt={`${item.phylopic_data.taxonomic_group[0]} silhouette`}
                                    className="phylopic-silhouette neutral-silhouette"
                                  />
                                </div>
                              );
                            } else {
                              // Normal phylopic with inherited color
                              return (
                                <div className="legend-phylopic">
                                  <img
                                    src={item.phylopic_data.data_url[0]}
                                    alt={`${item.phylopic_data.taxonomic_group[0]} silhouette`}
                                    className="phylopic-silhouette"
                                  />
                                </div>
                              );
                            }
                          } else {
                            // For regular circles
                            if (isUnnamedAncestor && actualType !== 'no_dates') {
                              // Show hollow circle for unnamed ancestors (except no_dates)
                              return (
                                <div className="legend-color circle hollow-circle" />
                              );
                            } else {
                              // Normal colored circle
                              return (
                                <div
                                  className={`legend-color ${item.shape === 'circle' ? 'circle' : ''}`}
                                  style={{ backgroundColor: item.color }}
                                />
                              );
                            }
                          }
                        })()}
                      </div>
                      <div className="legend-content">
                        <div className="legend-label">
                          {item.label}
                          {(() => {
                            // For specific ancestor group items, show shape instead of color
                            if (item.label?.includes('Ancestor not in a named taxonomic group') ||
                                item.label?.includes('Ancestor within Named Taxonomic Group')) {
                              return (
                                <span className="legend-color-name">
                                  ({isPhylopic ? 'Silhouette' : 'Circle'})
                                </span>
                              );
                            }
                            // For non-ancestor items, show color name if available
                            if (item.color_name) {
                              return (
                                <span className="legend-color-name">({item.color_name})</span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="legend-description">{item.description}</div>
                        {isPhylopic && item.phylopic_data && (
                          <div className="legend-attribution">{item.phylopic_data.attribution[0]}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Render age gradient bar if we have any age items */}
                {hasAgeGradient && (
                  <AgeGradientBar ageItems={ageItems} />
                )}
              </>
            );
            }
          })() : (
            <div className="legend-error">Invalid legend data format</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Legend;