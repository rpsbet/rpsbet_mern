import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFocused } from '../../redux/Auth/user.actions';
import {
  Box,
  Typography,
  TextField,
  Tooltip,
  InputAdornment,
  useTheme,
  Button,
  Collapse,
} from '@mui/material';
import { Info, ExpandMore, ExpandLess } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

function AdvancedSettings(props) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDarkMode = props.isDarkMode;

  const [showOptions, setShowOptions] = useState(false);

  const handleInputChange = (field, value) => {
    props.onChangeState({ [field]: value });
  };

  return (
    <ThemeProvider theme={getCustomTheme(isDarkMode)}>
      <Box 
        sx={{ 
          mt: 3,
          p: 2,
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Privacy Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
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
            Privacy
          </Typography>
          <Tooltip
            title="Set private to require players enter a password to play"
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

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <Button
            variant={!props.is_private ? 'contained' : 'outlined'}
            color="error"
            size="small"
            onClick={() => handleInputChange('is_private', false)}
            startIcon={<img src="/img/icons/public.svg" alt="Public Game" width="16px" />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: 28,
              borderColor: !props.is_private ? '#ff0000' : 'rgba(255, 0, 0, 0.3)',
              color: !props.is_private ? '#fff' : '#ff0000',
              backgroundColor: !props.is_private ? '#ff0000' : 'transparent',
              '&:hover': {
                borderColor: '#ff0000',
                backgroundColor: !props.is_private ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                color: '#fff',
              },
            }}
          >
            Public
          </Button>
          <Button
            variant={props.is_private ? 'contained' : 'outlined'}
            color="error"
            size="small"
            onClick={() => handleInputChange('is_private', true)}
            startIcon={<img src="/img/icons/private.svg" alt="Private Game" width="16px" />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: 28,
              borderColor: props.is_private ? '#ff0000' : 'rgba(255, 0, 0, 0.3)',
              color: props.is_private ? '#fff' : '#ff0000',
              backgroundColor: props.is_private ? '#ff0000' : 'transparent',
              '&:hover': {
                borderColor: '#ff0000',
                backgroundColor: props.is_private ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                color: '#fff',
              },
            }}
          >
            Private
          </Button>
        </Box>

        {props.is_private && (
          <TextField
            color="error"
            id="room_password"
            label="Room Password"
            value={props.room_password}
            onChange={(e) => handleInputChange('room_password', e.target.value)}
            fullWidth
            variant="outlined"
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
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
        )}

        {/* Payout Section - Commented out but preserved for reference */}
        {/* 
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            mt: 3,
          }}
        >
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
            Payout
          </Typography>
          <Tooltip
            title="Choose Automatic to be paid into your balance each time the set threshold has been reached"
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

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <Button
            variant={!props.endgame_type ? 'contained' : 'outlined'}
            color="error"
            size="small"
            onClick={() => handleInputChange('endgame_type', false)}
            startIcon={<img src="/img/icons/manual.svg" alt="Manual Game" width="16px" />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: 28,
              borderColor: !props.endgame_type ? '#ff0000' : 'rgba(255, 0, 0, 0.3)',
              color: !props.endgame_type ? '#fff' : '#ff0000',
              backgroundColor: !props.endgame_type ? '#ff0000' : 'transparent',
              '&:hover': {
                borderColor: '#ff0000',
                backgroundColor: !props.endgame_type ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                color: '#fff',
              },
            }}
          >
            Manual
          </Button>
          <Button
            variant={props.endgame_type ? 'contained' : 'outlined'}
            color="error"
            size="small"
            onClick={() => handleInputChange('endgame_type', true)}
            startIcon={<img src="/img/icons/automatic.svg" alt="Automatic Game" width="16px" />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: 28,
              borderColor: props.endgame_type ? '#ff0000' : 'rgba(255, 0, 0, 0.3)',
              color: props.endgame_type ? '#fff' : '#ff0000',
              backgroundColor: props.endgame_type ? '#ff0000' : 'transparent',
              '&:hover': {
                borderColor: '#ff0000',
                backgroundColor: props.endgame_type ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                color: '#fff',
              },
            }}
          >
            Automatic
          </Button>
        </Box>

        {props.endgame_type && (
          <TextField
            color="error"
            id="endgame_amount"
            label="Payout Amount"
            value={props.endgame_amount}
            placeholder="PAYOUT"
            onChange={(e) => handleInputChange('endgame_amount', e.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
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
              '& .MuiInputBase-input': {
                color: '#fff',
              },
              '& .MuiInputAdornment-root': {
                color: 'rgba(255, 255, 255, 0.6)',
              },
            }}
          />
        )}
        */}

        {/* Other Information Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            mt: 3,
          }}
        >
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
            Other Information
          </Typography>
          <Tooltip
            title="Add a description to your room."
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <TextField
            color="error"
            label="Add Description"
            value={props.description}
            placeholder="e.g. This gonna go crazy"
            onChange={props.handleDescriptionChange}
            onFocus={() => dispatch(setFocused(true))}
            onBlur={() => dispatch(setFocused(false))}
            fullWidth
            variant="outlined"
            sx={{
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
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
          <FontAwesomeIcon 
            icon={faPenSquare} 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '16px' 
            }} 
          />
        </Box>

        <Box sx={{ textAlign: 'left', mb: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setShowOptions(!showOptions)}
            endIcon={showOptions ? <ExpandLess /> : <ExpandMore />}
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'none',
              p: 0,
              minWidth: 'auto',
              '&:hover': {
                color: '#ff0000',
                backgroundColor: 'transparent',
              },
            }}
          >
            {showOptions ? 'Hide options' : 'Show more options'}
          </Button>
        </Box>

        <Collapse in={showOptions}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              color="error"
              label="X Link"
              variant="outlined"
              fullWidth
              value={props.x_link}
              onChange={(e) => handleInputChange('x_link', e.target.value)}
              placeholder="optional"
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
              sx={{
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
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
              }}
            />
            <TextField
              color="error"
              label="Website Link"
              variant="outlined"
              fullWidth
              value={props.website_link}
              onChange={(e) => handleInputChange('website_link', e.target.value)}
              placeholder="optional"
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
              sx={{
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
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
              }}
            />
            <TextField
              color="error"
              label="Telegram Link"
              variant="outlined"
              fullWidth
              value={props.telegram_link}
              onChange={(e) => handleInputChange('telegram_link', e.target.value)}
              placeholder="optional"
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
              sx={{
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
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
              }}
            />
          </Box>
        </Collapse>
      </Box>
    </ThemeProvider>
  );
}

export default AdvancedSettings;