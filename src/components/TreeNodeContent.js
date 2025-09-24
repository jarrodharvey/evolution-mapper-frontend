import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { API_CONFIG } from '../api-config';

const phylopicCache = new Map();
const PHYLOPIC_ICON_REQUEST_SIZE = 64;

const TreeNodeContent = ({ nodeData, fallbackLabel, onInfoClick }) => {
  const safeData = nodeData || {};

  const {
    node_label = fallbackLabel || 'Unknown',
    color,
    node_shape,
    phylopic_uuid,
    phylopic_url,
    has_age,
    age_info,
    node_type
  } = safeData;

  const defaultColor = color || '#999999';

  const normalizedShape = typeof node_shape === 'string' ? node_shape.trim() : '';
  const normalizedPhylopicUuid = typeof phylopic_uuid === 'string' ? phylopic_uuid.trim() : '';

  const shouldRenderCircle = !normalizedShape || normalizedShape.toLowerCase() === 'circle';
  const inferredUuid = (!shouldRenderCircle && normalizedShape
    && !['phylopic', 'phylopic_neutral'].includes(normalizedShape.toLowerCase()))
    ? normalizedShape
    : null;
  const phylopicUuid = normalizedPhylopicUuid || inferredUuid;
  const cacheKey = useMemo(() => {
    if (!phylopicUuid) return null;
    return `${phylopicUuid}|${defaultColor}`;
  }, [phylopicUuid, defaultColor]);

  const [phylopicImage, setPhylopicImage] = useState(() => {
    if (!cacheKey) return null;
    return phylopicCache.get(cacheKey) || null;
  });

  useEffect(() => {
    if (!phylopicUuid || !cacheKey) {
      setPhylopicImage(null);
      return undefined;
    }

    if (phylopicCache.has(cacheKey)) {
      setPhylopicImage(phylopicCache.get(cacheKey));
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();
    const apiKey = process.env.REACT_APP_API_KEY || API_CONFIG.API_KEY;

    const fetchPhylopic = async () => {
      try {
        const params = new URLSearchParams({
          uuid: phylopicUuid,
          color: defaultColor,
          size: String(PHYLOPIC_ICON_REQUEST_SIZE)
        });

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/get-phylopic?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain',
            'X-API-Key': apiKey
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to load PhyloPic: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        let rawImage = null;

        if (contentType.includes('application/json')) {
          const json = await response.json();
          rawImage = json?.data_url?.[0]
            || json?.image_url?.[0]
            || json?.image?.[0]
            || json?.image
            || json?.data
            || json?.base64
            || json?.imageData
            || null;
        } else {
          rawImage = await response.text();
        }

        if (!rawImage) {
          phylopicCache.set(cacheKey, null);
          return;
        }

        const formattedImage = rawImage.startsWith('data:')
          ? rawImage
          : `data:image/png;base64,${rawImage}`;

        phylopicCache.set(cacheKey, formattedImage);

        if (isActive) {
          setPhylopicImage(formattedImage);
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        phylopicCache.set(cacheKey, null);
        if (isActive) {
          setPhylopicImage(null);
        }
      }
    };

    fetchPhylopic();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [cacheKey, defaultColor, phylopicUuid]);

  // Determine icon style and type
  const getNodeIcon = () => {
    const fallbackPhylopicUrl = !shouldRenderCircle && typeof phylopic_url === 'string' && phylopic_url.trim()
      ? phylopic_url.trim()
      : null;
    const hasSilhouette = Boolean(phylopicImage || fallbackPhylopicUrl);

    if (hasSilhouette) {
      return (
        <Box
          sx={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label={`${node_label} silhouette`}
        >
          <Box
            component="img"
            src={phylopicImage || fallbackPhylopicUrl}
            alt=""
            loading="lazy"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              objectFit: 'contain'
            }}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </Box>
      );
    }

    // Default to colored circle
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: defaultColor,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    );
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
        padding: '4px 12px',
        minHeight: 40
      }}
    >
      {/* Left side: Icon and Label */}
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        {/* Node Icon */}
        <Box sx={{ mr: 1, flexShrink: 0 }}>
          {getNodeIcon()}
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
