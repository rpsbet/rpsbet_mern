import React, { useState } from 'react';
import {
  TextField,
  Button,
  Tooltip,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as UploadIcon, Info, AutoAwesome } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setFocused } from '../../redux/Auth/user.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import { manualAutopopulate } from '../../redux/Logic/logic.actions';

const CoinInfo = ({
  onChangeState,
  name,
  ticker,
  image,
  isDarkMode,
  gameCode, // NEW: Pass gameCode from parent
}) => {
  const [nameError, setNameError] = useState('');
  const [tickerError, setTickerError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAutopopulating, setIsAutopopulating] = useState(false); // NEW: Auto-populate loading state

  const theme = getCustomTheme(isDarkMode);
  const dispatch = useDispatch();

  const handleNameChange = (value) => {
    if (value.length > 20) {
      setNameError('20 character limit');
    } else {
      setNameError('');
    }
    onChangeState({ name: value });
  };

  const handleTickerChange = (value) => {
    if (value.length > 10) {
      setTickerError('10 character limit');
    } else {
      setTickerError('');
    }
    onChangeState({ ticker: value });
  };

  const handleImageDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onChangeState({ image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // NEW: Handle auto-populate button click
  const handleAutopopulate = async () => {
    if (!gameCode || !gameCode.trim()) {
      dispatch({
        type: 'MSG_ERROR',
        payload: 'No game code available to analyze. Please generate a game first.'
      });
      return;
    }
  
    setIsAutopopulating(true);
    
    try {
      // Call the updated manualAutopopulate function
      const result = await manualAutopopulate(gameCode, onChangeState, dispatch, true);
      
      if (result) {
        console.log('Auto-populate successful:', result);
        
        // Show success message with details
        const imageText = result.imageUrl ? ' and generated image' : '';
        dispatch({
          type: 'MSG_SUCCESS',
          payload: `Successfully auto-filled: ${result.name} ($${result.ticker})${imageText}`
        });
      } else {
        console.log('Auto-populate returned no results');
        dispatch({
          type: 'MSG_WARNING',
          payload: 'Could not extract meaningful information from the generated game. Please fill the fields manually.'
        });
      }
      
    } catch (error) {
      console.error('Manual auto-populate failed:', error);
      dispatch({
        type: 'MSG_ERROR',
        payload: 'Failed to auto-populate room information. Please try again or fill manually.'
      });
    } finally {
      setIsAutopopulating(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box 
        className="coin-info-panel" 
        sx={{ 
          mb: 2, 
          mt: 3,
          p: 2,
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Title + Tooltip + Auto-populate Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h6"
            component="h3"
            className="game-sub-title"
            sx={{
              fontWeight: 600,
              color: '#fff',
              fontSize: '1rem',
            }}
          >
            Room Information
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Auto-populate Button */}
            {gameCode && (
              <Tooltip
                title="Auto-populate room info based on generated game"
                placement="top"
              >
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleAutopopulate}
                  disabled={isAutopopulating || !gameCode}
                  startIcon={
                    isAutopopulating ? (
                      <CircularProgress size={14} color="error" />
                    ) : (
                      <AutoAwesome sx={{ fontSize: '14px' }} />
                    )
                  }
                  sx={{
                    borderColor: 'rgba(255, 0, 0, 0.3)',
                    color: '#fff',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    height: 28,
                    '&:hover': {
                      borderColor: '#ff0000',
                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    },
                    '&:disabled': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  {isAutopopulating ? 'Analyzing...' : 'Auto-fill'}
                </Button>
              </Tooltip>
            )}

            <Tooltip
              title="For when room hits 69K, liquidity will be moved to a pool."
              placement="top"
            >
              <Info
                sx={{
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '16px',
                  '&:hover': {
                    color: '#ff0000',
                  },
                  transition: 'color 0.2s ease',
                }}
              />
            </Tooltip>
          </Box>
        </Box>

        {/* NAME Field */}
        <TextField
          color="error"
          label="Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => {
            dispatch(setFocused(true));
            setNameError('');
          }}
          onBlur={() => {
            dispatch(setFocused(false));
            if ((name || '').length > 20) {
              setNameError('20 character limit');
            }
          }}
          error={!!nameError}
          helperText={nameError}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 0, 0, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ff0000',
              },
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.6)',
              '&.Mui-focused': {
                color: '#ff0000',
              },
            },
            '& .MuiFormHelperText-root': {
              color: 'rgba(255, 255, 255, 0.6)',
            },
            '& .MuiInputBase-input': {
              color: '#fff',
            },
          }}
        />

        {/* TICKER Field (with '$' prefix) */}
        <TextField
          color="error"
          label="Ticker"
          variant="outlined"
          fullWidth
          margin="normal"
          value={ticker || ''}
          onChange={(e) => handleTickerChange(e.target.value)}
          onFocus={() => {
            dispatch(setFocused(true));
            setTickerError('');
          }}
          onBlur={() => {
            dispatch(setFocused(false));
            if ((ticker || '').length > 10) {
              setTickerError('10 character limit');
            }
          }}
          error={!!tickerError}
          helperText={tickerError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">$</InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 0, 0, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ff0000',
              },
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.6)',
              '&.Mui-focused': {
                color: '#ff0000',
              },
            },
            '& .MuiFormHelperText-root': {
              color: 'rgba(255, 255, 255, 0.6)',
            },
            '& .MuiInputBase-input': {
              color: '#fff',
            },
            '& .MuiInputAdornment-root': {
              color: 'rgba(255, 255, 255, 0.6)',
            },
          }}
        />

        {/* Dropzone for Image Upload */}
        <Box
          sx={{ 
            border: `2px dashed ${isDragging ? '#ff0000' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '8px',
            padding: 2,
            textAlign: 'center',
            mt: 2,
            transition: 'all 0.2s ease',
            background: isDragging 
              ? 'rgba(255, 0, 0, 0.05)' 
              : 'rgba(255, 255, 255, 0.02)',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleImageDrop}
        >
          {!image ? (
            <Box sx={{ py: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  display: 'block',
                  mb: 2,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.875rem',
                }}
              >
                Drag or drop an image
              </Typography>
              <Tooltip title="Upload an image for the coin" placement="top">
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<UploadIcon />}
                  component="label"
                  sx={{
                    mt: 1,
                    background: '#ff0000',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    '&:hover': {
                      background: '#cc0000',
                    },
                  }}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </Button>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('image-input').click();
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  zIndex: 2,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                Change Image
              </Button>

              <Box
                sx={{
                  mt: 1,
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src={image}
                  alt="Uploaded"
                  sx={{
                    maxWidth: '200px',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </Box>
            </Box>
          )}

          <input
            type="file"
            id="image-input"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CoinInfo;