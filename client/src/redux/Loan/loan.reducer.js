import {
  LOAN_QUERY_ONE,
  LOAN_QUERY,
  MY_LOAN_QUERY_ONE,
  MY_LOAN_QUERY,
  PAGINATION_FOR_LOAN,
  LOADING_LOAN_TABLE,
  SET_CURRENT_LOAN_INFO,
  SET_CURRENT_LOAN_ID,
  ADD_TOTAL,
  MY_ADD_TOTAL
} from '../types';

const initialState = {
  _id: '',
  loan_amount: 0,
  lender: '',
  apy: 0,
  loan_period: 0,
  loanType: '',
  startDateTime: new Date(),
  expireDateTime: new Date(),
  loanArray: [],
  myLoanArray: [],
  pagination: 25,
  page: 1,
  totalResults: 0,
  pages: 1,
  loading: false,
  data: {
    price: 0,
    loan_amount: ''
  }
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case LOAN_QUERY_ONE:
    case MY_LOAN_QUERY_ONE:
    case SET_CURRENT_LOAN_INFO:
      return { ...state, data: payload};
    case LOAN_QUERY:
      return { ...state, loanArray: payload };
    case MY_LOAN_QUERY:
      return { ...state, myLoanArray: payload };

    case ADD_TOTAL:
      return { ...state, totalResults: payload.total, pages: payload.pages };
    case MY_ADD_TOTAL:
      return { ...state, totalResults: payload.total, pages: payload.pages };
    case PAGINATION_FOR_LOAN:
      return {
        ...state,
        pagination: payload.pagination,
        page: payload.page
      };
    case LOADING_LOAN_TABLE:
      return { ...state, loading: payload };
    case SET_CURRENT_LOAN_ID:
      return { ...state, _id: payload };
    default:
      return state;
  }
};
