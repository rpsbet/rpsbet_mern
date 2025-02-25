import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Box,
  ButtonGroup,
  Button,
  Tooltip,
  TextField
} from '@mui/material';
import { Info } from '@mui/icons-material';
import RankAllowancesTable from '../../components/RankAllowancesTable';
import { convertToCurrency } from '../../util/conversion';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import BankTable from '../../admin_panel/app/ProductPages/ProductSerchPage/BankTable';

/**
 * Props we expect:
 * - bet_amount: numeric “Initial Buy-In” value
 * - endgame_amount: numeric “Hard Cap” value
 * - game_type, balance, defaultBetAmounts, isDarkMode, qs_game_type, solPrice, onChangeState, tax
 */
const DefaultBetAmountPanel = ({
  bet_amount,
  endgame_amount,             // NEW: for Hard Cap
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
  const [isOther, setIsOther] = useState(false);      // For the "Initial Buy-In"
  const [hc_isOther, setHcIsOther] = useState(false); // For the "Hard Cap"
  const [showTable, setShowTable] = useState(false);

  const theme = getCustomTheme(isDarkMode);

  const categories = [
    { rankThreshold: 0, accountAgeThresholdInDays: 30, maxAllowance: 0 },
    { rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.02 },
    { rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.05 },
    { rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.1 },
    { rankThreshold: 4, accountAgeThresholdInDays: 30, maxAllowance: 0.3 },
    { rankThreshold: 5, accountAgeThresholdInDays: 30, maxAllowance: 0.6 },
    { rankThreshold: 6, accountAgeThresholdInDays: 30, maxAllowance: 1.2 },
    { rankThreshold: 7, accountAgeThresholdInDays: 30, maxAllowance: 1.5 },
    { rankThreshold: 8, accountAgeThresholdInDays: 30, maxAllowance: 2 },
    { rankThreshold: 9, accountAgeThresholdInDays: 30, maxAllowance: 4 },
    { rankThreshold: 10, accountAgeThresholdInDays: 30, maxAllowance: 8 },
    { rankThreshold: 12, accountAgeThresholdInDays: 30, maxAllowance: 10 },
    { rankThreshold: 13, accountAgeThresholdInDays: 30, maxAllowance: 12 },
    { rankThreshold: 14, accountAgeThresholdInDays: 30, maxAllowance: 14 },
    { rankThreshold: 15, accountAgeThresholdInDays: 30, maxAllowance: 16 },
    { rankThreshold: 16, accountAgeThresholdInDays: 30, maxAllowance: 18 },
    { rankThreshold: 17, accountAgeThresholdInDays: 30, maxAllowance: 20 },
  ];

  // Hard Cap values = 2x each defaultBetAmount
  const defaultHardCapAmounts = [20, 40, 50, 80, 100];

  // --------------- INITIAL BUY-IN Logic ---------------
  const handleInputChange = (field, value) => {
    onChangeState({ [field]: value });
  };

  const handleHalfXButtonClick = () => {
    const halfVal = bet_amount * 0.5;
    const rounded = Math.floor(halfVal * 100000) / 100000;
    onChangeState({ bet_amount: rounded });
    document.getElementById('betAmount').focus();
  };

  const handle2xButtonClick = () => {
    const twoVal = bet_amount * 2;
    const updated = Math.min(twoVal, balance);
    onChangeState({ bet_amount: updated });
    document.getElementById('betAmount').focus();
  };

  const handleMaxButtonClick = () => {
    const maxVal = Math.floor(balance * 100000) / 100000;
    if (game_type === 'Quick Shoot') {
      onChangeState({
        bet_amount: maxVal,
        public_bet_amount: convertToCurrency(
          (qs_game_type - 1) * maxVal,
          solPrice
        ),
        max_return: qs_game_type * maxVal,
      });
    } else {
      onChangeState({
        bet_amount: maxVal,
        max_return: maxVal * 2,
      });
    }
    document.getElementById('betAmount').focus();
  };

  useEffect(() => {
    document.getElementById('betAmount').focus();
  }, [bet_amount]);

  // --------------- HARD CAP Logic ---------------
  const handleHCHalfXButtonClick = () => {
    const halfVal = endgame_amount * 0.5;
    const rounded = Math.floor(halfVal * 100000) / 100000;
    onChangeState({ endgame_amount: rounded });
    document.getElementById('hcAmount').focus();
  };

  const handleHC2xButtonClick = () => {
    const twoVal = endgame_amount * 2;
    const updated = Math.min(twoVal, balance);
    onChangeState({ endgame_amount: updated });
    document.getElementById('hcAmount').focus();
  };

  const handleHCMaxButtonClick = () => {
    const maxVal = Math.floor(balance * 100000) / 100000;
    onChangeState({ endgame_amount: maxVal });
    document.getElementById('hcAmount').focus();
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="default-bet-amount-panel" style={{ marginBottom: '30px' }}>
        <div className="default-bet-amount-panel" style={{ marginBottom: '30px' }}>
          {/* ---------------- INITIAL BUY-IN (SOL) ---------------- */}
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
                color="error"
                variant="outlined"
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
                {amount}
              </Button>
            ))}
            <Button
              color="error"
              variant="outlined"
              className={isOther ? 'other active' : 'other'}
              onClick={() => setIsOther(true)}
            >
              Other
            </Button>
          </div>

          {/* "Other" textfield */}
          <div className={`edit-amount-panel ${isOther ? '' : 'hidden'}`}>
            <div className="bet-amount">
              <TextField
                color="error"
                type="text"
                name="betamount"
                id="betAmount"
                variant="filled"
                value={bet_amount}
                inputProps={{
                  pattern: '^\\d*\\.?\\d*$',
                  maxLength: 9,
                }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  onFocus: () => setIsFocused(true),
                  onBlur: (e) => {
                    e.stopPropagation();
                    setIsFocused(false);
                  },
                  endAdornment: (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        visibility: isFocused ? 'visible' : 'hidden',
                        opacity: isFocused ? 1 : 0,
                        transition: 'opacity 0.3s, visibility 0.3s',
                        '& > *': { m: 1 },
                      }}
                    >
                      <ButtonGroup variant="outlined" aria-label="Adjust bet amount">
                        <Button onClick={handle2xButtonClick} color="error">
                          2x
                        </Button>
                        <Button onClick={handleHalfXButtonClick} color="error">
                          1/2x
                        </Button>
                        <Button onClick={handleMaxButtonClick} color="error">
                          Max
                        </Button>
                      </ButtonGroup>
                    </Box>
                  ),
                }}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  let newState = {};

                  if (game_type === 'Quick Shoot') {
                    newState = {
                      bet_amount: value,
                      public_bet_amount: convertToCurrency((qs_game_type - 1) * value, solPrice),
                      max_return: qs_game_type * value,
                    };
                  } else {
                    newState = {
                      bet_amount: value,
                      max_return: value * 2,
                    };
                  }

                  onChangeState(newState);
                }}
              />
            </div>
          </div>
          {/* Warnings */}
          {bet_amount > balance && bet_amount <= balance * 10 && (
            <p
              style={{
                color: 'orange',
                backgroundColor: '#ffd00011',
                borderLeft: '4px solid orange',
                padding: '8px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                marginTop: '15px',
              }}
            >
              ⚠️ YOU WILL BE IN <strong>{(bet_amount - balance).toFixed(6)} SOL</strong> DEBT.
              <span
                style={{
                  color: '#007bff',
                  cursor: 'pointer',
                  marginLeft: '6px',
                  textDecoration: 'underline',
                }}
                onClick={() => setShowTable(!showTable)}
              >
                {showTable ? 'Hide Lenders' : 'Show Lenders'}
              </span>
            </p>
          )}

          {/* Max Bet Warning */}
          {bet_amount > balance * 10 && (
            <p
              style={{
                color: 'red',
                backgroundColor: '#ff000011',
                borderLeft: '4px solid red',
                padding: '8px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                marginTop: '15px',
              }}
            >
              🚨 MAX BET IS <strong>{(balance * 10).toFixed(6)} SOL</strong>. PLEASE LOWER YOUR AMOUNT.
              <span
                style={{
                  color: '#007bff',
                  cursor: 'pointer',
                  marginLeft: '6px',
                  textDecoration: 'underline',
                }}
                onClick={() => setShowTable(!showTable)}
              >
                {showTable ? 'Hide Lenders' : 'Show Lenders'}
              </span>
            </p>
          )}

          {/* Rank Allowances Table (Only Show When Toggled) */}
          {showTable && <BankTable hidePrevious={true}/>}
      </div>

      {/* ---------------- HARD CAP (SOL) => 2x defaultBuyAmounts ---------------- */}
      <h3 className="game-sub-title roll-tag" style={{ marginTop: '30px' }}>
        Hard Cap (SOL)&nbsp;
        <Tooltip
          style={{ position: 'absolute', right: '20px' }}
          title={'The maximum sum allowed for this pool.'}
          placement="top"
        >
          <Info style={{ cursor: 'pointer', float: 'right' }} />
        </Tooltip>
      </h3>
      <div className="bet-amounts">
        {defaultHardCapAmounts.map((amount, index) => {
          const hcVal = amount; // 2x each defaultBuyAmount

          return (
            <Button
              color="error"
              variant="outlined"
              key={`hardcap-${index}`}
              className={!hc_isOther && endgame_amount === amount ? ' active' : ''}
              onClick={() => {
                setHcIsOther(false);
                onChangeState({ endgame_amount: hcVal });
              }}
            >
              {hcVal}
            </Button>
          );
        })}
        <Button
          color="error"
          variant="outlined"
          className={hc_isOther ? 'other active' : 'other'}
          onClick={() => setHcIsOther(true)}
        >
          Other
        </Button>
      </div>
      <div className={`edit-amount-panel ${hc_isOther ? '' : 'hidden'}`}>
        <div className="bet-amount">
          <TextField
            color="error"
            type="text"
            name="hcamount"
            id="hcAmount"
            variant="filled"
            value={endgame_amount}
            inputProps={{
              pattern: '^\\d*\\.?\\d*$',
              maxLength: 9,
            }}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              onFocus: () => setIsFocused(true),
              onBlur: (e) => {
                e.stopPropagation();
                setIsFocused(false);
              },
              endAdornment: (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    visibility: isFocused ? 'visible' : 'hidden',
                    opacity: isFocused ? 1 : 0,
                    transition: 'opacity 0.3s, visibility 0.3s',
                    '& > *': { m: 1 },
                  }}
                >
                  <ButtonGroup variant="outlined" aria-label="Adjust Hard Cap">
                    <Button
                      onClick={() => {
                        const twoVal = endgame_amount * 2;
                        const updated = Math.min(twoVal, balance);
                        onChangeState({ endgame_amount: updated });
                        document.getElementById('hcAmount').focus();
                      }}
                      color="error"
                    >
                      2x
                    </Button>
                    <Button
                      onClick={() => {
                        const halfVal = endgame_amount * 0.5;
                        const rounded = Math.floor(halfVal * 100000) / 100000;
                        onChangeState({ endgame_amount: rounded });
                        document.getElementById('hcAmount').focus();
                      }}
                      color="error"
                    >
                      1/2x
                    </Button>
                    <Button
                      onClick={() => {
                        const maxVal = Math.floor(balance * 100000) / 100000;
                        onChangeState({ endgame_amount: maxVal });
                        document.getElementById('hcAmount').focus();
                      }}
                      color="error"
                    >
                      Max
                    </Button>
                  </ButtonGroup>
                </Box>
              ),
            }}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onChangeState({ endgame_amount: value });
            }}
          />
        </div>
      </div>

      {/* Tax Moved BELOW Hard Cap */}
      <h3 className="game-sub-title roll-tag" style={{ marginTop: '30px' }}>
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
        <TextField
          color="error"
          type="number"
          name="tax"
          id="taxInput"
          variant="filled"
          value={tax || ''}
          onChange={(e) => {
            const val = e.target.value;
            onChangeState({ tax: val });
          }}
          inputProps={{
            min: 0,
            max: 35,
            step: 1,
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <div className="label" style={{ paddingLeft: '8px' }}>
                %
              </div>
            ),
          }}
          style={{ width: '100%' }}
          error={tax < 20 || tax > 35}
          helperText={
            tax < 20
              ? 'Tax cannot be less than 20.'
              : tax > 35
                ? 'Tax cannot be more than 35%.'
                : ''
          }
        />
      </div>
    </div>
    </ThemeProvider >
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