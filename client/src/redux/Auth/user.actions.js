import {
  SET_SOCKET,
  REGISTER_FAIL,
  USER_LOADED,
  UPDATED_USER,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOADING_USER,
  LOGIN_FAIL,
  LOGOUT,
  MSG_ERROR,
  MSG_INFO,
  MSG_SUCCESS,
  MSG_WARNING,
  SET_UNREAD_MESSAGE_COUNT,
  SET_BALANCE,
  SET_GASFEE,
  SET_URL,
  TRANSACTION_LOADED,
  TRANSACTIONS_LOADING,
  UPDATE_USER_ASSOCIATED_ACCOUNTS,
  CHECK_AND_ADD_WALLET_ADDRESS,
  ALL_TRANSACTIONS,
  SET_USERNAME_PASSWORD,
  SET_DARK_MODE,
  SET_FOCUSED,
  SET_NOTIFICATIONS_ALLOWED,
  TOGGLE_MUTE,
  TOGGLE_CLICK_SOUNDS,
  TOGGLE_GAME_SOUNDS,
  TOGGLE_NOTIFICATION_SOUNDS,
  TOGGLE_LOW_GRAPHICS,
  SHOW_COOKIES,
  TOGGLE_DRAWER,
  TOGGLE_MUSIC_ENABLED,
  START_LOADING,
  END_LOADING,
  TNX_INCOMPLETE,
  TNX_COMPLETE,
  API_KEYS_LOADING,
  API_KEYS_LOADED,
  API_KEYS_ERROR,
  API_KEY_GENERATED,
  API_KEY_REVOKED,
  LOADING_TRANSACTIONS,
  SET_LIVE_WALLET_BALANCE,
  WALLET_BALANCE_LOADING
} from '../types';
import axios from '../../util/Api';
import setAuthToken from '../../util/setAuthToken';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Helper function for consistent error handling
const handleActionError = (dispatch, error, defaultMessage = 'An error occurred') => {
  console.error(error);
  const message = error?.response?.data?.message || error.message || defaultMessage;
  dispatch({ type: MSG_WARNING, payload: message });
  return { status: 'failed', error: message };
};

// Helper function for success responses
const handleActionSuccess = (data, successMessage) => {
  return { status: 'success', ...data, message: successMessage };
};


export const userSignOut = (clear_token = true, navigate) => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/logout');

    if (data.success) {
      if (clear_token) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        setAuthToken();
      }

      dispatch({ type: LOGOUT });

      dispatch({ type: MSG_SUCCESS, payload: data.message });

      return { success: true };
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return { success: false, error: data.error };
    }
  } catch (error) {
    // Handle 401 as successful logout (already logged out on backend)
    if (error.response?.status === 401) {
      if (clear_token) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        setAuthToken();
      }
      dispatch({ type: LOGOUT });
      return { success: true };
    }

    return handleActionError(dispatch, error, 'Logout failed');
  }
};

// THIRD-PARTY AUTHENTICATION
export const authenticateWithPhantom = ({ walletAddress }) => async (dispatch) => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/auth/phantom', { walletAddress });
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      setAuthToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('isAuthenticated', '1');

      dispatch({ type: LOGIN_SUCCESS, payload: res.data });
      dispatch({ type: MSG_SUCCESS, payload: res.data.message });
      dispatch({ type: CHECK_AND_ADD_WALLET_ADDRESS, payload: walletAddress });

      return handleActionSuccess({ user: res.data.user }, res.data.message);
    } else {
      dispatch({ type: LOGIN_FAIL });
      dispatch({ type: MSG_ERROR, payload: res.data.error });
      return { status: 'failed' };
    }
  } catch (err) {
    dispatch({ type: END_LOADING });
    return handleActionError(dispatch, err, 'Phantom authentication failed');
  }
};

