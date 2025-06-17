import {
  UPDATE_CREATOR_PROMPT,
  GAMETYPE_LOADED,
ROOM_IDS_LOADED,
INDIVIDUAL_ROOM_LOADED,
INDIVIDUAL_ROOM_LOADING,
INDIVIDUAL_ROOM_ERROR,
RESET_ROOM_LOADING,
ROOMS_RESET,
  
  TOP_WITHDRAWALS_LOADED,
  ROOMINFO_LOADED,
  START_LOADING,
  END_LOADING,
  START_BET,
  END_BET,
  MY_GAMES_LOADING,
  TNX_COMPLETE,
  TNX_INCOMPLETE,
  SET_TOKEN_PRICE,
  SET_SOL_TO_USD_PRICE,
  TRADE_LOADING,
  PREPEND_OLDER_CHAT_MESSAGES,
  SET_FETCHING_OLDER_MESSAGES,
  TOP_WINS,
  APPEND_NEW_CANDLE,
  COMMENT_CREATION_FAILED,
  COMMENTS_LOADED,
  COMMENTS_LOAD_FAILED,
  COMMENT_DELETED,
  COMMENT_DELETION_FAILED,

  ROOMS_LOADED,
  SET_SOLANA_ACCOUNT,
  SET_SOLANA_BALANCE,
  UPDATE_BANKROLL,
  UPDATE_BANKROLL_QS,
  MSG_SUCCESS,
  MSG_ERROR,
  MSG_CREATE_ROOM_SUCCESS,
  MSG_ROOMS_LOAD_FAILED,
  MSG_GAMETYPE_LOAD_FAILED,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL,
  MY_GAMES_LOADED,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  SET_NOTIFICATIONS_ROOM_INFO,
  HISTORY_LOADED,
  NEW_TRANSACTION,
  ONLINE_USER_LIST_UPDATED,
  MSG_WARNING,
  SELECT_MAIN_TAB,
  MY_CHAT_LOADED,
  NOTIFICATIONS_LOADED,
  NEW_NOTIFICATION,
  GLOBAL_CHAT_RECEIVED,
  SET_GLOBAL_CHAT,
  SET_HIGHLIGHTED_ROOMS,
  CLEAR_HIGHLIGHTED_ROOMS,
} from '../types';
import axios from '../../util/Api';

// CreateRoom
export const createRoom = (room_info, navigate) => async dispatch => {
  const body = JSON.stringify(room_info);
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/rooms', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      dispatch({ type: MSG_CREATE_ROOM_SUCCESS, payload: res.data.message });
      // dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      // dispatch({ type: SET_BALANCE, payload: res.data.newTransaction });
    } else {
      dispatch({ type: MSG_WARNING, payload: res.data.message });
    }
    navigate('/portfolio');
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err });
  }
};

export const startLoading = () => async (dispatch) => {
  dispatch({ type: START_LOADING });
};

export const endLoading = () => async (dispatch) => {
  dispatch({ type: END_LOADING });
};


export const verifyGameResult = (
  user_id, // Kept for consistency, though not used in the request
  inputLog,
  setLoading = () => { } // Optional callback to manage loading state in UI
) => async (dispatch) => {
  if (!inputLog || !Array.isArray(inputLog) || inputLog.length === 0) {
    dispatch({ type: MSG_ERROR, payload: 'Input log is required, must be an array, and cannot be empty.' });
    return null;
  }

  dispatch({ type: START_LOADING });
  setLoading(true);

  try {
    const response = await axios.post('/game/verify', {
      inputLog: inputLog,
    }); // No headers, assuming auth is handled elsewhere

    const { hasUserInteraction, status, result, multiplier, reason } = response.data;

    // console.log('🎮 Verification Response:', { hasUserInteraction, status, result, multiplier, reason });

    if (!hasUserInteraction) {
      dispatch({ type: MSG_ERROR, payload: 'Game verification failed: No user interaction detected.' });
    } else {
      dispatch({ type: MSG_SUCCESS, payload: `Game verified: ${result} (Multiplier: ${multiplier}) - ${reason}` });
    }

    // Return the result directly instead of storing in Redux
    return { hasUserInteraction, status, result, multiplier, reason };
  } catch (error) {
    console.error('❌ Error verifying game result:', error);
    const errorMessage = error.response?.data?.reason || 'Failed to verify game result. Please try again.';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return null; // Return null on error
  } finally {
    dispatch({ type: END_LOADING });
    setLoading(false);
  }
};

