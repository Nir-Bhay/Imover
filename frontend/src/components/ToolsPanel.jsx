import React from 'react';
import {
  Box, Button, CircularProgress, Tooltip, IconButton, Typography, Slider,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ImageIcon from '@mui/icons-material/Image';
import { styled } from '@mui/system';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ColorButton = styled(IconButton)(({ theme, color, selected }) => ({
  backgroundColor: color === 'transparent' ? 'rgba(255,255,255,0.2)' : color,
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: `2px solid ${color === 'transparent' ? 'white' : theme.palette.divider}`,
  outline: selected ? `2px solid ${theme.palette.primary.main}` : 'none',
  outlineOffset: '2px',
  backgroundImage: color === 'transparent' ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)' : 'none',
  backgroundSize: color === 'transparent' ? '10px 10px' : 'none',
  '&:hover': {
    border: `2px solid ${theme.palette.primary.main}`,
    backgroundColor: color === 'transparent' ? 'rgba(255,255,255,0.3)' : color,
  },
}));

const GradientButton = styled(Button)(({ theme, gradient, selected }) => ({
  background: gradient,
  width: '100%',
  height: 40,
  borderRadius: theme.shape.borderRadius,
  border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.divider}`,
  '&:hover': {
    border: `2px solid ${theme.palette.primary.main}`,
  },
}));


function ToolsPanel({
  onProcessQueue,
  onDownload,
  onDownloadAll,
  onClear,
  loading,
  processedImage, // This is the full currentImage object
  onUploadClick,
  onBackgroundChange,
  selectedBackgroundType,
  onCustomBackgroundUpload,
  customBackgroundImageName,
  onShadowChange,
  shadowParams,
  onAdjustmentChange,
  adjustmentParams,
  queue,
}) {
  const solidColors = ['transparent', '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
  const gradients = [
    { name: 'Blue to Purple', value: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)' },
    { name: 'Green to Yellow', value: 'linear-gradient(45deg, #4CAF50 30%, #FFEB3B 90%)' },
    { name: 'Orange to Red', value: 'linear-gradient(45deg, #FF9800 30%, #F44336 90%)' },
  ];

  const hasProcessableImages = queue.some(item => item.status === 'uploaded');
  const hasProcessedImages = queue.some(item => item.status === 'processed');
  const isSelectedProcessed = processedImage?.status === 'processed';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: { xs: 0, md: 2 }, borderLeft: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.12)' } }}>
      <Tooltip title="Upload More Images">
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={onUploadClick}
          disabled={loading}
        >
          Upload More
        </Button>
      </Tooltip>

      <Tooltip title="Process all uploaded images in the queue">
        <Button
          variant="contained"
          color="primary"
          onClick={onProcessQueue}
          disabled={!hasProcessableImages || loading}
          startIcon={<AutoFixHighIcon />}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Process Queue'}
        </Button>
      </Tooltip>

      <Box display="flex" gap={1}>
        <Tooltip title="Download Selected Image">
          <Button
            variant="contained"
            color="secondary"
            onClick={onDownload}
            disabled={!isSelectedProcessed || loading}
            startIcon={<DownloadIcon />}
            sx={{ flex: 1 }}
          >
            Download
          </Button>
        </Tooltip>
        <Tooltip title="Download all processed images as a ZIP">
          <Button
            variant="contained"
            color="secondary"
            onClick={onDownloadAll}
            disabled={!hasProcessedImages || loading}
            startIcon={<DownloadIcon />}
            sx={{ flex: 1 }}
          >
            All
          </Button>
        </Tooltip>
      </Box>

      <Tooltip title="Clear All">
        <Button
          variant="outlined"
          color="warning"
          onClick={onClear}
          disabled={loading}
          startIcon={<DeleteIcon />}
        >
          Clear
        </Button>
      </Tooltip>

      {/* --- Editing Tools Accordion --- */}
      <Box sx={{ mt: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Background</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" gutterBottom>Solid Color</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {solidColors.map((color) => (
                <Tooltip key={color} title={color === 'transparent' ? 'Transparent' : color}>
                  <ColorButton
                    color={color}
                    onClick={() => onBackgroundChange({ type: 'color', value: color })}
                    selected={selectedBackgroundType.type === 'color' && selectedBackgroundType.value === color}
                  />
                </Tooltip>
              ))}
            </Box>

            <Typography variant="caption" gutterBottom>Gradient</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {gradients.map((gradient) => (
                <Tooltip key={gradient.name} title={gradient.name}>
                  <GradientButton
                    gradient={gradient.value}
                    onClick={() => onBackgroundChange({ type: 'gradient', value: gradient.value })}
                    selected={selectedBackgroundType.type === 'gradient' && selectedBackgroundType.value === gradient.value}
                  />
                </Tooltip>
              ))}
            </Box>

            <Typography variant="caption" gutterBottom>Custom Image</Typography>
            <Button component="label" variant="outlined" startIcon={<ImageIcon />} fullWidth>
              {customBackgroundImageName || "Upload Image"}
              <VisuallyHiddenInput type="file" onChange={onCustomBackgroundUpload} accept="image/*" />
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Drop Shadow</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: '100%', px: 1 }}>
              <Typography variant="caption" gutterBottom>Blur: {shadowParams.blur}</Typography>
              <Slider
                value={shadowParams.blur}
                onChange={(e, newValue) => onShadowChange('blur', newValue)}
                aria-labelledby="shadow-blur-slider"
                min={0}
                max={50}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" gutterBottom>Offset X: {shadowParams.offsetX}</Typography>
              <Slider
                value={shadowParams.offsetX}
                onChange={(e, newValue) => onShadowChange('offsetX', newValue)}
                aria-labelledby="shadow-offset-x-slider"
                min={-50}
                max={50}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" gutterBottom>Offset Y: {shadowParams.offsetY}</Typography>
              <Slider
                value={shadowParams.offsetY}
                onChange={(e, newValue) => onShadowChange('offsetY', newValue)}
                aria-labelledby="shadow-offset-y-slider"
                min={-50}
                max={50}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" gutterBottom>Color</Typography>
              <input
                type="color"
                value={shadowParams.color}
                onChange={(e) => onShadowChange('color', e.target.value)}
                style={{ width: '100%', height: 30, border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Image Adjustments</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: '100%', px: 1 }}>
              <Typography variant="caption" gutterBottom>Brightness: {adjustmentParams.brightness.toFixed(1)}</Typography>
              <Slider
                value={adjustmentParams.brightness}
                onChange={(e, newValue) => onAdjustmentChange('brightness', newValue)}
                aria-labelledby="brightness-slider"
                min={0.1}
                max={3.0}
                step={0.1}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" gutterBottom>Contrast: {adjustmentParams.contrast.toFixed(1)}</Typography>
              <Slider
                value={adjustmentParams.contrast}
                onChange={(e, newValue) => onAdjustmentChange('contrast', newValue)}
                aria-labelledby="contrast-slider"
                min={0.1}
                max={3.0}
                step={0.1}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" gutterBottom>Saturation: {adjustmentParams.saturation.toFixed(1)}</Typography>
              <Slider
                value={adjustmentParams.saturation}
                onChange={(e, newValue) => onAdjustmentChange('saturation', newValue)}
                aria-labelledby="saturation-slider"
                min={0.0}
                max={3.0}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}

export default ToolsPanel;