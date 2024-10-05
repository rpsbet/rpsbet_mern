const avatarUtils = require('./getRank');
const convertToCurrency = require('./conversion');

const convertGameLogToHistoryStyle = async gameLogList => {

  let result = [];
  gameLogList.forEach(gameLog => {
    if (gameLog.game_result === 3 && gameLog.hosts && gameLog.hosts.length === 0) {
      return;
    }

    let room_name;
    if (gameLog.game_result === 3000 || gameLog.game_result === 333 || gameLog.game_result === 666) {
      room_name = `<a style='color: #b9bbbe;' href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
    } else {
      room_name = gameLog['room'] ?
        gameLog['game_type']['short_name'] + '-' + gameLog['room']['room_number'] :
        'Withdrawal';
    }
    try {
      let temp = {
        _id: gameLog._id,
        room_name: room_name,
        history: '',
        creator: gameLog['creator']['_id'],
        joined_user: gameLog['joined_user'] ? gameLog['joined_user']['_id'] : null,
        created_at: gameLog['created_at'],
        ai_mode: gameLog.ai_mode ? gameLog.ai_mode : '',
        hosts: gameLog.hosts ? gameLog.hosts : '',
        qbot: gameLog.qbot ? gameLog.qbot : '',
        status: gameLog['room'] ? gameLog['room']['status'] : 'completed'
      };
      if (gameLog.game_result !== 3000 && gameLog.game_result !== 333 && gameLog.game_result !== 666 && gameLog.game_result !== 777) {

        const joined_user_avatar = `<img class='avatar' data-userid="${gameLog['joined_user']['_id']}" src='${gameLog['joined_user']['avatar']}'  alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(gameLog['joined_user']['totalWagered'])}" />`;
        const maxHostsToShow = 3;

        let host_links = gameLog.hosts.slice(0, maxHostsToShow).map((host, index) => {
          const host_avatar = `<img class='avatar' data-userid="${host._id}" src="${host.avatar}" alt="" onerror="this.src='/img/profile-thumbnail.svg'" style="border: ${avatarUtils.getBorderByRank(host.totalWagered)}" />`;
          const host_link = `<a href="javascript:void(0)" class="user-link" accessory="${host.accessory}" rank="${host.totalWagered}" data-userid="${host._id}">${host_avatar}</a>`;
          return host_link;
        }).join('');

        if (gameLog.hosts.length > maxHostsToShow) {
          const numOthers = gameLog.hosts.length - maxHostsToShow;
          host_links += `<span>${numOthers} others</span>`;
        }

        const hostContainer = `<div class="host-container">${host_links}</div>`;
        const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']}" src='${gameLog['creator']['avatar']}'  alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(gameLog['creator']['totalWagered'])}" />`;
        const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;
        const joined_user_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['joined_user']['accessory']}' rank='${gameLog['joined_user']['totalWagered']}' data-userid="${gameLog['joined_user']['_id']}">${joined_user_avatar}</a>`;

        const betAmount = gameLog['bet_amount'];
        const userBet = parseFloat(gameLog['room']['user_bet']);
        const multiplier = parseFloat(gameLog['room']['user_bet']) / parseFloat(gameLog['room']['bet_amount']);
        const multiplierDisplay = multiplier.toFixed(2);
        const color = multiplier < 1 ? '#ff6701' : '#ff0a28'; // yellow : red
        let room_name = `<a style='color: #b9bbbe;' href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;

        if (gameLog['room']['status'] === 'open') {
          room_name = `<a style='color: #b9bbbe;' href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
        }
        // history logs
        if (gameLog['game_type']['game_type_name'] === 'RPS') {
          if (gameLog.game_result === 1) {
            temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(gameLog['winnings'])} (${(gameLog['winnings'] / gameLog['bet_amount']).toFixed(2)}X)</span> (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
          } else if (gameLog.game_result === 3) {
            temp.history = `${hostContainer} received a <span style='color: #ff0a28;'>${convertToCurrency(gameLog['user_bet'] - gameLog.endgame_amount)}</span> Auto-Payout in ${room_name}`;
          } else if (gameLog.game_result === -100) {
            temp.history = `${creator_link} rugged <span style='color: ${color};'>${convertToCurrency(userBet)} (${multiplierDisplay}x)</span> in ${room_name}`;
          } else if (gameLog.game_result === 0) {
            temp.history = `${joined_user_link} split <span style='color: #b9bbbe;'>${convertToCurrency(betAmount * 2)} (1.00X)</span> in ${room_name}`;
          } else {
            temp.history = `${joined_user_link} lost <span style='color: #ff6701;'>${convertToCurrency(betAmount)} (0.00X)</span> in ${room_name}`;
          }
        } else if (gameLog['game_type']['game_type_name'] === 'Quick Shoot') {
          if (gameLog.game_result === 1) {
            temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(gameLog['winnings'] + gameLog['bet_amount'])} (${(gameLog['bet_amount'] / (gameLog['qs_game_type'] - 1) +
              gameLog['bet_amount']).toFixed(2)}X)</span> (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
          } else if (gameLog.game_result === 3) {
            temp.history = `${hostContainer} received a <span style='color: #ff0a28;'>${convertToCurrency(gameLog['user_bet'] - gameLog.endgame_amount)}</span> Auto-Payout in ${room_name}`;
          } else if (gameLog.game_result === -100) {
            temp.history = `${creator_link} rugged <span style='color: ${color};'>${convertToCurrency(userBet)} (${multiplierDisplay}x)</span> in ${room_name}`;
          } else {
            temp.history = `${joined_user_link} lost <span style='color: #ff6701;'>${convertToCurrency(betAmount)} (0.00X)</span> in ${room_name}`;
          }
        }
      } else if (gameLog.game_result === 666) {
        // unstaked log
        const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']}" src='${gameLog['creator']['avatar']}' alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(gameLog['creator']['totalWagered'])}" />`;
        const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;
        temp.history = `${creator_link} Unstaked ${room_name} <span style='color: #ffd000;'>${convertToCurrency(gameLog['bet_amount'])} (${convertToCurrency(((gameLog['host_pr'] / gameLog['endgame_amount'])))}X)</span>`;

      } else if (gameLog.game_result === 3000) {
        // topup log
        const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']}" src='${gameLog['creator']['avatar']}' alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(gameLog['creator']['totalWagered'])}" />`;
        const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;
        temp.history = `${creator_link} Topped Up ${room_name} <span style='color: #28a745;'>${convertToCurrency(gameLog['bet_amount'])}</span>`;

      } else if (gameLog.game_result === 333) {
        // coHost log
        const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']}" src='${gameLog['creator']['avatar']}' alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(gameLog['creator']['totalWagered'])}" />`;
        const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;
        temp.history = `${creator_link} Co-Hosted ${room_name} <span style='color: #28a745;'>${convertToCurrency(gameLog['bet_amount'])}</span>`;

      } else if (gameLog.game_result === 777) {
        // Withdrawal log
        const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']}" src='${gameLog['creator']['avatar']}' alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(gameLog['creator']['totalWagered'])}" />`;
        const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;
        temp.history = `${creator_link} withdrew <span style='color: #28a745;'>${convertToCurrency(gameLog['bet_amount'])} ($${(gameLog['bet_amount'] * 0.166)})</span>`;
      }
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
