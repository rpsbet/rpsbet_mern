import {
  MSG_CLOSE,
  MSG_ERROR,
  MSG_INFO,
  MSG_SUCCESS,
  MSG_WARNING,
  OPEN_ALERT_MODAL,
  CLOSE_ALERT_MODAL
} from '../types';

const initialState = {
  openSk: false,
  message: '',
  status: null,
  showAlert: false,
  title: '',
  alertMessage: '',
  alertType: ''
};

export default function(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case MSG_CLOSE:
      return {
        ...state,
        openSk: false
      };
    case MSG_ERROR:
      return {
        ...state,
        openSk: true,
        message: payload,
        status: MSG_ERROR
      };
    case MSG_INFO:
      return {
        ...state,
        openSk: true,
        message: payload,
        status: MSG_INFO
      };
    case MSG_SUCCESS:
      return {
        ...state,
        openSk: true,
        message: payload,
        status: MSG_SUCCESS
      };
    case MSG_WARNING:
      return {
        ...state,
        openSk: true,
        message: payload,
        status: MSG_WARNING
      };
    case OPEN_ALERT_MODAL:
      return {
        ...state,
        showAlert: true,
        alertMessage: payload.message,
        alertType: payload.alert_type,
        title: payload.title,
      }
    case CLOSE_ALERT_MODAL:
      return {
        ...state,
        showAlert: false,
        alertMessage: '',
        alertType: '',
        title: '',
      }
    default:
      return state;
  }
}
