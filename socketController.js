const ObjectId = require('mongoose').Types.ObjectId;
const socket_io = require('socket.io');
const Message = require('./model/Message');
const Moment = require('moment');
const Chat = require('./model/Chat');
const User = require('./model/User');

let sockets = {};

const send = (msg_type, to_id, data) => {
  if (sockets.hasOwnProperty(to_id)) {
    sockets[to_id].emit(msg_type, data);
  }
};

module.exports.sendMessage = (to_user_id, data) => {
  send('SEND_CHAT', to_user_id, data);
};

module.exports.newTransaction = transaction => {
  send('NEW_TRANSACTION', transaction['user']['_id'], transaction);
};

module.exports.socketio = server => {
  const io = socket_io(server);

  io.on('connection', socket => {
    socket.emit('CONNECTED', {});

    socket.on('STORE_CLIENT_USER_ID', data => {
      sockets[data.user_id] = socket;
      io.sockets.emit('ONLINE_STATUS_UPDATED', {
        user_list: Object.keys(sockets)
      });
    });

    socket.on('GLOBAL_CHAT_SEND', data => {
      const chat = new Chat({
        sender: data.senderId,
        message: data.message
      });
      chat.save();
      io.sockets.emit('GLOBAL_CHAT_RECEIVED', {
        ...data,
        time: Moment(new Date()).format('hh:mm')
      });
    });

    socket.on('FETCH_GLOBAL_CHAT', () => {
      Chat.find({})
        .sort({ created_at: -1 })
        .limit(26)
        .populate({ path: 'sender', model: User })
        .then(results =>
          results
            .map(({ created_at, message, sender }) => ({
              sender: sender?.username ?? '',
              message,
              time: Moment(created_at).format('hh:mm')
            }))
            .sort((a, b) => (a.created_at > b.created_at ? 1 : -1))
        )
        .then(results => io.sockets.emit('SET_GLOBAL_CHAT', results));
    });

    socket.on('disconnect', reason => {
      Object.keys(sockets).forEach((key, index) => {
        if (sockets[key].id === socket.id) {
          delete sockets[key];
        }
      });
      io.sockets.emit('ONLINE_STATUS_UPDATED', {
        user_list: Object.keys(sockets)
      });
    });

    socket.on('error', err => {
      console.log(err.stack);
    });

    socket.on('READ_MESSAGE', async data => {
      await Message.updateMany(
        {
          is_read: false,
          from: new ObjectId(data.from),
          to: new ObjectId(data.to)
        },
        { $set: { is_read: true } },
        (err, writeResult) => {
          console.log('set messages as read via socket', err);
        }
      );
    });

    socket.on('REQUEST_UNREAD_MESSAGE_COUNT', async data => {
      const count = await Message.countDocuments({
        to: data.to,
        is_read: false
      });
      socket.emit('SET_UNREAD_MESSAGE_COUNT', count);
    });

    socket.on('SEND_CHAT', async data => {
      console.log({ data });
      send('SEND_CHAT', data.to, data);

      const message = new Message(data);
      await message.save();
    });
  });

  return io;
};
