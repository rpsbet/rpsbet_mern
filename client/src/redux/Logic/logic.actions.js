import {
  GAMETYPE_LOADED,
  ROOMINFO_LOADED,
  START_LOADING,
  END_LOADING,
  ROOMS_LOADED,
  BET_SUCCESS,
  MSG_CREATE_ROOM_FAIL,
  MSG_CREATE_ROOM_SUCCESS,
  MSG_ROOMS_LOAD_FAILED,
  MSG_GAMETYPE_LOAD_FAILED,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL,
  MY_GAMES_LOADED,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  HISTORY_LOADED,
  NEW_TRANSACTION,
  SET_BALANCE,
  ONLINE_USER_LIST_UPDATED,
  MSG_WARNING,
} from '../types';
import axios from '../../util/Api';
import history from '../history';

// CreateRoom
export const createRoom = (room_info) => async dispatch => {
  const body = JSON.stringify(room_info);
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/rooms', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      dispatch({ type: MSG_CREATE_ROOM_SUCCESS, payload: res.data.message });
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
    } else {
      dispatch({ type: MSG_WARNING, payload: res.data.message });
    }
    history.push('/');
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err });
  }
};

// joinRoom
export const bet = (bet_info) => async dispatch => {
  const body = JSON.stringify(bet_info);
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/bet', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      if (res.data.betResult === -100) {
        // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'Warning!', message: res.data.message} });
        history.push('/');
        return {
          status: 'failed',
          message: 'Sorry, this game is already finished.'
        };
      }
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });

      if (bet_info.game_type === 'Mystery Box') {
        dispatch({ type: BET_SUCCESS, payload: res.data });
      } else if (bet_info.game_type === 'Brain Game') {
        if (res.data.betResult === 1) {
          // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'win', title: 'Congratulations!', message: 'WOW, What a BRAIN BOX - You WIN!', roomStatus: res.data.roomStatus} });
        } else if (res.data.betResult === 0) {
          // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'draw', title: 'Draw', message: 'Draw, No Winner! PR will be split.', roomStatus: res.data.roomStatus} });
        } else {
          // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'lost', title: 'Oops!', message: 'Oops, back to school for you loser!!', roomStatus: res.data.roomStatus} });
        }
      } else {
        if (res.data.betResult === 1) {
          // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'win', title: 'Congratulations!', message: 'Nice, You Win!', roomStatus: res.data.roomStatus} });
        } else if (res.data.betResult === 0) {
          // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'draw', title: 'Draw', message: 'Draw, No Winner!', roomStatus: res.data.roomStatus} });
        } else {
          // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'lost', title: 'Oops!', message: 'Oops, You Lost!', roomStatus: res.data.roomStatus} });
        }
      }
      return {
        status: 'success',
        betResult: res.data.betResult,
        roomStatus: res.data.roomStatus
      };
    } else {
      dispatch({ type: MSG_WARNING, payload: 'Something went wrong. Please try again in a few minutes.' });
    }
  } catch (err) {
    console.log(err)
    dispatch({ type: MSG_WARNING, payload: 'Something went wrong. Please try again in a few minutes.' });
  }

  return {
    status: 'failed'
  };
};

// GetRoomInfo
export const getRoomInfo = (room_id) => async dispatch => {
  dispatch({ type: START_LOADING });
  try {
    const res = await axios.get('/game/room/' + room_id);
    if (res.data.success) {
      dispatch({ type: ROOMINFO_LOADED, payload: res.data });
    } else {
      dispatch({ type: MSG_ROOMS_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_ROOMS_LOAD_FAILED, payload: err });
  }
  dispatch({ type: END_LOADING });
};

export const checkGamePassword = (data) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/checkGamePassword/', data);
    dispatch({ type: END_LOADING });
    if (res.data.success) {
      return true;
    }
  } catch (err) {
    // dispatch({ type: MSG_ROOMS_LOAD_FAILED, payload: err });
  }
  return false;
}

// GetRoomList
export const getRoomList = (search_condition) => async dispatch => {
  // const body = JSON.stringify(search_condition);
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.get('/game/rooms', {params: search_condition});
    dispatch({ type: END_LOADING });
    if (res.data.success) {
      res.data.page = search_condition.page;
      dispatch({ type: ROOMS_LOADED, payload: res.data });
    }
  } catch (err) {
  }
};

// GetHistory
export const getHistory = (search_condition) => async dispatch => {
  try {
    const res = await axios.get('/game/history', {params: search_condition});
    if (res.data.success) {
      dispatch({ type: HISTORY_LOADED, payload: res.data.history });
    }
  } catch (err) {
  }
};

