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
  SET_SPECTATE_MODE,
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
  UPDATE_WALLET_BALANCE,
  UPDATE_WALLET_BALANCE_START,
  UPDATE_WALLET_BALANCE_SUCCESS,
  UPDATE_WALLET_BALANCE_FAIL,
} from '../types';
import axios from '../../util/Api';
import setAuthToken from '../../util/setAuthToken';
import { sendSolDeposit } from '../../util/solana';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
export const getTransactions = (
  page = 1,
  filterType = '',
  sortBy = '',
  search = ''
) => async dispatch => {
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
    } else {
      dispatch({
        type: TRANSACTIONS_ERROR,
        payload: res.data.error || 'Failed to load transactions'
      });
    }
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err.message });
    return { status: 'failed' };
  }
};

export const checkAndAddWalletAddress = (walletAddress) => async (dispatch, getState) => {
  try {
    // Optionally, you can get the current user from Redux if needed:
    // const { auth: { user } } = getState();

    const { data } = await axios.post('/auth/users/add-wallet', { walletAddress });
    // The response should be something like:
    // { success: true, updatedUser: {...} } OR { success: false, message: '...' }
    if (data.success) {
      dispatch({
        type: CHECK_AND_ADD_WALLET_ADDRESS,
        payload: walletAddress,
      });
      dispatch({
        type: UPDATE_USER_ASSOCIATED_ACCOUNTS,
        payload: data.updatedUser,
      });
      return { success: true };
    } else {
      // The wallet address belongs to another user, or something else failed.
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Error adding wallet address:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong',
    };
  }
};
export const disconnectWalletAddress = () => async (dispatch) => {
  dispatch({
    type: CHECK_AND_ADD_WALLET_ADDRESS,
    payload: '',
  });
};

export const getUser = () => async dispatch => {
  try {
    // If we have a token in localStorage, set it in headers
    if (localStorage.token) {
      localStorage.removeItem('isAdminAuthenticated');
      setAuthToken(localStorage.token);
    }

    // Indicate we’re about to fetch user data
    dispatch({ type: LOADING_USER, payload: true });

    // Call the simplified /auth/user route
    const res = await axios.get('/auth/user');

    if (res.data.success) {
      const { user, unread_message_count, transactions, message } = res.data;

      // Dispatch user info, unread count, and last 5 transactions
      dispatch({ type: USER_LOADED, payload: user });
      dispatch({ type: SET_UNREAD_MESSAGE_COUNT, payload: unread_message_count });
      dispatch({ type: TRANSACTION_LOADED, payload: transactions });

      // If the server returned a message, display it
      if (message) {
        dispatch({ type: MSG_INFO, payload: message });
      }

      // Indicate we’ve finished fetching user data
      dispatch({ type: LOADING_USER, payload: false });

      return {
        status: 'success',
        user
      };
    } else {
      dispatch({ type: AUTH_ERROR });
    }
  } catch (err) {
    console.error(err);
    dispatch({ type: MSG_WARNING, payload: err });
    return {
      status: 'failed'
    };
  }
};

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
    console.error('Error in addBonus action:', error);
    dispatch({ type: MSG_WARNING, payload: 'An error occurred while claiming the bonus.' });
    return { success: false, message: error.message };
  }
};


// Register User
export const userSignUp = ({
  userName,
  password,
  bio,
  avatar,
  referralCode,
  avatarMethod,
  recaptchaToken
}) => async (dispatch) => {
  try {
    dispatch({ type: START_LOADING });

    // Register User
    const body = JSON.stringify({
      username: userName,
      password,
      bio,
      avatar,
      referralCode,
      avatarMethod,
      recaptchaToken
    });

    const res = await axios.post('/user', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      dispatch({ type: SET_USERNAME_PASSWORD, payload: { password } });
      dispatch(setReferralCode(referralCode));
      return { status: 'success' };
    } else {
      dispatch({ type: REGISTER_FAIL });
      dispatch({ type: MSG_ERROR, payload: res.data.error });
      return { status: 'failed', error: res.data.error };
    }
  } catch (err) {
    console.log('err***', err);
    dispatch({ type: MSG_WARNING, payload: err });
    return { status: 'failed', error: err.message || 'An error occurred' };
  }
};

