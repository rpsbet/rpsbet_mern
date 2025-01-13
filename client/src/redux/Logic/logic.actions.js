import {
  ACTION_ROOM,
  GAMETYPE_LOADED,
  STRATEGIES_LOADED,
  RECENTLY_CLOSED_LOADED,
  TOP_WITHDRAWALS_LOADED,
  ROOMINFO_LOADED,
  START_LOADING,
  END_LOADING,
  START_BET,
  END_BET,
  ATTACHED,
  TNX_COMPLETE,
  TNX_INCOMPLETE,
  SET_TOKEN_PRICE,
  SET_SOL_TO_USD_PRICE,
  COMMENT_CREATED,
  TOP_WINS,
  ADD_NEW_CANDLE,
  SET_QBOT_STATUSES,
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
  UPDATE_RAIN,
  UPDATE_BANKROLL_QS,
  BET_SUCCESS,
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
  GLOBAL_CHAT_RECEIVED,
  SET_GLOBAL_CHAT,
  TRANSACTION_CANDLES_LOADED,
  TRANSACTION_CANDLES_ERROR
} from '../types';
import axios from '../../util/Api';
import history from '../history';

// CreateRoom
export const createRoom = room_info => async dispatch => {
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
    history.push('/dashboard');
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err });
  }
};
// reCreateRoom
export const reCreateRoom = room_id => async dispatch => {
  const body = JSON.stringify(room_id);
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/reCreate', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      dispatch({ type: MSG_CREATE_ROOM_SUCCESS, payload: res.data.message });
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      // dispatch({ type: SET_BALANCE, payload: res.data.newTransaction });
    } else {
      dispatch({ type: MSG_WARNING, payload: res.data.message });
    }
    history.push('/');
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err });
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


