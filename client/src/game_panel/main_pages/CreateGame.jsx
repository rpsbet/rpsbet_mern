import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'; // Add useParams
import {
  Button,
  Radio,
  RadioGroup,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Box,
  Tooltip,
  Typography
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { getRank } from '../../util/getRank';
import axios from '../../util/Api';
import LoadingOverlay from 'react-loading-overlay';
import Lottie from 'react-lottie';
import Footer from './Footer';
import Summary from '../CreateGame/Summary';
import AdvancedSettings from '../CreateGame/AdvancedSettings';
import ChatPanel from '../ChatPanel/ChatPanel';
import DrawerButton from './DrawerButton';
import CoinInfo from '../CreateGame/CoinInfo';
import GameSettingsPanel from '../CreateGame/GameSettingsPanel';
import DefaultBetAmountPanel from '../CreateGame/DefaultBetAmountPanel';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import {
  createRoom,
  setGameMode,
  getGameTypeList,
  getStrategies,
  uploadImageToPinata,
} from '../../redux/Logic/logic.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPenSquare } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

const gameTypeStyleClass = {
  RPS: 'rps',
  QS: 'quick-shoot',
};

const StyledRadioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 800px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    padding: 10px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const StyledProductCard = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0.3em;
  padding: 12px;
  width: 150px;
  text-align: center;
  text-decoration: none;
  color: ${({ isDarkMode }) => (isDarkMode ? '#ddd' : '#2c2c2c')};
  box-shadow: none;
  transition: background 0.2s ease;

  span {
    margin-top: 8px;
    font-size: 0.9rem;
    font-weight: 400;
    color: ${({ isDarkMode }) => (isDarkMode ? '#ddd' : '#2c2c2c')};
  }

  @media (max-width: 768px) {
    width: 130px;
    padding: 10px;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 8px;
  }
`;

const StyledProductImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 6px;
  opacity: 0.85;
`;

const gifUrls = [
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef8e1ce09cd9cf53a4829_rock1.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef98d7e17a610c3ed83b9_paper2.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641efdcadd850ab47a768e04_scissors1.gif',
];

const getRandomGifUrl = () => {
  const randomIndex = Math.floor(Math.random() * gifUrls.length);
  return gifUrls[randomIndex];
};

function CreateGame() { // Remove match prop
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { game_type_name } = useParams(); // Get game_type_name from URL
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const connectedAccount = useSelector((state) => state.auth.connectedAccount);
  const balance = useSelector((state) => state.auth.balance);
  const user = useSelector((state) => state.auth.user);
  const gameTypeList = useSelector((state) => state.logic.gameTypeList);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const strategies = useSelector((state) => state.logic.strategies);
  const isDrawerOpen = useSelector((state) => state.auth.isDrawerOpen);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);

  // Rename to avoid conflict with prop
  const propBalance = balance;

  // Local component state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');
  const [step, setStep] = useState(1);
  const [childStep, setChildStep] = useState(1);
  const [gameType, setGameType] = useState(1);
  const [gameMode, setGameModeLocal] = useState('RPS');
  const [selectedGameType, setSelectedGameType] = useState('RPS');
  const [rpsList, setRpsList] = useState([]);
  const [qsList, setQsList] = useState([]);
  const [tax, setTax] = useState(20);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [xLink, setXLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [ticker, setTicker] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('o3Mini');
  const [gameCode, setGameCode] = useState('');
  const [prompt, setPrompt] = useState(
    'Create a Wheel of Fortune game, display the numbers 1 through 10 on the wheel and use https://t4.ftcdn.net/jpg/02/66/72/41/360_F_266724172_Iy8gdKgMa7XmrhYYxLCxyhx6J7070Pr8.jpg  as the background and show a spin button. Add this https://cdn.freesound.org/previews/752/752225_15867640-lq.mp3 sound. Whichever number the wheel lands on is the multiplier.',
  );
  const [qsNation, setQsNation] = useState(0);
  const [selectedQsPosition, setSelectedQsPosition] = useState(0);
  const [betAmount, setBetAmount] = useState(0.25);
  const [endgameAmount, setEndgameAmount] = useState(20);
  const [maxReturn, setMaxReturn] = useState(0);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [winChance, setWinChance] = useState(0);
  const [publicBetAmount, setPublicBetAmount] = useState(
    convertToCurrency(0, solPrice),
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [aiMode, setAiMode] = useState(user.ai_mode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [endgameType, setEndgameType] = useState(true);
  const [description, setDescription] = useState('');
  const [rpsGameType, setRpsGameType] = useState(0);
  const [qsGameType, setQsGameType] = useState(2);
  const [localBalance, setLocalBalance] = useState(propBalance);

  // Confirmation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(
    localStorage.getItem('hideConfirmModal') === 'true',
  );

  const initializeGameType = useCallback(
    async (gameTypeName, isInitial = true) => {
      const selectedGameTypeObj = gameTypeList.find(
        (g) => g.game_type_name === gameTypeName,
      );
  
      if (selectedGameTypeObj && selectedGameTypeObj.short_name) {
        setSelectedGameType(selectedGameTypeObj.short_name);
      }
      if (gameTypeName === 'rps') {
        setGameType(1);
      } else if (gameTypeName === 'quick-shoot') {
        setGameType(5);
        setQsNation(Math.floor(Math.random() * 4));
      } else {
        setGameType(9);
      }
  
    },
    [gameTypeList, solPrice],
  );

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/create/rps') {
      setSelectedGameType('RPS');
      setGameModeLocal('RPS');
    } else if (path === '/create/quick-shoot') {
      setSelectedGameType('QS');
      setGameModeLocal('QS');
    } else if (path === '/create/custom') {
      setSelectedGameType('Custom');
      setGameModeLocal('Custom');
    }
  
    const gameTypeName = game_type_name || 'RPS';
    dispatch(getGameTypeList());
    dispatch(setGameMode(gameTypeName));
    initializeGameType(gameTypeName, true); // Initial setup
  
    dispatch(getStrategies());
  
    return () => {};
  }, [dispatch, game_type_name,]);
  
  useEffect(() => {
    if (game_type_name) {
      initializeGameType(game_type_name, false); // Subsequent calls, no step reset
    }
  }, [game_type_name, initializeGameType]);

  useEffect(() => {
    if (gameCode.trim()) {
      setGameModeLocal('Custom');
      setSelectedGameType('Custom');
      setGameType(9);
    }
  }, [gameCode]);

  useEffect(() => {
    if (localBalance !== propBalance) {
      setLocalBalance(propBalance);
    }
  }, [propBalance, localBalance]);

  const onChangeState = async (newState) => {
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
    if ('selectedStrategy' in newState)
      setSelectedStrategy(newState.selectedStrategy);
    if ('gameCode' in newState) setGameCode(newState.gameCode);
    if ('prompt' in newState) setPrompt(newState.prompt);
    if ('winChance' in newState) setWinChance(newState.winChance);
    if ('rps_game_type' in newState) setRpsGameType(newState.rps_game_type);
    if ('qs_game_type' in newState) setQsGameType(newState.qs_game_type);
    if ('qs_nation' in newState) setQsNation(newState.qs_nation);
    if ('selected_qs_position' in newState)
      setSelectedQsPosition(newState.selected_qs_position);
  };

  const toggleDrawerHandler = () => {
    dispatch(toggleDrawer(!isDrawerOpen));
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
      if (!connectedAccount) {
        dispatch(errorMsgBar('CONNECT YOUR WALLET'));
        return;
      }
      if (!gameMode) {
        dispatch(errorMsgBar("YOU DIDN'T PICK A GAMEMODE"));
        return;
      }
      if (parseFloat(betAmount) <= 0 || isNaN(parseFloat(betAmount))) {
        dispatch(errorMsgBar("YOU DIDN'T BET (CAT) SHIT!!!"));
        return;
      }
      if (gameMode === 'Custom' && gameCode === '') {
        dispatch(errorMsgBar("YOU DIDN'T GENERATE A GAME MOTHERFUCKER!"));
        return;
      }
      const parsedQsGameType = parseInt(qsGameType);
      if (gameMode === 'RPS') {
        setTax(30);
      } else if (gameMode === 'QS') {
        switch (parsedQsGameType) {
          case 5:
            setTax(12);
            break;
          case 4:
            setTax(14);
            break;
          case 3:
            setTax(16);
            break;
          case 2:
            setTax(18);
            break;
          default:
            setTax(20);
        }
      } else {
        setTax(5);
      }

      if (parseFloat(betAmount) < 0.001) {
        dispatch(errorMsgBar('MEOWNIMUM BUY-IN IS 0.001 SOL!'));
        return;
      }

      if (parseFloat(betAmount) >= parseFloat(endgameAmount)) {
        dispatch(errorMsgBar('HARD-CAP MUST BE MORE THAN YOUR BUY-IN AMOUNT!'));
        return;
      }
      if (!name.trim()) {
        dispatch(errorMsgBar('ADD A NAME DUMBASS!'));
        return;
      }
      if (name.trim().length > 20) {
        dispatch(errorMsgBar('Name cannot be longer than 20 characters!'));
        return;
      }
      if (!ticker.trim()) {
        dispatch(errorMsgBar('ADD A TICKER DUMBASS!'));
        return;
      }
      if (!image.trim()) {
        dispatch(errorMsgBar('ADD AN IMAGE DUMBASS!'));
        return;
      }
      if (betAmount > localBalance) {
        dispatch(errorMsgBar('NOT ENUFF FUNDS AT THIS MEOWMENT'));
        return;
      }

      if (isNaN(endgameAmount)) {
        dispatch(errorMsgBar('ENTER A VALID NUMBER!'));
        return;
      }
      if (endgameAmount < 10) {
        dispatch(errorMsgBar('MINIMUM HEALTH IS 10 SOL'));
        return;
      }
    }

    if (step === 2) {
      if (isPrivate && !roomPassword) {
        dispatch(errorMsgBar('SET THE PASSWORD TO JOIN YOUR GAME!'));
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
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;

        img.onload = () => {
          const maxWidth = 250;
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

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject('Failed to generate image Blob.');
            }
          }, 'image/png');
        };

        img.onerror = (error) => {
          reject('Error processing image: ' + error);
        };
      });
    };

    try {
      const resizedBlob = await saveImage(image);
      const formData = new FormData();
      formData.append('file', resizedBlob, 'resized-image.png');

      const response = await axios.post('/game/upload-to-pinata', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
        prompt: prompt,
        website_link: websiteLink,
        telegram_link: telegramLink,
        gameCode: gameCode,
        selectedStrategy,
        qs_game_type: qsGameType,
        qs_nation: qsNation,
        selected_qs_position: selectedQsPosition,
        bet_amount: betAmount,
        endgame_amount: endgameAmount,
        max_return: maxReturn,
        connectedAccount,
        winChance,
        public_bet_amount: publicBetAmount,
        is_private: isPrivate,
        room_password: roomPassword,
        ai_mode: aiMode,
        endgame_type: endgameType,
        description,
        rps_game_type: rpsGameType,
      };

      await dispatch(createRoom(fullState, navigate));
    } catch (error) {
      console.error('[Front-end] Error uploading/resizing image:', error);
      dispatch(errorMsgBar('Failed to process image. Please try again.'));
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

  function RoomTaxInfo({ gameMode }) {
    const getTaxMessage = (mode) => {
      switch (mode) {
        case 'RPS':
          return 'You will receive 30% back from player winnings';
        case 'QS':
          return 'You will receive 12% - 20% back from player winnings';
        case 'Custom':
          return 'You will receive 5% back from player winnings';
        default:
          return 'Not specified';
      }
    };
  
    return (
      <Box
        sx={{
          color: 'orange',
          backgroundColor: '#ffd00011',
          borderLeft: '4px solid orange',
          padding: '8px',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          marginTop: '15px',
        }}
      >
        <Typography variant="body2" component="span">
          {getTaxMessage(gameMode)}
        </Typography>
      </Box>
    );
  }

  
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
    const selectedGame = gameTypeList.find((g) => g.short_name === shortName);

    if (selectedGame) {
      const selectedGameName = selectedGame.game_type_name;
      const urlFriendlyGameName = selectedGameName
        .toLowerCase()
        .replace(/\s+/g, '-');
      const url = `/create/${urlFriendlyGameName}`;

      setSelectedGameType(shortName);
      setGameModeLocal(shortName);
      setStep(1);

      dispatch(setGameMode(selectedGameName));
      navigate(url);
    }
  };

  // Render sub-components
  const step1 = () => {
    const defaultBetAmounts = [0.25, 0.5, 1, 2.5, 10];

    return (
      <Box className="game-info-panel">
        <Box className="glass-container">
          <Box>
            <RadioGroup value={selectedGameType} onChange={handleChange}>
              <h3 className="game-sub-title roll-tag">
                Add Game
                <Tooltip
                  style={{ position: 'absolute', right: '20px' }}
                  title="Select a game-mode to use as collateral against your capital."
                  placement="top"
                >
                  <Info style={{ cursor: 'pointer', float: 'right' }} />
                </Tooltip>
              </h3>
              <StyledRadioGrid>
                {gameTypeList
                  .filter((gameType) => gameType.short_name !== 'Custom')
                  .map((gameType, index) => (
                    <FormControlLabel
                      key={index}
                      value={gameType.short_name}
                      control={
                        <Radio
                          icon={<div style={{ display: 'none' }} />}
                          checkedIcon={<div style={{ display: 'none' }} />}
                        />
                      }
                      label={
                        <StyledProductCard
                          id="rps-game-type-radio"
                          isDarkMode={isDarkMode}
                          className={`btn-game-type title btn-icon ${
                            gameTypeStyleClass[gameType.short_name]
                          } ${
                            selectedGameType === gameType.short_name
                              ? 'active'
                              : ''
                          }`}
                        >
                          <StyledProductImage
                            src={`/img/gametype/icons/${gameType.short_name}.svg`}
                            alt={gameType.game_type_name}
                          />
                          <span className="label" style={{ marginTop: '0' }}>
                            {gameType.game_type_name}
                          </span>
                        </StyledProductCard>
                      }
                    />
                  ))}

                <FormControlLabel
                  value="Custom"
                  control={<Radio style={{ opacity: 0, position: 'absolute' }} />}
                  label={
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange({ target: { value: 'Custom' } });
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <GameSettingsPanel
                        isCustomLabel={true}
                        selectedStrategy={selectedStrategy}
                        setSelectedStrategy={setSelectedStrategy}
                        gameCode={gameCode}
                        setGameMode={setGameModeLocal}
                        setGameModeLocal={setGameModeLocal}
                        setSelectedGameType={setSelectedGameType}
                        setGameCode={setGameCode}
                        prompt={prompt}
                        initializeGameType={initializeGameType}
                        onChangeState={onChangeState}
                        user={user}
                        gameMode={gameMode}
                        rank={getRank(user.totalWagered)}
                        ai_mode={aiMode}
                        isDarkMode={isDarkMode}
                        strategies={strategies}
                      />
                    </div>
                  }
                />
              </StyledRadioGrid>
            </RadioGroup>
            <RoomTaxInfo gameMode={gameMode} />
          </Box>
          {gameMode === 'QS' && (
            <Box sx={{ mt: '20px' }}>
              <h3 className="game-sub-title roll-tag">
                Choose a Game Type
                <Tooltip
                  style={{ position: 'absolute', right: '20px' }}
                  title="Select the multiplier of the player, 5x is typically the safest option for the Host."
                  placement="top"
                >
                  <Info style={{ cursor: 'pointer', float: 'right' }} />
                </Tooltip>
              </h3>
              <Box
                className="qs-game-type-panel"
                style={{ textAlign: 'center', marginBottom: '30px' }}
              >
                {[2, 3, 4, 5].map((i) => (
                  <Button
                    variant="outlined"
                    color="error"
                    key={i}
                    sx={{ mr: 1 }}
                    className={qsGameType === i ? 'active' : ''}
                    onClick={() => {
                      onChangeState({
                        qs_game_type: i,
                        max_return: betAmount * Number(i),
                        public_bet_amount: convertToCurrency(
                          betAmount * Number(i - 1),
                          solPrice,
                        ),
                        selected_qs_position: 0,
                      });
                    }}
                  >
                    {i}x
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          <CoinInfo
            onChangeState={onChangeState}
            name={name}
            image={image}
            ticker={ticker}
            isDarkMode={isDarkMode}
          />

          <DefaultBetAmountPanel
            tax={tax}
            endgame_amount={endgameAmount}
            bet_amount={betAmount}
            onChangeState={onChangeState}
            game_type={gameType}
            defaultBetAmounts={defaultBetAmounts}
          />
        </Box>
      </Box>
    );
  };

  const actionPanel = () => {
    return (
      <Box
        className="action-panel"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          bottom: '20%',
          mt: '15px',
          mb: '30px',
        }}
      >
        {step === 1 ? (
          <span></span>
        ) : (
          <Button id="btn_prev" color="error" onClick={onPrevButtonClicked}>
            Previous
          </Button>
        )}
        {step === 2 && (
          <Button id="btn_skip" color="error" onClick={onSkipButtonClicked}>
            Skip
          </Button>
        )}
        {step === 2 && (
          <div style={{ position: 'relative' }}>
            <Button id="btn_bet" color="error" onClick={onCreateRoom}>
              Place Bet
            </Button>
            
          </div>
        )}
        {step < 2 && (
          <Button id="btn_next" color="error" onClick={onNextButtonClicked}>
            Next
          </Button>
        )}
      </Box>
    );
  };

  // Main render
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
              marginBottom: '10px',
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
            : '100%',
        }}
      >
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

        <Box className="main-panel" sx={{ p: 2 }}>
          <Dialog open={openDialog} onClose={handleCancel}>
            <DialogTitle>CONFIRM GAME SETTINGS?</DialogTitle>
            <DialogContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipConfirm}
                    onChange={(e) => setSkipConfirm(e.target.checked)}
                  />
                }
                label="Don't show this confirmation again"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleConfirm} variant="contained" color="error">
                LFG
              </Button>
            </DialogActions>
          </Dialog>

          <Box
            className="main-title desktop-only"
            style={{ marginBottom: '10px' }}
          >
            <Button
              variant="text"
              color="error"
              onClick={() => {
                navigate('/');
              }}
              className="label"
              id="liveStakes"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              &nbsp;Go Back
            </Button>
          </Box>
          <Box className="create-game-panel">
            <Box className="game-page">
              <Box className="game-contents title" sx={{ p: 2 }}>
                <Summary shortVersion={false} />
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
                    handleUrlChange={() => {}}
                    handleSubmit={() => {}}
                    handleDescriptionChange={handleDescriptionChange}
                  />
                )}
              </Box>
            </Box>
          </Box>
          {step !== 4 && actionPanel()}
          <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawerHandler} />
        </Box>

        {!isMobile && (
          <div className="mobile-only main-page-nav-button-group">
            <Button
              className={`mobile-tab-live ${
                selectedMobileTab === 'live_games' ? 'active' : ''
              }`}
              onClick={() => setSelectedMobileTab('live_games')}
            >
              {selectedMobileTab === 'live_games' && 'BEAT THE HOUSE'}
            </Button>
            <Button
              className={`mobile-tab-my ${
                selectedMobileTab === 'my_games' ? 'active' : ''
              }`}
              onClick={() => setSelectedMobileTab('my_games')}
            >
              {selectedMobileTab === 'my_games' && 'YOUR GAMES'}
            </Button>
            <Button
              className={`mobile-tab-marketplace ${
                selectedMobileTab === 'marketplace' ? 'active' : ''
              }`}
              onClick={() => setSelectedMobileTab('marketplace')}
            >
              {selectedMobileTab === 'marketplace' && 'MARKETPLACE'}
            </Button>
            <Button
              className={`mobile-tab-chat ${
                selectedMobileTab === 'chat' ? 'active' : ''
              }`}
              onClick={() => setSelectedMobileTab('chat')}
            >
              {selectedMobileTab === 'chat' && 'CHAT'}
            </Button>
          </div>
        )}

        <Footer className="footer" open={isDrawerOpen} />
      </div>
    </LoadingOverlay>
  );
}

export default CreateGame;