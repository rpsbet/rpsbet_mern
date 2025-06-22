import {
  ACTION_ROOM,
  CLEANUP_OLD_ROOMS,
  GAMETYPE_LOADED,
  STRATEGIES_LOADED,
  TOP_GAME_TYPES_LOADED,
  TOP_WITHDRAWALS_LOADED,
  ROOMINFO_LOADED,
  START_LOADING,
  END_LOADING,
  SET_SOLANA_ACCOUNT,
  SET_SOLANA_BALANCE,
  START_BET,
  END_BET,
  ROOMS_LOADED,
  MY_GAMES_LOADING,
  TRADE_LOADING,
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
  UPDATE_CREATOR_PROMPT,
  TOP_WINS,
  MY_GAMES_LOADED,
  MY_HISTORY_LOADED,
  SET_CHAT_ROOM_INFO,
  UPDATE_BET_RESULT,
  UPDATE_BANKROLL,
  UPDATE_BANKROLL_QS,
  HISTORY_LOADED,
  ONLINE_USER_LIST_UPDATED,
  SELECT_MAIN_TAB,
  MY_CHAT_LOADED,
  NOTIFICATIONS_LOADED,
  NEW_NOTIFICATION,
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
  APPEND_NEW_CANDLE,
  TRANSACTION_CANDLES_ERROR,
  SET_HIGHLIGHTED_ROOMS,
  ROOM_IDS_LOADED,
  INDIVIDUAL_ROOM_LOADED,
  INDIVIDUAL_ROOM_LOADING,
  INDIVIDUAL_ROOM_ERROR,
  RESET_ROOM_LOADING,
  UPDATE_SINGLE_ROOM,
  CLEAR_HIGHLIGHTED_ROOMS,
  ROOMS_RESET,
  ROOMS_BATCH_LOADED,
  ROOMS_LOADING_MORE,
  ROOMS_ERROR,
  ROOM_SEARCH_RESULTS,
  SET_SORT_PREFERENCE
} from '../types';

