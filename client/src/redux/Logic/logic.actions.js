import {
  ACTION_ROOM,
  GAMETYPE_LOADED,
  STRATEGIES_LOADED,
  ROOMINFO_LOADED,
  START_LOADING,
  END_LOADING,
  START_BET,
  END_BET,
  TNX_COMPLETE,
  TNX_INCOMPLETE,
  COMMENT_CREATED,
  COMMENT_CREATION_FAILED,
  COMMENTS_LOADED,
  COMMENTS_LOAD_FAILED,
  COMMENT_DELETED,
  COMMENT_DELETION_FAILED,
  RPSBETITEMS_LOADED,
  ROOMS_LOADED,
  ROOMS_COUNT,
  UPDATE_BET_RESULT,
  UPDATE_BANKROLL,
  UPDATE_RAIN,
  UPDATE_BANKROLL_QS,
  BET_SUCCESS,
  MSG_SUCCESS,
  MSG_CREATE_ROOM_SUCCESS,
  MSG_ROOMS_LOAD_FAILED,
  MSG_GAMETYPE_LOAD_FAILED,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL,
  MY_GAMES_LOADED,
  MY_GAMES_LOADED_WITHOUT_STATS,
  MY_GAMES_LOADED_WITH_STATS,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  SET_NOTIFICATIONS_ROOM_INFO,
  HISTORY_LOADED,
  NEW_TRANSACTION,
  SET_BALANCE,
  SPLEESH_GUESSES,
  DROP_GUESSES,
  BANG_GUESSES,
  ROLL_GUESSES,
  ONLINE_USER_LIST_UPDATED,
  MSG_WARNING,
  SELECT_MAIN_TAB,
  MY_CHAT_LOADED,
  NOTIFICATIONS_LOADED,
  GLOBAL_CHAT_RECEIVED,
  SET_GLOBAL_CHAT,
  FETCH_ACCESSORY_SUCCESS
} from '../types';
import axios from '../../util/Api';
import history from '../history';

// Logic.actions

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
    history.push('/');
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

export function updateDropGuesses() {
  return dispatch => {
    fetch('/api/drop/guesses')
      .then(res => res.json())
      .then(data => {
        dispatch({
          type: DROP_GUESSES,
          payload: data
        });
      })
      .catch(error => {
        console.error(error);
      });
  };
}
export function updateBangGuesses() {
  return dispatch => {
    fetch('/api/bang/guesses')
      .then(res => res.json())
      .then(data => {
        dispatch({
          type: BANG_GUESSES,
          payload: data
        });
      })
      .catch(error => {
        console.error(error);
      });
  };
}
export function updateRollGuesses() {
  return dispatch => {
    fetch('/api/roll/guesses')
      .then(res => res.json())
      .then(data => {
        dispatch({
          type: ROLL_GUESSES,
          payload: data
        });
      })
      .catch(error => {
        console.error(error);
      });
  };
}

