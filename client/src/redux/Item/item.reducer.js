import {
  ITEM_QUERY_ONE,
  ITEM_QUERY,
  MY_ITEM_QUERY_ONE,
  MY_ITEM_QUERY,
  PAGINATION_FOR_ITEM,
  LOADING_ITEM_TABLE,
  SET_CURRENT_PRODUCT_INFO,
  SET_CURRENT_PRODUCT_ID,
  ADD_TOTAL,
  MY_ADD_TOTAL
} from '../types';

const initialState = {
  _id: '',
  productName: '',
  owner: '',
  price: '',
  itemType: '',
  image: '',
  startDateTime: new Date(),
  expireDateTime: new Date(),
  itemArray: [],
  myItemArray: [],
  pagination: 25,
  page: 1,
  totalResults: 0,
  pages: 1,
  loading: false
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case ITEM_QUERY_ONE:
    case MY_ITEM_QUERY_ONE:
    case SET_CURRENT_PRODUCT_INFO:
      return { ...state, owner: payload.owner};
    case ITEM_QUERY:
      return { ...state, itemArray: payload };
    case MY_ITEM_QUERY:
      return { ...state, myItemArray: payload };

    case ADD_TOTAL:
      return { ...state, totalResults: payload.total, pages: payload.pages };
    case MY_ADD_TOTAL:
      return { ...state, totalResults: payload.total, pages: payload.pages };
    case PAGINATION_FOR_ITEM:
      return {
        ...state,
        pagination: payload.pagination,
        page: payload.page
      };
    case LOADING_ITEM_TABLE:
      return { ...state, loading: payload };
    case SET_CURRENT_PRODUCT_ID:
      return { ...state, _id: payload };
    default:
      return state;
  }
};