const initialState = {
  highlightedRooms: [],
  isActiveLoadingOverlay: false,
  transactionComplete: false,
  socket: null,
  game_mode: "",
  error: null,
  roomList: [],
  pagination: null,
  isLoadingMoreRooms: false,
  roomsError: null,
  solPrice: 0,
  usdValue: null,
  history: [],
  tokenPrice: null,
  amount: 0,
  candles: [],
  transactions: [],
  transactionCandlesError: null,
  trade_loading: false,
  is_betting: false,
  my_games_loading: false,
  comments: [],
  pageNumber: 1,
  historyTotalPage: 0,
  historyPageNumber: 1,
  gameTypeList: [],
  curRoomInfo: {
    _id: 0,
    name: '',
    image: '',
    x_link: '',
    website_link: '',
    telegram_link: '',
    creator_id: '',
    gameCode: '',
    battles: 0,
    tax: 0,
    pool_id: '',
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
    room_history: [],
    posted: false,
    is_private: false,
    description: '',
    likes: 0,
    dislikes: 0,
    views: 0,
    battles: 0,
    proxiedAssets: {
      images: [],
      audio: [],
      theme: {},
      background: {}
    },
  },
  betResult: -1,
  bankroll: 0,
  accessories: [],
  roomStatus: '',
  myGames: [],
  myGamesTotalPage: 0,
  myGamesPageNumber: 1,
  myChat: [],
  notifications: [],
  chatRoomInfo: {
    user_id: '',
    avatar: '',
    rank: 0,
    accessory: '',
    elite: '',
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
  creator_prompt: '',
  selectedMainTabIndex: 0,
  globalChatList: [],
  account: null,
  solanaBalance: 0
};
export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case SET_TOKEN_PRICE:
      return {
        ...state,
        tokenPrice: payload,
      };
    case SET_SOLANA_BALANCE:
      return {
        ...state,
        solanaBalance: action.payload.solanaBalance,
      };
    case SET_SOLANA_ACCOUNT:
      return {
        ...state,
        account: action.payload, // Store account
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
    case RESET_ROOM_LOADING:
      return {
        ...state,
        roomIds: [],
        roomsById: {},
        roomLoadingStates: {},
        roomErrors: {},
        // Don't reset sorting state when resetting rooms
      };

    case ROOM_IDS_LOADED:
      // FIXED: Safely destructure with defaults
      const {
        roomIds = [],
        pagination = null,
        gameType = 'All',
        sortBy = 'default',
        isLoadMore = false
      } = action.payload || {};

      return {
        ...state,
        // Append or replace room IDs based on isLoadMore
        roomIds: isLoadMore ? [...state.roomIds, ...roomIds] : roomIds,
        pagination: pagination, // Can be null for backward compatibility
        currentGameType: gameType,
        currentSortBy: sortBy, // Store current sort setting
        isSearchMode: false,
        searchQuery: '',

        // Initialize loading states for new rooms
        roomLoadingStates: {
          ...(isLoadMore ? state.roomLoadingStates : {}),
          ...roomIds.reduce((acc, roomId) => {
            acc[roomId] = 'loading';
            return acc;
          }, {})
        },

        // Clear errors for new rooms
        roomErrors: isLoadMore ? state.roomErrors : {}
      };

    case ROOM_SEARCH_RESULTS:
      const {
        roomIds: searchRoomIds,
        pagination: searchPagination,
        searchQuery,
        sortBy: searchSortBy = 'default',
        isLoadMore: isSearchLoadMore
      } = action.payload;

      return {
        ...state,
        roomIds: isSearchLoadMore ? [...state.roomIds, ...searchRoomIds] : searchRoomIds,
        pagination: searchPagination,
        currentSortBy: searchSortBy, // Store current sort setting for search
        isSearchMode: true,
        searchQuery: searchQuery,

        // Initialize loading states for search results
        roomLoadingStates: {
          ...(isSearchLoadMore ? state.roomLoadingStates : {}),
          ...searchRoomIds.reduce((acc, roomId) => {
            acc[roomId] = 'loading';
            return acc;
          }, {})
        },

        roomErrors: {
          ...(isSearchLoadMore ? state.roomErrors : {}),
          ...searchRoomIds.reduce((acc, roomId) => {
            delete acc[roomId];
            return acc;
          }, {})
        }
      };

    case INDIVIDUAL_ROOM_LOADING:
      return {
        ...state,
        roomLoadingStates: {
          ...state.roomLoadingStates,
          [payload.roomId]: 'loading'
        }
      };

    case INDIVIDUAL_ROOM_LOADED:
      return {
        ...state,
        roomsById: {
          ...state.roomsById,
          [payload.roomId]: payload.room
        },
        roomLoadingStates: {
          ...state.roomLoadingStates,
          [payload.roomId]: 'loaded'
        },
        roomErrors: {
          ...state.roomErrors,
          [payload.roomId]: null // Clear any previous error
        }
      };

    case INDIVIDUAL_ROOM_ERROR:
      return {
        ...state,
        roomLoadingStates: {
          ...state.roomLoadingStates,
          [payload.roomId]: 'error'
        },
        roomErrors: {
          ...state.roomErrors,
          [payload.roomId]: payload.error
        }
      };

    case SET_SORT_PREFERENCE:
      return {
        ...state,
        currentSortBy: action.payload.sortBy
      };
    case SET_HIGHLIGHTED_ROOMS:
      return {
        ...state,
        highlightedRooms: action.payload,
      };
    case UPDATE_CREATOR_PROMPT:
      return {
        ...state,
        creator_prompt: action.payload,
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

    case APPEND_NEW_CANDLE: {
      const incoming = action.payload;
      const existingCandles = [...state.candles];

      // Convert to a second-based integer or minute-based integer, e.g.:
      const incomingStartTimeMs = new Date(incoming.startTime).getTime();
      const incomingStartTimeMin = Math.floor(incomingStartTimeMs / 60000);
      // integer representing 'minute bucket'

      // 1) Find if there's an existing candle for that same minute
      let foundIndex = -1;
      for (let i = existingCandles.length - 1; i >= 0; i--) {
        const c = existingCandles[i];
        const cStart = Math.floor(new Date(c.startTime).getTime() / 60000);
        if (cStart === incomingStartTimeMin) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex >= 0) {
        // 2) Merge the new candle data with the existing candle
        const existingCandle = existingCandles[foundIndex];

        const mergedCandle = {
          ...existingCandle,
          open: existingCandle.open, // typically unchanged
          close: incoming.close,
          high: Math.max(existingCandle.high, incoming.high),
          low: Math.min(existingCandle.low, incoming.low),
          // you might handle volume differently, etc.
        };
        existingCandles[foundIndex] = mergedCandle;

      } else {

        existingCandles.push(incoming);
        // keep them sorted (if needed, or push in correct position).
        existingCandles.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      }

      return {
        ...state,
        candles: existingCandles
      };
    }

    case UPDATE_BANKROLL:
    case UPDATE_BANKROLL_QS:
      return {
        ...state,
        bankroll: action.payload
      };
    case START_LOADING:
      return {
        ...state,
        isActiveLoadingOverlay: true
      };

    case TRADE_LOADING:
      return {
        ...state,
        trade_loading: action.payload
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
    case COMMENTS_LOAD_FAILED:
      return {
        ...state,
        error: action.payload
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
    case TOP_GAME_TYPES_LOADED:
      return {
        ...state,
        topGameTypes: action.payload || [],
      };
    case GAMETYPE_LOADED:
      return {
        ...state,
        gameTypeList: action.payload,
        loading: false,
      };

    case SET_CHAT_ROOM_INFO:
      return {
        ...state,
        chatRoomInfo: payload
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
    case ROOMS_RESET:
      return {
        ...state,
        roomList: [],
        roomsPagination: {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false,
          totalPages: 0
        },
        roomsError: null,
        isLoadingMoreRooms: false
      };

    case ROOMS_LOADED:
      return {
        ...state,
        roomList: payload.roomList,
        roomsPagination: payload.pagination,
        currentGameType: payload.gameType,
        roomsError: null,
        isLoadingMoreRooms: false
      };

    case ROOMS_BATCH_LOADED:
      return {
        ...state,
        roomList: [...state.roomList, ...payload.roomList], // Append new rooms
        roomsPagination: payload.pagination,
        roomsError: null,
        isLoadingMoreRooms: false
      };

    case ROOMS_LOADING_MORE:
      return {
        ...state,
        isLoadingMoreRooms: true,
        roomsError: null
      };

    case ROOMS_ERROR:
      return {
        ...state,
        roomsError: payload,
        isLoadingMoreRooms: false
      };
    case CLEANUP_OLD_ROOMS:
      // Keep only the most recent 100 rooms to prevent memory issues
      const maxRooms = 100;
      if (state.roomIds.length <= maxRooms) {
        return state;
      }

      const recentRoomIds = state.roomIds.slice(-maxRooms);
      const cleanedRoomsById = {};
      const cleanedLoadingStates = {};
      const cleanedErrors = {};

      recentRoomIds.forEach(roomId => {
        if (state.roomsById[roomId]) cleanedRoomsById[roomId] = state.roomsById[roomId];
        if (state.roomLoadingStates[roomId]) cleanedLoadingStates[roomId] = state.roomLoadingStates[roomId];
        if (state.roomErrors[roomId]) cleanedErrors[roomId] = state.roomErrors[roomId];
      });

      return {
        ...state,
        roomIds: recentRoomIds,
        roomsById: cleanedRoomsById,
        roomLoadingStates: cleanedLoadingStates,
        roomErrors: cleanedErrors
      };

    case UPDATE_SINGLE_ROOM:
      return {
        ...state,
        roomList: state.roomList.map(room =>
          room._id === action.payload._id
            ? { ...room, ...action.payload }
            : room
        )
      };
    case HISTORY_LOADED:
      return {
        ...state,
        history: payload.history,
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
    case MY_GAMES_LOADING:
      return {
        ...state,
        my_games_loading: payload
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
    case NEW_NOTIFICATION:
      return {
        ...state,
        notifications: [payload, ...state.notifications]
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