export const proxyAsset = (key, url) => async (dispatch) => {
  try {
    const response = await axios.get('/game/proxy-asset', {
      params: { url },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const proxiedUrl = URL.createObjectURL(blob);
    return { key, proxiedUrl };
  } catch (error) {
    console.error('Error proxying asset:', error);
    dispatch({ type: MSG_ERROR, payload: `Failed to load asset: ${url}` });
    return { key, proxiedUrl: null };
  }
};

export const getRoomIds = (params = {}) => async (dispatch) => {
  dispatch({ type: START_LOADING });
  dispatch({ type: RESET_ROOM_LOADING });
  
  try {
    const requestParams = {
      ...params,
      limit: 30 // Number of rooms to load
    };
    
    const res = await axios.get('/game/rooms/ids', { params: requestParams });
    
    if (res.data.success) {
      dispatch({
        type: ROOM_IDS_LOADED,
        payload: {
          roomIds: res.data.roomIds,
          gameType: params.game_type || 'All'
        },
      });
      
      // Start loading individual rooms immediately
      dispatch(startLoadingIndividualRooms(res.data.roomIds));
    } else {
      throw new Error(res.data.err || 'Failed to fetch room IDs');
    }
  } catch (err) {
    console.error('Error fetching room IDs:', err);
    dispatch({
      type: INDIVIDUAL_ROOM_ERROR,
      payload: { error: err.message }
    });
  } finally {
    dispatch({ type: END_LOADING });
  }
};

// Load individual rooms with staggered timing
export const startLoadingIndividualRooms = (roomIds) => async (dispatch) => {
  // Shuffle array to load rooms in random order (like YouTube)
  const shuffledIds = [...roomIds].sort(() => Math.random() - 0.5);
  
  // Load rooms with random delays to simulate real network conditions
  shuffledIds.forEach((roomId, index) => {
    const delay = Math.random() * 2000; // Random delay up to 2 seconds
    
    setTimeout(() => {
      dispatch(loadIndividualRoom(roomId));
    }, delay);
  });
};

// Load a single room
export const loadIndividualRoom = (roomId) => async (dispatch) => {
  dispatch({
    type: INDIVIDUAL_ROOM_LOADING,
    payload: { roomId }
  });
  
  try {
    const res = await axios.get(`/game/room/${roomId}`);
    
    if (res.data.success) {
      dispatch({
        type: INDIVIDUAL_ROOM_LOADED,
        payload: {
          roomId,
          room: res.data.room
        },
      });
    } else {
      throw new Error(res.data.error || 'Failed to fetch room');
    }
  } catch (err) {
    console.error(`Error fetching room ${roomId}:`, err);
    dispatch({
      type: INDIVIDUAL_ROOM_ERROR,
      payload: { 
        roomId,
        error: err.message 
      }
    });
  }
};


export const autopopulateRoomInfo = async (gameCode, onChangeState, dispatch) => {
  if (!gameCode || !gameCode.trim()) {
    console.log('[AutoPopulate] No game code provided');
    return null;
  }

  try {
    console.log('[AutoPopulate] Starting extraction process...');

    // Step 1: Extract room information from game code
    const extractResponse = await axios.post('/game/extract-room-info', {
      gameCode: gameCode
    });

    if (!extractResponse.data || extractResponse.status !== 200) {
      throw new Error('Failed to extract room information');
    }

    const { name, ticker, description, gameTheme, confidence } = extractResponse.data;
    console.log('[AutoPopulate] Extracted info:', { name, ticker, description, gameTheme, confidence });

    // Step 2: Only proceed if we got meaningful data
    if (name === 'Default Game' || ticker === 'GAME' || confidence < 0.6) {
      console.log('[AutoPopulate] Low confidence or default values, skipping auto-populate');
      return null;
    }

    // Step 3: Generate image based on extracted info
    let imageUrl = null;
    try {
      console.log('[AutoPopulate] Generating image for:', name);

      const imagePrompt = `Create a clean, modern logo for a game called "${name}". 
        Game theme: ${gameTheme}. 
        Style: Simple, bold, professional logo design with solid background. 
        Gaming aesthetic, high contrast, perfect for use as a coin/token icon. 
        Square format, minimal design. No text in the image.`;

      const imageResponse = await axios.post('/game/generate-image', {
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'standard'
      });

      if (imageResponse.data?.imageUrl) {
        imageUrl = imageResponse.data.imageUrl;
        console.log('[AutoPopulate] Image generated successfully');
      }
    } catch (imageError) {
      console.warn('[AutoPopulate] Image generation failed:', imageError.message);
      // Continue without image - user can upload manually
    }

    // Step 4: Prepare updates object
    const updates = {};

    if (name && name !== 'Default Game' && name.length >= 3 && name.length <= 20) {
      updates.name = name;
    }

    if (ticker && ticker !== 'GAME' && ticker.length >= 2 && ticker.length <= 6) {
      updates.ticker = ticker;
    }

    if (description && description.length > 20) {
      updates.description = description;
    }

    if (imageUrl) {
      updates.image = imageUrl;
    }

    // Step 5: Apply updates if any
    if (Object.keys(updates).length > 0) {
      console.log('[AutoPopulate] Applying updates:', updates);
      onChangeState(updates);

      return {
        name: updates.name || name,
        ticker: updates.ticker || ticker,
        description: updates.description || description,
        imageUrl,
        confidence
      };
    }

    return null;

  } catch (error) {
    console.error('[AutoPopulate] Failed:', error);
    return null;
  }
};

// Improved manualAutopopulate function
export const manualAutopopulate = async (gameCode, onChangeState, dispatch, overwrite = false) => {
  if (!gameCode || !gameCode.trim()) {
    dispatch({
      type: 'MSG_ERROR',
      payload: 'No game code available to analyze. Please generate a game first.'
    });
    return null;
  }

  try {
    console.log('Manual auto-populate triggered');
    const result = await autopopulateRoomInfo(gameCode, onChangeState, dispatch);
    return result;
  } catch (error) {
    console.error('Manual auto-populate failed:', error);
    dispatch({
      type: 'MSG_ERROR',
      payload: 'Failed to auto-populate room information'
    });
    return null;
  }
};

export const generateReactGameFromPrompt = (
  user_id,
  user_credits,
  gamePrompt,
  setGameCode,
  setProxiedAssets,
  onChangeState,
  setGameLoading,
  preProxiedAssets = { images: [], audio: [] },
  model = 'o3-mini',
  onStreamUpdate = null
) => async (dispatch) => {
  if (!gamePrompt.trim()) {
    dispatch({ type: MSG_ERROR, payload: 'Please enter a valid app prompt.' });
    return;
  }

  const cost = model === 'o3' ? 12 : 8;
  if (user_credits < cost) {
    dispatch({ type: MSG_ERROR, payload: `Not enough credits, need ${cost} credits.` });
    return;
  }

  dispatch({ type: START_LOADING });
  setGameLoading(true);

  // Progress simulation with randomized intervals
  let progressInterval = null;
  if (onStreamUpdate && typeof onStreamUpdate === 'function') {
    let progress = 0;
    const progressMessages = [
      { progress: 5, message: 'Preparing to generate your game...' },
      { progress: 15, message: 'Analyzing your prompt...' },
      { progress: 25, message: 'Designing game mechanics...' },
      { progress: 35, message: 'Building interactive elements...' },
      { progress: 45, message: 'Implementing score system...' },
      { progress: 55, message: 'Creating multiplier logic...' },
      { progress: 65, message: 'Adding visual effects...' },
      { progress: 75, message: 'Finalizing components...' },
      { progress: 85, message: 'Transpiling code on server...' },
      { progress: 95, message: 'Almost ready...' }
    ];

    let messageIndex = 0;

    const scheduleNextMessage = () => {
      if (messageIndex < progressMessages.length) {
        const currentMessage = progressMessages[messageIndex];
        onStreamUpdate({
          type: 'status',
          message: currentMessage.message,
          progress: currentMessage.progress
        });
        messageIndex++;

        // Schedule next message with random delay between 1-10 seconds
        const randomDelay = Math.floor(Math.random() * 16000) + 2000; // 1000ms to 11000ms
        progressInterval = setTimeout(scheduleNextMessage, randomDelay);
      }
    };

    // Start the first message immediately
    scheduleNextMessage();
  }

  try {
    const response = await axios.post('/game/generate-react', {
      prompt: gamePrompt,
      imageUrls: preProxiedAssets.images.map(asset => asset.proxiedUrl),
      model,
    });

    if (progressInterval) {
      clearTimeout(progressInterval);
    }

    // Backend now returns both original and transpiled code
    const { transpiledCode, proxiedAssets } = response.data;

    // Use transpiled code for execution
    setGameCode(transpiledCode);
    setProxiedAssets(proxiedAssets);

    // Final progress update
    if (onStreamUpdate) {
      onStreamUpdate({
        type: 'complete',
        message: 'Game generated successfully!',
        progress: 100
      });
    }

    dispatch({ type: MSG_SUCCESS, payload: 'Game generated successfully!' });

    // Return the result with transpiled code
    return { payload: { finalApp: transpiledCode, proxiedAssets } };

  } catch (error) {
    if (progressInterval) {
      clearTimeout(progressInterval);
    }

    console.error('Error generating React app:', error);
    dispatch({
      type: MSG_ERROR,
      payload: error.response?.data?.message || error.message || 'Failed to generate React app.',
    });

    // Simple error component (no transpilation needed)
    const errorComponent = `
(function(React) {
  return function ErrorApp() {
    return React.createElement('div', {
      style: {
        padding: '20px',
        color: '#FF0000',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        textAlign: 'center'
      }
    }, [
      React.createElement('h3', { key: 'title' }, 'Generation Failed'),
      React.createElement('p', { key: 'error' }, 'Error: ${error.message}'),
      React.createElement('p', { key: 'retry' }, 'Please try again with a different prompt.')
    ]);
  };
})`;

    setGameCode(errorComponent);
    throw error;
  } finally {
    if (progressInterval) {
      clearTimeout(progressInterval);
    }
    dispatch({ type: END_LOADING });
    setGameLoading(false);
  }
};

export const submitAiPrompt = (aiPrompt, navigate) => async (dispatch) => {

  try {
    if (!aiPrompt.trim()) {
      dispatch({
        type: MSG_ERROR,
        payload: 'Please enter a valid prompt.',
      });
      return;
    }

    dispatch({
      type: UPDATE_CREATOR_PROMPT,
      payload: aiPrompt,
    });

    navigate('/create');

  } catch (error) {
    console.error('Error in submitAiPrompt:', error);
    dispatch({
      type: MSG_ERROR,
      payload: 'Failed to submit prompt.',
    });
  }
};

export const goToCreate = (navigate, promptText = '') => async (dispatch) => {
  try {
    dispatch({
      type: UPDATE_CREATOR_PROMPT,
      payload: promptText.trim(),
    });
    navigate('/create');

  } catch (error) {
    dispatch({
      type: MSG_ERROR,
      payload: 'Failed to set prompt.',
    });
  }
};

// logic.actions.js
export const uploadImageToPinata = (formData) => async (dispatch) => {
  try {
    // dispatch({ type: UPLOAD_IMAGE_REQUEST });
    const response = await axios.post('/game/upload-to-pinata', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.status !== 200) {
      throw new Error('Failed to upload image to Pinata.');
    }
    const { imageUrl } = response.data;

    // dispatch({ type: UPLOAD_IMAGE_SUCCESS, payload: imageUrl });
    return imageUrl;
  } catch (error) {
    console.log("eerrrr", error)
    // dispatch({ type: UPLOAD_IMAGE_FAILURE, payload: error.message });
    throw error;
  }
};

export const uploadAvatarToPinata = (file) => async (dispatch) => {
  try {
    // Create canvas for resizing (similar to your game image logic)
    const resizeAvatar = (file) => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        
        img.onload = () => {
          // Avatar-specific sizing (square, smaller than game images)
          const maxSize = 200; // 200x200 for avatars
          let width = img.width;
          let height = img.height;
          
          // Make it square by cropping to center
          const size = Math.min(width, height);
          const x = (width - size) / 2;
          const y = (height - size) / 2;
          
          canvas.width = maxSize;
          canvas.height = maxSize;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw cropped and resized image
          ctx.drawImage(img, x, y, size, size, 0, 0, maxSize, maxSize);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject('Failed to generate avatar blob.');
            }
          }, 'image/webp', 0.8); // Use WebP for better compression
        };
        
        img.onerror = (error) => {
          reject('Error processing avatar: ' + error);
        };
        
        reader.readAsDataURL(file);
      });
    };

    // Resize the avatar
    const resizedBlob = await resizeAvatar(file);
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', resizedBlob, 'avatar.webp');

    // Use your existing Pinata upload endpoint
    const response = await axios.post('/game/upload-to-pinata', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to upload avatar to Pinata.');
    }

    const { success, imageUrl, message } = response.data;
    if (!success || !imageUrl) {
      throw new Error(message || 'Avatar upload failed, no imageUrl received.');
    }

    console.log('✅ Avatar uploaded to Pinata:', imageUrl);
    return imageUrl;

  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    dispatch(errorMsgBar('Failed to upload avatar. Please try again.'));
    throw error;
  }
};


