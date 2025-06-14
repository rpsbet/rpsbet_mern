import {
  MSG_CLOSE,
  MSG_ERROR,
  MSG_INFO,
  MSG_SUCCESS,
  MSG_WARNING,
  CLOSE_ALERT_MODAL,
  OPEN_GAME_PASSWORD_MODAL,
  CLOSE_GAME_PASSWORD_MODAL,
  OPEN_CONFIRM_LOAN_MODAL,
  CLOSE_CONFIRM_LOAN_MODAL,
  OPEN_OFFER_LOAN_MODAL,
  CLOSE_OFFER_LOAN_MODAL,
  OPEN_LIST_LOAN_MODAL,
  CLOSE_LIST_LOAN_MODAL,
  OPEN_DELIST_LOAN_MODAL,
  CLOSE_DELIST_LOAN_MODAL,
  SET_PASSWORD_CORRECT
} from '../types';

const initialState = {
  openSk: false,
  message: '',
  status: null,
  showAlert: false,
  showGamePasswordModal: false,
  showConfirmTradeModal: false,
  title: '',
  alertMessage: '',
  alertType: '',
  roomStatus: '',
  isPasswordCorrect: false
};

export default function (state = initialState, action) {
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
    case CLOSE_ALERT_MODAL:
      return {
        ...state,
        showAlert: false,
        alertMessage: '',
        alertType: '',
        title: ''
      };
    case SET_PASSWORD_CORRECT:
      return {
        ...state,
        isPasswordCorrect: payload
      };
    case OPEN_GAME_PASSWORD_MODAL:
      return {
        ...state,
        showGamePasswordModal: true,
        isPasswordCorrect: false
      };
    case CLOSE_GAME_PASSWORD_MODAL:
      return {
        ...state,
        showGamePasswordModal: false
      };

    case OPEN_CONFIRM_LOAN_MODAL:
      return {
        ...state,
        showConfirmLoanModal: true
      };
    case CLOSE_CONFIRM_LOAN_MODAL:
      return {
        ...state,
        showConfirmLoanModal: false
      };
    case OPEN_OFFER_LOAN_MODAL:
      return {
        ...state,
        showOfferLoanModal: true
      };
    case CLOSE_OFFER_LOAN_MODAL:
      return {
        ...state,
        showOfferLoanModal: false
      };
    case OPEN_LIST_LOAN_MODAL:
      return {
        ...state,
        showListLoanModal: true
      };
    case CLOSE_LIST_LOAN_MODAL:
      return {
        ...state,
        showListLoanModal: false
      };
    case OPEN_DELIST_LOAN_MODAL:
      return {
        ...state,
        showDeListLoanModal: true
      };
    case CLOSE_DELIST_LOAN_MODAL:
      return {
        ...state,
        showDeListLoanModal: false
      };
    default:
      return state;
  }
}
