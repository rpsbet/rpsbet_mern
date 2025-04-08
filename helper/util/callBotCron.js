const Room = require('../../model/Room.js');
const cron = require('node-cron');

let socketio = null;

async function callCronJobs(io) {
  if (io) {
    socketio = io;
  }

  try {
    const updatedRooms = await Room.aggregate([
      { $match: { status: 'open' } },
      { $sort: { updated_at: -1 } },
      {
        $lookup: {
          from: 'rps_users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'rps_users',
          localField: 'joiners',
          foreignField: '_id',
          as: 'joiners',
        },
      },
      {
        $lookup: {
          from: 'rps_game_types',
          localField: 'game_type',
          foreignField: '_id',
          as: 'game_type',
        },
      },
      { $unwind: { path: '$game_type', preserveNullAndEmptyArrays: true } },
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
              },
            },
          },
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
        },
      },
    ]);

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
    }));

    if (socketio) {
      socketio.emit('UPDATED_ROOM_LIST', result);
    }
  } catch (err) {
    console.error('Error fetching or emitting updated room list:', err);
  }
}

cron.schedule('*/5 * * * * *', async () => {
  await callCronJobs(socketio);
});

module.exports = {
  callCronJobs,
};