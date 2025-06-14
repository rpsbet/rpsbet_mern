import {
  SET_SOCKET,
  REGISTER_FAIL,
  USER_LOADED,
  UPDATED_USER,
  SET_UNREAD_MESSAGE_COUNT,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  SET_URL,
  SET_BALANCE,
  SET_GASFEE,
  SET_AVATAR,
  SHOW_COOKIES,
  TRANSACTION_LOADED,
  TRANSACTIONS_LOADING,
  ALL_TRANSACTIONS,
  FETCH_RECENT_TRANSACTIONS_SUCCESS,
  NEW_TRANSACTION,
  LOADING_USER,
  UPDATE_USER_ASSOCIATED_ACCOUNTS,
  CHECK_AND_ADD_WALLET_ADDRESS,
  SET_USERNAME_PASSWORD,
  SET_DARK_MODE,
  LOADING_TRANSACTIONS,
  SET_FOCUSED,
  SET_REFERRAL_CODE,
  TOGGLE_MUTE,
  TOGGLE_CLICK_SOUNDS,
  TOGGLE_GAME_SOUNDS,
  TOGGLE_NOTIFICATION_SOUNDS,
  TOGGLE_LOW_GRAPHICS,
  TOGGLE_MUSIC_ENABLED,
  TOGGLE_DRAWER,
  SET_NOTIFICATIONS_ALLOWED,
  API_KEYS_LOADING,
  API_KEYS_LOADED,
  API_KEYS_ERROR,
  API_KEY_GENERATED,
  API_KEY_REVOKED,
  UPDATE_WALLET_BALANCE,
  UPDATE_WALLET_BALANCE_START,
  UPDATE_WALLET_BALANCE_SUCCESS,
  UPDATE_WALLET_BALANCE_FAIL,
  SET_LIVE_WALLET_BALANCE,
  WALLET_BALANCE_LOADING
} from '../types';

// Helper functions for localStorage operations
const getStoredBoolean = (key, defaultValue = true) => {
  const stored = localStorage.getItem(key);
  return stored === null ? defaultValue : stored !== 'false';
};

const setStoredValue = (key, value) => {
  localStorage.setItem(key, value);
};

const initialState = {
  // Authentication
  socket: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('isAuthenticated'),
  loading: true,
  loading_user: false,
  user: { _id: null, password: '' },
  
  // UI Settings - consolidated with helper function
  isDarkMode: getStoredBoolean('darkMode'),
  isWatching: getStoredBoolean('isWatching'),
  isNotificationsAllowed: getStoredBoolean('isNotificationsAllowed'),
  isMusicEnabled: getStoredBoolean('isMusicEnabled'),
  isLowGraphics: getStoredBoolean('isLowGraphics'),
  isMuted: localStorage.getItem('isMuted') === 'true',
  showCookieConsent: localStorage.getItem('showCookieConsent') === 'true',
  clickSounds: getStoredBoolean('clickSounds'),
  gameSounds: localStorage.getItem('gameSounds') === 'true',
  notificationSounds: localStorage.getItem('notificationSounds') === 'true',
  isDrawerOpen: getStoredBoolean('isDrawerOpen'),
  
  // Messages & Notifications
  unreadMessageCount: 0,
  isFocused: false,
  
  // Wallet & Balance
  gasfee: 0,
  connectedAccount: '',
  balance: 0,
  isWalletBalanceLoading: false,
  walletBalanceError: null,
  liveWalletBalance: 0,
  walletAddress: null,
  walletBalanceTimestamp: null,
  account: null,
  
  // User Info
  userName: '',
  referralCode: null,
  
  // App State
  liveUrl: null,
  
  // Transactions
  transactions: [],
  isLoadingTransactions: false,
  transactionsLoaded: false,
  all_transactions: null,
  page: 0,
  totalCount: 0,
  hasMore: false,
  transactions_loading: false,
  vaultTransactions: [],
  
  // Profit tracking
  sevenDayProfit: 0,
  oneDayProfit: 0,
  allTimeProfit: 0,
  
  // API Keys
  apiKeys: [],
  apiKeysLoading: false,
  apiKeysError: null,
};

