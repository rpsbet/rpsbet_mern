import {
  GAMETYPE_LOADED,
  ROOMINFO_LOADED,
  START_LOADING,
  END_LOADING,
  ROOMS_LOADED,
  BET_SUCCESS,
  MSG_CREATE_ROOM_FAIL,
  MSG_CREATE_ROOM_SUCCESS,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL,
  MY_GAMES_LOADED,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  HISTORY_LOADED,
  ONLINE_USER_LIST_UPDATED,
  SELECT_MAIN_TAB,
  MY_CHAT_LOADED,
  GLOBAL_CHAT_RECEIVED,
} from '../types';
  
const initialState = {
  isActiveLoadingOverlay: false,
  socket: null,
  game_mode: 'RPS',
  // game_mode: 'Spleesh!',
  roomList: [],
  history: [],
  roomCount: 0,
  totalPage: 0,
  pageNumber: 1,
  historyTotalPage: 0,
  historyPageNumber: 1,
  gameTypeList: [
    { game_type_name: 'RPS' },
    { game_type_name: 'Spleesh!' },
    { game_type_name: 'Brain Game' },
    { game_type_name: 'Mystery Box' },
    { game_type_name: 'Quick Shoot' },
  ],
  curRoomInfo: {
    _id: 0,
    creator_id: '',
    game_type: '',
    bet_amount: 0,
    spleesh_bet_unit: 1,
    box_price: 0,
    room_history: [],
    box_list: [],
    qs_game_type: 2
  },
  betResult: -1,
  roomStatus: '',
  myGames: [],
  myGamesTotalPage: 0,
  myGamesPageNumber: 1,
  myHistory: [],
  myHistoryTotalPage: 0,
  myHistoryPageNumber: 1,
  myChat: [],
  chatRoomInfo: {
    user_id: '',
    avatar: '',
    username: '',
    chatLogs: []
  },
  onlineUserList: [],
  selectedMainTabIndex: 0,
  globalChatList: []
};
  
export default function(state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case BET_SUCCESS:
      return {
        ...state, betResult: payload.betResult, roomStatus: payload.roomStatus
      };
    case START_LOADING:
      return {
        ...state, isActiveLoadingOverlay: true
      }
    case END_LOADING:
      return {
        ...state, isActiveLoadingOverlay: false
      }
    case SET_GAME_MODE:
      return {
        ...state, game_mode: payload
      };
    case SET_CUR_ROOM_INFO:
      return {
        ...state, curRoomInfo: payload
      }
    case SET_CHAT_ROOM_INFO:
      return {
        ...state, chatRoomInfo: payload
      }
    case GAMETYPE_LOADED:
      let firstGameType = '';
      if (payload.gameTypeList && payload.gameTypeList.length > 0) {
        firstGameType = payload.gameTypeList[0].game_type_name;
      }
      return {
        ...state, game_mode: firstGameType, ...payload
      };
    case ROOMINFO_LOADED:
      return {
        ...state, curRoomInfo: payload.roomInfo
      };
    case ROOMS_LOADED:
      return {
        ...state, roomList: payload.roomList, totalPage: payload.pages, roomCount: payload.total, pageNumber: payload.page
      };
    case HISTORY_LOADED:
      return {
        ...state, history: [...payload.history], historyTotalPage: payload.pages, historyPageNumber: payload.page
      }
    case MY_GAMES_LOADED:
      return {
        ...state, myGames: payload.myGames, myGamesTotalPage: payload.pages, myGamesPageNumber: payload.page
      };
      case MY_HISTORY_LOADED:
        return {
          ...state, myHistory: payload.history, myHistoryTotalPage: payload.pages, myHistoryPageNumber: payload.page
        };
    case MY_CHAT_LOADED:
      return {
        ...state, myChat: payload
      };
    case MSG_CREATE_ROOM_SUCCESS:
      return {
        ...state,
      };
    case MSG_CREATE_ROOM_FAIL:
      return {
        ...state,
      };
    case SET_URL:
      return {
        ...state,
      };
    case ONLINE_USER_LIST_UPDATED:
      return {
        ...state, onlineUserList: payload
      }
    case SELECT_MAIN_TAB:
      return {
        ...state, selectedMainTabIndex: payload
      }
    case GLOBAL_CHAT_RECEIVED:
      const chat_list = JSON.parse(JSON.stringify(state.globalChatList));
      chat_list.push(payload)
      console.log(chat_list)
      return {
        ...state, globalChatList: chat_list
      }
    default:
      return state;
  }
}
