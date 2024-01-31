import {
  ACTION_ROOM,
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
  MY_GAMES_LOADED_WITHOUT_STATS,
  MY_GAMES_LOADED_WITH_STATS,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  UPDATE_BET_RESULT,
  UPDATE_BANKROLL,
  UPDATE_BANKROLL_QS,
  UPDATE_RAIN,
  SPLEESH_GUESSES,
  DROP_GUESSES,
  BANG_GUESSES,
  ROLL_GUESSES,
  HISTORY_LOADED,
  ONLINE_USER_LIST_UPDATED,
  SELECT_MAIN_TAB,
  MY_CHAT_LOADED,
  NOTIFICATIONS_LOADED,
  TNX_COMPLETE,
  TNX_INCOMPLETE,
  SET_NOTIFICATIONS_ROOM_INFO,
  GLOBAL_CHAT_RECEIVED,
  SET_GLOBAL_CHAT
} from '../types';

const initialState = {
  isActiveLoadingOverlay: false,
  transactionComplete: false,
  socket: null,
  game_mode: 'All',
  roomList: [],
  history: [],
  roomCount: 0,
  spleesh_guesses: [],
  drop_guesses: [],
  bangs: [],
  rolls: [],
  totalPage: 0,
  pageNumber: 1,
  historyTotalPage: 0,
  historyPageNumber: 1,
  gameTypeList: [
    { game_type_name: 'RPS' },
    { game_type_name: 'Drop Game' },
    { game_type_name: 'Spleesh!' },
    { game_type_name: 'Brain Game' },
    { game_type_name: 'Mystery Box' },
    { game_type_name: 'Quick Shoot' },
    { game_type_name: 'Bang!' },
    { game_type_name: 'Roll' }
  ],
  curRoomInfo: {
    _id: 0,
    creator_id: '',
    creator_avatar: '',
    rank: 0,
    accessory: '',
    aveMultiplier: '',
    joiners: {},
    game_type: '',
    hosts: {},
    endgame_amount: 54,
    bet_amount: 0,
    spleesh_bet_unit: 1,
    box_price: 0,
    room_history: [],
    box_list: [],
    rps_game_type: 0,
    qs_game_type: 2,
    likes: 0,
    dislikes: 0,
    views: 0
  },
  betResult: -1,
  betResults: [],
  bankroll: 0,
  rain: 0,
  accessories: [],
  roomStatus: '',
  myGames: [],
  myGamesTotalPage: 0,
  myGamesPageNumber: 1,
  myHistory: [],
  myHistoryTotalPage: 0,
  myHistoryPageNumber: 1,
  myChat: [],
  notifications: [],
  chatRoomInfo: {
    user_id: '',
    avatar: '',
    rank: 0,
    accessory: '',
    username: '',
    chatLogs: []
  },
  notificationsRoomInfo: {
    user_id: '',
    avatar: '',
    rank: '',
    accessory: '',
    username: '',
    notificationsLogs: []
  },
  onlineUserList: [],
  selectedMainTabIndex: 0,
  globalChatList: []
};
export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case BET_SUCCESS:
      return {
        ...state,
        betResult: payload.betResult,
        roomStatus: payload.roomStatus
      };
    case UPDATE_BET_RESULT:
      if (typeof payload === 'object') {
        return {
          ...state,
          betResult: [...state.betResult, payload]
        };
      }
      return state;

    case SPLEESH_GUESSES:
      return {
        ...state,
        spleesh_guesses: action.spleesh_guesses
      };
    case DROP_GUESSES:
      return {
        ...state,
        drop_guesses: action.drop_guesses
      };
    // case FETCH_ACCESSORY_SUCCESS:
    //   return {
    //     ...state,
    //     accessory: action.payload
    //   };
    case BANG_GUESSES:
      return {
        ...state,
        bang_guesses: action.bang_guesses
      };
    case ROLL_GUESSES:
      return {
        ...state,
        roll_guesses: action.roll_guesses
      };
    case UPDATE_BANKROLL:
    case UPDATE_BANKROLL_QS:
      return {
        ...state,
        bankroll: action.payload
      };
    case UPDATE_RAIN:
      return {
        ...state,
        rain: action.payload
      };
    case START_LOADING:
      return {
        ...state,
        isActiveLoadingOverlay: true
      };
    case END_LOADING:
      return {
        ...state,
        isActiveLoadingOverlay: false
      };

    case TNX_INCOMPLETE:
      return {
        ...state,
        transactionComplete: false
      };
    case TNX_COMPLETE:
      return {
        ...state,
        transactionComplete: true
      };
    case SET_GAME_MODE:
      return {
        ...state,
        game_mode: payload
      };
    case SET_CUR_ROOM_INFO:
      return {
        ...state,
        curRoomInfo: payload
      };
    case SET_CHAT_ROOM_INFO:
      return {
        ...state,
        chatRoomInfo: payload
      };
    case GAMETYPE_LOADED:
      let firstGameType = '';
      if (payload.gameTypeList && payload.gameTypeList.length > 0) {
        firstGameType = payload.gameTypeList[0].game_type_name;
      }
      return {
        ...state,
        game_mode: firstGameType,
        ...payload
      };
    case ROOMINFO_LOADED:
      return {
        ...state,
        curRoomInfo: {
          ...state.curRoomInfo,
          ...payload.roomInfo
        }
      };
    case ROOMS_LOADED:
      const { roomList, pageSize, total } = payload;

      const accessories = roomList.map(room => room.accessory);

      return {
        ...state,
        roomList,
        accessories,
        // totalPage: pages,
        roomCount: total,
        pageSize: pageSize,
      };
    case HISTORY_LOADED:
      return {
        ...state,
        history: [...payload.history],
        historyTotalPage: payload.pages,
        historyPageNumber: payload.page
      };
    case MY_GAMES_LOADED:
      return {
        ...state,
        myGames: payload.myGames,
        myGamesTotalPage: payload.pages,
        myGamesPageNumber: payload.page
      };

    case MY_GAMES_LOADED_WITHOUT_STATS:
      return {
        ...state,
        myGamesWithStats: false
      };
    case MY_GAMES_LOADED_WITH_STATS:
      return {
        ...state,
        myGamesWithStats: true
      };
    case MY_HISTORY_LOADED:
      return {
        ...state,
        myHistory: payload.history,
        myHistoryTotalPage: payload.pages,
        myHistoryPageNumber: payload.page
      };
    case MY_CHAT_LOADED:
      return {
        ...state,
        myChat: payload
      };
    case NOTIFICATIONS_LOADED:
      return {
        ...state,
        notifications: payload
      };
    case SET_NOTIFICATIONS_ROOM_INFO:
      return {
        ...state,
        notificationsRoomInfo: payload
      };
    case MSG_CREATE_ROOM_SUCCESS:
    case MSG_CREATE_ROOM_FAIL:
    case SET_URL:
      return state;
    case ONLINE_USER_LIST_UPDATED:
      return {
        ...state,
        onlineUserList: payload
      };
    case SELECT_MAIN_TAB:
      return {
        ...state,
        selectedMainTabIndex: payload
      };
    case GLOBAL_CHAT_RECEIVED:
      return {
        ...state,
        globalChatList: [...state.globalChatList, payload]
      };
    case SET_GLOBAL_CHAT:
      return {
        ...state,
        globalChatList: payload
      };
    case ACTION_ROOM:
      return {
        ...state,
        roomList: state.roomList.map(room =>
          room.id === payload.id ? { ...room, ...payload } : room
        )
      };
    default:
      return state;
  }
}