// join game
export const bet = bet_info => async dispatch => {
  try {
    dispatch({ type: START_BET });
    const res = await axios.post('/game/bet', bet_info);
    dispatch({ type: END_BET });

    if (res.data.success) {
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });

      if (bet_info.game_type === 'Mystery Box') {
        dispatch({ type: BET_SUCCESS, payload: res.data });
      } else {
        dispatch({
          type: UPDATE_BET_RESULT,
          payload: {
            betResult: res.data.betResult === 1 ? 'win' : res.data.betResult === 0 ? 'draw' : 'lose',
          }
        });
      }

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
          message: 'THIS BATTLE HAS NOW ENDED'
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
export const createComment = (commentData) => async dispatch => {
  try {
 
    const res = await axios.post('/game/comments', commentData);
    if (res.data.success) {

    } else {
      // Dispatch action for failure if needed
      // dispatch({ type: COMMENT_CREATION_FAILED });
    }
  } catch (err) {
    // Dispatch action for failure if needed, including error payload
    dispatch({ type: COMMENT_CREATION_FAILED, payload: err });
  } finally {
    // Dispatch end loading action if needed
    // Dispatch END_LOADING action if loading flag is set
  }
};

// GetCommentsForRoom
export const getCommentsForRoom = (room_id) => async dispatch => {
  try {
    // Dispatch start loading action if needed
    dispatch({ type: START_LOADING });
    const res = await axios.get(`/game/comments/${room_id}`);

    if (res.data.success) {
      // Dispatch action to handle successful retrieval of comments
      dispatch({ type: COMMENTS_LOADED, payload: res.data.comments });
    } else {
      // Dispatch action for failure if needed
      dispatch({ type: COMMENTS_LOAD_FAILED });
    }
  } catch (err) {
    // Dispatch action for failure if needed, including error payload
    dispatch({ type: COMMENTS_LOAD_FAILED, payload: err });
  } finally {
    dispatch({ type: END_LOADING });
  }
};

// DeleteComment
export const deleteComment = (comment_id) => async dispatch => {
  try {
    // Dispatch start loading action if needed

    const res = await axios.delete(`/game/comments/${comment_id}`);
    if (res.data.success) {
      // Dispatch action to handle successful deletion of comment
      dispatch({ type: COMMENT_DELETED, payload: comment_id });
    } else {
      // Dispatch action for failure if needed
      dispatch({ type: COMMENT_DELETION_FAILED });
    }
  } catch (err) {
    // Dispatch action for failure if needed, including error payload
    dispatch({ type: COMMENT_DELETION_FAILED, payload: err });
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

  // dispatch({ type: END_LOADING });
};

export const checkGamePassword = data => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/checkGamePassword/', data);
    if (res.data.success) {
      return true;
    }
  } catch (err) {
    // dispatch({ type: MSG_ROOMS_LOAD_FAILED, payload: err });
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
  } finally {
    dispatch({ type: END_LOADING });
  }
  return false;
};

export const getRoomList = search_condition => async dispatch => {
  dispatch({ type: START_LOADING });
  try {
    const res = await axios.get('/game/rooms', { params: search_condition });
    if (res.data.success) {
      dispatch({ type: ROOMS_LOADED, payload: res.data });
    }
  } catch (err) {
  } finally {
    dispatch({ type: END_LOADING });
  }
};

export const getRoomCount = search_condition => async dispatch => {
  try {
    const res = await axios.get('/game/count', { params: search_condition });
    if (res.data.success) {
      dispatch({ type: ROOMS_COUNT, payload: res.data.roomCount });
    }
  } catch (err) {
    console.log("error", err)
  }
};

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
export const getStrategies = () => async dispatch => {
  try {
    const res = await axios.get('/game/strategies');
    if (res.data.success) {
      dispatch({ type: STRATEGIES_LOADED, payload: res.data.strategies });
    } 
  } catch (err) {
  }
};

export const updateUserStrategy= (user_id, strategy) => async dispatch => {
  try {
    const res = await axios.patch(`/game/strategies/${user_id}`, { strategy });
    if (res.data.success) {
      
      dispatch({ type: MSG_SUCCESS, payload: "AUTOPLAY STRATEGY UPDATED" });
    }
  } catch (err) {
    // Handle errors
  }
};

export const updateRoomStrategy= (room_id, strategy) => async dispatch => {
  try {
    const res = await axios.patch(`/game/room/strategies/${room_id}`, { strategy });
    if (res.data.success) {
      
      dispatch({ type: MSG_SUCCESS, payload: "ROOM STRATEGY UPDATED" });
    }
  } catch (err) {
    // Handle errors
  }
};

