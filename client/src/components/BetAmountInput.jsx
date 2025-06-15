import { useEffect, useCallback, useState } from 'react';
import { Button, InputAdornment, TextField, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../config/theme';
import { debounce } from 'lodash';

export default function BetAmountInput(props) {
  const {
    bet_amount,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
    onChangeState,
    isDarkMode,
    betAmountRef,
    disabledButtons,
  } = props;

  const [localBetAmount, setLocalBetAmount] = useState(bet_amount);

  useEffect(() => {
    setLocalBetAmount(bet_amount);
  }, [bet_amount]);

  const debouncedOnChangeState = useCallback(
    debounce((value) => {
      onChangeState({ bet_amount: parseFloat(value) || 0 });
    }, 300),
    [onChangeState]
  );

  const handleTextFieldChange = (event) => {
    const value = event.target.value;
    setLocalBetAmount(value);
    debouncedOnChangeState(value);
  };

  const theme = getCustomTheme(isDarkMode);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        <TextField
          type="number"
          variant="standard"
          ref={betAmountRef}
          disabled={disabledButtons || false}
          value={localBetAmount}
          onChange={handleTextFieldChange}
          placeholder="Enter Bet Amount"
          fullWidth
          inputProps={{
            step: '0.01',
            min: '0',
            style: {
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              padding: '8px 0',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment 
                position="start" 
                sx={{ 
                  mr: 1, 
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                SOL
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiInput-underline': {
              '&:before': {
                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:after': {
                borderBottomColor: '#ff0000',
              },
            },
            '& .MuiInputBase-input': {
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1,
              },
            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            justifyContent: 'space-between',
          }}
        >
          {[
            { label: '2x', onClick: handle2xButtonClick },
            { label: '½x', onClick: handleHalfXButtonClick },
            { label: 'Max', onClick: handleMaxButtonClick },
          ].map((btn) => (
            <Button
              key={btn.label}
              variant="text"
              onClick={btn.onClick}
              disabled={disabledButtons || false}
              sx={{
                flex: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '4px',
                textTransform: 'none',
                color: disabledButtons ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '32px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  color: '#ff0000',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              {btn.label}
            </Button>
          ))}
        </Box>
      </Box>
    </ThemeProvider>
  );
}