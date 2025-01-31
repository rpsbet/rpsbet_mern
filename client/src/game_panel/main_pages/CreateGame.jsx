import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Button, Tabs, Tab, Drawer, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Box
} from '@mui/material';
import axios from '../../util/Api';
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
import { toggleDrawer, showError } from '../../redux/Auth/user.actions';
import {
  createRoom,
  setGameMode,
  getGameTypeList,
  getStrategies,
  uploadImageToPinata
} from '../../redux/Logic/logic.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPenSquare } from '@fortawesome/free-solid-svg-icons';

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

function CreateGame(props) {
  const {
    isAuthenticated,
    getGameTypeList,
    setGameMode: _setGameMode,

    getStrategies,
    match,
    solPrice,
    balance: propBalance,
    user,
    gameTypeList,
    strategies,
    isDrawerOpen,
    isDarkMode,
    isLowGraphics,
    showError,
    uploadImageToPinata,
    toggleDrawer: _toggleDrawer
  } = props;

  // -------------------------------
  //    Local component state
  // -------------------------------
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');
  const [step, setStep] = useState(1);
  const [childStep, setChildStep] = useState(1);
  const [gameType, setGameType] = useState(1);
  const [gameMode, setGameModeLocal] = useState('RPS');
  const [selectedGameType, setSelectedGameType] = useState('RPS');
  const [rpsList, setRpsList] = useState([]);
  const [qsList, setQsList] = useState([]);
  const [tax, setTax] = useState(1);

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [xLink, setXLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  
  const [ticker, setTicker] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('Markov');
  const [qsNation, setQsNation] = useState(0);
  const [selectedQsPosition, setSelectedQsPosition] = useState(0);

  const [betAmount, setBetAmount] = useState(0.25);
  const [endgameAmount, setEndgameAmount] = useState(0.5);
  const [maxReturn, setMaxReturn] = useState(0);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [winChance, setWinChance] = useState(0);
  const [publicBetAmount, setPublicBetAmount] = useState(convertToCurrency(0, solPrice));
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [aiMode, setAiMode] = useState(user.ai_mode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [endgameType, setEndgameType] = useState(true);
  const [description, setDescription] = useState('');
  const [rpsGameType, setRpsGameType] = useState(0);
  const [qsGameType, setQsGameType] = useState(2);

  // Local duplication of balance if needed
  const [localBalance, setLocalBalance] = useState(propBalance);

  // Confirmation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(
    localStorage.getItem('hideConfirmModal') === 'true'
  );

  // -------------------------------
  //    Lifecycle & Setup
  // -------------------------------
  useEffect(() => {
    // Mimic componentDidMount
    const path = window.location.pathname;
    if (path === '/create/rps') {
      setSelectedGameType('RPS');
      setGameModeLocal('RPS');
    } else if (path === '/create/quick-shoot') {
      setSelectedGameType('QS');
      setGameModeLocal('QS');
    }

    const gameTypeName = match.params.game_type_name || 'RPS';
    getGameTypeList();
    _setGameMode(gameTypeName);
    initializeGameType(gameTypeName);


    getStrategies();

    // Add a keypress listener (if needed)
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      // Mimic componentWillUnmount
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Mimic componentDidUpdate when match.params.game_type_name changes
  useEffect(() => {
    const gameTypeName = match.params.game_type_name;
    if (gameTypeName) {
      initializeGameType(gameTypeName);
    }
  }, [match.params.game_type_name]);

  // Mimic getDerivedStateFromProps
  useEffect(() => {
    if (localBalance !== propBalance) {
      setLocalBalance(propBalance);
    }
  }, [propBalance, localBalance]);

  const initializeGameType = useCallback(async (gameTypeName) => {
    const selectedGameTypeObj = gameTypeList.find(
      g => g.game_type_name === gameTypeName
    );

    if (selectedGameTypeObj && selectedGameTypeObj.short_name) {
      setSelectedGameType(selectedGameTypeObj.short_name);
    }

    if (gameTypeName === 'rps') {
      setGameType(1);
    } else if (gameTypeName === 'quick-shoot') {
      setGameType(5);
      setQsNation(Math.floor(Math.random() * 4));
    }

    setStep(1);
    setChildStep(1);
  }, [gameTypeList, solPrice]);

  // -------------------------------
  //    Handlers
  // -------------------------------

  const handleKeyPress = (event) => {
    const { isFocused } = props;
    if (!isFocused) {
      switch (event.key) {
        case 'Escape':
          onPrevButtonClicked();
          break;
        case 'Enter':
          onNextButtonClicked();
          break;
        case 'Shift':
          onSkipButtonClicked();
          break;
        default:
          break;
      }
    }
  };

  const onChangeState = async (newState) => {

    // Imitate this.setState(newState) by individually setting
    // For brevity, you can expand or adjust as needed
    if ('bet_amount' in newState) setBetAmount(newState.bet_amount);
    if ('name' in newState) setName(newState.name);
    if ('image' in newState) setImage(newState.image);
    if ('ticker' in newState) setTicker(newState.ticker);
    if ('description' in newState) setDescription(newState.description);
    if ('website_link' in newState) setWebsiteLink(newState.website_link);
    if ('x_link' in newState) setXLink(newState.x_link);
    if ('telegram_link' in newState) setTelegramLink(newState.telegram_link);
    if ('tax' in newState) setTax(newState.tax);
    if ('is_private' in newState) setIsPrivate(newState.is_private);
    if ('room_password' in newState) setRoomPassword(newState.room_password);
    if ('endgame_amount' in newState) setEndgameAmount(newState.endgame_amount);
    if ('endgame_type' in newState) setEndgameType(newState.endgame_type);
    if ('selectedStrategy' in newState) setSelectedStrategy(newState.selectedStrategy);
    if ('winChance' in newState) setWinChance(newState.winChance);
    if ('rps_game_type' in newState) setRpsGameType(newState.rps_game_type);
    if ('qs_game_type' in newState) setQsGameType(newState.qs_game_type);
    if ('qs_nation' in newState) setQsNation(newState.qs_nation);
    if ('selected_qs_position' in newState) setSelectedQsPosition(newState.selected_qs_position);
  };

  const toggleDrawer = () => {
    _toggleDrawer(!isDrawerOpen);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const onSkipButtonClicked = () => {
    if (step === 2) {
      setIsPrivate(false);
      setEndgameType(false);
      setStep(step + 1);
    }
    return;
  };

  const onPrevButtonClicked = () => {
    if (step < 5) {
      if (step === 3 && childStep === 1) {
        if (
          gameMode === 'Quick Shoot' ||
          (gameMode === 'RPS' && rpsGameType === 1)
        ) {
          setStep(2);
          setChildStep(3);
          setRpsList([]);
          return;
        } else {
          setStep(2);
          setChildStep(2);
          return;
        }
      } else if (childStep > 1) {
        setChildStep(childStep - 1);
        if (step === 4 || step === 2) {
          setStep(step - 1);
        }
        return;
      }
    }

    setStep(step > 1 ? step - 1 : step);

    if (childStep === 4) {
      setChildStep(childStep - 1);
    }

    if (step === 2) {
      setChildStep(1);
    }
  };

  const onNextButtonClicked = () => {
    if (step === 1) {
      if (!gameMode) {
        showError("No Gamemode", "YOU DIDN'T PICK A GAMEMODE");
        return;
      }
      if (parseFloat(betAmount) <= 0 || isNaN(parseFloat(betAmount))) {
        showError("Invalid Bet", "YOU DIDN'T BET (CAT) SHIT!!!");
        return;
      }
      if (parseFloat(betAmount) < 0.0005) {
        showError("Minimum Buy-in", "MEOWNIMUM BUY-IN IS 0.0005 SOL!");
        return;
      }
      if (parseFloat(tax) > 33) {
        showError("Minimum Buy-in", "MAX TAX IS 33%!");
        return;
      }
      if (parseFloat(betAmount) >= parseFloat(endgameAmount)) {
        showError("Minimum Hard Cap", "HARD-CAP MUST BE MORE THAN YOUR BUY-IN AMOUNT!");
        return;
      }
      if (!name.trim()) {
        showError("Missing Name", "ADD A NAME DUMBASS!");
        return;
      }
      if (!image.trim()) {
        showError("Missing Image", "ADD AN IMAGE DUMBASS!");
        return;
      }
      if (betAmount > localBalance) {
        showError("Insufficient Funds", "NOT ENUFF FUNDS AT THIS MEOWMENT");
        return;
      }
      // Example logic if a certain strategy needs training data
      if ((selectedStrategy === 'Hidden Markov') && (gameMode === 'Quick Shoot' || gameMode === 'RPS')) {
        const list = gameMode === 'Quick Shoot' ? qsList : rpsList;
        if (list.length < 3) {
          showError("Training Data Insufficient", "PURR-HAPS YOU NEED AT LEAST 3 RUNS FOR AI TRAINING DATA");
          return;
        }
      }
    }

    if (step === 2) {
      if (isNaN(endgameAmount)) {
        showError("Invalid Input", "IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!");
        return;
      }
      if (endgameType && endgameAmount < parseFloat(betAmount)) {
        showError("Invalid Endgame Amount", "CANNOT BE LOWER THAN BANKROLL");
        return;
      }
      if (isPrivate && !roomPassword) {
        showError("Missing Password", "SET THE PASSWORD TO JOIN YOUR GAME!");
        return;
      }
      if (endgameAmount === 0) {
        setEndgameType(false);
      }
    }

    if (step !== 3) {
      setStep(step + 1);
    }
  };

  const createRoomWithImage = async () => {
    setCreatingRoom(true);
  
    const saveImage = (imageSrc) => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS issues
        img.src = imageSrc;
  
        img.onload = () => {
          const maxWidth = 250; // Adjust as needed
          let width = img.width;
          let height = img.height;
  
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
  
          canvas.width = width;
          canvas.height = height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
  
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // We'll just resolve with the Blob
                resolve(blob);
              } else {
                reject('Failed to generate image Blob.');
              }
            },
            'image/png'
          );
        };
  
        img.onerror = (error) => {
          reject('Error processing image: ' + error);
        };
      });
    };
  
    try {
      // 1) Resize the original 'image' (URL) into a Blob
      const resizedBlob = await saveImage(image);
      const formData = new FormData();
      formData.append('file', resizedBlob, 'resized-image.png');
  
      const response = await axios.post('/game/upload-to-pinata', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.status !== 200) {
        throw new Error('Server responded with non-200 status.');
      }

      const { success, imageUrl, message } = response.data;
      if (!success || !imageUrl) {
        throw new Error(message || 'Upload failed, no imageUrl received.');
      }
  
      const fullState = {
        game_type: gameType,
        game_mode: gameMode,
        selectedGameType,
        rps_list: rpsList,
        qs_list: qsList,
        tax,
        name,
        ticker,
        image: imageUrl, 
        x_link: xLink,
        website_link: websiteLink,
        telegram_link: telegramLink,
        selectedStrategy,
        qs_game_type: qsGameType,
        qs_nation: qsNation,
        selected_qs_position: selectedQsPosition,
        bet_amount: betAmount,
        endgame_amount: endgameAmount,
        max_return: maxReturn,
        winChance,
        public_bet_amount: publicBetAmount,
        is_private: isPrivate,
        room_password: roomPassword,
        ai_mode: aiMode,
        endgame_type: endgameType,
        description,
        rps_game_type: rpsGameType,
      };
  
      await props.createRoom(fullState);
  
    } catch (error) {
      console.error('[Front-end] Error uploading/resizing image:', error);
      alertModal(isDarkMode, 'Failed to process image. Please try again.');
    } finally {
      setCreatingRoom(false);
    }
  };
  
  const onCreateRoom = () => {
    if (localStorage.getItem('hideConfirmModal') === 'true') {
      createRoomWithImage();
    } else {
      setOpenDialog(true);
    }
  };

  const handleConfirm = async () => {
    if (skipConfirm) {
      localStorage.setItem('hideConfirmModal', 'true');
    }
    setOpenDialog(false);
    createRoomWithImage();
  };

  const handleCancel = () => {
    setOpenDialog(false);
  };

  const handleChange = (event) => {
    const shortName = event.target.value;
    const selectedGame = gameTypeList.find(g => g.short_name === shortName);

    if (selectedGame) {
      const selectedGameName = selectedGame.game_type_name;
      const urlFriendlyGameName = selectedGameName.toLowerCase().replace(/\s+/g, '-');
      const url = `/create/${urlFriendlyGameName}`;

      setSelectedGameType(shortName);
      setGameModeLocal(shortName);
      setStep(1);

      _setGameMode(selectedGameName);
      history.push(url);
    }
  };

  // -------------------------------
  //    Render sub-components
  // -------------------------------
  const step1 = () => {
    const defaultBetAmounts = [0.25, 0.5, 1, 2.5, 10];

    switch (gameMode) {
      case 'RPS':
        return (
          <RPS
            name={name}
            image={image}
            x_link={xLink}
            ticker={ticker}
            website_link={websiteLink}
            tax={tax}
            telegram_link={telegramLink}
            setSelectedStrategy={setSelectedStrategy}
            selectedStrategy={selectedStrategy}
            selectedGameType={selectedGameType}
            ai_mode={user.ai_mode}
            user_id={user._id}
            user={user}
            rank={getRank(user.totalWagered)}
            defaultBetAmounts={defaultBetAmounts}
            handleChange={handleChange}
            strategies={strategies}
            onChangeState={onChangeState}
            bet_amount={betAmount}
            winChance={winChance}
            is_private={isPrivate}
            room_password={roomPassword}
            step={childStep}
            endgame_amount={endgameAmount}
            rps_game_type={rpsGameType}
          />
        );

      case 'QS':
      case 'Quick Shoot':
        return (
          <QuickShoot
            name={name}
            image={image}
            tax={tax}
            ticker={ticker}
            x_link={xLink}
            website_link={websiteLink}
            telegram_link={telegramLink}
            setSelectedStrategy={setSelectedStrategy}
            selectedStrategy={selectedStrategy}
            ai_mode={user.ai_mode}
            selectedGameType={selectedGameType}
            onChangeState={onChangeState}
            user_id={user._id}
            user={user}
            rank={getRank(user.totalWagered)}
            bet_amount={betAmount}
            is_private={isPrivate}
            endgame_type={endgameType}
            strategies={strategies}
            winChance={winChance}
            handleChange={handleChange}
            room_password={roomPassword}
            endgame_amount={endgameAmount}
            qs_game_type={qsGameType}
            selected_qs_position={selectedQsPosition}
            step={childStep}
            qs_nation={qsNation}
          />
        );

      default:
        // Fallback or re-assign
        props.setGameMode(gameMode);
        return <div>Loading game...</div>;
    }
  };

  const actionPanel = () => {
    return (
      <Box
        className="action-panel"
        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', bottom: '20%', mt: '15px', mb: '30px' }}
      >
        {step === 1 ? (
          <span></span>
        ) : (
          <Button id="btn_prev" color='error' onClick={onPrevButtonClicked}>
            Previous&nbsp;<span className="roll-tag">[Esc]</span>
          </Button>
        )}
        {step === 2 && (
          <Button id="btn_skip" color='error' onClick={onSkipButtonClicked}>
            Skip&nbsp;<span className="roll-tag">[Shift]</span>
          </Button>
        )}
        {step === 2 && (
          <div style={{ position: 'relative' }}>
            <Button id="btn_bet" color='error' onClick={onCreateRoom}>
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
        )}
        {step < 2 && (
          <Button id="btn_next" color="error" onClick={onNextButtonClicked}>
            Next&nbsp;<span className='roll-tag'>[ENTER]</span>
          </Button>
        )}
      </Box>
    );
  };

  // -------------------------------
  //    Main render
  // -------------------------------
  return (
    <LoadingOverlay
      className="custom-loading-overlay"
      active={creatingRoom}
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
          gridTemplateColumns: isDrawerOpen
            ? '260px calc(100% - 260px)'
            : '100%'
        }}
      >
        {/* Mobile Chat Drawer (if needed) */}
        {isMobile && selectedMobileTab === 'chat' && (
          <Drawer
            className="mat-chat"
            style={{ display: isDrawerOpen ? 'flex' : 'none' }}
            variant="persistent"
            anchor="left"
            open={isDrawerOpen}
          >
            <ChatPanel />
          </Drawer>
        )}

        <div className="main-panel">
          <Dialog open={openDialog} onClose={handleCancel}>
            <DialogTitle>CONFIRM GAME SETTINGS?</DialogTitle>
            <DialogContent>
              {/* Additional summary/details about the room can go here */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipConfirm}
                    onChange={e => setSkipConfirm(e.target.checked)}
                  />
                }
                label="Don't show this confirmation again"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleConfirm} variant="contained" color='error'>
                LFG
              </Button>
            </DialogActions>
          </Dialog>

          <Box className="main-title desktop-only" style={{ marginBottom: '10px' }}>
            <Button
              variant="text"
              color="error"
              onClick={() => {
                history.push('/');
              }}
              className="label" id="liveStakes"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              &nbsp; Go Back
            </Button>
          </Box>
          <div className="create-game-panel">
            <div className="game-page">
              <div className="game-contents title">
                {step === 1 && step1()}
                {step === 2 && (
                  <AdvancedSettings
                    max_return={maxReturn}
                    onChangeState={onChangeState}
                    isDarkMode={isDarkMode}
                    winChance={winChance}
                    tax={tax}
                    x_link={xLink}
                    telegram_link={telegramLink}
                    website_link={websiteLink}
                    bet_amount={betAmount}
                    is_private={isPrivate}
                    room_password={roomPassword}
                    game_mode={gameMode}
                    endgame_type={endgameType}
                    description={description}
                    endgame_amount={endgameAmount}
                    step={step}
                    child_step={childStep}
                    isPlaying={isPlaying}
                    handleUrlChange={() => { }}
                    handleSubmit={() => { }}
                    handleDescriptionChange={handleDescriptionChange}
                  />
                )}
              </div>
            </div>
          </div>
          {step !== 4 && actionPanel()}
          <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawer} />
          {/* <SupportButton .../> If you have a separate support toggle */}
        </div>

        {/* Example of a mobile bottom nav for switching tabs */}
        {!isMobile && (
          <div className="mobile-only main-page-nav-button-group">
            <Button
              className={`mobile-tab-live ${selectedMobileTab === 'live_games' ? 'active' : ''}`}
              onClick={() => setSelectedMobileTab('live_games')}
            >
              {/* SVG ICON */}
              {selectedMobileTab === 'live_games' && 'LIVE GAMES'}
            </Button>
            <Button
              className={`mobile-tab-my ${selectedMobileTab === 'my_games' ? 'active' : ''}`}
              onClick={() => setSelectedMobileTab('my_games')}
            >
              {/* SVG ICON */}
              {selectedMobileTab === 'my_games' && 'YOUR GAMES'}
            </Button>
            <Button
              className={`mobile-tab-marketplace ${selectedMobileTab === 'marketplace' ? 'active' : ''
                }`}
              onClick={() => setSelectedMobileTab('marketplace')}
            >
              {/* SVG ICON */}
              {selectedMobileTab === 'marketplace' && 'MARKETPLACE'}
            </Button>
            <Button
              className={`mobile-tab-chat ${selectedMobileTab === 'chat' ? 'active' : ''}`}
              onClick={() => setSelectedMobileTab('chat')}
            >
              {/* SVG ICON */}
              {selectedMobileTab === 'chat' && 'CHAT'}
            </Button>
          </div>
        )}

        <Footer className="footer" open={isDrawerOpen} />
      </div>
    </LoadingOverlay>
  );
}

// -------------------------------
//    Redux Connection
// -------------------------------
const mapStateToProps = (state) => ({
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
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics,
  isDrawerOpen: state.auth.isDrawerOpen,
  isFocused: state.auth.isFocused,
});

const mapDispatchToProps = {
  createRoom,
  setGameMode,
  getStrategies,
  getGameTypeList,
  showError,
  uploadImageToPinata,
  toggleDrawer
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateGame);