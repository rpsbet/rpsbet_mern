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


const globalChatSend = (io, data) => {
  const {
    sender,
    senderId,
    message,
    messageType,
    messageContent,
    avatar,
    accessory,
    username,
    rank,
    replyTo
  } = data;

  const chat = new Chat({
    sender: senderId,
    message: message,
    messageType: messageType,
    messageContent: messageContent,
    avatar: avatar,
    rank: rank,
    username: username,
    accessory: accessory,
    replyTo: replyTo
      ? {
        sender: replyTo.senderId,
        username: replyTo.username,
        rank: replyTo.rank,
        avatar: replyTo.avatar,
        accessory: replyTo.accessory,
        message: replyTo.message,
        messageType: replyTo.messageType,
        time: Moment(replyTo.created_at).format('hh:mm')
      }
      : null
  });

  chat
    .save()
    .then(savedChat => {
      const fetchUsername = userId => {
        return User.findById(userId)
          .then(user => user.username)
          .catch(error => {
            return null;
          });
      };

      const fetchReplyToUsername = replyTo
        ? fetchUsername(replyTo.senderId)
        : null;

      Promise.all([fetchReplyToUsername])
        .then(([replyToUsername]) => {
          io.sockets.emit('GLOBAL_CHAT_RECEIVED', {
            sender: sender,
            senderId: senderId,
            message: message,
            messageType: messageType,
            messageContent: messageContent,
            avatar: avatar,
            accessory: accessory,
            rank: rank,
            replyTo: replyTo
              ? {
                sender: replyTo._id,
                username: replyToUsername,
                avatar: replyTo.avatar,
                accessory: replyTo.accessory,
                rank: replyTo.rank,
                message: replyTo.message,
                messageType: replyTo.messageType,
                time: Moment(replyTo.created_at).format('hh:mm')
              }
              : null, // Include the replyTo message details if it exists
            time: Moment(savedChat.created_at).format('hh:mm')
          });
        })
        .catch(error => {
          console.error('Error fetching replyTo username:', error);
        });
    })
    .catch(error => {
      console.error('Error saving chat:', error);

    });
};
module.exports.globalChatSend = globalChatSend;

module.exports.playSound = (from_user_id, data) => {
  send('PLAY_SOUND', from_user_id, data);
};

module.exports.sendMessage = (to_user_id, data) => {
  send('SEND_CHAT', to_user_id, data);
};

module.exports.sendNotification = (to_user_id, data) => {
  send('SEND_NOTIFICATION', to_user_id, data);
};

module.exports.newTransaction = transaction => {
  send('NEW_TRANSACTION', transaction['user']['_id'], transaction);
};

module.exports.socketio = server => {
  const io = socket_io(server);

  io.on('connection', (socket) => {
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    socket.on('STORE_CLIENT_USER_ID', async data => {
      try {
        // Update last_seen for the user
        await User.updateOne({ _id: data.user_id }, { last_seen: new Date() });

        sockets[data.user_id] = socket;
        const onlineUsers = Object.keys(sockets);
        io.sockets.emit('ONLINE_STATUS_UPDATED', {
          user_list: onlineUsers
        });
      } catch (error) {
        console.error('Error updating user last_seen:', error);
      }
    });

    socket.on('GLOBAL_CHAT_SEND', data => {
      globalChatSend(io, data);
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

    socket.on('RPS_1', data => {
      socket.broadcast.emit('RPS_1', data);
    });

    socket.on('INITIAL_STATE', data => {
      const roomId = data.roomId; // assuming roomId is passed in the data object
      socket.to(roomId).emit('INITIAL_STATE', data);
    });

    socket.on('error', err => {
      console.log(err.stack);
    });

    socket.on('READ_MESSAGE', async (data) => {
      // data: { to, from }
      // mark any from->to messages as read
      await Message.updateMany(
        {
          is_read: false,
          from: new ObjectId(data.from),
          to: new ObjectId(data.to)
        },
        { $set: { is_read: true } }
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
      console.log(`Forward the message to ${data.to} user`, data)
      const message = new Message(data);
      await message.save();
    });
    ``;
  });

  return io;
};
