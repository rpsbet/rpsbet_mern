import api from '../../util/Api';
import {
  MSG_ERROR,
  MSG_SUCCESS,
  MSG_WARNING,
  LOAN_QUERY,
  SET_USER_LOANS,
  LOAN_QUERY_ONE,
  MY_LOAN_QUERY,
  MY_LOAN_QUERY_ONE,
  LOADING_LOAN_TABLE,
  PAGINATION_FOR_LOAN,
  SET_CURRENT_LOAN_INFO,
  LOADING_PAYBACK_LOAN,
  SET_CURRENT_LOAN_ID,
  ADD_TOTAL,
  LOADING_REMAINING_LOANS, CALCULATE_REMAINING_LOANS,
  MY_ADD_TOTAL
} from '../types';

export const acQueryMyLoan = (pagination, page, sortCriteria, loanType) => async (
  dispatch,
  getState
) => {
  console.log(pagination, page, sortCriteria, loanType)
  dispatch({ type: MY_LOAN_QUERY, payload: [] });
  dispatch({ type: LOADING_LOAN_TABLE, payload: true });
  let payload = {
    pagination,
    page,
    sortCriteria,
    loanType,
  };
  dispatch({ type: PAGINATION_FOR_LOAN, payload });
  let body = {};
  body.pagination = getState().loanReducer.pagination;
  body.page = getState().loanReducer.page;
  try {
    const { data } = await api.get('/loan/my-loans', { params: payload });
    if (data.success) {
      dispatch({ type: MY_LOAN_QUERY, payload: data.loans });
      dispatch({ type: MY_ADD_TOTAL, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_LOAN_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


export const acQueryLoan = (pagination, page, sortCriteria, loanType) => async (
  dispatch
) => {
  dispatch({ type: LOAN_QUERY, payload: [] });
  dispatch({ type: LOADING_LOAN_TABLE, payload: true });
  let payload = {
    pagination,
    page,
    sortCriteria,
    loanType,
  };
  dispatch({ type: PAGINATION_FOR_LOAN, payload });
  try {
    const { data } = await api.get('loan', { params: payload });
    if (data.success) {
      dispatch({ type: LOAN_QUERY, payload: data.loans });
      dispatch({ type: ADD_TOTAL, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_LOAN_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};
// Define the action to calculate remaining loans
export const acCalculateRemainingLoans = () => async (dispatch, getState) => {
  dispatch({ type: LOADING_REMAINING_LOANS, payload: true });

  try {
    // Make a request to the backend route to calculate remaining loans
    const { data } = await api.get('/loan/calculate-remaining-loans');

    if (data.success) {
      dispatch({ type: CALCULATE_REMAINING_LOANS, payload: data.remainingLoans });
      dispatch({ type: SET_USER_LOANS, payload: data.userLoans });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }

    dispatch({ type: LOADING_REMAINING_LOANS, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

// Define the action to pay back a loan
export const paybackLoan = (loanId, paybackAmount) => async (dispatch) => {
  dispatch({ type: LOADING_PAYBACK_LOAN, payload: true });
  let body = {
    loanId,
    paybackAmount
  };
  try {
    // Make a request to the backend route to pay back the loan
    const { data } = await api.post('/loan/payback', body);
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }

    dispatch({ type: LOADING_PAYBACK_LOAN, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const createLoan = body => async (dispatch, getState) => {

  body.userId = getState().auth.user._id;
  try {
    const { data } = await api.post('loan/create', body);
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });
      return data;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const getLoan = () => async (dispatch, getState) => {
  const _id = getState().loanReducer._id;
  try {
    if (_id === '') {
      dispatch({
        type: LOAN_QUERY_ONE, payload: {
          _id: '',
          loan_amount: 0,
          apy: 0,
          loan_period: 0,
          loan_type: 'standard',
          startDateTime: new Date(),
          expireDateTime: new Date()
        }
      });
    } else {
      const { data } = await api.get('loan/' + _id);
      if (data.success) {
        dispatch({ type: LOAN_QUERY_ONE, payload: data.loan });
      } else {
        dispatch({ type: MSG_ERROR, payload: data.message });
      }
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const deleteLoan = _id => async dispatch => {
  let body = {};
  body._id = _id;
  try {
    const { data } = await api.post('loan/delete', body);
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: data.message });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const setCurrentLoanInfo = loaner => dispatch => {
  dispatch({ type: SET_CURRENT_LOAN_INFO, payload: loaner });
};

export const setCurrentLoanId = _id => dispatch => {
  dispatch({ type: SET_CURRENT_LOAN_ID, payload: _id });
};