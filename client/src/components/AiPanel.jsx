import React from 'react';
import BetArray from './BetArray';

const AiPanel = ({ isDarkMode, game_type, betting, handleSwitchChange }) => {
  let list;

  switch (game_type) {
    case 'Quick Shoot':
      list = 'qs_array';
      break;
    case 'Bang!':
      list = 'bang_array';
      break;
    case 'Blackjack':
      list = 'bj_array';
      break;
    case 'Drop Game':
      list = 'drop_array';
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
      />
    </div>
  );
};

export default AiPanel;
