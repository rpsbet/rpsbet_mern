import { alertModal } from '../modal/ConfirmAlerts';


export const validateIsAuthenticated = (isAuthenticated, isDarkMode) => {
    if (!isAuthenticated) {
      alertModal(isDarkMode, `FURR-SST LOG IN!`);
      return false;
    }
    return true;
  }
  
  export const validateCreatorId = (creator_id, user_id, isDarkMode) => {
    if (creator_id === user_id) {
      alertModal(
        isDarkMode,
        `YOU'VE CAT TO BE KITTEN ME! DIS YOUR OWN GAME!`
      );
      return false;
    }
    return true;
  }
  
  export const validateBankroll = (bet_amount, bankroll, isDarkMode) => {
    if (bet_amount > bankroll) {
      alertModal(
        isDarkMode,
        `BET NOT PAWS-SIBLE, NOT ENOUGH BANKROLL OR GAME HAS FINISHED`);
      return false;
    }
    return true;
  }
  

  export const validateBetAmount = (bet_amount, balance, isDarkMode) => {
    if (isNaN(bet_amount)) {
      alertModal(isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!');
      return false;
    }
  
    if (bet_amount <= 0) {
      alertModal(isDarkMode, `ENTER AN AMOUNT DUMBASS!`);
      return false;
    }

    if (bet_amount < 0.0005) {
      alertModal(isDarkMode, `MEOWNIMUM BET IS 0.0005 ETH`);
      return false;
    }
  
    if (bet_amount > balance) {
      alertModal(isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
      return false;
    }
  
    return true;
  }
  
  export const validateLocalStorageLength = (storageName, isDarkMode) => {
    const storedArray = JSON.parse(localStorage.getItem(storageName)) || [];
    if (storedArray.length < 3) {
      alertModal(isDarkMode, "PURR-HAPS IT WOULD BE WISE TO AT LEAST 3 RUNS FOR AI TRAINING DATA");
      return false;
    }
    return true;
  };
  