import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  ButtonGroup,
  Button,
  Tooltip,
  TextField,
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
function DefaultBetAmountPanel({
  bet_amount,
  endgame_amount,
  game_type,
  balance: propBalance, // Renamed to avoid shadowing
  defaultBetAmounts = [0.25, 0.5, 1, 2.5, 10],
  isDarkMode: propIsDarkMode, // Renamed to avoid shadowing
  qs_game_type,
  solPrice: propSolPrice, // Renamed to avoid shadowing
  onChangeState,
  tax,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [hc_isOther, setHcIsOther] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Map state from Redux using useSelector
  const auth = useSelector((state) => state.auth.isAuthenticated);
  const socket = useSelector((state) => state.auth.socket);
  const balance = useSelector((state) => state.auth.balance);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const solPrice = useSelector((state) => state.logic.solPrice);
  // Use prop values if provided, otherwise fall back to Redux state
  const effectiveBalance = propBalance !== undefined ? propBalance : balance;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  const theme = getCustomTheme(effectiveIsDarkMode);

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
    const updated = Math.min(twoVal, effectiveBalance);
    onChangeState({ bet_amount: updated });
    document.getElementById('betAmount').focus();
  };

  const handleMaxButtonClick = () => {
    const maxVal = Math.floor(effectiveBalance * 100000) / 100000;
    if (game_type === 'Quick Shoot') {
      onChangeState({
        bet_amount: maxVal,
        public_bet_amount: convertToCurrency(
          (qs_game_type - 1) * maxVal,
          effectiveSolPrice,
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
    const updated = Math.min(twoVal, effectiveBalance);
    onChangeState({ endgame_amount: updated });
    document.getElementById('hcAmount').focus();
  };

  const handleHCMaxButtonClick = () => {
    const maxVal = Math.floor(effectiveBalance * 100000) / 100000;
    onChangeState({ endgame_amount: maxVal });
    document.getElementById('hcAmount').focus();
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="default-bet-amount-panel" style={{ marginBottom: '30px' }}>
        <div className="default-bet-amount-panel" style={{ marginBottom: '30px' }}>
          {/* ---------------- INITIAL BUY-IN (SOL) ---------------- */}
          <h3 className="game-sub-title roll-tag">
            Initial Buy-In (SOL) 
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
                      public_bet_amount: convertToCurrency(
                        (qs_game_type - 1) * value,
                        effectiveSolPrice,
                      ),
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
          {bet_amount > effectiveBalance && bet_amount <= effectiveBalance * 10 && (
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
              ⚠️ YOU WILL BE IN <strong>{(bet_amount - effectiveBalance).toFixed(6)} SOL</strong> DEBT.
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

          {bet_amount > effectiveBalance * 10 && (
            <p
              style={{
                color: 'red',
                backgroundColor: '#D32F2F11',
                borderLeft: '4px solid red',
                padding: '8px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                marginTop: '15px',
              }}
            >
              🚨 MAX BET IS <strong>{(effectiveBalance * 10).toFixed(6)} SOL</strong>. PLEASE LOWER YOUR AMOUNT.
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

          {showTable && <BankTable hidePrevious={true} />}
        </div>

        {/* ---------------- HARD CAP (SOL) ---------------- */}
        <h3 className="game-sub-title roll-tag" style={{ marginTop: '30px' }}>
          HEALTH (SOL) 
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
            const hcVal = amount;

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
                      <Button onClick={handleHC2xButtonClick} color="error">
                        2x
                      </Button>
                      <Button onClick={handleHCHalfXButtonClick} color="error">
                        1/2x
                      </Button>
                      <Button onClick={handleHCMaxButtonClick} color="error">
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
      </div>
    </ThemeProvider>
  );
}

export default DefaultBetAmountPanel;