// GetGameTypeList
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

export const getMyGames = (page) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.get('/game/my_games', {params: {page}});
    dispatch({ type: END_LOADING });
    if (res.data.success) {
      dispatch({ type: MY_GAMES_LOADED, payload: { ...res.data, pageNumber: page } });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
};

export const endGame = (room_id) => async dispatch => {
  try {
    const res = await axios.post('/game/end_game', {room_id});
    if (res.data.success) {
      dispatch({ type: MY_GAMES_LOADED, payload: { myGames: res.data.myGames, pages: res.data.pages, pageNumber: 1 } });
      dispatch({ type: NEW_TRANSACTION, payload: res.data.newTransaction });
    } else {
      if (res.data.already_finished) {
        // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'Warning!', message: res.data.message} });
      } else {
        dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
      }
    }
  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
}

export const getMyHistory = () => async dispatch => {
  try {
    const res = await axios.get('/game/my_history');
    if (res.data.success) {
      dispatch({ type: MY_HISTORY_LOADED, payload: res.data.myHistory });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
}

export const getChatRoomInfo = (user_id) => async dispatch => {
  try {
    const res = await axios.post('/game/get_chat_room_info', {user_id});
    if (res.data.success) {
      dispatch({ type: SET_CHAT_ROOM_INFO, payload: res.data.chatRoomInfo });
    } else {
      dispatch({ type: MSG_GAMETYPE_LOAD_FAILED });
    }
  } catch (err) {
    dispatch({ type: MSG_GAMETYPE_LOAD_FAILED, payload: err });
  }
}

export const deductBalanceWhenStartBrainGame = (data) => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/game/start_brain_game', data);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      dispatch({ type: SET_BALANCE, payload: res.data.balance });
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

export const setRoomList = (data) => dispatch => {
  data.page = 1;
  dispatch({ type: ROOMS_LOADED, payload: data });
}

export const setGameMode = game_mode => dispatch => {
  dispatch({ type: SET_GAME_MODE, payload: game_mode });
};

export const setCurRoomInfo = room_info => dispatch => {
  dispatch({ type: SET_CUR_ROOM_INFO, payload: room_info });
  if (room_info.game_type === 'Mystery Box') {
    dispatch({ type: BET_SUCCESS, payload: {betResult: -1} });
  }
};

export const setChatRoomInfo = room_info => dispatch => {
  dispatch({ type: SET_CHAT_ROOM_INFO, payload: room_info });
};

const getNow = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = "0" + (date.getMonth() + 1);
  const day = "0" + date.getDate();
  const seconds = "0" + date.getSeconds();
  const minutes = "0" + date.getMinutes();
  const hours = "0" + date.getHours();

  return `${year}-${month.substr(-2)}-${day.substr(-2)}T${hours.substr(-2)}:${minutes.substr(-2)}:${seconds.substr(-2)}.000Z`;
}

export const addChatLog = chatLog => (dispatch, getState) => {
  const myId = getState().auth.user._id;
  let newHistory = JSON.parse(JSON.stringify(getState().logic.myHistory));

  const otherId = myId === chatLog.from ? chatLog.to : chatLog.from;

  newHistory[otherId] = {
    ...newHistory[otherId],
    unread_message_count: newHistory[otherId] ? newHistory[otherId].unread_message_count + 1 : 1,
    _id: otherId,
    message: chatLog.message,
    created_at_str: chatLog.created_at,
    updated_at: getNow()
  };
  
  dispatch({ type: MY_HISTORY_LOADED, payload: newHistory });

  let chatRoomInfo = JSON.parse(JSON.stringify(getState().logic.chatRoomInfo));
  if (chatRoomInfo.user_id === otherId) {
    chatRoomInfo.chatLogs.push(chatLog);
    dispatch({ type: SET_CHAT_ROOM_INFO, payload: chatRoomInfo });
  }
}

export const addNewTransaction = data => dispatch => {
  dispatch({ type: NEW_TRANSACTION, payload: data });
};

export const setUrl = url => dispatch => {
  dispatch({ type: SET_URL, payload: url });
};

export const startLoading = () => dispatch => {
  dispatch({ type: START_LOADING });
}

export const endLoading = () => dispatch => {
  dispatch({ type: END_LOADING });
}

export const updateOnlineUserList = (user_list) => dispatch => {
  dispatch({ type: ONLINE_USER_LIST_UPDATED, payload: user_list });
}