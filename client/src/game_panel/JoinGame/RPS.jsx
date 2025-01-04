import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import Moment from 'moment';
import { acQueryMyItem } from '../../redux/Item/item.action';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { Info } from '@material-ui/icons';
import Avatar from '../../components/Avatar';
import progress from '../LottieAnimations/progress.json';
import pressHold from '../LottieAnimations/pressHold.json';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import { updateRoomBot, kickBots } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faMoneyBillWave, faBrain, faBan } from '@fortawesome/free-solid-svg-icons';
import ViewIcon from '@material-ui/icons/Visibility';
import SwordsIcon from '@material-ui/icons/VisibilityOff';
import {
  getRpsBetItems,
  getRoomBotCount,
} from '../../redux/Logic/logic.actions';
import {
  Button,
  Switch,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import BetAmountInput from '../../components/BetAmountInput';
import Lottie from 'react-lottie';
import {
  validateIsAuthenticated,
  validateCreatorId,
  callBot,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';

import {
  alertModal,
  confirmModalCreate,
} from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';
import ImageResultModal from '../modal/ImageResultModal';
import { setSpectateMode } from '../../redux/Auth/user.actions';

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' }
];

class RPS extends Component {
  constructor(props) {
    super(props);

    this.socket = this.props.socket;
    this.state = {
      timer: null,
      showImageModal: false,
      image: '',
      productName: '',
      selected_rps: this.props.selected_rps,
      modalOpen: false,
      players: [],
      botsCount: 0,
      intervalDuration: 500,
      roomsCount: 0,
      startedPlaying: false,
      isQbot: false,
      advanced_status: '',
      status: this.props.roomInfo.status,
      betResult: 0,
      bankroll: this.props.bankroll,
      host_pr: this.props.roomInfo.host_pr,
      rps: [],
      prev_rps: [],
      isPasswordCorrect: this.props.isPasswordCorrect,
    };
    this.panelRef = React.createRef();
    this.onChangeState = this.onChangeState.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.isComponentMounted = false;
  }

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value, isMax: false, potential_return: e.target.value * 2 });
  }
  handleOpenModal = () => {
    this.setState({ modalOpen: true });
  };

  handleCloseModal = () => {
    this.setState({ modalOpen: false });
  };


  handleClickOutside = e => {
    if (
      this.settingsRef &&
      this.settingsRef.current &&
      !this.settingsRef.current.contains(e.target)
    ) {
      this.setState({ settings_panel_opened: false });
    }
  };


  handleSpectateMode = () => {
    this.props.setSpectateMode(!this.props.isWatching);
  };

  async componentDidMount() {
    this.isComponentMounted = true;
    document.addEventListener('keydown', this.handleKeyPress);
    this.setState({ intervalId: setInterval(this.toggleBlueishHue, this.state.intervalDuration) });
    this.setupSocket();

    try {
      const botsCount = await this.props.getRoomBotCount(this.props.roomInfo._id);
      if (this.isComponentMounted) {
        this.setState({
          botsCount: botsCount,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  setupSocket() {
    document.addEventListener('keydown', this.handleKeyPress);
    this.setState({ intervalId: setInterval(this.toggleBlueishHue, this.state.intervalDuration) });

    const initializeSocket = async () => {
      try {
        const { socket, rps_game_type, acQueryMyItem, playSound, roomInfo, user_id } = this.props;
        const initializedSocket = socket || null;
        this.setState({ socket: initializedSocket });

        if (initializedSocket) {

          initializedSocket.on(`UPDATED_BANKROLL_${roomInfo._id}`, this.handleSocketData);
          initializedSocket.on(`UPDATED_BANKROLL2_${roomInfo._id}`, this.handleSocketData2);
        } else {
          setTimeout(initializeSocket, 3000);
        }


      } catch (error) {
        console.error('Socket initialization failed:', error);
        setTimeout(initializeSocket, 3000);
      }
    };

    initializeSocket();
  }

  removeSocketListeners() {
    const { socket, roomInfo } = this.props;
    if (socket) {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, this.handleSocketData);
    }
  }

  handleSocketData = (data) => {
    if (!data) {
      console.error("Error: Received undefined or null data from the socket.");
      return;
    }
    this.setState(prevState => {
      let updatedPlayers = [...prevState.players, data.user];
      if (updatedPlayers.length > 5) {
        updatedPlayers.shift();
      }
      this.props.playSound('blip');
      if (!data.rps) {
        return prevState;
      }

      let filteredRPS = data.rps.filter(game => game.joiner === this.props.user_id);
      let rpsState = filteredRPS.length > 0 ? filteredRPS : prevState.rps;
      this.props.onChangeState({ bankroll: data.bankroll });
      return {
        host_pr: data.host_pr,
        rps: this.props.isWatching ? rpsState : data.rps,
        prev_rps: data.rps,
        startedPlaying: true,
        players: updatedPlayers
      };
    });
  };

  handleSocketData2 = (data) => {
    this.props.onChangeState({ bankroll: data.bankroll });

  };

  componentWillUnmount() {
    this.isComponentMounted = false;
    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearInterval(this.state.intervalId);
    this.removeSocketListeners();
  }


  handleKeyPress(event) {
    const { isFocused } = this.props;
    const ctrlKeyPressed = event.ctrlKey || event.metaKey;
    const isRKeyPressed = event.key === 'r';

    if (!isFocused && !(ctrlKeyPressed && isRKeyPressed)) {
      switch (event.key) {
        case 'r':
          this.onBtnBetClick('R');
          break;
        case 'p':
          this.onBtnBetClick('P');
          break;
        case 's':
          this.onBtnBetClick('S');
          break;
        default:
          break;
      }
    }
  }

  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };


  async componentDidUpdate(prevProps, prevState) {
    const { roomInfo, actionList, selected_rps, is_betting } = this.props;
    const { isPasswordCorrect, rps } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }

    if (prevProps.isWatching !== this.props.isWatching) {
      this.removeSocketListeners();
      this.setupSocket();
    }
  
    if (prevProps.is_betting !== is_betting && !is_betting) {
      const prevLastItemId = this.props.rpsbetitems.length > 4 ? this.props.rpsbetitems.slice(0, 5).reverse()[4]._id : null;
      const currentLastItemId = rps.length > 4 ? rps[4]._id : null;

      if (prevLastItemId === currentLastItemId) {
        await this.props.getRpsBetItems(roomInfo._id);
        this.setState({
          rps: this.props.rpsbetitems.slice(0, 5).reverse(),
          prev_rps: this.props.rpsbetitems.slice(0, 5).reverse()
        });
      }
    }

    if (prevProps.roomInfo && roomInfo) {
      if (prevProps.roomInfo.host_pr !== roomInfo.host_pr) {
        this.setState({
          host_pr: parseFloat(roomInfo.host_pr)
        });
      }
    }

    if (
      prevState.isPasswordCorrect !== isPasswordCorrect &&
      isPasswordCorrect === true
    ) {
      this.joinGame(selected_rps);
    }

  }


  toggleBlueishHue() {
    const elements = document.querySelectorAll('.rps-radio-host');
    elements.forEach(element => {
      element.classList.toggle('blueish-hue');
    });
  }

  joinGame = async () => {
    const {
      join,
      playSound,
      rps_game_type,
      changeBgColor,
      selected_rps,
      onChangeState,
      solPrice,
      bet_amount
    } = this.props;

    onChangeState({ result: '' });
    const result = await join({
      bet_amount: parseFloat(bet_amount),
      selected_rps: selected_rps,
    });


    let text;
    let color;

    if (result.betResult === 1) {
      playSound('win');
      text = '+';
      color = '#7ed321';
      changeBgColor(result.betResult);
    } else if (result.betResult === 0) {
      text = '-';
      color = 'grey';
      playSound('split');
      changeBgColor(result.betResult);
    } else {
      text = '-';
      color = '#f50000';
      playSound('lose');
      changeBgColor(result.betResult);
    }

    const currencyElement = convertToCurrency(Math.abs(result.amount), solPrice);

    const fragmentStyle = {
      color: color,
    };

    onChangeState({
      result: (
        <React.Fragment>
          <span style={fragmentStyle}> {text} {currencyElement}</span>
        </React.Fragment>
      ), gameResult: result.betResult
    });

  };

  handleBotClick = () => {
    const { creator_id, user_id, roomInfo, isDarkMode, updateRoomBot } = this.props;
    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      callBot(creator_id, roomInfo._id, user_id, isDarkMode, async () => {
        const botAttached = await updateRoomBot(roomInfo._id);
        if (botAttached) {
          this.setState(prevState => ({
            botsCount: prevState.botsCount + 1
          }));
        }
      });
    }
  }

  bootBots = async () => {
    const { creator_id, user_id, roomInfo, kickBots } = this.props;
    this.setState({ botsCount: 0 }, async () => {
      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        await kickBots(roomInfo._id);
      }
    });
  }

  handleEndClick = async () => {
    const { roomInfo } = this.props;
    if (roomInfo.status !== 'finished') {
      await this.props.endGame(roomInfo._id);
      this.setState({ status: 'finished' });
    } else {
      alertModal(
        this.props.isDarkMode,
        "THIS GAME HAS ALREADY ENDED."
      );
    }
  }

  // Child Component
  onBtnBetClick = async (selection) => {
    const {
      openGamePasswordModal,
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo,
      updateSelectedRps,
      bankroll,
      bet_amount
    } = this.props;

    updateSelectedRps(selection, async () => {
      // Code to execute after the state has been updated

      if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
        return;
      }


      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        callBot(creator_id, roomInfo._id, user_id, isDarkMode, async () => {
          const botAttached = await updateRoomBot(roomInfo._id);
          if (botAttached) {
            this.setState(prevState => ({
              botsCount: prevState.botsCount + 1
            }));
          }
        });
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
    });
  };


  render() {
    const {
      showImageModal,
      image,
      startedPlaying,
      rps,
      productName,
      botsCount,
      players,
      prev_rps,
      host_pr,
      status,
      intervalDuration,
      isQbot
    } = this.state;
    const {
      bgColorChanged,
      selectedCreator,
      isDarkMode,
      isLowGraphics,
      handleDetachAttachChange,
      handleClosePlayerModal,
      showPlayerModal,
      ai_mode,
      balance,
      attached,
      getAttachedRooms,
      betting,
      is_betting,
      predictedBetAmount,
      betResult,
      roomInfo,
      handleOpenPlayerModal,
      creator_avatar,
      rps_game_type,
      strategies,
      creator_id,
      user_id,
      isWatching,
      endgame_type,
      pr,
      playSound,
      cp
    } = this.props;
    
    const rpsValueAtLastIndex = rps[rps.length - 1]?.rps;
    const joinerRpsValueAtLastIndex = rps[rps.length - 1]?.joiner_rps;

    if (this.props.is_betting) {
      const intervalId = setInterval(this.toggleBlueishHue, intervalDuration);
      const flashingDuration = 2000;
      setTimeout(() => {
        clearInterval(intervalId);
        document.querySelectorAll('.rps-radio-host').forEach(element => {
          element.classList.remove('blueish-hue');
        });
      }, flashingDuration);
    }
    

    return (
      <div className="game-page">
   
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
        <div className="game-contents title">
         
          <div
            className="game-info-panel"
            style={{ position: 'relative', zIndex: 10 }}
          >
            
            <div className="guesses">
              <div>

                {prev_rps
                  .slice()
                  .map((item, index) => (
                    <p key={index}>{item.rps}</p>
                  ))}
              </div>
              <div>

                {this.state.players.length !== 0 && (
                  <>
                    {this.state.players.slice(0, 5).map((player, index) => (
                      <div key={index} style={{ opacity: "0.4", width: "29px", cursor: "pointer" }}>
                        <a
                          className="avatar"
                          onClick={() =>
                            handleOpenPlayerModal(player._id)
                          }
                        >
                          <Avatar
                            className="avatar"
                            src={player.avatar}
                            rank={player.totalWagered}
                            username={player.username}
                            accessory={player.accessory}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                        </a>

                      </div>
                    ))}
                  </>

                )}
              </div>
            </div>

            {status === 'open' ? (
              <>
                <Tooltip title={!isWatching ? "CLICK TO STOP WATCHING" : "CLICK TO START WATCHING"}>
                  <IconButton className="spectate title" onClick={this.handleSpectateMode}>
                    {isWatching ? <>PLAYING&nbsp;<SwordsIcon /></> : <>SPECTATING&nbsp;<ViewIcon /></>}

                  </IconButton>
                </Tooltip>
                <div className="game-info-panel">
                  <div className={`rps-radio-host ${this.props.is_betting || this.props.betting ? 'blueish-hue' : ''}`} style={{ top: "25px", right: "25px", boxShadow: "0px 0 5px 0px #ffc107", background: "radial-gradient(#ffd000, rgb(255, 0, 0, 0.2)", position: "absolute", width: "12.5px", height: "12.5px", borderRadius: "50%" }}>
                    <span className='result' style={{ display: (!startedPlaying) ? 'none' : 'flex' }}>
                      {this.props.result !== '' ? (
                        <>
                          {this.props.result}
                          {this.props.betting && (

                            <div className='lottie-pressHold'>
                              <Lottie
                                options={{
                                  loop: isLowGraphics ? false : true,
                                  autoplay: isLowGraphics ? false : true,
                                  animationData: pressHold
                                }}
                                style={{
                                  position: 'relative',
                                  filter: `hue-rotate(${this.props.gameResult === -1 ? 0 : (this.props.gameResult === 0 ? 195 : (this.props.gameResult === 1 ? 80 : 20))}deg)`
                                }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span><FontAwesomeIcon icon={faBrain} />&nbsp;<span className='desktop-only'>thinking...</span></span>
                          <div className='lottie-progress'>
                            <Lottie
                              options={{
                                loop: isLowGraphics ? false : true,
                                autoplay: isLowGraphics ? false : true,
                                animationData: progress
                              }}
                              style={{
                                position: 'relative',
                              }}
                            />
                          </div>
                        </>
                      )}
                    </span>
                  </div>

                  {startedPlaying && (
                    <div
                      id="rps-radio"
                      style={{ zIndex: 1 }}
                      className={this.props.ai_mode !== 'Skill-issue' ? '' : ''}
                    >

                      <div
                        className={`rps-option ${rps[this.state.rps.length - 1]?.rps === 'R'
                          ? 'rock'
                          : ''
                          }${rpsValueAtLastIndex === 'R' ? ' active' : ''}${bgColorChanged &&
                            betResult === -1 &&
                            rpsValueAtLastIndex === 'R'
                            ? ' win-bg'
                            : ''
                          }${betResult === 0 && rpsValueAtLastIndex === 'R'
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && rpsValueAtLastIndex === 'R'
                            ? ' lose-bg'
                            : ''
                          }`}
                      ></div>

                      <div
                        className={`rps-option ${rps[this.state.rps.length - 1]?.rps === 'P'
                          ? 'paper'
                          : ''
                          }${rpsValueAtLastIndex === 'P' ? ' active' : ''}${bgColorChanged &&
                            betResult === -1 &&
                            rpsValueAtLastIndex === 'P'
                            ? ' win-bg'
                            : ''
                          }${betResult === 0 && rpsValueAtLastIndex === 'P'
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && rpsValueAtLastIndex === 'P'
                            ? ' lose-bg'
                            : ''
                          }`}
                      ></div>
                      <div
                        className={`rps-option ${rps[rps.length - 1]?.rps === 'S' ? 'scissors' : ''
                          }${rpsValueAtLastIndex === 'S' ? ' active' : ''}${bgColorChanged &&
                            betResult === -1 &&
                            rpsValueAtLastIndex === 'S'
                            ? ' win-bg'
                            : ''
                          }${betResult === 0 && rpsValueAtLastIndex === 'S'
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && rpsValueAtLastIndex === 'S'
                            ? ' lose-bg'
                            : ''
                          }`}
                      ></div>
                    </div>
                  )}
                  {!startedPlaying ? (
                    <h3 style={{ zIndex: 9 }} className="game-sub-title roll-tag">Select: R - P - S! &nbsp;<Tooltip
                      style={{ position: "absolute", right: "20px", marginBottom: "30px" }}
                      title={'Play against the AI, at the same time, train your AI.'}
                      placement="top"
                    >
                      <Info style={{ cursor: "pointer", float: "right" }} />
                    </Tooltip></h3>
                  ) : (

                    <h3 style={{ zIndex: 9 }} className="game-sub-title roll-tag fade-out">Select: R - P - S! &nbsp;<Tooltip
                      style={{ position: "absolute", right: "20px", marginBottom: "30px" }}
                      title={'Play against the AI, at the same time, train your AI.'}
                      placement="top"
                    >
                      <Info style={{ cursor: "pointer", float: "right" }} />
                    </Tooltip></h3>
                  )}
                  <div id="rps-radio" style={{ zIndex: 1, marginTop: "45px" }}>
                    {options.map(({ classname, selection }, index) => (
                      <Button
                        key={index}
                        variant="contained"
                        id={`rps-${classname}`}
                        className={`rps-option ${classname}${joinerRpsValueAtLastIndex === selection ? ' active' : ''}${bgColorChanged && betResult === -1 && joinerRpsValueAtLastIndex === selection ? ' lose-bg' : ''}${betResult === 0 && joinerRpsValueAtLastIndex === selection ? ' draw-bg' : ''}${betResult === 1 && joinerRpsValueAtLastIndex === selection ? ' win-bg' : ''}${this.props.is_betting ? ' disabled' : ''}`} // Add 'disabled' class when this.props.betting is true
                        onClick={() => {
                          if (!this.props.is_betting) { // Check if betting is not in progress
                            this.onBtnBetClick(selection);
                            playSound('select');
                          }
                        }}
                      >&nbsp;<span className="roll-tag">[{selection}]</span></Button>
                    ))}
                  </div>


                  {creator_id && user_id && creator_id.toString() === user_id.toString() ? (
                    <div className='host-controls'>
                      <Button
                        onClick={this.handleBotClick}
                        className="hover-text-button"
                      >
                        <FontAwesomeIcon className="button-icon" icon={faRobot} />
                        <span className="button-text">&nbsp;CALL BOT? [{botsCount}]</span>
                      </Button>
                      {botsCount > 0 && (

                        <Button
                          onClick={this.bootBots}
                          className="hover-text-button"
                        >
                          <FontAwesomeIcon className="button-icon" icon={faBan} />
                          <span className="button-text">&nbsp;KICK BOTS?</span>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                    
                      {this.props.is_mobile && (
                        <AiPanel
                          rpsbetitems={this.props.rpsbetitems}
                          updateUserStrategy={this.props.updateUserStrategy}
                          strategies={strategies}
                          betting={betting}
                          is_betting={is_betting}
                          predictedBetAmount={predictedBetAmount}
                          roomId={roomInfo._id}
                          handleSwitchChange={this.props.handleSwitchChange}
                          game_type={roomInfo.game_type}
                          rank={this.props.rank}
                          user_id={user_id}
                          ai_mode={ai_mode}
                          user_balance={balance}
                          handleDetachAttachChange={handleDetachAttachChange}
                          attached={attached}
                          creator_id={roomInfo.creator_id}
                          getAttachedRooms={getAttachedRooms}
                          rps_game_type={roomInfo.rps_game_type}
                          isDarkMode={this.props.isDarkMode}
                        />

                      )}
                    </>

                  )}
                </div>
              </>

            ) : (
              <span style={{ color: "#ff0000" }}>THIS GAME HAS ENDED</span>
            )}
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
  isWatching: state.auth.isWatching,
  balance: state.auth.balance,
  rpsbetitems: state.logic.rpsbetitems,
  solPrice: state.logic.solPrice,
  data: state.itemReducer.myItemArray,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled,
  isFocused: state.auth.isFocused,
  is_betting: state.logic.is_betting,
});

const mapDispatchToProps = {
  openGamePasswordModal,
  acQueryMyItem,
  updateRoomBot,
  kickBots,
  setSpectateMode,
  getRpsBetItems,
  getRoomBotCount
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
