import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const TreeNodeContent = ({ nodeData, fallbackLabel, onInfoClick }) => {
  const safeData = nodeData || {};

  const {
    node_label = fallbackLabel || 'Unknown',
    color,
    phylopic_url,
    has_age,
    age_info,
    node_type
  } = safeData;

  // Determine icon style and type
  const getNodeIcon = () => {
    // If we have a PhyloPic URL, use it as an image
    if (phylopic_url && phylopic_url !== null) {
      return (
        <img
          src={phylopic_url}
          alt={node_label}
          style={{
            width: 24,
            height: 24,
            filter: color ? `hue-rotate(${getHueRotation(color)}deg)` : 'none',
            borderRadius: '50%'
          }}
          onError={(e) => {
            // Fallback to circle if image fails
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      );
    }

    // Default to colored circle
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: color || '#999999',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    );
  };

  // Convert hex color to hue rotation for PhyloPic images
  const getHueRotation = (hexColor) => {
    // Simple approximation - in practice you might want a more sophisticated color conversion
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Convert to HSL and extract hue
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0; break;
      }
      h /= 6;
    }

    return h * 360;
  };

  // Format label with age information
  const getDisplayLabel = () => {
    if (has_age && age_info && age_info !== 'age unavailable' && age_info !== 'present') {
      return `${node_label} (${age_info})`;
    }
    return node_label;
  };

  // Determine if info button should be shown
  const infoPanelData = safeData.info_panel;
  const hasInfoContent = Boolean(
    infoPanelData && (
      infoPanelData.image_url ||
      infoPanelData.wikipedia_text ||
      infoPanelData.geologic_age
    )
  );
  const showInfoButton = hasInfoContent && typeof onInfoClick === 'function';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '4px 8px',
        minHeight: 40
      }}
    >
      {/* Left side: Icon and Label */}
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        {/* Node Icon */}
        <Box sx={{ mr: 1, flexShrink: 0 }}>
          {getNodeIcon()}
          {/* Fallback circle (hidden by default) */}
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: color || '#999999',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: phylopic_url ? 'none' : 'block'
            }}
          />
        </Box>

        {/* Node Label */}
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            fontWeight: node_type === 'species' ? 600 : 400,
            color: has_age ? '#1976d2' : 'text.primary',
            fontSize: node_type === 'species' ? '0.9rem' : '0.85rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getDisplayLabel()}
        </Typography>
      </Box>

      {/* Right side: Info Button */}
      {showInfoButton && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            if (safeData && onInfoClick) {
              onInfoClick(safeData);
            }
          }}
          aria-label={`View info for ${node_label}`}
          title={`View info for ${node_label}`}
          sx={{
            ml: 1,
            flexShrink: 0,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'white'
            }
          }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default TreeNodeContent;
