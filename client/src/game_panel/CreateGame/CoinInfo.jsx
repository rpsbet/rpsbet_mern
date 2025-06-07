import React, { useState } from 'react';
import {
  TextField,
  Button,
  Tooltip,
  Box,
  Typography,
  InputAdornment,
  alpha,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as UploadIcon, Info, AutoAwesome } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setFocused } from '../../redux/Auth/user.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import styled from 'styled-components';
import { manualAutopopulate } from '../../redux/Logic/logic.actions';

// Styled components for glassmorphism effect
const GlassContainer = styled(Box)`
  background: ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.65)'};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)'};
  box-shadow: ${({ isDarkMode }) =>
    isDarkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(31, 38, 135, 0.1)'};
  padding: 24px;
  transition: all 0.3s ease;
`;

const GlassButton = styled.button`
  background: ${({ isDarkMode, isActive }) =>
    isActive
      ? isDarkMode
        ? 'rgba(211, 47, 47, 0.8)'
        : 'rgba(211, 47, 47, 0.8)'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(255, 255, 255, 0.5)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid ${({ isActive, isDarkMode }) =>
    isActive
      ? 'rgba(211, 47, 47, 0.8)'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.5)'};
  color: ${({ isActive, isDarkMode }) =>
    isActive
      ? 'white'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.9)'
      : 'rgba(0, 0, 0, 0.8)'};
  font-weight: ${({ isActive }) => (isActive ? '600' : '400')};
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ isDarkMode }) =>
      isDarkMode ? 'rgba(211, 47, 47, 0.6)' : 'rgba(211, 47, 47, 0.6)'};
    color: white;
  }
`;

const GlassDropzone = styled(Box)`
  border: 2px dashed ${({ isDragging, isDarkMode }) =>
    isDragging
      ? '#FF0000'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.2)'};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin: 20px 0;
  transition: all 0.2s ease;
  background: ${({ isDragging, isDarkMode }) =>
    isDragging
      ? isDarkMode
        ? 'rgba(211, 47, 47, 0.08)'
        : 'rgba(211, 47, 47, 0.05)'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.3)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
`;

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
      console.log('Starting manual auto-populate...');
      
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
      <GlassContainer isDarkMode={isDarkMode} className="coin-info-panel" sx={{ mb: 2, mt: 3 }}>
        {/* Title + Tooltip + Auto-populate Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography
            variant="h6"
            component="h3"
            className="game-sub-title"
            sx={{
              fontWeight: 600,
              position: 'relative',
              color: isDarkMode ? '#fff' : '#000',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: '40px',
                height: '3px',
                background: theme.palette.error.main,
                borderRadius: '2px',
              },
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
                      <CircularProgress size={16} color="error" />
                    ) : (
                      <AutoAwesome />
                    )
                  }
                  sx={{
                    borderColor: 'rgba(211, 47, 47, 0.5)',
                    color: isDarkMode ? '#fff' : '#000',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    },
                    '&:disabled': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
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
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&:hover': {
                    color: theme.palette.error.main,
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
              background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.error.main, 0.7),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
              },
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&.Mui-focused': {
                color: theme.palette.error.main,
              },
            },
            '& .MuiFormHelperText-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            },
            '& .MuiInputBase-input': {
              color: isDarkMode ? '#fff' : '#000',
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
              background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.error.main, 0.7),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
              },
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&.Mui-focused': {
                color: theme.palette.error.main,
              },
            },
            '& .MuiFormHelperText-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            },
            '& .MuiInputBase-input': {
              color: isDarkMode ? '#fff' : '#000',
            },
            '& .MuiInputAdornment-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            },
          }}
        />

        {/* Dropzone for Image Upload */}
        <GlassDropzone
          isDragging={isDragging}
          isDarkMode={isDarkMode}
          sx={{ mt: 3 }}
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
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
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
                    background: alpha(theme.palette.error.main, 0.9),
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
                    '&:hover': {
                      background: theme.palette.error.main,
                      boxShadow: '0 6px 16px rgba(211, 47, 47, 0.3)',
                    },
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
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
              <GlassButton
                isDarkMode={isDarkMode}
                isActive={false}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('image-input').click();
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '12px',
                  padding: '4px 12px',
                  zIndex: 2,
                }}
              >
                Change Image
              </GlassButton>

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
                    maxWidth: '250px',
                    height: 'auto',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
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
        </GlassDropzone>
      </GlassContainer>
    </ThemeProvider>
  );
};

export default CoinInfo;