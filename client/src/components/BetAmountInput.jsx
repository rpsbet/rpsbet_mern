import React, { useEffect, useCallback, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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

  const handle2x = () => {
    handle2xButtonClick();
  };

  const handleHalfX = () => {
    handleHalfXButtonClick();
  };

  const handleMax = () => {
    handleMaxButtonClick();
  };

  const theme = createTheme({
    overrides: {
      MuiOutlinedInput: {
        root: {
          '& $notchedOutline': {
            borderColor: 'gray',
            transition: 'border-color 0.3s ease-in-out',
          },
          '&:hover $notchedOutline': {
            borderColor: 'gray',
          },
          '&$focused $notchedOutline': {
            borderColor: 'red',
            boxShadow: '0 0 0 4px rgba(255, 0, 0, 0.3)',
          },
          '& input': {
            color: isDarkMode ? 'white' : '#101010',
            backgroundColor: '#10101011',
          },
        },
      },
      MuiFormLabel: {
        root: {
          color: isDarkMode ? 'white' : '#101010',
        },
      },
    },
  });

  return (
    <div
      className="bet-amount"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '5px',
        width: '100%',
      }}
    >
      <ThemeProvider theme={theme}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Button
            variant="contained"
            color='secondary'
            style={{ flex: 1 }}
            onClick={handle2x}
          >
            2x
          </Button>
          <Button
            variant="contained"
            color='secondary'
            style={{ flex: 1 }}
            onClick={handleHalfX}
          >
            1/2x
          </Button>
          <Button
            variant="contained"
            color='secondary'
            style={{ flex: 1 }}
            onClick={handleMax}
          >
            Max
          </Button>
        </div>

         <TextField color="secondary" 
          type="text"
          name="betamount"
          variant="filled"
          id="betamount"
          ref={betAmountRef}
          disabled={disabledButtons || false}
          label=""
          value={localBetAmount}
          onChange={handleTextFieldChange}
          placeholder="BET AMOUNT"
          fullWidth
          inputProps={{
            pattern: '^\\d*\\.?\\d*$',
          }}
          InputLabelProps={{
            shrink: true,
          }}
          style={{ marginBottom: '10px' }}
        />
      </ThemeProvider>
    </div>
  );
}