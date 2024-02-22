import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import Lottie from 'react-lottie';
import catBox from '../LottieAnimations/cat_box.json';
import emptyBox from '../LottieAnimations/empty_box.json';
import bananaBox from '../LottieAnimations/banana_box.json';
import ethBox from '../LottieAnimations/eth_box.json';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import ReactApexChart from 'react-apexcharts';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import ImageResultModal from '../modal/ImageResultModal';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@material-ui/core';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength,
  validateBankroll
} from '../modal/betValidations';
import animationData from '../LottieAnimations/spinningIcon';
import loadingChart from '../LottieAnimations/loadingChart.json';

import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { alertModal, confirmModalCreate } from '../modal/ConfirmAlerts';
import ReactModal from 'react-modal';
import Share from '../../components/Share';
import { Card, CardContent, Typography } from '@material-ui/core';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0
  }
};

class MysteryBox extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.settingsRef = React.createRef();

    this.state = {
      bet_amount: 0,
      selected_id:
        this.props.box_list.length > 0 ? this.props.box_list[0]._id : '',
      box_list: this.props.box_list,
      advanced_status: '',
      balance: this.props.balance,
      betResult: this.props.betResult,
      isPasswordCorrect: false,
      isOpen: true,
      bankroll: this.props.roomInfo.host_pr,
      showImageModal: false,
      image: '',
      productName: '',
      timer: null,
      timerValue: 2000,
      hoveredIndex: null,
      intervalId: null,
    };
    // this.handleKeyPress = this.handleKeyPress.bind(this);
  }
  static getDerivedStateFromProps(props, current_state) {
    const { isPasswordCorrect, betResult, balance } = props;

    if (
      current_state.isPasswordCorrect !== isPasswordCorrect ||
      current_state.betResult !== betResult ||
      current_state.balance !== balance
    ) {
      return {
        ...current_state,
        balance,
        isPasswordCorrect,
        betResult
      };
    }

    return null;
  }

  speak = message => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0; // set the speed to 1.0 (normal speed)
      utterance.lang = 'en-US'; // set the language to US English
      window.speechSynthesis.speak(utterance);
    }
  };

  onBoxClicked = e => {
    e.preventDefault();
    this.props.playSound('select');

    if (e.currentTarget.getAttribute('status') === 'opened') {
      return;
    }

    const _id = e.currentTarget.getAttribute('_id');
    const box_price = e.currentTarget.getAttribute('box_price');
    this.props.updateSelectedMb(_id, async () => {
      this.setState({ bet_amount: box_price }, () => {
        this.onBtnBetClick();

      });
    })
  };

  componentDidMount() {
    const { socket, playSound } = this.props;
    // document.addEventListener('keydown', this.handleKeyPress);
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
    socket.on('UPDATED_BOX_LIST', data => {
      this.setState({ box_list: data.box_list });
    });
  }

  componentWillUnmount = () => {
    // document.removeEventListener('keydown', this.handleKeyPress);
    clearInterval(this.state.intervalId);
  };

  componentDidUpdate(prevProps, prevState) {
    const { roomInfo, actionList, refreshHistory, join } = this.props;
    const {
      box_list,
      isPasswordCorrect,
      selected_id,
      bet_amount,
    } = this.state;
    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }
    if (roomInfo && prevProps.roomInfo?.host_pr !== roomInfo.host_pr) {
      this.setState({
        bankroll: parseFloat(roomInfo.host_pr)
      });
    }

    if (prevState.box_list !== box_list) {
      refreshHistory(() => {
        if (isPasswordCorrect && selected_id !== null) {
          join({
            bet_amount,
            selected_id,
          });

          const updatedBoxList = box_list.map(el =>
            el._id === selected_id ? { ...el, status: 'opened' } : el
          );

          this.setState({ box_list: updatedBoxList });
        }
      });
    }
  }

  // handleKeyPress(event) {
  //   const { box_list } = this.state;
  //   if (!isFocused) {
  //     // Iterate over box_list to handle key presses dynamically
  //     for (let i = 0; i < box_list.length; i++) {
  //       const key = `${i + 1}`; // Key will be the index + 1
  //       if (event.key === key) {
  //         if (box_list[i]) {
  //           this.onBoxClicked(box_list[i]);
  //         }
  //         break; // Exit loop after handling key press
  //       }
  //     }
  //   }
  // }


  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };



  onBtnBetClick = async e => {
    const {
      creator_id,
      isAuthenticated,
      user_id,
      isDarkMode,
      is_private,
      openGamePasswordModal,
      roomInfo,
      balance,
      refreshHistory
    } = this.props;
    const { bet_amount } = this.state;

    if (e) {
      e.preventDefault();
    }
    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (bet_amount > balance) {
      alertModal(isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
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
      const result = await confirmModalCreate(
        isDarkMode,
        'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
        'Yes',
        'Cancel',
        async () => {
          if (is_private === true) {
            openGamePasswordModal();
          } else {
            await this.joinGame();
          }
          refreshHistory();
        }
      );
    }
  };

  joinGame = async () => {
    const {
      bet_amount,
    } = this.state;
    const { playSound, refreshHistory, changeBgColor, selected_id } = this.props;

    let stored_bet_array = JSON.parse(localStorage.getItem('bet_array')) || [];
    while (stored_bet_array.length >= 20) {
      stored_bet_array.shift();
    }

    stored_bet_array.push({ bet: bet_amount });
    localStorage.setItem('bet_array', JSON.stringify(stored_bet_array));

    const result = await this.props.join({
      bet_amount: parseFloat(bet_amount),
      selected_id: selected_id,
    });

    if (result.status === 'success') {
      let betResult = '';
      if (result.betResult !== 0) {
        betResult = 'win';
        playSound('win');
        this.speak('PURRFECTO, ISSA MONEY BOX');

        changeBgColor(result.betResult);
      } else {
        betResult = 'lose';
        playSound('lose');
        this.speak('WRONG BOX, DICKHEAD');

        changeBgColor(result.betResult);
      }

      this.setState(prevState => ({
        box_list: prevState.box_list.map(el =>
          el._id === selected_id ? { ...el, status: 'opened' } : el
        ),
        isOpen: true,
      }));

      setTimeout(() => {
        this.setState({ isOpen: false });
      }, 1500);

      refreshHistory();

    }
  };

  onBtnGoToMainGamesClicked = e => {
    e.preventDefault();
    history.push('/');
  };

  handleHover = (index) => {
    this.setState({ hoveredIndex: index });
  };

  // Function to handle mouse leave
  handleMouseLeave = () => {
    this.setState({ hoveredIndex: null });
  };

  getBetForm = () => {
    const {
      bankroll,
      showImageModal,
      actionList,
      productName,
      image
    } = this.state;
    const {
      selectedCreator,
      showPlayerModal,
      roomInfo,
      isLowGraphics,
      isMusicEnabled,
      isDarkMode,
      bgColorChanged,
      borderColor,
      betResult,
      selected_id
    } = this.props;

    let prizes = [];
    let prices = [];
    let openedBoxes = 0;
    let prizeSum = 0;
    let priceSum = 0;
    let priceCount = 0;
    let pr = 0;
    let numPrizesGreaterThanPrices = 0; // Initialize counter

    this.state.box_list.map(row => {
      prizes.push({
        prize: row.box_prize,
        status: row.status
      });
      prices.push({
        price: row.box_price,
        status: row.status
      });
      pr = pr < row.box_prize ? row.box_prize : pr;

      if (row.status === 'init') {
        prizeSum += row.box_prize;
        priceSum += row.box_price;
        priceCount++;
        if (row.box_prize > row.box_price) {
          numPrizesGreaterThanPrices++;
        }
      } else {
        openedBoxes += row.box_price;
      }
      return true;
    });
    prizes.sort((a, b) => a.prize - b.prize);

    let averagePrice = priceCount > 0 ? priceSum / priceCount : 0;
    let guesses =
      (this.props.roomInfo.endgame_amount - prizeSum - openedBoxes) /
      averagePrice;
    let attempts = guesses < 1 ? 1 : guesses;
    const styles = ['copy-btn'];
    let text = 'COPY CONTRACT';

    if (this.state.clicked) {
      styles.push('clicked');
      text = 'COPIED!';
    }

    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };

    const uniquePrizes = prizes
      .reduce((accumulator, item) => {
        const existingItem = accumulator.find(
          element => element.prize === item.prize
        );
        if (existingItem) {
          existingItem.count += 1;
        } else {
          accumulator.push({ prize: item.prize, count: 1 });
        }
        return accumulator;
      }, [])
      .sort((a, b) => b.prize - a.prize);

    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Mystery Box</h2>
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
            closeModal={this.props.handleClosePlayerModal}
          // {...this.state.selectedRow}
          />
        )}
        <div className="game-contents">
          <div
            className="pre-summary-panel"
            ref={this.panelRef}
          // onScroll={this.handleScroll}
          >
            <div className="pre-summary-panel__inner mystery-box">
              {[...Array(1)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="data-item">
                    <div>
                      <div className="label room-id">STATUS</div>
                    </div>
                    <div className="value">{this.props.roomInfo.status}</div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label your-bet-amount">Bankroll</div>
                    </div>
                    <div className="value bankroll">
                      {convertToCurrency(this.state.bankroll)}
                    </div>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">Your Return</div>
                    </div>
                    <div className="value">{convertToCurrency(pr)}</div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label win-chance">Win Chance</div>
                    </div>
                    <div className="value">
                      {(
                        (this.calculateProbability(
                          prizes.length,
                          guesses,
                          numPrizesGreaterThanPrices
                        ) || numPrizesGreaterThanPrices / prizes.length) * 100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                  {this.props.roomInfo.endgame_amount > 0 && (
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
                          this.props.handleOpenPlayerModal(
                            this.props.creator_id
                          )
                        }
                      >
                        <Avatar
                          className="avatar"
                          src={this.props.creator_avatar}
                          rank={this.props.rank}
                          accessory={this.props.accessory}
                          alt=""
                          darkMode={this.props.isDarkMode}
                        />
                      </a>
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label room-name">Room ID</div>
                    </div>
                    <div className="value">{this.props.roomInfo.room_name}</div>
                  </div>
                  {this.props.youtubeUrl && (
                    <div className="data-item">
                      <YouTubeVideo url={this.props.youtubeUrl} isMusicEnabled={isMusicEnabled} />
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label public-max-return">Created</div>
                    </div>
                    <div className="value">
                      {Moment(this.props.roomInfo.created_at).fromNow()}
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
            {renderLottieAvatarAnimation(this.props.gameBackground, isLowGraphics)}

            <h3 className="game-sub-title">Prizes</h3>
            <Table className="prize-key">
              <TableBody>
                {uniquePrizes.map((item, key) => (
                  <TableRow key={key}>
                    <TableCell>
                      <span className={item.prize === 0 ? 'EMPTY' : ''}>
                        {item.prize === 0
                          ? 'EMPTY'
                          : convertToCurrency(item.prize)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {((item.count / prizes.length) * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <h3 className="game-sub-title">
              {attempts.toFixed(2)} guesses remaining
            </h3>
            <div className="boxes-panel boxes-join" style={{
              border: `3px solid ${borderColor}`,
              boxShadow: `0 0 20px ${borderColor}`
            }}>
              {this.state.box_list.map((row, index) => (
                <a
                  style={{ display: "flex", justifyContent: "center", alignContent: "center", alignItems: "center", padding: "2.5px", borderRadius: "0.6em" }}
                  className="hover-translate"
                  onMouseEnter={() => this.handleHover(index)} // Handle hover
                  onMouseLeave={this.handleMouseLeave}
                >

                  <Card
                    variant="filled"
                    className={
                      'box box-' +
                      row.status +
                      (selected_id &&
                        row._id === selected_id
                        ? ' active'
                        : '') +
                      (row._id === selected_id &&
                        bgColorChanged &&
                        betResult === -1
                        ? ' draw-bg'
                        : '') +
                      (row._id === selected_id &&
                        betResult === 0
                        ? ' lose-bg'
                        : '') +
                      (row._id === selected_id &&
                        betResult === 1
                        ? ' win-bg'
                        : '')
                    }
                    status={row.status}
                    _id={row._id}
                    box_price={row.box_price}
                    index={index}
                    key={row._id}
                    onClick={this.onBoxClicked}
                  // onMouseEnter={() => console.log(row)}
                  >
                    <CardContent>
                      <Typography color="textSecondary">
                        {convertToCurrency(row.box_price)}
                      </Typography>
                      <Lottie
                        options={{
                          loop: true,
                          autoplay: true,
                          animationData:
                            row.status === "init"
                              ? emptyBox
                              : row.status === "opened"
                                ? row.box_price > 0 && row.box_prize > 0 && row.box_price > row.box_prize
                                  ? bananaBox
                                  : row.box_price > 0 && row.box_price < row.box_prize
                                    ? ethBox
                                    : catBox
                                : catBox,
                        }}
                        height={150} // Set the height of the animation
                        width={150}
                        style={{
                          marginTop: "-30px", marginBottom: "-60px",
                          transition: "transform 0.3s ease",
                          transform: this.state.hoveredIndex === index ? 'translateY(-4px)' : 'translateY(0)',
                        }}
                      />

                      {/* <span  style={{ width: "35px", height: "20px", float: "right", marginBottom: "10px" , marginRight: "-5px" }} className="roll-tag">[{index + 1}]</span> */}

                    </CardContent>



                  </Card>
                </a>

              ))}
            </div>

          </div>

          <div className="action-panel">
            <Share roomInfo={this.props.roomInfo} />
          </div>
        </div>
      </div>
    );
  };

  onBtnPlayAgainClicked = e => {
    e.preventDefault();
    if (this.props.roomStatus === 'finished') {
      alertModal(this.props.isDarkMode, 'THIS STAKE HAS ENDED');
      history.go('/');
    } else {
      this.setState({ isOpen: false });
    }
  };

  calculateProbability = (numBoxes, numGuesses, numPrizes) => {
    // Calculate probability of not winning
    let probabilityNotWinning = 1;
    for (let i = 0; i < numGuesses; i++) {
      probabilityNotWinning *= (numBoxes - numPrizes - i) / (numBoxes - i);
    }

    // Calculate probability of winning
    let probabilityWinning = 1 - probabilityNotWinning;

    return probabilityWinning;
  };

  getBetResultForm = () => {
    const { betResult } = this.props;
    let prizes = [];
    this.state.box_list.map(row => {
      prizes.push({
        prize: row.box_prize,
        status: row.status
      });
      return true;
    });
    prizes.sort((a, b) => a.prize - b.prize);
    let timeLeft = 1500; // duration of modal in milliseconds
    const intervalId = setInterval(() => {
      timeLeft -= 100;
      if (timeLeft === 0) {
        clearInterval(intervalId);
      }
    }, 100);

    return (
      <div className="game-page">
        <div className="mystery-box-result-contents">
          <div className="game-info-panel">
            <h4 className="game-sub-title" style={{ marginTop: '30px' }}>
              {betResult === 0
                ? `WRONG BOX DICKHEAD!`
                : `NICE, ISSA MONEY BOX`}
            </h4>
            <p className="game-modal box-prizes">
              {prizes.map((item, key) => (
                <span className={item.status} key={key}>
                  {convertToCurrency(item.prize === 0 ? 'EMPTY' : item.prize)}
                </span>
              ))}
            </p>
            <div style={{ marginBottom: "30px" }}
              className={`mystery-box-result ${betResult === 0 ? 'failed' : 'success'
                }`}
            >
              {convertToCurrency(betResult)}
            </div>
            {/* <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: betResult === 0 ? emptyBox : catBox,
              }}
              height={200} // Set the height of the animation
              width={200}
              style={{ marginTop: "-70px", marginBottom: "-30px", transform: "translate(15px)" }}
            /> */}
          </div>
          <div className="countdown-timer">
            <div
              className="countdown-bar"
              style={{ width: `${(timeLeft / 1500) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { betResult } = this.props;
    return (
      <div>
        {this.getBetForm()}
        {betResult !== -1 && this.state.isOpen && (
          <ReactModal
            isOpen={this.state.isOpen}
            contentLabel="Prizes"
            closeModal={this.onBtnPlayAgainClicked}
            style={customStyles}
          >
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
              <div className="modal-header">
                <h2>PRIZE</h2>
                <Button
                  className="btn-close"
                  onClick={this.onBtnPlayAgainClicked}
                >
                  ×
                </Button>
              </div>
              <div className="modal-body edit-modal-body">
                {this.getBetResultForm()}
              </div>
            </div>
          </ReactModal>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  balance: state.auth.balance,
  betResult: state.logic.betResult,
  roomStatus: state.logic.roomStatus,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  creator: state.logic.curRoomInfo.creator_name,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  rank: state.logic.curRoomInfo.rank,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled,
  isFocused: state.auth.isFocused

});

const mapDispatchToProps = {
  openGamePasswordModal
};

export default connect(mapStateToProps, mapDispatchToProps)(MysteryBox);
