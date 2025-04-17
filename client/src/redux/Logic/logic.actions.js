import {
  UPDATE_CREATOR_PROMPT,
  GAMETYPE_LOADED,
  STRATEGIES_LOADED,
  RECENTLY_CLOSED_LOADED,
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
  RPSBETITEMS_LOADED,
  QSBETITEMS_LOADED,
  ROOMS_LOADED,
  UPDATE_BET_RESULT,
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
  SET_BALANCE,
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
  TRANSACTION_CANDLES_ERROR
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
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
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
  setLoading = () => {} // Optional callback to manage loading state in UI
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
    // Proxy all external URLs through the backend
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
export const generateReactGameFromPrompt = (
  user_id,
  gamePrompt,
  user_balance,
  setGameCode,
  onChangeState,
  updateUserPrompt,
  setGameLoading,
  preProxiedAssets = { images: [], audio: [] }
) => async (dispatch) => {


  if (!gamePrompt.trim()) {
    dispatch({ type: MSG_ERROR, payload: 'Please enter a valid app prompt.' });
    return;
  }

  dispatch({ type: START_LOADING });
  setGameLoading(true);

  try {
    const response = await axios.post('/game/openai/generate-react', {
      prompt: gamePrompt,
      imageUrls: preProxiedAssets.images.map(asset => asset.proxiedUrl),
    });

    const generatedCode = response.data.finalApp;
    setGameCode(generatedCode);

    if (typeof updateUserPrompt === 'function') {
      await updateUserPrompt(user_id, gamePrompt);
    } else {
      onChangeState({ prompt: gamePrompt });
    }

    dispatch({ type: MSG_SUCCESS, payload: 'Game generated successfully!' });
  } catch (error) {
    console.error('Error generating React app:', error);
    dispatch({
      type: MSG_ERROR,
      payload: error.response?.data?.message || 'Failed to generate React app.',
    });
    setGameCode(`
      import React from 'react';
      const App = () => {
        return <div style={{ padding: '20px', color: 'red' }}>Failed to generate app: ${error.message}</div>;
      };
      export default App;
    `);
  } finally {
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
export const goToCreate = (navigate) => async (dispatch) => {
  try {

    dispatch({
      type: UPDATE_CREATOR_PROMPT,
      payload: '',
    });

    navigate('/create');

  } catch (error) {
    dispatch({
      type: MSG_ERROR,
      payload: 'Failed to clear prompt.',
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
    dispatch({ type: START_BET });
    const res = await axios.post('/game/bet3', bet_info);
    dispatch({ type: END_BET });
    
    if (res.data.success) {
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
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
        dispatch({ type: MSG_WARNING, payload: 'THIS ROOM IS BUSY' });

        return {
          status: 'failed',
          message: res.data.message
        };
      } else {
        dispatch({ type: MSG_WARNING, payload: 'THIS ROOM IS BUSY' });
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

export const updateRoomGameCode = ({ roomId, gameCode }) => async (dispatch) => {
  try {
    const res = await axios.post('/game/room/update-gamecode', {
      roomId,
      gameCode,
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
    } else {
      dispatch({ type: MSG_WARNING, payload: res.data.message });
    }
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err });
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

export const listItem = data => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    const res = await axios.post('/item/list-for-sale', data);
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

export const deListItem = data => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    const res = await axios.post('/item/delist-from-sale', data);
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

export const confirmTrade = data => async dispatch => {
  try {
    dispatch({ type: TNX_INCOMPLETE });
    const res = await axios.post('/item/trade/', data);
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });
      dispatch({ type: TNX_COMPLETE });

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

export const fetchAccessory = data => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/item/accessory', data);
    if (res.data.success) {
      // dispatch({ type: FETCH_ACCESSORY_SUCCESS, payload: res.data });
      return res.data;
    }
  } catch (err) {
    // Handle the error if needed
  } finally {
    dispatch({ type: END_LOADING });
  }
  return false;
};

export const equipItem = data => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/item/equip/', data);

    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });
      return res.data;
    }
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'FAILED TO EQUIP ACCESSORY' });

  } finally {
    dispatch({ type: END_LOADING });
  }
  return false;
};

