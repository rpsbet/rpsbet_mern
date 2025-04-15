import React, { useState } from 'react';
import {
  TextField,
  Button,
  Tooltip,
  Box,
  Typography,
  InputAdornment
} from '@mui/material';
import { CloudUpload as UploadIcon, Info } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setFocused } from '../../redux/Auth/user.actions';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

const CoinInfo = ({
  onChangeState,
  name,
  ticker,
  image,
  isDarkMode,
}) => {
  // Separate error states for each field
  const [nameError, setNameError] = useState('');
  const [tickerError, setTickerError] = useState('');

  // MUI theme
  const theme = getCustomTheme(isDarkMode);

  const dispatch = useDispatch();

  // NAME field logic
  const handleNameChange = (value) => {
    if (value.length > 20) {
      setNameError('20 character limit');
    } else {
      setNameError('');
    }
    onChangeState({ name: value });
  };

  // TICKER field logic (with '$' prefix)
  const handleTickerChange = (value) => {
    if (value.length > 10) {
      setTickerError('10 character limit');
    } else {
      setTickerError('');
    }
    onChangeState({ ticker: value });
  };

  // Image processing (drag/drop & file upload)
  const handleImageDrop = (event) => {
    event.preventDefault();
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
      onChangeState({ image: reader.result }); // base64 string
    };
    reader.readAsDataURL(file);
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        className="coin-info-panel"
        style={{
          marginBottom: '10px',
          color: isDarkMode ? 'white' : 'black',
        }}
      >
        {/* Title + Tooltip */}
        <Box sx={{ mt: "20px" }}>
          <h3 className="game-sub-title roll-tag" style={{ marginBottom: '5px' }}>
            Room Information
            &nbsp;
            <Tooltip
              title="For when room hits 69K, liquidity will be moved to a pool."
              placement="top"
            >
              <Info style={{ cursor: 'pointer', color: isDarkMode ? 'white' : '#666' }} />
            </Tooltip>
          </h3>
        </Box>

        {/* NAME Field */}
        <TextField
          color={nameError ? 'error' : 'error'}
          label="Name"
          variant="filled"
          fullWidth
          margin="normal"
          value={name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => {
            dispatch(setFocused(true));
            setNameError(''); // Optionally clear error on focus
          }}
          onBlur={() => {
            dispatch(setFocused(false));
            if ((name || '').length > 20) {
              setNameError('20 character limit');
            }
          }}
          error={!!nameError}
          helperText={nameError}
        />

        {/* TICKER Field (with '$' prefix) */}
        <TextField
          color={tickerError ? 'error' : 'error'}
          label="Ticker"
          variant="filled"
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
              <InputAdornment position="start">
                $
              </InputAdornment>
            ),
          }}
        />

        {/* Dropzone for Image Upload */}
        <Box
          sx={{
            border: '2px dashed #666',
            borderRadius: '0.3em',
            padding: '20px',
            textAlign: 'center',
            margin: '20px 0',
            fontSize: '12px',
            color: isDarkMode ? 'white' : '#666',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleImageDrop}
        >
          {!image ? (
            <Box>
              <Typography variant="subtitle2" sx={{ display: 'block' }}>
                Drag or drop an image
              </Typography>
              <Tooltip title="Upload an image for the coin" placement="top">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<UploadIcon />}
                  component="label"
                  sx={{ mt: 1 }}
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
            <a
              href="#!"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('image-input').click();
              }}
              style={{
                fontSize: '12px',
                color: '#D32F2F',
                textDecoration: 'underline',
                padding: '0 5px',
                cursor: 'pointer',
              }}
            >
              Change Image
            </a>
          )}

          <input
            type="file"
            id="image-input"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />

          {image && (
            <Box sx={{ mt: 1 }}>
              <img
                src={image}
                alt="Uploaded"
                style={{
                  maxWidth: '250px',
                  height: 'auto',
                  borderRadius: '10px',
                }}
              />
            </Box>
          )}
        </Box>
      </div>
    </ThemeProvider>
  );
};

export default CoinInfo;