const { Types: { ObjectId } } = require('mongoose');
const socket_io = require('socket.io');
const Message = require('./model/Message');
const Chat = require('./model/Chat');
const User = require('./model/User');
const moment = require('moment');

// Socket connection manager module pattern - avoid using global variables
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
      return socketConnections.get(userId);
    },
    
    hasSocket(userId) {
      return socketConnections.has(userId);
    },
    
    getAllConnectedUserIds() {
      return Array.from(socketConnections.keys());
    },
    
    getSocketCount() {
      return socketConnections.size;
    },
    
    send(msgType, toUserId, data) {
      const socket = this.getSocket(toUserId);
      if (socket) {
        socket.emit(msgType, data);
        return true;
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
      rank,
      replyTo,
    } = data;
    
    // Prepare replyTo data if it exists
    let formattedReplyTo = null;
    if (replyTo) {
      formattedReplyTo = {
        sender: replyTo.senderId,
        username: replyTo.username,
        rank: replyTo.rank,
        avatar: replyTo.avatar,
        accessory: replyTo.accessory,
        message: replyTo.message,
        messageType: replyTo.messageType,
        time: moment(replyTo.created_at).format('HH:mm'), // Using 24-hour format for consistency
      };
    }
    
    // Create and save the chat message
    const chat = new Chat({
      sender: senderId,
      message,
      messageType,
      messageContent,
      avatar,
      rank,
      username,
      accessory,
      replyTo: formattedReplyTo
    });
    
    const savedChat = await chat.save();
    
    // Emit the saved chat to all connected clients
    io.sockets.emit('GLOBAL_CHAT_RECEIVED', {
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
    });
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
  const io = socket_io(server);
  
  io.on('connection', async (socket) => {
    // Error handling for socket connection
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
    
    // Store user connection
    socket.on('STORE_CLIENT_USER_ID', async (data) => {
      try {
        const userId = data.user_id;
        if (!userId) return;
        
        // Update user's last_seen timestamp
        await User.updateOne(
          { _id: userId }, 
          { last_seen: new Date() }
        );
        
        // Store socket connection
        socketManager.addSocket(userId, socket);
        
        // Broadcast updated online users list
        broadcastOnlineUsers(io);
      } catch (error) {
        console.error('Error in STORE_CLIENT_USER_ID:', error);
      }
    });
    
    // Handle chat messages
    socket.on('GLOBAL_CHAT_SEND', (data) => {
      globalChatSend(io, data);
    });
    
    socket.on('SEND_CHAT', async (data) => {
      try {
        // Forward message to recipient
        socketManager.send('SEND_CHAT', data.to, data);
        
        // Save message to database
        const message = new Message(data);
        await message.save();
      } catch (error) {
        console.error('Error in SEND_CHAT:', error);
      }
    });
    
    // Handle message read status
    socket.on('READ_MESSAGE', async (data) => {
      try {
        if (!data.from || !data.to) return;
        
        await Message.updateMany(
          {
            is_read: false,
            from: new ObjectId(data.from),
            to: new ObjectId(data.to),
          },
          { $set: { is_read: true } }
        );
      } catch (error) {
        console.error('Error in READ_MESSAGE:', error);
      }
    });
    
    // Handle unread message count requests
    socket.on('REQUEST_UNREAD_MESSAGE_COUNT', async (data) => {
      try {
        if (!data.to) return;
        
        const count = await Message.countDocuments({
          to: data.to,
          is_read: false,
        });
        
        socket.emit('SET_UNREAD_MESSAGE_COUNT', count);
      } catch (error) {
        console.error('Error in REQUEST_UNREAD_MESSAGE_COUNT:', error);
      }
    });
    
    // Rock-Paper-Scissors game event
    socket.on('RPS_1', (data) => {
      socket.broadcast.emit('RPS_1', data);
    });
    
    // Handle game state
    socket.on('INITIAL_STATE', (data) => {
      const roomId = data.roomId;
      if (roomId) {
        socket.to(roomId).emit('INITIAL_STATE', data);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = socketManager.removeSocketByInstance(socket);
      broadcastOnlineUsers(io);
    });
  });
  
  return io;
}

/**
 * Broadcasts the list of online users to all connected clients
 * @param {SocketIO.Server} io - Socket.io server instance
 */
function broadcastOnlineUsers(io) {
  io.sockets.emit('ONLINE_STATUS_UPDATED', {
    user_list: socketManager.getAllConnectedUserIds()
  });
}

// Export functions
module.exports = {
  socketio: setupSocketIO,
  globalChatSend,
  
  // Utility methods for direct messaging
  playSound: (toUserId, data) => {
    return socketManager.send('PLAY_SOUND', toUserId, data);
  },
  
  sendMessage: (toUserId, data) => {
    return socketManager.send('SEND_CHAT', toUserId, data);
  },
  
  sendNotification: (toUserId, data) => {
    return socketManager.send('SEND_NOTIFICATION', toUserId, data);
  },
  
  newTransaction: (transaction) => {
    const userId = transaction?.user?._id;
    if (userId) {
      return socketManager.send('NEW_TRANSACTION', userId, transaction);
    }
    return false;
  }
};