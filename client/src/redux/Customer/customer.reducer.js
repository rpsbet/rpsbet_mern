import {
  CUSTOMER_QUERY,
  PAGINATION_FOR_CUSTOMER,
  PAGINATION_FOR_ACTIVITY,
  LOADING_CUSTOMER_TABLE,
  ROOM_STATISTICS_LOADED,
  ADD_MAIN_INFO,
  ACTIVITY_QUERY,
  LOADING_LEADERBOARDS_TABLE,
  LOAD_LEADERBOARDS,
  LOADING_EQUITY_CHART,
  LOAD_EQUITY_CHART
} from '../types';

const initialState = {
  queryData: [],
  pagination: 10,
  page: 1,
  leaderboards: [],
  totalResults: 0,
  lastQuery: null,
  pages: 1,
  actionList: [],
  loading: false,
  roomStatsLoaded: false,
  locationInfo: null,
  activities: [],
  activity_pages: 1,
  activity_page: 1,
  totalActivities: 0,
  equityChart: [],
  loadingEquityChart: false,
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case CUSTOMER_QUERY:
      return {
        ...state,
        queryData: payload.users,
        totalResults: payload.total,
        pages: payload.pages
      };
    case LOADING_LEADERBOARDS_TABLE:
      return { ...state, loading: payload };
    case LOAD_LEADERBOARDS:
      return {
        ...state,
        leaderboards: payload.leaderboards
      };
      case LOADING_EQUITY_CHART:
        return { ...state, loadingEquityChart: payload };
      
      case LOAD_EQUITY_CHART:
        return {
          ...state,
          equityChart: payload.equityChart // Ensure payload.equityChart is used
        };
    case ACTIVITY_QUERY:
      return {
        ...state,
        activities: payload.activities,
        totalActivities: payload.total,
        activity_pages: payload.pages
      };
    case PAGINATION_FOR_CUSTOMER:
      return { ...state, pagination: payload.pagination, page: payload.page };
    case PAGINATION_FOR_ACTIVITY:
      return { ...state, pagination: payload.pagination, activity_page: payload.page };
    case LOADING_CUSTOMER_TABLE:
      return { ...state, loading: payload };
    case ROOM_STATISTICS_LOADED:
      return {
        ...state, actionList: payload,
        roomStatsLoaded: true
      };
    case ADD_MAIN_INFO:
      return { ...state, locationInfo: payload };
    default:
      return state;
  }
};

// a-202-210-40
