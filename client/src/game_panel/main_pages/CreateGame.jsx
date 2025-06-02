import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Drawer,
  Box,
  Tooltip,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  CircularProgress,
} from '@mui/material';
import { sendSolDeposit } from '../../util/solana';
import { ArrowForward, ArrowBack, Info } from '@mui/icons-material';
import { getRank } from '../../util/getRank';
import axios from '../../util/Api';
import Footer from './Footer';
import Summary from '../CreateGame/Summary';
import AdvancedSettings from '../CreateGame/AdvancedSettings';
import ChatPanel from '../ChatPanel/ChatPanel';
import DrawerButton from './DrawerButton';
import CoinInfo from '../CreateGame/CoinInfo';
import DefaultBetAmountPanel from '../CreateGame/DefaultBetAmountPanel';
import SettingsRef from '../../components/SettingsRef';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import {
  createRoom,
  setGameMode,
  getGameTypeList,
} from '../../redux/Logic/logic.actions';
import { styled } from '@mui/material/styles';

import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getCustomTheme } from '../../config/theme';

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
  const [gameType, setGameType] = useState(9); // Default to Custom
  const [gameMode, setGameModeLocal] = useState('Custom');
  const [selectedGameType, setSelectedGameType] = useState('Custom');
  const [tax, setTax] = useState(5); // Default tax for custom games
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [xLink, setXLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [ticker, setTicker] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [], theme: {}, background: {} });
  const [prompt, setPrompt] = useState('');
  const [betAmount, setBetAmount] = useState(0.25);
  const [endgameAmount, setEndgameAmount] = useState(40);
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
  const [localBalance, setLocalBalance] = useState(balance);

  // Mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial setup
  useEffect(() => {
    dispatch(getGameTypeList());
    dispatch(setGameMode('Custom'));
    return () => { };
  }, [dispatch]);

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
    setStep(step > 1 ? step - 1 : step);
  };

  const onNextButtonClicked = () => {
    if (step === 1) {
      // Validate inputs
      if (!connectedAccount) {
        dispatch(errorMsgBar('CONNECT YOUR WALLET'));
        return;
      }
      if (gameCode === '') {
        dispatch(errorMsgBar("YOU DIDN'T GENERATE A GAME!"));
        return;
      }
      if (parseFloat(betAmount) <= 0 || isNaN(parseFloat(betAmount))) {
        dispatch(errorMsgBar("YOU DIDN'T BET (CAT) SHIT!!!"));
        return;
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

    setStep(step + 1);
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
      };

      await dispatch(createRoom(fullState, navigate));
    } catch (error) {
      console.error('[Front-end] Error uploading/resizing image:', error);
      dispatch(errorMsgBar('Failed to process image. Please try again.'));
    } finally {
      setCreatingRoom(false);
    }
  };

  // Step 1 - Game generation and basic info
  const step1 = () => {
    return (
      <Box className="game-info-panel" sx={{ width: '100%' }}>
        {/* AI Game Generator - Embedded SettingsRef */}
        <SettingsRef
          strategies={strategies}
          gameCode={gameCode}
          setGameCode={setGameCode}
          proxiedAssets={proxiedAssets}
          setProxiedAssets={setProxiedAssets}
          settings_panel_opened={true}
          description={description}
          ai_mode={aiMode}
          prompt={prompt}
          onChangeState={onChangeState}
          user_id={user._id}
          user_credits={user.credits}
          user_balance={user.balance}
          rank={getRank(user.totalWagered)}
          isDarkMode={isDarkMode}
          onClose={() => { }}
          ticker={ticker}
          image={image}
        />

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
          gameCode={gameCode}
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
            color="error"
            startIcon={<ArrowBack />}
            onClick={onPrevButtonClicked}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Previous
          </Button>
        )}

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Stepper activeStep={step - 1} alternativeLabel>
            {['Generate Game', 'Settings'].map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-completed': {
                        color: '#FF0000',
                      },
                      '&.Mui-active': {
                        color: '#FF0000',
                      },
                      '&:not(.Mui-completed):not(.Mui-active)': {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
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
            color="error"
            onClick={() => createRoomWithDeposit()}
            disabled={creatingRoom}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {creatingRoom ? (
              <>
                <CircularProgress size={20} sx={{ color: isDarkMode ? '#fff' : '#000' }} />
                Creating...
              </>
            ) : (
              'Create Room'
            )}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            endIcon={<ArrowForward />}
            onClick={onNextButtonClicked}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
            disabled={!gameCode} // Disable until game is generated
          >
            Next
          </Button>
        )}
      </Box>
    );
  };

  // Main render
  return (
    <Box className="main-game">
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
              p: isMobile ? '6px' : '8px 16px',
              minWidth: isMobile ? 'auto' : undefined,
              '& .MuiButton-startIcon': {
                marginRight: isMobile ? 0 : '8px',
                marginLeft: 0,
              },
              borderColor: 'error.main',
              borderWidth: 1,
              '&:hover': {
                borderColor: 'error.dark',
              },
            }}
          >
            {isMobile ? null : 'Go Back'}
          </Button>
          <Box sx={{ mb: 3 }}>
            <Summary shortVersion={false} />
          </Box>
          {step === 1 && step1()}
          {step === 2 && step2()}
        </Paper>

        {actionPanel()}
        <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawerHandler} />
      </Box>

      <Footer className="footer" open={isDrawerOpen} />
    </Box>
  );
}

export default CreateGame;