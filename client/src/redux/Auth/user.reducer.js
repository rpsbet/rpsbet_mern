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
  SET_SEVEN_DAY_PROFIT,
  SET_ONE_DAY_PROFIT,
  SET_ALL_TIME_PROFIT,
  NEW_TRANSACTION,
  LOADING_USER,
  UPDATE_USER_ASSOCIATED_ACCOUNTS,
  CHECK_AND_ADD_WALLET_ADDRESS,
  SET_USERNAME_PASSWORD,
  SET_DARK_MODE,
  SET_SPECTATE_MODE,
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
} from '../types';

const initialState = {
  socket: null,
  token: localStorage.getItem('token'),
  isAuthenticated: localStorage.getItem('isAuthenticated'),
  isDarkMode: localStorage.getItem('darkMode') === 'false' ? false : true,
  isWatching: localStorage.getItem('isWatching') === 'false' ? false : true,
  isNotificationsAllowed: localStorage.getItem('isNotificationsAllowed') === 'false' ? false : true,
  isAdmin: false,
  isMusicEnabled:
    localStorage.getItem('isMusicEnabled') === 'false' ? false : true,
  isLowGraphics:
    localStorage.getItem('isLowGraphics') === 'false' ? false : true,
  isMuted: localStorage.getItem('isMuted') === 'true' ? true : false,
  showCookieConsent: localStorage.getItem('showCookieConsent') === 'true' ? true : false,
  clickSounds: localStorage.getItem('clickSounds') === 'false' ? true : false,
  gameSounds: localStorage.getItem('gameSounds') === 'true' ? true : false,
  notificationSounds: localStorage.getItem('notificationSounds') === 'true' ? true : false,
  isDrawerOpen: localStorage.getItem('isDrawerOpen') === 'false' ? false : true,
  loading: true,
  loading_user: false,
  user: { _id: null, password: '' },
  unreadMessageCount: 0,
  balance: 0,
  gasfee: 0,
  connectedAccount: '',
  ai_mode: '',
  isFocused: false,
  userName: '',
  liveUrl: null,
  transactions: [],
  all_transactions: null,
  page: 0,
  totalCount: 0,
  hasMore: false,
  transactions_loading: false,
  apiKeys: [],
  apiKeysLoading: false,
  apiKeysError: null,
  sevenDayProfit: null,
  oneDayProfit: null,
  allTimeProfit: null,
  referralCode: null,
  balance: 0,
  isWalletBalanceLoading: false,
  walletBalanceError: null,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
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
    case SET_DARK_MODE:
      localStorage.setItem('darkMode', payload);
      return {
        ...state,
        isDarkMode: payload
      };
    case SET_SPECTATE_MODE:
      localStorage.setItem('isWatching', payload);
      return {
        ...state,
        isWatching: payload
      };
    case TOGGLE_MUTE:
      localStorage.setItem('isMuted', payload);
      return {
        ...state,
        isMuted: payload
      };
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
          walletBalance: action.payload.walletBalance,
          walletAddress: action.payload.walletAddress
        },
        isWalletBalanceLoading: false,
        walletBalanceError: null
      };

    case UPDATE_WALLET_BALANCE_FAIL:
      return {
        ...state,
        isWalletBalanceLoading: false,
        walletBalanceError: action.payload
      };
    case UPDATE_USER_ASSOCIATED_ACCOUNTS:
      return {
        ...state,
        user: action.payload,
      };
    case CHECK_AND_ADD_WALLET_ADDRESS:
      return {
        ...state,
        connectedAccount: action.payload,
      };

    case 'SET_LIVE_WALLET_BALANCE':
      return {
        ...state,
        liveWalletBalance: action.payload.balance,
        walletAddress: action.payload.walletAddress,
        walletBalanceTimestamp: action.payload.timestamp,
        account: action.payload.account,
        walletBalanceError: null
      };

    case 'WALLET_BALANCE_LOADING':
      return {
        ...state,
        isWalletBalanceLoading: action.payload
      };

    case 'SET_WALLET_BALANCE_ERROR':
      return {
        ...state,
        walletBalanceError: action.payload,
        isWalletBalanceLoading: false
      };

    case 'LOGOUT':
      return {
        ...initialState,
        // Clear all wallet-related state on logout
        liveWalletBalance: 0,
        walletAddress: null,
        walletBalanceTimestamp: null,
        walletBalanceError: null
      };
    case TOGGLE_CLICK_SOUNDS:
      localStorage.setItem('clickSounds', payload);
      return {
        ...state,
        clickSounds: payload
      };
    case TOGGLE_GAME_SOUNDS:
      localStorage.setItem('gameSounds', payload);
      return {
        ...state,
        gameSounds: payload
      };
    case TOGGLE_NOTIFICATION_SOUNDS:
      localStorage.setItem('notificationSounds', payload);
      return {
        ...state,
        notificationSounds: payload
      };
    case FETCH_RECENT_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        vaultTransactions: payload,
      };
    case SET_NOTIFICATIONS_ALLOWED:
      localStorage.setItem('isNotificationsAllowed', payload);
      return {
        ...state,
        isNotificationsAllowed: payload
      };
    case SET_FOCUSED:
      return {
        ...state,
        isFocused: payload,
      };
    case TOGGLE_LOW_GRAPHICS:
      localStorage.setItem('isLowGraphics', payload);
      return {
        ...state,
        isLowGraphics: payload
      };
    case SHOW_COOKIES:
      localStorage.setItem('showCookieConsent', payload);
      return {
        ...state,
        showCookieConsent: payload
      };
    case TOGGLE_MUSIC_ENABLED:
      localStorage.setItem('isMusicEnabled', payload);
      return {
        ...state,
        isMusicEnabled: payload
      };
    case TOGGLE_DRAWER:
      localStorage.setItem('isDrawerOpen', payload);
      return {
        ...state,
        isDrawerOpen: payload
      };
    case SET_SOCKET:
      return {
        ...state,
        socket: payload
      };
    case TRANSACTION_LOADED:
      return {
        ...state,
        transactions: payload,
      };
    case LOADING_USER:
      return {
        ...state,
        loading_user: payload,
      };
    case TRANSACTIONS_LOADING:
      return {
        ...state,
        transactions_loading: true,
        transactions_error: null
      };
    case ALL_TRANSACTIONS: {
      const { all_transactions, page, totalCount, hasMore } = action.payload;
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
    case NEW_TRANSACTION: {
      const existingIndex = state.transactions.findIndex(tx => tx._id === payload._id);

      if (existingIndex !== -1) {
        // 1) It's an existing transaction; replace it
        const newTransactions = [...state.transactions];
        const oldTx = newTransactions[existingIndex];

        // Replace old transaction with new payload
        newTransactions[existingIndex] = payload;

        // 2) Skip balance update if new tx is 'pending'
        if (payload.status === 'pending') {
          return {
            ...state,
            transactions: newTransactions,
            // balance remains unchanged
          };
        } else {
          // If new status is *not* pending, find how much we need to adjust from payload.user.balance
          const oldAmount = oldTx.status === 'pending' ? 0 : oldTx.amount;
          const newAmount = payload.amount;

          // Always use payload.user.balance as the base
          const baseBalance = payload.user.balance;
          const updatedBalance = oldTx.status === 'pending'
            ? baseBalance + newAmount // Add the new amount directly if the old transaction was pending
            : baseBalance + (newAmount - oldAmount); // Adjust the balance if the old transaction was completed

          return {
            ...state,
            transactions: newTransactions,
            balance: updatedBalance,
          };
        }
      } else {
        // 2) It's a brand new transaction
        const newTransactions = [payload]
          .concat(JSON.parse(JSON.stringify(state.transactions)))
          .slice(0, 4);

        // Always use payload.user.balance as the base
        const baseBalance = payload.user.balance;
        const updatedBalance = baseBalance + payload.amount; // Deducting because `payload.amount` is negative

        return {
          ...state,
          transactions: newTransactions,
          balance: updatedBalance,
        };
      }
    }

    case SET_SEVEN_DAY_PROFIT:
      return {
        ...state,
        sevenDayProfit: payload
      };
    case SET_ONE_DAY_PROFIT:
      return {
        ...state,
        oneDayProfit: payload
      };
    case SET_ALL_TIME_PROFIT:
      return {
        ...state,
        allTimeProfit: payload
      };
    case SET_AVATAR:
      return {
        ...state,
        user: { ...state.user, avatar: payload }
      };
    case SET_USERNAME_PASSWORD:
      return {
        ...state,
        user: { ...state.user, ...payload }
      };
    case SET_UNREAD_MESSAGE_COUNT:
      return {
        ...state,
        unreadMessageCount: payload
      };
    case USER_LOADED:
      return {
        ...state,
        isAdmin: 0,
        userName: payload.username,
        isAuthenticated: true,
        totalWagered: payload.totalWagered,
        loading: false,
        user: { ...payload, password: '' },
        balance: payload.balance
      };
    case UPDATED_USER:
      return {
        ...state,
        userName: action.payload.username,
        balance: action.payload.balance,
        user: {
          ...state.user, // Preserve existing user fields
          balance: action.payload.balance,
          elite: action.payload.elite,
          last_elite_payment: action.payload.last_elite_payment,
        },
        loading: false,
      };
    case LOGIN_SUCCESS:
      localStorage.setItem('token', payload.token);
      localStorage.setItem('isAuthenticated', 1);
      return {
        ...state,
        ...payload,
        user: { ...payload.user, password: '' },
        balance: payload.user.balance,
        isAdmin: 0,
        userName: payload.user.username,
        token: payload.token,
        isAuthenticated: true,
        loading: false
      };
    case REGISTER_FAIL:
    case AUTH_ERROR:
    case LOGIN_FAIL:
    case LOGOUT:
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      return {
        ...state,
        token: null,
        isAdmin: false,
        userName: null,
        user: '',
        isAuthenticated: false,
        loading: false
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
    default:
      return state;
  }
}
