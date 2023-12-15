import {
  MSG_CLOSE,
  MSG_ERROR,
  MSG_INFO,
  MSG_SUCCESS,
  MSG_WARNING,
  CLOSE_ALERT_MODAL,
  OPEN_GAME_PASSWORD_MODAL,
  CLOSE_GAME_PASSWORD_MODAL,
  OPEN_CONFIRM_TRADE_MODAL,
  CLOSE_CONFIRM_TRADE_MODAL,
  OPEN_CONFIRM_LOAN_MODAL,
  CLOSE_CONFIRM_LOAN_MODAL,
  OPEN_LIST_ITEM_MODAL,
  CLOSE_LIST_ITEM_MODAL,
  OPEN_DELIST_ITEM_MODAL,
  CLOSE_DELIST_ITEM_MODAL,
  OPEN_LIST_LOAN_MODAL,
  CLOSE_LIST_LOAN_MODAL,
  OPEN_DELIST_LOAN_MODAL,
  CLOSE_DELIST_LOAN_MODAL,
  SET_PASSWORD_CORRECT
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

export const openGamePasswordModal = () => dispatch => { dispatch({ type: OPEN_GAME_PASSWORD_MODAL }); };
export const closeGamePasswordModal = () => dispatch => { dispatch({ type: CLOSE_GAME_PASSWORD_MODAL }); };
export const openConfirmLoanModal = () => dispatch => { dispatch({ type: OPEN_CONFIRM_LOAN_MODAL }); };
export const closeConfirmLoanModal = () => dispatch => { dispatch({ type: CLOSE_CONFIRM_LOAN_MODAL }); };
export const openConfirmTradeModal = () => dispatch => { dispatch({ type: OPEN_CONFIRM_TRADE_MODAL }); };
export const closeConfirmTradeModal = () => dispatch => { dispatch({ type: CLOSE_CONFIRM_TRADE_MODAL }); };
export const openListItemModal = () => dispatch => { dispatch({ type: OPEN_LIST_ITEM_MODAL }); };
export const closeListItemModal = () => dispatch => { dispatch({ type: CLOSE_LIST_ITEM_MODAL }); };
export const openDeListItemModal = () => dispatch => { dispatch({ type: OPEN_DELIST_ITEM_MODAL }); };
export const closeDeListItemModal = () => dispatch => { dispatch({ type: CLOSE_DELIST_ITEM_MODAL }); };
export const openDeListLoanModal = () => dispatch => { dispatch({ type: OPEN_DELIST_LOAN_MODAL }); };
export const closeDeListLoanModal = () => dispatch => { dispatch({ type: CLOSE_DELIST_LOAN_MODAL }); };
export const openListLoanModal = () => dispatch => { dispatch({ type: OPEN_LIST_LOAN_MODAL }); };
export const closeListLoanModal = () => dispatch => { dispatch({ type: CLOSE_LIST_LOAN_MODAL }); };

export const closeAlert = () => dispatch => { dispatch({ type: CLOSE_ALERT_MODAL }); };
export const setPasswordCorrect = (data) => dispatch => { dispatch({ type: SET_PASSWORD_CORRECT, payload: data }) };