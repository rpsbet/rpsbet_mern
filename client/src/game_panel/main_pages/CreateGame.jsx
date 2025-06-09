import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth'; // Add this import
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
import { sendSolDeposit, createAccountFromPrivyUser } from '../../util/solana'; // Add createAccountFromPrivyUser import
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
  const { user: privyUser } = usePrivy(); // Add Privy hook

  // Redux state selectors
  const connectedAccount = useSelector((state) => state.auth.walletAddress);
  const balance = useSelector((state) => state.auth.liveWalletBalance || 0);
  const isLoadingBalance = useSelector((state) => state.logic.isLoadingBalance || false);
  const user = useSelector((state) => state.auth.user);
  const gameTypeList = useSelector((state) => state.logic.gameTypeList);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const strategies = useSelector((state) => state.logic.strategies);
  const isDrawerOpen = useSelector((state) => state.auth.isDrawerOpen);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const reduxAccount = useSelector((state) => state.logic.account); // Get Redux account
  const theme = getCustomTheme(isDarkMode);
  
  // Component state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');
  const [isAutopopulating, setIsAutopopulating] = useState(false);
  const [step, setStep] = useState(1);
  const [gameType, setGameType] = useState('strategy');
  const [gameMode, setGameModeLocal] = useState('strategy');
  const [selectedGameType, setSelectedGameType] = useState('strategy');
  const [tax, setTax] = useState(5);
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

  // Enhanced account creation function (same logic as in EliteSubscriptionModal)
  const createAccountWithFallbacks = useCallback(async () => {
    let account = null;
    
    // Method 1: Try creating from Privy user
    if (privyUser?.wallet?.address) {
      try {
        account = createAccountFromPrivyUser(privyUser);
        console.log('Account created from Privy user:', account);
      } catch (error) {
        console.error('Failed to create account from Privy user:', error);
      }
    }
    
    // Method 2: Try using Redux account
    if (!account && reduxAccount?.publicKey) {
      account = reduxAccount;
      console.log('Using Redux account:', account);
    }
    
    // Method 3: Try getting from connected wallet directly
    if (!account && window.solana?.publicKey) {
      try {
        account = {
          publicKey: window.solana.publicKey
        };
        console.log('Account created from window.solana:', account);
      } catch (error) {
        console.error('Failed to create account from window.solana:', error);
      }
    }
    
    // Method 4: Try connecting wallet if not connected
    if (!account && window.solana) {
      try {
        if (!window.solana.isConnected) {
          console.log('Wallet not connected, attempting to connect...');
          await window.solana.connect();
        }
        
        if (window.solana.publicKey) {
          account = {
            publicKey: window.solana.publicKey
          };
          console.log('Account created after wallet connection:', account);
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }

    // Final validation
    if (!account?.publicKey) {
      console.error('Failed to create account - no valid source found', {
        privyUser: !!privyUser?.wallet?.address,
        reduxAccount: !!reduxAccount?.publicKey,
        windowSolana: !!window.solana?.publicKey,
        walletConnected: window.solana?.isConnected
      });
      
      // Show user-friendly error
      dispatch(errorMsgBar('Wallet not connected. Please connect your Solana wallet and try again.'));
      return null;
    }

    console.log('Final account object:', {
      publicKey: account.publicKey.toString(),
      source: privyUser?.wallet?.address ? 'privy' : 
              reduxAccount?.publicKey ? 'redux' : 'wallet'
    });

    return account;
  }, [privyUser, reduxAccount, dispatch]);

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

  const toggleDrawerHandler = () => {
    dispatch(toggleDrawer(!isDrawerOpen));
  };

  // Handle description input
  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
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
      if (betAmount > balance) {
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

  // Updated create room with deposit function
  const createRoomWithDeposit = async () => {
    setCreatingRoom(true);

    try {
      // Create account with the enhanced fallback logic
      const account = await createAccountWithFallbacks();
      
      if (!account) {
        setCreatingRoom(false);
        return;
      }

      // Step 1: Trigger SOL deposit with proper account
      const depositResult = await sendSolDeposit(
        dispatch,
        betAmount,
        null, // room_id (null since room isn't created yet)
        name, // room_name
        'create_game', // type
        account, // Use the properly created account
        balance,
        () => {
          console.log('Deposit successful, proceeding with room creation');
        },
        (error) => {
          console.error('Deposit failed:', error);
          setCreatingRoom(false);
        }
      );

      if (!depositResult.success) {
        console.error('Deposit failed, aborting room creation');
        setCreatingRoom(false);
        return;
      }

      // Step 2: Proceed with image upload and room creation
      await createRoomWithImage();
    } catch (error) {
      console.error('Error in createRoomWithDeposit:', error);
      dispatch(errorMsgBar('Failed to create room. Please try again.'));
      setCreatingRoom(false);
    }
  };

  const createRoomWithImage = async () => {
    try {
      setCreatingRoom(true);
      
      let processableImageSrc = image;
  
      // Check if the image is from DALL-E (OpenAI blob storage)
      const isDalleImage = image && image.includes('oaidalleapiprodscus.blob.core.windows.net');
      
      if (isDalleImage) {
        console.log('[Front-end] Converting DALL-E image to processable format...');
        
        // Convert DALL-E URL to data URL via server
        const response = await axios.post('/game/convert-dalle-to-blob', {
          imageUrl: image
        });
  
        if (response.status !== 200) {
          throw new Error('Server responded with non-200 status for image conversion.');
        }
  
        const { success, dataUrl, message } = response.data;
        if (!success || !dataUrl) {
          throw new Error(message || 'Image conversion failed, no dataUrl received.');
        }
  
        processableImageSrc = dataUrl;
        console.log('[Front-end] DALL-E image converted successfully');
      }
  
      // Now use the same processing logic for both image types
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
  
      // Process the image (works for both DALL-E and manual uploads now)
      const resizedBlob = await saveImage(processableImageSrc);
      const formData = new FormData();
      formData.append('file', resizedBlob, 'resized-image.png');
  
      // Use your existing upload route
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
  
      console.log('[Front-end] Image processed and uploaded successfully:', imageUrl);
  
      // Create room with the processed image URL
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
      console.error('[Front-end] Error processing image:', error);
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
          balance={balance}
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
                <CircularProgress size={20} color='error' />
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
            disabled={!gameCode}
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
              position: 'relative',
              fontWeight: 500,
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