export const authenticateWithPrivy = (privyUser) => async (dispatch) => {
  try {
    dispatch({ type: START_LOADING });

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await axios.post('/auth/privy', {
      privyId: privyUser.id,
      email: privyUser.email?.address,
      wallet: privyUser.wallet?.address,
    }, {
      signal: controller.signal,
      timeout: 10000
    });

    clearTimeout(timeoutId);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      const token = res.data.token;
      
      // Batch localStorage operations
      requestIdleCallback(() => {
        localStorage.setItem('token', token);
        localStorage.setItem('isAuthenticated', '1');
      });
      
      setAuthToken(token);

      dispatch({
        type: LOGIN_SUCCESS,
        payload: {
          ...res.data,
          user: {
            ...res.data.user,
            primaryWallet: res.data.user.primaryWallet
          }
        }
      });

      return handleActionSuccess({ user: res.data.user }, res.data.message);
    }
  } catch (err) {
    dispatch({ type: END_LOADING });
    
    if (err.name === 'AbortError') {
      return handleActionError(dispatch, err, 'Authentication timeout - please try again');
    }
    
    return handleActionError(dispatch, err, 'Privy authentication failed');
  }
};


// USER DATA ACTIONS
export const getUser = () => async (dispatch) => {
  try {
    dispatch({ type: LOADING_USER, payload: true });
    const res = await axios.get('/auth/user');

    if (res.data.success) {
      const { user, unread_message_count, message } = res.data;

      dispatch({ type: USER_LOADED, payload: user });
      dispatch({ type: SET_UNREAD_MESSAGE_COUNT, payload: unread_message_count });

      if (message) {
        dispatch({ type: MSG_INFO, payload: message });
      }

      dispatch({ type: LOADING_USER, payload: false });
      return handleActionSuccess({ user }, 'User data loaded');
    } else {
      dispatch({ type: AUTH_ERROR });
      return { status: 'failed' };
    }
  } catch (err) {
    dispatch({ type: LOADING_USER, payload: false });
    return handleActionError(dispatch, err, 'Failed to load user data');
  }
};

export const changeUserName = (newUsername) => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/username', { newUsername });

    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Username updated successfully' });
      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return data;
    }
  } catch (error) {
    return handleActionError(dispatch, error, 'Failed to update username');
  }
};

export const changeLink = (link) => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/bio', { link });

    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Bio updated successfully' });
      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return data;
    }
  } catch (error) {
    return handleActionError(dispatch, error, 'Failed to update bio');
  }
};

export const changePasswordAndAvatar = (new_password, new_avatar) => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/changePasswordAndAvatar', { 
      new_password, 
      new_avatar // This is now a Pinata URL, not base64!
    });
    
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Profile updated successfully' });
      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return false;
    }
  } catch (error) {
    handleActionError(dispatch, error, 'Failed to update profile');
    return false;
  }
};

export const resetPassword = (params) => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/resetPassword', params);
    
    if (data.success) {
      dispatch({ type: MSG_INFO, payload: 'Password has been changed' });
      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return false;
    }
  } catch (error) {
    handleActionError(dispatch, error, 'Failed to reset password');
    return false;
  }
};

export const deleteAccount = () => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/deleteAccount');
    
    if (data.success) {
      dispatch({ type: LOGOUT });
    }
  } catch (error) {
    handleActionError(dispatch, error, 'Failed to delete account');
  }
};

// WALLET ACTIONS
export const checkAndAddWalletAddress = (walletAddress) => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/users/add-wallet', { walletAddress });
    
    if (data.success) {
      dispatch({ type: CHECK_AND_ADD_WALLET_ADDRESS, payload: walletAddress });
      dispatch({ type: UPDATE_USER_ASSOCIATED_ACCOUNTS, payload: data.updatedUser });
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return handleActionError(dispatch, error, 'Failed to add wallet address');
  }
};

export const disconnectWalletAddress = () => (dispatch) => {
  dispatch({ type: CHECK_AND_ADD_WALLET_ADDRESS, payload: '' });
};