export const getGlobalChatLogs = () => async dispatch => {
  try {
    ;
    const res = await axios.post('/game/getGlobalChatLogs');

    if (res.data.success) {
      dispatch({
        type: SET_GLOBAL_CHAT,
        payload: res.data.chatLogs
      });
    } else {
      dispatch({ type: MSG_ERROR, payload: res.data.message });
    }
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: err.message });
  }
};

export const getSolToUsdPrice = (solAmount = null) => async (dispatch) => {
  try {
    const solPriceKey = 'solPrice';
    const usdValueKey = 'usdValue';
    const timestampKey = 'solPriceTimestamp';
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Check if data exists in localStorage
    const cachedPrice = localStorage.getItem(solPriceKey);
    const cachedUsdValue = localStorage.getItem(usdValueKey);
    const cachedTimestamp = localStorage.getItem(timestampKey);

    const now = Date.now();

    // If cached data exists and is not expired, use it
    if (cachedPrice && cachedTimestamp && now - cachedTimestamp < expiryTime) {
      const solPrice = parseFloat(cachedPrice);
      const usdValue = solAmount ? solAmount * solPrice : parseFloat(cachedUsdValue);

      dispatch({
        type: SET_SOL_TO_USD_PRICE,
        payload: { solPrice, usdValue },
      });

      return;
    }

    // If no valid cached data, fetch from the server
    const response = await axios.post('/stripe/get_sol_to_usd', {
      solAmount,
    });

    const { solPrice, usdValue } = response.data;

    // Store new data and timestamp in localStorage
    localStorage.setItem(solPriceKey, solPrice);
    if (usdValue !== null) {
      localStorage.setItem(usdValueKey, usdValue);
    }
    localStorage.setItem(timestampKey, now);

    // Dispatch to Redux
    dispatch({
      type: SET_SOL_TO_USD_PRICE,
      payload: { solPrice, usdValue },
    });
  } catch (error) {
    console.error('Error fetching SOL to USD price:', error);
  }
};

