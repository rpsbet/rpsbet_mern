import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Box, ButtonGroup, Button, Tooltip, TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Info } from '@mui/icons-material';
import { convertToCurrency } from '../../util/conversion';
import { getCustomTheme } from '../../config/theme';

const DefaultBetAmountPanel = ({
  bet_amount,
  game_type,
  balance,
  defaultBetAmounts = [0.25, 0.5, 1, 2.5, 10],
  isDarkMode,
  qs_game_type,
  solPrice,
  onChangeState,
  tax
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOther, setIsOther] = useState(false);

  const theme = getCustomTheme(isDarkMode);

  const images = [
    '/img/icons/coins-xs.svg',
    '/img/icons/coins-s.svg',
    '/img/icons/coins-m.svg',
    '/img/icons/coins-l.svg',
    '/img/icons/coins-xl.svg',
  ];

  const handleInputChange = (field, value) => {
    onChangeState({ [field]: value });
  };

  const handleHalfXButtonClick = () => {
    const multipliedBetAmount = bet_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100000) / 100000;
    onChangeState({ bet_amount: roundedBetAmount });
    document.getElementById('betAmount').focus();
  };

  const handle2xButtonClick = () => {
    const multipliedBetAmount = bet_amount * 2;
    const updatedBetAmount = Math.min(multipliedBetAmount, balance);
    onChangeState({ bet_amount: updatedBetAmount });
    document.getElementById('betAmount').focus();
  };

  const handleMaxButtonClick = () => {
    const maxBetAmount = Math.floor(balance * 100000) / 100000;
    if (game_type === 'Quick Shoot') {
      onChangeState({
        bet_amount: maxBetAmount,
        public_bet_amount: convertToCurrency(
          (qs_game_type - 1) * maxBetAmount, solPrice
        ),
        max_return: qs_game_type * maxBetAmount
      });
    } else {
      onChangeState({
        bet_amount: maxBetAmount,
        max_return: maxBetAmount * 2
      });
    }
    document.getElementById('betAmount').focus();
  };

  useEffect(() => {
    document.getElementById('betAmount').focus();
  }, [bet_amount]);

  return (
    <ThemeProvider theme={theme}>
      <div className="default-bet-amount-panel" style={{ marginBottom: '30px' }}>
        <h3 className="game-sub-title roll-tag">
          Initial Buy-In (SOL)&nbsp;
          <Tooltip
            style={{ position: 'absolute', right: '20px' }}
            title={'Liquidity / pot / pool of money for the game'}
            placement="top"
          >
            <Info style={{ cursor: 'pointer', float: 'right' }} />
          </Tooltip>
        </h3>
        <div className="bet-amounts">
          {defaultBetAmounts.map((amount, index) => (
            <Button
              color='error'
              variant='outlined'
              key={index}
              className={!isOther && bet_amount === amount ? ' active' : ''}
              onClick={() => {
                setIsOther(false);
                if (game_type === 'Quick Shoot') {
                  onChangeState({
                    bet_amount: amount,
                    public_bet_amount: convertToCurrency((qs_game_type - 1) * amount),
                    max_return: qs_game_type * amount,
                  });
                } else {
                  onChangeState({
                    bet_amount: amount,
                    max_return: amount * 2,
                  });
                }
              }}
            >
              <img width="20px" src={images[index]} alt={`Bet Amount: ${amount}`} />
              {amount}
            </Button>
          ))}
          <Button
            color='error'
            variant='outlined'
            className={isOther ? 'other active' : 'other'}
            onClick={() => setIsOther(true)}
          >
            Other
          </Button>
        </div>
        <div className={`edit-amount-panel ${isOther ? '' : 'hidden'}`}>
          <div className="bet-amount">
            <TextField color='error'
              type="text"
              name="betamount"
              id="betAmount"
              variant="filled"
              value={bet_amount}
              inputProps={{
                pattern: '^\\d*\\.?\\d*$',
                maxLength: 9,
              }}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                onFocus: () => setIsFocused(true),
                onBlur: (e) => {
                  e.stopPropagation();
                  setIsFocused(false);
                },
                endAdornment: (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    visibility: isFocused ? 'visible' : 'hidden',
                    opacity: isFocused ? 1 : 0,
                    transition: 'opacity 0.3s, visibility 0.3s',
                    '& > *': {
                      m: 1,
                    },
                  }}>
                    <ButtonGroup variant="outlined" aria-label="Adjust bet amount">
                      <Button onClick={handle2xButtonClick} color='error'>
                        2x
                      </Button>
                      <Button onClick={handleHalfXButtonClick} color='error'>
                        1/2x
                      </Button>
                      <Button onClick={handleMaxButtonClick} color='error'>
                        Max
                      </Button>
                    </ButtonGroup>
                  </Box>
                ),
              }}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (game_type === 'Quick Shoot') {
                  onChangeState({
                    bet_amount: value,
                    public_bet_amount: convertToCurrency((qs_game_type - 1) * value, solPrice),
                    max_return: qs_game_type * value,
                  });
                } else {
                  onChangeState({
                    bet_amount: value,
                    max_return: value * 2,
                  });
                }
              }}
            />
          </div>
        </div>
        <h3 className="game-sub-title roll-tag" style={{ marginTop: "30px" }}>
          Tax&nbsp;
          <Tooltip
            style={{ position: 'absolute', right: '20px' }}
            title={'The percentage of the bet amount taken as a fee or tax.'}
            placement="top"
          >
            <Info style={{ cursor: 'pointer', float: 'right' }} />
          </Tooltip>
        </h3>
        <div className="tax-input">
          <TextField color='error'
            type="number"
            name="tax"
            id="taxInput"
            variant="filled"
            value={tax || ''}
            onChange={(e) => {
              const value = e.target.value;
              onChangeState({ tax: value });
            }}
            inputProps={{
              min: 0,
              max: 33,
              step: 1,
            }}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              endAdornment: (
                <div className="label" style={{ paddingLeft: '8px' }}>
                  %
                </div>
              ),
            }}
            style={{
              width: '100%',
            }}
            error={tax < 0 || tax > 33}
            helperText={
              tax < 0
                ? "Tax cannot be less than 0."
                : tax > 33
                  ? "Tax cannot be more than 33%."
                  : ""
            }
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  socket: state.auth.socket,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  solPrice: state.logic.solPrice,
});

export default connect(mapStateToProps)(DefaultBetAmountPanel);