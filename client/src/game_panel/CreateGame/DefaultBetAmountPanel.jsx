import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { connect } from 'react-redux';
import { Button, Tooltip, TextField } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { Info } from '@material-ui/icons';
class DefaultBetAmountPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      is_other: false
    };

    this.images = [
      '/img/icons/coins-xs.svg',
      '/img/icons/coins-s.svg',
      '/img/icons/coins-m.svg',
      '/img/icons/coins-l.svg',
      '/img/icons/coins-xl.svg',
    ];
  }

  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.props.bet_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100000) / 100000;
    const newState = {
      bet_amount: roundedBetAmount
    };
    this.props.onChangeState(newState);
    document.getElementById("betAmount").focus();
  }

  handle2xButtonClick = () => {
    const multipliedBetAmount = this.props.bet_amount * 2;
    const updatedBetAmount = Math.min(multipliedBetAmount, this.props.balance);

    const newState = {
      bet_amount: updatedBetAmount
    };

    this.props.onChangeState(newState);
    document.getElementById("betAmount").focus();
  }

  handleMaxButtonClick = () => {
    const maxBetAmount = Math.floor(this.props.balance * 100000) / 100000;
    if (this.props.game_type === 'Quick Shoot') {
      this.props.onChangeState({
        bet_amount: maxBetAmount,
        public_bet_amount: convertToCurrency(
          (this.props.qs_game_type - 1) * maxBetAmount, this.props.solPrice
        ),
        max_return: this.props.qs_game_type * maxBetAmount
      });
    } else {
      this.props.onChangeState({
        bet_amount: maxBetAmount,
        max_return: maxBetAmount * 2
      });
    }
    document.getElementById("betAmount").focus();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.bet_amount !== prevProps.bet_amount) {
      document.getElementById('betAmount').focus();
    }
  }

  handleFocus = () => {
    this.setState({ isFocused: true });
  };

  handleBlur = (event) => {
    event.stopPropagation();
    this.setState({ isFocused: false });
  };

  formatBetAmount = (amount) => {
    const roundedAmount = Math.floor(amount * 100000) / 100000;
    return roundedAmount;
  };

  render() {
    const defaultBetAmounts = this.props.defaultBetAmounts || this.state.defaultBetAmounts || [0.25, 0.5, 1, 2.5, 10 ];

    const isDarkMode = this.props.isDarkMode;
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

    const { isFocused, is_other } = this.state;
    const { bet_amount, game_type, onChangeState, qs_game_type, solPrice } = this.props;

    return (
      <div className="default-bet-amount-panel" style={{ marginBottom: "30px", }}>
        <h3 className="game-sub-title roll-tag">Initial Buy-In&nbsp;<Tooltip
          style={{ position: "absolute", right: "20px" }}
          title={'Liquidity / pot / pool of money for the game'}
          placement="top"
        >
          <Info style={{ cursor: "pointer", float: "right" }} />
        </Tooltip></h3>
        <div className="bet-amounts">
          {defaultBetAmounts.map((amount, index) => (
            <Button
              className={
                !is_other && bet_amount === amount
                  ? ' active'
                  : ''
              }
              onClick={() => {
                this.setState({ is_other: false });
                if (game_type === 'Quick Shoot') {
                  onChangeState({
                    bet_amount: amount,
                    public_bet_amount: convertToCurrency(
                      (qs_game_type - 1) * amount, solPrice
                    ),
                    max_return: qs_game_type * amount
                  });
                } else {
                  onChangeState({
                    bet_amount: amount,
                    max_return: amount * 2
                  });
                }
              }}
              key={index}
            >
              <img width="20px" src={this.images[index]} alt={`Bet Amount: ${amount}`} />

              {convertToCurrency(amount, solPrice)}
            </Button>
          ))}
          <Button
            className={is_other ? 'other active' : 'other'}
            onClick={() => {
              this.setState({ is_other: true });
            }}
          >
            Other
          </Button>
        </div>
        <div
          className={`edit-amount-panel ${is_other ? '' : 'hidden'}`}
        >
          <div className='bet-amount'>
            <ThemeProvider theme={theme}>
              <TextField
                type="text"
                name="betamount"
                id="betAmount"
                variant="filled"
                value={bet_amount}
                inputProps={{
                  pattern: '^\\d*\\.?\\d*$',
                  maxLength: 9
                }}
                InputLabelProps={{
                  shrink: true
                }}
                InputProps={{
                  onFocus: this.handleFocus,
                  onBlur: this.handleBlur,
                  endAdornment: (
                    <ButtonGroup
                      className={isFocused ? 'fade-in' : 'fade-out'}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => this.handle2xButtonClick()}
                        style={{ marginTop: '8px' }}
                      >
                        2x
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => this.handleHalfXButtonClick()}
                        style={{ marginTop: '8px' }}
                      >
                        1/2x
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => this.handleMaxButtonClick()}
                        style={{ marginTop: '8px' }}
                      >
                        Max
                      </Button>
                    </ButtonGroup>
                  ),
                }}
                onChange={e => {
                  if (this.props.game_type === 'Quick Shoot') {
                    this.props.onChangeState({
                      bet_amount: e.target.value,
                      public_bet_amount: convertToCurrency(
                        (this.props.qs_game_type - 1) *
                        (parseInt(e.target.value) || ''),
                        solPrice
                      ),
                      max_return: this.props.qs_game_type * e.target.value
                    });
                  } else {
                    this.props.onChangeState({
                      bet_amount: e.target.value,
                      max_return: (parseInt(e.target.value) || 0) * 2
                    });
                  }
                }}
              /></ThemeProvider>
          </div>

        </div>

      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  socket: state.auth.socket,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DefaultBetAmountPanel);
