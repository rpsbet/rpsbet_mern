import api from '../../util/Api';
import history from '../history';

import {
  MSG_ERROR,
  MSG_WARNING,
  CUSTOMER_QUERY,
  PAGINATION_FOR_CUSTOMER,
  PAGINATION_FOR_ACTIVITY,
  LOADING_CUSTOMER_TABLE,
  START_LOADING,
  END_LOADING,
  ACTIVITY_QUERY,
  ROOM_STATISTICS_LOADED,
  LOAD_LEADERBOARDS,
  LOADING_EQUITY_CHART,
  LOAD_EQUITY_CHART,
  LOADING_LEADERBOARDS_TABLE
} from '../types';

export const acPaginationCustomer = (pagination, page, is_banned) => async (
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
  body.is_banned = is_banned;
  try {
    const { data } = await api.get('user', { params: body });
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

export const queryCustomer = (pagination, page, is_banned) => async (
  dispatch,
  getState
) => {
  dispatch({ type: LOADING_CUSTOMER_TABLE, payload: true });
  let payload = {
    pagination,
    page
  };
  dispatch({ type: PAGINATION_FOR_CUSTOMER, payload });
  let body = {};
  body.pagination = getState().customerReducer.pagination;
  body.page = getState().customerReducer.page;
  body.is_banned = is_banned;
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

export const queryActivity = (pagination, page) => async (
  dispatch,
  getState
) => {
  dispatch({ type: LOADING_CUSTOMER_TABLE, payload: true });
  let payload = {
    pagination,
    page
  };
  dispatch({ type: PAGINATION_FOR_CUSTOMER, payload });
  let body = {};
  body.pagination = getState().customerReducer.pagination;
  body.page = getState().customerReducer.activity_page;
  try {
    const { data } = await api.get('user/activity', { params: body });
    if (data.success) {
      dispatch({ type: ACTIVITY_QUERY, payload: data });
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

export const acPaginationActivity = (pagination, page) => async (
  dispatch,
  getState
) => {
  let payload = {
    pagination,
    page
  };
  dispatch({ type: LOADING_CUSTOMER_TABLE, payload: true });
  dispatch({ type: PAGINATION_FOR_ACTIVITY, payload });
  let body = {};
  body.pagination = getState().customerReducer.pagination;
  body.page = getState().customerReducer.activity_page;
  try {
    const { data } = await api.get('user/activity', {
      params: body
    });
    if (data.success) {
      dispatch({ type: ACTIVITY_QUERY, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: LOADING_CUSTOMER_TABLE, payload: false });
  }
};

export const fetchId = username => async dispatch => {
  try {
    const { data } = await api.post('user/getId', { username });
    if (data.success) {
      return data.user;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
      return null; // Return null if there's an error
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
    return null; // Return null if there's an error
  }
};
export const getSpendingHabit = _id => async dispatch => {
  try {
    const { data } = await api.post('/statistics/get-spending-habit', { _id }); // Changed to POST

    if (data.success) {
      return data; // Return the data directly if the request is successful
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
      return null; // Return null if the response indicates failure
    }
  } catch (error) {
    console.error('Error in getSpendingHabit:', error);
    dispatch({ type: MSG_WARNING, payload: error });
    return null; // Return null if there's an error
  }
};

export const acGetCustomerInfo = _id => async dispatch => {
  try {
    const { data } = await api.post('user/get-info', { _id });

    if (data.success) {
      return data.user;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};
// export const getPlatformPercentages = () => async dispatch => {
//   try {
//     const { data } = await api.get('/statistics/platform-percentages');

//     if (data.success) {
//       console.log("Platform Percentages:", data.data); // For Debugging
//       return data.data;  // Return the percentages
//     } else {
//       dispatch({ type: MSG_ERROR, payload: data.message });
//     }
//   } catch (error) {
//     console.log('Error fetching platform percentages:', error);
//     dispatch({ type: MSG_WARNING, payload: error.message || 'An error occurred' });
//   }
// };

export const fetchEquityDistribution = () => async (dispatch) => {
  console.log("Fetching equity distribution...");
  dispatch({ type: LOADING_EQUITY_CHART, payload: true });

  try {
    const { data } = await api.get('/statistics/get-equity-distribution');

    if (data.success) {
      dispatch({
        type: LOAD_EQUITY_CHART,
        payload: {
          equityChart: data.equityDistribution // Ensure the payload has equityChart property
        }
      });
      console.log("Data received:", data);
    }
    dispatch({ type: LOADING_EQUITY_CHART, payload: false });
  } catch (error) {
    console.error('Error fetching equity distribution:', error);
    dispatch({ type: LOADING_EQUITY_CHART, payload: false });
  }
};

export const fetchLeaderboardsData = () => async (dispatch) => {
  dispatch({ type: LOADING_LEADERBOARDS_TABLE, payload: true });

  try {
    const { data } = await api.get('statistics/get-leaderboards');
    if (data.success) {

      dispatch({ type: LOAD_LEADERBOARDS, payload: data });
      dispatch({ type: LOADING_LEADERBOARDS_TABLE, payload: false });

    } else {
      return (false)
      // dispatch({ payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    // dispatch({ payload: 'An error occurred while fetching leaderboards data' });
  }
};

export const getMarketingStat = () => async (dispatch) => {

  try {
    const { data } = await api.get('statistics/get-marketing-stat');
    console.log("data", data)
    if (data.success) {
      return data;
    } else {
      return (false)
      // dispatch({ payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    // dispatch({ payload: 'An error occurred while getting marketing strat' });
  }
};

export const getCustomerStatisticsData = (
  _id,
  actorType,
  gameType,
  timeType,
  limit
) => async dispatch => {
  try {
    // dispatch({ type: START_LOADING });
    const { data } = await api.get('statistics/get-customer-statistics', {
      params: {
        _id: _id,
        actorType: actorType,
        gameType: gameType,
        timeType: timeType,
        limit: limit
      }
    });
    // dispatch({ type: END_LOADING });
    if (data.success) {
      return data.statistics;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const getRoomStatisticsData = (room_id, limit) => async dispatch => {
  try {
    const { data } = await api.get('statistics/get-room-statistics', {
      params: { room_id, limit } // Include the limit parameter here
    });

    if (data.success) {
      // console.log(data)
      dispatch({ type: ROOM_STATISTICS_LOADED, payload: data });

    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


// Update Customer
export const updateCustomer = customer => async dispatch => {
  try {
    const { data } = await api.post('user/updateCustomer', customer);
    if (data.success) {
      history.push(`/admin/customers/`);
    } else {
      dispatch({ type: MSG_ERROR, payload: data.error });
    }
  } catch (error) {
    console.log('error', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


