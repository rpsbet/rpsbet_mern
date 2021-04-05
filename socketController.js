const ObjectId = require('mongoose').Types.ObjectId;
const socket_io = require ('socket.io');
const Message = require('./model/Message');
const Moment = require('moment');

let sockets = {};

const send = (msg_type, to_id, data) => {
  if (sockets.hasOwnProperty(to_id)) {
    sockets[to_id].emit(msg_type, data);
  }
}

module.exports.sendMessage = (to_user_id, data) => {
  send('SEND_CHAT', to_user_id, data);
};

module.exports.newTransaction = (transaction) => {
  send('NEW_TRANSACTION', transaction['user']['_id'], transaction);
}

module.exports.socketio = (server) => {
  const io = socket_io (server);

  io.on ('connection', (socket) => {
    socket.emit('CONNECTED', {});

    socket.on ('STORE_CLIENT_USER_ID', (data) => {
      sockets[data.user_id] = socket;
      io.sockets.emit('ONLINE_STATUS_UPDATED', {user_list: Object.keys(sockets)});
    })

    socket.on('GLOBAL_CHAT_SEND', (data) => {
      data.time = Moment(new Date()).format('hh:mm');
      io.sockets.emit('GLOBAL_CHAT_RECEIVED', data);
    })

    socket.on ('disconnect', (reason) => {
      Object.keys(sockets).forEach(
        (key, index) => {
          if (sockets[key].id === socket.id) {
            delete sockets[key];
          }
        }
      )
      io.sockets.emit('ONLINE_STATUS_UPDATED', {user_list: Object.keys(sockets)});
    });

    socket.on ('error', (err) => {
      console.log(err.stack);
    })

    socket.on ('READ_MESSAGE', async (data) => {
      await Message.updateMany(
        {
          is_read: false,
          from: new ObjectId(data.from),
          to: new ObjectId(data.to)
        }, 
        {$set:{is_read: true}}, 
        (err, writeResult) => { console.log('set messages as read via socket', err); }
      );
    });

    socket.on ('REQUEST_UNREAD_MESSAGE_COUNT', async (data) => {
      const count = await Message.countDocuments({
        to: data.to,
        is_read: false
      });
      socket.emit('SET_UNREAD_MESSAGE_COUNT', count);
    });

    socket.on ('SEND_CHAT', async (data) => {
      send('SEND_CHAT', data.to, data);

      const message = new Message(data);
      await message.save();
    });
  });

  return io;
};