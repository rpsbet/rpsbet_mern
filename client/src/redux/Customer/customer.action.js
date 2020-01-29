import api from '../../util/Api';
import {
  MSG_ERROR,
  MSG_WARNING,
  CUSTOMER_QUERY,
  PAGINATION_FOR_CUSTOMER,
  LOADING_CUSTOMER_TABLE,
  ADD_MAIN_INFO
} from '../types';

export const acPaginationCustomer = (pagination, page) => async (
  dispatch,
  getState
) => {
  let payload = {
    pagination,
    page
  };
  dispatch({ type: LOADING_CUSTOMER_TABLE, payload: true });
  dispatch({ type: PAGINATION_FOR_CUSTOMER, payload });
  let body = {};
  body.pagination = getState().customerReducer.pagination;
  body.page = getState().customerReducer.page;
  try {
    const { data } = await api.get('user', {
      params: body
    });
    if (data.success) {
      dispatch({ type: CUSTOMER_QUERY, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
  }
};

export const queryCustomer = (pagination, page) => async (dispatch, getState) => {
  dispatch({ type: LOADING_CUSTOMER_TABLE, payload: true });
  let payload = {
    pagination,
    page
  };
  dispatch({ type: PAGINATION_FOR_CUSTOMER, payload });
  let body = {};
  body.pagination = getState().customerReducer.pagination;
  body.page = getState().customerReducer.page;
  try {
    const { data } = await api.get('user', { params: body });
    if (data.success) {
      dispatch({ type: CUSTOMER_QUERY, payload: data });
      dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
      dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
  }
};

export const acGetCustomerInfo = body => async dispatch => {
  try {
    const { data } = await api.post('user/get-info', body);
    if (data.success) {
      dispatch({ type: ADD_MAIN_INFO, payload: data.user });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};
