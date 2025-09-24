import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  IconButton
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Close as CloseIcon } from '@mui/icons-material';

const InfoPanel = ({ open, onClose, nodeData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!nodeData || !nodeData.info_panel) {
    return null;
  }

  const hasValue = (value) => {
    if (Array.isArray(value)) {
      return value.some((item) => hasValue(item));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return false;
      }
      const lower = trimmed.toLowerCase();
      return lower !== 'null' && lower !== 'undefined';
    }

    return value !== null && value !== undefined && value !== '';
  };

  const {
    image_url,
    image_attribution,
    wikipedia_text,
    wikipedia_url,
    geologic_age
  } = nodeData.info_panel;

  const hasContent = [image_url, wikipedia_text, geologic_age].some((value) => hasValue(value));

  if (!hasContent) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          margin: { xs: 1, sm: 2 },
          maxHeight: { xs: '90vh', sm: '80vh' }
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {nodeData.node_label}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Image Display */}
        {hasValue(image_url) && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <img
              src={typeof image_url === 'string' ? image_url.trim() : image_url}
              alt={nodeData.node_label}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {hasValue(image_attribution) && (
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: 'text.secondary', fontSize: '0.75rem' }}
              >
                {typeof image_attribution === 'string' ? image_attribution.trim() : image_attribution}
              </Typography>
            )}
          </Box>
        )}

        {/* Geologic Age */}
        {hasValue(geologic_age) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Geologic Age
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {typeof geologic_age === 'string' ? geologic_age.trim() : geologic_age}
            </Typography>
          </Box>
        )}

        {/* Wikipedia Content */}
        {hasValue(wikipedia_text) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.6 }}>
              {typeof wikipedia_text === 'string' ? wikipedia_text.trim() : wikipedia_text}
            </Typography>
            {hasValue(wikipedia_url) && (
              <Link
                href={typeof wikipedia_url === 'string' ? wikipedia_url.trim() : wikipedia_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main', textDecoration: 'none' }}
              >
                Read more on Wikipedia →
              </Link>
            )}
          </Box>
        )}

        {/* Node Type and Age Info */}
        {!isMobile && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Type: {nodeData.node_type} | Age: {nodeData.age_info}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoPanel;
