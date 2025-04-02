import React, { useEffect, useCallback, useState } from 'react';
import { Button, InputAdornment, TextField, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../config/theme';
import { debounce } from 'lodash';
import sol from '../game_panel/icons/sol.png';

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
          gap: 2, // Consistent spacing between elements
          width: '100%',
          maxWidth: 400, // Reasonable maximum width
          margin: '0 auto', // Center the component
        }}
      >
        <TextField
          color="error"
          type="number"
          variant="filled"
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
              padding: '12px 14px',
              fontSize: '1.1rem',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1, pb: 2 }}>
                <img src={sol} width="24" alt="SOL" style={{ verticalAlign: 'middle' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiFilledInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              '&:before': {
                borderBottomColor: 'white', // When not focused/hovered
              },
              '&:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'white', // Maintain white on hover when not focused
              },

            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            gap: 1, // Consistent spacing between buttons
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
              variant="outlined"
              color="error"
              onClick={btn.onClick}
              disableElevation
              disabled={disabledButtons || false}
              sx={{
                flex: 1,
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none', // Prevent uppercase transformation
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