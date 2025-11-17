import React, { useState } from 'react';
import {
  Button, Container, Typography, Box, Paper, Grid, Alert
} from '@mui/material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CssBaseline from '@mui/material/CssBaseline';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import ImageCompareSlider from './components/ImageCompareSlider';
import ToolsPanel from './components/ToolsPanel';
import ImageQueue from './components/ImageQueue';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

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

// UPDATED: This component now wraps the main view
const PersistentDropZone = styled('div')(({ theme, dragging }) => ({
  border: dragging ? `2px dashed ${theme.palette.primary.main}` : `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2), // Standard padding
  transition: 'border-color 0.3s, background-color 0.3s',
  backgroundColor: dragging ? theme.palette.action.hover : 'transparent',
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}));

function App() {
  const [imageQueue, setImageQueue] = useState([]);
  const [currentImageId, setCurrentImageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState({ type: 'color', value: 'transparent' });
  const [customBackgroundImage, setCustomBackgroundImage] = useState(null);
  const [customBackgroundImageName, setCustomBackgroundImageName] = useState('');
  const [shadowParams, setShadowParams] = useState({
    blur: 0,
    offsetX: 0,
    offsetY: 0,
    color: '#000000',
  });
  const [adjustmentParams, setAdjustmentParams] = useState({
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
  });

  const handleFiles = (files) => {
    const newImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: uuidv4(),
        file,
        originalImage: URL.createObjectURL(file),
        processedImage: null,
        status: 'uploaded', // 'uploaded', 'processing', 'processed', 'error'
      }));

    if (newImages.length > 0) {
      setImageQueue(prevQueue => [...prevQueue, ...newImages]);
      if (!currentImageId) {
        setCurrentImageId(newImages[0].id);
      }
    } else {
      setError("Please upload valid image files (e.g., PNG, JPG).");
    }
  };

  const handleFileChange = (event) => {
    handleFiles(event.target.files);
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleCustomBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCustomBackgroundImage(file);
      setCustomBackgroundImageName(file.name);
      setSelectedBackground({ type: 'image', value: file.name });
    } else {
      setError("Please upload a valid image file for the custom background.");
    }
  };

  const handleClear = () => {
    setImageQueue([]);
    setCurrentImageId(null);
    setError(null);
    setSelectedBackground({ type: 'color', value: 'transparent' });
    setCustomBackgroundImage(null);
    setCustomBackgroundImageName('');
    setShadowParams({ blur: 0, offsetX: 0, offsetY: 0, color: '#000000' });
    setAdjustmentParams({ brightness: 1.0, contrast: 1.0, saturation: 1.0 });
  };

  const handleBackgroundChange = (background) => {
    setSelectedBackground(background);
    if (background.type !== 'image') {
      setCustomBackgroundImage(null);
      setCustomBackgroundImageName('');
    }
  };

  const handleShadowChange = (param, value) => {
    setShadowParams((prevParams) => ({ ...prevParams, [param]: value }));
  };

  const handleAdjustmentChange = (param, value) => {
    setAdjustmentParams((prevParams) => ({ ...prevParams, [param]: value }));
  };

  const processQueue = async () => {
    setLoading(true);
    setError(null);

    for (const image of imageQueue) {
      if (image.status === 'uploaded') {
        setImageQueue(prev => prev.map(item => item.id === image.id ? { ...item, status: 'processing' } : item));

        const formData = new FormData();
        formData.append('file', image.file);
        formData.append('background_type', selectedBackground.type);
        formData.append('background_value', selectedBackground.value);

        if (selectedBackground.type === 'image' && customBackgroundImage) {
          formData.append('custom_background_image', customBackgroundImage);
        }

        formData.append('shadow_blur', shadowParams.blur);
        formData.append('shadow_offset_x', shadowParams.offsetX);
        formData.append('shadow_offset_y', shadowParams.offsetY);
        formData.append('shadow_color', shadowParams.color);

        formData.append('brightness', adjustmentParams.brightness);
        formData.append('contrast', adjustmentParams.contrast);
        formData.append('saturation', adjustmentParams.saturation);

        try {
          const response = await fetch('http://127.0.0.1:8000/api/remove-background', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error(`Server error: ${response.status}`);
          const blob = await response.blob();
          const processedImageUrl = URL.createObjectURL(blob);
          setImageQueue(prev => prev.map(item => item.id === image.id ? { ...item, status: 'processed', processedImage: processedImageUrl } : item));
        } catch (e) {
          console.error("Error removing background:", e);
          setImageQueue(prev => prev.map(item => item.id === image.id ? { ...item, status: 'error' } : item));
        }
      }
    }
    setLoading(false);
  };

  const handleDownload = () => {
    const currentImage = imageQueue.find(img => img.id === currentImageId);
    if (currentImage && currentImage.processedImage) {
      const link = document.createElement('a');
      link.href = currentImage.processedImage;
      const name = currentImage.file.name.split('.').slice(0, -1).join('.');
      link.download = `${name}_processed.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const processedImages = imageQueue.filter(item => item.status === 'processed');

    for (const image of processedImages) {
      const response = await fetch(image.processedImage);
      const blob = await response.blob();
      const name = image.file.name.split('.').slice(0, -1).join('.');
      zip.file(`${name}_processed.png`, blob);
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'processed_images.zip');
    });
  };

  const handleRemoveFromQueue = (id) => {
    setImageQueue(prev => prev.filter(item => item.id !== id));
    if (id === currentImageId) {
      const remainingImages = imageQueue.filter(item => item.id !== id);
      setCurrentImageId(remainingImages.length > 0 ? remainingImages[0].id : null);
    }
  };

  const handleImageSelect = (id) => {
    setCurrentImageId(id);
  };

  const currentImage = imageQueue.find(img => img.id === currentImageId);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
            Image Background Remover
          </Typography>

          <Grid container spacing={2}>
            {/* UPDATED: Main Content Area is now the PersistentDropZone */}
            <Grid item xs={12} md={9}>
              <PersistentDropZone
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragging={dragging}
              >
                {imageQueue.length === 0 ? (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {dragging ? "Drop images here" : "Drag & drop images or click upload"}
                    </Typography>
                    <Button component="label" variant="contained" sx={{ mt: 2 }}>
                      Upload Images
                      {/* This input is used by the button in ToolsPanel as well */}
                      <VisuallyHiddenInput id="file-upload-input" type="file" multiple onChange={handleFileChange} accept="image/*" />
                    </Button>
                  </>
                ) : (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    {currentImage && currentImage.processedImage ? (
                      <ImageCompareSlider originalImage={currentImage.originalImage} processedImage={currentImage.processedImage} />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                        {currentImage ? (
                          <img src={currentImage.originalImage} alt="Original" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                        ) : (
                          <Typography>No image selected</Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </PersistentDropZone>

              {imageQueue.length > 0 && (
                <ImageQueue
                  queue={imageQueue}
                  onRemoveFromQueue={handleRemoveFromQueue}
                  onImageSelect={handleImageSelect}
                  currentImageId={currentImageId}
                />
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <ToolsPanel
                onProcessQueue={processQueue}
                onDownload={handleDownload}
                onDownloadAll={handleDownloadAll}
                onClear={handleClear}
                loading={loading}
                processedImage={currentImage} // Pass the whole image object
                onUploadClick={() => document.getElementById('file-upload-input').click()} // Trigger the hidden input
                onBackgroundChange={handleBackgroundChange}
                selectedBackgroundType={selectedBackground}
                onCustomBackgroundUpload={handleCustomBackgroundUpload}
                customBackgroundImageName={customBackgroundImageName}
                onShadowChange={handleShadowChange}
                shadowParams={shadowParams}
                onAdjustmentChange={handleAdjustmentChange}
                adjustmentParams={adjustmentParams}
                queue={imageQueue}
              />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;