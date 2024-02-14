import api from '../../util/Api';
import {
  MSG_ERROR,
  MSG_WARNING,
  QUESTION_QUERY,
  PAGINATION_FOR_QUESTION,
  LOADING_QUESTION_TABLE,
  MSG_SUCCESS,
  SET_CURRENT_QUESTION_INFO,
  BRAIN_GAME_TYPE_QUERY,
} from '../types';

export const acPaginationQuestion = (pagination, page) => async (
  dispatch,
  getState
) => {
  let payload = {
    pagination,
    page
  };
  dispatch({ type: LOADING_QUESTION_TABLE, payload: true });
  dispatch({ type: PAGINATION_FOR_QUESTION, payload });
  let body = {};
  body.pagination = getState().questionReducer.pagination;
  body.page = getState().questionReducer.page;
  try {
    const { data } = await api.get('question', {
      params: body
    });
    if (data.success) {
      dispatch({ type: QUESTION_QUERY, payload: data });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
    dispatch({ type: LOADING_QUESTION_TABLE, payload: false });
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: LOADING_QUESTION_TABLE, payload: false });
  }
};

export const queryQuestion = (pagination, page, brain_game_type) => async (dispatch, getState) => {
  dispatch({ type: LOADING_QUESTION_TABLE, payload: true });
  
  // Update the payload to include brain_game_type
  let payload = {
    pagination,
    page,
    brain_game_type
  };  
  // Dispatch the updated payload
  dispatch({ type: PAGINATION_FOR_QUESTION, payload });
  
  // Prepare the request body
  let body = {
    pagination: getState().questionReducer.pagination,
    page: getState().questionReducer.page,
    brain_game_type: getState().questionReducer.brain_game_type // Include brain_game_type from Redux state
  };

  try {
    // Make the API call with the updated request body including brain_game_type
    const { data } = await api.get('question', { params: body });
  
    if (data.success) {
      dispatch({ type: QUESTION_QUERY, payload: data });
      dispatch({ type: LOADING_QUESTION_TABLE, payload: false });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
      dispatch({ type: LOADING_QUESTION_TABLE, payload: false });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: LOADING_QUESTION_TABLE, payload: false });
  }
};


export const createQuestion = body => async (dispatch) => {
  // delete body.buttonDisable;
  try {
    const { data } = await api.post('question', body);

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

export const getQuestion = (value) => async (dispatch, getState) => {
  const _id = value;
  try {
    if (_id === '') {
      dispatch({ type: SET_CURRENT_QUESTION_INFO, payload: {
        _id: '',
        question: '',
        image: '',
        answers: [],
        brain_game_type: 1
      }});
    } else {
      const { data } = await api.get('question/' + _id);
      if (data.success) {

        dispatch({ type: SET_CURRENT_QUESTION_INFO, payload: data.question });
      } else {
        dispatch({ type: MSG_ERROR, payload: data.message });
      }
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const updateQuestion = body => async dispatch => {
  try {
    delete body.buttonDisable;
    const { data } = await api.post('question', body);
    if (data.success) {
      dispatch({ type: MSG_SUCCESS, payload: 'Question saved.' });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const deleteQuestion = (_id,brain_game_type) => async dispatch => {
  let body = {};
  body._id = _id;
  body.brain_game_type = brain_game_type;
  try {
    const { data } = await api.post('question/delete', body);
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

export const getBrainGameType = () => async dispatch => {
  try {
    const { data } = await api.get('brain_game_type');
    if (data.success) {
      dispatch({ type: BRAIN_GAME_TYPE_QUERY, payload: data.brain_game_types });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const getBrainGameTypes = (userId) => async dispatch => {
  try {
    const { data } = await api.get('brain_game_type', {
      params: {
        user_id: userId
      }
    });
    if (data.success) {
      dispatch({ type: BRAIN_GAME_TYPE_QUERY, payload: data.brain_game_types });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};


export const addBrainGameType = game_type_name => async (dispatch) => {
  try {
    const { data } = await api.post('brain_game_type', {game_type_name});
    if (data.success) {
      dispatch({ type: BRAIN_GAME_TYPE_QUERY, payload: data.brain_game_types });
      dispatch({ type: MSG_SUCCESS, payload: data.message });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const removeBrainGameType = _id => async (dispatch) => {
  try {
    const { data } = await api.post('brain_game_type/delete', {_id: _id});
    if (data.success) {
      dispatch({ type: BRAIN_GAME_TYPE_QUERY, payload: data.brain_game_types });
      dispatch({ type: MSG_SUCCESS, payload: data.message });
    } else {
      dispatch({ type: MSG_ERROR, payload: data.message });
    }
  } catch (error) {
    console.log('error***', error);
    dispatch({ type: MSG_WARNING, payload: error });
  }
};

export const setCurrentQuestionInfo = info => dispatch => {
  dispatch({ type: SET_CURRENT_QUESTION_INFO, payload: info });
};
