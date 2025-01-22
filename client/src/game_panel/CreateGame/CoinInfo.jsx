import React, { useState } from 'react';
import { TextField, Button, Tooltip, Box, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CloudUpload as UploadIcon, Info } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setFocused } from '../../redux/Auth/user.actions';
import { getCustomTheme } from '../../config/theme';

const CoinInfo = ({
  onChangeState,
  name,
  image,
  isDarkMode,
}) => {
  const [inputError, setInputError] = useState('');
  const theme = getCustomTheme(isDarkMode);

  const dispatch = useDispatch();

  const handleInputChange = (field, value) => {
    if (value.length > 10) {
      setInputError('10 character limit');
    } else {
      setInputError('');
    }
    onChangeState({ [field]: value });
  };

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
      onChangeState({
        image: reader.result, // Base64 string
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="coin-info-panel"
      style={{
        marginBottom: '10px',
        color: isDarkMode ? 'white' : 'black',
      }}
    >
      <h3 className="game-sub-title roll-tag" style={{ marginBottom: '5px' }}>
        Room Information
        &nbsp;
        <Tooltip
          title={'For when room hits 69K, liquidity will be moved to a pool.'}
          placement="top"
        >
          <Info style={{ cursor: 'pointer', color: isDarkMode ? 'white' : '#666' }} />
        </Tooltip>
      </h3>
      <ThemeProvider theme={theme}>
        {/* Coin Name */}
        <TextField
          color={inputError ? "error" : "secondary"}
          label="Name"
          variant="filled"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onFocus={() => {
            dispatch(setFocused(true));
            setInputError(''); // Optionally clear error on focus
          }}
          onBlur={() => {
            dispatch(setFocused(false));
            if (name.length > 10) {
              setInputError('10 character limit'); // Ensure error remains if still over limit on blur
            }
          }}
          error={!!inputError}
          helperText={inputError}
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
              <Typography variant="subtitle3" style={{ width: '100%', display: 'block' }}>Drag or drop an image</Typography>

              <Tooltip title="Upload an image for the coin" placement="top">
                <Button
                  variant="contained"
                  color="default"
                  startIcon={<UploadIcon />}
                  component="label"
                  style={{ marginTop: '10px' }}
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
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('image-input').click();
              }}
              style={{
                fontSize: '12px',
                color: '#ff0000',
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
            <Box style={{ marginTop: '10px' }}>
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


      </ThemeProvider>
    </div>
  );
};

export default CoinInfo;