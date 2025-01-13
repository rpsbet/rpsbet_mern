import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Button, Tooltip, TextField } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { Info } from '@material-ui/icons';
import { convertToCurrency } from '../../util/conversion';

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

  const images = [
    '/img/icons/coins-xs.svg',
    '/img/icons/coins-s.svg',
    '/img/icons/coins-m.svg',
    '/img/icons/coins-l.svg',
    '/img/icons/coins-xl.svg',
  ];

  const theme = createTheme({
    overrides: {
      MuiOutlinedInput: {
        adornedEnd: {
          paddingRight: '6px',
        },
        root: {
          '& $notchedOutline': {
            borderColor: 'gray',
            transition: 'border-color 0.3s ease-in-out',
            paddingRight: '6px',
          },
          '&:hover $notchedOutline': {
            borderColor: 'gray',
          },
          '&$focused $notchedOutline': {
            borderColor: 'red',
            boxShadow: '0 0 0 4px rgba(255, 0, 0, 0.3)',
          },
          '&$focused': {
            backgroundColor: '#10101011',
          },
          '&:not($focused):not($error) $notchedOutline': {
            borderColor: isDarkMode ? 'white' : '#101010',
          },
          '& input': {
            color: isDarkMode ? 'white' : '#101010',
            backgroundColor: '#10101011',
          },
        },
        input: {
          '&::placeholder': {
            color: 'gray',
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
          className={isOther ? 'other active' : 'other'}
          onClick={() => setIsOther(true)}
        >
          Other
        </Button>
      </div>
      <div className={`edit-amount-panel ${isOther ? '' : 'hidden'}`}>
        <div className="bet-amount">
          <ThemeProvider theme={theme}>
            <TextField
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
                  <ButtonGroup
                    className={isFocused ? 'fade-in' : 'fade-out'}
                  >
                    <Button
                      className='label'
                      variant="contained"
                      color="primary"
                      onClick={handle2xButtonClick}
                      style={{
                        marginTop: '8px',
                        border: '1px solid red', // Red border
                        color: 'red', // Optional: text color
                      }}
                    >
                      2x
                    </Button>
                    <Button
                      variant="contained"
                      className='label'

                      color="primary"
                      onClick={handleHalfXButtonClick}
                      style={{
                        marginTop: '8px',
                        border: '1px solid red', // Red border
                        color: 'red', // Optional: text color
                      }}
                    >
                      1/2x
                    </Button>
                    <Button
                      variant="contained"
                      className='label'

                      color="primary"
                      onClick={handleMaxButtonClick}
                      style={{
                        marginTop: '8px',
                        border: '1px solid red', // Red border
                        color: 'red', // Optional: text color
                      }}
                    >
                      Max
                    </Button>
                  </ButtonGroup>
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
          </ThemeProvider>
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
        <ThemeProvider theme={theme}>
          <TextField
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
            error={tax < 0 || tax > 33} // Adds error styling if the condition is met
          />
        </ThemeProvider>
        {/* Display the error message if the value is out of range */}
        {tax < 0 && (
          <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '4px' }}>
            Tax cannot be less than 0.
          </div>
        )}
        {tax > 33 && (
          <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '4px' }}>
            Tax cannot be more than 33%.
          </div>
        )}
      </div>
    </div>
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