export const setHighlightedRooms = (rooms) => ({
  type: SET_HIGHLIGHTED_ROOMS,
  payload: rooms, // typically an array of IDs
});

export const setSolanaAccount = (account) => ({
  type: SET_SOLANA_ACCOUNT,
  payload: account,
});

export const setSolanaBalance = (solanaBalance) => ({
  type: SET_SOLANA_BALANCE,
  payload: solanaBalance,
});


export const clearHighlightedRooms = () => ({
  type: CLEAR_HIGHLIGHTED_ROOMS,
});

export const getTokenPrice = (tokenMintAddress) => async (dispatch) => {
  try {
    const response = await axios.post('/stripe/get_token_price', {
      tokenMintAddress,
      web2Amount: 1,
    });

    const { tokenPrice } = response.data;

    dispatch({
      type: SET_TOKEN_PRICE,
      payload: tokenPrice,
    });
  } catch (error) {
    console.error('Error fetching token price:', error);
  }
};

// player
export const bet3 = bet_info => async dispatch => {
  try {
    // console.log('Betting info:', bet_info);
    dispatch({ type: START_BET });
    const res = await axios.post('/game/bet3', bet_info);
    dispatch({ type: END_BET });

    if (res.data.success) {
      // dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      return {
        status: 'success',
        betResult: res.data.betResult,
        roomStatus: res.data.roomStatus,
        amount: res.data.newTransaction.amount
      };
    } else {
      if (res.data.betResult === -100) {
        dispatch({ type: MSG_WARNING, payload: 'SLOW DOWN!' });

        return {
          status: 'failed',
          message: 'SLOW DOWN!'
        };
      } else if (res.data.betResult === -102) {
        // dispatch({ type: MSG_WARNING, payload: 'THIS ROOM IS BUSY' });

        return {
          status: 'failed',
          message: res.data.message
        };
      } else {
        // dispatch({ type: MSG_WARNING, payload: 'THIS ROOM IS BUSY' });
        return {
          status: 'failed',
          message: 'SLOW DOWN BLUD!'
        };
      }
    }
  } catch (err) {
    console.log(err);
  }

  return {
    status: 'failed'
  };
};

