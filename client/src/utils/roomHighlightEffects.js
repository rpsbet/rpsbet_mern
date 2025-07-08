// Room highlighting effects utility for OpenGamesTable
// This utility makes it extremely obvious when new bets occur

class RoomHighlightEffects {
  constructor() {
    this.activeHighlights = new Map();
    this.timeouts = new Map();
  }

  // Apply mega highlighting to a specific room card
  highlightRoom(roomId, options = {}) {
    const {
      result = null,
      username = '',
      betAmount = 0,
      multiplier = null,
      duration = 8000,
      intensity = 'violent'
    } = options;

    // Find the room card element
    const roomCard = this.findRoomCard(roomId);
    if (!roomCard) {
      console.warn(`Room card not found for ID: ${roomId}`);
      return;
    }

    // Clear any existing highlight
    this.clearHighlight(roomId);

    // Determine highlight class based on intensity and result
    let highlightClass = 'room-card-mega-highlight';
    let intensityClass = 'room-card-normal';
    
    // Set intensity class based on intensity level
    switch (intensity) {
      case 'legendary':
        intensityClass = 'room-card-legendary';
        break;
      case 'epic':
        intensityClass = 'room-card-epic';
        break;
      case 'violent':
        intensityClass = 'room-card-violent';
        break;
      case 'normal':
      default:
        intensityClass = 'room-card-normal';
        break;
    }
    
    // Set result-based class
    if (result === 'win') {
      highlightClass = 'room-card-mega-highlight-win';
    } else if (result === 'loss') {
      highlightClass = 'room-card-mega-highlight-loss';
    }

    // Apply both the highlight class and intensity class
    roomCard.classList.add(highlightClass, intensityClass);
    
    // Add activity burst indicator
    roomCard.classList.add('room-activity-burst');

    // Create floating notification
    this.createFloatingNotification(roomCard, {
      username,
      betAmount,
      result,
      multiplier
    });

    // Store active highlight
    this.activeHighlights.set(roomId, {
      element: roomCard,
      class: highlightClass,
      startTime: Date.now()
    });

    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
      this.clearHighlight(roomId);
    }, duration);

    this.timeouts.set(roomId, timeoutId);

  }

  // Highlight the first room in the list with extra intensity
  highlightFirstRoom(options = {}) {
    const firstRoomCard = this.findFirstRoomCard();
    if (!firstRoomCard) {
      console.warn('First room card not found');
      return;
    }

    const roomId = this.extractRoomId(firstRoomCard);
    if (!roomId) {
      console.warn('Could not extract room ID from first room card');
      return;
    }

    // Clear existing highlight
    this.clearHighlight(roomId);

    // Apply first room specific highlighting
    firstRoomCard.classList.add('first-room-highlight');
    
    // Also apply the regular highlight based on result
    const { result } = options;
    if (result === 'win') {
      firstRoomCard.classList.add('room-card-mega-highlight-win');
    } else if (result === 'loss') {
      firstRoomCard.classList.add('room-card-mega-highlight-loss');
    } else {
      firstRoomCard.classList.add('room-card-mega-highlight');
    }

    // Create floating notification
    this.createFloatingNotification(firstRoomCard, options);

    // Store active highlight
    this.activeHighlights.set(roomId, {
      element: firstRoomCard,
      class: 'first-room-highlight',
      startTime: Date.now()
    });

    // Auto-remove after longer duration for first item
    const timeoutId = setTimeout(() => {
      this.clearHighlight(roomId);
    }, 10000); // 10 seconds for first room

    this.timeouts.set(roomId, timeoutId);

  }

  // Create floating notification overlay
  createFloatingNotification(roomCard, options) {
    const { username, betAmount, result, multiplier, intensity = 'normal' } = options;
    
    const notification = document.createElement('div');
    notification.className = 'floating-bet-notification';
    notification.style.cssText = `
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #4CAF50, #66BB6A);
      color: white;
      padding: 8px 16px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10001;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      animation: bounceIn 0.8s ease-out, fadeOut 2s ease-in-out 6s;
      pointer-events: none;
    `;

    // Set content and styling based on intensity and result
    let content = `${username} bet ${betAmount} SOL`;
    let prefix = '';
    
    // Set prefix based on intensity
    switch (intensity) {
      case 'legendary':
        prefix = result === 'win' ? '🌟 LEGENDARY WIN! 🌟' : '💀 LEGENDARY LOSS! 💀';
        break;
      case 'epic':
        prefix = result === 'win' ? '🔥 EPIC WIN! 🔥' : '💔 EPIC LOSS! 💔';
        break;
      case 'violent':
        prefix = result === 'win' ? '💥 BIG WIN! 💥' : '⚡ BIG LOSS! ⚡';
        break;
      case 'normal':
      default:
        prefix = result === 'win' ? '✅ Win!' : '❌ Loss';
        break;
    }
    
    // Set background color based on result first, then intensity for wins
    let backgroundColor;
    if (result === 'loss') {
      // All losses are red regardless of intensity
      backgroundColor = 'linear-gradient(45deg, #F44336, #FF5722)'; // red
    } else {
      // Wins get color based on intensity
      switch (intensity) {
        case 'legendary':
          backgroundColor = 'linear-gradient(45deg, #FFD700, #FFA500)'; // gold
          break;
        case 'epic':
          backgroundColor = 'linear-gradient(45deg, #FF6B35, #F7931E)'; // orange
          break;
        case 'violent':
          backgroundColor = 'linear-gradient(45deg, #4CAF50, #66BB6A)'; // green for wins
          break;
        case 'normal':
        default:
          backgroundColor = 'linear-gradient(45deg, #4CAF50, #66BB6A)'; // green
          break;
      }
    }
    
    if (result === 'win' && multiplier) {
      content = `${prefix} ${username} - ${multiplier}x (${betAmount} SOL)`;
    } else if (result === 'loss') {
      content = `${prefix} ${username} - ${betAmount} SOL`;
    } else {
      content = `${username} bet ${betAmount} SOL`;
    }
    
    notification.style.background = backgroundColor;

    notification.textContent = content;
    roomCard.style.position = 'relative';
    roomCard.appendChild(notification);

    // Remove notification after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  // Clear highlight from a specific room
  clearHighlight(roomId) {
    const highlight = this.activeHighlights.get(roomId);
    if (highlight) {
      const { element } = highlight;
      
      // Remove all highlight classes
      element.classList.remove(
        'room-card-mega-highlight',
        'room-card-mega-highlight-win',
        'room-card-mega-highlight-loss',
        'first-room-highlight',
        'room-activity-burst',
        'room-card-normal',
        'room-card-violent',
        'room-card-epic',
        'room-card-legendary'
      );
      
      // Add completion class
      element.classList.add('room-highlight-complete');
      
      // Remove completion class after a brief moment
      setTimeout(() => {
        element.classList.remove('room-highlight-complete');
      }, 1000);

      this.activeHighlights.delete(roomId);
    }

    // Clear timeout
    const timeoutId = this.timeouts.get(roomId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(roomId);
    }
  }

  // Find room card by ID
  findRoomCard(roomId) {
    // Try multiple selectors to find the room card
    const selectors = [
      `[data-room-id="${roomId}"]`,
      `[data-id="${roomId}"]`,
      `.room-card[data-room-id="${roomId}"]`,
      `.room-item[data-room-id="${roomId}"]`,
      `#room-${roomId}`,
      `[id*="${roomId}"]`
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    // Fallback: search through all room-like elements
    const roomElements = document.querySelectorAll('.room-card, .room-item, [class*="room"]');
    for (const element of roomElements) {
      if (element.textContent.includes(roomId) || 
          element.innerHTML.includes(roomId) ||
          element.getAttribute('id')?.includes(roomId)) {
        return element;
      }
    }

    return null;
  }

  // Find the first room card in the list
  findFirstRoomCard() {
    const selectors = [
      '.room-card:first-child',
      '.room-item:first-child',
      '[class*="room"]:first-child',
      '.filtered-rooms > :first-child',
      '.rooms-list > :first-child'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    return null;
  }

  // Extract room ID from element
  extractRoomId(element) {
    // Try various attributes and data
    const idSources = [
      element.getAttribute('data-room-id'),
      element.getAttribute('data-id'),
      element.getAttribute('id'),
      element.dataset.roomId,
      element.dataset.id
    ];

    for (const id of idSources) {
      if (id) {
        return id;
      }
    }

    return null;
  }

  // Clear all active highlights
  clearAllHighlights() {
    for (const roomId of this.activeHighlights.keys()) {
      this.clearHighlight(roomId);
    }
  }

  // Get stats about active highlights
  getStats() {
    return {
      activeHighlights: this.activeHighlights.size,
      activeTimeouts: this.timeouts.size,
      highlights: Array.from(this.activeHighlights.keys())
    };
  }
}

// Create global instance
window.roomHighlightEffects = new RoomHighlightEffects();

// Add test function for manual testing
window.testRoomHighlight = (intensity = 'epic') => {
  console.log(`🧪 Testing room highlight with intensity: ${intensity}`);
  const firstRoomCard = document.querySelector('[data-room-id]');
  if (firstRoomCard) {
    const roomId = firstRoomCard.getAttribute('data-room-id');
    console.log(`🧪 Found room to test: ${roomId}`);
    window.roomHighlightEffects.highlightRoom(roomId, {
      result: 'win',
      username: 'TestUser',
      betAmount: intensity === 'legendary' ? 1.5 : intensity === 'epic' ? 0.3 : intensity === 'violent' ? 0.08 : 0.02,
      intensity: intensity,
      duration: intensity === 'legendary' ? 15000 : intensity === 'epic' ? 12000 : intensity === 'violent' ? 8000 : 4000
    });
  } else {
    console.log('🧪 No room cards found to test');
  }
};

// Add quick test for all intensities
window.testAllIntensities = () => {
  console.log('🧪 Testing all intensity levels...');
  setTimeout(() => window.testRoomHighlight('normal'), 0);
  setTimeout(() => window.testRoomHighlight('violent'), 5000);
  setTimeout(() => window.testRoomHighlight('epic'), 10000);
  setTimeout(() => window.testRoomHighlight('legendary'), 15000);
};

// Test losses (should all be red)
window.testLosses = () => {
  console.log('🧪 Testing all loss intensities (should all be red)...');
  const testLoss = (intensity, delay) => {
    setTimeout(() => {
      const firstRoomCard = document.querySelector('[data-room-id]');
      if (firstRoomCard) {
        const roomId = firstRoomCard.getAttribute('data-room-id');
        window.roomHighlightEffects.highlightRoom(roomId, {
          result: 'loss',
          username: 'TestUser',
          betAmount: 0.1,
          intensity: intensity,
          duration: 6000
        });
      }
    }, delay);
  };
  
  testLoss('normal', 0);
  testLoss('violent', 3000);
  testLoss('epic', 6000);
  testLoss('legendary', 9000);
};


// CSS animation keyframes to add to document
const additionalCSS = `
  @keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  @keyframes bounceIn {
    0% {
      transform: translateX(-50%) scale(0.3) translateY(-20px);
      opacity: 0;
    }
    50% {
      transform: translateX(-50%) scale(1.05) translateY(0);
      opacity: 0.8;
    }
    70% {
      transform: translateX(-50%) scale(0.9) translateY(0);
      opacity: 0.9;
    }
    100% {
      transform: translateX(-50%) scale(1) translateY(0);
      opacity: 1;
    }
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#room-highlight-additional-css')) {
  const style = document.createElement('style');
  style.id = 'room-highlight-additional-css';
  style.textContent = additionalCSS;
  document.head.appendChild(style);
}

export default RoomHighlightEffects;