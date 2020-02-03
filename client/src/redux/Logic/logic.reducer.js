import {
  GAMETYPE_LOADED,
  ROOMINFO_LOADED,
  ROOMS_LOADED,
  BET_SUCCESS,
  BET_FAIL,
  MSG_CREATE_ROOM_FAIL,
  MSG_CREATE_ROOM_SUCCESS,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL
} from '../types';
  
const initialState = {
  socket: null,
  game_mode: 'Classic RPS',
  roomList: [],
  roomCount: 0,
  pageNumber: 1,
  gameTypeList: [],
  curRoomInfo: {
    _id: 0,
    game_type: '',
    bet_amount: 0
  },
  betResult: 0
};
  
export default function(state = initialState, action) {
  const { type, payload } = action;
  console.log(type, payload);
  switch (type) {
    case BET_SUCCESS:
      return {
        ...state, betResult: payload.betResult
      };
    case SET_GAME_MODE:
      return {
        ...state, game_mode: payload
      };
    case SET_CUR_ROOM_INFO:
      return {
        ...state, curRoomInfo: payload
      }
    case GAMETYPE_LOADED:
      let firstGameType = '';
      if (payload.gameTypeList && payload.gameTypeList.length > 0) {
        firstGameType = payload.gameTypeList[0].game_type_name;
      }
      return {
        ...state, game_mode: firstGameType, ...payload
      };
    case ROOMINFO_LOADED:
      return {
        ...state, curRoomInfo: payload.roomInfo
      };
    case ROOMS_LOADED:
      return {
        ...state, ...payload
      };
    case MSG_CREATE_ROOM_SUCCESS:
      return {
        ...state,
      };
    case MSG_CREATE_ROOM_FAIL:
      return {
        ...state,
      };
    case SET_URL:
      return {
        ...state,
      };
    default:
      return state;
  }
}