// logic.actions.js
export const getRoomList = (params) => async (dispatch) => {
  dispatch({ type: START_LOADING });
  try {
    const res = await axios.get('/game/rooms', { params });
    if (res.data.success) {
      dispatch({
        type: ROOMS_LOADED,
        payload: {
          roomList: res.data.roomList,
        },
      });
    }
  } catch (err) {
    console.error('Error fetching room list:', err);
  } finally {
    dispatch({ type: END_LOADING });
  }
};

// actions
export const getHistory = search_condition => async dispatch => {

  dispatch({ type: TNX_COMPLETE });

  try {
    const res = await axios.get('/game/history', { params: search_condition });
    if (res.data.success) {
      dispatch({ type: HISTORY_LOADED, payload: res.data });
      dispatch({ type: TNX_INCOMPLETE });

    }
  } catch (err) { }
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


export const getRpsBetItems = (room_id) => async dispatch => {
  try {
    const res = await axios.get(`/game/rpsbetitems/${room_id}`);
    if (res.data.success) {
      dispatch({ type: RPSBETITEMS_LOADED, payload: res.data });
    }
    return res.data;
  } catch (err) {
  }
};
export const getQsBetItems = (room_id) => async dispatch => {
  try {
    const res = await axios.get(`/game/qsbetitems/${room_id}`);
    if (res.data.success) {
      dispatch({ type: QSBETITEMS_LOADED, payload: res.data });
    }
    return res.data;
  } catch (err) {
  }
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

export const getRecentlyClosed = () => async dispatch => {
  try {
    const res = await axios.get('/game/recently-closed');
    if (res.data.success) {
      dispatch({ type: RECENTLY_CLOSED_LOADED, payload: res.data.rooms });
    }
  } catch (err) {
  }
};

export const getStrategies = () => async dispatch => {
  try {
    const res = await axios.get('/game/strategies');
    if (res.data.success) {
      dispatch({ type: STRATEGIES_LOADED, payload: res.data.strategies });
    }
  } catch (err) {
  }
};

export const updateUserStrategy = (user_id, strategy) => async dispatch => {
  try {
    const res = await axios.patch(`/game/strategies/${user_id}`, { strategy });
    if (res.data.success) {

      dispatch({ type: MSG_SUCCESS, payload: "AI PLAY STRATEGY UPDATED" });
    }
  } catch (err) {
    // Handle errors
  }
};
export const updateUserPrompt = (user_id, prompt) => async dispatch => {
  try {
    const res = await axios.patch(`/game/prompt/${user_id}`, { prompt });
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "AI PLAY PROMPT UPDATED" });

    }
  } catch (err) {
    // Handle errors
  }
};

export const updateRoomStrategy = (room_id, strategy) => async dispatch => {
  try {
    const res = await axios.patch(`/game/room/strategies/${room_id}`, { strategy });
    if (res.data.success) {

      dispatch({ type: MSG_SUCCESS, payload: "ROOM MODEL UPDATED" });
    }
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'UNABLE TO UPDATE ROOM MODEL' });

  }
};

export const getGameTypeList = () => async dispatch => {
  try {
    const res = await axios.get('/game/game_types');
    if (res.data.success) {
      dispatch({ type: GAMETYPE_LOADED, payload: res.data });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
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

export const endGame = (room_id, callback) => async (dispatch, getState) => {
  try {
    const res = await axios.post('/game/end_game', { room_id });

    if (res.data.success) {
      // Dispatch your new transaction & success message
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
    if (result.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "YOU BOUGHT SOME %!" });
    }
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
    const { auth: { connectedAccount } } = getState();

    const res = await axios.post('/game/jeet', { room_id, stake_amount, connectedAccount });

    if (res.data.success) {
      dispatch({
        type: MY_GAMES_LOADED,
        payload: {
          myGames: res.data.myGames,
          pages: res.data.pages,
          pageNumber: 1,
        },
      });
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      dispatch({ type: MSG_SUCCESS, payload: "YOU SOLD SOME %!" });

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

export const getMyHistory = search_condition => async dispatch => {
  try {
    const res = await axios.get('/game/my_history', {
      params: search_condition
    });
    if (res.data.success) {
      dispatch({ type: MY_HISTORY_LOADED, payload: res.data || [] });
    }
  } catch (err) {
    console.log(err);
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
