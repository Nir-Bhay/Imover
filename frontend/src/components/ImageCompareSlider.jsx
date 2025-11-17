import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/system';

const SliderContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  cursor: 'ew-resize',
  userSelect: 'none',
  lineHeight: 0, // Fixes potential small gap under the image
}));

const BaseImage = styled('img')({
  display: 'block',
  width: '100%',
  height: 'auto', // Let the aspect ratio be natural
  objectFit: 'contain',
});

const ProcessedImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%', // Match the container height
  width: '100%',
  objectFit: 'contain',
});

const Handle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 4,
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'ew-resize',
  zIndex: 10,
  transform: 'translateX(-50%)', // Center the handle
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    border: `2px solid ${theme.palette.background.paper}`,
  },
}));

function ImageCompareSlider({ originalImage, processedImage }) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    // Use e.nativeEvent for React synthetic events
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left;
    newX = Math.max(0, Math.min(newX, containerRect.width)); // Clamp

    setSliderPosition((newX / containerRect.width) * 100);
  };

  return (
    <SliderContainer
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <BaseImage src={originalImage} alt="Original" />
      <ProcessedImage
        src={processedImage}
        alt="Processed"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      />
      <Handle
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      />
    </SliderContainer>
  );
}

export default ImageCompareSlider;