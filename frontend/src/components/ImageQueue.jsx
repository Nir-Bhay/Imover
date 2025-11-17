import React from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, IconButton, ButtonBase } from '@mui/material';
import { styled } from '@mui/system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay'; // <-- NEW IMPORT

const Thumbnail = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 4,
});

const QueueItem = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(1),
  position: 'relative',
  overflow: 'hidden',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid transparent`,
  '& .overlay': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 1,
  },
  '& .actions': {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column', // Stack icons vertically
    gap: 0.5,
  },
}));

function ImageQueue({ queue, onRemoveFromQueue, onImageSelect, currentImageId, onReprocess }) { // <-- NEW PROP
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Image Queue
      </Typography>
      <Grid container spacing={2}>
        {queue.map((item) => (
          <Grid item xs={6} sm={4} md={3} key={item.id}>
            <ButtonBase onClick={() => onImageSelect(item.id)} sx={{ width: '100%', display: 'block', textAlign: 'initial' }}>
              <QueueItem elevation={3} selected={item.id === currentImageId}>
                <Thumbnail src={item.originalImage} alt={item.file.name} />

                {/* --- Overlays --- */}
                {item.status === 'processing' && (
                  <div className="overlay">
                    <CircularProgress color="inherit" />
                  </div>
                )}
                {item.status === 'processed' && (
                  <div className="overlay" style={{ backgroundColor: 'rgba(0, 255, 0, 0.5)' }}>
                    <CheckCircleIcon />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="overlay" style={{ backgroundColor: 'rgba(255, 0, 0, 0.5)' }}>
                    <ErrorIcon />
                  </div>
                )}

                {/* --- Action Buttons --- */}
                <Box className="actions">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onRemoveFromQueue(item.id); }}
                    sx={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                  {/* NEW: Re-process Button */}
                  {(item.status === 'processed' || item.status === 'error') && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); onReprocess(item.id); }}
                      sx={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
                    >
                      <ReplayIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    p: 0.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.file.name}
                </Typography>
              </QueueItem>
            </ButtonBase>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ImageQueue;