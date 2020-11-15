import {
  MSG_CLOSE,
  MSG_ERROR,
  MSG_INFO,
  MSG_SUCCESS,
  MSG_WARNING,
  OPEN_ALERT_MODAL,
  CLOSE_ALERT_MODAL,
  OPEN_GAME_PASSWORD_MODAL,
  CLOSE_GAME_PASSWORD_MODAL
} from '../types';

export const closeMsgBar = () => dispatch => {
  dispatch({
    type: MSG_CLOSE
  });
};

export const errorMsgBar = text => dispatch => {
  dispatch({ type: MSG_ERROR, payload: text });
};

export const infoMsgBar = text => dispatch => {
  dispatch({ type: MSG_INFO, payload: text });
};
export const successMsgBar = text => dispatch => {
  dispatch({ type: MSG_SUCCESS, payload: text });
};

export const warningMsgBar = text => dispatch => {
  dispatch({ type: MSG_WARNING, payload: text });
};

export const openAlert = (alert_type, title, message) => dispatch => {
  dispatch({ type: OPEN_ALERT_MODAL, payload: {alert_type, title, message} });
};

export const closeAlert = () => dispatch => {
  dispatch({ type: CLOSE_ALERT_MODAL });
};

export const openGamePasswordModal = () => dispatch => {
  dispatch({ type: OPEN_GAME_PASSWORD_MODAL });
};

export const closeGamePasswordModal = () => dispatch => {
  dispatch({ type: CLOSE_GAME_PASSWORD_MODAL });
};