export const loadRoomInfo = roomInfo => {
  return {
    type: ROOMINFO_LOADED,
    payload: roomInfo
  };
};

// GetRoomInfo
export const getRoomInfo = (room_id, limit, showLoader) => async (dispatch) => {
  try {
    if (showLoader) {
      dispatch({ type: START_LOADING });
    }
    // Use limit param
    const apiURL = limit
      ? `/game/room/${room_id}?limit=${limit}`
      : `/game/room/${room_id}`;

    const res = await axios.get(apiURL);
    if (res.data.success) {
      dispatch({ type: ROOMINFO_LOADED, payload: res.data });
    } else {
      dispatch({ type: MSG_ROOMS_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_ROOMS_LOAD_FAILED, payload: err });
  } finally {
    if (showLoader) {
      dispatch({ type: END_LOADING });
    }
  }
};

// CreateComment
export const createComment = (commentData) => async (dispatch) => {
  try {
    const res = await axios.post('/game/comments', commentData);
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "COMMENT ADDED" });
    } else {
      // Optionally, handle failure here
      dispatch({ type: COMMENT_CREATION_FAILED });
    }
    return res.data; // Return the response to the caller
  } catch (err) {
    console.error("Error while creating comment:", err);
    dispatch({ type: COMMENT_CREATION_FAILED, payload: err });
    return { success: false, error: err }; // Return error to the caller
  } finally {
  }
};

// GetCommentsForRoom
export const getCommentsForRoom = (room_id) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.get(`/game/comments/${room_id}`);
    if (res.data.success) {
      dispatch({ type: COMMENTS_LOADED, payload: res.data.comments });
    } else {
      dispatch({ type: COMMENTS_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: COMMENTS_LOAD_FAILED, payload: err });
  } finally {
    dispatch({ type: END_LOADING });
  }
};

// DeleteComment
export const deleteComment = (comment_id) => async (dispatch) => {
  try {
    const res = await axios.delete(`/game/comments/${comment_id}`);
    if (res.data.success) {
      dispatch({ type: COMMENT_DELETED, payload: comment_id });

      return { success: true, commentId: comment_id };
    } else {
      dispatch({ type: COMMENT_DELETION_FAILED });

      return { success: false, error: res.data.err || 'Unknown error' };
    }
  } catch (err) {
    dispatch({ type: COMMENT_DELETION_FAILED, payload: err });

    return { success: false, error: err.message };
  } finally {
    // Dispatch end loading action if needed
  }
};

export const updateRoomGameCode = ({ roomId, gameCode, proxiedAssets }) => async (dispatch) => {
  try {
    const res = await axios.post('/game/room/update-gamecode', {
      roomId,
      gameCode,
      proxiedAssets
    });

    if (res.data.success) {
      // Optionally dispatch a success message or update state
      dispatch({
        type: MSG_SUCCESS,
        payload: 'Room game code updated successfully!',
      });
    } else {
      dispatch({
        type: MSG_WARNING,
        payload: res.data.message,
      });
    }
  } catch (err) {
    dispatch({
      type: MSG_WARNING,
      payload: err.response?.data?.message || 'Failed to update room game code',
    });
  }
};

export const actionRoom = ({ roomId, type }) => async dispatch => {
  try {
    const res = await axios.patch(`/game/room/${roomId}/${type}`);

    if (res.data.success) {
      // Don't need to dispatch anything here - socket will handle the update
      return Promise.resolve(); // Return resolved promise for optimistic updates
    } else {
      dispatch({ type: MSG_WARNING, payload: res.data.message });
      return Promise.reject(new Error(res.data.message)); // Reject for error handling
    }
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err.message || err });
    return Promise.reject(err); // Reject for error handling
  }
};

export const checkGamePassword = data => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/checkGamePassword/', data);
    if (res.data.success) {
      return true;
    }
  } catch (err) {
  } finally {
    dispatch({ type: END_LOADING });
  }
  return false;
};

export const listLoan = data => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    const res = await axios.post('/loan/list-for-sale', data);
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

      return res.data;
    }
  } catch (err) {
  } finally {
    dispatch({ type: TNX_COMPLETE });
  }
  return false;
};

export const deListLoan = data => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    const res = await axios.post('/loan/withdraw-loan', data);
    if (res.data.success) {
      return res.data;
    }
  } catch (err) {
  } finally {
    dispatch({ type: TNX_COMPLETE });
  }
  return false;
};

export const confirmLoan = data => async dispatch => {
  try {
    dispatch({ type: TNX_INCOMPLETE });
    const res = await axios.post('/loan/lend/', data);
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

      return res.data;
    } else {
      return res.data;
    }
  } catch (err) {
  } finally {
    dispatch({ type: TNX_COMPLETE });
  }
  return false;
};

