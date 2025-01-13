import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Tabs, Tab, Drawer } from '@material-ui/core';
import LoadingOverlay from 'react-loading-overlay';
import Lottie from 'react-lottie';
import Footer from './Footer';
import Summary from '../CreateGame/Summary';
import AdvancedSettings from '../CreateGame/AdvancedSettings';
import ChatPanel from '../ChatPanel/ChatPanel';
import DrawerButton from './DrawerButton';
import { getRank } from '../../util/getRank.js';
import animationData from '../LottieAnimations/cat-place-bet.json';
import RPS from '../CreateGame/RPS';
import QuickShoot from '../CreateGame/QuickShoot';
import history from '../../redux/history';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import {
  createRoom,
  setGameMode,
  getMyHistory,
  getMyChat,
  getGameTypeList,
  getStrategies
} from '../../redux/Logic/logic.actions';
import { alertModal, confirmModalCreate } from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';

const customStyles = {
  tabRoot: {
    textTransform: 'none',
    width: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  }
};

const gifUrls = [
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef8e1ce09cd9cf53a4829_rock1.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef98d7e17a610c3ed83b9_paper2.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641efdcadd850ab47a768e04_scissors1.gif'
];

const getRandomGifUrl = () => {
  const randomIndex = Math.floor(Math.random() * gifUrls.length);
  return gifUrls[randomIndex];
};

class CreateGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_mobile: window.innerWidth < 1024 ? true : false,
      selectedMobileTab: 'live_games',
      step: 1,
      child_step: 1,
      game_type: 1,
      game_mode: 'RPS',
      selectedGameType: 'RPS',
      rps_list: [],
      qs_list: [],
      tax: 1,
      name: '',
      image: '',
      x_link: '',
      website_link: '',
      telegram_link: '',
      selectedStrategy: 'Markov',
      qs_game_type: 2,
      qs_nation: 0,
      selected_qs_position: 0,
      bet_amount: 0.25,
      endgame_amount: 0,
      max_return: 0,
      creatingRoom: false,
      winChance: 0,
      public_bet_amount: convertToCurrency(0, this.props.solPrice),
      is_private: false,
      room_password: '',
      aveMultiplier: 0,
      score: 0,
      lowerLimit: 0,
      upperLimit: 0,
      stopLossValue: 0,
      ai_mode: this.props.user.ai_mode,
      isPlaying: false,
      endgame_type: false,
      description: '',
      rps_game_type: 0,
    };
    this.handleKeyPress = this.handleKeyPress.bind(this);

  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.balance !== props.balance
    ) {
      return {
        ...current_state,
        balance: props.balance
      };
    }
    return null;
  }

  async componentDidMount() {
    const path = window.location.pathname;
    if (path === '/create/rps') {
      this.setState({
        selectedGameType: 'RPS',
        game_mode: 'RPS',
      });
    } else if (path === '/create/quick-shoot') {
      this.setState({
        selectedGameType: 'Quick Shoot',
        game_mode: 'Quick Shoot',
      });
    }
    this.IsAuthenticatedReroute();
    const gameTypeName = this.props.match.params.game_type_name || 'RPS';

    this.props.getGameTypeList();
    await this.props.setGameMode(gameTypeName);
    await this.initializeGameType(gameTypeName);

    if (this.props.isAuthenticated) {
      this.props.getMyHistory();
      this.props.getMyChat();
    }
    this.props.getStrategies();
  }

  async componentDidUpdate(prevProps) {
    const prevGameTypeName = prevProps.match.params.game_type_name;
    const currentGameTypeName = this.props.match.params.game_type_name;

    if (prevGameTypeName !== currentGameTypeName) {
      await this.initializeGameType(currentGameTypeName);
    }
  }

  async initializeGameType(gameTypeName) {
    const { solPrice } = this.props;
    const selectedGameType = this.props.gameTypeList.find(
      gameType => gameType.game_type_name === gameTypeName
    );

    if (selectedGameType && selectedGameType.short_name) {
      this.setState({ selectedGameType: selectedGameType.short_name });
    }

    let newState = {
      child_step: 1,
      bet_amount: 0.25,
      endgame_amount: 0,
      max_return: 0,
      max_prize: 0,
      public_bet_amount: convertToCurrency(1, solPrice)
    };

    if (gameTypeName === 'RPS') {
      newState = {
        ...newState,
        game_type: 1,
        bet_amount: 0.25,
        winChance: 0,
        max_return: 0,
        endgame_amount: 0
      };
    } else if (gameTypeName === 'Quick Shoot') {
      newState = {
        ...newState,
        game_type: 5,
        public_bet_amount: convertToCurrency(1, solPrice),
        max_return: 2,
        bet_amount: 0.25,
        winChance: 0,
        qs_nation: Math.floor(Math.random() * 4),
        endgame_amount: 0
      };
    }

    this.setState(newState);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  handleDescriptionChange = event => {
    this.setState({
      description: event.target.value
    });
  };

  onChangeState = async newState => {
    await this.setState(newState);
  };

  toggleDrawer = () => {
    this.props.toggleDrawer(!this.props.isDrawerOpen);
  };

  setSelectedStrategy = (selectedStrategy) => {
    this.setState({ selectedStrategy });
  }

  handleKeyPress(event) {
    const { selected_roll } = this.state;
    const { isFocused } = this.props;
    if (!isFocused) {
      switch (event.key) {
        case 'Escape':
          this.onPrevButtonClicked();
          break;
        case 'Enter':
          this.onNextButtonClicked();
          break;

        case 'Shift':
          this.onSkipButtonClicked();
          break;
        default:
          break;
      }
    }
  }

  IsAuthenticatedReroute = () => {
    if (!this.props.auth) {
      history.push('/');
    }
  };

  onSkipButtonClicked = () => {
    if ((this.state.step === 2)) {
      this.setState({
        is_private: false,
        endgame_type: false,
        step: this.state.step + 1,
      });
    }
    return;
  };

  onPrevButtonClicked = () => {
    if (this.state.step < 5) {
      if (this.state.step === 3 && this.state.child_step === 1) {
        if (
          this.state.game_mode === 'Quick Shoot' ||
          (this.state.game_mode === 'RPS' && this.state.rps_game_type === 1)
        ) {
          this.setState({
            step: 2,
            child_step: 3,
            rps_list: []
          });
        } else {
          this.setState({
            step: 2,
            child_step: 2
          });
        }
        return;
      } else if (this.state.child_step > 1) {
        this.setState({
          child_step: this.state.child_step - 1
        });
        if ((this.state.step === 4) || (this.state.step === 2)) {
          this.setState({
            step: this.state.step - 1
          });
        }
        return;
      }
    }

    this.setState({
      step: this.state.step > 1 ? this.state.step - 1 : this.state.step
    });

    if (this.state.child_step === 4) {
      this.setState({
        child_step: this.state.child_step - 1
      });
    }

    if (this.state.step === 2) {
      this.setState({
        child_step: 1
      });
    }
  };

  onNextButtonClicked = () => {
    const {
      step,
      game_mode,
      bet_amount,
      balance,
      qs_list,
      rps_list,
      endgame_amount,
      name,
      image,
      room_password,
      is_private,
      endgame_type,
      selectedStrategy,
    } = this.state;

    const { isDarkMode } = this.props;

    const alertAndReturn = (message) => {
      alertModal(isDarkMode, message);
      return;
    };

    if (step === 1) {
      if (parseFloat(bet_amount) <= 0 || isNaN(parseFloat(bet_amount))) {
        alertAndReturn("YOU DIDN'T BET (CAT) SHIT!!!");
        return;
      }
      if (parseFloat(bet_amount) < 0.01) {
        alertAndReturn("MEOWNIMUM BUY-IN IS 0.01 SOL!");
        return;
      }
      if (name == null || name.trim() === '') {
        alertAndReturn("ADD A NAME DUMBASS!");
        return;
      }


      if (image == null || image.trim() === '') {
        alertAndReturn("ADD AN IMAGE DUMBASS!");
        return;
      }
      if (bet_amount > balance) {
        alertAndReturn('NOT ENUFF FUNDS AT THIS MEOWMENT');
        return;
      }

      const list = game_mode === 'Quick Shoot' || game_mode === 'QS' ? qs_list : rps_list;
      if (
        selectedStrategy === 'Hidden Markov' &&
        list.length < 3
      ) {
        alertAndReturn('PURR-HAPS IT WOULD BE WISE TO AT LEAST 3 RUNS FOR AI TRAINING DATA');
        return;
      }
    }

    if (step === 2) {
      if (isNaN(endgame_amount)) {
        alertAndReturn('IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!');
        return;
      }
      if (endgame_type && endgame_amount < parseFloat(bet_amount)) {
        alertAndReturn('CANNOT BE LOWER THAN BANKROLL');
        return;
      }
      if (is_private && !room_password) {
        alertAndReturn('SET THE PASSWORD TO JOIN YOUR GAME!');
        return;
      }

      if (endgame_amount === 0) {
        this.setState({ endgame_type: false });
      }
    }
    if (this.state.step !== 3) {
      this.setState({ step: step + 1 });
    }
  };

  onCreateRoom = async () => {
    const saveImage = async (imageSrc) => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS issues
        img.src = imageSrc;

        img.onload = () => {
          const maxWidth = 250; // Set the maximum width
          let width = img.width;
          let height = img.height;

          // Scale height proportionally to the maxWidth
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          // Set canvas dimensions and draw the image
          canvas.width = width;
          canvas.height = height;
          ctx.imageSmoothingEnabled = true; // Enable smoothing for better quality
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Return the resized image as a Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    blob, // Blob object
                    buffer: reader.result, // ArrayBuffer
                  });
                };
                reader.readAsArrayBuffer(blob);
              } else {
                reject('Failed to generate image Blob.');
              }
            },
            'image/png' // Use PNG format for lossless quality
          );
        };

        img.onerror = (error) => {
          reject('Error processing image: ' + error);
        };
      });
    };

    const uploadImageToBackend = async (imageBlob) => {
      const formData = new FormData();
      formData.append('file', imageBlob.blob, 'uploaded_image.png');

      try {
        const response = await axios.post('/game/upload-to-pinata', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Ensure correct content type
          },
        });

        if (response.status !== 200) {
          throw new Error('Failed to upload image to backend.');
        }

        return response.data.imageUrl;
      } catch (error) {
        throw error;
      }
    };

    // Main Room Creation Logic
    const processAndCreateRoom = async () => {
      this.setState({ creatingRoom: true });

      try {
        const { blob } = await saveImage(this.state.image);
        const imageUrl = await uploadImageToBackend({ blob });

        await this.props.createRoom({ ...this.state, image: imageUrl });
      } catch (error) {
        alertModal(this.props.isDarkMode, 'Failed to process the image. Please try again.');
      } finally {
        this.setState({ creatingRoom: false });
      }
    };

    if (localStorage.getItem('hideConfirmModal') === 'true') {
      await processAndCreateRoom();
    } else {
      confirmModalCreate(
        this.props.isDarkMode,
        'CONFIRM GAME SETTINGS?',
        'LFG',
        'Cancel',
        processAndCreateRoom
      );
    }
  };

  handleChange = (event) => {
    const { gameTypeList } = this.props;
    const selectedShortName = event.target.value;
    const selectedGame = gameTypeList.find(game => game.short_name === selectedShortName);

    if (selectedGame) {
      const selectedGameName = selectedGame.game_type_name;
      const urlFriendlyGameName = selectedGameName.toLowerCase().replace(/\s+/g, '-');
      const url = `/create/${urlFriendlyGameName}`;

      this.setState({ selectedGameType: event.target.value, game_mode: event.target.value, step: 1 });
      this.props.setGameMode(selectedGameName);
      history.push(url);
    }
  };

  step1 = () => {
    const defaultBetAmounts = [0.25, 0.5, 1, 2.5, 10];

    const { tax, game_mode, name, image, x_link, website_link, telegram_link, bet_amount, game_type, child_step, selectedStrategy, selectedGameType, } = this.state;
    switch (game_mode) {
      case 'RPS':
        return (
          <RPS
            name={name}
            image={image}
            x_link={x_link}
            website_link={website_link}
            tax={tax}
            telegram_link={telegram_link}
            setSelectedStrategy={this.setSelectedStrategy}
            selectedStrategy={selectedStrategy}
            selectedGameType={selectedGameType}
            ai_mode={this.props.user.ai_mode}
            user_id={this.props.user._id}
            rank={getRank(this.props.user.totalWagered)}
            defaultBetAmounts={defaultBetAmounts}
            handleChange={this.handleChange}
            strategies={this.props.strategies}
            onChangeState={this.onChangeState}
            bet_amount={this.state.bet_amount}
            winChance={this.state.winChance}
            is_private={this.state.is_private}
            room_password={this.state.room_password}
            step={child_step}
            endgame_amount={this.state.endgame_amount}
            rps_game_type={this.state.rps_game_type}
          />
        );

      case 'QS':
      case 'Quick Shoot':
        return (
          <QuickShoot
            name={name}
            image={image}
            tax={tax}
            x_link={x_link}
            website_link={website_link}
            telegram_link={telegram_link}
            setSelectedStrategy={this.setSelectedStrategy}
            selectedStrategy={selectedStrategy}
            ai_mode={this.props.user.ai_mode}
            selectedGameType={selectedGameType}
            onChangeState={this.onChangeState}
            user_id={this.props.user._id}
            bet_amount={this.state.bet_amount}
            is_private={this.state.is_private}
            endgame_type={this.state.endgame_type}
            strategies={this.props.strategies}
            winChance={this.state.winChance}
            handleChange={this.handleChange}
            room_password={this.state.room_password}
            endgame_amount={this.state.endgame_amount}
            qs_game_type={this.state.qs_game_type}
            selected_qs_position={this.state.selected_qs_position}
            step={this.state.child_step}
            qs_nation={this.state.qs_nation}
          />
        );

      default:
        this.props.setGameMode(game_mode);

        return this.step1();
    }
  };

  action_panel = () => {
    const { isLowGraphics } = this.props;
    return (
      <>
        <div className="action-panel" style={{ display: "flex", justifyContent: "space-between", width: "100%", bottom: "20%", zIndex: 999 }} >
          {
            this.state.step === 1 ? (
              <span></span>
            ) : (
              <Button id="btn_prev" onClick={this.onPrevButtonClicked}>
                Previous&nbsp;<span className="roll-tag">[Esc]</span>
              </Button>
            )}
          {(this.state.step === 2) && (
            <Button id="btn_skip" onClick={this.onSkipButtonClicked}>
              Skip&nbsp;<span className="roll-tag">[Shift]</span>
            </Button>
          )}

          {this.state.step === 3 && (
            <>
              <div style={{ position: 'relative', marginLeft: '-37.5%' }}>
                <Button id="btn_bet" onClick={this.onCreateRoom}>
                  Place Bet
                </Button>
                <div className="lottie-container-btn_bet">
                  <Lottie
                    options={{
                      loop: isLowGraphics ? false : true,
                      autoplay: isLowGraphics ? false : true,
                      animationData: animationData
                    }}
                    style={{
                      width: '62px',
                      position: 'absolute',
                      filter: 'grayscale(1)'
                    }}
                  />
                </div>
              </div>
            </>
          )}
          {this.state.step < 3 && (
            <Button id="btn_next" onClick={this.onNextButtonClicked}>
              Next&nbsp;<span className="roll-tag">[Enter]</span>
            </Button>
          )}
        </div>
      </>
    );
  };


  render() {
    const { solPrice } = this.props;
    const { selectedStrategy } = this.state;
    return (
      <LoadingOverlay
        className="custom-loading-overlay"
        active={this.state.creatingRoom}
        spinner={
          <div className="rpsLoader">
            <img
              src={getRandomGifUrl()}
              alt="Random Spinner"
              style={{
                width: '40px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: '10px'
              }}
            />
            <div>Creating Battle Room...</div>
          </div>
        }
      >
        <div
          className="main-game"
          style={{
            gridTemplateColumns: this.props.isDrawerOpen
              ? '260px calc(100% - 260px)'
              : '100%'
          }}
        >
          {((this.state.is_mobile && this.state.selectedMobileTab === 'chat') ||
            !this.state.is_mobile) && (
              <Drawer
                className="mat-chat"
                style={{ display: this.props.isDrawerOpen ? 'flex' : 'none' }}
                variant="persistent"
                anchor="left"
                open={this.props.isDrawerOpen}
              >
                <ChatPanel />
              </Drawer>
            )}
          {!this.state.is_mobile &&
            (!this.state.selectedMobileTab === 'live_games' ||
              !this.state.selectedMobileTab === 'my_games') && (
              <Tabs
                value={this.state.show_open_game}
                onChange={this.showOpenGameOrHistory}
                TabIndicatorProps={{ style: { background: '#ff0000' } }}
                className="main-game-page-tabs"
              >
                <Tab
                  label={
                    this.state.selectedMobileTab === 'live_games'
                      ? 'Live Battles'
                      : 'Your Games'
                  }
                  style={customStyles.tabRoot}
                />
                <Tab label="History" style={customStyles.tabRoot} />
              </Tabs>
            )}
          <div className="main-panel">
            <h2 className="main-title desktop-only" style={{ marginBottom: '10px' }}>
              <a onClick={() => history.push('/')} className="label" id="liveStakes">GO BACK</a>

            </h2>
            <div className="create-game-panel">
              <div className="game-page">
                <div className="game-contents title">
                  {/* {(this.state.step === 2 || this.state.step === 3 || this.state.step === 1) && (
                    <Summary
                      bet_amount={this.state.bet_amount}
                      max_return={this.state.max_return}
                      endgame_type={this.state.endgame_type}
                      selectedStrategy={selectedStrategy}
                      endgame_amount={this.state.endgame_amount}
                      is_private={this.state.is_private}
                      step={this.state.step}
                      description={this.state.description}
                      solPrice={solPrice}
                      aveMultiplier={this.state.aveMultiplier}
                      calcAveMultiplier={this.props.calcAveMultiplier}
                      child_step={this.state.child_step}
                      rps_game_type={this.state.rps_game_type}
                      qs_game_type={this.state.qs_game_type}
                      game_mode={this.state.game_mode}
                      public_bet_amount={this.state.public_bet_amount}
                      winChance={this.state.winChance}
                      calcWinChance={this.props.calcWinChance}
                    />
                  )} */}
                  {this.state.step === 1 && this.step1()}
                  {(this.state.step === 2) && (
                    <AdvancedSettings
                      max_return={this.state.max_return}
                      onChangeState={this.onChangeState}
                      lowerLimit={this.state.lowerLimit}
                      upperLimit={this.state.upperLimit}
                      stopLossValue={this.state.stopLossValue}
                      isDarkMode={this.props.isDarkMode}
                      winChance={this.state.winChance}
                      x_link={this.state.x_link}
                      telegram_link={this.state.telegram_link}
                      website_link={this.state.website_link}
                      bet_amount={this.state.bet_amount}
                      is_private={this.state.is_private}
                      room_password={this.state.room_password}
                      game_mode={this.state.game_mode}
                      endgame_type={this.state.endgame_type}
                      description={this.state.description}
                      endgame_amount={this.state.endgame_amount}
                      step={this.state.step}
                      child_step={this.state.child_step}
                      isPlaying={this.state.isPlaying}
                      handleSubmit={this.handleSubmit}
                      handleUrlChange={this.handleUrlChange}
                      handleDescriptionChange={this.handleDescriptionChange}
                    />
                  )}

                </div>
              </div>
            </div>
            {this.state.step !== 4 && this.action_panel()}
            <DrawerButton
              open={this.props.isDrawerOpen}
              toggleDrawer={this.toggleDrawer}
            />
            {/* <SupportButton
              open={this.props.isSupportOpen}
            // toggleDrawer={this.toggleDrawer}
            /> */}
          </div>

          {!this.state.is_mobile && (
            <div className="mobile-only main-page-nav-button-group">
              <Button
                className={`mobile-tab-live ${this.state.selectedMobileTab === 'live_games' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'live_games' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="none"
                  viewBox="0 0 32 32"
                >
                  <path
                    stroke={
                      this.state.selectedMobileTab === 'live_games'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
                  />
                </svg>
                {this.state.selectedMobileTab === 'live_games' &&
                  'LIVE GAMES'}
              </Button>
              <Button
                className={`mobile-tab-my ${this.state.selectedMobileTab === 'my_games' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'my_games' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="33"
                  height="32"
                  fill="none"
                  viewBox="0 0 33 32"
                >
                  <path
                    stroke={
                      this.state.selectedMobileTab === 'my_games'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
                  />
                  <path
                    fill={
                      this.state.selectedMobileTab === 'my_games'
                        ? '#fff'
                        : '#8E9297'
                    }
                    d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
                  />
                </svg>
                {this.state.selectedMobileTab === 'my_games' && 'YOUR GAMES'}
              </Button>
              <button
                className={`mobile-tab-marketplace ${this.state.selectedMobileTab === 'marketplace' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'marketplace' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="none"
                  viewBox="0 0 32 32"
                >
                  <path
                    stroke={
                      this.state.selectedMobileTab === 'marketplace'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M10.083 6.083h11.833v8.584c0 3.268-2.649 5.917-5.916 5.917-3.268 0-5.917-2.65-5.917-5.917V6.083zM9.333 26.666h13.333M22.223 14.597c3.528-.571 4.444-4.538 4.444-6.597H22M9.777 14.597C6.25 14.026 5.333 10.06 5.333 8H10M16 21.334v5.333"
                  />
                </svg>
                {this.state.selectedMobileTab === 'marketplace' &&
                  'MARKETPLACE'}
              </button>
              <Button
                className={`mobile-tab-chat ${this.state.selectedMobileTab === 'chat' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'chat' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="33"
                  height="32"
                  fill="none"
                  viewBox="0 0 33 32"
                >
                  <path
                    stroke={
                      this.state.selectedMobileTab === 'chat'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
                  />
                  <circle
                    cx="10.5"
                    cy="16"
                    r="2"
                    stroke={
                      this.state.selectedMobileTab === 'chat'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="16.5"
                    cy="16"
                    r="2"
                    stroke={
                      this.state.selectedMobileTab === 'chat'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="22.5"
                    cy="16"
                    r="2"
                    stroke={
                      this.state.selectedMobileTab === 'chat'
                        ? '#fff'
                        : '#8E9297'
                    }
                    strokeWidth="1.5"
                  />
                </svg>
                {this.state.selectedMobileTab === 'chat' && 'CHAT'}
              </Button>
            </div>
          )}
          <Footer
            className="footer"
            open={this.props.isDrawerOpen}
            style={{ marginLeft: this.props.isDrawerOpen ? '270px' : '0' }}
          />
        </div>
      </LoadingOverlay>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  history: state.logic.history,
  pageNumber: state.logic.pageNumber,
  balance: state.auth.balance,
  user: state.auth.user,
  gameTypeList: state.logic.gameTypeList,
  solPrice: state.logic.solPrice,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  auth: state.auth.isAuthenticated,
  landingItemList: state.landingReducer.landingItemList,
  game_mode: state.logic.game_mode,
  strategies: state.logic.strategies,
  socket: state.auth.socket,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics,
  isDrawerOpen: state.auth.isDrawerOpen,
  isFocused: state.auth.isFocused
});

const mapDispatchToProps = {
  createRoom,
  setGameMode,
  getStrategies,
  getMyHistory,
  getGameTypeList,
  getMyChat,
  toggleDrawer
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateGame);
