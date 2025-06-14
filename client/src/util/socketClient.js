// Complete socketClient.js with all necessary methods
import socketIOClient from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
    this.userId = null;
    this.connectionPromise = null;
    this.lastConnectionAttempt = 0;
    this.minConnectionInterval = 2000; // Minimum 2 seconds between connections
    this.isConnecting = false;
  }

  /**
   * Initialize socket connection with better error handling
   */
  connect(endpoint, options = {}) {
    const now = Date.now();
    
    // Prevent rapid reconnections
    if (now - this.lastConnectionAttempt < this.minConnectionInterval) {
      return Promise.resolve(this.socket);
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return this.connectionPromise || Promise.resolve(this.socket);
    }

    if (this.socket?.connected) {
      console.warn('Socket already connected');
      return Promise.resolve(this.socket);
    }

    this.lastConnectionAttempt = now;
    this.isConnecting = true;

    const defaultOptions = {
      transports: ['websocket', 'polling'], // Allow fallback to polling
      withCredentials: true,
      forceNew: false,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      autoConnect: true,
    };

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.socket = socketIOClient(endpoint, { ...defaultOptions, ...options });
        
        const connectionTimeout = setTimeout(() => {
          this.isConnecting = false;
          reject(new Error('Socket connection timeout'));
        }, 15000);

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;

          // Re-register user ID if available
          if (this.userId) {
            this.registerUserId(this.userId);
          }

          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ Socket connection error:', error);
          this.isConnected = false;
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(error);
        });

        this.setupConnectionHandlers();

      } catch (error) {
        console.error('❌ Socket initialization failed:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isConnecting = false;
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        setTimeout(() => {
          if (!this.isConnected && !this.isConnecting) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      this.isConnecting = false;
      
      // Re-register user if available
      if (this.userId) {
        this.registerUserId(this.userId);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.isConnecting = true;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after max attempts');
      this.isConnected = false;
      this.isConnecting = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  /**
   * Register user ID with better error handling
   */
  registerUserId(userId) {
    if (!userId) {
      console.warn('Cannot register empty user ID');
      return false;
    }

    if (!this.socket?.connected) {
      console.warn('Cannot register user ID - socket not connected');
      // Store userId for later registration when connected
      this.userId = userId;
      return false;
    }

    try {
      this.userId = userId;
      this.socket.emit('STORE_CLIENT_USER_ID', { user_id: userId });
      return true;
    } catch (error) {
      console.error('Failed to register user ID:', error);
      return false;
    }
  }

  /**
   * Setup global event handlers
   */
  setupGlobalHandlers(handlers) {
    if (!this.socket) {
      console.warn('Cannot setup global handlers - socket not available');
      return;
    }

    const globalEvents = {
      'ONLINE_STATUS_UPDATED': handlers.handleOnlineStatusUpdated,
      'GLOBAL_CHAT_RECEIVED': handlers.handleGlobalChat,
      'ROOMS_UPDATED': handlers.handleUpdatedRoomList,
      'ROOM_ENDED': handlers.handleRoomEnded,
      'ROOM_ACTION_UPDATED': handlers.handleRoomActionUpdated,
    };

    Object.entries(globalEvents).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        // Remove existing handler if any
        const existingHandler = this.eventHandlers.get(event);
        if (existingHandler) {
          this.socket.off(event, existingHandler);
        }
        
        this.socket.on(event, handler);
        this.eventHandlers.set(event, handler);
      }
    });

  }

  /**
   * Setup user-specific event handlers
   */
  setupUserHandlers(userId, handlers) {
    if (!this.socket) {
      console.warn('Cannot setup user handlers - socket not available');
      return;
    }

    if (!userId) {
      console.warn('Cannot setup user handlers - no user ID provided');
      return;
    }

    // Register user ID first
    this.registerUserId(userId);

    const userEvents = {
      'SEND_CHAT': handlers.handleSendChat,
      [`RECEIVED_LOAN_OFFER_${userId}`]: handlers.handleLoanOffer,
      'UPDATE_BET_RESULT': handlers.handleBetResult,
      'SEND_NOTIFICATION': handlers.handleSendNotification,
      'NEW_TRANSACTION': handlers.handleAddTransaction,
      'SET_UNREAD_MESSAGE_COUNT': handlers.handleUnreadCount,
    };

    Object.entries(userEvents).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        // Remove existing handler if any
        const existingHandler = this.eventHandlers.get(event);
        if (existingHandler) {
          this.socket.off(event, existingHandler);
        }
        
        this.socket.on(event, handler);
        this.eventHandlers.set(event, handler);
      }
    });

  }

  /**
   * Remove all event handlers
   */
  clearHandlers() {
    if (!this.socket) return;

    this.eventHandlers.forEach((handler, event) => {
      try {
        this.socket.off(event, handler);
      } catch (error) {
        console.warn(`Failed to remove handler for ${event}:`, error);
      }
    });

    this.eventHandlers.clear();
  }

  /**
   * Remove user-specific handlers only
   * @param {string} userId - User ID
   */
  clearUserHandlers(userId) {
    if (!this.socket) {
      return;
    }

    const userEventPatterns = [
      'SEND_CHAT',
      `RECEIVED_LOAN_OFFER_${userId}`,
      'UPDATE_BET_RESULT',
      'SEND_NOTIFICATION',
      'NEW_TRANSACTION',
      'SET_UNREAD_MESSAGE_COUNT',
    ];

    userEventPatterns.forEach(event => {
      const handler = this.eventHandlers.get(event);
      if (handler) {
        try {
          this.socket.off(event, handler);
          this.eventHandlers.delete(event);
        } catch (error) {
          console.warn(`Failed to remove user handler for ${event}:`, error);
        }
      }
    });

    // Don't clear userId here to allow re-registration
  }

  /**
   * Emit with connection check
   */
  emit(event, data) {
    if (!this.socket) {
      console.warn(`Cannot emit ${event} - socket not initialized`);
      return false;
    }

    if (!this.socket.connected) {
      console.warn(`Cannot emit ${event} - socket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      return false;
    }
  }

  /**
   * Wait for connection before emitting
   */
  async emitWhenConnected(event, data, timeout = 5000) {
    if (this.socket?.connected) {
      return this.emit(event, data);
    }

    // Wait for connection
    const startTime = Date.now();
    while (!this.socket?.connected && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.socket?.connected) {
      return this.emit(event, data);
    } else {
      console.warn(`Failed to emit ${event} - connection timeout`);
      return false;
    }
  }

  /**
   * Clean disconnect
   */
  disconnect() {
    if (this.socket) {
      this.clearHandlers();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.userId = null;
      this.connectionPromise = null;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected && !!this.socket?.connected,
      socketId: this.socket?.id || null,
      userId: this.userId,
      hasSocket: !!this.socket,
      isConnecting: this.isConnecting,
      readyState: this.socket?.connected ? 'connected' : 'disconnected'
    };
  }

  /**
   * Request unread message count
   */
  requestUnreadMessageCount(userId) {
    return this.emitWhenConnected('REQUEST_UNREAD_MESSAGE_COUNT', { to: userId });
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(to, from) {
    return this.emitWhenConnected('READ_MESSAGE', { to, from });
  }

  /**
   * Force reconnection
   */
  async forceReconnect() {
    if (this.socket && !this.isConnecting) {
      this.socket.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.socket.connect();
    }
  }

  /**
   * Check if socket is healthy (connected and responsive)
   */
  async healthCheck(timeout = 3000) {
    if (!this.socket?.connected) {
      return false;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeout);
      
      this.socket.emit('ping', Date.now());
      this.socket.once('pong', () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;