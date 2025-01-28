import {
  RPSBETITEMS_LOADED,
  QSBETITEMS_LOADED,
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
  ADD_NEW_CANDLE,
  ROOMS_LOADED,
  SET_QBOT_STATUSES,
  PREPEND_OLDER_CHAT_MESSAGES,
  SET_FETCHING_OLDER_MESSAGES,
  BET_SUCCESS,
  SET_TOKEN_PRICE,
  SET_SOL_TO_USD_PRICE,
  MSG_CREATE_ROOM_FAIL,
  MSG_CREATE_ROOM_SUCCESS,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL,
  TOP_WINS,
  MY_GAMES_LOADED,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  UPDATE_BET_RESULT,
  UPDATE_BANKROLL,
  UPDATE_BANKROLL_QS,
  UPDATE_RAIN,
  ATTACHED,
  HISTORY_LOADED,
  ONLINE_USER_LIST_UPDATED,
  SELECT_MAIN_TAB,
  MY_CHAT_LOADED,
  NOTIFICATIONS_LOADED,
  TNX_COMPLETE,
  TNX_INCOMPLETE,
  SET_NOTIFICATIONS_ROOM_INFO,
  GLOBAL_CHAT_RECEIVED,
  SET_GLOBAL_CHAT,
  COMMENT_CREATED,
  COMMENT_CREATION_FAILED,
  COMMENTS_LOADED,
  COMMENTS_LOAD_FAILED,
  COMMENT_DELETED,
  COMMENT_DELETION_FAILED,
  TRANSACTION_CANDLES_LOADED,
  TRANSACTION_CANDLES_ERROR,
  SET_HIGHLIGHTED_ROOMS,
  CLEAR_HIGHLIGHTED_ROOMS
} from '../types';