export const offerLoan = data => async dispatch => {
  try {
    dispatch({ type: TNX_INCOMPLETE });
    const res = await axios.post('/loan/offer-loan/', data);
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

      return res.data;
    } else {
      return res.data;
    }
  } catch (err) {
  } finally {
    dispatch({ type: TNX_COMPLETE });
  }
  return false;
};

// logic.actions.js
export const getRoomList = (params = {}) => async (dispatch) => {
  dispatch({ type: START_LOADING });
  dispatch({ type: ROOMS_RESET }); // Clear existing rooms when fetching new filter
  
  try {
    const requestParams = {
      ...params,
      page: 1,
      limit: 10 // Start with small batch
    };
    
    const res = await axios.get('/game/rooms', { params: requestParams });
    
    if (res.data.success) {
      dispatch({
        type: ROOMS_LOADED,
        payload: {
          roomList: res.data.roomList,
          pagination: res.data.pagination,
          gameType: params.game_type || 'All'
        },
      });
    } else {
      throw new Error(res.data.err || 'Failed to fetch rooms');
    }
  } catch (err) {
    console.error('Error fetching room list:', err);
    dispatch({
      type: ROOMS_ERROR,
      payload: err.message
    });
  } finally {
    dispatch({ type: END_LOADING });
  }
};

export const loadMoreRooms = (params = {}, currentPage = 1) => async (dispatch) => {
  dispatch({ type: ROOMS_LOADING_MORE });
  
  try {
    const requestParams = {
      ...params,
      page: currentPage + 1,
      limit: 10
    };
    
    const res = await axios.get('/game/rooms', { params: requestParams });
    
    if (res.data.success) {
      dispatch({
        type: ROOMS_BATCH_LOADED,
        payload: {
          roomList: res.data.roomList,
          pagination: res.data.pagination
        },
      });
    } else {
      throw new Error(res.data.err || 'Failed to fetch more rooms');
    }
  } catch (err) {
    console.error('Error fetching more rooms:', err);
    dispatch({
      type: ROOMS_ERROR,
      payload: err.message
    });
  }
};

export const getHistory = search_condition => async dispatch => {
  dispatch({ type: TNX_COMPLETE });

  try {
    const res = await axios.get('/game/history', { params: search_condition });
    if (res.data.success) {
      // Dispatch with just the latest item
      dispatch({
        type: HISTORY_LOADED,
        payload: { history: res.data.latestItem, cached: res.data.cached }
      });
      dispatch({ type: TNX_INCOMPLETE });
    }
  } catch (err) {
    console.error('Error fetching latest history:', err);
    dispatch({ type: TNX_INCOMPLETE });
  }
};

export const getWins = () => async dispatch => {
  try {
    const res = await axios.get('/game/topWins');
    if (res.data.success) {
      dispatch({ type: TOP_WINS, payload: res.data.history });

    }
  } catch (err) { }
};
export const getWithdrawals = () => async dispatch => {
  try {
    const res = await axios.get('/game/topWithdrawals');
    if (res.data.success) {
      dispatch({ type: TOP_WITHDRAWALS_LOADED, payload: res.data.history });

    }
  } catch (err) { }
};

export const editPayout = (amount, rowId) => async dispatch => {
  try {
    const result = await axios.post('/game/editPayout/', { amount, rowId });
    if (result.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "UPDATED PAYOUT SETTINGS" });
      return result.data;
    }
  } catch (e) {
    dispatch({ type: MSG_ERROR, payload: 'UNABLE TO EDIT PAYOUT SETTINGS' });
  }
};

export const getTopGameTypes = () => async dispatch => {
  try {
    const res = await axios.get('/game/game_types/top'); // Call the new endpoint
    if (res.data.success) {
      // Dispatch a new action type or repurpose an existing one carefully
      // Let's use a new one for clarity: TOP_GAME_TYPES_LOADED
      dispatch({ type: 'TOP_GAME_TYPES_LOADED', payload: res.data.gameTypes });
    }
  } catch (err) {
    console.error('Error fetching top game types:', err);
    // You might want to dispatch an error action here
  }
};

// Keep getGameTypeList if it's used elsewhere (e.g., in CreateGame for all known game types)
export const getGameTypeList = () => async dispatch => {
  try {
    const res = await axios.get('/game/game_types');
    if (res.data.success) {
      dispatch({ type: 'GAMETYPE_LOADED', payload: res.data.gameTypeList }); // Payload is now an array of full GameType docs
    } else {
      dispatch({ type: 'MSG_GAMETYPE_LOAD_FAILED' });
    }
  } catch (err) {
    dispatch({ type: 'MSG_GAMETYPE_LOAD_FAILED', payload: err });
  }
};

export const getMyGames = (search_condition, callback) => async (dispatch) => {
  try {
    dispatch({ type: MY_GAMES_LOADING, payload: true });

    // Fetch data from the backend
    const res = await axios.get('/game/my_games', {
      params: { ...search_condition },
    });

    if (res.data.success) {
      // Dispatch success
      dispatch({
        type: MY_GAMES_LOADED,
        payload: { ...res.data },
      });

      // Optional callback
      if (callback) callback(res.data);
    } else {
      // Handle failure
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }
  } catch (err) {
    console.error('Error while fetching games:', err);
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  } finally {
    dispatch({ type: MY_GAMES_LOADING, payload: false });
  }
};