//referral
export const setReferralCode = (referralCode) => async (dispatch) => {
  try {
    // Make a POST request to the backend to set the referral code
    const { data } = await axios.post('/auth/set-referral', { referralCode });
    if (data.success) {
      if (referralCode) {
        dispatch({
          type: MSG_SUCCESS,
          payload: data.message || 'Referral code applied successfully.',
        });
      } else {
        dispatch({
          type: MSG_SUCCESS,
          payload: 'Referral code cleared successfully.',
        });
      }

      return { success: true, referredUser: data.referredUser || null };
    } else {
      dispatch({
        type: MSG_ERROR,
        payload: data.error || 'Failed to apply referral code.',
      });
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error setting referral code:', error);
    dispatch({
      type: MSG_WARNING,
      payload: error?.response?.data?.message || 'Server error while setting referral code.',
    });
    return { success: false, error: error.message };
  }
};

export const getApiKeys = () => async (dispatch) => {
  try {
    dispatch({ type: API_KEYS_LOADING });

    const response = await axios.get('/api/api-keys/list');

    if (response.data.success) {
      dispatch({
        type: API_KEYS_LOADED,
        payload: response.data.apiKeys
      });
      return { success: true, apiKeys: response.data.apiKeys };
    } else {
      dispatch({
        type: API_KEYS_ERROR,
        payload: response.data.error || 'Failed to load API keys'
      });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    dispatch({
      type: API_KEYS_ERROR,
      payload: error.response?.data?.error || 'Failed to load API keys'
    });
    dispatch({ type: MSG_WARNING, payload: 'Failed to load API keys' });
    return { success: false, error: error.message };
  }
};

// Generate new API key
export const generateApiKey = (keyData) => async (dispatch) => {
  try {
    const response = await axios.post('/api/api-keys/generate', keyData);

    if (response.data.success) {
      dispatch({
        type: API_KEY_GENERATED,
        payload: response.data.apiKey
      });
      dispatch({ type: MSG_SUCCESS, payload: 'API key generated successfully!' });
      return { success: true, apiKey: response.data.apiKey };
    } else {
      dispatch({ type: MSG_ERROR, payload: response.data.error || 'Failed to generate API key' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error('Error generating API key:', error);
    const errorMessage = error.response?.data?.error || 'Failed to generate API key';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Revoke API key
export const revokeApiKey = (keyId) => async (dispatch) => {
  try {
    const response = await axios.delete(`/api/api-keys/${keyId}`);

    if (response.data.success) {
      dispatch({
        type: API_KEY_REVOKED,
        payload: keyId
      });
      dispatch({ type: MSG_SUCCESS, payload: 'API key revoked successfully!' });
      return { success: true };
    } else {
      dispatch({ type: MSG_ERROR, payload: response.data.error || 'Failed to revoke API key' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error('Error revoking API key:', error);
    const errorMessage = error.response?.data?.error || 'Failed to revoke API key';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Update API key permissions
export const updateApiKeyPermissions = (keyId, permissions) => async (dispatch) => {
  try {
    const response = await axios.put(`/api/api-keys/${keyId}`, { permissions });

    if (response.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'API key permissions updated successfully!' });
      // Refresh the API keys list
      dispatch(getApiKeys());
      return { success: true };
    } else {
      dispatch({ type: MSG_ERROR, payload: response.data.error || 'Failed to update API key' });
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error('Error updating API key:', error);
    const errorMessage = error.response?.data?.error || 'Failed to update API key';
    dispatch({ type: MSG_ERROR, payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};


export const cancelEliteSubscription = () => async (dispatch) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    const res = await axios.post('/auth/cancel-elite');

    if (res.data.success) {
      dispatch({ type: UPDATED_USER, payload: res.data.user });
      dispatch({
        type: MSG_SUCCESS,
        payload: 'Successfully cancelled Elite membership!',
      });
      return res.data;
    } else {
      dispatch({
        type: MSG_ERROR,
        payload: res.data.message || 'Failed to cancel subscription',
      });
    }
  } catch (err) {
    console.error('Cancel subscription error:', err.response?.data);
    dispatch({
      type: MSG_ERROR,
      payload: err.response?.data?.message || 'Error cancelling your subscription',
    });
  } finally {
    dispatch({ type: TNX_COMPLETE });
  }
  return false;
};

export const purchaseEliteSubscription = (type, transactionSignature) => async (dispatch, getState) => {
  try {
    dispatch({ type: TNX_INCOMPLETE });

    console.log('[purchaseEliteSubscription] Submitting for verification:', {
      type,
      transactionSignature
    });

    if (!transactionSignature) {
      const errorMsg = 'Transaction signature is required for verification.';
      console.error('[purchaseEliteSubscription] Missing signature');

      dispatch({
        type: MSG_ERROR,
        payload: errorMsg,
      });
      dispatch({ type: TNX_COMPLETE });
      return false;
    }

    // Send to backend - this will create a pending transaction
    const res = await axios.post('/auth/purchase-elite', {
      type,
      signature: transactionSignature,
      amount: type === 'red' ? 0.1 : 0.4,
      timestamp: Date.now()
    });

    if (res.data.success) {
      console.log('[purchaseEliteSubscription] Transaction submitted successfully:', res.data);

      // Show pending message
      dispatch({
        type: MSG_SUCCESS,
        payload: `${type.toUpperCase()} Elite subscription submitted! Verification in progress...`,
      });

      // Note: Don't update user.elite immediately
      // The cron job will verify the transaction and send real-time updates
      // Your socket listeners should handle the actual user updates

      dispatch({ type: TNX_COMPLETE });
      return res.data;
    } else {
      const errorMsg = res.data.message || 'Failed to submit subscription for verification.';
      console.error('[purchaseEliteSubscription] Backend submission failed:', res.data);

      dispatch({
        type: MSG_ERROR,
        payload: errorMsg,
      });
      dispatch({ type: TNX_COMPLETE });
      return false;
    }

  } catch (err) {
    console.error('[purchaseEliteSubscription] Caught error:', err);

    let errorMessage = 'An unexpected error occurred while submitting your subscription.';

    if (err.isAxiosError) {
      if (err.response) {
        console.error('[purchaseEliteSubscription] Server Response Error:', err.response.data);
        errorMessage = err.response.data?.message ||
          err.response.statusText ||
          'Server error during subscription submission.';
      } else if (err.request) {
        console.error('[purchaseEliteSubscription] Network Error:', err.request);
        errorMessage = 'Cannot connect to the server. Please check your internet connection and try again.';
      } else {
        console.error('[purchaseEliteSubscription] Request Setup Error:', err.message);
        errorMessage = err.message || 'Error setting up the subscription request.';
      }
    } else {
      console.error('[purchaseEliteSubscription] Non-Axios Error:', err);
      if (err.message) {
        errorMessage = err.message;
      }
    }

    dispatch({
      type: MSG_ERROR,
      payload: errorMessage,
    });

  } finally {
    dispatch({ type: TNX_COMPLETE });
  }

  return false;
};

export const authenticateWithPhantom = ({ walletAddress }) => async (dispatch) => {
  try {
    // Show loading spinner
    dispatch({ type: START_LOADING });

    // Call your backend route with the wallet address
    const res = await axios.post('/auth/phantom', { walletAddress });

    // Stop loading
    dispatch({ type: END_LOADING });

    // Check success status
    if (res.data.success) {
      // Save token in local storage
      setAuthToken(res.data.token); // sets default axios header
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('isAuthenticated', 1);

      // Dispatch login success
      dispatch({ type: LOGIN_SUCCESS, payload: res.data });
      dispatch({ type: MSG_SUCCESS, payload: res.data.message });
      dispatch({ type: CHECK_AND_ADD_WALLET_ADDRESS, payload: walletAddress });

      // Return consistent object for the component
      return { status: 'success', user: res.data.user };
    } else {
      // If not success, dispatch login fail
      dispatch({ type: LOGIN_FAIL });
      dispatch({ type: MSG_ERROR, payload: res.data.error });
      return { status: 'failed' };
    }
  } catch (err) {
    // Handle any unexpected errors
    console.error('Error during Phantom auth:', err);
    dispatch({ type: END_LOADING });
    dispatch({ type: MSG_WARNING, payload: err.message || 'Server error' });
    return { status: 'failed' };
  }
};

export const refreshWalletBalance = (privyUser) => async (dispatch) => {
  dispatch({ type: 'WALLET_BALANCE_LOADING', payload: true });

  try {
    const result = await dispatch(getPrivyWalletBalance(privyUser));
    return result;
  } finally {
    dispatch({ type: 'WALLET_BALANCE_LOADING', payload: false });
  }
};

// Update authenticateWithPrivy to handle wallet balance
export const authenticateWithPrivy = (privyUser) => async (dispatch) => {
  try {
    dispatch({ type: START_LOADING });

    const res = await axios.post('/auth/privy', {
      privyId: privyUser.id,
      email: privyUser.email?.address,
      wallet: privyUser.wallet?.address,
    });

    dispatch({ type: END_LOADING });

    if (res.data.success) {
      const token = res.data.token;

      localStorage.setItem('token', token);
      localStorage.setItem('isAuthenticated', '1');
      setAuthToken(token);

      // Store user data WITHOUT wallet balance - we'll fetch it separately
      dispatch({
        type: LOGIN_SUCCESS,
        payload: {
          ...res.data,
          user: {
            ...res.data.user,
            // Remove walletBalance from here - we'll get it from Privy directly
            primaryWallet: res.data.user.primaryWallet
          }
        }
      });

      // dispatch({ type: MSG_SUCCESS, payload: res.data.message });

      return { status: 'success', user: res.data.user };
    }
  } catch (err) {
    dispatch({ type: MSG_WARNING, payload: err.message });
    return { status: 'failed' };
  }
};

export const getPrivyWalletBalance = (privyUser) => async (dispatch) => {
  try {
    if (!privyUser?.wallet?.address) {
      console.log('No wallet address found');
      return { success: false, error: 'No wallet connected' };
    }

    // Build account object with publicKey property
    const account = { publicKey: new PublicKey(privyUser.wallet.address) };

    // Get provider URL
    const { data: { providerUrl } } = await axios.get('/stripe/get_provider_url');
    if (!providerUrl) {
      throw new Error('Failed to retrieve RPC provider URL');
    }

    const connection = new Connection(providerUrl, 'confirmed');

    const solBalLamports = await connection.getBalance(account.publicKey);
    const solanaBalance = solBalLamports / LAMPORTS_PER_SOL;

    // Store both balance and account (as object with publicKey)
    dispatch({
      type: 'SET_LIVE_WALLET_BALANCE',
      payload: {
        balance: solanaBalance,
        walletAddress: privyUser.wallet.address,
        account, // always an object: { publicKey: PublicKey }
        timestamp: Date.now()
      }
    });

    return { success: true, balance: solanaBalance };
  } catch (error) {
    console.error('Error getting wallet balance:', error);

    // Fallback to backend API if direct Solana connection fails
    try {
      const response = await axios.get(`/auth/wallet-balance/${privyUser.wallet.address}`);

      if (response.data.success) {
        const account = { publicKey: new PublicKey(privyUser.wallet.address) };
        dispatch({
          type: 'SET_LIVE_WALLET_BALANCE',
          payload: {
            balance: response.data.balance,
            walletAddress: privyUser.wallet.address,
            account, // again as object
            timestamp: Date.now()
          }
        });
        return { success: true, balance: response.data.balance };
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    dispatch({
      type: 'SET_WALLET_BALANCE_ERROR',
      payload: error.message
    });
    return { success: false, error: error.message };
  }
};

// Login User
export const userSignIn = body => async dispatch => {
  try {
    // dispatch({ type: START_LOADING });
    const res = await axios.post('/auth', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      setAuthToken(res.data.token);
      dispatch({ type: LOGIN_SUCCESS, payload: res.data });
      dispatch({ type: MSG_SUCCESS, payload: res.data.message });
      return { status: 'success', user: res.data.user };
    } else {
      dispatch({ type: LOGIN_FAIL });
      // dispatch({ type: MSG_ERROR, payload: res.data.error });
    }
  } catch (err) {
    console.log('err', err);
    dispatch({ type: MSG_WARNING, payload: err });
  }
  return { status: 'failed' };
};

// Edit Profile
export const changePasswordAndAvatar = (new_password, new_avatar) => async dispatch => {
  try {
    const { data } = await axios.post('/auth/changePasswordAndAvatar', { new_password, new_avatar });
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'User infomation has been saved.' });
      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
  return false;
};

export const resetPassword = (params) => async dispatch => {
  try {
    const { data } = await axios.post('/auth/resetPassword', params);
    if (data.success) {
      dispatch({ type: MSG_INFO, payload: 'Password has been changed.' })
      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error })
    }
  } catch (e) {
    console.log('error', e)
  }
  return false;
}

// Delete Account
export const deleteAccount = () => async dispatch => {
  try {
    const { data } = await axios.post('/auth/deleteAccount');
    if (data.success) {
      // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'RPS Bet', message: 'Your account has been deleted.'} });
      dispatch({ type: LOGOUT });
    } else {
      // dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'Warning!', message: data.error} });
      // dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

// Logout / Clear Profile
export const userSignOut = (clear_token, navigate) => async (dispatch) => {
  try {
    console.log("Starting backend logout process...");

    const { data } = await axios.post('/auth/logout');

    if (data.success) {
      console.log("Backend logout successful");

      // Clear token and auth state AFTER successful backend response
      if (clear_token) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        setAuthToken();
      }

      // Clear Redux state
      dispatch({ type: 'LOGOUT' });

      // Navigate
      navigate('/');

      // Show success message
      dispatch({ type: 'MSG_SUCCESS', payload: data.message });

      return { success: true };
    } else {
      console.error("Backend logout failed:", data.error);
      dispatch({ type: 'MSG_ERROR', payload: data.error });
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Backend logout error:', error);

    // If it's a 401 error, the user is already logged out on backend
    if (error.response?.status === 401) {

      if (clear_token) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        setAuthToken();
      }

      dispatch({ type: 'LOGOUT' });
      navigate('/');

      return { success: true };
    }

    // For other errors, return failure but don't throw
    dispatch({ type: 'MSG_WARNING', payload: error.message || 'Logout failed' });
    return { success: false, error: error.message };
  }
};


export const setSocket = socket => dispatch => {
  dispatch({ type: SET_SOCKET, payload: socket });
}

export const setUnreadMessageCount = messageCount => dispatch => {
  dispatch({ type: SET_UNREAD_MESSAGE_COUNT, payload: messageCount });
}

export const setUrl = url => dispatch => {
  dispatch({ type: SET_URL, payload: url });
};

export const setBalance = balance => dispatch => {
  dispatch({ type: SET_BALANCE, payload: balance });
}

export const setGasfee = params => async dispatch => {
  const { data } = await axios.post('/stripe/get_gasfee', params);
  dispatch({ type: SET_GASFEE, payload: data.data });
}

export const toggleMute = isMuted => dispatch => {
  dispatch({ type: TOGGLE_MUTE, payload: isMuted });
}
export const toggleClickounds = clickSounds => dispatch => {
  dispatch({ type: TOGGLE_CLICK_SOUNDS, payload: clickSounds });
}
export const toggleGameSounds = gameSounds => dispatch => {
  dispatch({ type: TOGGLE_GAME_SOUNDS, payload: gameSounds });
}
export const toggleNotificationSounds = notificationSounds => dispatch => {
  dispatch({ type: TOGGLE_NOTIFICATION_SOUNDS, payload: notificationSounds });
}

export const toggleLowGraphics = isLowGraphics => dispatch => {
  dispatch({ type: TOGGLE_LOW_GRAPHICS, payload: isLowGraphics });
}
export const showCookieConsent = showCookieConsent => dispatch => {
  dispatch({ type: SHOW_COOKIES, payload: showCookieConsent });
}

export const toggleMusic = isMusicEnabled => dispatch => {
  dispatch({ type: TOGGLE_MUSIC_ENABLED, payload: isMusicEnabled });
}

export const toggleDrawer = isDrawerOpen => dispatch => {
  dispatch({ type: TOGGLE_DRAWER, payload: isDrawerOpen });
}

export const setDarkMode = isDarkMode => dispatch => {
  dispatch({ type: SET_DARK_MODE, payload: isDarkMode });
}
export const setSpectateMode = isWatching => dispatch => {
  dispatch({ type: SET_SPECTATE_MODE, payload: isWatching });
}

export const setNotificationsAllowed = isNotificationsAllowed => dispatch => {
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
    // Remove permission if notifications are not allowed
    if (Notification.permission === 'granted') {
      Notification.permission = 'denied';
    }
    dispatch({ type: SET_NOTIFICATIONS_ALLOWED, payload: false });
  }
};

export const setFocused = isFocused => dispatch => {
  dispatch({ type: SET_FOCUSED, payload: isFocused });
}

// Change User Name
export const changeUserName = (newUsername) => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/username', { newUsername }); // Wrap newUsername in an object

    if (data.success) {
      // dispatch({ type: USER_LOADED, payload: data.user });
      dispatch({ type: MSG_SUCCESS, payload: 'Your username has been updated successfully' });

      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return data;
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
  return { status: 'failed' };
};


export const authenticateWithGoogle = (token) => async (dispatch) => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/auth/google', { token });

    dispatch({ type: END_LOADING });

    if (res.data.success) {
      setAuthToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('isAuthenticated', 1);

      dispatch({ type: LOGIN_SUCCESS, payload: res.data });
      dispatch({ type: MSG_SUCCESS, payload: res.data.message });
      return { status: 'success', user: res.data.user };
    } else {
      dispatch({ type: LOGIN_FAIL });
      dispatch({ type: MSG_ERROR, payload: res.data.error });
    }
  } catch (err) {
    console.log('err', err);
    dispatch({ type: MSG_WARNING, payload: err });
  }
  return { status: 'failed' };
};

export const changeLink = (link) => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/bio', { link }); // Wrap newUsername in an object

    if (data.success) {
      // dispatch({ type: USER_LOADED, payload: data.user });
      dispatch({ type: MSG_SUCCESS, payload: 'Your bio has been updated successfully' });

      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return data;
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
  return { status: 'failed' };
};


export const setUserInfo = userInfo => dispatch => {
  dispatch({ type: USER_LOADED, payload: userInfo });
}