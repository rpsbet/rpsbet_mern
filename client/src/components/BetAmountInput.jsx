import React, { useEffect, useCallback, useState } from 'react';
import {Button, Box, TextField} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { debounce } from 'lodash';
import { getCustomTheme } from '../config/theme';

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

  const theme = getCustomTheme(isDarkMode);


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
            color='error'
            style={{ flex: 1 }}
            onClick={handle2x}
            disableElevation
          >
            2x
          </Button>
          <Button
            variant="contained"
            color='error'
            style={{ flex: 1 }}
            onClick={handleHalfX}
            disableElevation
          >
            1/2x
          </Button>
          <Button
            variant="contained"
            color='error'
            style={{ flex: 1 }}
            onClick={handleMax}
            disableElevation
          >
            Max
          </Button>
        </div>

          <TextField color='error'
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
            sx={{ marginBottom: '10px', borderTopLeftRadius: '0.3em', borderTopRightRadius: '0.3em', overflow: 'hidden' }}
          />

      </ThemeProvider>
    </div>
  );
}