// join game
export const bet = bet_info => async dispatch => {
  try {
    dispatch({ type: START_BET });
    const res = await axios.post('/game/bet', bet_info);

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
        history.push('/');
      dispatch({ type: MSG_WARNING, payload: 'THIS GAME HAS NOW ENDED' });

        return {
          status: 'failed',
          message: 'THIS GAME HAS NOW ENDED'
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


// auto join game
export const bet2 = bet_info => async dispatch => {
  try {
    dispatch({ type: START_BET });
    const res = await axios.post('/game/bet2', bet_info);
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
        history.push('/');
      dispatch({ type: MSG_WARNING, payload: 'THIS GAME HAS NOW ENDED' });

        return {
          status: 'failed',
          message: 'THIS GAME HAS NOW ENDED'
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

// manual
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
        history.push('/');
      dispatch({ type: MSG_WARNING, payload: 'THIS GAME HAS NOW ENDED' });

        return {
          status: 'failed',
          message: 'THIS GAME HAS NOW ENDED'
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
// bot
export const bet4 = bet_info => async dispatch => {
  try {
    dispatch({ type: START_BET });
    const res = await axios.post('/game/bet4', bet_info);
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
        history.push('/');
        return {
          status: 'failed',
          message: 'THIS GAME HAS NOW ENDED'
        };
      } else if (res.data.betResult === -102) {
        return {
          status: 'failed',
          message: res.data.message
        };
      } else {
        dispatch({ type: MSG_WARNING, payload: 'ONE SEC, G' });
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
export const getRoomInfo = (room_id, limit, loading) => async dispatch => {
  try {
    if (loading) {
      dispatch({ type: START_LOADING });
    }
    // Include the 'limit' parameter in the API request URL if provided
    const apiURL = limit ? `/game/room/${room_id}?limit=${limit}` : `/game/room/${room_id}`;
    const res = await axios.get(apiURL);
    if (res.data.success) {
      dispatch({ type: ROOMINFO_LOADED, payload: res.data });
    } else {
      dispatch({ type: MSG_ROOMS_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_ROOMS_LOAD_FAILED, payload: err });
  } finally {
    if (loading) {
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


export const actionRoom = ({ roomId, type }) => async dispatch => {
  // dispatch({ type: START_LOADING });

  try {
    const res = await axios.patch(`/game/room/${roomId}/${type}`);

    if (res.data.success) {
      // Handle success case if needed
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
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

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


export const getRoomList = search_condition => async dispatch => {
  dispatch({ type: START_LOADING });

  try {
    let roomList = [];

    const cachedRooms = localStorage.getItem('roomList');
    if (cachedRooms) {
      try {
        roomList = JSON.parse(cachedRooms);
        dispatch({ type: ROOMS_LOADED, payload: { roomList } });
      } catch (parseError) {
        console.error('Error parsing cached room list:', parseError);
        localStorage.removeItem('roomList'); // Clear invalid data
      }
    } 

    if (roomList.length === 0) {
      const res = await axios.get('/game/rooms', { params: search_condition });
      if (res.data.success) {
        roomList = res.data.roomList;
        localStorage.setItem('roomList', JSON.stringify(roomList));
        dispatch({ type: ROOMS_LOADED, payload: { roomList } });
      }
    }
  } catch (err) {
    console.error('Error fetching room list:', err);
  } finally {
    dispatch({ type: END_LOADING });
  }
};

// actions
export const fetchMoreRooms = (search_condition) => async (dispatch) => {
  dispatch({ type: START_LOADING });
  try {
    const res = await axios.get('/game/rooms', { params: search_condition });
    if (res.data.success) {
      const newRoomList = res.data.roomList;
  
      localStorage.removeItem('roomList');
      localStorage.setItem('roomList', JSON.stringify(newRoomList));

      dispatch({ type: ROOMS_LOADED, payload: { roomList: newRoomList } });
    }
  } catch (err) {
    console.error('Error fetching more rooms:', err);
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

export const updateRpsBetItems = (itemId, cellindex, updatedItem) => async dispatch => {
  try {
    const res = await axios.put(`/game/rpsbetitems/${itemId}`, { cellindex, updatedItem });
    if (res.data.success) {
      dispatch({ type: RPSBETITEMS_LOADED, payload: res.data });
      dispatch({ type: MSG_SUCCESS, payload: "TRAINING DATA HAS BEEN UPDATED" });
    }
    return res.data;
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'TRAINING DATA FAILED TO UPDATE, CHECK VALUE IS CORRECT' });

  }
};
export const updateQsBetItems = (itemId, cellindex, updatedItem) => async dispatch => {
  try {
    const res = await axios.put(`/game/qsbetitems/${itemId}`, { cellindex, updatedItem });
    if (res.data.success) {
      dispatch({ type: QSBETITEMS_LOADED, payload: res.data });
      dispatch({ type: MSG_SUCCESS, payload: "TRAINING DATA HAS BEEN UPDATED" });
    }
    return res.data;
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'TRAINING DATA FAILED TO UPDATE, CHECK VALUE IS CORRECT' });
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
export const topUp = (amount, rowId) => async dispatch => {
  try {
    const result = await axios.post('/game/topUp/', { amount, rowId });
    if (result.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "TOP UP SUCCESSFUL" });
      return result.data;
    }
  } catch (e) {
    dispatch({ type: MSG_ERROR, payload: 'UNABLE TO TOP UP' });
  }
};

export const coHost = (amount, rowId) => async dispatch => {
  try {
    const result = await axios.post('/game/coHost/', { amount, rowId });
    if (result.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "YOU ARE NOW A CO-HOST!" });
      return result.data;
    }
  } catch (e) {
    dispatch({ type: MSG_ERROR, payload: 'UNABLE TO CO-HOST' });
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

export const updateRoomStrategy = (room_id, strategy) => async dispatch => {
  try {
    const res = await axios.patch(`/game/room/strategies/${room_id}`, { strategy });
    if (res.data.success) {

      dispatch({ type: MSG_SUCCESS, payload: "ROOM STRATEGY UPDATED" });
    }
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'UNABLE TO UPDATE ROOM STRATEGY' });

  }
};

export const kickBots = (room_id) => async (dispatch) => {
  try {
    let botRemoved = false;
    let loopCount = 0;
    while (!botRemoved && loopCount < 4) {
      const res = await axios.patch(`/game/rooms/${room_id}/remove-bots`);
      if (res.data.success) {
        dispatch({ type: MSG_SUCCESS, payload: 'All bots have been removed from the room!' });

        botRemoved = true;
      }

      loopCount++;
    }

    if (!botRemoved) {
      dispatch({ type: MSG_ERROR, payload: 'Failed to remove bots from the room' });
      throw new Error('Could not remove bots from the room after 4 attempts');
    }

    return true; // Bots successfully removed
  } catch (err) {
    dispatch({ type: 'MSG_ERROR', payload: 'Failed to remove bots from the room or room has ended' });
    return false;
  }
};

export const updateRoomBot = (room_id) => async dispatch => {
  try {
    let botAttached = false;
    let loopCount = 0;

    while (!botAttached && loopCount < 4) {
      const res = await axios.patch(`/game/rooms/${room_id}`);

      if (res.data.success) {
        dispatch({ type: MSG_SUCCESS, payload: "BOT HAS BEEN ATTACHED TO YOUR ROOM" });
        botAttached = true;
      }

      loopCount++;
    }

    if (!botAttached) {
      throw new Error('Could not attach bot to the room after 4 attempts');
      dispatch({ type: MSG_ERROR, payload: 'NO BOTS AVAILABLE' });
    }

    return true;
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'NO MORE BOTS OR ROOM HAS ENDED' });
    return false;
  }
};

export const checkPlayerAttachment = (room_id) => async dispatch => {
  try {
    const res = await axios.get(`/game/checkAttachment/${room_id}`);

    if (res.data.success) {
      if (res.data.attached) {
        dispatch({ type: ATTACHED, payload: res.data.attached });
      } else {
        dispatch({ type: ATTACHED, payload: false });
      }
    } else {
      dispatch({ type: MSG_ERROR, payload: 'Failed to check attachment' });
    }
  } catch (err) {
    console.error("API Error:", err);
    dispatch({ type: MSG_ERROR, payload: 'API request failed' });
  }
};
export const getAttachedRooms = () => async dispatch => {
  try {
    const res = await axios.get(`/game/getattachedrooms`);

    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "Retrieved Player's Attachments" });
      return res.data.attachments;
    } else {
      dispatch({ type: MSG_ERROR, payload: 'Failed to get attachments' });
    }
  } catch (err) {
    console.error("API Error:", err);
    dispatch({ type: MSG_ERROR, payload: 'API request failed' });
  }
};


export const attachPlayerToRoom = (room_id, bet_amounts) => async dispatch => {

  try {
    const res = await axios.patch(`/game/attachPlayer/${room_id}`, {
      bet_amounts
    });

    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "Attached AI to room" });
      dispatch({ type: ATTACHED, payload: true });

      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: res.data.message || 'Failed to attach player to the room' });
      dispatch({ type: ATTACHED, payload: false });

      return false;
    }
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'Internal server error or room not found' });
    return false;
  }
};