const initialState = {
  highlightedRooms: [],
  rpsbetitems: [],
  qsbetitems: [],
  isActiveLoadingOverlay: false,
  transactionComplete: false,
  socket: null,
  game_mode: "",
  error: null,
  roomList: [],
  solPrice: 0,
  usdValue: null,
  history: [],
  tokenPrice: null,
  amount: 0,
  candles: [],
  transactions: [],
  transactionCandlesError: null,
  bangs: [],
  is_betting: false,
  rolls: [],
  comments: [],
  strategies: [],
  pageNumber: 1,
  historyTotalPage: 0,
  historyPageNumber: 1,
  gameTypeList: [
    { game_type_id: 1, game_type_name: 'RPS', short_name: 'RPS', _id: '62a25d2a723b9f15709d1ae7', created_at: '2018-06-09T20:50:50.217Z' },
    { game_type_id: 5, game_type_name: 'Quick Shoot', short_name: 'QS', _id: '62a25d2a723b9f15709d1aeb', created_at: '2020-06-09T20:50:50.219Z', },
  ],
  curRoomInfo: {
    _id: 0,
    name: '',
    image: '',
    x_link: '',
    website_link: '',
    telegram_link: '',
    creator_id: '',
    creator_avatar: '',
    rank: 0,
    accessory: '',
    username: '',
    totalGameLogsCount: 0,
    joiners: {},
    game_type: '',
    hosts: {},
    pr: 0,
    endgame_amount: 0.54,
    bet_amount: 0,
    user_bet: 0,
    selectedStrategy: '',
    room_history: [],
    posted: false,
    attached: false,
    is_private: false,
    rps_game_type: 0,
    qs_game_type: 2,
    description: '',
    qs_nation: 0,
    likes: 0,
    dislikes: 0,
    views: 0,
    battles: 0
  },
  betResult: -1,
  bankroll: 0,
  rain: 0,
  accessories: [],
  roomStatus: '',
  qBotStatuses: {},
  myGames: [],
  myGamesTotalPage: 0,
  myGamesPageNumber: 1,
  myHistory: [],
  myHistoryPageNumber: 1,
  myChat: [],
  notifications: [],
  chatRoomInfo: {
    user_id: '',
    avatar: '',
    rank: 0,
    accessory: '',
    username: '',
    chatLogs: [],
    hasMore: true,
  },
  fetchingOlder: false,
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
    case SET_TOKEN_PRICE:
      return {
        ...state,
        tokenPrice: payload,
      };
    case SET_SOL_TO_USD_PRICE:
      return {
        ...state,
        solPrice: payload.solPrice,
        usdValue: payload.usdValue,
      };
    case BET_SUCCESS:
      return {
        ...state,
        betResult: payload.betResult,
        roomStatus: payload.roomStatus
      };
    case UPDATE_BET_RESULT:
      if (payload && typeof payload === 'object') {
        return {
          ...state,
          betResult: payload.betResult,
        };
      }
      return state;
    case SET_FETCHING_OLDER_MESSAGES:
      return {
        ...state,
        fetchingOlder: action.payload
      };

    case PREPEND_OLDER_CHAT_MESSAGES: {
      const { olderBatch, hasMore } = action.payload;
      return {
        ...state,
        chatRoomInfo: {
          ...state.chatRoomInfo,
          // Prepend older messages
          chatLogs: [...olderBatch, ...state.chatRoomInfo.chatLogs],
          hasMore: hasMore
        }
      };
    }

    case SET_HIGHLIGHTED_ROOMS:
      return {
        ...state,
        highlightedRooms: action.payload,
      };

    case CLEAR_HIGHLIGHTED_ROOMS:
      return {
        ...state,
        highlightedRooms: [],
      };

    case TRANSACTION_CANDLES_LOADED:
      return {
        ...state,
        candles: payload.candles,
        transactions: payload.transactions,
        transactionCandlesError: null,
      };
    case TRANSACTION_CANDLES_ERROR:
      return {
        ...state,
        transactionCandlesError: payload,
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
    case START_BET:
      return {
        ...state,
        is_betting: true
      };
    case END_BET:
      return {
        ...state,
        is_betting: false
      };
    case COMMENT_CREATED:
      return {
        ...state,
        posted: payload,
      };
    case COMMENT_CREATION_FAILED:
      return {
        ...state,
        error: action.payload
      };
    case COMMENTS_LOADED:
      return {
        ...state,
        comments: action.payload,
        error: null
      };
    case QSBETITEMS_LOADED:
      return {
        ...state,
        qsbetitems: action.payload.data,
        error: null
      };
    case RPSBETITEMS_LOADED:
      return {
        ...state,
        rpsbetitems: action.payload.data,
        error: null
      };
    case COMMENTS_LOAD_FAILED:
      return {
        ...state,
        error: action.payload
      };
    case ATTACHED:
      return {
        ...state,
        attached: payload,
        error: null
      };
    case COMMENT_DELETED:
      return {
        ...state,
        comments: state.comments.filter(comment => comment._id !== action.payload),
        error: null
      };
    case COMMENT_DELETION_FAILED:
      return {
        ...state,
        error: action.payload
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
    case STRATEGIES_LOADED:
      return {
        ...state,
        strategies: payload
      };
    case RECENTLY_CLOSED_LOADED:
      return {
        ...state,
        recentlyClosed: payload
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
          ...payload.roomInfo,
          totalGameLogsCount: payload.totalGameLogsCount
        }
      };
    case ROOMS_LOADED:
      const { roomList } = payload;
      const accessories = roomList.map(room => room.accessory);
      return {
        ...state,
        roomList,
        accessories,

      };
    case HISTORY_LOADED:
      return {
        ...state,
        history: [...payload.history],
        historyTotalPage: payload.pages,
        historyPageNumber: payload.page
      };
    case TOP_WINS:
      return {
        ...state,
        topWins: [...payload],
      };
    case TOP_WITHDRAWALS_LOADED:
      return {
        ...state,
        topWithdrawals: [...payload],
      };
    case MY_GAMES_LOADED:
      return {
        ...state,
        myGames: payload.myGames,
        myGamesPageNumber: payload.page
      };
    case MY_HISTORY_LOADED:
      return {
        ...state,
        myHistory: payload.history,
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

    case ADD_NEW_CANDLE:
      return {
        ...state,
        candles: [...state.candles, payload], // Add the new candle to the list
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
