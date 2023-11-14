import React, { Component } from 'react';
import { connect } from 'react-redux';
import { renderLottieAnimation } from '../../util/LottieAnimations';
import { acQueryMyItem } from '../../redux/Item/item.action';
import { Button, TextField } from '@material-ui/core';
import styled from 'styled-components';

const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #303438, #cf0c0e);
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
    transform: scale(1.03);
  }
`;

  class AdvancedSettings extends Component {
    constructor(props) {
      super(props);
      this.state = {
        selectedBackgroundId: null, // Initialize with no selected background
      };
    }

  async componentDidMount() {
    const { acQueryMyItem } = this.props;
    await acQueryMyItem(10, 1, 'price', '653ee7df17c9f5ee2124564a');
  }


  render() {
    return (
      <div id="advanced_panel">
        {this.props.child_step === 1 && (
          <div className="game-privacy-panel game-info-panel">
            <h3 className="game-sub-title">Privacy</h3>
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
                Public
              </Button>
              <Button
                className={this.props.is_private ? ' active' : ''}
                onClick={() => {
                  
                  this.props.onChangeState({ is_private: true });
                }}
              >
                Private
              </Button>
              <TextField
                type="text"
                id="betamount"
                variant="outlined"
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
            <p>Set to 'Private' to require a password to Join</p>
          </div>
        )}

        {this.props.child_step === 2 && (
          <div className="game-info-panel payout-info-panel">
            <h3 className="game-sub-title">Payout</h3>
            <div className="select-buttons-panel bet-amounts">
              <Button
                className={!this.props.endgame_type ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({ endgame_type: false });
                }}
              >
                Manual
              </Button>
              <Button
                className={this.props.endgame_type ? ' active' : ''}
                onClick={() => {
                  
                  this.props.onChangeState({ endgame_type: true });
                }}
              >
                Automatic
              </Button>
              <div
                className={`edit-amount-panel ${
                  this.props.endgame_type ? '' : 'hidden'
                }`}
              >
                <TextField
                  type="text"
                  variant="outlined"
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
                    endAdornment: 'ETH'
                  }}
                  onChange={e => {
                    if (this.props.game_mode === 'Mystery Box') {
                      this.props.onChangeState({
                        endgame_amount: e.target.value,
                        winChance: this.props.calcMysteryBoxEV(
                          this.props.box_list,
                          e.target.value,
                          this.props.max_return
                        )
                      });
                    } else if (this.props.game_mode === 'Spleesh!') {
                      this.props.onChangeState({
                        endgame_amount: e.target.value,
                        winChance: this.props.calculateEV(
                          this.props.bet_amount,
                          e.target.value,
                          this.props.spleesh_bet_unit
                        )
                      });
                    } else {
                      this.props.onChangeState({
                        endgame_amount: e.target.value
                      });
                    }
                    // this.calcWinChance(this.state.boxList, e.target.value);
                  }}
                  placeholder="PAYOUT"
                />
              </div>
            </div>
            <p className="tip">AUTOMATIC PAYOUTS WHEN BANKROLL HITS VALUE</p>
          </div>
        )}

        {this.props.child_step === 3 && (
          <div className="game-music-panel game-info-panel">
            <h3 className="game-sub-title">Add music?</h3>
            <form
              style={{ display: 'flex' }}
              onSubmit={this.props.handleSubmit}
            >
              <TextField
                label="YouTube URL"
                variant="outlined"
                value={this.props.youtubeUrl}
                onChange={this.props.handleUrlChange}
              />
              <Button type="submit" variant="contained" color="primary">
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
            {this.props.data.map(row => (
              <ProductCard
                key={row._id}
                onClick={() => {
                this.setState({ selectedBackgroundId: row._id }); 
                this.props.onChangeState({
                  gameBackground: row.image
                })
              }}
              className={this.state.selectedBackgroundId === row._id ? 'selected' : ''}
              >
                {row.image && renderLottieAnimation(row.image) ? (
                  renderLottieAnimation(row.image)
                ) : (
                  <img src={row.image} alt={row.productName} />
                )}
                <div>{row.productName}</div>
              </ProductCard>
            ))}
            <p className="tip">
              GAME BACKGROUNDS AVAILABLE VIA THE MARKETPLACE
            </p>
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
  acQueryMyItem
};

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSettings);
