const ObjectId = require('mongoose').Types.ObjectId;
const socket_io = require ('socket.io');
const Message = require('./model/Message');

let sockets = {};

const send = (to_id, data) => {
  if (sockets.hasOwnProperty(to_id)) {
    sockets[to_id].emit('SEND_CHAT', data);
  }
}

module.exports.sendMessage = (to_user_id, data) => {
  send(to_user_id, data);
};

module.exports.socketio = (server) => {
  const io = socket_io (server);
  io.on ('connection', (socket) => {
    socket.emit('CONNECTED', {});

    socket.on ('STORE_CLIENT_USER_ID', (data) => {
      sockets[data.user_id] = socket;
    })

    socket.on ('DISCONNECT', (data) => {
      
    });

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
      send(data.to, data);

      const message = new Message(data);
      await message.save();
    });
  });

  return io;
};