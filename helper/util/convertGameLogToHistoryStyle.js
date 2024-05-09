const avatarUtils = require('./getRank');
const convertToCurrency = require('./conversion');

const convertGameLogToHistoryStyle = async gameLogList => {
    let result = [];
    gameLogList.forEach(gameLog => {
      try {
        
        let temp = {
            _id: gameLog._id,
            room_name:
            gameLog['game_type']['short_name'] +
            '-' +
            gameLog['room']['room_number'],
            history: '',
            //   gameBackground: gameLog['room']['gameBackground'],
            created_at: gameLog['created_at'],
            status: gameLog['room']['status']
        };

        const joined_user_avatar = `<img class='avatar' data-userid="${gameLog['joined_user']['_id']
    }" src='${gameLog['joined_user']['avatar']
}'  alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(
    gameLog['joined_user']['totalWagered']
    )}" />`;
  
        const maxHostsToShow = 3; // Maximum number of hosts to show before displaying "[number of others] others"
  
        let host_links = gameLog.hosts.slice(0, maxHostsToShow).map((host, index) => {
          const host_avatar = `<img class='avatar' data-userid="${host._id}" src="${host.avatar}" alt="" onerror="this.src='/img/profile-thumbnail.svg'" style="border: ${avatarUtils.getBorderByRank(host.totalWagered)}" />`;
          const host_link = `<a href="javascript:void(0)" class="user-link" accessory="${host.accessory}" rank="${host.totalWagered}" data-userid="${host._id}">${host_avatar}</a>`;
          return host_link;
        }).join('');
  
        if (gameLog.hosts.length > maxHostsToShow) {
          const numOthers = gameLog.hosts.length - maxHostsToShow;
          host_links += `<span>${numOthers} others</span>`;
        }
  
        // Wrap host links inside a container element
        const hostContainer = `<div class="host-container">${host_links}</div>`;
  
        const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']
          }" src='${gameLog['creator']['avatar']
          }'  alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(
            gameLog['creator']['totalWagered']
          )}" />`;
        const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;
  
        const joined_user_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['joined_user']['accessory']}' rank='${gameLog['joined_user']['totalWagered']}' data-userid="${gameLog['joined_user']['_id']}">${joined_user_avatar}</a>`;
        const betAmount = parseFloat(gameLog['room']['bet_amount']);
  
        const userBet = parseFloat(gameLog['room']['user_bet']);
        const multiplier =
          parseFloat(gameLog['room']['user_bet']) /
          parseFloat(gameLog['room']['bet_amount']);
  
        const multiplierDisplay = multiplier.toFixed(2);
        const color = multiplier < 1 ? '#ffdd15' : '#ff0a28'; // yellow : red
  
        let room_name = `<a style='color: #b9bbbe;' href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
  
        if (gameLog['room']['status'] === 'open') {
          room_name = `<a style='color: #b9bbbe;'  href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
        }

        // history logs
        if (gameLog['game_type']['game_type_name'] === 'RPS') {
          if (gameLog.game_result === 1) {
            temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
              gameLog['winnings']
            )} (${(gameLog['winnings'] / gameLog['bet_amount']).toFixed(2)}X)</span> (${convertToCurrency(
              gameLog['commission']
            )} RTB) in ${room_name}`;
          } else if (gameLog.game_result === 3) {
            temp.history = `${hostContainer} received a <span style='color: #ff0a28;'>${convertToCurrency(
              gameLog['user_bet'] - gameLog['room']['endgame_amount']
            )}</span> Auto-Payout in ${room_name}`;
          } else if (gameLog.game_result === -100) {
            temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
              userBet
            )} (${multiplierDisplay}x)</span> in ${room_name}`;
          } else if (gameLog.game_result === 0) {
            temp.history = `${joined_user_link} split <span style='color: #b9bbbe;'>${convertToCurrency(
              gameLog['bet_amount'] * 2
            )} (1.00X)</span> in ${room_name}`;
          } else {
            temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
              gameLog['bet_amount']
            )} (0.00X)</span> in ${room_name}`;
          }

        }
        //  else if (gameLog['game_type']['game_type_name'] === 'Blackjack') {
        //   if (gameLog.game_result === 1) {
        //     temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['bet_amount'] * 2
        //     )} (2.00X)</span> in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['user_bet'] - gameLog['room']['endgame_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
        //       userBet
        //     )} (${multiplierDisplay}x)</span> in ${room_name}`;
        //   } else if (gameLog.game_result === 0) {
        //     temp.history = `${joined_user_link} split <span style='color: #b9bbbe;'>${convertToCurrency(
        //       gameLog['bet_amount'] * 2
        //     )} (1.00X)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )} (0.00X)</span> in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Quick Shoot') {
        //   if (gameLog.game_result === 1) {
        //     const winnings =
        //       gameLog['bet_amount'] / (gameLog['room']['qs_game_type'] - 1) +
        //       gameLog['bet_amount'];
        //     const winningsDisplay = convertToCurrency(winnings);
        //     const multiplierDisplay = (winnings / gameLog['bet_amount']).toFixed(
        //       2
        //     );
  
        //     temp.history = `
        //       ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span>
        //       (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['user_bet'] - gameLog['room']['endgame_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
        //       userBet
        //     )} (${multiplierDisplay}x)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )} (0.00X)</span> in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Drop Game') {
        //   if (gameLog.game_result === 1) {
        //     const winnings = parseFloat(
        //       gameLog['bet_amount'] + gameLog['selected_drop']
        //     );
        //     const winningsDisplay = convertToCurrency(winnings);
        //     const multiplierDisplay = (
        //       (gameLog['bet_amount'] + gameLog['selected_drop']) /
        //       gameLog['bet_amount']
        //     ).toFixed(2);
  
        //     temp.history = `
        //       ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> 
        //       (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['bet_amount'] - gameLog['room']['endgame_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
        //       gameLog['room']['host_pr']
        //     )} (${multiplierDisplay}x)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )} (0.00X)</span> in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Bang!') {
        //   if (gameLog.game_result === 1) {
        //     const winnings = parseFloat(
        //       gameLog['cashoutAmount']
        //     );
        //     const winningsDisplay = convertToCurrency(winnings);
        //     const multiplierDisplay = (
        //       (gameLog['cashoutAmount']) /
        //       gameLog['bet_amount']
        //     ).toFixed(2);
        //     temp.history = `
        //       ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['bet_amount'] - gameLog['room']['endgame_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
        //       gameLog['room']['host_pr']
        //     )} (${multiplierDisplay}x)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )} (0.00X)</span> in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Roll') {
        //   if (gameLog.game_result === 1) {
        //     const winnings = parseFloat(
        //       gameLog['bet_amount'] * gameLog['multiplier']
        //     );
        //     const winningsDisplay = convertToCurrency(winnings);
        //     const multiplierDisplay = (
        //       (gameLog['bet_amount'] * gameLog['multiplier']) /
        //       gameLog['bet_amount']
        //     ).toFixed(2);
  
        //     temp.history = `
        //       ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['bet_amount'] - gameLog['room']['endgame_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
        //       gameLog['room']['host_pr']
        //     )} (${multiplierDisplay}x)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )} (0.00X)</span> in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Spleesh!') {
        //   if (gameLog.game_result === 1) {
        //     const winnings =
        //       (gameLog['host_pr'] + gameLog['bet_amount']);
        //     const winningsDisplay = convertToCurrency(winnings);
        //     const multiplierDisplay = (
        //       (parseFloat(gameLog['host_pr']) + gameLog['bet_amount']) /
        //       parseFloat(gameLog['bet_amount'])
        //     ).toFixed(2);
  
        //     temp.history = `${joined_user_link} won 
        //     <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> 
        //     (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     const userBet = parseFloat(gameLog['user_bet']);
        //     const roomBetAmount = gameLog['room']['bet_amount'];
        //     const unstakedDisplay = convertToCurrency(userBet);
        //     const multiplierDisplay = (
        //       (userBet) /
        //       roomBetAmount
        //     ).toFixed(2);
  
        //     const color = multiplierDisplay < 1 ? '#ffdd15' : '#ff0a28';
  
        //     temp.history = `${creator_link} unstaked 
        // <span style='color: ${color};'>${unstakedDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
        //       gameLog['bet_amount']
        //     )} (0.00X)</span> in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Mystery Box') {
        //   if (gameLog.game_result === 0) {
        //     const betAmount = parseFloat(gameLog['bet_amount']);
        //     const openingMessage = `${joined_user_link} opened a box <span style='color: #ffdd15;'>${convertToCurrency(
        //       betAmount
        //     )}</span>`;
        //     const resultMessage = `and didn't get <span style='color: #ffdd15;'>shit (0.00X)</span>`;
  
        //     temp.history = `${openingMessage} ${resultMessage} in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       gameLog['bet_amount'] - gameLog['room']['endgame_amount']
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     const roomPr = parseFloat(gameLog['room']['pr']);
        //     const roomUserBet = parseFloat(gameLog['room']['user_bet']);
        //     const roomBetAmount = parseFloat(gameLog['room']['bet_amount']);
  
        //     const unstakedAmount = roomPr + roomUserBet;
        //     const unstakedDisplay = convertToCurrency(unstakedAmount);
        //     const multiplierDisplay = (
        //       (roomPr + roomUserBet) /
        //       roomBetAmount
        //     ).toFixed(2);
  
        //     const color = multiplierDisplay < 1 ? '#ffdd15' : '#ff0a28';
  
        //     temp.history = `${creator_link} unstaked 
        // <span style='color: ${color};'>${unstakedDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        //   } else {
        //     const gameResult = parseFloat(gameLog['game_result']);
        //     const betAmount = parseFloat(gameLog['bet_amount']);
        //     const color =
        //       gameResult / gameLog['room']['bet_amount'] < 1
        //         ? '#ffdd15'
        //         : '#ff0a28';
        //     const winningsDisplay = convertToCurrency(gameResult);
        //     const multiplierDisplay = (gameResult / betAmount).toFixed(2);
  
        //     temp.history = `${joined_user_link} opened a box and won 
        //     <span style="color: ${color}">${winningsDisplay} (${multiplierDisplay}X)</span>
        //     (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        //   }
        // } else if (gameLog['game_type']['game_type_name'] === 'Brain Game') {
        //   const betAmount = parseFloat(gameLog['bet_amount']);
        //   const roomPr = parseFloat(gameLog['room']['pr']);
        //   const roomUserBet = parseFloat(gameLog['room']['user_bet']);
        //   const roomBetAmount = parseFloat(gameLog['room']['bet_amount']);
  
        //   if (gameLog.game_result === 0) {
        //     temp.history = `${joined_user_link}, scored ${gameLog['brain_game_score']
        //       } and split <span style='color: #b9bbbe;'>${convertToCurrency(
        //         betAmount * 2
        //       )}</span> in ${room_name}`;
        //   } else if (gameLog.game_result === 1) {
        //     const winnings = betAmount * 2;
        //     temp.history = `${joined_user_link} scored ${gameLog['brain_game_score']
        //       } and won <span style='color: #ff0a28;'>${convertToCurrency(
        //         winnings
        //       )} (2.00X)</span> (${convertToCurrency(
        //         gameLog['commission']
        //       )} RTB) in ${room_name}`;
        //   } else if (gameLog.game_result === 3) {
        //     temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
        //       betAmount
        //     )}</span> Auto-Payout in ${room_name}`;
        //   } else if (gameLog.game_result === -100) {
        //     const unstakedAmount = roomPr;
        //     const unstakedDisplay = convertToCurrency(unstakedAmount);
        //     const multiplierDisplay = (unstakedAmount / roomBetAmount).toFixed(2);
        //     const color = multiplierDisplay < 1 ? '#ffdd15' : '#ff0a28';
  
        //     temp.history = `${creator_link} unstaked 
        // <span style='color: ${color};'>${unstakedDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        //   } else {
        //     temp.history = `${joined_user_link} scored ${gameLog['brain_game_score']
        //       } and lost <span style='color: ##ffdd15;'>${convertToCurrency(
        //         betAmount
        //       )} (0.00X)</span> in ${room_name}`;
        //   }
        // }
        result.push(temp);
      } catch (e) {
        return;
      }
    });
    return result;
  };
  
  module.exports = {
    convertGameLogToHistoryStyle
  };
  