export const detachPlayerFromRoom = (room_id) => async dispatch => {
  try {
    const res = await axios.post(`/game/detachPlayer/${room_id}`);
    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "Detached AI from the room" });
      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: res.data.message || 'Failed to detach player from the room' });
      return false;
    }
  } catch (err) {
    dispatch({ type: MSG_ERROR, payload: 'Internal server error or room not found' });
    return false;
  }
};

export const getRoomBotCount = (room_id) => async (dispatch) => {
  try {
    const res = await axios.get(`/game/rooms/${room_id}/bots-count`);

    if (res.data.success) {
      const botCount = res.data.botCount;
      // You can dispatch an action here to handle the bot count
      // For example:
      // dispatch({ type: SET_BOT_COUNT, payload: botCount });
      return botCount;
    }
  } catch (err) {
    console.error('Error fetching bot count:', err.message);
    dispatch({ type: MSG_ERROR, payload: 'Error fetching bot count' });
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

export const getMyGames = (search_condition, callback) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });

    // Check if data is stored in localStorage
    const storedData = localStorage.getItem('myGamesData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      dispatch({ type: MY_GAMES_LOADED, payload: { ...parsedData } });
      if (callback) callback(parsedData); // Optional callback for immediate use
    }

    // Fetch updated data from the backend in the background
    const res = await axios.get('/game/my_games', {
      params: { ...search_condition }
    });

    if (res.data.success) {
      // Update localStorage and Redux store with the new data
      localStorage.setItem('myGamesData', JSON.stringify(res.data));
      dispatch({ type: MY_GAMES_LOADED, payload: { ...res.data } });
      if (callback) callback(res.data);
    } else {
      // Handle failure case
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }
  } catch (err) {
    console.error("Error while fetching games:", err);
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  } finally {
    dispatch({ type: END_LOADING });
  }
};