export const getPrivyWalletBalance = (privyUser) => async (dispatch) => {
  try {
    if (!privyUser?.wallet?.address) {
      return { success: false, error: 'No wallet connected' };
    }

    const account = { publicKey: new PublicKey(privyUser.wallet.address) };
    const { data: { providerUrl } } = await axios.get('/stripe/get_provider_url');
    
    if (!providerUrl) {
      throw new Error('Failed to retrieve RPC provider URL');
    }

    const connection = new Connection(providerUrl, 'confirmed');
    const solBalLamports = await connection.getBalance(account.publicKey);
    const solanaBalance = solBalLamports / LAMPORTS_PER_SOL;

    dispatch({
      type: SET_LIVE_WALLET_BALANCE,
      payload: {
        balance: solanaBalance,
        walletAddress: privyUser.wallet.address,
        account,
        timestamp: Date.now()
      }
    });

    return { success: true, balance: solanaBalance };
  } catch (error) {
    // Fallback to backend API
    try {
      const response = await axios.get(`/auth/wallet-balance/${privyUser.wallet.address}`);
      
      if (response.data.success) {
        const account = { publicKey: new PublicKey(privyUser.wallet.address) };
        dispatch({
          type: SET_LIVE_WALLET_BALANCE,
          payload: {
            balance: response.data.balance,
            walletAddress: privyUser.wallet.address,
            account,
            timestamp: Date.now()
          }
        });
        return { success: true, balance: response.data.balance };
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    dispatch({ type: 'SET_WALLET_BALANCE_ERROR', payload: error.message });
    return { success: false, error: error.message };
  }
};

export const refreshWalletBalance = (privyUser) => async (dispatch) => {
  dispatch({ type: WALLET_BALANCE_LOADING, payload: true });
  
  try {
    const result = await dispatch(getPrivyWalletBalance(privyUser));
    return result;
  } finally {
    dispatch({ type: WALLET_BALANCE_LOADING, payload: false });
  }
};

// TRANSACTION ACTIONS
export const getUserTransactions = () => async (dispatch) => {
  try {
    dispatch({ type: LOADING_TRANSACTIONS, payload: true });
    const res = await axios.get('/auth/user/transactions');

    if (res.data.success) {
      dispatch({ type: TRANSACTION_LOADED, payload: res.data.transactions });
      dispatch({ type: LOADING_TRANSACTIONS, payload: false });
      return handleActionSuccess({ transactions: res.data.transactions }, 'Transactions loaded');
    } else {
      dispatch({ type: LOADING_TRANSACTIONS, payload: false });
      return { status: 'failed' };
    }
  } catch (err) {
    dispatch({ type: LOADING_TRANSACTIONS, payload: false });
    return handleActionError(dispatch, err, 'Failed to load transactions');
  }
};

export const getTransactions = (page = 1, filterType = '', sortBy = '', search = '') => async (dispatch) => {
  try {
    dispatch({ type: TRANSACTIONS_LOADING });

    const res = await axios.get('/auth/transactions', {
      params: { page, filterType, sortBy, search }
    });

    if (res.data.success) {
      dispatch({
        type: ALL_TRANSACTIONS,
        payload: {
          all_transactions: res.data.all_transactions,
          page: res.data.page,
          totalCount: res.data.totalCount,
          hasMore: res.data.hasMore
        }
      });
      return handleActionSuccess(res.data, 'Transactions loaded');
    } else {
      dispatch({
        type: 'TRANSACTIONS_ERROR',
        payload: res.data.error || 'Failed to load transactions'
      });
      return { status: 'failed', error: res.data.error };
    }
  } catch (err) {
    return handleActionError(dispatch, err, 'Failed to load transactions');
  }
};

// SUBSCRIPTION ACTIONS
export const purchaseEliteSubscription = (type, transactionSignature) => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    if (!transactionSignature) {
      const errorMsg = 'Transaction signature is required for verification.';
      dispatch({ type: MSG_ERROR, payload: errorMsg });
      dispatch({ type: TNX_COMPLETE });
      return false;
    }

    const res = await axios.post('/auth/purchase-elite', {
      type,
      signature: transactionSignature,
      amount: type === 'red' ? 0.1 : 0.4,
      timestamp: Date.now()
    });

    if (res.data.success) {
      dispatch({
        type: MSG_SUCCESS,
        payload: `${type.toUpperCase()} Elite subscription submitted! Verification in progress...`,
      });
      dispatch({ type: TNX_COMPLETE });
      return res.data;
    } else {
      const errorMsg = res.data.message || 'Failed to submit subscription for verification.';
      dispatch({ type: MSG_ERROR, payload: errorMsg });
      dispatch({ type: TNX_COMPLETE });
      return false;
    }
  } catch (err) {
    let errorMessage = 'An unexpected error occurred while submitting your subscription.';

    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.request) {
      errorMessage = 'Cannot connect to the server. Please check your internet connection and try again.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    dispatch({ type: MSG_ERROR, payload: errorMessage });
    dispatch({ type: TNX_COMPLETE });
    return false;
  }
};

