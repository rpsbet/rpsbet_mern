import api from '../../util/Api';
import {
  MSG_ERROR,
  MSG_SUCCESS,
  MSG_WARNING,
  ITEM_QUERY,
  ITEM_QUERY_ONE,
  MY_ITEM_QUERY,
  MY_ITEM_QUERY_ONE,
  LOADING_ITEM_TABLE,
  PAGINATION_FOR_ITEM,
  SET_CURRENT_PRODUCT_INFO,
  SET_CURRENT_PRODUCT_ID,
  ADD_TOTAL,
  MY_ADD_TOTAL
} from '../types';

export const acQueryMyItem = (pagination, page, sortCriteria, itemType) => async (
  dispatch,
  getState
) => {
  dispatch({ type: MY_ITEM_QUERY, payload: [] });
  dispatch({ type: LOADING_ITEM_TABLE, payload: true });
  let payload = {
    pagination,
    page,
    sortCriteria,   
    itemType, 
  };
  dispatch({ type: PAGINATION_FOR_ITEM, payload });
  let body = {};
  body.pagination = getState().itemReducer.pagination;
  body.page = getState().itemReducer.page;
  try {
    const { data } = await api.get('/item/my-items', { params: payload });
    if (data.success) {
      dispatch({ type: MY_ITEM_QUERY, payload: data.items });
      dispatch({ type: MY_ADD_TOTAL, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_ITEM_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


export const acQueryItem = (pagination, page, sortCriteria, itemType) => async (
  dispatch
) => {
  dispatch({ type: ITEM_QUERY, payload: [] });
  dispatch({ type: LOADING_ITEM_TABLE, payload: true });
  let payload = {
    pagination,
    page,
    sortCriteria,   
    itemType, 
  };
  dispatch({ type: PAGINATION_FOR_ITEM, payload });
  try {
    const { data } = await api.get('item', { params: payload });

    if (data.success) {
      dispatch({ type: ITEM_QUERY, payload: data.items });
      dispatch({ type: ADD_TOTAL, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_ITEM_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


export const returnItem = data => async dispatch => {
  try {
    dispatch({ type: START_LOADING });
    const res = await axios.post('/item/return/', data);

    if (res.data.success) {
      dispatch({ type: MSG_SUCCESS, payload: "GREAAT SUCCESS!!" });

      return res.data;
    } else {
      return res.data;
    }
  } catch (err) {
  } finally {
    dispatch({ type: END_LOADING });
  }
  return false;
};


export const createItem = body => async (dispatch, getState) => {
  delete body.buttonDisable;

  if (body._id === '') {
    delete body._id;
  }

  body.userId = getState().auth.user._id;
  try {
    const { data } = await api.post('item/create', body);
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

export const getItem = () => async (dispatch, getState) => {
  const _id = getState().itemReducer._id;
  try {
    if (_id === '') {
      dispatch({ type: ITEM_QUERY_ONE, payload: {
        _id: '',
        productName: '',
        price: '',
        image: '',
        rentOption: '',
        item_type: '',
        CP: '',
        startDateTime: new Date(),
        expireDateTime: new Date()
      }});
    } else {
      const { data } = await api.get('item/' + _id);
      if (data.success) {
        dispatch({ type: ITEM_QUERY_ONE, payload: data.item });
      } else {
        dispatch({ type: MSG_ERROR, payload: data.message });
      }
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const deleteItem = _id => async dispatch => {
  let body = {};
  body._id = _id;
  try {
    const { data } = await api.post('item/delete', body);
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

export const setCurrentProductInfo = owner => dispatch => {
  dispatch({ type: SET_CURRENT_PRODUCT_INFO, payload: owner });
};

export const setCurrentProductId = _id => dispatch => {
  dispatch({ type: SET_CURRENT_PRODUCT_ID, payload: _id });
};