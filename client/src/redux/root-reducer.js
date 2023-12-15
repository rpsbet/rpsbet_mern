import { combineReducers } from 'redux';
import Auth from './Auth/user.reducer';
import snackbar from './Notification/notification.reducer';
import customerReducer from './Customer/customer.reducer';
import itemReducer from './Item/item.reducer';
import loanReducer from './Loan/loan.reducer';
import landingReducer from './Landing/landing.reducer';
// import AdminAuth from './AdminAuth/admin.reducer';
import Logic from './Logic/logic.reducer';
import questionReducer from './Question/question.reducer';
import settingReducer from './Setting/setting.reducer';

export default combineReducers({
  auth: Auth,
  // admin_auth: AdminAuth,
  snackbar,
  customerReducer,
  questionReducer,
  itemReducer,
  loanReducer,
  landingReducer,
  logic: Logic,
  setting: settingReducer,
});