export const updateRoomBot= (room_id) => async dispatch => {

  try {
    const res = await axios.patch(`/game/rooms/${room_id}`);

    if (res.data.success) {
      // Dispatch an action or handle success as needed

    }
  } catch (err) {
    // Handle errors
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
export const getMyGames = search_condition => async dispatch => {
  try {
    dispatch({ type: START_LOADING });


    const resWithoutRoomStats = await axios.get('/game/my_games', {
      params: { ...search_condition, excludeRoomStats: true }
    });

    if (resWithoutRoomStats.data.success) {
      dispatch({ type: MY_GAMES_LOADED_WITHOUT_STATS });
      dispatch({ type: MY_GAMES_LOADED, payload: { ...resWithoutRoomStats.data } });


      const resWithRoomStats = await axios.get('/game/my_games', {
        params: { ...search_condition, excludeRoomStats: false }
      });

      if (resWithRoomStats.data.success) {
        dispatch({ type: MY_GAMES_LOADED, payload: { ...resWithRoomStats.data } });
        dispatch({ type: MY_GAMES_LOADED_WITH_STATS });
      } else {
        dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
      }
    } else {
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
    const res = await axios.post('/game/end_game', { room_id });
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
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

    } else {
      if (res.data.already_finished) {
        // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'Warning!', message: res.data.message} });
      }
    }
  } catch (err) {
    console.log(err);
  }
};
export const unstake = (room_id, callback) => async dispatch => {
  try {
    const res = await axios.post('/game/unstake', { room_id });
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
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

    } else {
      if (res.data.already_finished) {
        // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'Warning!', message: res.data.message} });
      }
    }
  } catch (err) {
    console.log(err);
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
    // Send an HTTP GET request to the '/game/notifications' endpoint.
    const res = await axios.get('/game/notifications');

    // Check if the response data indicates success.
    if (res.data.success) {
      // If successful, dispatch a Redux action with the notifications payload.
      dispatch({ type: NOTIFICATIONS_LOADED, payload: res.data.notifications });
    }
  } catch (err) {
    // If there's an error during the request, log the error.
    console.log(err);
  }
};

export const readNotifications = () => async dispatch => {
  try {
    // First, mark notifications as read
    const markReadResponse = await axios.patch('/game/read_notifications');

    // Check if marking notifications as read was successful
    if (markReadResponse.data.success) {

      const fetchNotificationsResponse = await axios.get('/game/notifications');
console.log(fetchNotificationsResponse)
      // Dispatch a Redux action with the updated notifications payload
      if (fetchNotificationsResponse.data.success) {
        dispatch({ type: NOTIFICATIONS_LOADED, payload: fetchNotificationsResponse.data.notifications });
      }
    }
  } catch (err) {
    // If there's an error during the request, log the error.
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

export const deductBalanceWhenStartBrainGame = data => async dispatch => {
  return handleGameStart(dispatch, data, '/game/start_brain_game');
};

export const deductBalanceWhenStartBlackjack = data => async dispatch => {
  return handleGameStart(dispatch, data, '/game/start_blackjack');
};

export const deductBalanceWhenStartRoll = data => async dispatch => {
  return handleGameStart(dispatch, data, '/game/start_roll');
};

export const getRollGuesses = roomId => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.get('/game/get_roll_guesses', { params: { roomId } });
    if (res.data.success) {
      dispatch({ type: END_LOADING });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }

  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
};
export const getSpleeshGuesses = roomId => async dispatch => {
  try {
    const res = await axios.get('/game/get_spleesh_guesses', { params: { roomId } });
    if (res.data.success) {
      dispatch({ type: SPLEESH_GUESSES, payload: res.data.spleesh_guesses });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }

  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
};
export const getBangGuesses = roomId => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.get('/game/get_bang_guess', { params: { roomId } });
    if (res.data.success) {
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



export const setRoomList = data => dispatch => {
  data.page = 1;
  dispatch({ type: ROOMS_LOADED, payload: data });
};

export const setGameMode = game_mode => dispatch => {
  dispatch({ type: SET_GAME_MODE, payload: game_mode });
};

export const setCurRoomInfo = room_info => dispatch => {
  dispatch({ type: SET_CUR_ROOM_INFO, payload: room_info });
  if (room_info.game_type === 'Mystery Box') {
    dispatch({ type: BET_SUCCESS, payload: { betResult: -1 } });
  }
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

// export const startLoading = () => dispatch => {
//   dispatch({ type: START_LOADING });
// };

// export const endLoading = () => dispatch => {
//   dispatch({ type: END_LOADING });
// };

export const updateOnlineUserList = user_list => dispatch => {
  dispatch({ type: ONLINE_USER_LIST_UPDATED, payload: user_list });
};

export const selectMainTab = index => dispatch => {
  dispatch({ type: SELECT_MAIN_TAB, payload: index });
};

export const globalChatReceived = data => dispatch => {
  dispatch({ type: GLOBAL_CHAT_RECEIVED, payload: data });
};