export const cancelEliteSubscription = () => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });
    const res = await axios.post('/auth/cancel-elite');

    if (res.data.success) {
      dispatch({ type: UPDATED_USER, payload: res.data.user });
      dispatch({ type: MSG_SUCCESS, payload: 'Successfully cancelled Elite membership!' });
      return res.data;
    } else {
      dispatch({ type: MSG_ERROR, payload: res.data.message || 'Failed to cancel subscription' });
      return false;
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Error cancelling your subscription';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return false;
  } finally {
    dispatch({ type: TNX_COMPLETE });
  }
};

// API KEY ACTIONS
export const getApiKeys = () => async (dispatch) => {
  try {
    dispatch({ type: API_KEYS_LOADING });
    const response = await axios.get('/api/api-keys/list');

    if (response.data.success) {
      dispatch({ type: API_KEYS_LOADED, payload: response.data.apiKeys });
      return { success: true, apiKeys: response.data.apiKeys };
    } else {
      dispatch({ type: API_KEYS_ERROR, payload: response.data.error || 'Failed to load API keys' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to load API keys';
    dispatch({ type: API_KEYS_ERROR, payload: errorMessage });
    dispatch({ type: MSG_WARNING, payload: 'Failed to load API keys' });
    return { success: false, error: errorMessage };
  }
};

export const generateApiKey = (keyData) => async (dispatch) => {
  try {
    const response = await axios.post('/api/api-keys/generate', keyData);

    if (response.data.success) {
      dispatch({ type: API_KEY_GENERATED, payload: response.data.apiKey });
      dispatch({ type: MSG_SUCCESS, payload: 'API key generated successfully!' });
      return { success: true, apiKey: response.data.apiKey };
    } else {
      dispatch({ type: MSG_ERROR, payload: response.data.error || 'Failed to generate API key' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to generate API key';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

export const revokeApiKey = (keyId) => async (dispatch) => {
  try {
    const response = await axios.delete(`/api/api-keys/${keyId}`);

    if (response.data.success) {
      dispatch({ type: API_KEY_REVOKED, payload: keyId });
      dispatch({ type: MSG_SUCCESS, payload: 'API key revoked successfully!' });
      return { success: true };
    } else {
      dispatch({ type: MSG_ERROR, payload: response.data.error || 'Failed to revoke API key' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to revoke API key';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

export const updateApiKeyPermissions = (keyId, permissions) => async (dispatch) => {
  try {
    const response = await axios.put(`/api/api-keys/${keyId}`, { permissions });

    if (response.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'API key permissions updated successfully!' });
      dispatch(getApiKeys()); // Refresh the list
      return { success: true };
    } else {
      dispatch({ type: MSG_ERROR, payload: response.data.error || 'Failed to update API key' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to update API key';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// BONUS ACTIONS
export const addBonus = () => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/add-bonus');
    
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Bonus has been added successfully.' });
      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message || 'Failed to claim bonus.' });
      return { success: false, message: data.message };
    }
  } catch (error) {
    dispatch({ type: MSG_WARNING, payload: 'An error occurred while claiming the bonus.' });
    return { success: false, message: error.message };
  }
};

// REFERRAL ACTIONS
export const setReferralCode = (referralCode) => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/set-referral', { referralCode });
    
    if (data.success) {
      const message = referralCode 
        ? data.message || 'Referral code applied successfully.'
        : 'Referral code cleared successfully.';
      
      dispatch({ type: MSG_SUCCESS, payload: message });
      return { success: true, referredUser: data.referredUser || null };
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error || 'Failed to apply referral code.' });
      return { success: false, error: data.error };
    }
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Server error while setting referral code.';
    dispatch({ type: MSG_WARNING, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// SIMPLE SETTER ACTIONS
export const setSocket = (socket) => (dispatch) => {
  dispatch({ type: SET_SOCKET, payload: socket });
};

export const setUnreadMessageCount = (messageCount) => (dispatch) => {
  dispatch({ type: SET_UNREAD_MESSAGE_COUNT, payload: messageCount });
};

export const setUrl = (url) => (dispatch) => {
  dispatch({ type: SET_URL, payload: url });
};

export const setBalance = (balance) => (dispatch) => {
  dispatch({ type: SET_BALANCE, payload: balance });
};

export const setGasfee = (params) => async (dispatch) => {
  try {
    const { data } = await axios.post('/stripe/get_gasfee', params);
    dispatch({ type: SET_GASFEE, payload: data.data });
  } catch (error) {
    handleActionError(dispatch, error, 'Failed to get gas fee');
  }
};

export const setFocused = (isFocused) => (dispatch) => {
  dispatch({ type: SET_FOCUSED, payload: isFocused });
};

export const setUserInfo = (userInfo) => (dispatch) => {
  dispatch({ type: USER_LOADED, payload: userInfo });
};

// UI TOGGLE ACTIONS - These handle localStorage automatically via reducer
export const setDarkMode = (isDarkMode) => (dispatch) => {
  dispatch({ type: SET_DARK_MODE, payload: isDarkMode });
};

export const toggleMute = (isMuted) => (dispatch) => {
  dispatch({ type: TOGGLE_MUTE, payload: isMuted });
};

export const toggleClickSounds = (clickSounds) => (dispatch) => {
  dispatch({ type: TOGGLE_CLICK_SOUNDS, payload: clickSounds });
};

export const toggleGameSounds = (gameSounds) => (dispatch) => {
  dispatch({ type: TOGGLE_GAME_SOUNDS, payload: gameSounds });
};

export const toggleNotificationSounds = (notificationSounds) => (dispatch) => {
  dispatch({ type: TOGGLE_NOTIFICATION_SOUNDS, payload: notificationSounds });
};

export const toggleLowGraphics = (isLowGraphics) => (dispatch) => {
  dispatch({ type: TOGGLE_LOW_GRAPHICS, payload: isLowGraphics });
};

export const showCookieConsent = (showCookieConsent) => (dispatch) => {
  dispatch({ type: SHOW_COOKIES, payload: showCookieConsent });
};

export const toggleMusic = (isMusicEnabled) => (dispatch) => {
  dispatch({ type: TOGGLE_MUSIC_ENABLED, payload: isMusicEnabled });
};

export const toggleDrawer = (isDrawerOpen) => (dispatch) => {
  dispatch({ type: TOGGLE_DRAWER, payload: isDrawerOpen });
};

export const setNotificationsAllowed = (isNotificationsAllowed) => (dispatch) => {
  if (isNotificationsAllowed) {
    // Request permission if notifications are allowed
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          dispatch({ type: SET_NOTIFICATIONS_ALLOWED, payload: true });
        }
      });
    } else {
      dispatch({ type: SET_NOTIFICATIONS_ALLOWED, payload: true });
    }
  } else {
    dispatch({ type: SET_NOTIFICATIONS_ALLOWED, payload: false });
  }
};