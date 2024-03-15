import axios from '../../util/Api';

import {
  MSG_ERROR,
  MSG_WARNING,
  MSG_SUCCESS,
  ADD_TO_QUEUE,
  GET_QUEUE,
  // UPDATE_PROGRESS

} from '../types';

export const getSettings = () => async (dispatch) => {
  try {
    const { data } = await axios.get('/settings', {});
    if (data.success) {
      return data.settings;
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
  }
};

export const saveSettings = settings => async dispatch => {
  try {
    const { data } = await axios.post('/settings', { settings });
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'System settings have been saved.' });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


export const addToQueue = (videoId, title, totalDuration) => async (dispatch) => {
  try {
    const response = await axios.post('/settings/add-to-queue', { videoId, title, totalDuration });

    // Check if the response status is in the range of 2xx
    if (response.status >= 200 && response.status < 300) {
      dispatch({ type: ADD_TO_QUEUE, payload: response.data });
    } else {
      console.error('Error adding to queue. Server responded with:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error adding to queue:', error);
    console.log('Error details:', error.response ? error.response.data : 'N/A');
  }
};


export const getQueue = () => async (dispatch) => {
  try {
    const response = await axios.get('/settings/get-queue');
    if (response.status >= 200 && response.status < 300) {
      dispatch({ type: GET_QUEUE, payload: response.data });
    } else {
      console.error('Error fetching queue. Server responded with:', response.status, response.statusText);

    }

  } catch (error) {
    console.log('error***', error);

  }
};
