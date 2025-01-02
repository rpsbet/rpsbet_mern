import React, { useState } from 'react';
import { TextField, Button, Tooltip } from '@material-ui/core';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { CloudUpload as UploadIcon, Info } from '@material-ui/icons';
import { useDispatch } from 'react-redux';
import { setFocused } from '../../redux/Auth/user.actions';

const CoinInfo = ({
  onChangeState,
  name,
  ticker,
  image,
  x_link,
  website_link,
  telegram_link,
  isDarkMode,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const dispatch = useDispatch();

  const theme = createTheme({
    overrides: {
      MuiFormLabel: {
        root: {
          color: isDarkMode ? 'white' : '#666',
          fontSize: '12px',
        },
      },
      MuiOutlinedInput: {
        input: {
          color: isDarkMode ? 'white' : 'black',
        },
        root: {
          backgroundColor: isDarkMode ? '#2b2b2b' : 'white',
          '& fieldset': {
            borderColor: isDarkMode ? 'white' : '#666',
          },
          '&:hover fieldset': {
            borderColor: isDarkMode ? 'white' : '#4caf50',
          },
          '&$focused fieldset': {
            borderColor: isDarkMode ? '#4caf50' : '#4caf50',
          },
        },
      },
    },
  });

  const handleInputChange = (field, value) => {
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
        marginBottom: '30px',
        color: isDarkMode ? 'white' : 'black',
      }}
    >
      <h3 className="game-sub-title roll-tag" style={{ marginBottom: '5px' }}>
        Coin Information
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
          label="Name"
          variant="filled"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onFocus={() => dispatch(setFocused(true))} // Dispatch on focus
          onBlur={() => dispatch(setFocused(false))} // Dispatch on blur
          inputProps={{
            maxLength: 10, // Enforce max length
          }}
        />

        {/* Ticker with Prefix "$" */}
        <TextField
          label="Ticker"
          variant="filled"
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <span
                style={{
                  fontSize: '12px',
                  marginTop: '16px',
                  marginRight: '8px',
                  color: isDarkMode ? 'white' : '#666',
                }}
              >
                $
              </span>
            ),
          }}
          inputProps={{
            maxLength: 10, // Enforce max length
          }}
          value={ticker}
          onChange={(e) => handleInputChange('ticker', e.target.value)}
          onFocus={() => dispatch(setFocused(true))} // Dispatch on focus
          onBlur={() => dispatch(setFocused(false))} // Dispatch on blur
        />

        {/* Dropzone for Image Upload */}
        <div
          style={{
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
            <>
              <span style={{ width: '100%', display: 'block' }}>Drag or drop an image</span>

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
            </>
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
            <div style={{ marginTop: '10px' }}>
              <img
                src={image}
                alt="Uploaded"
                style={{ maxWidth: '100%', borderRadius: '10px' }}
              />
            </div>
          )}
        </div>

        {/* "Show more options" Hyperlink */}
        <div style={{ textAlign: 'left', margin: '10px 0' }}>
          <a
            href="#"
            style={{ fontSize: '12px', padding: '0 10px', color: isDarkMode ? 'white' : '#666' }}
            onClick={(e) => {
              e.preventDefault();
              setShowOptions(!showOptions);
            }}
          >
            {showOptions ? (
              <>
                Hide options &uarr; {/* Up Arrow */}
              </>
            ) : (
              <>
                Show more options &darr; {/* Down Arrow */}
              </>
            )}
          </a>
        </div>

        {/* Optional Fields */}
        {showOptions && (
          <div>
            <TextField
              label="X Link"
              variant="filled"
              fullWidth
              margin="normal"
              value={x_link}
              onChange={(e) => handleInputChange('x_link', e.target.value)}
              placeholder="optional"
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
            />
            <TextField
              label="Website Link"
              variant="filled"
              fullWidth
              margin="normal"
              value={website_link}
              onChange={(e) => handleInputChange('website_link', e.target.value)}
              placeholder="optional"
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
            />
            <TextField
              label="Telegram Link"
              variant="filled"
              fullWidth
              margin="normal"
              value={telegram_link}
              onChange={(e) => handleInputChange('telegram_link', e.target.value)}
              placeholder="optional"
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
            />
          </div>
        )}
      </ThemeProvider>
    </div>
  );
};

export default CoinInfo;