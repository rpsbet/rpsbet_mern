import React from 'react';
import BetArray from './BetArray';

const AiPanel = ({ isDarkMode, playSound, bankroll, bet_amount, handle2xButtonClick, handleHalfXButtonClick, handleMaxButtonClick, creator_id, rank, is_betting, rpsbetitems, qsbetitems, predictedBetAmount, roomId, ai_mode, user_balance, user_id, updateUserStrategy, updateUserPrompt, strategies, game_type, onChangeState, qs_game_type, betting, handleSwitchChange }) => {
  let list;
  switch (game_type) {
    case 'Quick Shoot':
      list = qsbetitems;
      break;
    default:
      list = rpsbetitems;
  }

  return (
    <div className="ai-container">
      <BetArray
        bankroll={bankroll}
        handle2xButtonClick={handle2xButtonClick}
        handleMaxButtonClick={handleMaxButtonClick}
        handleHalfXButtonClick={handleHalfXButtonClick}
        onChangeState={onChangeState}
        isDarkMode={isDarkMode}
        arrayName={list}
        playSound={playSound}
        bet_amount={bet_amount}
        user_id={user_id}
        is_betting={is_betting}
        strategies={strategies}
        ai_mode={ai_mode}
        qs_game_type={qs_game_type}
        rank={rank}
        betting={betting}
        predictedBetAmount={predictedBetAmount}
        creator_id={creator_id}
        room_id={roomId}
        updateUserStrategy={updateUserStrategy}
        updateUserPrompt={updateUserPrompt}
        user_balance={user_balance}
        handleSwitchChange={handleSwitchChange}
        game_type={game_type}
      />
    </div>
  );
};

export default AiPanel;
