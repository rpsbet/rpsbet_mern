const { Types: { ObjectId } } = require('mongoose');
const socket_io = require('socket.io');
const Message = require('./model/Message');
const Chat = require('./model/Chat');
const User = require('./model/User');
const moment = require('moment');

// Socket connection manager module pattern
function createSocketManager() {
  const socketConnections = new Map();
  
  return {
    addSocket(userId, socket) {
      socketConnections.set(userId, socket);
    },
    
    removeSocket(userId) {
      socketConnections.delete(userId);
    },
    
    removeSocketByInstance(socketInstance) {
      for (const [userId, socket] of socketConnections.entries()) {
        if (socket.id === socketInstance.id) {
          socketConnections.delete(userId);
          return userId;
        }
      }
      return null;
    },
    
    getSocket(userId) {
      const socket = socketConnections.get(userId);
      return socket;
    },
    
    hasSocket(userId) {
      const hasSocket = socketConnections.has(userId);
      return hasSocket;
    },
    
    getAllConnectedUserIds() {
      const userIds = Array.from(socketConnections.keys());
      return userIds;
    },
    
    getSocketCount() {
      const count = socketConnections.size;
      return count;
    },
    
    send(msgType, toUserId, data) {
      const socket = this.getSocket(toUserId);
      if (socket) {
        try {
          socket.emit(msgType, data);
          return true;
        } catch (error) {
          console.error(`Error emitting ${msgType} to user ${toUserId}:`, error);
          return false;
        }
      }
      return false;
    }
  };
}

// Create a singleton socket manager
const socketManager = createSocketManager();

/**
 * Handles global chat message sending
 * @param {SocketIO.Server} io - Socket.io server instance
 * @param {Object} data - Chat message data
 * @returns {Promise<void>}
 */
async function globalChatSend(io, data) {
  try {
    console.log('Processing GLOBAL_CHAT_SEND:', data);
    const {
      sender,
      senderId,
      message,
      messageType,
      messageContent,
      avatar,
      accessory,
      username,
      elite,
      rank,
      replyTo,
    } = data;
    
    let formattedReplyTo = null;
    if (replyTo) {
      formattedReplyTo = {
        sender: replyTo.senderId,
        username: replyTo.username,
        rank: replyTo.rank,
        avatar: replyTo.avatar,
        accessory: replyTo.accessory,
        elite: replyTo.elite,
        message: replyTo.message,
        messageType: replyTo.messageType,
        time: moment(replyTo.created_at).format('HH:mm'),
      };
      console.log('Formatted replyTo:', formattedReplyTo);
    }
    
    const chat = new Chat({
      sender: senderId,
      message,
      messageType,
      messageContent,
      avatar,
      rank,
      username,
      accessory,
      elite,
      replyTo: formattedReplyTo
    });
    
    const savedChat = await chat.save();
    console.log(`Saved chat message: ${savedChat._id}`);
    
    const chatData = {
      sender,
      senderId,
      message,
      messageType,
      messageContent,
      avatar,
      accessory,
      rank,
      replyTo: formattedReplyTo,
      time: moment(savedChat.created_at).format('HH:mm')
    };
    io.sockets.emit('GLOBAL_CHAT_RECEIVED', chatData);
  } catch (error) {
    console.error('Error in globalChatSend:', error);
  }
}

/**
 * Setup Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} - Configured Socket.IO server
 */
