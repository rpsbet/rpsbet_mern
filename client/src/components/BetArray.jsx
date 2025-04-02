import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import BetAmountInput from '../components/BetAmountInput.jsx';
import { getRank } from '../util/getRank.js';

const BetArray = ({
  bankroll,
  handle2xButtonClick,
  handleMaxButtonClick,
  handleHalfXButtonClick,
  onChangeState,
  isDarkMode,
  playSound,
  bet_amount,
  user_id: propUserId,
  is_betting,
  strategies,
  ai_mode,
  qs_game_type,
  rank: propRank,
  betting,
  predictedBetAmount,
  creator_id,
  room_id,
  updateUserStrategy,
  updateUserPrompt,
  user_balance: propUserBalance,
  handleSwitchChange,
  game_type
}) => {

  // Access Redux state with useSelector
  const user_balance  = useSelector(state => state.auth.user.balance) || propUserBalance;
  const user_id       = useSelector(state => state.auth.user._id) || propUserId;
  const user_range    = useSelector(state => state.auth.user.range);
  const totalWagered  = useSelector(state => state.auth.user.totalWagered);

  // Local component states
  const [range, setRange] = useState([1, 100]);
  const [rank, setRank] = useState(propRank || null);

  // Refs for mounted state
  const isMounted = useRef(true);

  // Update rank on mount if not provided
  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        if (totalWagered && !propRank) {
          const computedRank = await getRank(totalWagered);
          setRank(computedRank);
        }
      } catch (err) {
        console.error('Error during mount:', err);
      }
    })();

    return () => {
      isMounted.current = false;
    };
  }, [totalWagered, propRank]);

  // Update range if user_range changes
  useEffect(() => {
    if (user_range && user_range.length === 2) {
      const [min, max] = user_range;
      setRange([min, max]);
    }
  }, [user_range]);

  return (
    <Box sx={{ position: 'relative', width: '100%', mt: 4 }}>
      <BetAmountInput 
        bankroll={bankroll}
        handle2xButtonClick={handle2xButtonClick}
        handleMaxButtonClick={handleMaxButtonClick}
        handleHalfXButtonClick={handleHalfXButtonClick}
        onChangeState={onChangeState}
        isDarkMode={isDarkMode}
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
        room_id={room_id}
        updateUserStrategy={updateUserStrategy}
        updateUserPrompt={updateUserPrompt}
        user_balance={user_balance}
        handleSwitchChange={handleSwitchChange}
        game_type={game_type}
      />
    </Box>
  );
};

export default BetArray;