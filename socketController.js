const { Types: { ObjectId } } = require('mongoose');
const socket_io = require('socket.io');
const Message = require('./model/Message');
const Chat = require('./model/Chat');
const User = require('./model/User');
const { format } = require('date-fns');
const {
  shouldUseDummyData,
  appendDummyGlobalChat,
  addDummyDirectMessage,
  markDummyMessagesRead,
  getDummyUnreadCount,
} = require('./helper/util/dummyData');


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

    // Validate required fields
    if (!sender || !senderId || !message) {
      throw new Error('Missing required chat fields');
    }

    if (shouldUseDummyData()) {
      const chatData = appendDummyGlobalChat(data);
      io.sockets.emit('GLOBAL_CHAT_RECEIVED', chatData);
      return;
    }

    let formattedReplyTo = null;
    if (replyTo && replyTo.senderId) {
      formattedReplyTo = {
        sender: replyTo.senderId,
        username: replyTo.username,
        rank: replyTo.rank,
        avatar: replyTo.avatar,
        accessory: replyTo.accessory,
        elite: replyTo.elite,
        message: replyTo.message,
        messageType: replyTo.messageType,
        time: format(new Date(replyTo.created_at), 'HH:mm'),
      };
    }

    // Create chat document with error handling
    const chat = new Chat({
      sender: senderId,                    // User ID
      username: sender,
      message,
      messageType,
      messageContent,
      avatar,
      rank,
      username: sender,
      accessory,
      elite,
      replyTo: formattedReplyTo
    });

    const savedChat = await chat.save();

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
      time: format(new Date(savedChat.created_at), 'HH:mm'),
    };

    io.sockets.emit('GLOBAL_CHAT_RECEIVED', chatData);

  } catch (error) {
    console.error('❌ Global chat error:', {
      message: error.message,
      stack: error.stack,
      data: data
    });

    // Don't let this crash the server
    throw error; // Re-throw so the socket handler can send error to client
  }
}

/**
 * Setup Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} - Configured Socket.IO server
 */
