// CreateGame.js
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Box,
  Tooltip,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { sendSolDeposit } from '../../util/solana';
import { ArrowForward, ArrowBack, Info } from '@mui/icons-material';
import { getRank } from '../../util/getRank';
import axios from '../../util/Api';
import LoadingOverlay from 'react-loading-overlay';
import Footer from './Footer';
import Summary from '../CreateGame/Summary';
import AdvancedSettings from '../CreateGame/AdvancedSettings';
import ChatPanel from '../ChatPanel/ChatPanel';
import DrawerButton from './DrawerButton';
import CoinInfo from '../CreateGame/CoinInfo';
import DefaultBetAmountPanel from '../CreateGame/DefaultBetAmountPanel';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import {
  createRoom,
  setGameMode,
  getGameTypeList,
  getStrategies,
} from '../../redux/Logic/logic.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { getCustomTheme } from '../../config/theme';
import GameSelection from '../CreateGame/GameSelection';

// Random GIF selection for loading animation
const gifUrls = [
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef8e1ce09cd9cf53a4829_rock1.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef98d7e17a610c3ed83b9_paper2.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641efdcadd850ab47a768e04_scissors1.gif',
];

const getRandomGifUrl = () => {
  const randomIndex = Math.floor(Math.random() * gifUrls.length);
  return gifUrls[randomIndex];
};

const GlassContainer = styled(Box)`
  background: ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.65)'};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)'};
  box-shadow: ${({ isDarkMode }) =>
    isDarkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(31, 38, 135, 0.1)'};
  padding: 24px;
  transition: all 0.3s ease;
`;


function CreateGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { game_type_name } = useParams();

  // Redux state selectors
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const connectedAccount = useSelector((state) => state.auth.connectedAccount);
  const balance = useSelector((state) => state.logic.solanaBalance);
  const user = useSelector((state) => state.auth.user);
  const gameTypeList = useSelector((state) => state.logic.gameTypeList);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const strategies = useSelector((state) => state.logic.strategies);
  const isDrawerOpen = useSelector((state) => state.auth.isDrawerOpen);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const account = useSelector((state) => state.logic.account);
  const theme = getCustomTheme(isDarkMode);

  // Component state
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
  const [gameCode, setGameCode] = useState('');
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [], theme: {}, background: {} });
  const [prompt, setPrompt] = useState('');
  const [qsNation, setQsNation] = useState(0);
  const [selectedQsPosition, setSelectedQsPosition] = useState(0);
  const [betAmount, setBetAmount] = useState(0.25);
  const [endgameAmount, setEndgameAmount] = useState(20);
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
  const [localBalance, setLocalBalance] = useState(balance);

  // Confirmation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(localStorage.getItem('hideConfirmModal') === 'true');

  // Mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize game type based on URL parameter
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
    [gameTypeList],
  );

  // Initial setup based on URL
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
    initializeGameType(gameTypeName, true);

    return () => { };
  }, [dispatch, game_type_name, initializeGameType]);

  // Update game type when URL changes
  useEffect(() => {
    if (game_type_name) {
      initializeGameType(game_type_name, false);
    }
  }, [game_type_name, initializeGameType]);

  // Set custom game mode when code is entered
  useEffect(() => {
    if (gameCode.trim()) {
      setGameModeLocal('Custom');
      setSelectedGameType('Custom');
      setGameType(9);
    }
  }, [gameCode]);

  // Update local balance when Redux balance changes
  useEffect(() => {
    if (localBalance !== balance) {
      setLocalBalance(balance);
    }
  }, [balance, localBalance]);

  // Handle state changes from child components
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
    if ('gameCode' in newState) setGameCode(newState.gameCode);
    if ('proxiedAssets' in newState) setProxiedAssets(newState.proxiedAssets);
    if ('prompt' in newState) setPrompt(newState.prompt);
    if ('winChance' in newState) setWinChance(newState.winChance);
    if ('rps_game_type' in newState) setRpsGameType(newState.rps_game_type);
    if ('qs_game_type' in newState) setQsGameType(newState.qs_game_type);
    if ('qs_nation' in newState) setQsNation(newState.qs_nation);
    if ('selected_qs_position' in newState) setSelectedQsPosition(newState.selected_qs_position);
  };

  // Toggle drawer handler
  const toggleDrawerHandler = () => {
    dispatch(toggleDrawer(!isDrawerOpen));
  };

  // Handle description input
  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  // Navigation handlers
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
        if (gameMode === 'Quick Shoot' || (gameMode === 'RPS' && rpsGameType === 1)) {
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
      // Validate inputs
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

      // Set appropriate tax based on game mode
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

      // Additional validations
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

  // Create room with image upload
  const createRoomWithDeposit = async () => {
    setCreatingRoom(true);
  
    // Step 1: Trigger SOL deposit
    const depositResult = await sendSolDeposit(
      dispatch,
      betAmount,
      null, // room_id (null since room isn't created yet)
      name, // room_name
      'create_game', // type
      account,
      localBalance,
      () => {
        console.log('Deposit successful');
      },
      () => {
        console.error('Deposit failed');
        setCreatingRoom(false);
      }
    );
  
    if (!depositResult.success) {
      console.error('Deposit failed, aborting room creation');
      return;
    }
  
    // Step 2: Proceed with image upload and room creation
    await createRoomWithImage();
  };
  
  const createRoomWithImage = async () => {
    try {
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
        proxiedAssets: proxiedAssets,
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
  
  const handleConfirm = async () => {
    if (skipConfirm) {
      localStorage.setItem('hideConfirmModal', 'true');
    }
    setOpenDialog(false);
    await createRoomWithDeposit();
  };

  const handleCancel = () => {
    setOpenDialog(false);
  };

  // Game type selection handler
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

  // Step 1 - Game selection and basic info
  const step1 = () => {
    return (
      <Box className="game-info-panel" sx={{ width: '100%' }}>
        <GameSelection
          gameTypeList={gameTypeList}
          selectedGameType={selectedGameType}
          handleChange={handleChange}
          isDarkMode={isDarkMode}
          theme={theme}
          gameMode={gameMode}
          setGameModeLocal={setGameModeLocal}
          setSelectedGameType={setSelectedGameType}
          gameCode={gameCode}
          setGameCode={setGameCode}
          proxiedAssets={proxiedAssets}
          setProxiedAssets={setProxiedAssets}
          prompt={prompt}
          setPrompt={setPrompt}
          initializeGameType={initializeGameType}
          onChangeState={onChangeState}
          user={user}
          rank={getRank(user.totalWagered)}
          ai_mode={aiMode}
          strategies={strategies}
        />

        {gameMode === 'QS' && (
          <GlassContainer isDarkMode={isDarkMode} sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography
                variant="h6"
                component="h3"
                className="game-sub-title"
                sx={{
                  fontWeight: 600,
                  position: 'relative',
                  color: isDarkMode ? '#fff' : '#000',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -6,
                    left: 0,
                    width: '40px',
                    height: '3px',
                    background: theme.palette.error.main,
                    borderRadius: '2px',
                  },
                }}
              >
                Choose a Game Type
              </Typography>
              <Tooltip
                title="Select the multiplier of the player, 5x is typically the safest option for the Host."
                placement="top"
              >
                <Info
                  sx={{
                    cursor: 'pointer',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    '&:hover': { color: theme.palette.error.main },
                    transition: 'color 0.2s ease',
                  }}
                />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[2, 3, 4, 5].map((i) => (
                <Button
                  key={i}
                  variant="outlined"
                  isDarkMode={isDarkMode}
                  isActive={qsGameType === i}
                  onClick={() => {
                    onChangeState({
                      qs_game_type: i,
                      max_return: betAmount * Number(i),
                      public_bet_amount: convertToCurrency(betAmount * Number(i - 1), solPrice),
                      selected_qs_position: 0,
                    });
                  }}
                  sx={{
                    minWidth: '60px',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {i}x
                </Button>
              ))}
            </Box>
          </GlassContainer>
        )}

        <CoinInfo
          onChangeState={onChangeState}
          name={name}
          image={image}
          ticker={ticker}
          description={description}
          x_link={xLink}
          website_link={websiteLink}
          telegram_link={telegramLink}
          isDarkMode={isDarkMode}
        />

        <DefaultBetAmountPanel
          tax={tax}
          endgame_amount={endgameAmount}
          bet_amount={betAmount}
          onChangeState={onChangeState}
          game_type={gameType}
          defaultBetAmounts={[0.25, 0.5, 1, 2.5, 10]}
          balance={localBalance}
          isDarkMode={isDarkMode}
        />
      </Box>
    );
  };

  // Step 2 - Advanced settings
  const step2 = () => {
    return (
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
    );
  };

  // Action panel for navigation
  const actionPanel = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          pr: 4,
          pl: 4,
          mb: 4,
          gap: 2,
        }}
      >
        {step > 1 && (
          <Button
            variant="outlined"
            isDarkMode={isDarkMode}
            isActive={false}
            color='error'
            startIcon={<ArrowBack />}
            onClick={onPrevButtonClicked}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Previous
          </Button>
        )}

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Stepper activeStep={step - 1} alternativeLabel>
            {['Game', 'Extra'].map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      // Style for completed steps (tick mark)
                      '&.Mui-completed': {
                        color: '#D32F2F', // Red color for the tick
                      },
                      // Optional: Style for active step (if you want the active step to have a red circle or other styling)
                      '&.Mui-active': {
                        color: '#D32F2F', // Red for active step
                      },
                      // Optional: Style for inactive steps
                      '&:not(.Mui-completed):not(.Mui-active)': {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', // Default for inactive steps
                      },
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                      fontWeight: step === index + 1 ? 600 : 400,
                    }}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {step === 2 ? (
          <Button
            variant="contained"
            color='error'
            isDarkMode={isDarkMode}
            isActive={true}
            onClick={createRoomWithDeposit}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Create Room
          </Button>
        ) : (
          <Button
            variant="contained"
            color='error'
            isDarkMode={isDarkMode}
            isActive={true}
            endIcon={<ArrowForward />}
            onClick={onNextButtonClicked}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
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
        <Box sx={{ textAlign: 'center' }}>
          <img
            src={getRandomGifUrl()}
            alt="Random Spinner"
            style={{
              width: '60px',
              display: 'block',
              margin: '0 auto',
              marginBottom: '16px',
            }}
          />
          <Typography variant="body1" sx={{ color: isDarkMode ? '#fff' : '#000' }}>
            Creating Battle Room...
          </Typography>
        </Box>
      }
    >
      <Box className="main-game" isDarkMode={isDarkMode}>
        {isMobile && selectedMobileTab === 'chat' && (
          <Drawer
            className="mat-chat"
            variant="persistent"
            anchor="left"
            open={isDrawerOpen}
            sx={{
              '& .MuiDrawer-paper': {
                width: '260px',
                bgcolor: isDarkMode ? '#1E293B' : '#fff',
                borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            <ChatPanel />
          </Drawer>
        )}

        <Box className="main-panel" sx={{ maxWidth: '1200px', mx: 'auto', width: '100%' }}>
          <Dialog open={openDialog} onClose={handleCancel}>
            <DialogTitle>Confirm Game Settings</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Are you sure you want to create this game with the current settings?
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipConfirm}
                    onChange={(e) => setSkipConfirm(e.target.checked)}
                    color="error"
                  />
                }
                label="Don't show this confirmation again"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleConfirm} variant="contained" color="error">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>


          <Paper
            elevation={0}
            sx={{
              background: 'transparent',
              borderRadius: '16px',
              pl: { xs: 2, md: 3 },
              pr: { xs: 2, md: 3 },
              mb: 4,
            }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
              onClick={() => navigate('/')}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                position: 'absolute',
                p: isMobile ? '6px' : '8px 16px', // Smaller padding on mobile, standard otherwise
                minWidth: isMobile ? 'auto' : undefined, // Prevent wide button on mobile
                '& .MuiButton-startIcon': {
                  marginRight: isMobile ? 0 : '8px', // Add spacing between icon and text for non-mobile
                  marginLeft: 0, // Ensure no extra left margin
                },
                // Ensure consistent borders with theme
                borderColor: 'error.main',
                borderWidth: 1,
                '&:hover': {
                  borderColor: 'error.dark',
                },
              }}
            >
              {isMobile ? null : 'Go Back'} {/* Simplified text expression */}
            </Button>
            <Box sx={{ mb: 3 }}>

              <Summary shortVersion={false} />
            </Box>
            {step === 1 && step1()}
            {step === 2 && step2()}
          </Paper>

          {step !== 4 && actionPanel()}
          <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawerHandler} />
        </Box>

        <Footer className="footer" open={isDrawerOpen} />
      </Box>
    </LoadingOverlay>
  );
}

export default CreateGame;