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
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import { alpha } from '@mui/material';

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
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${({ isDarkMode }) =>
      isDarkMode ? 'rgba(211, 47, 47, 0.6)' : 'rgba(211, 47, 47, 0.6)'};
    color: white;
  }
`;

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
      <GlassContainer isDarkMode={isDarkMode} sx={{ mt: 3 }}>
        {/* Privacy Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
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
            Privacy
          </Typography>
          <Tooltip
            title="Set private to require players enter a password to play"
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

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <GlassButton
            isDarkMode={isDarkMode}
            isActive={!props.is_private}
            onClick={() => handleInputChange('is_private', false)}
          >
            <img src="/img/icons/public.svg" alt="Public Game" width="20px" />
            Public
          </GlassButton>
          <GlassButton
            isDarkMode={isDarkMode}
            isActive={props.is_private}
            onClick={() => handleInputChange('is_private', true)}
          >
            <img src="/img/icons/private.svg" alt="Private Game" width="20px" />
            Private
          </GlassButton>
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
              mb: 3,
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
            }}
          />
        )}

        {/* Payout Section */}
        {/* <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
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
            Payout
          </Typography>
          <Tooltip
            title="Choose Automatic to be paid into your balance each time the set threshold has been reached"
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

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <GlassButton
            isDarkMode={isDarkMode}
            isActive={!props.endgame_type}
            onClick={() => handleInputChange('endgame_type', false)}
          >
            <img src="/img/icons/manual.svg" alt="Manual Game" width="20px" />
            Manual
          </GlassButton>
          <GlassButton
            isDarkMode={isDarkMode}
            isActive={props.endgame_type}
            onClick={() => handleInputChange('endgame_type', true)}
          >
            <img src="/img/icons/automatic.svg" alt="Automatic Game" width="20px" />
            Automatic
          </GlassButton>
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
              mb: 3,
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
            }}
          />
        )} */}

        {/* Other Information Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
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
            Other Information
          </Typography>
          <Tooltip
            title="Add a description to your room."
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
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
            }}
          />
          <FontAwesomeIcon icon={faPenSquare} />
        </Box>

        <Box sx={{ textAlign: 'left', mb: 2 }}>
          <a
            href="#"
            style={{
              fontSize: '12px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              textDecoration: 'none',
              '&:hover': {
                color: theme.palette.error.main,
              },
            }}
            onClick={(e) => {
              e.preventDefault();
              setShowOptions(!showOptions);
            }}
          >
            {showOptions ? 'Hide options ↑' : 'Show more options ↓'}
          </a>
        </Box>

        {showOptions && (
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
              }}
            />
          </Box>
        )}
      </GlassContainer>
    </ThemeProvider>
  );
}

export default AdvancedSettings;