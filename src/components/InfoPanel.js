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
import { Close as CloseIcon } from '@mui/icons-material';

const InfoPanel = ({ open, onClose, nodeData }) => {
  if (!nodeData || !nodeData.info_panel) {
    return null;
  }

  const {
    image_url,
    image_attribution,
    wikipedia_text,
    wikipedia_url,
    geologic_age
  } = nodeData.info_panel;

  const hasContent = image_url || wikipedia_text || geologic_age;

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
        {image_url && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <img
              src={image_url}
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
            {image_attribution && (
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: 'text.secondary', fontSize: '0.75rem' }}
              >
                {image_attribution}
              </Typography>
            )}
          </Box>
        )}

        {/* Geologic Age */}
        {geologic_age && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Geologic Age
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {geologic_age}
            </Typography>
          </Box>
        )}

        {/* Wikipedia Content */}
        {wikipedia_text && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.6 }}>
              {wikipedia_text}
            </Typography>
            {wikipedia_url && (
              <Link
                href={wikipedia_url}
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
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Type: {nodeData.node_type} | Age: {nodeData.age_info}
          </Typography>
        </Box>
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