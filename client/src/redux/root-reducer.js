import { combineReducers } from 'redux';
import Auth from './Auth/user.reducer';
import snackbar from './Notification/notification.reducer';
import customerReducer from './Customer/customer.reducer';
import loanReducer from './Loan/loan.reducer';
import Logic from './Logic/logic.reducer';
import settingReducer from './Setting/setting.reducer';

export default combineReducers({
  auth: Auth,
  snackbar,
  customerReducer,
  loanReducer,
  logic: Logic,
  setting: settingReducer,
});
