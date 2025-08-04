import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Tooltip,
  useTheme,
  Button,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

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
      <Box 
        sx={{ 
          mt: 3,
          p: 2,
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Initial Buy-In (SOL) Header */}
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
            Initial Buy-In (SOL)
          </Typography>
          <Tooltip
            title="The amount you want to initially bet to create the game."
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
          {defaultBetAmounts.map((amount) => {
            const isDisabled = amount > balance;
            const isSelected = Number(bet_amount) === amount;
            
            return (
              <Button
                key={amount}
                variant={isSelected ? 'contained' : 'outlined'}
                color="error"
                size="small"
                disabled={isDisabled}
                onClick={() => selectBetAmount(amount)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  height: 28,
                  borderColor: isDisabled 
                    ? 'rgba(255, 255, 255, 0.12)' 
                    : isSelected 
                      ? '#ff0000' 
                      : 'rgba(255, 0, 0, 0.3)',
                  color: isDisabled 
                    ? 'rgba(255, 255, 255, 0.26)' 
                    : isSelected 
                      ? '#fff' 
                      : '#ff0000',
                  backgroundColor: isDisabled 
                    ? 'transparent' 
                    : isSelected 
                      ? '#ff0000' 
                      : 'transparent',
                  '&:hover': !isDisabled ? {
                    borderColor: '#ff0000',
                    backgroundColor: isSelected ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                    color: '#fff',
                  } : {},
                  '&.Mui-disabled': {
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.26)',
                  },
                }}
              >
                {amount} SOL
              </Button>
            );
          })}
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
            mt: 2,
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
          helperText={
            balance < bet_amount
              ? 'Insufficient balance'
              : `Available: ${balance.toFixed(3)} SOL`
          }
          error={balance < bet_amount}
        />

        {/* Health (SOL) Section - Commented out but preserved for reference */}
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
            Health (SOL)
          </Typography>
          <Tooltip
            title="The maximum amount the room can reach before liquidity is moved to a pool."
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
          helperText="Minimum 10 SOL"
        />
        */}
      </Box>
    </ThemeProvider>
  );
}

export default DefaultBetAmountPanel;