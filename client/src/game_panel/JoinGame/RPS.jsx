import React, { Component } from 'react';
import { connect } from 'react-redux';
import BetArray from '../../components/BetArray';
import Share from '../../components/Share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import YouTubeModal from '../modal/YouTubeModal';
import Moment from 'moment';
import { acQueryMyItem } from '../../redux/Item/item.action';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ReactApexChart from 'react-apexcharts';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import loadingChart from '../LottieAnimations/loadingChart.json';
import { YouTubeVideo } from '../../components/YoutubeVideo';

import {
  Button,
  Switch,
  IconButton,
  Tooltip,
  FormControlLabel
} from '@material-ui/core';
import BetAmountInput from '../../components/BetAmountInput';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';

import animationData from '../LottieAnimations/spinningIcon';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import styled from 'styled-components';
import { convertToCurrency } from '../../util/conversion';
import ImageResultModal from '../modal/ImageResultModal';

const ProductImage = styled.img`
  width: 100px;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 17px #333;
  border-radius: 10px;
`;

const ProductCarousel = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 20px;
  margin-top: -30px;
  max-width: 460px;
  height: 270px;
  padding: 0;
`;

const ProductCard = styled.div`
  position: relative;
  // background: linear-gradient(156deg, #303438, #cf0c0e);
  border-radius: 0.8em;
  display: -ms-flexbox;
  // width: 100px;

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
  transition: transform 0.2s, width 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    // opacity: 0;
    // transition: opacity 0.2s;
  }

  // &:hover::before {
  //   opacity: 1;
  // }

  &:hover {
    transform: scale(1.2);
    width: 350px;
  }
