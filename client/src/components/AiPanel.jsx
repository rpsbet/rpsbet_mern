import React from 'react';
import BetArray from './BetArray';

const AiPanel = ({ isDarkMode, game_type, brain_game_type, spleesh_bet_unit, qs_game_type, betting, handleSwitchChange }) => {
  let list;

  switch (game_type) {
    case 'Quick Shoot':
      list = `qs_array_${qs_game_type}`;
      break;
    case 'Bang!':
      list = 'bang_array';
      break;
    case 'Brain Game':
      list = `score_array_${brain_game_type}`;
      break;
    case 'Blackjack':
      list = 'bj_array';
      break;
    case 'Drop Game':
      list = 'drop_array';
      break;
    case 'Spleesh!':
      if (spleesh_bet_unit === 0.01) {
        list = 'spleesh_array';
      } else if (spleesh_bet_unit === 0.1) {
        list = 'spleesh_10_array';
      } else {
        list = 'spleesh_001_array';

      }
      break;
    case 'Mystery Box':
      list = 'bet_array';
      break;
    default:
      list = `rps_array`;
  }

  return (
    <div className="ai-container">
      <BetArray
        isDarkMode={isDarkMode}
        arrayName={list}
        betting={betting}
        handleSwitchChange={handleSwitchChange}
        game_type={game_type}
      />
    </div>
  );
};

export default AiPanel;
