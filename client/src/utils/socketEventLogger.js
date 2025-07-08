// Socket Event Logger for debugging socket reception in OpenGamesTable
// Add this to your main component or socket client to track event reception

class SocketEventLogger {
  constructor() {
    this.eventCounts = new Map();
    this.lastEvents = [];
    this.maxEvents = 50; // Keep last 50 events
  }

  // Log socket event reception
  logEvent(eventName, data, source = 'unknown') {
    const timestamp = new Date().toISOString();
    const eventInfo = {
      eventName,
      timestamp,
      source,
      dataSize: JSON.stringify(data).length,
      hasData: !!data,
      preview: this.getDataPreview(data)
    };

    // Update counts
    const currentCount = this.eventCounts.get(eventName) || 0;
    this.eventCounts.set(eventName, currentCount + 1);

    // Store recent events
    this.lastEvents.unshift(eventInfo);
    if (this.lastEvents.length > this.maxEvents) {
      this.lastEvents.pop();
    }

    // Console log with details
    console.log(`🔔 [SOCKET EVENT] ${eventName} from ${source}`, {
      count: currentCount + 1,
      timestamp,
      preview: eventInfo.preview,
      dataSize: eventInfo.dataSize
    });

    // Special logging for critical events
    if (['NEW_LOG', 'HIGHLIGHT_FIRST_ROOM', 'UPDATED_BANKROLL'].some(e => eventName.includes(e))) {
      console.log(`⚡ [CRITICAL EVENT] ${eventName}:`, data);
    }
  }

  // Get data preview for logging
  getDataPreview(data) {
    if (!data) return 'null';
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) return '{}';
      
      const preview = {};
      keys.slice(0, 3).forEach(key => {
        const value = data[key];
        if (typeof value === 'string') {
          preview[key] = value.length > 20 ? value.substring(0, 20) + '...' : value;
        } else if (typeof value === 'number') {
          preview[key] = value;
        } else if (Array.isArray(value)) {
          preview[key] = `Array(${value.length})`;
        } else {
          preview[key] = typeof value;
        }
      });
      
      if (keys.length > 3) {
        preview['...'] = `+${keys.length - 3} more`;
      }
      
      return preview;
    }
    
    return typeof data;
  }

  // Get statistics
  getStats() {
    return {
      totalEvents: this.lastEvents.length,
      eventCounts: Object.fromEntries(this.eventCounts),
      recentEvents: this.lastEvents.slice(0, 10),
      uniqueEvents: this.eventCounts.size
    };
  }

  // Print statistics to console
  printStats() {
    console.log('📊 Socket Event Statistics:', this.getStats());
  }

  // Clear statistics
  clear() {
    this.eventCounts.clear();
    this.lastEvents = [];
    console.log('🧹 Socket event statistics cleared');
  }
}

// Create global instance
window.socketEventLogger = new SocketEventLogger();

// Helper function to wrap socket event listeners with logging
function loggedSocketOn(socket, eventName, handler, source = 'component') {
  return socket.on(eventName, (data) => {
    window.socketEventLogger.logEvent(eventName, data, source);
    return handler(data);
  });
}

// Export for ES6 modules
export { SocketEventLogger, loggedSocketOn };

// Example usage for OpenGamesTable:
/*
// In your OpenGamesTable component:
import { loggedSocketOn } from '../utils/socketEventLogger';

// Replace regular socket.on calls with logged versions:
// socket.on('NEW_LOG', handleNewLog); // OLD
loggedSocketOn(socket, 'NEW_LOG', handleNewLog, 'OpenGamesTable'); // NEW

loggedSocketOn(socket, 'HIGHLIGHT_FIRST_ROOM', (data) => {
  console.log('🎯 HIGHLIGHT_FIRST_ROOM received in OpenGamesTable:', data);
  // Apply highlighting logic here
}, 'OpenGamesTable');

loggedSocketOn(socket, 'ROOM_ACTIVITY_BURST', (data) => {
  console.log('💥 ROOM_ACTIVITY_BURST received:', data);
  // Apply activity burst effects here
}, 'OpenGamesTable');

// To view statistics in console:
// window.socketEventLogger.printStats();
*/

// Auto-log statistics every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    if (window.socketEventLogger.eventCounts.size > 0) {
      window.socketEventLogger.printStats();
    }
  }, 30000);
}

console.log('🔧 Socket Event Logger initialized. Use window.socketEventLogger.printStats() to view statistics');