// Helper function to handle localStorage updates
const updateLocalStorageAndState = (state, key, value) => {
  setStoredValue(key, value);
  return { ...state, [key]: value };
};

// Helper function to clear auth data
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
  return {
    ...initialState,
    // Preserve UI settings on logout
    isDarkMode: initialState.isDarkMode,
    isNotificationsAllowed: initialState.isNotificationsAllowed,
    isMusicEnabled: initialState.isMusicEnabled,
    isLowGraphics: initialState.isLowGraphics,
    isMuted: initialState.isMuted,
    clickSounds: initialState.clickSounds,
    gameSounds: initialState.gameSounds,
    notificationSounds: initialState.notificationSounds,
    isDrawerOpen: initialState.isDrawerOpen,
    showCookieConsent: initialState.showCookieConsent,
  };
};

export default function userReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    // API Keys Management
    case API_KEYS_LOADING:
      return {
        ...state,
        apiKeysLoading: true,
        apiKeysError: null,
      };

    case API_KEYS_LOADED:
      return {
        ...state,
        apiKeys: payload,
        apiKeysLoading: false,
        apiKeysError: null,
      };

    case API_KEYS_ERROR:
      return {
        ...state,
        apiKeysLoading: false,
        apiKeysError: payload,
      };

    case API_KEY_GENERATED:
      return {
        ...state,
        apiKeys: [...state.apiKeys, payload],
      };

    case API_KEY_REVOKED:
      return {
        ...state,
        apiKeys: state.apiKeys.map(key =>
          key.keyId === payload ? { ...key, isActive: false } : key
        ),
      };

    // UI Settings with localStorage
    case SET_DARK_MODE:
      return updateLocalStorageAndState(state, 'isDarkMode', payload);

    case TOGGLE_MUTE:
      return updateLocalStorageAndState(state, 'isMuted', payload);

    case TOGGLE_CLICK_SOUNDS:
      return updateLocalStorageAndState(state, 'clickSounds', payload);

    case TOGGLE_GAME_SOUNDS:
      return updateLocalStorageAndState(state, 'gameSounds', payload);

    case TOGGLE_NOTIFICATION_SOUNDS:
      return updateLocalStorageAndState(state, 'notificationSounds', payload);

    case TOGGLE_LOW_GRAPHICS:
      return updateLocalStorageAndState(state, 'isLowGraphics', payload);

    case TOGGLE_MUSIC_ENABLED:
      return updateLocalStorageAndState(state, 'isMusicEnabled', payload);

    case TOGGLE_DRAWER:
      return updateLocalStorageAndState(state, 'isDrawerOpen', payload);

    case SHOW_COOKIES:
      return updateLocalStorageAndState(state, 'showCookieConsent', payload);

    case SET_NOTIFICATIONS_ALLOWED:
      return updateLocalStorageAndState(state, 'isNotificationsAllowed', payload);

    // Wallet Balance Management
    case UPDATE_WALLET_BALANCE_START:
      return {
        ...state,
        isWalletBalanceLoading: true,
        walletBalanceError: null
      };

    case UPDATE_WALLET_BALANCE_SUCCESS:
    case UPDATE_WALLET_BALANCE:
      return {
        ...state,
        user: {
          ...state.user,
          walletBalance: payload.walletBalance,
          walletAddress: payload.walletAddress
        },
        isWalletBalanceLoading: false,
        walletBalanceError: null
      };

    case UPDATE_WALLET_BALANCE_FAIL:
      return {
        ...state,
        isWalletBalanceLoading: false,
        walletBalanceError: payload
      };

    case SET_LIVE_WALLET_BALANCE:
      return {
        ...state,
        liveWalletBalance: payload.balance,
        balance: payload.balance,
        walletAddress: payload.walletAddress,
        walletBalanceTimestamp: payload.timestamp,
        account: payload.account,
        walletBalanceError: null
      };

    case WALLET_BALANCE_LOADING:
      return {
        ...state,
        isWalletBalanceLoading: payload
      };

    case 'SET_WALLET_BALANCE_ERROR':
      return {
        ...state,
        walletBalanceError: payload,
        isWalletBalanceLoading: false
      };

    // User Management
    case UPDATE_USER_ASSOCIATED_ACCOUNTS:
      return {
        ...state,
        user: payload,
      };

    case CHECK_AND_ADD_WALLET_ADDRESS:
      return {
        ...state,
        connectedAccount: payload,
      };

    case LOADING_USER:
      return {
        ...state,
        loading_user: payload,
      };

    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload,
      };

    case UPDATED_USER:
      return {
        ...state,
        userName: payload.username,
        balance: payload.balance,
        user: {
          ...state.user,
          balance: payload.balance,
          elite: payload.elite,
          last_elite_payment: payload.last_elite_payment,
        },
        loading: false,
      };

    case SET_USERNAME_PASSWORD:
      return {
        ...state,
        user: { ...state.user, ...payload }
      };

    case SET_AVATAR:
      return {
        ...state,
        user: { ...state.user, avatar: payload }
      };

    // Authentication
    case LOGIN_SUCCESS:
      setStoredValue('token', payload.token);
      setStoredValue('isAuthenticated', '1');
      return {
        ...state,
        ...payload,
        user: { ...payload.user, password: '' },
        balance: payload.user.balance,
        userName: payload.user.username,
        token: payload.token,
        isAuthenticated: true,
        loading: false
      };

    case REGISTER_FAIL:
    case AUTH_ERROR:
    case LOGIN_FAIL:
    case LOGOUT:
      return clearAuthData();

    // App State
    case SET_SOCKET:
      return {
        ...state,
        socket: payload
      };

    case SET_UNREAD_MESSAGE_COUNT:
      return {
        ...state,
        unreadMessageCount: payload
      };

    case SET_FOCUSED:
      return {
        ...state,
        isFocused: payload,
      };

    case SET_BALANCE:
      return {
        ...state,
        balance: payload
      };

    case SET_GASFEE:
      return {
        ...state,
        gasfee: payload
      };

    case SET_URL:
      return {
        ...state,
        liveUrl: payload
      };

    case SET_REFERRAL_CODE:
      return {
        ...state,
        referralCode: payload
      };

    // Transactions
    case LOADING_TRANSACTIONS:
      return {
        ...state,
        isLoadingTransactions: payload
      };

    case TRANSACTION_LOADED:
      return {
        ...state,
        transactions: payload,
        transactionsLoaded: true,
        isLoadingTransactions: false
      };

    case TRANSACTIONS_LOADING:
      return {
        ...state,
        transactions_loading: true,
        transactions_error: null
      };

    case ALL_TRANSACTIONS: {
      const { all_transactions, page, totalCount, hasMore } = payload;
      return {
        ...state,
        transactions_loading: false,
        all_transactions:
          page === 1
            ? all_transactions
            : [...(state.all_transactions || []), ...all_transactions],
        page,
        totalCount,
        hasMore,
      };
    }

    case FETCH_RECENT_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        vaultTransactions: payload,
      };

    case NEW_TRANSACTION: {
      const existingIndex = state.transactions.findIndex(tx => tx._id === payload._id);

      if (existingIndex !== -1) {
        // Update existing transaction
        const newTransactions = [...state.transactions];
        const oldTx = newTransactions[existingIndex];
        newTransactions[existingIndex] = payload;

        // Skip balance update if new tx is 'pending'
        if (payload.status === 'pending') {
          return {
            ...state,
            transactions: newTransactions,
          };
        }

        // Calculate balance adjustment
        const oldAmount = oldTx.status === 'pending' ? 0 : oldTx.amount;
        const newAmount = payload.amount;
        const baseBalance = payload.user.balance;
        const updatedBalance = oldTx.status === 'pending'
          ? baseBalance + newAmount
          : baseBalance + (newAmount - oldAmount);

        return {
          ...state,
          transactions: newTransactions,
          balance: updatedBalance,
        };
      } else {
        // Add new transaction
        const newTransactions = [payload, ...state.transactions].slice(0, 4);
        const baseBalance = payload.user.balance;
        const updatedBalance = baseBalance + payload.amount;

        return {
          ...state,
          transactions: newTransactions,
          balance: updatedBalance,
        };
      }
    }

    default:
      return state;
  }
}