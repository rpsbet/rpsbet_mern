import React from 'react';
import BetArray from './BetArray';


const AiPanel = ({ isDarkMode, rank, is_betting,rpsbetitems, predictedBetAmount, roomId, ai_mode, user_balance, user_id, updateUserStrategy, strategies, game_type, brain_game_type, spleesh_bet_unit, qs_game_type, betting, handleSwitchChange }) => {

  // switch (game_type) {
  //   case 'Quick Shoot':
  //     list = `qs_array_${qs_game_type}`;
  //     break;
  //   case 'Bang!':
  //     list = 'bang_array';
  //     break;
  //   case 'Brain Game':
  //     list = `score_array_${brain_game_type}`;
  //     break;
  //   case 'Blackjack':
  //     list = 'bj_array';
  //     break;
  //   case 'Drop Game':
  //     list = 'drop_array';
  //     break;
  //   case 'Spleesh!':
  //     if (spleesh_bet_unit === 0.01) {
  //       list = 'spleesh_array';
  //     } else if (spleesh_bet_unit === 0.1) {
  //       list = 'spleesh_10_array';
  //     } else {
  //       list = 'spleesh_001_array';

  //     }
  //     break;
  //   case 'Mystery Box':
  //     list = 'bet_array';
  //     break;
  //   default:
  //     list = `rps_array`;
  // }

  return (
    <div className="ai-container">
      <BetArray
        isDarkMode={isDarkMode}
        arrayName={rpsbetitems}
        user_id={user_id}
        is_betting={is_betting}
        strategies={strategies}
        ai_mode={ai_mode}
        rank={rank}
        betting={betting}
        predictedBetAmount={predictedBetAmount}
        room_id={roomId}
        updateUserStrategy={updateUserStrategy}
        user_balance={user_balance}
        handleSwitchChange={handleSwitchChange}
        game_type={game_type}
      />
    </div>
  );
};

export default AiPanel;
