import {
  SET_SOCKET,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  TNX_COMPLETE,
  TNX_INCOMPLETE,
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
  SET_SEVEN_DAY_PROFIT,
  SET_ONE_DAY_PROFIT,
  SET_ALL_TIME_PROFIT,
  VERIFICATION_SUCCESS,
  SET_USERNAME_PASSWORD,
  SET_DARK_MODE,
  SET_FOCUSED,
  TOGGLE_MUTE,
  TOGGLE_LOW_GRAPHICS,
  TOGGLE_DRAWER,
  TOGGLE_MUSIC_ENABLED,
  START_LOADING,
  END_LOADING,
  SET_REFERRAL_CODE

} from '../types';
import axios from '../../util/Api';
import setAuthToken from '../../util/setAuthToken';
import history from '../history';
// Load User
export const getUser = (is_reload, viewAll, loadMore, filterType, sortType, search) => async dispatch => {
  try {
    if (localStorage.token) {
      localStorage.removeItem('isAdminAuthenticated');
      setAuthToken(localStorage.token);
    }
    dispatch({ type: TNX_COMPLETE });
    const res = await axios.get(`/auth/user?viewAll=${viewAll}&loadMore=${loadMore}&filterType=${filterType}&sortBy=${sortType}&search=${search}`);

    if (res.data.success) {
      const { user, unread_message_count, transactions, sevenDayProfit, oneDayProfit, allTimeProfit, message } = res.data;
      dispatch({ type: USER_LOADED, payload: user });
      dispatch({ type: SET_UNREAD_MESSAGE_COUNT, payload: unread_message_count });
      dispatch({ type: TRANSACTION_LOADED, payload: transactions });
      if (sevenDayProfit !== undefined) {
        dispatch({ type: SET_SEVEN_DAY_PROFIT, payload: sevenDayProfit });
      }

      if (oneDayProfit !== undefined) {
        dispatch({ type: SET_ONE_DAY_PROFIT, payload: oneDayProfit });
      }

      if (allTimeProfit !== undefined) {
        dispatch({ type: SET_ALL_TIME_PROFIT, payload: allTimeProfit });
      }

      if (!is_reload && message) {
        dispatch({ type: MSG_INFO, payload: message });
      }

      dispatch({ type: TNX_INCOMPLETE });

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
export const changePasswordAndAvatar = (new_password, new_avatar)  => async dispatch => {
  try {
    const { data } = await axios.post('/auth/changePasswordAndAvatar', {new_password, new_avatar});
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
      dispatch({ type: MSG_INFO, payload: data.message });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const verifyEmail = verification_code => async dispatch => {
  try {
    const { data } = await axios.post('/auth/verify_email', {verification_code});
    if (data.success) {
      dispatch({ type: VERIFICATION_SUCCESS, payload: true });
      dispatch({ type: MSG_INFO, payload: 'Your account has been successfully verified.' });
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

export const resendVerificationEmail = () => async dispatch => {
  try {
    const { data } = await axios.post('/auth/resend_verification_email');
    if (data.success) {
      dispatch({ type: MSG_INFO, payload: data.message });
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

export const sendResetPasswordEmail = (email) => async dispatch => {
  try {
    const { data } = await axios.post('/auth/sendResetPasswordEmail', { email });
    if (data.success) {
      dispatch({ type: MSG_INFO, payload: 'Recover Password Email has been sent. Please check your mail box (including spam).'})
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error })
    }
  } catch (e) {
    console.log('error', e)
  }
}

export const resetPassword = (params) => async dispatch => {
  try {
    const { data } = await axios.post('/auth/resetPassword', params);
    if (data.success) {
      dispatch({ type: MSG_INFO, payload: 'Password has been changed.'})
      return true;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error })
    }
  } catch (e) {
    console.log('error', e)
  }
  return false;
}

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

export const toggleLowGraphics = isLowGraphics => dispatch => {
  dispatch({ type: TOGGLE_LOW_GRAPHICS, payload: isLowGraphics });
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


export const setUserInfo = userInfo => dispatch => {
  dispatch({ type: USER_LOADED, payload: userInfo });
}