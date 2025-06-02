import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Info } from '@mui/icons-material';
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

  &:hover {
    background: ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(211, 47, 47, 0.6)' : 'rgba(211, 47, 47, 0.6)'};
    color: white;
  }
`;

function DefaultBetAmountPanel({
  tax,
  endgame_amount,
  bet_amount,
  onChangeState,
  game_type,
  defaultBetAmounts,
  balance,
  isDarkMode,
}) {
  const theme = useTheme();

  const handleBetAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      onChangeState({ bet_amount: value });
    }
  };

  const handleEndgameAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      onChangeState({ endgame_amount: value });
    }
  };

  const selectBetAmount = (amount) => {
    onChangeState({ bet_amount: amount });
  };

  return (
    <ThemeProvider theme={getCustomTheme(isDarkMode)}>
      <GlassContainer isDarkMode={isDarkMode} sx={{ mt: 3 }}>
        {/* Initial Buy-In (SOL) Header */}
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
              color: isDarkMode ? '#fff' : '#000', // Explicit color for consistency
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
            Initial Buy-In (SOL)
          </Typography>
          <Tooltip
            title="The amount you want to initially bet to create the game."
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
          {defaultBetAmounts.map((amount) => (
            <GlassButton
              key={amount}
              isDarkMode={isDarkMode}
              isActive={Number(bet_amount) === amount}
              onClick={() => selectBetAmount(amount)}
            >
              {amount} SOL
            </GlassButton>
          ))}
        </Box>

        <TextField
          color="error"
          label="Custom Buy-In (SOL)"
          value={bet_amount}
          onChange={handleBetAmountChange}
          type="number"
          fullWidth
          inputProps={{ min: 0, step: '0.001' }}
          variant="outlined"
          sx={{
            mt: 3,
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
          }}
          helperText={
            balance < bet_amount
              ? 'Insufficient balance'
              : `Available: ${balance.toFixed(3)} SOL`
          }
          error={balance < bet_amount}
        />

        {/* Health (SOL) Header */}
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
              color: isDarkMode ? '#fff' : '#000', // Explicit color for consistency
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
            Health (SOL)
          </Typography>
          <Tooltip
            title="The maximum amount the room can reach before liquidity is moved to a pool."
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

        <TextField
          color="error"
          label="Health (SOL)"
          value={endgame_amount}
          onChange={handleEndgameAmountChange}
          type="number"
          fullWidth
          inputProps={{ min: 10, step: '1' }}
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
            '& .MuiFormHelperText-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            },
          }}
          helperText="Minimum 10 SOL"
        /> */}
      </GlassContainer>
    </ThemeProvider>
  );
}

export default DefaultBetAmountPanel;