function setupSocketIO(server) {
  const io = socket_io(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  io.on('connection', async (socket) => {
    socket.on('connect_error', (error) => {
      console.error(`Socket ${socket.id} connect_error:`, error);
    });
    
    socket.on('error', (err) => {
      console.error(`Socket ${socket.id} error:`, err);
    });
    
    socket.on('STORE_CLIENT_USER_ID', async (data) => {
      try {
        const userId = data.user_id;
        if (!userId) {
          console.warn(`Received STORE_CLIENT_USER_ID with no user_id, socket: ${socket.id}`);
          return;
        }
        
        await User.updateOne(
          { _id: userId }, 
          { last_seen: new Date() }
        );
        
        // Check if user already has a socket and disconnect old one if necessary
        const existingSocket = socketManager.getSocket(userId);
        if (existingSocket && existingSocket.id !== socket.id) {
          existingSocket.disconnect(true);
        }
        
        socketManager.addSocket(userId, socket);
        broadcastOnlineUsers(io);
      } catch (error) {
        console.error(`Error in STORE_CLIENT_USER_ID for socket ${socket.id}:`, error);
      }
    });
    
    socket.on('GLOBAL_CHAT_SEND', (data) => {
      globalChatSend(io, data);
    });
    
    socket.on('SEND_CHAT', async (data) => {
      try {
        const sent = socketManager.send('SEND_CHAT', data.to, data);
        const message = new Message(data);
        await message.save();
      } catch (error) {
        console.error(`Error in SEND_CHAT for socket ${socket.id}:`, error);
      }
    });
    
    socket.on('READ_MESSAGE', async (data) => {
      try {
        if (!data.from || !data.to) {
          console.warn(`Invalid READ_MESSAGE data from socket ${socket.id}:`, data);
          return;
        }
        
        await Message.updateMany(
          {
            is_read: false,
            from: new ObjectId(data.from),
            to: new ObjectId(data.to),
          },
          { $set: { is_read: true } }
        );
      } catch (error) {
        console.error(`Error in READ_MESSAGE for socket ${socket.id}:`, error);
      }
    });
    
    socket.on('REQUEST_UNREAD_MESSAGE_COUNT', async (data) => {
      try {
        if (!data.to) {
          console.warn(`Invalid REQUEST_UNREAD_MESSAGE_COUNT data from socket ${socket.id}:`, data);
          return;
        }
        
        const count = await Message.countDocuments({
          to: data.to,
          is_read: false,
        });
        
        socket.emit('SET_UNREAD_MESSAGE_COUNT', count);
      } catch (error) {
        console.error(`Error in REQUEST_UNREAD_MESSAGE_COUNT for socket ${socket.id}:`, error);
      }
    });
    
    socket.on('RPS_1', (data) => {
      socket.broadcast.emit('RPS_1', data);
    });
    
    socket.on('INITIAL_STATE', (data) => {
      const roomId = data.roomId;
      if (roomId) {
        socket.to(roomId).emit('INITIAL_STATE', data);
      } else {
        console.warn(`No roomId in INITIAL_STATE from socket ${socket.id}`);
      }
    });
    
    socket.on('disconnect', () => {
      const userId = socketManager.removeSocketByInstance(socket);
      if (userId) {
        console.log(`Broadcasting online users update after disconnect of user ${userId}`);
        broadcastOnlineUsers(io);
      }
    });
  });
  
  return io;
}

/**
 * Broadcasts the list of online users to all connected clients
 * @param {SocketIO.Server} io - Socket.io server instance
 */
function broadcastOnlineUsers(io) {
  const userList = socketManager.getAllConnectedUserIds();
  io.sockets.emit('ONLINE_STATUS_UPDATED', {
    user_list: userList
  });
}

// Export functions
module.exports = {
  socketio: setupSocketIO,
  globalChatSend,
  
  playSound: (toUserId, data) => {
    const sent = socketManager.send('PLAY_SOUND', toUserId, data);
    return sent;
  },
  
  sendMessage: (toUserId, data) => {
    const sent = socketManager.send('SEND_CHAT', toUserId, data);
    return sent;
  },
  
  sendNotification: (toUserId, data) => {
    const userId = toUserId.toString ? toUserId.toString() : toUserId; // Convert to string if possible
    const sent = socketManager.send('SEND_NOTIFICATION', userId, data);
    return sent;
  },

  newTransaction: (transaction) => {
    const userId = transaction?.user?._id?.toString() || transaction?.user?.toString();
    if (userId) {
      const sent = socketManager.send('NEW_TRANSACTION', userId, transaction);
      return sent;
    }
    console.warn('newTransaction failed: No valid userId in transaction');
    return false;
  },
  
  sendBalanceUpdate: (toUserId, data) => {
    const sent = socketManager.send('UPDATE_SOLANA_BALANCE', toUserId, data);
    return sent;
  }
};