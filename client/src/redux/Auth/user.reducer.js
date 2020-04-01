import {
  SET_SOCKET,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  SET_URL
} from '../types';

const initialState = {
  socket: null,
  token: localStorage.getItem('token'),
  isAuthenticated: localStorage.getItem('isAuthenticated'),
  isAdmin: false,
  loading: true,
  user: {_id:null},
  balance: 0,
  userName: '',
  liveUrl: null
};

export default function(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SET_SOCKET:
      return {
        ...state, socket: payload
      };
    case USER_LOADED:
      return {
        ...state,
        isAdmin: 0,
        userName: payload.username,
        isAuthenticated: true,
        loading: false,
        user: payload,
        balance: payload.balance
      };
    case LOGIN_SUCCESS:
      localStorage.setItem('token', payload.token);
      localStorage.setItem('isAuthenticated', 1);
      return {
        ...state,
        ...payload,
        isAdmin: 0,
        userName: payload.user.username,
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
        userName: '',
        isAuthenticated: false,
        loading: false
      };
    case SET_URL:
      return {
        ...state,
        liveUrl: payload
      };
    default:
      return state;
  }
}