`;

const UseItemButton = styled.div`
  opacity: 0;
    position: absolute;
    margin-top: auto;
    bottom: 0;
    
    margin
    right: 0; 
      cursor: pointer;
      -webkit-transition: -webkit-transform 0.2s;
      -webkit-transition: transform 0.2s;
      transition: transform 0.2s,  bottom 0.2s;

      ${ProductCard}:hover & {
        opacity: 1;
          bottom: calc(50%);;
  `;


const styles = {
  focused: {
    borderColor: '#fa3fa0'
  }
};

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' }
];


class RPS extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      timer: null,
      showImageModal: false,
      image: '',
      productName: '',
      selected_rps: '',
      modalOpen: false,
      startedPlaying: false,
      advanced_status: '',
      is_anonymous: false,
      bet_amount: 0.001,
      bankroll: this.props.bet_amount,
      rps: [],
      betResult: null,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      slippage: 100,
      settings_panel_opened: false,
      animateCard: false
    };
    this.panelRef = React.createRef();
    this.onChangeState = this.onChangeState.bind(this);
  }

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value });
    this.setState({ potential_return: e.target.value * 2 });
  }
  handleOpenModal = () => {
    this.setState({ modalOpen: true });
  };

  handleCloseModal = () => {
    this.setState({ modalOpen: false });
  };

  getPreviousBets() {
    let previousBets = 0;
    if (this.props.roomInfo && this.props.roomInfo.game_log_list) {
      this.props.roomInfo.game_log_list.forEach(room_history => {
        if (room_history.bet_amount) {
          previousBets += parseFloat(room_history.bet_amount);
        }
      });
    }
    return previousBets;
  }

  handleClickOutside = e => {
    if (
      this.settingsRef &&
      this.settingsRef.current &&
      !this.settingsRef.current.contains(e.target)
    ) {
      this.setState({ settings_panel_opened: false });
    }
  };

  async componentDidMount() {
    const { socket, rps_game_type, acQueryMyItem, playSound } = this.props;
    if (socket) {
      socket.on('CARD_PRIZE', data => {
        if (data) {
          this.setState(
            {
              image: data.image,
              productName: data.productName,
              showImageModal: true
            },
            () => playSound('')
          );
        }
      });

      socket.on('UPDATED_BANKROLL', data => {
        this.setState({
          bankroll: data.bankroll,
          rps: data.rps,
          startedPlaying: true
        });
      });

      socket.on('RPS_1', data => {
        if (data && data.length > 0) {
          this.setState({
            rps: data,
            startedPlaying: true
          });
        }
      });

      socket.emit('emitRps');
    }
    // Add event listener conditionally based on rps_game_type
    if (rps_game_type === 0) {
      document.addEventListener('mousedown', this.handleClickOutside);
    }

    if (rps_game_type === 1) {
      // Ensure acQueryMyItem is available
      if (acQueryMyItem) {
        await acQueryMyItem(10, 1, 'price', '653ee7ac17c9f5ee21245649');
        setTimeout(() => {
          this.dealCard();
        }, 1500);
      }
    }
  }

  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };
  dealCard = () => {
    // Create a new card element
    const newCard = document.createElement('div');
    newCard.className = 'card-hidden upside-down animated-card';
    newCard.style.height = '200px';
    newCard.style.width = '130px';
    newCard.style.borderRadius = '1rem';
    newCard.style.marginRight = '10px';

    // Add the new card to the card-container
    const cardContainer = document.querySelector('.card-container');
    cardContainer.insertBefore(newCard, cardContainer.firstChild);

    this.props.playSound('cards');

    const firstCardDashed = cardContainer.querySelector('.card-hidden.dashed');
    if (firstCardDashed.style.display !== 'none') {
      firstCardDashed.style.display = 'none';
    } else {
      // If '.card-hidden.dashed' doesn't exist, look for an element with 'flipped' class
      const firstCardFlipped = cardContainer.querySelector('.flipped');
      if (firstCardFlipped) {
        firstCardFlipped.style.display = 'none';
      }
    }
  };

  flipCard = () => {
    const rpsValueAtLastIndex = this.state.rps[this.state.rps.length - 1]?.rps;
    const cardContainer = document.querySelector('.card-container');
    const card = cardContainer.querySelector('div');
    if (card.classList.contains('card-hidden')) {
      card.classList.remove('card-hidden');
    }

    if (card.classList.contains('animated-card')) {
      card.classList.remove('animated-card');
    }

    this.props.playSound('cards');
    card.classList.add('flipped');

    const backgroundImageURL = '/img/marketplace/blender.svg';
    const updatedBackgroundImageURL = backgroundImageURL.replace(
      'blender',
      rpsValueAtLastIndex
    );
    card.style.backgroundImage = `url('${updatedBackgroundImageURL}')`;
    card.style.backgroundSize = `100%`;

    setTimeout(() => {
      this.dealCard();
    }, 5500);
  };

  drawCard = () => {
    // Create a new card element
    const newCard = document.createElement('div');
    newCard.className = 'animated-rrps-card';
    newCard.style.height = '200px';
    newCard.style.width = '130px';
    newCard.style.borderRadius = '1rem';
    newCard.style.marginLeft = '10px';

    // Replace 'blender' with the value of this.state.selected in the background image URL
    const backgroundImageURL = '/img/marketplace/blender.svg';
    const updatedBackgroundImageURL = backgroundImageURL.replace(
      'blender',
      this.state.selected_rps
    );
    newCard.style.backgroundImage = `url('${updatedBackgroundImageURL}')`;

    const cardContainer = document.querySelector('.card-container');
    const lastCard = cardContainer.querySelector('div:last-child');
    lastCard.style.display = 'none';

    cardContainer.appendChild(newCard);

    this.props.playSound('cards');
  };

  componentDidUpdate(prevProps, prevState) {
    const { roomInfo, actionList } = this.props;
    const { isPasswordCorrect, selected_rps, rps } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }

    if (prevProps.roomInfo && roomInfo) {
      if (prevProps.roomInfo.bet_amount !== roomInfo.bet_amount) {
        this.setState({
          bankroll: parseFloat(roomInfo.bet_amount)
        });
      }
    }

    if (
      prevState.isPasswordCorrect !== isPasswordCorrect &&
      isPasswordCorrect === true
    ) {
      this.joinGame(selected_rps);
    }

    // if (prevState.rps !== rps && rps_game_type === 1) {
    //   this.flipcard();
    // }
  }

  speak = message => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0; // set the speed to 1.0 (normal speed)
      utterance.lang = 'en-US'; // set the language to US English
      window.speechSynthesis.speak(utterance);
    }
  };

  joinGame = async () => {
    const {
      rps_bet_item_id,
      isDarkMode,
      refreshHistory,
      join,
      playSound,
      rps_game_type,
      changeBgColor
    } = this.props;

    const { selected_rps, is_anonymous, slippage, bet_amount } = this.state;
    // console.log('gzi', selected_rps);
    const result = await join({
      bet_amount: parseFloat(bet_amount),
      selected_rps: selected_rps,
      is_anonymous: is_anonymous,
      rps_bet_item_id: rps_bet_item_id,
      slippage: slippage
    });

    let text;
    if (result.betResult === 1) {
      playSound('win');
      text = 'WINNER, WINNER, VEGAN FUCKING DINNER!';
      changeBgColor(result.betResult);
    } else if (result.betResult === 0) {
      text = 'SPLIT! EQUALLY SHIT!';
      playSound('split');
      changeBgColor(result.betResult);
    } else {
      text = 'TROLLOLOLOL! LOSER!';
      playSound('lose');
      changeBgColor(result.betResult);
      if (rps_game_type === 1) {
        this.handleOpenModal();
        this.speak(text);
      }
    }
    if (this.props.rps_game_type === 1) {
      this.flipCard();
    }

    if (
      (result.betResult !== -1 && rps_game_type === 1) ||
      rps_game_type === 0
    ) {
      gameResultModal(
        isDarkMode,
        text,
        result.betResult,
        'Okay',
        null,
        () => {},
        () => {}
      );

      if (result.status !== 'success') {
        if (result.message) {
          alertModal(isDarkMode, result.message);
        }
      }

      let stored_rps_array =
        JSON.parse(localStorage.getItem('rps_array')) || [];
      while (stored_rps_array.length >= 20) {
        stored_rps_array.shift();
      }
      stored_rps_array = stored_rps_array.filter(item => item && item.rps);
      if (rps_game_type === 0) {
        stored_rps_array.push({ rps: selected_rps });
        localStorage.setItem('rps_array', JSON.stringify(stored_rps_array));
      }
      refreshHistory();
    }
  };

  onBtnBetClick = async () => {
    const {
      openGamePasswordModal,
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo
    } = this.props;
    const { bet_amount, bankroll } = this.state;
    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }

    if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    if (localStorage.getItem('hideConfirmModal') === 'true') {
      if (is_private === true && passwordCorrect !== true) {
        openGamePasswordModal();
      } else {
        await this.joinGame();
      }
    } else {
      confirmModalCreate(
        isDarkMode,
        'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
        'Yes',
        'Cancel',
        async () => {
          if (is_private === true && passwordCorrect !== true) {
            openGamePasswordModal();
          } else {
            await this.joinGame();
          }
        }
      );
    }
  };

  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.state.bet_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100000) / 100000;
    this.setState(
      {
        bet_amount: roundedBetAmount
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };

  handle2xButtonClick = () => {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.bet_amount * 2;
    const limitedBetAmount = Math.min(
      multipliedBetAmount,
      maxBetAmount,
      this.props.bet_amount
    );
    const roundedBetAmount = Math.floor(limitedBetAmount * 100000) / 100000;
    this.setState(
      {
        bet_amount: roundedBetAmount
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };

  handleMaxButtonClick = () => {
    const maxBetAmount = Math.floor(this.state.balance * 100000) / 100000; // Round down to two decimal places
    this.setState(
      {
        bet_amount: Math.min(maxBetAmount, this.props.bet_amount)
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };

  render() {
    const {
      showImageModal,
      image,
      bankroll,
      startedPlaying,
      betResult,
      rps,
      selected_rps,
      productName,
      actionList
    } = this.state;
    const {
      bgColorChanged,
      selectedCreator,
      accessory,
      rank,
      isDarkMode,
      isLowGraphics,
      isMusicEnabled,
      handleClosePlayerModal,
      showPlayerModal,
      youtubeUrl,
      roomInfo,
      handleOpenPlayerModal,
      creator_avatar,
      rps_game_type,
      gameBackground,
      playSound,
      betting,
      handleSwitchChange
    } = this.props;
    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    const rpsValueAtLastIndex = rps[rps.length - 1]?.rps;
    return (
      <div className="game-page">
        <div className="page-title">
          {rps_game_type === 1 ? <h2>PLAY - RRPS</h2> : <h2>PLAY - RPS</h2>}{' '}
        </div>
        {showImageModal && (
          <ImageResultModal
            modalIsOpen={showImageModal}
            closeModal={this.toggleImageModal}
            isDarkMode={isDarkMode}
            image={image}
            productName={productName}
          />
        )}
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}
        <div className="game-contents">
          <div className="pre-summary-panel" ref={this.panelRef}>
            <div className="pre-summary-panel__inner">
              {[...Array(1)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="data-item">
                    <div>
                      <div className="label room-id">STATUS</div>
                    </div>
                    <div className="value">{roomInfo.status}</div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label your-bet-amount">Bankroll</div>
                    </div>
                    <div className="value">{convertToCurrency(bankroll)}</div>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">Your Return</div>
                    </div>
                    <div className="value">
                      {convertToCurrency(
                        // updateDigitToPoint2(
                        this.state.bet_amount * 2 /* * 0.95 */
                        // )
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label win-chance">Win Chance</div>
                    </div>
                    <div className="value">33%</div>
                  </div>
                  {roomInfo.endgame_amount > 0 && (
                    <div className="data-item">
                      <div>
                        <div className="label created">Auto-Payout</div>
                      </div>
                      <div className="payout-bar">
                        <div className="value" style={barStyle}></div>
                      </div>
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label net-profit">Host Profit</div>
                    </div>
                    <div className="value bankroll">
                      {actionList && actionList.hostBetsValue.length > 0 ? (
                        <>
                          {convertToCurrency(
                            actionList.hostNetProfit?.slice(-1)[0]
                          )}
                          <ReactApexChart
                            className="bankroll-graph"
                            options={{
                              chart: {
                                animations: {
                                  enabled: false
                                },
                                toolbar: {
                                  show: false
                                },
                                events: {},
                                zoom: {
                                  enabled: false
                                }
                              },
                              grid: {
                                show: false
                              },
                              tooltip: {
                                enabled: false
                              },
                              fill: {
                                type: 'gradient',
                                gradient: {
                                  shade: 'light',
                                  gradientToColors:
                                    actionList.hostNetProfit?.slice(-1)[0] > 0
                                      ? ['#00FF00']
                                      : actionList.hostNetProfit?.slice(-1)[0] <
                                        0
                                      ? ['#FF0000']
                                      : ['#808080'],
                                  shadeIntensity: 1,
                                  type: 'vertical',
                                  opacityFrom: 0.7,
                                  opacityTo: 0.9,
                                  stops: [0, 100, 100]
                                }
                              },

                              stroke: {
                                curve: 'smooth'
                              },
                              xaxis: {
                                labels: {
                                  show: false
                                },
                                axisTicks: {
                                  show: false
                                },
                                axisBorder: {
                                  show: false
                                }
                              },
                              yaxis: {
                                labels: {
                                  show: false
                                },
                                axisTicks: {
                                  show: false
                                },
                                axisBorder: {
                                  show: false
                                }
                              }
                            }}
                            type="line"
                            width={120}
                            height="100"
                            series={[
                              {
                                data: actionList.hostNetProfit.map(
                                  (value, index) => [
                                    actionList.hostBetsValue[index],
                                    value
                                  ]
                                )
                              }
                            ]}
                          />
                        </>
                      ) : (
                        <Lottie
                          options={{
                            loop: true,
                            autoplay: true,
                            animationData: loadingChart
                          }}
                          style={{
                            width: '32px'
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label host-display-name">Host</div>
                    </div>
                    <div className="value host">
                      <a
                        className="player"
                        onClick={() =>
                          handleOpenPlayerModal(this.props.creator_id)
                        }
                      >
                        <Avatar
                          className="avatar"
                          src={creator_avatar}
                          rank={rank}
                          accessory={accessory}
                          alt=""
                          darkMode={isDarkMode}
                        />
                      </a>
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label room-name">Room ID</div>
                    </div>
                    <div className="value">{roomInfo.room_name}</div>
                  </div>
                  {youtubeUrl && (
                    <div className="data-item">
                      <YouTubeVideo
                        url={youtubeUrl}
                        isMusicEnabled={isMusicEnabled}
                      />
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label public-max-return">Created</div>
                    </div>
                    <div className="value">
                      {Moment(roomInfo.created_at).fromNow()}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div
            className="game-info-panel"
            style={{ position: 'relative', zIndex: 10 }}
          >
            {renderLottieAvatarAnimation(gameBackground, isLowGraphics)}
            {this.props.rps_game_type === 1 && (
              <div className="game-background-panel game-info-panel">
                <YouTubeModal
                  open={this.state.modalOpen}
                  onClose={this.handleCloseModal}
                  rps={rpsValueAtLastIndex}
                />

                <div
                  className="card-container"
                  style={{ margin: '30px auto 10px' }}
                >
                  <div
                    className="card-hidden dashed"
                    style={{
                      height: '100%',
                      width: '130px',
                      borderRadius: '1rem',
                      marginRight: '10px'
                    }}
                  ></div>
                  <div
                    className="card-hidden dashed"
                    style={{
                      height: '100%',
                      width: '130px',
                      borderRadius: '1rem',
                      transform: 'rotate(0deg)'
                    }}
                  ></div>
                </div>
                <h3 className="game-sub-title">Select a Card</h3>
                <ProductCarousel>
                  {this.props.data
                    .filter(row => row.item_type === '653ee7ac17c9f5ee21245649')
                    .map(row => (
                      <ProductCard
                        key={row._id}
                        onClick={() => {
                          this.setState(
                            {
                              selected_rps: row.productName
                            },
                            () => {
                              this.drawCard();
                            }
                          );
                        }}
                        className={
                          selected_rps === row.productName ? 'selected' : ''
                        }
                      >
                        <ProductImage src={row.image} alt={row.productName} />
                        {/* <div>{row.productName}</div> */}
                        <UseItemButton>
                          <Tooltip title={'Use Item'}>
                            <IconButton
                              className="btn-back"
                              onClick={() => {
                                this.setState(
                                  { selected_rps: row.productName },
                                  () => {
                                    this.onBtnBetClick(row.productName);
                                  }
                                );
                              }}
                            >
                              Play
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        </UseItemButton>
                      </ProductCard>
                    ))}
                </ProductCarousel>

                <BetAmountInput
                  betAmount={this.state.bet_amount}
                  handle2xButtonClick={this.handle2xButtonClick}
                  handleHalfXButtonClick={this.handleHalfXButtonClick}
                  handleMaxButtonClick={this.handleMaxButtonClick}
                  onChangeState={this.onChangeState}
                  isDarkMode={this.props.isDarkMode}
                />
                <p className="tip">
                  GAME BACKGROUNDS AVAILABLE VIA THE MARKETPLACE
                </p>
              </div>
            )}
            {this.props.rps_game_type === 1 && (
              <div style={{ position: 'absolute' }}>
                <div className="card-back">
                  <div className="rps-logo">
                    <img src={'/img/rps-logo-white.svg'} alt="RPS Game Logo" />
                  </div>
                </div>
              </div>
            )}
            <div className="guesses">
              {rps
                .slice()
                .reverse()
                .map((item, index) => (
                  <p key={index}>{item.rps}</p>
                ))}
            </div>
            {rps_game_type === 0 && (
              <div className="game-info-panel">
                {startedPlaying && (
                  <div id="rps-radio" style={{ zIndex: 1 }} className="fade-in">
                    <div
                      className={`rps-option ${
                        rps[this.state.rps.length - 1]?.rps === 'R'
                          ? 'rock'
                          : ''
                      }${rpsValueAtLastIndex === 'R' ? ' active' : ''}${
                        bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'R'
                          ? ' win-bg'
                          : ''
                      }${
                        betResult === 0 && rpsValueAtLastIndex === 'R'
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && rpsValueAtLastIndex === 'R'
                          ? ' lose-bg'
                          : ''
                      }`}
                    ></div>
                    <div
                      className={`rps-option ${
                        rps[this.state.rps.length - 1]?.rps === 'P'
                          ? 'paper'
                          : ''
                      }${rpsValueAtLastIndex === 'P' ? ' active' : ''}${
                        bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'P'
                          ? ' win-bg'
                          : ''
                      }${
                        betResult === 0 && rpsValueAtLastIndex === 'P'
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && rpsValueAtLastIndex === 'P'
                          ? ' lose-bg'
                          : ''
                      }`}
                    ></div>
                    <div
                      className={`rps-option ${
                        rps[rps.length - 1]?.rps === 'S' ? 'scissors' : ''
                      }${rpsValueAtLastIndex === 'S' ? ' active' : ''}${
                        bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'S'
                          ? ' win-bg'
                          : ''
                      }${
                        betResult === 0 && rpsValueAtLastIndex === 'S'
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && rpsValueAtLastIndex === 'S'
                          ? ' lose-bg'
                          : ''
                      }`}
                    ></div>
                  </div>
                )}
                {!startedPlaying ? (
                  <h3 style={{ zIndex: 9 }} className="game-sub-title">
                    Select: R - P - S!
                  </h3>
                ) : (
                  <h3 style={{ zIndex: 9 }} className="game-sub-title fade-out">
                    Select: R - P - S!
                  </h3>
                )}
                <div id="rps-radio" style={{ zIndex: 1 }}>
                  {options.map(({ classname, selection }) => (
                    <Button
                      variant="contained"
                      id={`rps-${classname}`}
                      className={`rps-option ${classname}${
                        selected_rps === selection ? ' active' : ''
                      }${
                        bgColorChanged &&
                        betResult === -1 &&
                        selected_rps === selection
                          ? ' lose-bg'
                          : ''
                      }${
                        betResult === 0 && selected_rps === selection
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && selected_rps === selection
                          ? ' win-bg'
                          : ''
                      }`}
                      onClick={() => {
                        this.setState({ selected_rps: selection }, () => {
                          this.onBtnBetClick(selection);
                        });
                        playSound('select');
                      }}
                    />
                  ))}
                </div>

                <BetAmountInput
                  betAmount={this.state.bet_amount}
                  handle2xButtonClick={this.handle2xButtonClick}
                  handleHalfXButtonClick={this.handleHalfXButtonClick}
                  handleMaxButtonClick={this.handleMaxButtonClick}
                  onChangeState={this.onChangeState}
                  isDarkMode={isDarkMode}
                />

                <div></div>
              </div>
            )}
          </div>
          {rps_game_type === 0 && (
            <BetArray
              arrayName="rps_array"
              label="rps"
              betting={betting}
              handleSwitchChange={handleSwitchChange}
            />
          )}

          <div className="action-panel">
            <Share roomInfo={roomInfo} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  accessory: state.logic.curRoomInfo.accessory,
  data: state.itemReducer.myItemArray,
  rank: state.logic.curRoomInfo.rank,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal,
  acQueryMyItem
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
