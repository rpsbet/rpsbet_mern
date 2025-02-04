import { errorMsgBar } from '../../redux/Notification/notification.actions';

export const validateIsAuthenticated = (isAuthenticated, dispatch) => {
  if (!isAuthenticated) {
    dispatch(errorMsgBar(`FURR-SST LOG IN!`));
    return false;
  }
  return true;
};

export const validateCreatorId = (creator_id, user_id, dispatch) => {
  if (creator_id === user_id) {
    dispatch(errorMsgBar(`YOU'VE CAT TO BE KITTEN ME! DIS YOUR OWN GAME!`));
    return false;
  }
  return true;
};

export const validateBankroll = (bet_amount, bankroll, dispatch) => {
  if (bet_amount > bankroll) {
    dispatch(errorMsgBar(`BET NOT PAWS-SIBLE, NOT ENOUGH BANKROLL OR GAME HAS FINISHED`));
    return false;
  }
  return true;
};

export const validateBetAmount = (bet_amount, balance, dispatch) => {
  if (isNaN(bet_amount)) {
    dispatch(errorMsgBar('IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'));
    return false;
  }
  
  if (bet_amount <= 0) {
    dispatch(errorMsgBar(`ENTER AN AMOUNT DUMBASS!`));
    return false;
  }
  
  if (bet_amount < 0.0001) {
    dispatch(errorMsgBar(`MEOWNIMUM BET IS 0.0001 SOL`));
    return false;
  }
  
  if (bet_amount > balance) {
    dispatch(errorMsgBar(`NOT ENUFF FUNDS AT THIS MEOWMENT`));
    return false;
  }
  
  return true;
};

export const validateLocalStorageLength = (storageName, dispatch) => {
  if (storageName.length < 3) {
    dispatch(
      errorMsgBar("PURR-HAPS YOU SHOULD BET MANUALLY FOR AT LEAST 3 TURNS TO TRAIN THE AI PLAY")
    );
    return false;
  }
  return true;
};