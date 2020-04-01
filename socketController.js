const socket_io = require ('socket.io');
const Message = require('./model/Message');

let sockets = {};

module.exports.socketio = (server) => {
  const io = socket_io (server);
  io.on ('connection', (socket) => {
    socket.emit('CONNECTED', {});

    socket.on ('STORE_CLIENT_USER_ID', (data) => {
      sockets[data.user_id] = socket;
    })

    socket.on ('DISCONNECT', (data) => {
      
    });

    socket.on ('SEND_CHAT', async function (data) {
      if (sockets.hasOwnProperty(data.to)) {
        sockets[data.to].emit('SEND_CHAT', data);
      }
      const message = new Message(data);
      await message.save();
    });
  });

  return io;
};