import React, { Component } from 'react';
import { connect } from 'react-redux';
import { renderLottieAnimation } from '../../util/LottieAnimations';
import { acQueryMyItem } from '../../redux/Item/item.action';
import {
  Button,
  TextField,
  Tooltip,
  InputAdornment,
  Slider,
  FormControlLabel,
  Radio
} from '@material-ui/core';
import { Info } from '@material-ui/icons';
import styled from 'styled-components';
import { setFocused } from '../../redux/Auth/user.actions.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons'
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;
import { makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles({
  redTooltip: {
    backgroundColor: 'red',
    color: 'white',
    fontSize: '1em',
    padding: 8,
  },
  slider: {
    color: 'red',
    height: 8,
    '& .MuiSlider-thumb': {
      backgroundColor: 'red',
      border: '2px solid red',
      height: 24,
      width: 24,
      '&:focus, &:hover, &:active': {
        boxShadow: '0 0 0 8px rgba(255, 0, 0, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      height: 8,
    },
    '& .MuiSlider-rail': {
      height: 8,
    },
  },
});

const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #8a0290, #cf0c0e);
  border-radius: 20px;
  padding: 10px;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  cursor: pointer;
  -webkit-transition: -webkit-transform 0.2s;
  -webkit-transition: transform 0.2s;
  transition: transform 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    border: 3px solid #fff;
    transform: scale(1.03);
  }
`;

class AdvancedSettings extends Component {
  constructor(props) {
    super(props);
    // Initializing the stopLossValue based on lower and upper limits from props
    this.state = {
      selectedBackgroundId: null,
      stopLossValue: [
        props.lowerLimit || props.endgame_amount * 0.25 || 0,
        props.upperLimit || props.endgame_amount * 1.25 || 100,
      ],
    };
  }

  async componentDidMount() {
    console.log("bet", this.props.bet_amount);
    const { acQueryMyItem } = this.props;
    await acQueryMyItem(100, 1, 'price', '653ee7df17c9f5ee2124564a');
  }

  onFocusHandler = () => {
    this.props.setFocused(true);
  }

  onBlurHandler = () => {
    this.props.setFocused(false);
  }

  handleSliderChange = (event, newValue) => {
    this.setState({ stopLossValue: newValue });
    this.props.onChangeState({ stopLossValue: newValue });
  }

  render() {
    const classes = useStyles;
    const { lowerLimit, upperLimit, endgame_amount } = this.props;

    // Debugging: Check if limits are correctly received
    console.log('Lower Limit:', lowerLimit);
    console.log('Upper Limit:', upperLimit);

    return (
      <div id="advanced_panel">
        {this.props.child_step === 1 && (
          <div className="game-privacy-panel game-info-panel">
            <h3 className="game-sub-title">Privacy&nbsp;<Tooltip
              style={{ position: "absolute", right: "20px" }}
              title={'Set private to require players enter a password to play'}
              placement="top"
            >
              <Info style={{ cursor: "pointer", float: "right" }} />
            </Tooltip></h3>
            <div className="radio-button-group bet-amounts">
              <Button
                className={!this.props.is_private ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({
                    is_private: false,
                    room_password: ''
                  });
                }}
              >
                <img
                  width="20px"
                  src={'/img/icons/public.svg'}
                  alt={`Public Game`}
                />
                Public
              </Button>
              <Button
                className={this.props.is_private ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({ is_private: true });
                }}
              >
                <img
                  width="20px"
                  src={'/img/icons/private.svg'}
                  alt={`Private Game`}
                />
                Private
              </Button>
              <TextField
                type="text"
                id="betamount"
                variant="filled"
                InputLabelProps={{
                  shrink: true
                }}
                value={this.props.room_password}
                onChange={e => {
                  this.props.onChangeState({ room_password: e.target.value });
                }}
                className={this.props.is_private === true ? '' : ' hidden'}
              />
            </div>
          </div>
        )}

        {this.props.child_step === 2 && (
          <div className="game-info-panel payout-info-panel">
            <h3 className="game-sub-title">Payout&nbsp;
              <Tooltip
                style={{ position: "absolute", right: "20px" }}
                title={'Choose Automatic to be paid into your balance each time the set threshold has been reached'}
                placement="top"
              >
                <Info style={{ cursor: "pointer", float: "right" }} />
              </Tooltip>
            </h3>
            <div className="select-buttons-panel bet-amounts">
              <Button
                className={!this.props.endgame_type ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({ endgame_type: false });
                }}
              >
                <img
                  width="20px"
                  src={'/img/icons/manual.svg'}
                  alt={`Manual Game`}
                />
                Manual
              </Button>
              <Button
                className={this.props.endgame_type ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({ endgame_type: true });
                }}
              >
                <img
                  width="20px"
                  src={'/img/icons/automatic.svg'}
                  alt={`Automatic Game`}
                />
                Automatic
              </Button>
              <div className={`edit-amount-panel ${this.props.endgame_type ? '' : 'hidden'}`}>
                <TextField
                  type="text"
                  variant="filled"
                  name="endgame_amount"
                  id="endgame_amount"
                  value={this.props.endgame_amount}
                  inputProps={{
                    pattern: '[0-9]*',
                    maxLength: 9
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        &nbsp;RPS
                      </InputAdornment>
                    ),
                  }}
                  onChange={e => {
                    const value = e.target.value;
                    const lowerLimit = value * 0.25;
                    const upperLimit = value * 1.25;

                    if (this.props.game_mode === 'Mystery Box') {
                      this.props.onChangeState({
                        endgame_amount: value,
                        lowerLimit,
                        upperLimit,
                        winChance: this.props.calcMysteryBoxEV(
                          this.props.box_list,
                          value,
                          this.props.max_return
                        )
                      });
                    } else if (this.props.game_mode === 'Spleesh!') {
                      this.props.onChangeState({
                        endgame_amount: value,
                        lowerLimit,
                        upperLimit,
                        winChance: this.props.calculateEV(
                          this.props.bet_amount,
                          value,
                          this.props.spleesh_bet_unit
                        )
                      });
                    } else {
                      this.props.onChangeState({
                        endgame_amount: value,
                        lowerLimit,
                        upperLimit
                      });
                    }
                  }}
                  placeholder="PAYOUT"
                />
              </div>

              {/* Stop Loss Section */}
              {/* {this.props.endgame_type && (
                <div className="stop-loss-panel">
                  <FormControlLabel
                    control={<Radio />}
                    label="Stop Loss"
                  />
                  <Slider
                    className={classes.slider}
                    onChange={this.handleSliderChange}
                    value={this.state.stopLossValue}
                    min={this.props.lowerLimit || endgame_amount * 0.25 || 0}
                    max={this.props.upperLimit || endgame_amount * 1.25 || 100}
                    valueLabelDisplay="auto"
                    ValueLabelComponent={(props) => (
                      <Tooltip {...props} classes={{ tooltip: classes.redTooltip }} />
                    )}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: "100%",
                      boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8",
                      borderRadius: "9px",
                      justifyContent: "center",
                      padding: "5px 10px",
                      overflow: "hidden",
                      pointerEvents: this.props.ai_mode === "Martingale" ? "none" : "auto",
                      filter: this.props.ai_mode === "Martingale" ? "grayscale(100%)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "x-small", color: "#ff0000" }}>
                      {`Lower Limit: ${this.props.lowerLimit || endgame_amount * 0.25 || 0}, Upper Limit: ${this.props.upperLimit || endgame_amount * 1.25 || 100}`}
                    </span>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        )}

        {/* {this.props.child_step === 3 && (
          <div className="game-music-panel game-info-panel">
            <h3 className="game-sub-title">Add music?</h3>
            <form
              style={{ display: 'flex' }}
              onSubmit={this.props.handleSubmit}
            >
              <TextField
                label="YouTube URL"
                variant="filled"
                value={this.props.youtubeUrl}
                onChange={this.props.handleUrlChange}
              />
              <Button style={{ marginLeft: "10px !important" }} type="submit" variant="contained" color="primary">
                Play
              </Button>
            </form>
            {this.props.isPlaying && (
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${this.props.videoId}?autoplay=1`}
                title="YouTube Music Player"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
            <p className="tip">ENTER A YOUTUBE URL AND CLICK PLAY</p>
          </div>
        )}
        {this.props.child_step === 4 && (
          <div className="game-background-panel game-info-panel">
            <h3 className="game-sub-title">Add Background?</h3>
            <ProductGrid>
              {this.props.data
                .filter(row => row.item_type === "653ee7df17c9f5ee2124564a")
                .map(row => (
                  <ProductCard
                    key={row._id}
                    onClick={() => {
                      this.setState({ selectedBackgroundId: row._id });
                      this.props.onChangeState({
                        gameBackground: row.image
                      });
                    }}
                    className={
                      this.state.selectedBackgroundId === row._id
                        ? 'selected'
                        : ''
                    }
                  >
                    {row.image && renderLottieAnimation(row.image) ? (
                      renderLottieAnimation(row.image)
                    ) : (
                      <img src={row.image} alt={row.productName} />
                    )}
                    <div>{row.productName}</div>
                  </ProductCard>
                ))}
            </ProductGrid>
            <p className="tip">
              GAME BACKGROUNDS AVAILABLE VIA THE MARKETPLACE
            </p>
          </div>
        )} */}
        {this.props.child_step === 3 && (
          <div className="game-background-panel game-info-panel">
            <h3 className="game-sub-title">Add Description?&nbsp;<Tooltip
              style={{ position: "absolute", right: "20px" }}
              title={'Include a description to your game.'}
              placement="top"
            >
              <Info style={{ cursor: "pointer", float: "right" }} />
            </Tooltip></h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <TextField
                label="Description"
                value={this.props.description}
                placeholder='e.g. Play 50 Games and receive 10 RPS TIP!'
                onChange={this.props.handleDescriptionChange}
                fullWidth
                multiline
                onFocus={this.onFocusHandler}
                onBlur={this.onBlurHandler}
                minRows={2}
                variant="filled"


              />&nbsp;<FontAwesomeIcon icon={faPenSquare} />

            </div>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  data: state.itemReducer.myItemArray
});

const mapDispatchToProps = {
  acQueryMyItem,
  setFocused
};

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSettings);
