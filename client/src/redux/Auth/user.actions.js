import {
  SET_SOCKET,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  MSG_ERROR,
  MSG_INFO,
  MSG_SUCCESS,
  MSG_WARNING,
  SET_UNREAD_MESSAGE_COUNT,
  SET_BALANCE,
  SET_URL,
  SET_AVATAR,
  TRANSACTION_LOADED,
  VERIFICATION_SUCCESS,
  OPEN_ALERT_MODAL,
  SET_USERNAME_PASSWORD
} from '../types';
import axios from '../../util/Api';
import setAuthToken from '../../util/setAuthToken';
import history from '../history';

// Load User
export const getUser = (is_reload) => async dispatch => {
  if (localStorage.token) {
    localStorage.removeItem('isAdminAuthenticated');
    setAuthToken(localStorage.token);
  }
  try {
    const res = await axios.get('/auth/user');
    if (res.data.success) {
      dispatch({ type: USER_LOADED, payload: res.data.user });
      dispatch({ type: SET_UNREAD_MESSAGE_COUNT, payload: res.data.unread_message_count });
      dispatch({ type: TRANSACTION_LOADED, payload: res.data.transactions });
      
      if (!is_reload) {
        dispatch({ type: MSG_INFO, payload: res.data.message });
      }
    } else {
      dispatch({ type: AUTH_ERROR });
    }
  } catch (err) {
    console.log(err);
    dispatch({ type: MSG_WARNING, payload: err });
  }
};

// Register User
export const userSignUp = ({
  userName,
  email,
  password,
  bio,
  avatar
}) => async dispatch => {
  const body = JSON.stringify({ username: userName, email, password, bio, avatar });
  try {
    const res = await axios.post('/user', body);
    if (res.data.success) {
      dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'tutorial', title: 'Get Started', message: 'Welcome...so you wanna make a bit of money? Click your Profile icon in the Top Right and click DEPOSIT.'} });
      dispatch({ type: SET_USERNAME_PASSWORD, payload: {email, password} });
      history.push('/signin');
      dispatch({ type: MSG_SUCCESS, payload: res.data.message });
    } else {
      dispatch({ type: REGISTER_FAIL });
      dispatch({ type: MSG_ERROR, payload: res.data.error });
    }
  } catch (err) {
    console.log('err***', err);
    dispatch({ type: MSG_WARNING, payload: err });
  }
};
// Login User
export const userSignIn = body => async dispatch => {
  try {
    const res = await axios.post('/auth', body);
    if (res.data.success) {
      setAuthToken(res.data.token);
      dispatch({ type: LOGIN_SUCCESS, payload: res.data });
      dispatch({ type: MSG_INFO, payload: res.data.message });
      dispatch(getUser());
    } else {
      dispatch({ type: LOGIN_FAIL });
      dispatch({ type: MSG_ERROR, payload: res.data.error });
    }
  } catch (err) {
    console.log('err', err);
    dispatch({ type: MSG_WARNING, payload: err });
  }
};

// Edit Profile
export const changePassword = new_password => async dispatch => {
  try {
    const { data } = await axios.post('/auth/changePassword', {new_password});
    if (data.success) {
      dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'RPS Bet', message: 'Password changed successfully. Please login again.'} });
      dispatch({ type: LOGOUT });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

// Edit Profile
export const changeAvatar = new_avatar => async dispatch => {
  try {
    const { data } = await axios.post('/auth/changeAvatar', {new_avatar});
    if (data.success) {
      dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'RPS Bet', message: 'Avatar changed successfully.'} });
      dispatch({ type: SET_AVATAR, payload: new_avatar });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

// Delete Account
export const deleteAccount = () => async dispatch => {
  try {
    const { data } = await axios.post('/auth/deleteAccount');
    if (data.success) {
      dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'RPS Bet', message: 'Your account has been deleted.'} });
      dispatch({ type: LOGOUT });
    } else {
      dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type: 'warning', title: 'Warning!', message: data.error} });
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
      history.push('/');
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const resendVerificationEmail = () => async dispatch => {
  try {
    const { data } = await axios.post('/auth/resend_verification_email');
    if (data.success) {
      dispatch({ type: MSG_INFO, payload: data.message });
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