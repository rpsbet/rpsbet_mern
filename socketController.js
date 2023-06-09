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

module.exports.playSound = (from_user_id, data) => {
  send('PLAY_SOUND', from_user_id, data);
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
      const {
        sender,
        senderId,
        message,
        messageType,
        messageContent,
        avatar,
        replyTo
      } = data;
    
      console.log('replyTo:', replyTo); // Log the replyTo field
    
      const replyToMessage = replyTo ? [{
        sender: replyTo.sender,
        avatar: replyTo.avatar,
        message: replyTo.message,
        messageType: replyTo.messageType,
        time: Moment(replyTo.created_at).format('hh:mm')
      }] : null; // Include the replyTo message details if it exists
    
      const chat = new Chat({
        sender: senderId,
        message: message,
        messageType: messageType,
        messageContent: messageContent,
        avatar: avatar,
        replyTo: replyToMessage
      });
    
      chat.save()
        .then(savedChat => {
          const chatData = {
            sender: sender,
            senderId: senderId,
            message: message,
            messageType: messageType,
            messageContent: messageContent,
            avatar: avatar,
            replyTo: replyToMessage,
            time: Moment(savedChat.created_at).format('hh:mm')
          };
    
          io.sockets.emit('GLOBAL_CHAT_RECEIVED', chatData);
        })
        .catch(error => {
          console.error('Error saving chat:', error);
          // Handle error if chat saving fails
        });
    });
    
    socket.on('FETCH_GLOBAL_CHAT', () => {
      Chat.find({})
        .sort({ created_at: 1 }) // Sort in ascending order of created_at
        .limit(100)
        .populate({ path: 'sender', model: User, select: 'username avatar' })
        .populate({
          path: 'replyTo',
          model: 'rps_chat', // Use the model name 'rps_chat' instead of Chat
          populate: { path: 'sender', model: User, select: 'username avatar' }
        })
        .then(
          results =>
            results.map(
              ({
                created_at,
                message,
                messageType,
                messageContent,
                sender,
                replyTo
              }) => {
                // console.log('replyTo:', replyTo); // Log the replyTo field
                return {
                  sender: sender?.username ?? '',
                  senderId: sender?._id ?? '',
                  message: message,
                  messageType: messageType,
                  messageContent: messageContent,
                  avatar: sender?.avatar ?? '',
                  replyTo: replyTo
                    ? {
                        sender: replyTo.sender?.username ?? '',
                        avatar: replyTo.sender?.avatar ?? '',
                        message: replyTo.message,
                        messageType: replyTo.messageType,
                        time: Moment(replyTo.created_at).format('hh:mm')
                      }
                    : null,
                  time: Moment(created_at).format('hh:mm')
                };
              }
            )
          // .sort((a, b) => (a.created_at > b.created_at ? -1 : 1)) // Sort in descending order of created_at
        )
        .then(results => io.sockets.emit('SET_GLOBAL_CHAT', results))
        .catch(error => {
          console.error('Error fetching GLOBAL_CHAT:', error);
        });
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

    socket.on('UPDATED_BOX_LIST', data => {
      socket.broadcast.emit('UPDATED_BOX_LIST', data);
    });

    socket.on('SPLEESH_GUESSES', data => {
      socket.broadcast.emit('SPLEESH_GUESSES', data);
    });

    socket.on('SPLEESH_GUESSES1', data => {
      socket.broadcast.emit('SPLEESH_GUESSES1', data);
    });

    socket.on('DROP_GUESSES', data => {
      socket.broadcast.emit('DROP_GUESSES', data);
    });

    socket.on('DROP_GUESSES1', data => {
      socket.broadcast.emit('DROP_GUESSES1', data);
    });

    socket.on('UPDATED_BANKROLL', data => {
      socket.broadcast.emit('UPDATED_BANKROLL', data);
    });

    // socket.on('BANG_GUESSES', (data) => {
    //   socket.broadcast.emit('BANG_GUESSES', data);
    // });

    // // socketcontroller.js

    socket.on('BANG_GUESSES1', data => {
      const roomId = data.roomId; // assuming roomId is passed in the data object
      socket.to(roomId).emit('BANG_GUESSES1', data);
    });

    socket.on('INITIAL_STATE', data => {
      const roomId = data.roomId; // assuming roomId is passed in the data object
      socket.to(roomId).emit('INITIAL_STATE', data);
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
      send('SEND_CHAT', data.to, data);

      const message = new Message(data);
      await message.save();
    });
  });

  return io;
};