export const endGame = (room_id, connectedAccount, callback) => async (dispatch, getState) => {
  try {
    const res = await axios.post('/game/end_game', { room_id, connectedAccount });

    if (res.data.success) {
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      dispatch({ type: MSG_SUCCESS, payload: "GAME HAS NOW ENDED" });

      if (callback) callback();
    } else {
      dispatch({ type: MSG_ERROR, payload: res.data.message });
    }
  } catch (err) {
    console.error("Error ending game:", err);
    dispatch({ type: MSG_ERROR, payload: "An error occurred while ending the game." });
  }
};


export const pumpGame = (amount, rowId, connectedAccount) => async dispatch => {
  // Set loading state to true before starting the request
  dispatch({ type: TRADE_LOADING, payload: true });
  try {
    const result = await axios.post('/game/pump/', { amount, rowId, connectedAccount });
    // if (result.data.success) {
    //   dispatch({ type: MSG_SUCCESS, payload: "YOU BOUGHT SOME %!" });
    // }
    return result.data;
  } catch (e) {
    dispatch({ type: MSG_ERROR, payload: 'UNABLE TO CO-HOST' });
  } finally {
    // Always remove the loading state after the request completes
    dispatch({ type: TRADE_LOADING, payload: false });
  }
};

// Jeet endpoint with loading state
export const jeetGame = (room_id, stake_amount, callback) => async (dispatch, getState) => {
  // Set loading state to true before starting the request
  dispatch({ type: TRADE_LOADING, payload: true });
  try {
    // Retrieve connectedAccount from the auth state
    const { auth: { walletAddress } } = getState();

    const res = await axios.post('/game/jeet', { room_id, stake_amount, walletAddress });

    if (res.data.success) {
      dispatch({
        type: MY_GAMES_LOADED,
        payload: {
          myGames: res.data.myGames,
          pages: res.data.pages,
          pageNumber: 1,
        },
      });
      // dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      // dispatch({ type: MSG_SUCCESS, payload: "YOU SOLD SOME %!" });

      if (callback) callback(null, res.data);
    } else {
      if (res.data.already_finished) {
        dispatch({ type: MSG_ERROR, payload: 'GAME HAS ALREADY FINISHED' });
      }
      if (callback) callback(res.data.message);
    }
  } catch (err) {
    console.error(err);
    dispatch({ type: MSG_ERROR, payload: 'SOMETHING WENT WRONG, TRY AGAIN LATER' });
    if (callback) callback(err);
  } finally {
    // Always remove the loading state after the request completes
    dispatch({ type: TRADE_LOADING, payload: false });
  }
};


export const someActionToAppendCandle = (newCandle) => (dispatch) => {
  dispatch({ type: APPEND_NEW_CANDLE, payload: newCandle });
};

export const getTransactionCandles = ({ roomId, timeFrame }) => async (dispatch) => {
  try {
    const res = await axios.get(`/game/candles/${roomId}`, {
      params: { timeFrame }
    });
    if (res.data.success) {
      dispatch({
        type: 'TRANSACTION_CANDLES_LOADED',
        payload: res.data || [],
      });
    } else {
      console.error('Error fetching candles data:', res.data.err);
      dispatch({
        type: 'TRANSACTION_CANDLES_ERROR',
        payload: res.data.err || 'Error fetching candles data.',
      });
    }
  } catch (err) {
    console.error('Error fetching candles data:', err);
    dispatch({
      type: 'TRANSACTION_CANDLES_ERROR',
      payload: err.message || 'Error fetching candles data.',
    });
  }
};

// logic.actions.js
export const markChatAsRead = (fromId) => async dispatch => {
  try {
    // Call the backend route
    await axios.post('/game/mark_chat_as_read', { fromId });

    // Option A: Just re-fetch all chats so the unread counts update
    dispatch(getMyChat());

    // Option B: Or manually adjust store to set that user's unread_message_count = 0
    // (If you prefer not to re-fetch.)
  } catch (err) {
    console.error('Error in markChatAsRead:', err);
  }
};

export const getMyChat = () => async dispatch => {
  try {

    const res = await axios.get('/game/my_chat');
    if (res.data.success) {
      dispatch({ type: MY_CHAT_LOADED, payload: res.data.myChat });

    }
  } catch (err) {
    console.log(err);
  }
};
export const getNotifications = () => async dispatch => {
  try {
    const res = await axios.get('/game/notifications');
    if (res.data.success) {
      dispatch({ type: NOTIFICATIONS_LOADED, payload: res.data.notifications });
    }
  } catch (err) {
    console.log(err);
  }
};

