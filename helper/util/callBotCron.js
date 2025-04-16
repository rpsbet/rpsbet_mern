const Room = require('../../model/Room.js');
const cron = require('node-cron');

let socketio = null;
let lastExecutionTime = 0; // Track when the last execution started

async function callCronJobs(io) {
  if (io) {
    socketio = io;
  }

  // Record the exact timestamp of this execution
  const executionTime = Date.now();
  lastExecutionTime = executionTime;
  
  try {
    const updatedRooms = await Room.aggregate([
      { $match: { status: 'open' } },
      { $sort: { updated_at: -1 } }, // Initial sort by updated_at
      // Lookup for creator
      {
        $lookup: {
          from: 'rps_users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      // Lookup for joiners
      {
        $lookup: {
          from: 'rps_users',
          localField: 'joiners',
          foreignField: '_id',
          as: 'joiners',
        },
      },
      // Unwind hosts array to process each host individually
      { $unwind: { path: '$hosts', preserveNullAndEmptyArrays: true } },
      // Lookup for hosts based on hosts.host field
      {
        $lookup: {
          from: 'rps_users',
          localField: 'hosts.host',
          foreignField: '_id',
          as: 'hostData',
        },
      },
      // Unwind hostData to merge it
      { $unwind: { path: '$hostData', preserveNullAndEmptyArrays: true } },
      // Group back to reconstruct the hosts array
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          ticker: { $first: '$ticker' },
          image: { $first: '$image' },
          description: { $first: '$description' },
          room_number: { $first: '$room_number' },
          creator: { $first: '$creator' },
          joiners: { $first: '$joiners' },
          hosts: {
            $push: {
              _id: '$hostData._id',
              avatar: { $ifNull: ['$hosts.avatar', '$hostData.avatar'] },
              username: { $ifNull: ['$hosts.username', '$hostData.username'] },
              rank: { $ifNull: ['$hosts.rank', '$hostData.totalWagered'] },
              accessory: { $ifNull: ['$hosts.accessory', '$hostData.accessory'] },
              elite: { $ifNull: ['$hosts.elite', '$hostData.elite'] },
              walletAddress: '$hosts.walletAddress',
              share: '$hosts.share',
            },
          },
          game_type: { $first: '$game_type' },
          bet_amount: { $first: '$bet_amount' },
          user_bet: { $first: '$user_bet' },
          endgame_amount: { $first: '$endgame_amount' },
          is_private: { $first: '$is_private' },
          status: { $first: '$status' },
          created_at: { $first: '$created_at' },
          updated_at: { $first: '$updated_at' }, // Preserve updated_at for sorting
          battles: { $first: '$battles' },
          likes: { $first: '$likes' },
          dislikes: { $first: '$dislikes' },
        },
      },
      // Lookup for game_type
      {
        $lookup: {
          from: 'rps_game_types',
          localField: 'game_type',
          foreignField: '_id',
          as: 'game_type',
        },
      },
      { $unwind: { path: '$game_type', preserveNullAndEmptyArrays: true } },
      // Reapply sort to ensure original order
      { $sort: { updated_at: -1 } },
      // Final projection
      {
        $project: {
          _id: 1,
          name: 1,
          ticker: 1,
          image: 1,
          description: 1,
          room_number: 1,
          creator: {
            _id: '$creator._id',
            avatar: '$creator.avatar',
            username: '$creator.username',
            rank: '$creator.totalWagered',
            accessory: '$creator.accessory',
            elite: '$creator.elite',
            status: '$creator.status',
          },
          joiners: {
            $map: {
              input: '$joiners',
              as: 'joiner',
              in: {
                _id: '$$joiner._id',
                avatar: '$$joiner.avatar',
                username: '$$joiner.username',
                rank: '$$joiner.totalWagered',
                accessory: '$$joiner.accessory',
                elite: '$$joiner.elite',
              },
            },
          },
          hosts: 1, // Already structured in $group
          game_type: {
            _id: '$game_type._id',
            short_name: '$game_type.short_name',
            description: '$game_type.description',
          },
          bet_amount: 1,
          user_bet: 1,
          endgame_amount: 1,
          is_private: 1,
          status: 1,
          created_at: 1,
          battles: 1,
          likes: 1,
          dislikes: 1,
        },
      },
    ]);

    // Check if this is still the most recent execution
    if (lastExecutionTime !== executionTime) {
      return; // Exit without emitting if a newer execution has started
    }

    const result = updatedRooms.map((room) => ({
      _id: room._id,
      name: room.name,
      ticker: room.ticker || room.room_number,
      image: room.image,
      description: room.description,
      creator: {
        _id: room.creator._id,
        avatar: room.creator.avatar,
        username: room.creator.username,
        rank: room.creator.rank,
        accessory: room.creator.accessory,
        elite: room.creator.elite,
        status: room.creator.status,
      },
      joiners: room.joiners,
      hosts: room.hosts,
      game_type: room.game_type,
      bet_amount: room.bet_amount,
      user_bet: room.user_bet,
      endgame_amount: room.endgame_amount,
      is_private: room.is_private,
      status: room.status,
      created_at: room.created_at,
      battles: room.battles,
      likes: room.likes,
      dislikes: room.dislikes,
    }));

    if (socketio && lastExecutionTime === executionTime) {
      socketio.emit('ROOMS_UPDATED', result);
    }
  } catch (err) {
    // Only log errors for current execution
    if (lastExecutionTime === executionTime) {
      console.error(`[${executionTime}] Error fetching or emitting updated room list:`, err);
    }
  }
}

// Schedule the cron job to run every 5 seconds
const cronJob = cron.schedule('*/5 * * * * *', async () => {
  await callCronJobs(socketio);
});

module.exports = {
  callCronJobs,
  // Expose methods to control the cron job if needed
  pauseCronJob: () => cronJob.stop(),
  resumeCronJob: () => cronJob.start()
};