export const endGame = (room_id, callback) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    console.log("called");

    const res = await axios.post('/game/end_game', { room_id });
    console.log("res", res.data);

    if (res.data.success) {
      const storedData = localStorage.getItem('myGamesData');
      let updatedGames = [];

      if (storedData) {
        const parsedData = JSON.parse(storedData);

        updatedGames = parsedData.myGames.filter(game => game._id !== room_id);

        localStorage.setItem(
          'myGamesData',
          JSON.stringify({
            ...parsedData,
            myGames: updatedGames,
          })
        );

        dispatch({
          type: MY_GAMES_LOADED,
          payload: {
            myGames: updatedGames,
            pageNumber: 1,
          },
        });
      }

      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      dispatch({ type: MSG_SUCCESS, payload: "GAME HAS NOW ENDED" });

    } else {
      dispatch({ type: MSG_ERROR, payload: res.data.message });
    }
  } catch (err) {
    console.error("Error ending game:", err);
    dispatch({ type: MSG_ERROR, payload: "An error occurred while ending the game." });
  } finally {
    dispatch({ type: END_LOADING });
  }
};

export const unstake = (room_id, stake_amount, callback) => async dispatch => {
  try {
    const res = await axios.post('/game/unstake', { room_id, stake_amount });

    if (res.data.success) {
      dispatch({
        type: MY_GAMES_LOADED,
        payload: {
          myGames: res.data.myGames,
          pages: res.data.pages,
          pageNumber: 1
        }
      });
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
      dispatch({ type: MSG_SUCCESS, payload: "GREAT SUCCESS!!" });

      if (callback) callback(null, res.data);
    } else {
      if (res.data.already_finished) {
        // Handle if game already finished
      }
      if (callback) callback(res.data.message);
    }
  } catch (err) {
    console.error(err);
    dispatch({ type: MSG_ERROR, payload: 'SOMETHING WENT WRONG, TRY AGAIN LATER' });
    if (callback) callback(err);
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

export const addNewCandle = (newCandle) => {
  return {
    type: 'ADD_NEW_CANDLE',
    payload: newCandle,
  };
};

export const getTransactionCandles = ({ roomId, timeFrame }) => async (dispatch) => { 
  try {
    const res = await axios.get(`/game/candles/${roomId}`, {
      params: { timeFrame }
    });
console.log("cancled", res.data)
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

export const getQbotStatuses = (creatorIds) => async (dispatch) => {
  try {
    const res = await axios.get('/game/qbotStatuses', { params: { userIds: creatorIds.join(',') } });
    if (res.data.success) {
      const qBotStatuses = res.data.statuses;

      localStorage.setItem('qBotStatuses', JSON.stringify({
        data: qBotStatuses,
        timestamp: Date.now(),
      }));

      dispatch({
        type: 'SET_QBOT_STATUSES',
        payload: qBotStatuses,
      });

      return qBotStatuses;
    }
  } catch (error) {
    console.error('Error fetching QBot statuses:', error);
    return null;
  }
};

export const getQbot = (userId) => async dispatch => {
  try {
    const res = await axios.get('/game/qbotStatus', { params: { userId } }); // Use `params` for query

    if (res.data.success) {
      return res.data.isActive;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const updateQbot = (userId, isActive) => async dispatch => {
  try {
    const res = await axios.patch('/game/qbotStatus', { userId, isActive });

    if (res.data.success) {
      return res.data.isActive; // Return updated isActive value
    }
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const getMyChat = () => async dispatch => {
  try {
    dispatch({ type: START_LOADING });

    const res = await axios.get('/game/my_chat');
    if (res.data.success) {
      dispatch({ type: MY_CHAT_LOADED, payload: res.data.myChat });
      dispatch({ type: END_LOADING });

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

export const getChatRoomInfo = user_id => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/get_chat_room_info', { user_id });
    if (res.data.success) {
      dispatch({ type: SET_CHAT_ROOM_INFO, payload: res.data.chatRoomInfo });
      dispatch({ type: END_LOADING });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }

  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
};

const handleGameStart = async (dispatch, data, endpoint) => {
  dispatch({ type: START_LOADING });
  try {
    const res = await axios.post(endpoint, data);
    dispatch({ type: END_LOADING });
    if (res.data.success) {
      dispatch({ type: SET_BALANCE, payload: res.data.balance });
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const updateBankroll = bankroll => {
  return {
    type: UPDATE_BANKROLL,
    payload: bankroll
  };
};

export const updateRain = rain => {
  return {
    type: UPDATE_RAIN,
    payload: rain
  };
};

export const updateBankrollQs = bankroll => {
  return {
    type: UPDATE_BANKROLL_QS,
    payload: bankroll
  };
};


export const setRoomList = newRoom => dispatch => {
  try {
    let roomList = JSON.parse(localStorage.getItem('roomList')) || [];
    roomList = [newRoom, ...roomList];
    localStorage.setItem('roomList', JSON.stringify(roomList));
    dispatch({
      type: ROOMS_LOADED,
      payload: { roomList, page: 1 },
    });
  } catch (err) {
    console.error('Error updating room list in local storage:', err);
  }
};

export const removeRoomFromList = roomId => dispatch => {
  try {
    let roomList = JSON.parse(localStorage.getItem('roomList')) || [];
    roomList = roomList.filter(room => room._id !== roomId);
    localStorage.setItem('roomList', JSON.stringify(roomList));
    dispatch({
      type: ROOMS_LOADED,
      payload: { roomList, page: 1 },
    });
  } catch (err) {
    console.error('Error removing room from list in local storage:', err);
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

export const addChatLog = chatLog => (dispatch, getState) => {
  const myId = getState().auth.user._id;
  const myHistory = getState().logic.myHistory || [];

  let newHistory = JSON.parse(JSON.stringify(myHistory));

  const otherId = myId === chatLog.from ? chatLog.to : chatLog.from;

  newHistory[otherId] = {
    ...newHistory[otherId],
    unread_message_count:
      (newHistory[otherId] ? newHistory[otherId].unread_message_count : 0) + 1,
    _id: otherId,
    message: chatLog.message,
    is_read: chatLog.is_read,
    created_at_str: chatLog.created_at,
    updated_at: getNow()
  };

  dispatch({ type: MY_HISTORY_LOADED, payload: newHistory });

  let chatRoomInfo = getState().logic.chatRoomInfo;
  if (chatRoomInfo && chatRoomInfo.user_id === otherId) {
    chatRoomInfo.chatLogs = chatRoomInfo.chatLogs
      ? [...chatRoomInfo.chatLogs, chatLog]
      : [chatLog];
    dispatch({ type: SET_CHAT_ROOM_INFO, payload: chatRoomInfo });
  } else {
    console.error('Chat room info not found or user ID does not match');
  }
};
export function updateBetResult(betResult) {
  return {
    type: 'UPDATE_BET_RESULT',
    betResult
  };
}
export const addNewTransaction = data => dispatch => {
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
