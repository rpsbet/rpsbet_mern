const socket_io = require ('socket.io');
const User = require('./model/User');

module.exports.socketio = (server) => {
  const io = socket_io (server);
  io.on ('connection', (socket) => {
    socket.emit('CONNECTED', {});

    socket.on ('DISCONNECT', (data) => {
      io.sockets.emit('CONNECTED', data);
    });

    socket.on ('CHAT_HISTORY', function (data) {
      // testFunction (data, (arrList) => {
      //   user.emit ('RECEIVE_CHAT_HISTORY', {
      //     title: data.myDetail + "----" + data.toDetail[0]._id,
      //     data: getEncryptedData (arrList)});
      // });
    });
  });

  return io;

  // testFunction = function (data, callback) {
  //   User.find ({
  //     $or: [
  //       {
  //         title: cryptr.decrypt (data.myDetail) + "----" + cryptr.decrypt (data.toDetail[0]._id)
  //       },
  //       {
  //         title: cryptr.decrypt (data.toDetail[0]._id) + "----" + cryptr.decrypt (data.myDetail)
  //       }
  //     ]
  //   }, (error, list) => {
  //     callback (list);
  //   });
  // };

};