function setupSocketIO(server, redisClient) {
  const io = socket_io(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 10e6,
  });

  // ADD COMPREHENSIVE ERROR HANDLING
  io.engine.on("connection_error", (err) => {
    console.error('❌ ENGINE CONNECTION ERROR:', {
      message: err.message,
      description: err.description,
      context: err.context,
      type: err.type,
      stack: err.stack
    });
  });

  // Monitor all socket events for errors
  io.on('connection', async (socket) => {
    socket.on('connect_error', (error) => {
      console.error(`❌ Socket ${socket.id} connect_error:`, error);
    });

    socket.on('error', (err) => {
      console.error(`❌ Socket ${socket.id} error:`, err);
    });

    socket.on('disconnect', async (reason, details) => {
      console.log(`❌ Socket ${socket.id} disconnected: ${reason} ${details ? JSON.stringify(details) : ''}`);
      console.log(`📊 Disconnection stats: Total connected before: ${io.engine.clientsCount + 1}, after: ${io.engine.clientsCount}`);
      
      try {
        // Remove socket from manager and get the user ID
        const userId = socketManager.removeSocketByInstance(socket);
        
        if (userId) {
          console.log(`🔄 Cleaning up disconnect for user ${userId}`);
          
          if (!shouldUseDummyData()) {
            // Update last_seen timestamp in database
            await User.updateOne(
              { _id: userId },
              { last_seen: new Date() }
            );
          }
          
          // Clear Redis cache for user online status
          if (redisClient) {
            await redisClient.del(`user:${userId}:online`);
            await redisClient.del(`user:${userId}:session`);
          }
          
          // Broadcast updated online users list
          broadcastOnlineUsers(io);
          
        } else {
          console.log(`⚠️ No user ID found for disconnected socket ${socket.id}`);
        }
      } catch (error) {
        console.error('❌ Error handling socket disconnect:', error);
      }
    });

    // WRAP EACH HANDLER IN TRY-CATCH
    socket.on('STORE_CLIENT_USER_ID', async (data) => {
      try {
        const userId = data.user_id;
        if (!userId) {
          console.warn(`❌ No user_id provided, socket: ${socket.id}`);
          return;
        }

        if (!shouldUseDummyData()) {
          await User.updateOne(
            { _id: userId },
            { last_seen: new Date() }
          );
        }

        const existingSocket = socketManager.getSocket(userId);
        if (existingSocket && existingSocket.id !== socket.id) {
          existingSocket.disconnect(true);
        }

        socketManager.addSocket(userId, socket);
        broadcastOnlineUsers(io);
      } catch (error) {
        console.error(`❌ STORE_CLIENT_USER_ID error for socket ${socket.id}:`, error);
        // Don't let the error crash the socket
        socket.emit('error', { message: 'Failed to register user' });
      }
    });

    // CRITICAL: Wrap GLOBAL_CHAT_SEND in comprehensive error handling
    socket.on('GLOBAL_CHAT_SEND', async (data) => {
      try {

        // Validate required fields with better error messages
        if (!data.sender || data.sender.trim() === '') {
          console.error('❌ Empty sender field:', data);
          socket.emit('chat_error', {
            message: 'Username not available. Please refresh the page.',
            code: 'EMPTY_SENDER'
          });
          return; // Don't disconnect, just return error
        }

        if (!data.senderId) {
          console.error('❌ Missing senderId:', data);
          socket.emit('chat_error', {
            message: 'User ID not available. Please refresh the page.',
            code: 'MISSING_SENDER_ID'
          });
          return;
        }

        if (!data.message || data.message.trim() === '') {
          console.error('❌ Empty message:', data);
          socket.emit('chat_error', {
            message: 'Message cannot be empty.',
            code: 'EMPTY_MESSAGE'
          });
          return;
        }

        // Call the global chat function with error handling
        await globalChatSend(io, data);
        // After the message is sent and saved, delete the cache key.
        try {
          await redisClient.del('global:chat:logs');
          console.log("Chat cache invalidated ('global:chat:logs')");
        } catch (err) {
          console.error("Failed to invalidate chat cache:", err);
          // Don't let a cache error stop the chat, just log it.
        }

      } catch (error) {
        console.error(`❌ GLOBAL_CHAT_SEND error for socket ${socket.id}:`, {
          error: error.message,
          stack: error.stack,
          data: data
        });

        // Emit error back to client instead of crashing
        socket.emit('chat_error', {
          message: 'Failed to send message. Please try again.',
          error: error.message,
          code: 'PROCESSING_ERROR'
        });
      }
    });

    socket.on('SEND_CHAT', async (data) => {
      try {
        const sent = socketManager.send('SEND_CHAT', data.to, data);
        if (shouldUseDummyData()) {
          addDummyDirectMessage(data);
        } else {
          const message = new Message(data);
          await message.save();
        }
      } catch (error) {
        console.error(`❌ SEND_CHAT error for socket ${socket.id}:`, error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    socket.on('READ_MESSAGE', async (data) => {
      try {
        if (!data.from || !data.to) {
          console.warn(`❌ Invalid READ_MESSAGE data from socket ${socket.id}:`, data);
          return;
        }

        if (shouldUseDummyData()) {
          markDummyMessagesRead(data.from, data.to);
        } else {
          await Message.updateMany(
            {
              is_read: false,
              from: new ObjectId(data.from),
              to: new ObjectId(data.to),
            },
            { $set: { is_read: true } }
          );
        }
      } catch (error) {
        console.error(`❌ READ_MESSAGE error for socket ${socket.id}:`, error);
      }
    });

    socket.on('REQUEST_UNREAD_MESSAGE_COUNT', async (data) => {
      try {
        if (!data.to) {
          console.warn(`❌ Invalid REQUEST_UNREAD_MESSAGE_COUNT from socket ${socket.id}:`, data);
          return;
        }

        const count = shouldUseDummyData()
          ? getDummyUnreadCount(data.to)
          : await Message.countDocuments({
              to: data.to,
              is_read: false,
            });

        socket.emit('SET_UNREAD_MESSAGE_COUNT', count);
      } catch (error) {
        console.error(`❌ REQUEST_UNREAD_MESSAGE_COUNT error for socket ${socket.id}:`, error);
      }
    });

    // Add error handling for other events...
    socket.on('RPS_1', (data) => {
      try {
        socket.broadcast.emit('RPS_1', data);
      } catch (error) {
        console.error(`❌ RPS_1 error for socket ${socket.id}:`, error);
      }
    });

    socket.on('INITIAL_STATE', (data) => {
      try {
        const roomId = data.roomId;
        if (roomId) {
          socket.to(roomId).emit('INITIAL_STATE', data);
        } else {
          console.warn(`❌ No roomId in INITIAL_STATE from socket ${socket.id}`);
        }
      } catch (error) {
        console.error(`❌ INITIAL_STATE error for socket ${socket.id}:`, error);
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
  broadcastOnlineUsers,
  
  // Get online users list for simulation integration
  getOnlineUsers: () => {
    return socketManager.getAllConnectedUserIds();
  },

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
