// For rank-based avatar borders, etc.

/**
 * Converts an array of raw "gameLog" documents into a simpler structured format.
 * Numeric amounts are stored in their own fields, not embedded in HTML strings.
 */
async function convertGameLogToHistoryStyle(gameLogList) {
  const result = [];

  for (const gameLog of gameLogList) {
    // Filter out certain logs if needed
    if (gameLog.game_result === 3 && gameLog.hosts?.length === 0) {
      continue; // skip
    }

    // Build a structured object for front-end usage
    const temp = {
      _id: gameLog._id || null,
      game_result: gameLog.game_result,
      created_at: gameLog.created_at || null,
      ai_mode: gameLog.ai_mode || '',
      hosts: gameLog.hosts || [],
      commission: gameLog.commission ?? 0,
      endgame_amount: gameLog.endgame_amount ?? 0,
      host_pr: gameLog.host_pr ?? 0,
      // The numeric amounts needed on the front end
      bet_amount: gameLog.bet_amount ?? 0,
      winnings: gameLog.winnings ?? 0,
      user_bet: gameLog.user_bet ?? 0,

      // Mark an "action" for front-end interpretation
      // e.g. 'won', 'lost', 'rugged', etc.
      action: null,

      // Room references
      room: {
        _id: gameLog.room?._id || null,
        room_number: gameLog.room?.room_number || null,
        status: gameLog.room?.status || 'completed',
        created_at: gameLog.room?.created_at || null,
        image: gameLog.room?.image || '',
        ticker: gameLog.room?.ticker || '',
      },

      // Creator references
      creator: gameLog.creator
        ? {
          _id: gameLog.creator._id,
          avatar: gameLog.creator.avatar,
          totalWagered: gameLog.creator.totalWagered,
          accessory: gameLog.creator.accessory || '',
          elite: gameLog.creator.elite || '',
          username: gameLog.creator.username || '',

        }
        : null,

      // Joined user references
      joined_user: gameLog.joined_user
        ? {
          _id: gameLog.joined_user._id,
          avatar: gameLog.joined_user.avatar,
          totalWagered: gameLog.joined_user.totalWagered,
          accessory: gameLog.joined_user.accessory || '',
          elite: gameLog.joined_user.elite || '',
          username: gameLog.joined_user.username || '',
        }
        : null,
    };
    // Decide the "action" based on game_result + game type
    if (![3000, 333, 666, 444, 777].includes(parseInt(gameLog.game_result))) {
      // For "normal" game results (RPS or Quick Shoot)
      if (temp.game_result === 1) temp.action = 'won';
      else if (temp.game_result === 3) temp.action = 'receivedAutoPayout';
      else if (temp.game_result === -100) temp.action = 'rugged';
      else if (temp.game_result === -3000) temp.action = 'created';
      else if (temp.game_result === 0) temp.action = 'split';
      else temp.action = 'lost';
    } else {
      // Special logs
      switch (temp.game_result) {
        case 666:
          temp.action = 'jeet';
          break;
        case 444:
          temp.action = 'pumped';
          break;
        case 777:
          temp.action = 'withdrew';
          break;
        // 3000, 333, etc. can also have custom handling here if needed
        default:
          break;
      }
    }

    result.push(temp);
  }

  return result;
}

module.exports = {
  convertGameLogToHistoryStyle,
};
