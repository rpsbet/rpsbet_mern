import {
  GAMETYPE_LOADED,
  ROOMINFO_LOADED,
  ROOMS_LOADED,
  BET_SUCCESS,
  MSG_CREATE_ROOM_FAIL,
  MSG_CREATE_ROOM_SUCCESS,
  SET_GAME_MODE,
  SET_CUR_ROOM_INFO,
  SET_URL
} from '../types';
  
const initialState = {
  socket: null,
  game_mode: 'Classic RPS',
  // game_mode: 'Spleesh!',
  roomList: [],
  roomCount: 0,
  pageNumber: 1,
  gameTypeList: [
    { game_type_name: 'Classic RPS' },
    { game_type_name: 'Spleesh!' },
    { game_type_name: 'Brain Game' },
    { game_type_name: 'Mystery Box' },
  ],
  curRoomInfo: {
    _id: 0,
    game_type: '',
    bet_amount: 0,
    spleesh_bet_unit: 1,
    box_price: 0,
    game_log_list: [],
    box_list: []
  },
  betResult: -1
};
  
export default function(state = initialState, action) {
  const { type, payload } = action;
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
