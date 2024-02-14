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
  game_mode: "",
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
    { game_type_id: 1, game_type_name: 'RPS', short_name: 'RPS', _id: '62a25d2a723b9f15709d1ae7', created_at: '2018-06-09T20:50:50.217Z' },
    { game_type_id: 6, game_type_name: 'Drop Game', short_name: 'DG', _id: '63dac60ba1316a1e70a468ab', created_at: '2023-02-01T20:50:50.217Z', },
    { game_type_id: 2, game_type_name: 'Spleesh!', short_name: 'S!', _id: '62a25d2a723b9f15709d1ae8', created_at: '2024-06-09T20:50:50.218Z'},
    { game_type_id: 3, game_type_name: 'Brain Game', short_name: 'BG', _id: '62a25d2a723b9f15709d1ae9', created_at: '2029-06-09T20:50:50.219Z', },
    {game_type_id: 4, game_type_name: 'Mystery Box', short_name: 'MB', _id: '62a25d2a723b9f15709d1aea', created_at: '2022-06-09T20:50:50.219Z',},
    { game_type_id: 5, game_type_name: 'Quick Shoot', short_name: 'QS', _id: '62a25d2a723b9f15709d1aeb', created_at: '2020-06-09T20:50:50.219Z',},
    { game_type_id: 7, game_type_name: 'Bang!', short_name: 'B!', _id: '6536a82933e70418b45fbe32', created_at: '2019-12-02T11:04:10.217Z', },
    { game_type_id: 8, game_type_name: 'Roll', short_name: 'R', _id: '6536946933e70418b45fbe2f', created_at: '2010-05-19T15:57:30.217Z' },
    { game_type_id: 9, game_type_name: 'Blackjack', short_name: 'BJ', _id: '656cd55bb2c2d9dfb59a4bfa', created_at: '2034-03-08T14:40:50.217Z', }
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
    pr: 0,
    endgame_amount: 0.54,
    bet_amount: 0,
    spleesh_bet_unit: 1,
    box_price: 0,
    room_history: [],
    box_list: [],
    rps_game_type: 0,
    qs_game_type: 2,
    qs_nation: 0,
    likes: 0,
    dislikes: 0,
    views: 0
  },
  betResult: -1,
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
        spleesh_guesses: payload
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
        game_mode: '',
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
