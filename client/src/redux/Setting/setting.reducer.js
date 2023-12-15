import {
  ADD_TO_QUEUE,
  GET_QUEUE,
  UPDATE_PROGRESS
} from '../types';
  
const initialState = {
  queue: [],

};
  
export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
      case ADD_TO_QUEUE:
      return {
        ...state,
        queue: [...state.queue, payload],
      };

    case GET_QUEUE:
      return {
        ...state,
        queue: payload,
      };

      case UPDATE_PROGRESS:
        return {
          ...state,
          queue: state.queue.map((video) =>
            video._id === payload._id ? { ...video, progress: payload.progress } : video
          ),
        };

      default:
        return state;
    }
};


  