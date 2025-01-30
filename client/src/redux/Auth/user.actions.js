import {
  SET_SOCKET,
  REGISTER_FAIL,
  USER_LOADED,
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
  FETCH_RECENT_TRANSACTIONS_SUCCESS,
  SET_SEVEN_DAY_PROFIT,
  SET_ONE_DAY_PROFIT,
  SET_ALL_TIME_PROFIT,
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
  SET_REFERRAL_CODE
} from '../types';
import axios from '../../util/Api';
import setAuthToken from '../../util/setAuthToken';
import history from '../history';

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

export const showError = (message) => ({
  type: MSG_ERROR,
  payload: message
});

export const addBonus = () => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/add-bonus');
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Bonus has been added successfully.' });
      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    dispatch({ type: MSG_WARNING, payload: 'An error occurred while adding the bonus.' });
  }
  return false;
};

export const getProfitData = () => async dispatch => {
  try {
    const res = await axios.get('/auth/profit');
    if (res.data.success) {
      const { sevenDayProfit, oneDayProfit, allTimeProfit } = res.data;
      if (sevenDayProfit !== undefined) {
        dispatch({ type: SET_SEVEN_DAY_PROFIT, payload: sevenDayProfit });
      }

      if (oneDayProfit !== undefined) {
        dispatch({ type: SET_ONE_DAY_PROFIT, payload: oneDayProfit });
      }

      if (allTimeProfit !== undefined) {
        dispatch({ type: SET_ALL_TIME_PROFIT, payload: allTimeProfit });
      }

      return {
        status: 'success'
      };
    } else {
      dispatch({ type: AUTH_ERROR });
    }
  } catch (err) {
    console.error(err);
    return {
      status: 'failed'
    };
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
export const setReferralCode = (referralCode) => {
  return {
    type: SET_REFERRAL_CODE,
    payload: referralCode
  }
}

// Just like authenticateWithGoogle, but for Phantom
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

// Login User
export const userSignIn = body => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/auth', body);
    dispatch({ type: END_LOADING });

    if (res.data.success) {
      setAuthToken(res.data.token);
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
export const userSignOut = clear_token => async dispatch => {
  dispatch({ type: LOGOUT });
  try {
    const { data } = await axios.post('/auth/logout');
    if (data.success) {
      if (clear_token) setAuthToken();
      history.push('/');
      dispatch({ type: MSG_SUCCESS, payload: data.message });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
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

// Tutorial Passed
export const updateTutorialCompleted = (tutorialNumber) => async (dispatch) => {
  try {
    const { data } = await axios.patch('/user/tutorial', { tutorialNumber });

    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: `Completed Tutorial ${tutorialNumber} / 3!` });
      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return data;
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error.message });
  }
  return { status: 'failed' };
};


export const vaultDeposit = (amount) => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/deposit', { amount });

    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Successfully added funds to your vault.' });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    dispatch({ type: MSG_WARNING, payload: error.message });
    return { status: 'failed' };
  }
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

export const vaultWithdraw = (amount) => async (dispatch) => {
  try {
    const { data } = await axios.post('/user/withdraw', { amount });

    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Successfully withdrew funds from your vault.' });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    dispatch({ type: MSG_WARNING, payload: error.message });
    return { status: 'failed' };
  }
};

export const fetchVaultBalance = () => async (dispatch) => {
  try {
    const { data } = await axios.get('/user/vault');

    if (data.success) {
      return data.vaultBalance;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    dispatch({ type: MSG_WARNING, payload: error.message });
    return null;
  }
};

export const fetchRecentVaultTransactions = () => async (dispatch) => {
  try {
    const { data } = await axios.get('/user/vault-transactions');

    if (data.success) {
      dispatch({
        type: FETCH_RECENT_TRANSACTIONS_SUCCESS,
        payload: data.transactions
      });
      return data.transactions;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    dispatch({ type: MSG_WARNING, payload: error.message });
    return null;
  }
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