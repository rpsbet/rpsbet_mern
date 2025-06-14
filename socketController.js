const { Types: { ObjectId } } = require('mongoose');
const socket_io = require('socket.io');
const Message = require('./model/Message');
const Chat = require('./model/Chat');
const User = require('./model/User');
const { format } = require('date-fns');
const mongoose = require('mongoose');

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
 * Handles global chat message sending - UPDATED WITH DEBUG LOGGING
 * @param {SocketIO.Server} io - Socket.io server instance
 * @param {Object} data - Chat message data
 * @returns {Promise<void>}
 */
async function globalChatSend(io, data) {
  // Use a temporary ID for potential error tracking on the client
  const tempId = new mongoose.Types.ObjectId().toString();
  const creationTime = new Date();

  try {
    console.log('📨 globalChatSend called with data:', JSON.stringify(data, null, 2));

    const {
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

    // 1. ✅ All validations passed (your existing validation is good)
    if (!senderId || !message || !username) {
      console.error('❌ Missing required fields (senderId, message, or username)');
      // You could emit an error back to the sender here if needed
      return;
    }
    
    // 2. ✅ Prepare the response data for broadcast *FIRST*
    // This object is what other users will see instantly.
    const responseData = {
      _id: tempId, // Send a temporary ID
      sender: username,
      senderId,
      message,
      messageType: messageType || 'text',
      messageContent: messageContent || message,
      avatar,
      accessory,
      rank,
      elite,
      replyTo: data.replyTo, // Assuming replyTo is already formatted correctly on the client
      time: format(creationTime, 'HH:mm'), // Use consistent time
    };

    // 3. 🔥 BROADCAST IMMEDIATELY!
    // This is the key change. We are not waiting for the database.
    console.log('📨 Broadcasting optimistically:', JSON.stringify(responseData, null, 2));
    io.sockets.emit('GLOBAL_CHAT_RECEIVED', responseData);
    console.log(`✅ Broadcast completed to ${io.engine.clientsCount} clients.`);

    // 4. 💾 SAVE TO DATABASE IN THE BACKGROUND
    // Now, we can safely `await` the database operation without disconnecting clients.
    const chatData = {
      sender: senderId,
      username: username,
      message,
      messageType: messageType || 'text',
      messageContent: messageContent || message,
      avatar,
      rank,
      accessory,
      elite,
      replyTo: data.replyTo,
      created_at: creationTime,
    };
    
    console.log('💾 Saving chat document to database...');
    const chat = new Chat(chatData);
    const savedChat = await chat.save();
    console.log('✅ Chat saved successfully with permanent ID:', savedChat._id);
    
    // (Optional) You can emit a confirmation to the original sender with the permanent ID
    const senderSocket = socketManager.getSocket(senderId);
    if (senderSocket) {
        senderSocket.emit('MESSAGE_SAVED_CONFIRMATION', {
            tempId: tempId,
            permanentId: savedChat._id,
            timestamp: savedChat.created_at
        });
    }

  } catch (error) {
    // 5. 💀 HANDLE DATABASE SAVE FAILURE
    // If the broadcast succeeded but the save failed, we need to handle it.
    console.error('❌ CRITICAL ERROR in globalChatSend:', error.message);
    console.error('❌ Data that caused error:', JSON.stringify(data, null, 2));
    
    // Inform clients to remove the optimistic message
    io.sockets.emit('REMOVE_CHAT_MESSAGE', { tempId: tempId });
    
    // Inform the original sender of the failure
    const senderSocket = socketManager.getSocket(data.senderId);
    if (senderSocket) {
        senderSocket.emit('GLOBAL_CHAT_ERROR', {
            error: 'Failed to save message to database.',
            messageDetails: data.message
        });
    }
  }
}


/**
 * Setup Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @param {Object} options - Socket.IO configuration options
 * @returns {SocketIO.Server} - Configured Socket.IO server
 */
function setupSocketIO(server, options = {}) {
  console.log('🔌 Setting up Socket.IO server...');
  console.log('🔌 Options received:', JSON.stringify(options, null, 2));

  // Merge default options with provided options
  const defaultOptions = {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  };

  const finalOptions = { ...defaultOptions, ...options };
  console.log('🔌 Final Socket.IO options:', JSON.stringify(finalOptions, null, 2));

  const io = socket_io(server, finalOptions);

  io.on('connection', async (socket) => {
    console.log(`🔌 BACKEND: Socket connected - ID: ${socket.id}`);
    console.log(`🔌 BACKEND: Total connections: ${io.engine.clientsCount}`);

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

        console.log(`🔌 Storing user ID ${userId} for socket ${socket.id}`);

        await User.updateOne(
          { _id: userId },
          { last_seen: new Date() }
        );

        // Check if user already has a socket and disconnect old one if necessary
        const existingSocket = socketManager.getSocket(userId);
        if (existingSocket && existingSocket.id !== socket.id) {
          console.log(`🔌 Disconnecting old socket for user ${userId}`);
          existingSocket.disconnect(true);
        }

        socketManager.addSocket(userId, socket);
        broadcastOnlineUsers(io);
      } catch (error) {
        console.error(`Error in STORE_CLIENT_USER_ID for socket ${socket.id}:`, error);
      }
    });

    // Enhanced GLOBAL_CHAT_SEND event handler
    socket.on('GLOBAL_CHAT_SEND', async (data) => {
      console.log('=== GLOBAL_CHAT_SEND RECEIVED ===');
      console.log('1. Raw data received:', JSON.stringify(data, null, 2));
      console.log('2. Socket ID:', socket.id);
      console.log('3. Socket connected:', socket.connected);

      try {
        console.log('4. Calling globalChatSend...');
        await globalChatSend(io, data);
        console.log('✅ globalChatSend completed successfully');

      } catch (error) {
        console.error('❌ CRITICAL ERROR in GLOBAL_CHAT_SEND handler:');
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        console.error('   Socket ID:', socket.id);

        // ✅ Send error response to client instead of letting socket disconnect
        socket.emit('GLOBAL_CHAT_ERROR', {
          error: 'Failed to send message',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }

      console.log('=== GLOBAL_CHAT_SEND HANDLER COMPLETE ===');
    });

    // ✅ Add error event listeners to prevent unexpected disconnections
    socket.on('error', (error) => {
      console.error(`❌ Socket ${socket.id} error:`, error);
      // Don't disconnect on error - try to recover
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

    // Add this SIMPLE test handler to isolate the issue
socket.on('TEST_SIMPLE_MESSAGE', async (data) => {
  console.log('🧪 TEST_SIMPLE_MESSAGE received:', data);
  
  try {
    // Test 1: Just emit back (no database)
    socket.emit('TEST_RESPONSE', { 
      success: true, 
      message: 'Socket works!',
      timestamp: Date.now() 
    });
    console.log('✅ Test 1 passed: Socket emit works');
    
    // Test 2: Try a simple database read (no write)
    const userCount = await mongoose.connection.db.collection('rps_users').countDocuments();
    socket.emit('TEST_RESPONSE', { 
      success: true, 
      message: 'Database read works!',
      userCount,
      timestamp: Date.now() 
    });
    console.log('✅ Test 2 passed: Database read works');
    
    // Test 3: Try a simple write to a test collection
    const testDoc = {
      message: 'test',
      timestamp: new Date()
    };
    
    await mongoose.connection.db.collection('test_messages').insertOne(testDoc);
    socket.emit('TEST_RESPONSE', { 
      success: true, 
      message: 'Database write works!',
      timestamp: Date.now() 
    });
    console.log('✅ Test 3 passed: Database write works');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    socket.emit('TEST_RESPONSE', { 
      success: false, 
      error: error.message,
      timestamp: Date.now() 
    });
  }
});

// Use this in your frontend console to test:
// socket.emit('TEST_SIMPLE_MESSAGE', { test: true });

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

    socket.on('disconnect', (reason) => {
      console.log(`🔌 BACKEND: Socket disconnected - ID: ${socket.id}, Reason: ${reason}`);
      const userId = socketManager.removeSocketByInstance(socket);
      if (userId) {
        console.log(`🔌 BACKEND: Removed user ${userId} from socket manager`);
        broadcastOnlineUsers(io);
      }
    });
  });

  console.log('🔌 Socket.IO server setup complete');
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
    const userId = toUserId.toString ? toUserId.toString() : toUserId;
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