export const readNotifications = () => async dispatch => {
  try {
    const markReadResponse = await axios.patch('/game/read_notifications');

    if (markReadResponse.data.success) {

      const fetchNotificationsResponse = await axios.get('/game/notifications');
      if (fetchNotificationsResponse.data.success) {
        dispatch({ type: NOTIFICATIONS_LOADED, payload: fetchNotificationsResponse.data.notifications });
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export const addNewNotification = data => dispatch => {
  dispatch({ type: NEW_NOTIFICATION, payload: data });
};

export const loadOlderChatMessages = (userId) => async (dispatch, getState) => {
  try {
    // Read how many messages are currently in the Redux store
    const { chatLogs, hasMore } = getState().logic.chatRoomInfo || {};
    if (!hasMore) return; // If there's no more data, bail early

    const currentCount = (chatLogs || []).length;

    // Indicate we’re loading older messages
    dispatch({ type: SET_FETCHING_OLDER_MESSAGES, payload: true });

    // Call server with the offset = current number of messages
    const res = await axios.post('/game/get_chat_room_info', {
      user_id: userId,
      offset: currentCount,
      limit: 20
    });

    if (res.data.success) {
      const olderBatch = res.data.chatRoomInfo.chatLogs;
      const olderHasMore = res.data.chatRoomInfo.hasMore;

      // Dispatch the older messages to prepend them
      dispatch({
        type: PREPEND_OLDER_CHAT_MESSAGES,
        payload: {
          olderBatch,
          hasMore: olderHasMore,
        },
      });
    }
  } catch (err) {
    console.error('Error loading older messages:', err);
  } finally {
    // Stop the spinner
    dispatch({ type: SET_FETCHING_OLDER_MESSAGES, payload: false });
  }
};

export const getChatRoomInfo = (user_id, offset = 0, limit = 20) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });

    const res = await axios.post('/game/get_chat_room_info', {
      user_id,
      offset,
      limit
    });

    if (res.data.success) {
      dispatch({
        type: SET_CHAT_ROOM_INFO,
        payload: {
          ...res.data.chatRoomInfo,
          offset,
          limit,
        }
      });
      dispatch({ type: END_LOADING });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }

  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
};

export const updateBankroll = bankroll => {
  return {
    type: UPDATE_BANKROLL,
    payload: bankroll
  };
};

export const updateBankrollQs = bankroll => {
  return {
    type: UPDATE_BANKROLL_QS,
    payload: bankroll
  };
};

// actions/logic.actions.js
export const setRoomList = (newRoom) => (dispatch, getState) => {
  try {
    const oldList = getState().logic.roomList || [];
    let updatedList;

    if (Array.isArray(newRoom)) {
      // Replace entire list
      updatedList = newRoom;
    } else {
      // Prepend single item
      const isDuplicate = oldList.some((room) => room._id === newRoom._id);
      if (isDuplicate) return;
      updatedList = [newRoom, ...oldList];
    }

    dispatch({
      type: ROOMS_LOADED,
      // Don't force page=1 here
      payload: { roomList: updatedList },
    });
  } catch (err) {
    console.error('Error updating room list:', err);
  }
};

export const removeRoomFromList = (roomId) => (dispatch, getState) => {
  try {
    const oldList = getState().logic.roomList || [];
    const updatedList = oldList.filter((room) => room._id !== roomId);

    dispatch({
      type: ROOMS_LOADED,
      // If you still want to reset page to 1, you can keep `page: 1`.
      payload: { roomList: updatedList, page: 1 },
    });
  } catch (err) {
    console.error('Error removing room from list:', err);
  }
};

export const setGameMode = game_mode => dispatch => {
  dispatch({ type: SET_GAME_MODE, payload: game_mode });
};

export const setCurRoomInfo = room_info => dispatch => {
  dispatch({ type: SET_CUR_ROOM_INFO, payload: room_info });
};

export const setNotificationsRoomInfo = room_info => dispatch => {
  dispatch({ type: SET_NOTIFICATIONS_ROOM_INFO, payload: room_info });
};

export const setChatRoomInfo = room_info => dispatch => {
  dispatch({ type: SET_CHAT_ROOM_INFO, payload: room_info });
};

export const setGlobalChat = payload => dispatch =>
  dispatch({ type: SET_GLOBAL_CHAT, payload });

const getNow = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = '0' + (date.getMonth() + 1);
  const day = '0' + date.getDate();
  const seconds = '0' + date.getSeconds();
  const minutes = '0' + date.getMinutes();
  const hours = '0' + date.getHours();

  return `${year}-${month.substr(-2)}-${day.substr(-2)}T${hours.substr(
    -2
  )}:${minutes.substr(-2)}:${seconds.substr(-2)}.000Z`;
};

export const addChatLog = (chatLog) => (dispatch, getState) => {
  const myId = getState().auth.user._id;
  const otherId = myId === chatLog.from ? chatLog.to : chatLog.from;
  let chatRoomInfo = getState().logic.chatRoomInfo;
  if (chatRoomInfo && chatRoomInfo.user_id === otherId) {
    chatRoomInfo.chatLogs = chatRoomInfo.chatLogs
      ? [...chatRoomInfo.chatLogs, chatLog]
      : [chatLog];
    dispatch({ type: SET_CHAT_ROOM_INFO, payload: chatRoomInfo });
  }
};

export function updateBetResult(betResult) {
  return {
    type: 'UPDATE_BET_RESULT',
    betResult
  };
}

const dispatchedTransactionIds = new Set();

export const addNewTransaction = (data) => (dispatch) => {
  if (dispatchedTransactionIds.has(data._id)) {
    return; // Prevent duplicate dispatch
  }

  dispatchedTransactionIds.add(data._id); // Add the transaction ID to the Set
  dispatch({ type: NEW_TRANSACTION, payload: data });
};

export const setUrl = url => dispatch => {
  dispatch({ type: SET_URL, payload: url });
};

export const updateOnlineUserList = user_list => dispatch => {
  dispatch({ type: ONLINE_USER_LIST_UPDATED, payload: user_list });
};

export const selectMainTab = index => dispatch => {
  dispatch({ type: SELECT_MAIN_TAB, payload: index });
};

export const globalChatReceived = data => dispatch => {
  dispatch({ type: GLOBAL_CHAT_RECEIVED, payload: data });
};
