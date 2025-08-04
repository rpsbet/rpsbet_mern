// helper/util/betSimulationCron.js
// Enhanced chat simulation with more dynamic and random patterns

const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../../model/User');
const Room = require('../../model/Room');
const GameLog = require('../../model/GameLog');
const GameTransaction = require('../../model/Transaction');
const CustomBetItem = require('../../model/CustomBetItem');
const socketController = require('../../socketController');
const { convertGameLogToHistoryStyle } = require('./convertGameLogToHistoryStyle');
const moment = require('moment');
const OpenAI = require('openai');

const ENABLE_LOGGING = true;
function log(message) {
  if (ENABLE_LOGGING) {
    console.log(message);
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class EnhancedChatPersonalityGenerator {
  constructor() {
    // Dynamic personality traits that can be mixed
    this.personalityTraits = {
      enthusiasm: ['energy', 'hype', 'excitement', 'passion', 'intensity'],
      negativity: ['salt', 'frustration', 'pessimism', 'cynicism', 'anger'],
      humor: ['memes', 'racism', 'offensive', 'sarcasm', 'wit', 'playfulness'],
      analysis: ['logic', 'strategy', 'observation', 'calculation', 'prediction'],
      social: ['friendly', 'supportive', 'conversational', 'curious', 'engaging'],
      chaos: ['random', 'unpredictable', 'impulsive', 'scattered', 'wild'],
      stoic: ['calm', 'quiet', 'serious', 'detached', 'composed'],
      theatrical: ['dramatic', 'flamboyant', 'expressive', 'overreacting', 'melodramatic'],
      robotic: ['literal', 'monotone', 'dry', 'precise', 'emotionless'],
      troll: ['baiting', 'provoking', 'mocking', 'ironic', 'chaotic-evil'],
      degen: ['reckless', 'addicted', 'YOLO', 'no chill', 'all-in energy'],
      disciplined: ['focused', 'measured', 'motivated', 'grinding', 'goal-oriented'],
      mystic: ['cryptic', 'wise', 'symbolic', 'calm', 'riddling'],
      nerdy: ['explanatory', 'technical', 'fact-based', 'educational', 'geeky']
    };

    // Dynamic speech patterns that can be combined
    this.speechPatterns = {
      abbreviations: {
        weight: 0.7,
        patterns: ['u', 'ur', 'r', 'b', 'c', 'y', 'thru', 'tho', 'rn', 'imo', 'irl', 'afk', 'brb']
      },
      intensifiers: {
        weight: 0.5,
        patterns: ['so', 'very', 'super', 'mega', 'ultra', 'hella', 'mad', 'crazy', 'insanely']
      },
      fillers: {
        weight: 0.6,
        patterns: ['like', 'just', 'literally', 'actually', 'basically', 'kinda', 'sorta', 'umm']
      },
      endings: {
        weight: 0.2,
        patterns: ['lol', 'lmao', 'stfu', 'lul', 'lulz', 'xd', 'fr', 'ngl', 'ong', 'sybau', 'tbh', 'imo', 'idk', 'rn', 'smh', 'ffs']
      },
      gaming: {
        weight: 0.9,
        patterns: ['gg', 'gl', 'hf', 'wdym', 'jew', 'wp', 'nt', 'clutch', 'threw', 'int', 'diff', 'gap', 'cracked', 'washed', 'tweekin']
      }
    };

    // Dynamic reaction templates
    this.reactionTemplates = {
      win: {
        small: ['nice', 'decent', 'ok hit', 'not bad', 'solid', 'clean'],
        medium: ['good shit', 'nice one', 'lets go', 'yessir', 'W', 'dub'],
        large: ['huge', 'massive', 'insane', 'unreal', 'no way', 'holy'],
        mega: ['YOOOOOO', 'LETS FUCKING GO', 'NO SHOT', 'AYOOO', 'SHEEEEESH']
      },
      loss: {
        small: ['rip', 'f', 'L', 'jew', 'smd', 'damn', 'ah', 'welp'],
        medium: ['pain', 'oof', 'rough', 'unlucky', 'rippp', 'fml'],
        large: ['im done', 'cooked', 'finished', 'over', 'ggs', 'taking a break'],
        tilt: ['rigged', 'scam', 'this game trash', 'uninstalling', 'refund', 'joke game']
      }
    };

    // Dynamic conversation starters based on context
    this.contextualStarters = {
      timeOfDay: {
        morning: ['gm chat', 'morning grind', 'early session', 'coffee and degen'],
        afternoon: ['afternoon vibes', 'lunch break gambling', 'slow day'],
        evening: ['evening squad', 'night shift', 'prime time'],
        lateNight: ['late night degen hours', '3am hittin different', 'sleep is for the weak']
      },
      roomActivity: {
        dead: ['dead chat', 'anyone alive', 'hello?', 'chat sleeping'],
        active: ['chat popping', 'we vibing', 'active af', 'love to see it'],
        winning: ['everyone eating', 'printer on', 'free money', 'ez mode'],
        losing: ['bloodbath', 'everyone down bad', 'rough day', 'market makers feasting']
      }
    };

    // Track conversation momentum
    this.conversationMomentum = {
      energy: 0,
      topic: null,
      participants: new Set(),
      lastActivity: Date.now()
    };

    // User personality states
    this.userStates = new Map();
  }

  // Generate dynamic user personality with random mixing
  generateDynamicPersonality(userId) {
    if (this.userStates.has(userId)) {
      const state = this.userStates.get(userId);
      this.addPersonalityVariation(state);
      return state;
    }

    // Create new personality by mixing random traits
    const personality = {
      id: userId,
      traits: this.selectRandomTraits(),
      speechStyle: this.generateSpeechStyle(),
      energy: Math.floor(Math.random() * 100) - 50,
      consistency: Math.random() * 0.7 + 0.3,
      chattiness: Math.random(),
      mood: this.generateInitialMood(),
      history: {
        messageCount: 0,
        winStreak: 0,
        lossStreak: 0,
        lastMessage: null,
        favoriteTopics: [],
        relationships: new Map(),
        conversationMemory: [],
        preferredTimeToChat: this.generatePreferredChatTime(),
        emotionalState: 'neutral',
        lastEmotionalShift: Date.now(),
        topicInterests: this.generateTopicInterests()
      },
      conversationContext: {
        currentTopic: null,
        topicStartTime: null,
        participatingUsers: new Set(),
        conversationDepth: 0,
        lastReplyTime: null,
        pendingReplies: []
      }
    };

    this.userStates.set(userId, personality);
    return personality;
  }

  // Select random personality traits with weights
  selectRandomTraits() {
    const traits = {};
    const traitCategories = Object.keys(this.personalityTraits);

    // Each user gets 2-4 dominant traits
    const numTraits = Math.floor(Math.random() * 3) + 2;
    const selectedCategories = [];

    for (let i = 0; i < numTraits; i++) {
      const category = traitCategories[Math.floor(Math.random() * traitCategories.length)];
      if (!selectedCategories.includes(category)) {
        selectedCategories.push(category);
        const traitOptions = this.personalityTraits[category];
        traits[category] = {
          primary: traitOptions[Math.floor(Math.random() * traitOptions.length)],
          strength: Math.random() * 0.5 + 0.5
        };
      }
    }

    return traits;
  }

  // Generate dynamic speech style
  generateSpeechStyle() {
    const style = {};

    Object.entries(this.speechPatterns).forEach(([pattern, config]) => {
      style[pattern] = {
        enabled: Math.random() < config.weight,
        intensity: Math.random(),
        favorites: this.selectRandomElements(config.patterns, 3)
      };
    });

    // Special characteristics
    style.typoRate = Math.random() * 0.4;
    style.capsRate = Math.random() * 0.3;
    style.lengthPreference = this.weightedRandom({
      'veryShort': 0.5,
      'short': 0.35,
      'medium': 0.13,
      'long': 0.02
    });

    return style;
  }

  // Add random variation to existing personality
  addPersonalityVariation(personality) {
    // Mood can shift
    personality.mood = this.shiftMood(personality.mood, personality.history);

    // Energy fluctuates
    personality.energy += (Math.random() - 0.5) * 20;
    personality.energy = Math.max(-50, Math.min(50, personality.energy));

    // Chattiness varies by time and mood
    personality.chattiness = Math.min(1, Math.max(0,
      personality.chattiness + (Math.random() - 0.5) * 0.2
    ));

    // Update emotional state based on recent events
    this.updateEmotionalState(personality);

    // Clean up old conversation memory
    this.cleanupConversationMemory(personality);
  }

  // Generate preferred chat times for users
  generatePreferredChatTime() {
    const timePreferences = {
      'earlyBird': 0.15,
      'midDay': 0.25,
      'afternoon': 0.35,
      'evening': 0.45,
      'lateNight': 0.30,
      'insomniac': 0.10
    };

    return this.weightedRandom(timePreferences);
  }

  // Generate topic interests for users
  generateTopicInterests() {
    const allTopics = [
      'trading', 'crypto', 'gambling', 'sports', 'music', 'movies', 'games',
      'tech', 'politics', 'memes', 'food', 'travel', 'fashion', 'art',
      'finance', 'psychology', 'philosophy', 'science', 'humor', 'drama'
    ];

    // Each user gets 3-7 interests
    const numInterests = Math.floor(Math.random() * 5) + 3;
    const interests = [];

    for (let i = 0; i < numInterests; i++) {
      const topic = allTopics[Math.floor(Math.random() * allTopics.length)];
      if (!interests.includes(topic)) {
        interests.push(topic);
      }
    }

    return interests;
  }

  // Update emotional state based on recent events
  updateEmotionalState(personality) {
    const now = Date.now();

    // Ensure history exists
    if (!personality.history) {
      personality.history = {};
    }

    const timeSinceLastShift = now - (personality.history?.lastEmotionalShift || 0);

    // Emotional states can shift every 5 minutes minimum
    if (timeSinceLastShift < 5 * 60 * 1000) return;

    const currentState = personality.history?.emotionalState || 'neutral';
    let newState = currentState;

    // Base emotional transitions
    const transitions = {
      'neutral': ['happy', 'sad', 'excited', 'bored', 'curious'],
      'happy': ['excited', 'content', 'neutral', 'euphoric'],
      'sad': ['depressed', 'angry', 'neutral', 'frustrated'],
      'excited': ['euphoric', 'happy', 'hyper', 'neutral'],
      'angry': ['frustrated', 'hostile', 'sad', 'neutral'],
      'bored': ['curious', 'neutral', 'sleepy', 'restless'],
      'content': ['happy', 'neutral', 'relaxed'],
      'euphoric': ['happy', 'excited', 'manic'],
      'depressed': ['sad', 'hopeless', 'neutral'],
      'frustrated': ['angry', 'sad', 'neutral']
    };

    // Adjust based on win/loss streaks
    if ((personality.history?.winStreak || 0) >= 3) {
      newState = Math.random() < 0.7 ? 'excited' : 'euphoric';
    } else if ((personality.history?.lossStreak || 0) >= 3) {
      newState = Math.random() < 0.7 ? 'frustrated' : 'depressed';
    } else if (Math.random() < 0.3) {
      // Random emotional shift
      const possibleStates = transitions[currentState] || ['neutral'];
      newState = possibleStates[Math.floor(Math.random() * possibleStates.length)];
    }

    if (newState !== currentState) {
      if (personality.history) {
        personality.history.emotionalState = newState;
        personality.history.lastEmotionalShift = now;
      }
    }
  }

  // Clean up old conversation memory to prevent bloat
  cleanupConversationMemory(personality) {
    const maxMemoryItems = 20;
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    // Ensure history exists
    if (!personality.history) {
      personality.history = {};
    }

    if (!personality.history.conversationMemory) {
      personality.history.conversationMemory = [];
    }

    personality.history.conversationMemory = personality.history.conversationMemory
      .filter(memory => now - memory.timestamp < maxAge)
      .slice(-maxMemoryItems);

    // Clean up pending replies older than 5 minutes
    if (!personality.conversationContext) {
      personality.conversationContext = {};
    }

    if (!personality.conversationContext.pendingReplies) {
      personality.conversationContext.pendingReplies = [];
    }

    personality.conversationContext.pendingReplies =
      personality.conversationContext.pendingReplies
        .filter(reply => now - reply.timestamp < 5 * 60 * 1000);
  }

  // Generate contextual mood
  generateInitialMood() {
    const moods = {
      neutral: 0.3,
      optimistic: 0.2,
      skeptical: 0.15,
      excited: 0.1,
      bored: 0.1,
      focused: 0.1,
      chaotic: 0.05
    };

    return this.weightedRandom(moods);
  }

  // Shift mood based on events
  shiftMood(currentMood, history) {
    const moodTransitions = {
      neutral: ['optimistic', 'skeptical', 'bored', 'focused'],
      optimistic: ['excited', 'neutral', 'confident'],
      skeptical: ['frustrated', 'neutral', 'analytical'],
      excited: ['chaotic', 'optimistic', 'neutral'],
      bored: ['skeptical', 'neutral', 'chaotic'],
      focused: ['analytical', 'neutral', 'optimistic'],
      frustrated: ['tilted', 'skeptical', 'neutral'],
      tilted: ['chaotic', 'frustrated', 'quiet'],
      confident: ['excited', 'optimistic', 'cocky']
    };

    // Mood shifts based on streaks
    if (history.winStreak > 3) {
      return Math.random() < 0.7 ? 'confident' : 'excited';
    }
    if (history.lossStreak > 3) {
      return Math.random() < 0.7 ? 'frustrated' : 'tilted';
    }

    // Random mood shift chance
    if (Math.random() < 0.2) {
      const transitions = moodTransitions[currentMood] || ['neutral'];
      return transitions[Math.floor(Math.random() * transitions.length)];
    }

    return currentMood;
  }

  // Update conversation momentum
  updateConversationMomentum(message, user) {
    const now = Date.now();
    const timeSinceLastActivity = now - this.conversationMomentum.lastActivity;

    // Decay energy over time
    if (timeSinceLastActivity > 30000) {
      this.conversationMomentum.energy *= 0.5;
    }

    // Add energy based on message characteristics
    if (message.includes('!') || message === message.toUpperCase()) {
      this.conversationMomentum.energy += 10;
    }
    if (message.length > 20) {
      this.conversationMomentum.energy += 5;
    }

    // Track participants
    this.conversationMomentum.participants.add(user);

    // Clean old participants
    if (this.conversationMomentum.participants.size > 10) {
      const participants = Array.from(this.conversationMomentum.participants);
      this.conversationMomentum.participants = new Set(participants.slice(-10));
    }

    this.conversationMomentum.lastActivity = now;
    this.conversationMomentum.energy = Math.max(-100, Math.min(100, this.conversationMomentum.energy));
  }

  // Utility functions
  selectRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  weightedRandom(weights) {
    const entries = Object.entries(weights);
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [value, weight] of entries) {
      random -= weight;
      if (random <= 0) return value;
    }

    return entries[0][0];
  }

  // Apply emotional state to message tone
  applyEmotionalStateTransformations(message, personality) {
    const emotionalState = personality.history?.emotionalState;

    switch (emotionalState) {
      case 'excited':
      case 'euphoric':
        if (Math.random() < 0.3) message += '!';
        if (Math.random() < 0.2) message = message.toUpperCase();
        break;

      case 'depressed':
      case 'sad':
        message = message.toLowerCase();
        message = message.replace(/!+/g, '.');
        break;

      case 'angry':
      case 'frustrated':
        if (Math.random() < 0.4) message += '...';
        break;

      case 'bored':
        if (Math.random() < 0.3) message = message.replace(/\.$/, '...');
        break;
    }

    return message;
  }

  // Build personality description for AI context
  buildPersonalityDescription(personality) {
    const traits = [];

    if (personality.traits) {
      Object.entries(personality.traits).forEach(([category, trait]) => {
        if (trait && trait.strength > 0.6) {
          traits.push(`${trait.primary} (${category})`);
        }
      });
    }

    const moodDesc = personality.mood || 'neutral';
    const energyDesc = personality.energy > 20 ? 'high energy' :
      personality.energy < -20 ? 'low energy' : 'moderate energy';

    return `${traits.join(', ')}, mood: ${moodDesc}, ${energyDesc}`;
  }
}

const MAX_USER_MESSAGE_HISTORY = 20;
const MAX_GLOBAL_MESSAGE_HISTORY = 100;

class BetSimulator {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.simulationCount = 0;
    this.recentUserRooms = new Map();
    this.personalityGen = new EnhancedChatPersonalityGenerator();
    this.simulatedOnlineUsers = new Set();
    this.sentMessagesHistory = new Map();
    this.globalSentMessages = new Set();

    // Users to exclude from bet simulation
    this.excludedUsernames = ['Bearbland11', 'Sachin5512', 'Eminem', 'Tydrellinbg', 'Kitler'];
    this.chatContext = {
      recentMessages: [],
      activeTopics: new Map(),
      conversationThreads: new Map()
    };
  }

  isMessageUnique(userId, message) {
    const userHistory = this.sentMessagesHistory.get(userId);
    if (userHistory && userHistory.has(message)) {
      return false;
    }
    if (this.globalSentMessages.has(message)) {
      return false;
    }
    return true;
  }

  addMessageToHistory(userId, message) {
    if (!this.sentMessagesHistory.has(userId)) {
      this.sentMessagesHistory.set(userId, new Set());
    }
    const userHistory = this.sentMessagesHistory.get(userId);
    userHistory.add(message);
    if (userHistory.size > MAX_USER_MESSAGE_HISTORY) {
      userHistory.delete(userHistory.values().next().value);
    }

    this.globalSentMessages.add(message);
    if (this.globalSentMessages.size > MAX_GLOBAL_MESSAGE_HISTORY) {
      this.globalSentMessages.delete(this.globalSentMessages.values().next().value);
    }
  }

  // Enhanced chat message generation with more randomness
  async generateAIChatMessage(user, room, result, betAmount, multiplier, otherUsers = [], recentMessages = [], isReply = true, isBetRelated = false) {
    const personality = this.personalityGen.generateDynamicPersonality(user._id);

    // Update mood based on results
    if (result) {
      this.updateUserMoodFromResult(personality, result, multiplier);
    }

    // Store conversation context for memory
    this.updateConversationMemory(personality, recentMessages, room);

    // Check if user should chat based on time preferences and emotional state
    const shouldChat = this.shouldUserChat(personality);

    if (!shouldChat) {
      return null;
    }

    let message = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      try {
        // Determine message type with enhanced context awareness
        const messageStrategy = this.determineEnhancedMessageStrategy(
          personality,
          isBetRelated,
          isReply,
          recentMessages,
          result,
          multiplier,
          room,
          otherUsers
        );

        // Generate contextual message based on strategy
        let currentMessage = null;

        switch (messageStrategy.type) {
          case 'reaction':
            currentMessage = await this.generateContextualReactionMessage(personality, messageStrategy, result, multiplier, betAmount, room);
            break;
          case 'continuation':
            currentMessage = await this.generateSmartContinuationMessage(personality, messageStrategy, recentMessages, room);
            break;
          case 'starter':
            currentMessage = await this.generateTopicalStarterMessage(personality, messageStrategy, room, otherUsers);
            break;
          case 'echo':
            currentMessage = this.generatePersonalizedEchoMessage(personality, recentMessages);
            break;
          case 'random':
            currentMessage = await this.generateContextualRandomMessage(personality, messageStrategy, room);
            break;
          case 'openai':
            currentMessage = await this.generateOpenAIMessage(personality, room, recentMessages, result, betAmount, multiplier);
            break;
        }

        if (currentMessage) {
          // Apply personality transformations
          currentMessage = this.applyPersonalityTransformations(currentMessage, personality);
          currentMessage = this.personalityGen.applyEmotionalStateTransformations(currentMessage, personality);

          // Check for uniqueness and relevance
          if (this.isMessageUniqueAndRelevant(user._id.toString(), currentMessage, recentMessages)) {
            message = currentMessage;
            break;
          } else {
            log(`⚠️ Duplicate/irrelevant message generated for ${user.username}: "${currentMessage}". Retrying...`);
          }
        }
      } catch (error) {
        log(`❌ Error during message generation attempt: ${error}`);
      }
      attempts++;
    }

    if (!message) {
      log('💬 Failed to generate a unique message after multiple attempts.');
      return null;
    }

    // Update conversation momentum and relationships
    this.personalityGen.updateConversationMomentum(message, user.username);
    this.updateUserRelationships(personality, recentMessages, message);

    // Track message in history and conversation context
    if (!personality.history) {
      personality.history = {};
    }
    if (!personality.conversationContext) {
      personality.conversationContext = {};
    }

    if (personality.history) {
      personality.history.lastMessage = message;
      personality.history.messageCount = (personality.history.messageCount || 0) + 1;
    }
    personality.conversationContext.lastReplyTime = Date.now();

    this.addMessageToHistory(user._id.toString(), message);
    this.addToConversationMemory(personality, message, room);

    return message;
  }

  // Check if user should chat based on time preferences and emotional state
  shouldUserChat(personality) {
    const hour = new Date().getHours();
    const timePreference = personality.history?.preferredTimeToChat || 'evening';

    let timeBonus = 0;
    switch (timePreference) {
      case 'earlyBird':
        timeBonus = (hour >= 6 && hour <= 10) ? 0.3 : -0.2;
        break;
      case 'midDay':
        timeBonus = (hour >= 10 && hour <= 14) ? 0.3 : -0.1;
        break;
      case 'afternoon':
        timeBonus = (hour >= 14 && hour <= 18) ? 0.3 : -0.1;
        break;
      case 'evening':
        timeBonus = (hour >= 18 && hour <= 22) ? 0.3 : -0.1;
        break;
      case 'lateNight':
        timeBonus = (hour >= 22 || hour <= 2) ? 0.3 : -0.2;
        break;
      case 'insomniac':
        timeBonus = (hour >= 2 && hour <= 6) ? 0.4 : -0.3;
        break;
    }

    // Emotional state affects chattiness
    const emotionalStates = {
      'excited': 0.3, 'happy': 0.2, 'euphoric': 0.4, 'content': 0.1,
      'neutral': 0, 'bored': 0.1, 'curious': 0.2,
      'sad': -0.2, 'frustrated': -0.1, 'angry': -0.3, 'depressed': -0.4
    };

    const emotionalBonus = emotionalStates[personality.history?.emotionalState] || 0;

    const baseChatProbability = personality.chattiness || 0.5;
    const chatProbability = baseChatProbability + timeBonus + emotionalBonus;

    const finalProbability = Math.max(0.6, Math.min(0.9, chatProbability));

    return Math.random() < finalProbability;
  }

  // Update conversation memory with recent messages
  updateConversationMemory(personality, recentMessages, room) {
    const now = Date.now();

    recentMessages.slice(0, 5).forEach(msg => {
      personality.history?.conversationMemory?.push({
        content: msg.message,
        author: msg.user?.username || 'Unknown',
        timestamp: new Date(msg.created_at).getTime(),
        room: room?.name || 'Unknown',
        relevance: this.calculateMessageRelevance(msg, personality)
      });
    });

    // Keep only recent and relevant memories
    if (personality.history?.conversationMemory) {
      personality.history.conversationMemory = personality.history.conversationMemory
        .filter(memory => now - memory.timestamp < 30 * 60 * 1000)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 15);
    }
  }

  // Calculate how relevant a message is to user's interests
  calculateMessageRelevance(message, personality) {
    let relevance = 0.1;

    const content = message.message?.toLowerCase() || '';
    const interests = personality.history?.topicInterests || [];

    // Check if message contains user's interests
    interests.forEach(interest => {
      if (content.includes(interest)) relevance += 0.3;
    });

    // Check for emotional keywords
    const emotionalKeywords = ['win', 'lose', 'big', 'huge', 'crazy', 'insane', 'rip', 'nice'];
    emotionalKeywords.forEach(keyword => {
      if (content.includes(keyword)) relevance += 0.2;
    });

    return Math.min(1.0, relevance);
  }

  // Enhanced message strategy determination
  determineEnhancedMessageStrategy(personality, isBetRelated, isReply, recentMessages, result, multiplier, room, otherUsers) {
    const strategies = [];
    const now = Date.now();

    // Reaction strategy - enhanced with emotional state
    if (isBetRelated && result) {
      let reactionWeight = result === 'win' ?
        (multiplier >= 5 ? 0.9 : 0.6) :
        ((personality.history?.lossStreak || 0) > 3 ? 0.8 : 0.5);

      // Boost reaction based on emotional state
      const emotionalBoost = {
        'excited': 0.2, 'euphoric': 0.3, 'frustrated': 0.2, 'angry': 0.1
      };
      reactionWeight += emotionalBoost[personality.history?.emotionalState] || 0;

      strategies.push({ type: 'reaction', weight: reactionWeight });
    }

    // Smart continuation strategy
    if (recentMessages.length > 0) {
      const lastMessage = recentMessages[0];
      const messageAge = now - new Date(lastMessage.created_at).getTime();
      const isRelevant = this.calculateMessageRelevance(lastMessage, personality) > 0.3;

      let continuationWeight = 0.3;
      if (messageAge < 30000 && isRelevant) continuationWeight = 0.7;
      if (messageAge < 10000 && isRelevant) continuationWeight = 0.8;

      continuationWeight *= (personality.chattiness || 0.5);
      strategies.push({ type: 'continuation', weight: continuationWeight });
    }

    // Topic starter strategy - based on interests and time
    if (!isBetRelated) {
      let starterWeight = 0.3;

      // Boost if user has social traits
      if (personality.traits?.social) {
        starterWeight += personality.traits?.social?.strength * 0.3;
      }

      // Boost during preferred chat times
      const hour = new Date().getHours();
      if (this.isPreferredChatTime(personality, hour)) {
        starterWeight += 0.2;
      }

      strategies.push({ type: 'starter', weight: starterWeight });
    }

    // Echo strategy for high-energy messages
    const recentHypeMessages = recentMessages.filter(msg =>
      this.isHypeMessage(msg.message) &&
      now - new Date(msg.created_at).getTime() < 15000
    );

    if (recentHypeMessages.length > 0) {
      const echoWeight = personality.traits?.enthusiasm ?
        personality.traits?.enthusiasm?.strength * 0.6 : 0.2;
      strategies.push({ type: 'echo', weight: echoWeight });
    }

    // OpenAI strategy for complex conversations
    if (recentMessages.length >= 2) {
      const openaiWeight = 0.85 + (personality.traits?.analysis ?
        personality.traits?.analysis?.strength * 0.2 : 0);
      strategies.push({ type: 'openai', weight: openaiWeight });
    }

    // Random fallback
    strategies.push({ type: 'random', weight: 0.5 });

    return this.selectWeightedStrategy(strategies);
  }

  // Check if current time matches user's preferred chat time
  isPreferredChatTime(personality, hour) {
    const timePreference = personality.history?.preferredTimeToChat || 'evening';

    switch (timePreference) {
      case 'earlyBird': return hour >= 6 && hour <= 10;
      case 'midDay': return hour >= 10 && hour <= 14;
      case 'afternoon': return hour >= 14 && hour <= 18;
      case 'evening': return hour >= 18 && hour <= 22;
      case 'lateNight': return hour >= 22 || hour <= 2;
      case 'insomniac': return hour >= 2 && hour <= 6;
      default: return false;
    }
  }

  // Check if message contains hype/excitement
  isHypeMessage(message) {
    const hypeWords = ['gg', 'nice', 'wow', 'holy', 'insane', 'huge', 'massive', 'lets go', 'yooo', 'sheesh'];
    const content = message?.toLowerCase() || '';
    return hypeWords.some(word => content.includes(word)) ||
      content.includes('!') ||
      content === content.toUpperCase();
  }

  // Select strategy based on weights
  selectWeightedStrategy(strategies) {
    const totalWeight = strategies.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const strategy of strategies) {
      random -= strategy.weight;
      if (random <= 0) return strategy;
    }

    return strategies[strategies.length - 1];
  }

  // Update user relationships based on interactions
  updateUserRelationships(personality, recentMessages, sentMessage) {
    recentMessages.slice(0, 3).forEach(msg => {
      const author = msg.user?.username;
      if (!author || author === personality.id) return;

      const relationship = personality.history?.relationships?.get(author) || {
        interactions: 0,
        sentiment: 0,
        lastInteraction: 0,
        commonTopics: []
      };

      relationship.interactions += 1;
      relationship.lastInteraction = Date.now();

      // Analyze sentiment of interaction
      if (this.isPositiveInteraction(sentMessage, msg.message)) {
        relationship.sentiment = Math.min(1, relationship.sentiment + 0.1);
      } else if (this.isNegativeInteraction(sentMessage, msg.message)) {
        relationship.sentiment = Math.max(-1, relationship.sentiment - 0.1);
      }

      personality.history?.relationships?.set(author, relationship);
    });

    // Clean up old relationships
    if (personality.history?.relationships) {
      for (const [username, rel] of personality.history.relationships.entries()) {
        if (Date.now() - rel.lastInteraction > 24 * 60 * 60 * 1000) {
          personality.history.relationships.delete(username);
        }
      }
    }
  }

  // Check if interaction is positive
  isPositiveInteraction(sentMessage, receivedMessage) {
    const positiveWords = ['nice', 'good', 'great', 'awesome', 'love', 'like', 'agree', 'yes', 'true'];
    const sent = sentMessage?.toLowerCase() || '';
    const received = receivedMessage?.toLowerCase() || '';

    return positiveWords.some(word => sent.includes(word) || received.includes(word));
  }

  // Check if interaction is negative
  isNegativeInteraction(sentMessage, receivedMessage) {
    const negativeWords = ['bad', 'hate', 'disagree', 'no', 'wrong', 'stupid', 'dumb'];
    const sent = sentMessage?.toLowerCase() || '';
    const received = receivedMessage?.toLowerCase() || '';

    return negativeWords.some(word => sent.includes(word) || received.includes(word));
  }

  // Add message to conversation memory
  addToConversationMemory(personality, message, room) {
    personality.history?.conversationMemory?.push({
      content: message,
      author: 'self',
      timestamp: Date.now(),
      room: room?.name || 'Unknown',
      relevance: 1.0
    });
  }

  // Check if message is unique and relevant
  isMessageUniqueAndRelevant(userId, message, recentMessages) {
    // Check uniqueness
    if (!this.isMessageUnique(userId, message)) return false;

    // Check relevance
    const recentContent = recentMessages.slice(0, 3)
      .map(msg => msg.message?.toLowerCase() || '')
      .join(' ');

    if (recentContent.length > 0) {
      const messageWords = message.toLowerCase().split(' ');
      const recentWords = recentContent.split(' ');
      const commonWords = messageWords.filter(word =>
        word.length > 3 && recentWords.includes(word)
      );

      // If there are recent messages but no common context, reduce relevance
      if (recentMessages.length > 0 && commonWords.length === 0 && Math.random() < 0.1) {
        return false;
      }
    }

    return true;
  }

  // Generate reaction message with randomness and room ticker
  async generateReactionMessage(personality, strategy, result, multiplier, betAmount, room) {
    const intensity = this.calculateReactionIntensity(result, multiplier, betAmount, personality);

    log(`🎯 REACTION DEBUG: Room name = "${room?.name}", Result = ${result}, Multiplier = ${multiplier}`);

    // Handle null room case
    if (!room) {
      log(`⚠️ REACTION: No room provided, creating fake room with name`);
      const fakeNames = ['Moon Shot', 'Diamond Hands', 'To The Moon', 'Bull Run', 'Gem Drop', 'Rocket Launch', 'Ape Strong', 'HODL Gang'];
      room = { name: fakeNames[Math.floor(Math.random() * fakeNames.length)] };
    }

    // For big wins (4x+), use predefined explosive reactions
    if (result === 'win' && multiplier >= 4 && Math.random() < 0.4) {
      const explosiveWins = [
        'HOLY SHIT', 'NO WAY', 'LETS FUCKING GO', 'YOOOOO', 'INSANE',
        'OMG WTF', 'HOLY FUCK', 'JESUS', 'UNREAL', 'SICK HIT'
      ];
      let reaction = explosiveWins[Math.floor(Math.random() * explosiveWins.length)];

      // 50% chance to add room name for big wins
      if (room?.name && room.name.trim() !== '' && Math.random() < 0.5) {
        const roomVariations = this.getRoomNameVariations(room.name);
        const roomName = roomVariations[Math.floor(Math.random() * roomVariations.length)];
        log(`✅ Adding room name to big win reaction: ${roomName}`);
        const roomPhrases = [`${roomName} TO THE MOON`, `${roomName} GOING CRAZY`, `${roomName} PRINTING`];
        reaction += ' ' + roomPhrases[Math.floor(Math.random() * roomPhrases.length)];
      }

      return reaction;
    }

    // For normal reactions, use shorter predefined responses
    if (result === 'win') {
      const winReactions = {
        low: ['nice', 'decent', 'w', 'solid', 'clean'],
        medium: ['good shit', 'lets go', 'yessir', 'W', 'nice one'],
        high: ['huge', 'massive', 'yooo', 'sheesh', 'no way']
      };

      const reactionLevel = multiplier >= 3 ? 'high' : multiplier >= 2 ? 'medium' : 'low';
      const reactions = winReactions[reactionLevel];
      let reaction = reactions[Math.floor(Math.random() * reactions.length)];

      // 30% chance to add room name for normal wins
      if (room?.name && room.name.trim() !== '' && Math.random() < 0.3 && reactionLevel !== 'low') {
        const roomVariations = this.getRoomNameVariations(room.name);
        const roomName = roomVariations[Math.floor(Math.random() * roomVariations.length)];
        log(`✅ Adding room name to win reaction: ${roomName}`);
        const roomPhrases = [`${roomName} hitting`, `love ${roomName}`, `${roomName} W`];
        reaction += ' ' + roomPhrases[Math.floor(Math.random() * roomPhrases.length)];
      }

      return reaction;
    } else {
      const lossReactions = {
        mild: ['rip', 'f', 'L', 'damn', 'ah'],
        frustrated: ['pain', 'oof', 'rough', 'unlucky', 'fml'],
        tilted: ['rigged', 'scam', 'bs', 'done', 'trash game']
      };

      const tiltLevel = personality.history?.lossStreak > 3 ? 'tilted' :
        personality.history?.lossStreak > 1 ? 'frustrated' : 'mild';
      const reactions = lossReactions[tiltLevel];
      let reaction = reactions[Math.floor(Math.random() * reactions.length)];

      // 20% chance to blame the room name for losses
      if (room?.name && room.name.trim() !== '' && Math.random() < 0.2 && tiltLevel === 'tilted') {
        const roomVariations = this.getRoomNameVariations(room.name);
        const roomName = roomVariations[Math.floor(Math.random() * roomVariations.length)];
        log(`✅ Adding room name to loss reaction: ${roomName}`);
        const roomPhrases = [`${roomName} trash`, `${roomName} dead`, `${roomName} scam`];
        reaction += ' ' + roomPhrases[Math.floor(Math.random() * roomPhrases.length)];
      }

      return reaction;
    }
  }

  // Generate continuation message
  async generateContinuationMessage(personality, strategy, recentMessages) {
    const lastMessage = recentMessages[0].message.toLowerCase();
    const lastSender = recentMessages[0].username;
    const userMood = personality.mood;
    const userChattiness = personality.chattiness;

    // Prioritize direct replies to questions
    if (lastMessage.includes('?')) {
      const questionResponse = this.getCreativeQuestionResponse(lastMessage, personality);
      if (questionResponse && questionResponse.length > 0) return questionResponse;
    }

    // Creative specific responses to common phrases
    const creativeResponses = this.getCreativeSpecificResponses(lastMessage, personality);
    if (creativeResponses && creativeResponses.length > 0 && Math.random() < (0.4 + userChattiness * 0.2)) {
      return creativeResponses[Math.floor(Math.random() * creativeResponses.length)];
    }

    // Enhanced betting keywords with creative responses
    const betKeywords = {
      'won': ['nice', 'w', 'gz', 'solid', 'gg', 'teach me sensei', 'share the luck', 'lottery winner vibes', 'printer go brrr', 'bag secured'],
      'lost': ['rip', 'f', 'unlucky', 'pain', 'damn', 'story of my life', 'been there bro', 'welcome to the club', 'rekt', 'down bad'],
      'rigged': ['true', 'facts', 'scam', 'always is', 'house always wins', 'simulation confirmed', 'they watching us', 'conspiracy confirmed'],
      'lucky': ['same', 'need that', 'share some', 'wish', 'horseshoe activated', 'found penny heads up', 'birthday luck', 'rng blessed'],
      'hit': ['huge', 'gz', 'nice one', 'sick', 'unicorn spotted', 'lightning struck twice', 'wizard status', 'god mode'],
      'moon': ['when', 'soon', 'doubt it', 'maybe', 'rocket fuel ready', '2030 confirmed', 'space suit on', 'lambo soon'],
      'dump': ['incoming', 'yep', 'calling it', 'rip', 'gravity activated', 'parachute needed', 'elevator broken', 'bear market vibes'],
      'pump': ['lets go', 'finally', 'doubt it', 'maybe', 'rocket engines on', 'gravity defied', 'momentum building', 'bull run incoming'],
      'charts': ['looking good', 'sus af', 'agree', 'idk', 'crayons activated', 'astrology confirmed', 'tea leaves say', 'technical analysis says yes'],
      'patterns': ['seeing it too', 'always', 'cap', 'maybe', 'matrix glitch', 'deja vu moment', 'fortune teller vibes', 'predictive programming'],
      'volume': ['low af', 'picking up', 'dead', 'decent', 'whisper quiet', 'stadium loud', 'library vibes', 'crickets'],
      'dead': ['fr', 'boring', 'yep', 'always is', 'cemetery vibes', 'flatline confirmed', 'pulse check needed', 'ghost town'],
      'crazy': ['ikr', 'wild', 'love it', 'insane', 'asylum escape', 'sanity optional', 'mental hospital vibes', 'absolute madness']
    };

    for (const [keyword, responses] of Object.entries(betKeywords)) {
      if (lastMessage.includes(keyword)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // General conversation continuations
    const agreements = ['true', 'real', 'facts', 'this', 'same', 'felt', 'fr', 'spitting facts', 'big brain take', 'preach', 'you said it'];
    const neutral = ['lol', 'bruh', 'yo', 'hmm', 'idk', 'maybe', 'damn', 'mood', 'vibes', 'energy', 'true that', 'fair enough'];
    const curious = ['why that?', 'how so?', 'what makes you say that?', 'tell me more'];
    const empathetic = ['i feel that', 'been there', 'tough break', 'hang in there'];

    let responseOptions = [];
    if (userMood === 'optimistic' || userMood === 'excited') {
      responseOptions.push(...agreements, ...neutral);
    } else if (userMood === 'skeptical' || userMood === 'frustrated') {
      responseOptions.push(...neutral, ...curious);
    } else if (userMood === 'bored') {
      responseOptions.push(...neutral, ...curious);
    } else {
      responseOptions.push(...agreements, ...neutral);
    }

    // Add empathetic responses if the last message implies a negative outcome
    if (lastMessage.includes('loss') || lastMessage.includes('rip') || lastMessage.includes('unlucky') || lastMessage.includes('pain')) {
      responseOptions.push(...empathetic);
    }

    // Add a chance to mention the last sender
    if (Math.random() < 0.2 && lastSender) {
      const senderMentions = [`@${lastSender} facts`, `@${lastSender} true`, `yeah ${lastSender}`];
      responseOptions.push(...senderMentions);
    }

    // Ensure variety by combining elements
    if (responseOptions.length > 0) {
      let selectedResponse = responseOptions[Math.floor(Math.random() * responseOptions.length)];

      // Add a filler or intensifier based on personality
      if (personality.speechStyle?.fillers?.enabled && Math.random() < (personality.speechStyle?.fillers?.intensity || 0)) {
        selectedResponse = this.personalityGen.selectRandomElements(personality.speechStyle.fillers.favorites, 1)[0] + ' ' + selectedResponse;
      }
      if (personality.speechStyle?.intensifiers?.enabled && Math.random() < (personality.speechStyle?.intensifiers?.intensity || 0)) {
        selectedResponse = this.personalityGen.selectRandomElements(personality.speechStyle.intensifiers.favorites, 1)[0] + ' ' + selectedResponse;
      }

      return selectedResponse;
    }

    return neutral[Math.floor(Math.random() * neutral.length)];
  }

  // Creative specific responses to common phrases
  getCreativeSpecificResponses(lastMessage, personality) {
    const responses = [];
    const userMood = personality.mood;
    const userHumor = personality.traits?.humor?.strength || 0;
    const userNegativity = personality.traits?.negativity?.strength || 0;

    // Sleep/time related
    if (lastMessage.includes('sleep') || lastMessage.includes('tired')) {
      responses.push(
        'its 4:23am and my cat filing noise complaint', 'energy drinks replaced my blood type', 'neighbors think im dead',
        'pillow collecting dust for 3 days', 'vampire lifestyle activated', 'sunlight is my enemy now',
        'wife filed missing person report', 'counting sheep bankrupted me', 'owl hooting solidarity outside',
        'sunrise number 4 today', 'coffee IV drip installation', 'eyelids held open with toothpicks',
        'sleep is for the weak, and Im feeling pretty strong', 'who needs sleep when you have degen hours?',
        'my bed is just a really big charging pad now'
      );
    }

    // Food related
    if (lastMessage.includes('lunch') || lastMessage.includes('dinner') || lastMessage.includes('food') || lastMessage.includes('eat')) {
      responses.push(
        'eating cereal with water', 'ketchup packets gourmet dinner', 'licking empty peanut butter jar',
        'roommate hiding food now', 'fridge echoing when opened', 'googling which houseplants edible',
        'expired yogurt still good right', 'ice cubes count as hydration', 'toothpaste minty fresh meal',
        'salt and pepper sandwich deluxe', 'food bank vip member', 'delivery driver knows my schedule',
        'my diet consists of hopium and copium', 'just ordered a pizza, hope it arrives before I go broke'
      );
    }

    // Work related
    if (lastMessage.includes('work') || lastMessage.includes('job') || lastMessage.includes('boss') || lastMessage.includes('meeting')) {
      responses.push(
        'bathroom stall day trading', 'zoom camera hides gambling screen', 'boss thinks im having breakdown',
        'resignation letter half written', 'HR investigating browser history', 'conference room nap sanctuary',
        'sick days exhausted by march', 'elevator small talk about weather', 'coffee machine my only friend',
        'stapler collecting dust', 'password is password123', 'printer broken excuse week 6',
        'my job is to gamble, whats yours?', 'just told my boss Im taking a mental health day (gambling)'
      );
    }

    // Money/budget related
    if (lastMessage.includes('broke') || lastMessage.includes('money') || lastMessage.includes('budget') || lastMessage.includes('bank')) {
      responses.push(
        'overdraft fees have overdraft fees', 'credit score lower than room temperature', 'payday loan shark circling',
        'selling organs on dark web', 'mother in law offering loan again', 'plasma donation frequent flyer',
        'car repo man knows my schedule', 'bankruptcy lawyer speed dial', 'garage sale included my soul',
        'change found in washing machine', 'couch cushion treasure hunter', 'birthday money from grandma deployed',
        'my wallet is a ghost town', 'just checking if my bank account still exists'
      );
    }

    // Weather/environment
    if (lastMessage.includes('weather') || lastMessage.includes('hot') || lastMessage.includes('cold') || lastMessage.includes('rain')) {
      responses.push(
        'sweating through winter coat indoors', 'ac unit filing for divorce', 'hell complaining about heat',
        'penguins seeking asylum here', 'weatherman gave up predicting', 'umbrella became sailing equipment',
        'tornado warning personal invitation', 'antarctica sending care packages', 'global warming targeting me personally',
        'desert cactus seeking shade here', 'polar bears moving further north', 'snowman melted into regret puddle',
        'the weather matches my portfolio today', 'its raining Ls outside'
      );
    }

    // Relationship drama
    if (lastMessage.includes('wife') || lastMessage.includes('gf') || lastMessage.includes('relationship') || lastMessage.includes('divorce')) {
      responses.push(
        'lawyers sending friend requests', 'wedding ring in pawn shop window', 'mother in law celebrating early',
        'dog choosing sides custody battle', 'anniversary dinner cancelled forever', 'tinder profile dusting off',
        'couples therapy zoom backgrounds', 'prenup looking prophetic', 'dating apps updating location',
        'honeymoon refund denied', 'valentine gifts returning themselves', 'marriage counselor retiring early',
        'my relationship with gambling is complicated', 'single and ready to mingle (with the charts)'
      );
    }

    // Health/medical
    if (lastMessage.includes('sick') || lastMessage.includes('doctor') || lastMessage.includes('health') || lastMessage.includes('pain')) {
      responses.push(
        'webmd says 3 days left', 'doctor googling my symptoms', 'insurance company blocking number',
        'hospital parking attendant bestie', 'prescription bottles rattling maracas', 'x ray showed gambling addiction',
        'waiting room magazine from 1987', 'heart monitor beeping morse code', 'aspirin bottle judging life choices',
        'my only prescription is more gambling', 'feeling sick to my stomach (from the losses)'
      );
    }

    // Technology chaos
    if (lastMessage.includes('internet') || lastMessage.includes('wifi') || lastMessage.includes('computer') || lastMessage.includes('phone')) {
      responses.push(
        'router plotting against me', 'computer achieved sentience judges me', 'internet explorer still loading 2003',
        'google search history leaked family', 'bluetooth connecting neighbors toaster', 'password manager forgot passwords',
        'captcha convinced im robot', 'autocorrect ruining reputation', 'cloud storage evaporated',
        'my internet is slower than my gains', 'brb, kicking my router'
      );
    }

    // Numbers with conspiracy
    if (lastMessage.includes('1000') || lastMessage.includes('1k')) {
      responses.push(
        'illuminati confirmed', 'simulation glitch detected', 'lizard people celebration milestone',
        'government surveillance achievement', 'alien probing frequency', 'flat earth calculation confirmed',
        'the numbers dont lie, but I do sometimes', '1000 IQ play right there'
      );
    }

    if (lastMessage.includes('100')) {
      responses.push(
        'century mark like my age', '100 percent chance regret', 'hundred ways disappoint family',
        'centennial celebration poor choices', '100 bottles beer wall fell',
        '100x or bust!', 'only 100? rookie numbers'
      );
    }

    return responses;
  }

  getCreativeQuestionResponse(question, personality) {
    const userMood = personality.mood;
    const userChaos = personality.traits?.chaos?.strength || 0;

    let responses = [];

    if (question.includes('time') || question.includes('what time')) {
      responses = [
        'its 4:23am and cat filing noise complaint', 'time stopped when gambling started', 'sundial broke from shame',
        'clock tower resigned from duty', 'grandfather clock disowned me', 'atomic clock needs therapy',
        'rooster forgot how to crow', 'hourglass sand turned tears', 'big ben filing harassment charges',
        'stopwatch running away from home', 'calendar pages burning themselves', 'timezone applied for asylum',
        'time is an illusion, especially when you\'re down bad', 'what\'s time when you\'re chasing gains?',
        'my watch runs on degen hours', 'it\'s always tendie o\'clock somewhere'
      ];
    } else if (question.includes('where') && question.includes('from')) {
      responses = [
        'interdimensional gambling portal', 'witness protection wifi', 'abandoned mall food court',
        'dumpster behind casino stolen wifi', 'underground bunker apocalypse prep', 'spaceship crashed on earth',
        'time machine stuck 2024', 'parallel universe tourist visa', 'cave painting wifi hotspot',
        'tree house mortgage underwater', 'igloo melting global warming', 'library after hours breaking in',
        'the void, where all my crypto went', 'a dark alley, just like my portfolio', 'the moon, soon™'
      ];
    } else if (question.includes('how much') || question.includes('how many')) {
      responses = [
        'enough buy small country debt', 'calculator overflow error', 'infinity scared my losses',
        'mathematics professor career change', 'national debt jealous mine', 'monopoly money inflation crisis',
        'zimbabwe currency exchange rate', 'cryptocurrency mining tears', 'abacus spontaneous combustion',
        'counting sheep unionized strike', 'nasa budget comparison embarrassing', 'number system filing bankruptcy',
        'more than you can afford, pal', 'less than I started with', 'a lot, and not enough'
      ];
    } else if (question.includes('when')) {
      responses = [
        'when pigs fly commercial airlines', 'next solar eclipse leap year', 'when hell freezes thaws',
        'calendar manufacturer bankruptcy filing', 'sundial digital conversion', 'universe heat death postponement',
        'next halley comet boomerang return', 'when netflix cancels favorite show', 'earth rotation reverses direction',
        'time traveler union negotiation', 'rooster alarm clock retirement', 'hourglass sand replacement therapy',
        'soon™, always soon™', 'when the charts say so', 'after this next bet'
      ];
    } else if (question.includes('why')) {
      responses = [
        'cosmic joke writing committee overtime', 'universe debugging session', 'simulation intern programming errors',
        'murphy law enforcement department', 'butterfly effect hurricane category', 'karma collection agency foreclosure',
        'destiny gps recalculation needed', 'fate quality control department', 'luck factory production defect',
        'probability math restraining order', 'reality tv show hidden camera', 'parallel universe admin privileges',
        'because degen', 'it is what it is', 'the market wills it'
      ];
    } else if (question.includes('what') && question.includes('doing')) {
      responses = [
        'interpretive dance for money', 'professional disappointment consultant', 'reality show contestant unwillingly',
        'time traveler stuck loop', 'alien anthropology research subject', 'simulation beta tester unpaid',
        'karma debt collection avoidance', 'existential crisis management', 'universe glitch exploitation specialist',
        'probability defiance certification', 'murphy law doctorate program', 'cosmic joke appreciation society',
        'losing money, what else?', 'contemplating my life choices', 'just vibin and gambling'
      ];
    } else {
      // Default responses
      responses = [
        'crystal ball filed workers compensation', 'magic 8 ball restraining order', 'ouija board spelling errors',
        'fortune teller career change', 'psychic hotline busy signal', 'tarot cards filing bankruptcy',
        'horoscope writer existential crisis', 'astrology degree revoked', 'palm reader hand arthritis',
        'tea leaves need prescription glasses', 'crystal healing insurance claim', 'karma credit score check',
        'ask the devs', 'that\'s above my pay grade', 'the answer is 42', 'only the blockchain knows'
      ];
    }

    return responses.length > 0 ? responses[Math.floor(Math.random() * responses.length)] : null;
  }

  // Generate starter message
  async generateStarterMessage(personality, strategy, room, otherUsers) {
    const timeOfDay = this.getTimeOfDay();
    const roomActivity = this.analyzeRoomActivity(room);

    // Predefined short starters based on context
    const starters = {
      morning: ['gm', 'morning degen', 'early grind', 'coffee time'],
      afternoon: ['lunch break gambling', 'slow day', 'afternoon vibes'],
      evening: ['evening squad', 'prime time', 'dinner can wait'],
      lateNight: ['3am degen hours', 'late night hits', 'sleep overrated']
    };

    const activityStarters = {
      dead: ['dead chat?', 'anyone alive', 'hello?', 'wake up'],
      active: ['room going crazy', 'love the action', 'everyone eating'],
      winning: ['printer on', 'ez money', 'free money day'],
      losing: ['rough day', 'bloodbath', 'down bad']
    };

    let randomStarters = [
      'whos up', 'good vibes only', 'feeling lucky', 'this the one?',
      'chart looking spicy', 'bout to send it', 'patterns looking good',
      'anyone hit big today', 'what we thinking', 'vibes immaculate'
    ];

    // Add room name-specific starters if room has name
    if (room?.name) {
      const roomVariations = this.getRoomNameVariations(room.name);
      const roomStarters = [];

      // Create starters with different room variations
      roomVariations.forEach(roomName => {
        roomStarters.push(
          `${roomName} looking ready`, `${roomName} community active`, `${roomName} chart bullish`,
          `${roomName} holders diamond hands`, `${roomName} fundamentals strong`, `${roomName} ecosystem growing`,
          `${roomName} partnerships incoming`, `${roomName} roadmap on track`, `${roomName} volume building`,
          `${roomName} breakout imminent`, `${roomName} accumulation done`, `${roomName} moon mission starting`
        );
      });

      // 80% chance to use room name starter
      if (Math.random() < 0.8) {
        randomStarters = roomStarters;
      } else {
        randomStarters = [...randomStarters, ...roomStarters.slice(0, 5)];
      }
    }

    // Select starter type
    const starter = Math.random() < 0.3 ?
      (starters[timeOfDay] || randomStarters)[Math.floor(Math.random() * (starters[timeOfDay] || randomStarters).length)] :
      Math.random() < 0.5 ?
        (activityStarters[roomActivity] || randomStarters)[Math.floor(Math.random() * (activityStarters[roomActivity] || randomStarters).length)] :
        randomStarters[Math.floor(Math.random() * randomStarters.length)];

    return starter;
  }

  // Generate echo message (quick reactions)
  generateEchoMessage(personality, recentMessages) {
    const lastMsg = recentMessages[0].message.toLowerCase();

    // Dynamic echo variations
    const echoPatterns = {
      'gg': ['gg', 'ggs', 'GG', 'ggwp', 'ggggg'],
      'nice': ['nice', 'nicee', 'NICE', 'noice', 'very nice'],
      'rip': ['rip', 'rippp', 'RIP', 'f', 'F'],
      'w': ['W', 'WWW', 'big W', 'massive W', 'W chat'],
      'l': ['L', 'LLL', 'big L', 'massive L', 'L + ratio']
    };

    // Find matching pattern
    for (const [trigger, responses] of Object.entries(echoPatterns)) {
      if (lastMsg.includes(trigger)) {
        // Add personality-based variation
        const baseResponse = responses[Math.floor(Math.random() * responses.length)];

        // Random chance to add more
        if (Math.random() < 0.3) {
          const additions = [' fr', ' no cap', ' on god', ' real', ' facts'];
          return baseResponse + additions[Math.floor(Math.random() * additions.length)];
        }

        return baseResponse;
      }
    }

    // Generic agreement/reaction
    const genericEchoes = ['true', 'real', 'facts', 'this', '^', '^^', 'same', 'mood', 'felt'];
    return genericEchoes[Math.floor(Math.random() * genericEchoes.length)];
  }

  // Generate shortened version of room name for chat
  getRoomNameVariations(roomName) {
    if (!roomName || roomName.trim() === '') {
      return ['this room'];
    }

    // Remove emojis using regex
    const cleanName = roomName.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();

    if (cleanName === '') {
      return ['this room'];
    }

    const variations = [];
    const name = cleanName;

    // Add full name
    variations.push(name);

    const words = name.split(/\s+/);

    if (words.length > 1) {
      variations.push(words[0]);

      const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
      if (acronym.length >= 2 && acronym.length <= 5) {
        variations.push(acronym);
      }

      const significantWords = words.filter(word =>
        !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'room', 'game', 'bet']
          .includes(word.toLowerCase())
      );
      if (significantWords.length > 0) {
        variations.push(significantWords[0]);
      }
    } else {
      if (name.length > 5) {
        variations.push(name.substring(0, Math.min(5, name.length)));
      }
    }

    const consonants = name.replace(/[aeiouAEIOU\s]/g, '');
    if (consonants.length >= 2 && consonants.length <= 6) {
      variations.push(consonants);
    }

    return [...new Set(variations)];
  }

  // Extract relevant keywords and themes from room description
  analyzeRoomDescription(description) {
    if (!description || description.trim() === '') {
      return {
        keywords: [],
        themes: [],
        tone: 'neutral'
      };
    }

    const desc = description.toLowerCase();

    // Extract crypto/gambling related keywords
    const cryptoKeywords = [];
    const cryptoTerms = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'doge', 'moon', 'pump', 'hodl', 'diamond', 'hands', 'gem', 'token', 'coin', 'crypto', 'defi', 'nft', 'ape', 'bull', 'bear', 'rocket', 'lambo'];
    cryptoTerms.forEach(term => {
      if (desc.includes(term)) {
        cryptoKeywords.push(term);
      }
    });

    // Extract gambling/game keywords
    const gameKeywords = [];
    const gameTerms = ['bet', 'gamble', 'win', 'lose', 'risk', 'jackpot', 'lucky', 'fortune', 'high', 'stakes', 'prize', 'reward', 'chance', 'odds', 'roll', 'dice', 'cards', 'slot', 'casino', 'roulette'];
    gameTerms.forEach(term => {
      if (desc.includes(term)) {
        gameKeywords.push(term);
      }
    });

    // Determine themes
    const themes = [];
    if (desc.includes('moon') || desc.includes('rocket') || desc.includes('space')) themes.push('space');
    if (desc.includes('diamond') || desc.includes('gem') || desc.includes('precious')) themes.push('luxury');
    if (desc.includes('ape') || desc.includes('monkey') || desc.includes('gorilla')) themes.push('ape');
    if (desc.includes('bull') || desc.includes('bear') || desc.includes('market')) themes.push('trading');
    if (desc.includes('meme') || desc.includes('fun') || desc.includes('lol')) themes.push('meme');
    if (desc.includes('serious') || desc.includes('professional') || desc.includes('strategy')) themes.push('serious');
    if (desc.includes('high') || desc.includes('extreme') || desc.includes('crazy')) themes.push('extreme');

    // Determine tone
    let tone = 'neutral';
    if (desc.includes('fun') || desc.includes('party') || desc.includes('lol') || desc.includes('meme')) tone = 'fun';
    if (desc.includes('serious') || desc.includes('professional') || desc.includes('strategy')) tone = 'serious';
    if (desc.includes('crazy') || desc.includes('wild') || desc.includes('extreme')) tone = 'wild';
    if (desc.includes('safe') || desc.includes('stable') || desc.includes('conservative')) tone = 'conservative';

    return {
      keywords: [...cryptoKeywords, ...gameKeywords],
      themes,
      tone,
      originalText: desc
    };
  }

  // Generate context-aware messages based on room description
  generateDescriptionAwareMessages(roomAnalysis, roomVariations) {
    const messages = [];
    const { keywords, themes, tone } = roomAnalysis;

    // Generate messages based on keywords
    keywords.forEach(keyword => {
      roomVariations.forEach(roomName => {
        switch (keyword) {
          case 'time limit':
          case 'predictions':
          case 'launch':
            messages.push(
              `${roomName} going to the moon`,
              `${roomName} rocket fuel loaded`,
              `${roomName} all-in moonshot`,
              `${roomName} blast off odds`
            );
            break;
          case 'diamond':
          case 'dice':
          case 'cards':
            messages.push(
              `${roomName} high-roller table`,
              `${roomName} roll the dice`,
              `${roomName} shuffle and win`,
              `${roomName} stacked deck plays`
            );
            break;
          case 'gem':
          case 'jackpot':
          case 'vault':
            messages.push(
              `${roomName} jackpot vibes`,
              `${roomName} rare win alert`,
              `${roomName} vault unlocked`,
              `${roomName} hidden fortune`
            );
            break;
          case 'ape':
          case 'yolo':
          case 'degen':
            messages.push(
              `${roomName} full ape mode`,
              `${roomName} degen bets only`,
              `${roomName} zero brain, max gain`,
              `${roomName} send it or regret it`
            );
            break;
          case 'bull':
          case 'green':
            messages.push(
              `${roomName} bullish table`,
              `${roomName} green streak active`,
              `${roomName} pump those bets`,
              `${roomName} charging in hot`
            );
            break;
          case 'bear':
          case 'red':
            messages.push(
              `${roomName} down bad zone`,
              `${roomName} bearish grind`,
              `${roomName} bleeding chips`,
              `${roomName} bracing for losses`
            );
            break;
          case 'high':
          case 'stakes':
          case 'vegas':
            messages.push(
              `${roomName} high stakes only`,
              `${roomName} welcome to Vegas`,
              `${roomName} chips flying`,
              `${roomName} no limit madness`
            );
            break;
          case 'lucky':
          case 'fortune':
          case 'charm':
            messages.push(
              `${roomName} feelin' lucky`,
              `${roomName} lucky streak begins`,
              `${roomName} fortune favors degen`,
              `${roomName} charm activated`
            );
            break;
          case 'flip':
          case 'coin':
            messages.push(
              `${roomName} coinflip central`,
              `${roomName} 50/50 tilt`,
              `${roomName} double or nothing`,
              `${roomName} call it in the air`
            );
            break;
          case 'hot':
          case 'heater':
            messages.push(
              `${roomName} heater run engaged`,
              `${roomName} on fire 🔥`,
              `${roomName} print mode active`
            );
            break;
          case 'cold':
          case 'ice':
            messages.push(
              `${roomName} frozen chips`,
              `${roomName} ice cold streak`,
              `${roomName} bankroll in the freezer`
            );
            break;
          case 'whale':
          case 'vip':
            messages.push(
              `${roomName} whale spotted`,
              `${roomName} VIP bets only`,
              `${roomName} max bet madness`,
              `${roomName} table limit smashed`
            );
            break;
          case 'tilt':
          case 'bust':
          case 'loss':
            messages.push(
              `${roomName} tilt incoming`,
              `${roomName} busted bankroll`,
              `${roomName} chasing losses`,
              `${roomName} one more spin...`
            );
            break;
          case 'grind':
          case 'focus':
            messages.push(
              `${roomName} cold hands, warm heart`,
              `${roomName} focus up`,
              `${roomName} disciplined degen`,
              `${roomName} strategy mode`
            );
            break;
        }
      });
    });

    // Generate messages based on themes
    themes.forEach(theme => {
      roomVariations.forEach(roomName => {
        switch (theme) {
          case 'space':
            messages.push(
              `${roomName} cosmic bets`,
              `${roomName} launch sequence ready`,
              `${roomName} star-bound stakes`
            );
            break;
          case 'luxury':
            messages.push(
              `${roomName} velvet rope vibes`,
              `${roomName} high roller entrance`,
              `${roomName} champagne stakes`
            );
            break;
          case 'ape':
            messages.push(
              `${roomName} monkey business`,
              `${roomName} ape instincts only`,
              `${roomName} banana bankroll`
            );
            break;
          case 'trading':
            messages.push(
              `${roomName} candle watching`,
              `${roomName} scalp and gamble`,
              `${roomName} chart and chips`
            );
            break;
          case 'meme':
            messages.push(
              `${roomName} meme coin energy`,
              `${roomName} rug or moon`,
              `${roomName} stonks only go up`
            );
            break;
          case 'serious':
            messages.push(
              `${roomName} calculated risks`,
              `${roomName} focus zone`,
              `${roomName} pro bettors only`
            );
            break;
          case 'extreme':
            messages.push(
              `${roomName} max degen mode`,
              `${roomName} tilt factory`,
              `${roomName} chaos betting`
            );
            break;
          case 'blackjack':
            messages.push(
              `${roomName} 21 or bust`,
              `${roomName} dealer's sweating`,
              `${roomName} blackjack table hot`
            );
            break;
          case 'poker':
            messages.push(
              `${roomName} all-in bluff`,
              `${roomName} pocket rockets spotted`,
              `${roomName} river gods decide`
            );
            break;
          case 'roulette':
            messages.push(
              `${roomName} red or black?`,
              `${roomName} zero hit incoming`,
              `${roomName} wheel of fate`
            );
            break;
          case 'slots':
            messages.push(
              `${roomName} spinning wilds`,
              `${roomName} bonus round ready`,
              `${roomName} max spin vibes`
            );
            break;
          case 'baccarat':
            messages.push(
              `${roomName} player or banker?`,
              `${roomName} edge play`,
              `${roomName} baccarat heat`
            );
            break;
          case 'craps':
            messages.push(
              `${roomName} 7 out!`,
              `${roomName} roll 'em bones`,
              `${roomName} pass line strong`
            );
            break;
          case 'time':
          case 'limit':
          case 'countdown':
            messages.push(
              `${roomName} final seconds!`,
              `${roomName} last chance to bet`,
              `${roomName} timer ticking...`,
              `${roomName} countdown to chaos`
            );
            break;
          case 'prediction':
          case 'predict':
          case 'guess':
            messages.push(
              `${roomName} place your predictions`,
              `${roomName} guess it right, win big`,
              `${roomName} forecast the outcome`,
              `${roomName} who's your pick?`
            );
            break;
        }
      });
    });

    // Adjust message tone
    if (tone === 'fun') {
      roomVariations.forEach(roomName => {
        messages.push(
          `${roomName} party time`,
          `${roomName} good vibes only`,
          `${roomName} jackpot energy`,
          `${roomName} win or laugh trying`
        );
      });
    } else if (tone === 'serious') {
      roomVariations.forEach(roomName => {
        messages.push(
          `${roomName} serious players only`,
          `${roomName} pro mode active`,
          `${roomName} cold hands gameplay`
        );
      });
    } else if (tone === 'wild') {
      roomVariations.forEach(roomName => {
        messages.push(
          `${roomName} chaos mode on`,
          `${roomName} all-in and pray`,
          `${roomName} tilting for glory`
        );
      });
    }

    return messages;
  }

  // Generate random message (context-aware)
  async generateRandomMessage(personality, strategy, room) {
    // Get recent chat context to make relevant messages
    const recentMessages = await this.getRecentChatMessages(3);
    const recentText = recentMessages.map(m => m.message.toLowerCase()).join(' ');

    // Betting-related messages with room name focus
    let bettingMessages = [];

    log(`🎯 DEBUG: Room name = "${room?.name}", Room description = "${room?.description}"`);

    // Handle null room case
    if (!room) {
      const fakeNames = ['Moon Shot', 'Diamond Hands', 'To The Moon', 'Bull Run', 'Gem Drop', 'Rocket Launch', 'Ape Strong', 'HODL Gang'];
      room = { name: fakeNames[Math.floor(Math.random() * fakeNames.length)] };
    }

    if (room?.name && room.name.trim() !== '') {
      const roomVariations = this.getRoomNameVariations(room.name);

      // Analyze room description for context-aware messaging
      const roomAnalysis = this.analyzeRoomDescription(room.description);

      // Generate description-aware messages (50% of total)
      const descriptionMessages = this.generateDescriptionAwareMessages(roomAnalysis, roomVariations);

      // Generate standard room messages (40% of total)
      const standardMessages = [];
      roomVariations.forEach(roomName => {
        const isShort = roomName.length <= 5 || roomName !== room.name;
        const weight = isShort ? 2 : 1;

        for (let i = 0; i < weight; i++) {
          standardMessages.push(
            `${roomName} looking bullish af`, `${roomName} chart setup insane`, `${roomName} bout to explode`,
            `${roomName} accumulation phase over`, `${roomName} breaking resistance now`, `${roomName} volume spike detected`,
            `${roomName} diamond hands activated`, `${roomName} to the stratosphere`, `${roomName} whale activity confirmed`,
            `${roomName} fundamentals rock solid`, `${roomName} ecosystem expanding fast`, `${roomName} community diamond handed`,
            `${roomName} roadmap execution flawless`, `${roomName} mechanics absolutely perfect`, `${roomName} integration imminent`,
            `${roomName} partnerships just announced`, `${roomName} rewards juicy af`, `${roomName} mechanism just activated`,
            `${roomName} supply shock incoming fast`, `${roomName} institutional adoption starting`, `${roomName} retail fomo beginning now`,
            `${roomName} influencers shilling hard`, `${roomName} twitter trending incoming`, `${roomName} reddit army mobilizing`,
            `${roomName} telegram pumping hard`, `${roomName} discord raids coordinated`, `${roomName} technical analysis bullish`,
            `${roomName} support levels holding`, `${roomName} resistance breaking clean`, `${roomName} momentum building fast`,
            `${roomName} pattern completion imminent`, `${roomName} breakout happening now`, `${roomName} consolidation phase ending`,
            `who's ready for ${roomName} to pump?`, `just aped into ${roomName}`, `this ${roomName} chart is a work of art`,
            `don't sleep on ${roomName}`, `long live ${roomName}`, `my bags are packed for ${roomName}`
          );
        }
      });

      // Generic messages (10% of total)
      const genericMessages = [
        'feeling lucky today', 'one more bet', 'this game rigged?', 'momentum shifting',
        'whats the play?', 'any big wins?', 'just chilling', 'good vibes only',
        'need a loan', 'wheres the co-host?', 'anyone seen the grave?',
        'this is the way', 'wen moon?', 'ngmi', 'wagmi', 'degen life', 'gm', 'gn', 'ser'
      ];

      // Weighted message selection based on description availability
      if (descriptionMessages.length > 0) {
        // Prioritize description-aware messages
        bettingMessages = [
          ...descriptionMessages.slice(0, Math.max(1, Math.floor(descriptionMessages.length * 0.5))),
          ...standardMessages.slice(0, Math.max(1, Math.floor(standardMessages.length * 0.4))),
          ...genericMessages
        ];
        log(`🎯 Generated ${descriptionMessages.length} description-aware messages, using ${bettingMessages.length} total`);
      } else {
        // Fallback to standard messages
        bettingMessages = [...standardMessages, ...genericMessages];
        log(`⚠️ No description keywords found, using standard messages`);
      }
    } else {
      log(`❌ No room name found, using generic messages. Room name: "${room?.name}"`);
      // Fallback if no room name
      bettingMessages = [
        'this game rigged?', 'volume looking good', 'patterns repeating',
        'feeling lucky', 'one more bet', 'bout to break out',
        'calling the top', 'this gonna moon', 'dump incoming',
        'charts looking sus', 'momentum shifting', 'next candle green',
        'whos up', 'anyone else seeing this?', 'what yall thinking',
        'bored af', 'hyped rn', 'not my day', 'should prob sleep',
        'need a loan', 'where\s the co-host?', 'anyone seen the grave?'
      ];
    }

    // Contextual responses based on recent chat
    let contextualMessages = [];

    if (recentText.includes('win') || recentText.includes('won') || recentText.includes('gains')) {
      const roomName = room?.name ? this.getRoomNameVariations(room.name)[Math.floor(Math.random() * this.getRoomNameVariations(room.name).length)] : null;
      contextualMessages = roomName ?
        [`${roomName} delivering gains`, `${roomName} printing money`, `${roomName} community eating good`, 'everyone eating', 'printer on', 'we up!', 'tendies for everyone!'] :
        ['everyone eating', 'printer on', 'ez money', 'love to see it', 'we up!', 'tendies for everyone!'];
    } else if (recentText.includes('loss') || recentText.includes('lost') || recentText.includes('rip') || recentText.includes('down')) {
      const roomName = room?.name ? this.getRoomNameVariations(room.name)[Math.floor(Math.random() * this.getRoomNameVariations(room.name).length)] : null;
      contextualMessages = roomName ?
        [`${roomName} not cooperating`, `${roomName} dumping hard`, `${roomName} betrayed us`, 'rough day', 'down bad', 'f in the chat', 'my portfolio weeps'] :
        ['rough day', 'down bad', 'unlucky', 'pain', 'f in the chat', 'my portfolio weeps'];
    } else if (recentText.includes('rigged') || recentText.includes('scam') || recentText.includes('bs')) {
      const roomName = room?.name ? this.getRoomNameVariations(room.name)[Math.floor(Math.random() * this.getRoomNameVariations(room.name).length)] : null;
      contextualMessages = roomName ?
        [`${roomName} rigged too`, `${roomName} scam confirmed`, `${roomName} devs dumping`, 'always rigged', 'simulation confirmed', 'they watching us'] :
        ['always rigged', 'house always wins', 'facts', 'scam confirmed', 'simulation confirmed', 'they watching us'];
    } else if (recentText.includes('dead') || recentText.includes('boring') || recentText.includes('slow')) {
      const roomName = room?.name ? this.getRoomNameVariations(room.name)[Math.floor(Math.random() * this.getRoomNameVariations(room.name).length)] : null;
      contextualMessages = roomName ?
        [`${roomName} sleeping`, `${roomName} needs catalyst`, `${roomName} community hibernating`, 'wake up chat', 'crickets', 'anyone alive?'] :
        ['wake up chat', 'need action', 'so dead', 'anyone alive?', 'crickets'];
    } else if (recentText.includes('moon') || recentText.includes('pump') || recentText.includes('lambo')) {
      const roomName = room?.name ? this.getRoomNameVariations(room.name)[Math.floor(Math.random() * this.getRoomNameVariations(room.name).length)] : null;
      contextualMessages = roomName ?
        [`${roomName} moon mission`, `${roomName} rocket fuel loaded`, `${roomName} launchpad ready`, 'when moon', 'lambo soon', 'to the moon!'] :
        ['when moon', 'lets go', 'to the moon', 'finally', 'lambo soon!'];
    }

    // General conversation starters
    const generalMessages = [
      'whos up', 'anyone else seeing this?', 'what yall thinking',
      'bored af', 'hyped rn', 'not my day', 'should prob sleep',
      'need a loan', 'where\'s the co-host?', 'anyone seen the grave?',
      'this is the way', 'wen moon?', 'ngmi', 'wagmi', 'degen life', 'gm', 'gn', 'ser',
      'just joined the chat', 'new here, what\'s good?', 'vibes are immaculate',
      'feeling bullish', 'feeling bearish', 'time to ape in', 'yolo',
      'any alpha?', 'what\'s the next big thing?', 'just lost my house', 'just paid off my house'
    ];

    // Weighted selection: 50% betting, 30% contextual, 20% general
    const rand = Math.random();
    if (rand < 0.5) {
      return bettingMessages[Math.floor(Math.random() * bettingMessages.length)];
    } else if (rand < 0.8 && contextualMessages.length > 0) {
      return contextualMessages[Math.floor(Math.random() * contextualMessages.length)];
    } else {
      return generalMessages[Math.floor(Math.random() * generalMessages.length)];
    }
  }

  // Generate contextual reaction message
  async generateContextualReactionMessage(personality, messageStrategy, result, multiplier, betAmount, room) {
    const emotionalState = personality.history?.emotionalState || 'neutral';

    // Get base reaction
    let reaction = await this.generateReactionMessage(personality, messageStrategy, result, multiplier, betAmount, room);

    // Enhance based on emotional state and room context
    if (result === 'win' && emotionalState === 'euphoric' && multiplier >= 3) {
      const extraReactions = ['HOLY SHIT', 'NO WAYYYY', 'LETS FUCKING GOOO', 'YOOOOOOO'];
      reaction = extraReactions[Math.floor(Math.random() * extraReactions.length)];
    } else if (result === 'loss' && emotionalState === 'frustrated') {
      const frustratedReactions = ['this is rigged', 'im done', 'fuck this', 'always happens'];
      reaction = frustratedReactions[Math.floor(Math.random() * frustratedReactions.length)];
    }

    return reaction;
  }

  // Generate smart continuation message that references recent conversation
  async generateSmartContinuationMessage(personality, messageStrategy, recentMessages, room) {
    const relevantMemory = (personality.history?.conversationMemory || [])
      .filter(memory => memory.relevance > 0.3)
      .slice(0, 3);

    if (relevantMemory.length > 0 && Math.random() < 0.4) {
      // Reference something from conversation memory
      const memory = relevantMemory[0];
      if (memory.content && memory.author) {
        const reactions = [
          `yeah ${memory.content.split(' ')[0]}`,
          `same with ${memory.content.split(' ')[0]}`,
          `remember when ${memory.author} said ${memory.content.split(' ').slice(0, 3).join(' ')}`,
          `${memory.author} was right about that`
        ];
        return reactions[Math.floor(Math.random() * reactions.length)];
      }
    }

    // Fallback to regular continuation
    return await this.generateContinuationMessage(personality, messageStrategy, recentMessages);
  }

  // Generate topical starter based on user interests and current context
  async generateTopicalStarterMessage(personality, messageStrategy, room, otherUsers) {
    const interests = personality.history?.topicInterests || [];
    const hour = new Date().getHours();

    // Time-based starters
    if (hour >= 6 && hour <= 10) {
      const morningStarters = ['gm', 'morning vibes', 'early bird gang', 'coffee ready'];
      if (Math.random() < 0.3) {
        return morningStarters[Math.floor(Math.random() * morningStarters.length)];
      }
    } else if (hour >= 22 || hour <= 2) {
      const nightStarters = ['late night crew', 'degen hours', 'cant sleep', 'night shift'];
      if (Math.random() < 0.3) {
        return nightStarters[Math.floor(Math.random() * nightStarters.length)];
      }
    }

    // Interest-based starters
    if (interests.length > 0 && Math.random() < 0.4) {
      const interest = interests[Math.floor(Math.random() * interests.length)];
      const interestStarters = {
        'crypto': ['btc looking good', 'crypto market wild', 'hodl gang'],
        'trading': ['markets crazy today', 'trading view?', 'bull or bear?'],
        'gambling': ['feeling lucky', 'odds looking good', 'risk it for biscuit'],
        'memes': ['memes today fire', 'saw funny meme', 'meme game strong'],
        'games': ['gaming later?', 'new game out', 'who plays'],
        'music': ['song recommendations?', 'music taste?', 'anyone got playlist']
      };

      const starters = interestStarters[interest];
      if (starters) {
        return starters[Math.floor(Math.random() * starters.length)];
      }
    }

    // Fallback to regular starter
    return await this.generateStarterMessage(personality, messageStrategy, room, otherUsers);
  }

  // Generate personalized echo message
  generatePersonalizedEchoMessage(personality, recentMessages) {
    const emotionalState = personality.history?.emotionalState || 'neutral';
    const lastMessage = recentMessages[0];

    if (!lastMessage?.message) return this.generateEchoMessage(personality, recentMessages);

    const content = lastMessage.message.toLowerCase();

    // Emotional state affects echo style
    if (emotionalState === 'excited' || emotionalState === 'euphoric') {
      if (content.includes('win') || content.includes('nice')) {
        return ['YESSSS', 'LETS GOOO', 'HUGE', 'SHEESH'][Math.floor(Math.random() * 4)];
      }
    } else if (emotionalState === 'frustrated' || emotionalState === 'angry') {
      if (content.includes('lose') || content.includes('rip')) {
        return ['same', 'relatable', 'story of my life', 'mood'][Math.floor(Math.random() * 4)];
      }
    }

    // Fallback to regular echo
    return this.generateEchoMessage(personality, recentMessages);
  }

  // Generate contextual random message
  async generateContextualRandomMessage(personality, messageStrategy, room) {
    const emotionalState = personality.history?.emotionalState || 'neutral';
    const interests = personality.history?.topicInterests || [];

    // Emotional state affects random message selection
    if (emotionalState === 'bored') {
      const boredMessages = ['chat dead?', 'anyone alive', 'so quiet', 'wake up chat'];
      if (Math.random() < 0.5) {
        return boredMessages[Math.floor(Math.random() * boredMessages.length)];
      }
    } else if (emotionalState === 'curious') {
      const curiousMessages = ['whats happening', 'missed anything?', 'fills me in', 'whats the move'];
      if (Math.random() < 0.5) {
        return curiousMessages[Math.floor(Math.random() * curiousMessages.length)];
      }
    }

    // Interest-based random messages
    if (interests.length > 0 && Math.random() < 0.3) {
      const interest = interests[Math.floor(Math.random() * interests.length)];
      const interestMessages = {
        'crypto': ['hodl strong', 'diamond hands', 'to the moon'],
        'gambling': ['feeling lucky', 'risk it', 'all in'],
        'memes': ['meme life', 'dank', 'based'],
        'humor': ['lmao', 'comedy gold', 'dead'],
        'tech': ['innovation', 'future tech', 'next level']
      };

      const messages = interestMessages[interest];
      if (messages) {
        return messages[Math.floor(Math.random() * messages.length)];
      }
    }

    // Fallback to regular random
    return await this.generateRandomMessage(personality, messageStrategy, room);
  }

  // Enhanced OpenAI message generation with better context
  async generateOpenAIMessage(personality, room, recentMessages, result, betAmount, multiplier) {
    try {
      const emotionalState = personality.history?.emotionalState;
      const interests = personality.history?.topicInterests || [];

      // Build enhanced context
      const recentContext = recentMessages.slice(0, 7)
        .map(msg => `${msg.user?.username || 'User'}: ${msg.message}`)
        .join('\n');

      const conversationMemory = personality.history?.conversationMemory
        ?.filter(memory => memory.relevance > 0.4)
        ?.slice(0, 6)
        ?.map(memory => `${memory.author}: ${memory.content}`)
        ?.join('\n') || '';

      const personalityDescription = this.personalityGen.buildPersonalityDescription(personality);

      const prompt = `You are a user in a crypto gambling chat room. Your personality: ${personalityDescription}
Current emotional state: ${emotionalState}
Interests: ${interests.join(', ')}
Room: ${room?.name} (${room?.ticker})

Recent conversation:
${recentContext}

${conversationMemory ? `Relevant past context:\n${conversationMemory}\n` : ''}

Your task is to generate a very short (max 5 words), creative, and relevant chat message.
Do not start your message with your username.
Use broken English or sometimes bad english.
Make it sometimes rude and add swearing.
Have personality.
Sometimes make it in a foreign language like Tegalog or Indonesian.
Don't use emojis unless laughing /crying face but rarely.
Sometimes include the Room name.
No exclamation marks.
The message should be a natural continuation of the conversation.
If there was a recent bet, you can react to it.
Recent bet result: ${result}
Bet amount: ${betAmount}
Multiplier: ${multiplier}
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.8 + (personality.traits?.chaos?.strength || 0) * 0.2,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      });

      const message = response.choices[0]?.message?.content?.trim();
      return message && message.length > 0 ? message : null;

    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  // Apply personality transformations
  applyPersonalityTransformations(message, personality) {
    if (!message) return null;

    let transformed = message.toLowerCase();

    // Remove quotes and formal punctuation (but preserve decimals)
    transformed = transformed.replace(/["'`;]/g, '');
    
    // Remove commas and periods only when they're not part of decimal numbers
    transformed = transformed.replace(/\b\d+\.\d+\b/g, (match) => {
      const num = parseFloat(match);
      return Math.ceil(num * 100) / 100;
    });
    
    // Remove periods that aren't part of decimal numbers
    transformed = transformed.replace(/\.(?!\d)/g, '');
    
    // Remove commas that aren't part of large numbers
    transformed = transformed.replace(/,(?!\d{3})/g, '');

    // Apply speech patterns based on personality
    if (personality.speechStyle?.abbreviations?.enabled && Math.random() < (personality.speechStyle?.abbreviations?.intensity || 0)) {
      transformed = this.applyAbbreviations(transformed);
    }

    // Add typos based on personality
    if (Math.random() < (personality.speechStyle?.typoRate || 0)) {
      transformed = this.addDynamicTypos(transformed, personality.speechStyle?.typoRate || 0);
    }

    // Apply caps based on mood and style
    if (Math.random() < (personality.speechStyle?.capsRate || 0) ||
      (personality.mood === 'excited' && Math.random() < 0.5)) {
      transformed = this.applyCapsVariation(transformed, personality);
    }

    // Add endings based on style
    if (personality.speechStyle?.endings?.enabled && Math.random() < 0.7) {
      const ending = personality.speechStyle.endings.favorites[
        Math.floor(Math.random() * personality.speechStyle.endings.favorites.length)
      ];
      if (!transformed.includes(ending)) {
        transformed += ' ' + ending;
      }
    }

    // Add random punctuation/emotes
    if (Math.random() < 0.2) {
      const punctuation = ['?', '??', '???', '!', '!!', '...', '?!', '!?'];
      transformed += punctuation[Math.floor(Math.random() * punctuation.length)];
    }

    return transformed;
  }

  // Dynamic typo generation
  addDynamicTypos(text, typoRate) {
    const words = text.split(' ');

    return words.map(word => {
      if (Math.random() < typoRate && word.length > 2) {
        const typoType = Math.floor(Math.random() * 5);

        switch (typoType) {
          case 0: // Swap adjacent characters
            if (word.length > 3) {
              const pos = Math.floor(Math.random() * (word.length - 1));
              const chars = word.split('');
              [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
              return chars.join('');
            }
            break;
          case 1: // Double character
            const charPos = Math.floor(Math.random() * word.length);
            return word.slice(0, charPos) + word[charPos] + word.slice(charPos);
          case 2: // Missing character
            const missPos = Math.floor(Math.random() * word.length);
            return word.slice(0, missPos) + word.slice(missPos + 1);
          case 3: // Wrong character (nearby key)
            const nearbyKeys = {
              'a': 'sq', 'b': 'vn', 'c': 'xv', 'd': 'sf', 'e': 'wr',
              'f': 'dg', 'g': 'fh', 'h': 'gj', 'i': 'uo', 'j': 'hk',
              'k': 'jl', 'l': 'k', 'm': 'n', 'n': 'bm', 'o': 'ip',
              'p': 'o', 'q': 'wa', 'r': 'et', 's': 'ad', 't': 'ry',
              'u': 'yi', 'v': 'cb', 'w': 'qe', 'x': 'zc', 'y': 'tu', 'z': 'x'
            };
            const wrongPos = Math.floor(Math.random() * word.length);
            const char = word[wrongPos].toLowerCase();
            if (nearbyKeys[char]) {
              const nearby = nearbyKeys[char];
              const newChar = nearby[Math.floor(Math.random() * nearby.length)];
              return word.slice(0, wrongPos) + newChar + word.slice(wrongPos + 1);
            }
            break;
        }
      }
      return word;
    }).join(' ');
  }

  // Apply caps variation based on personality
  applyCapsVariation(text, personality) {
    const capsStyle = Math.floor(Math.random() * 4);

    switch (capsStyle) {
      case 0: // All caps
        return text.toUpperCase();
      case 1: // Random word caps
        return text.split(' ').map(word =>
          Math.random() < 0.5 ? word.toUpperCase() : word
        ).join(' ');
      case 2: // Escalating caps (for emphasis)
        const words = text.split(' ');
        if (words.length > 2) {
          const lastWord = words[words.length - 1].toUpperCase();
          return [...words.slice(0, -1), lastWord].join(' ');
        }
        return text.toUpperCase();
      case 3: // RaNdOm CaPs (chaos mode)
        if (personality.traits?.chaos?.strength > 0.7) {
          return text.split('').map(char =>
            Math.random() < 0.5 ? char.toUpperCase() : char.toLowerCase()
          ).join('');
        }
        return text;
      default:
        return text;
    }
  }

  // Helper methods
  updateUserMoodFromResult(personality, result, multiplier) {
    if (result === 'win') {
      if (personality.history) {
        personality.history.winStreak++;
        personality.history.lossStreak = 0;
      }
      personality.energy += multiplier > 3 ? 20 : 10;
    } else {
      if (personality.history) {
        personality.history.lossStreak++;
        personality.history.winStreak = 0;
      }
      personality.energy -= 15;
    }

    personality.mood = this.personalityGen.shiftMood(
      personality.mood,
      personality.history
    );
  }

  calculateReactionIntensity(result, multiplier, betAmount, personality) {
    let intensity = 5;

    if (result === 'win') {
      intensity += Math.min(5, multiplier);
      intensity += betAmount > 0.1 ? 2 : 0;
    } else {
      intensity += (personality.history?.lossStreak || 0) * 0.5;
      intensity += betAmount > 0.05 ? 1 : 0;
    }

    // Personality modifiers
    if (personality.traits?.enthusiasm) {
      intensity *= 1.2;
    }
    if (personality.traits?.negativity && result === 'loss') {
      intensity *= 1.3;
    }

    return Math.min(10, Math.max(1, Math.floor(intensity)));
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'lateNight';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  analyzeRoomActivity(room) {
    if (!room) return 'normal';

    const recentBattles = room.battles || 0;
    const bankroll = room.user_bet || 0;

    if (recentBattles === 0) return 'dead';
    if (recentBattles > 20) return 'active';
    if (bankroll > room.host_pr * 1.5) return 'winning';
    if (bankroll < room.host_pr * 0.5) return 'losing';

    return 'normal';
  }

  applyAbbreviations(text) {
    const commonAbbreviations = {
      'you': 'u',
      'your': 'ur',
      'youre': 'ur',
      'are': 'r',
      'why': 'y',
      'because': 'bc',
      'probably': 'prob',
      'people': 'ppl',
      'about': 'abt',
      'really': 'rly',
      'something': 'smth',
      'nothing': 'nth',
      'everything': 'everything',
      'anything': 'anyth',
      'tonight': 'tn',
      'tomorrow': 'tmr',
      'already': 'alr',
      'actually': 'acc'
    };

    let result = text;
    for (const [full, abbr] of Object.entries(commonAbbreviations)) {
      if (Math.random() < 0.7) {
        result = result.replace(new RegExp(`\\b${full}\\b`, 'gi'), abbr);
      }
    }

    return result;
  }

  // Core bet simulation methods
  generateRandomBetAmount() {
    const random = Math.random();

    if (random < 0.9) {
      return 0.003 + Math.random() * 0.01;
    } else if (random < 0.97) {
      return 0.015 + Math.random() * 0.015;
    } else if (random < 0.995) {
      return 0.035 + Math.random() * 0.025;
    } else {
      return 0.07 + Math.random() * 0.06;
    }
  }

  generateRandomResult() {
    return Math.random() < 0.50 ? 'win' : 'loss';
  }

  generateRandomMultiplier() {
    const multipliers = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 10.0];
    const weights = [25, 20, 15, 12, 10, 8, 5, 3, 2];

    let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < multipliers.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return multipliers[i];
      }
    }
    return 1.2;
  }

  async getRandomUser() {
    try {
      const userCount = await User.countDocuments({
        status: { $ne: 'banned' },
        totalWagered: { $gt: 1 },
        username: { $nin: this.excludedUsernames }
      });
      if (userCount === 0) {
        log('⚠️ No users found with totalWagered > 1');
        return null;
      }

      const randomSkip = Math.floor(Math.random() * userCount);
      const user = await User.findOne({
        status: { $ne: 'banned' },
        totalWagered: { $gt: 1 },
        username: { $nin: this.excludedUsernames }
      }).skip(randomSkip);
      return user;
    } catch (error) {
      console.error('❌ Error getting random user:', error);
      return null;
    }
  }

  async getRandomOpenRoom() {
    try {
      const openRooms = await Room.find({
        status: 'open',
        user_bet: { $gt: 0.01 }
      })
        .select('name description ticker user_bet host_pr tax status creator battles updated_at joiners image game_type created_at likes dislikes')
        .populate('creator');

      if (openRooms.length === 0) {
        log('⚠️ No open rooms found with host_pr > 0.01');
        return null;
      }

      const randomIndex = Math.floor(Math.random() * openRooms.length);
      const selectedRoom = openRooms[randomIndex];
      return selectedRoom;
    } catch (error) {
      console.error('❌ Error getting random room:', error);
      return null;
    }
  }

  async getUserPreferredRoom(userId, betAmount = 0.1) {
    try {
      // 70% chance to ignore cached room preference to increase variety
      const useCache = Math.random() > 0.7;

      if (useCache && this.recentUserRooms.has(userId.toString())) {
        const roomId = this.recentUserRooms.get(userId.toString());
        const room = await Room.findById(roomId)
          .select('name description ticker user_bet host_pr tax status creator battles updated_at joiners image game_type created_at likes dislikes')
          .populate('creator');

        const minHostPr = betAmount * 2;
        if (room &&
          room.status === 'open' &&
          room.user_bet > 0.2) {
          return room;
        } else {
          this.recentUserRooms.delete(userId.toString());
          log(`⚠️ Room ${roomId} removed from preferences - insufficient liquidity or room variety`);
        }
      }

      // 50% chance to use strict criteria, 50% chance to use any room with user_bet > 0.2
      const useStrictCriteria = Math.random() < 0.5;

      const newRoom = useStrictCriteria
        ? await this.getRandomOpenRoomWithLiquidity(betAmount)
        : await this.getRandomOpenRoom();

      if (newRoom) {
        this.recentUserRooms.set(userId.toString(), newRoom._id);
        setTimeout(() => {
          this.recentUserRooms.delete(userId.toString());
        }, 1 * 60 * 1000);
      }

      return newRoom;
    } catch (error) {
      console.error('❌ Error getting user preferred room:', error);
      return await this.getRandomOpenRoomWithLiquidity(betAmount);
    }
  }

  async getRandomOpenRoomWithLiquidity(betAmount) {
    try {
      const maxPayout = betAmount * 10;

      const openRooms = await Room.find({
        status: 'open',
        user_bet: { $gt: 0.2 }
      })
        .select('name description ticker user_bet host_pr tax status creator battles updated_at joiners image game_type created_at likes dislikes')
        .populate('creator');

      if (openRooms.length === 0) {
        log(`⚠️ No rooms with sufficient liquidity for bet ${betAmount} (criteria: host_pr > ${(betAmount * 2).toFixed(4)})`);
        return await this.getRandomOpenRoom();
      }

      const randomIndex = Math.floor(Math.random() * openRooms.length);
      const selectedRoom = openRooms[randomIndex];
      return selectedRoom;
    } catch (error) {
      console.error('❌ Error getting room with liquidity:', error);
      return await this.getRandomOpenRoom();
    }
  }

  async getOtherRecentUsers(currentUserId, limit = 5) {
    try {
      const Chat = require('../../model/Chat');

      const recentChats = await Chat.find({
        sender: { $ne: currentUserId },
        username: { $nin: this.excludedUsernames }
      })
        .sort({ created_at: -1 })
        .limit(limit)
        .select('username sender')
        .lean();

      return recentChats.map(chat => chat.username).filter(username => username);
    } catch (error) {
      return [];
    }
  }

  async getRecentChatMessages(limit = 3) {
    try {
      const Chat = require('../../model/Chat');
      const recentMessages = await Chat.find({})
        .sort({ created_at: -1 })
        .limit(limit)
        .select('message username sender created_at')
        .lean();

      return recentMessages;
    } catch (error) {
      return [];
    }
  }

  async setUserOnline(user) {
    try {
      await User.updateOne(
        { _id: user._id },
        { last_seen: new Date() }
      );

      this.simulatedOnlineUsers.add(user._id.toString());

      if (this.redisClient) {
        await this.redisClient.setEx(`user:${user._id}:online`, 300, 'true');
        await this.redisClient.setEx(`user:${user._id}:session`, 300, `sim_${user._id}_${Date.now()}`);
      }

    } catch (error) {
      console.error('❌ Error setting user online:', error);
    }
  }

  cleanupSimulatedUsers() {
    const usersToRemove = [];
    for (const userId of this.simulatedOnlineUsers) {
      if (Math.random() < 0.1) {
        usersToRemove.push(userId);
      }
    }

    for (const userId of usersToRemove) {
      this.simulatedOnlineUsers.delete(userId);
    }

    if (usersToRemove.length > 0) {
      this.broadcastOnlineUsers();
    }
  }

  async sendSimulatedChat(user, room, result, betAmount, multiplier) {
    try {
      await this.setUserOnline(user);

      const otherUsers = await this.getOtherRecentUsers(user._id, 5);
      const recentMessages = await this.getRecentChatMessages(8);

      const isBetRelated = Math.random() < 0.7;
      const formalReplyChance = isBetRelated ? 0.4 : 0.5;
      const useReplyToFormat = recentMessages.length > 0 && Math.random() < formalReplyChance;
      const naturalReplyChance = isBetRelated ? 0.8 : 0.95;
      const isNaturalReply = recentMessages.length > 0 && Math.random() < naturalReplyChance;

      const message = await this.generateAIChatMessage(user, room, result, betAmount, multiplier, otherUsers, recentMessages, isNaturalReply, isBetRelated);

      if (!message) {
        return;
      }

      let replyTo = null;
      if (useReplyToFormat && recentMessages.length > 0) {
        const useLatestMessage = Math.random() < 0.8;
        const recentMessage = useLatestMessage ?
          recentMessages[0] :
          recentMessages[Math.floor(Math.random() * Math.min(3, recentMessages.length))];

        if (recentMessage && recentMessage.message) {
          replyTo = {
            senderId: recentMessage.sender || user._id.toString(),
            username: recentMessage.username || 'user',
            rank: recentMessage.rank || 0,
            avatar: recentMessage.avatar || '',
            accessory: recentMessage.accessory || '',
            elite: recentMessage.elite || '',
            message: recentMessage.message,
            messageType: recentMessage.messageType || 'text',
            created_at: recentMessage.created_at || new Date()
          };
        }
      }

      const chatData = {
        sender: user.username,
        senderId: user._id.toString(),
        message: message,
        messageType: 'text',
        messageContent: message,
        avatar: user.avatar || '',
        accessory: user.accessory || '',
        username: user.username,
        elite: user.elite || '',
        rank: user.totalWagered || 0,
        replyTo: replyTo
      };

      await socketController.globalChatSend(this.io, chatData);

      this.broadcastOnlineUsers();

      // Add message to history after successful send
      this.addMessageToHistory(user._id.toString(), message);

      const messageType = isBetRelated ? 'BET-RELATED' : 'CONVERSATIONAL';
      const replyInfo = (isNaturalReply || useReplyToFormat) ? ` (replying to: "${recentMessages[0]?.message?.substring(0, 20)}...")` : '';
    } catch (error) {
      console.error('❌ Error sending simulated chat:', error);
    }
  }

  async sendConversationalChat() {
    try {
      const conversationUser = await this.getRandomUser();
      if (!conversationUser) {
        console.log('⚠️ No user found for conversational chat');
        return;
      }

      await this.setUserOnline(conversationUser);

      // Get a random room for ticker context even in conversational chat
      const randomRoom = await this.getRandomOpenRoom();

      const otherUsers = await this.getOtherRecentUsers(conversationUser._id, 5);
      const recentMessages = await this.getRecentChatMessages(8);

      if (recentMessages.length === 0 && otherUsers.length < 2) return;

      const isNaturalReply = recentMessages.length > 0 && Math.random() < 0.95;
      const isBetRelated = Math.random() < 0.4;
      const message = await this.generateAIChatMessage(conversationUser, randomRoom, null, 0, 0, otherUsers, recentMessages, isNaturalReply, isBetRelated);

      if (!message) {
        console.log('⚠️ No message generated for conversational chat');
        return;
      }

      let replyTo = null;
      if (isNaturalReply && recentMessages.length > 0 && Math.random() < 0.35) {
        const useLatestMessage = Math.random() < 0.8;
        const recentMessage = useLatestMessage ?
          recentMessages[0] :
          recentMessages[Math.floor(Math.random() * Math.min(3, recentMessages.length))];

        if (recentMessage && recentMessage.message) {
          replyTo = {
            senderId: recentMessage.sender || conversationUser._id.toString(),
            username: recentMessage.username || 'user',
            rank: recentMessage.rank || 0,
            avatar: recentMessage.avatar || '',
            accessory: recentMessage.accessory || '',
            elite: recentMessage.elite || '',
            message: recentMessage.message,
            messageType: recentMessage.messageType || 'text',
            created_at: recentMessage.created_at || new Date()
          };
        }
      }

      const chatData = {
        sender: conversationUser.username,
        senderId: conversationUser._id.toString(),
        message: message,
        messageType: 'text',
        messageContent: message,
        avatar: conversationUser.avatar || '',
        accessory: conversationUser.accessory || '',
        username: conversationUser.username,
        elite: conversationUser.elite || '',
        rank: conversationUser.totalWagered || 0,
        replyTo: replyTo
      };

      await socketController.globalChatSend(this.io, chatData);

      // Add message to history after successful send
      this.addMessageToHistory(conversationUser._id.toString(), message);

      const replyInfo = isNaturalReply && recentMessages.length > 0 ? ` (continuing conversation from: "${recentMessages[0]?.message?.substring(0, 20)}...")` : '';

    } catch (error) {
      console.error('❌ Error sending conversational chat:', error);
    }
  }

  calculateWinnings(betAmount, result, multiplier, roomTax = 5) {
    const systemTax = 2;
    const totalTax = roomTax + systemTax;

    if (result === 'win') {
      const grossWinnings = betAmount * multiplier;
      const commission = grossWinnings * (totalTax / 100);
      const netWinnings = grossWinnings - commission;
      return {
        grossWinnings,
        netWinnings,
        commission,
        gameResult: 1
      };
    } else {
      return {
        grossWinnings: 0,
        netWinnings: -betAmount,
        commission: 0,
        gameResult: -1
      };
    }
  }

  async simulateRoomReaction() {
    try {
      // Get a random room (prefer active rooms)
      const randomRoom = await this.getRandomOpenRoom();
      if (!randomRoom) {
        return;
      }

      // Get a random user to react
      const randomUser = await this.getRandomUser();
      if (!randomUser) {
        return;
      }

      // Check if user already liked/disliked this room
      const hasLiked = randomRoom.likes && randomRoom.likes.includes(randomUser._id);
      const hasDisliked = randomRoom.dislikes && randomRoom.dislikes.includes(randomUser._id);

      if (hasLiked || hasDisliked) {
        return;
      }

      // 60% chance to like, 40% chance to dislike
      const isLike = Math.random() < 0.54;
      const reactionType = isLike ? 'likes' : 'dislikes';

      // Add the reaction
      if (isLike) {
        if (!randomRoom.likes) randomRoom.likes = [];
        randomRoom.likes.push(randomUser._id);
      } else {
        if (!randomRoom.dislikes) randomRoom.dislikes = [];
        randomRoom.dislikes.push(randomUser._id);
      }

      // Save the room with the new reaction
      await randomRoom.save();

      // Emit socket events for room updates
      if (this.io) {
        // Specific reaction update
        this.io.sockets.emit('ROOM_REACTION_UPDATE', {
          roomId: randomRoom._id,
          reactionType,
          newCount: randomRoom[reactionType].length,
          userId: randomUser._id,
          username: randomUser.username
        });

        // General room data update for cache refresh
        const roomUpdateData = {
          _id: randomRoom._id,
          name: randomRoom.name,
          user_bet: randomRoom.user_bet,
          host_pr: randomRoom.host_pr,
          battles: randomRoom.battles,
          likes: randomRoom.likes || [],
          dislikes: randomRoom.dislikes || [],
          updated_at: new Date(),
          status: randomRoom.status,
          image: randomRoom.image,
          ticker: randomRoom.ticker,
          game_type: randomRoom.game_type,
          description: randomRoom.description,
          created_at: randomRoom.created_at
        };

        // Only emit targeted events, not ROOMS_UPDATED which refreshes all cards
        this.io.sockets.emit('ROOM_DATA_UPDATE', {
          roomId: randomRoom._id,
          roomData: roomUpdateData,
          updateType: 'reaction',
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('❌ Error simulating room reaction:', error);
    }
  }

  async simulateBets() {
    try {
      const numBets = Math.floor(Math.random() * 6) + 3; // 3-8 bets per cycle (was 1-4)

      // 15% chance to add a like/dislike to a random room
      if (Math.random() < 0.1) {
        await this.simulateRoomReaction();
      }

      const useSameUser = Math.random() < 0.7;
      let intervalUser = null;
      let intervalRoom = null;

      if (useSameUser) {
        intervalUser = await this.getRandomUser();
        if (intervalUser) {
          const potentialBetAmount = parseFloat(this.generateRandomBetAmount().toFixed(6));
          intervalRoom = await this.getUserPreferredRoom(intervalUser._id, potentialBetAmount);
        }
      }

      for (let i = 0; i < numBets; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 8000 + 1000));
        }
        await this.simulateSingleBet(intervalUser, intervalRoom);
      }
    } catch (error) {
      console.error('❌ Error in bet simulations:', error);
    }
  }

  async simulateSingleBet(providedUser = null, providedRoom = null) {
    try {
      let user, room;

      if (providedUser && providedRoom) {
        user = providedUser;
        room = providedRoom;
      } else if (providedUser) {
        user = providedUser;
        const betAmount = parseFloat(this.generateRandomBetAmount().toFixed(6));
        room = await this.getUserPreferredRoom(user._id, betAmount);
      } else {
        user = await this.getRandomUser();
        if (user) {
          const betAmount = parseFloat(this.generateRandomBetAmount().toFixed(6));
          room = await this.getUserPreferredRoom(user._id, betAmount);
        }
      }

      if (!user || !room) {
        return;
      }

      let betAmount = parseFloat(this.generateRandomBetAmount().toFixed(6));
      const result = this.generateRandomResult();
      const multiplier = result === 'win' ? this.generateRandomMultiplier() : 1;

      // VALIDATION: Prevent room from ending due to insufficient liquidity
      if (result === 'win') {
        const maxPayout = betAmount * (multiplier - 1);
        const minimumLiquidity = 0.01; // Keep room alive with minimum liquidity
        
        // If payout would drain the room below minimum, reduce bet amount
        if (room.user_bet - maxPayout < minimumLiquidity) {
          const maxAffordableBet = (room.user_bet - minimumLiquidity) / (multiplier - 1);
          
          if (maxAffordableBet <= 0.001) {
            // Skip this bet entirely if room can't afford even a tiny bet
            console.log(`⚠️  Skipping simulated bet: Room ${room.name} has insufficient liquidity (${room.user_bet}) for ${multiplier}x multiplier`);
            return;
          }
          
          // Reduce bet amount to what room can afford
          betAmount = Math.max(0.001, parseFloat(maxAffordableBet.toFixed(6)));
          console.log(`📉 Reduced simulated bet from ${parseFloat(this.generateRandomBetAmount().toFixed(6))} to ${betAmount} to preserve room liquidity`);
        }
      }

      const winnings = this.calculateWinnings(betAmount, result, multiplier, room.tax || 5);

      const customBetItem = new CustomBetItem({
        joiner: user._id,
        room: room._id,
        bet_amount: betAmount,
        result: result,
        multiplier: result === 'win' ? multiplier : 1,
        status: 'simulated'
      });

      await customBetItem.save();

      const gameLog = new GameLog({
        room: room._id,
        creator: room.creator._id,
        joined_user: user._id,
        bet_amount: betAmount,
        commission: winnings.commission,
        game_result: winnings.gameResult,
        winnings: winnings.netWinnings,
        multiplier: result === 'win' ? multiplier : 1.0,
        host_pr: room.host_pr,
        user_bet: room.user_bet,
        status: 'simulated'
      });

      await gameLog.save();

      await gameLog.populate([
        {
          path: 'room',
          select: 'name _id room_number status created_at image ticker description game_type'
        },
        {
          path: 'creator',
          select: 'username avatar rank accessory elite totalWagered'
        },
        {
          path: 'joined_user',
          select: 'username avatar rank accessory elite totalWagered'
        }
      ]);

      const transaction = new GameTransaction({
        user: user._id,
        amount: winnings.netWinnings,
        description: `${result === 'win' ? 'Winnings' : 'Loss'} in ${room.name} (SIMULATED)`,
        room: room._id.toString(),
        room_name: room.name,
        status: 'simulated',
        connectedAccount: 'SIMULATION'
      });

      await transaction.save();

      // Store pre-bet state for debugging
      const preBetUserBet = room.user_bet;
      const preBetHostPr = room.host_pr;

      if (result === 'loss') {
        room.user_bet += betAmount * 0.93;
        room.host_pr += betAmount * 0.93;
      } else {
        const payout = betAmount * (multiplier - 1);
        room.host_pr -= payout;
        room.user_bet = Math.max(0, room.user_bet - payout);
        
        // Additional safety check - this should never trigger with our validation
        if (room.user_bet < 0.001 && preBetUserBet > 0.01) {
          console.error(`🚨 CRITICAL: Room ${room.name} unexpectedly drained despite validation!`);
          console.error(`   Pre-bet: user_bet=${preBetUserBet}, host_pr=${preBetHostPr}`);
          console.error(`   Bet: ${betAmount} @ ${multiplier}x, Payout: ${payout}`);
          console.error(`   Post-bet: user_bet=${room.user_bet}, host_pr=${room.host_pr}`);
        }
      }

      if (room.host_pr < 0.01) {
        room.host_pr = 0.01;
      }

      // Handle room end case - set status to finished when user_bet hits 0
      if (room.user_bet <= 0.001) {
        console.log(`🏁 SIMULATION ROOM ENDED: ${room.name} (ID: ${room._id})`);
        console.log(`   Final state: user_bet=${room.user_bet}, host_pr=${room.host_pr}`);
        console.log(`   Last bet: ${betAmount} @ ${multiplier}x = ${result} (${result === 'win' ? 'PAYOUT' : 'LOSS'})`);
        console.log(`   This should not happen with the new validation logic!`);
        
        room.status = 'finished';
        room.user_bet = 0;
        if (this.io && this.io.sockets) {
          this.io.sockets.emit('ROOM_ENDED', { roomId: room._id });
        }
      }

      room.battles ??= 0;
      room.battles += 1;
      room.updated_at = new Date();
      await room.save();

      // Emit room data update for frontend cache refresh
      if (this.io) {
        const roomUpdateData = {
          _id: room._id,
          name: room.name,
          user_bet: room.user_bet,
          host_pr: room.host_pr,
          battles: room.battles,
          likes: room.likes || [],
          dislikes: room.dislikes || [],
          updated_at: new Date(),
          status: room.status,
          image: room.image,
          ticker: room.ticker,
          game_type: room.game_type,
          description: room.description,
          created_at: room.created_at,
          updated_at: room.updated_at
        };

        // Only emit targeted events, not ROOMS_UPDATED which refreshes all cards
        this.io.sockets.emit('ROOM_DATA_UPDATE', {
          roomId: room._id,
          roomData: roomUpdateData,
          updateType: 'bet_simulation',
          timestamp: Date.now()
        });
      }

      const newTransactionAmount = winnings.netWinnings;

      user.gamePlayed = (user.gamePlayed || 0) + 1;
      user.gameProfit = (user.gameProfit || 0) + newTransactionAmount;
      user.totalWagered = (user.totalWagered || 0) + Math.abs(betAmount);

      const host = room.creator;
      host.gamePlayed = (host.gamePlayed || 0) + 1;
      host.gameProfit = (host.gameProfit || 0) + (newTransactionAmount * -1);
      host.totalWagered = (host.totalWagered || 0) + Math.abs(betAmount);

      await Promise.all([
        user.save(),
        host.save()
      ]);

      if (this.io) {
        const now = new Date();
        const timeBucket = Math.floor(now.getTime() / 1000);
        // From liquidity pool perspective:
        // - Player wins (result === 'win') = liquidity decreases = sell volume (red candle)
        // - Player loses (result === 'loss') = liquidity increases = buy volume (green candle)
        const liquidityIncreases = result === 'loss'; // Player loss = liquidity increase

        // IMPORTANT: room.user_bet already contains the NEW value (after transaction)
        const currentLiquidity = room.user_bet; // After transaction
        
        // The open should be the previous candle's close (which should equal the pre-transaction liquidity)
        const openValue = currentLiquidity - newTransactionAmount; // Before transaction
        const closeValue = currentLiquidity; // After transaction

        const newCandle = {
          _id: timeBucket,
          open: openValue,
          close: closeValue,
          high: Math.max(closeValue, openValue),
          low: Math.min(closeValue, openValue),
          volume: Math.abs(newTransactionAmount),
          buyVolume: liquidityIncreases ? Math.abs(newTransactionAmount) : 0,
          sellVolume: liquidityIncreases ? 0 : Math.abs(newTransactionAmount),
          startTime: new Date(timeBucket * 1000)
        };

        this.io.sockets.emit(`NEW_CANDLE_${room._id}`, { newCandle });

        const bankrollPayload = {
          bankroll: room.user_bet,
          host_pr: room.host_pr,
          custom: customBetItem,
          room: room._id,
          user: user
        };

        this.io.sockets.emit(`UPDATED_BANKROLL_${room._id}`, bankrollPayload);

        try {
          const convertedGameLog = await convertGameLogToHistoryStyle([gameLog]);
          if (convertedGameLog && convertedGameLog.length > 0) {
            this.io.sockets.emit('NEW_LOG', {
              newLog: convertedGameLog,
              isHighPriority: true,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Error converting game log for socket emission:', error);
        }

        const notificationData = {
          _id: user._id,
          message: `${result === 'win' ? 'Won' : 'Lost'} ${Math.abs(winnings.netWinnings).toFixed(6)} SOL in ${room.name} (SIMULATED)`,
          username: user.username,
          avatar: user.avatar,
          amount: winnings.netWinnings,
          accessory: user.accessory || '',
          elite: user.elite || '',
          room: room._id,
          rank: user.totalWagered || 0,
          created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
          created_at_str: moment(new Date()).format('LLL'),
          updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
          is_read: false
        };

        socketController.sendNotification(user._id.toString(), notificationData);

        // Determine highlight intensity and duration based on bet significance
        let intensity = 'normal';
        let duration = 5000;

        const winAmount = result === 'win' ? betAmount * (multiplier - 1) : 0;
        const isBigBet = betAmount >= 0.1;
        const isBigWin = winAmount >= 0.2;
        const isHugeBet = betAmount >= 0.5;
        const isHugeWin = winAmount >= 1.0;

        if (isHugeWin || isHugeBet) {
          intensity = 'legendary';
          duration = 15000;
        } else if (isBigWin || isBigBet) {
          intensity = 'epic';
          duration = 12000;
        } else if (winAmount >= 0.05 || betAmount >= 0.05) {
          intensity = 'violent';
          duration = 8000;
        } else {
          intensity = 'normal';
          duration = 4000;
        }

        this.io.sockets.emit('HIGHLIGHT_FIRST_ROOM', {
          roomId: room._id,
          betAmount: betAmount,
          result: result,
          multiplier: result === 'win' ? multiplier : undefined,
          username: user.username,
          intensity: intensity,
          duration: duration
        });

        const roomClients = this.io.sockets.adapter.rooms.get(room._id.toString())?.size || 0;
        this.io.to(room._id.toString()).emit('ROOM_ACTIVITY_BURST', {
          type: 'new_bet',
          user: user.username,
          amount: betAmount,
          result: result,
          timestamp: Date.now()
        });

        // Higher chance of bet-related chat after a bet
        if (Math.random() < 0.05) {
          setTimeout(async () => {
            await this.sendSimulatedChat(user, room, result, betAmount, multiplier);
          }, Math.random() * 2500 + 500);
        }

        // Lower chance of conversational chat, but still some
        if (Math.random() < 0.03) {
          setTimeout(async () => {
            await this.sendConversationalChat();
          }, Math.random() * 5000 + 1000);
        }
      }

      this.simulationCount++;

    } catch (error) {
      console.error('❌ Error in bet simulation:', error);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Bet simulation cron is already running');
      return;
    }

    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      await this.simulateBets();
    }, {
      scheduled: false
    });

    this.cleanupJob = cron.schedule('0 * * * * *', () => {
      this.cleanupSimulatedUsers();
    }, {
      scheduled: false
    });

    // Add dedicated chat simulation every 30 seconds
    this.chatJob = cron.schedule('*/30 * * * * *', async () => {
      // 60% chance to trigger a conversational chat
      if (Math.random() < 0.03) {
        await this.sendConversationalChat();
      }
    }, {
      scheduled: false
    });

    this.cronJob.start();
    this.cleanupJob.start();
    this.chatJob.start();
    this.isRunning = true;
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Bet simulation cron stopped');
    }
    if (this.cleanupJob) {
      this.cleanupJob.stop();
      console.log('🛑 Cleanup cron stopped');
    }
    if (this.chatJob) {
      this.chatJob.stop();
      console.log('🛑 Chat simulation cron stopped');
    }
  }

  broadcastOnlineUsers() {
    try {
      const socketController = require('../../socketController');

      const realOnlineUsers = socketController.getOnlineUsers();

      const allOnlineUsers = [...new Set([...realOnlineUsers, ...this.simulatedOnlineUsers])];

      this.io.sockets.emit('ONLINE_STATUS_UPDATED', {
        user_list: allOnlineUsers
      });

    } catch (error) {
      console.error('❌ Error broadcasting online users:', error);
    }
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      simulationCount: this.simulationCount,
      startTime: this.startTime
    };
  }
}

function initializeBetSimulation(io, redisClient = null) {
  const simulator = new BetSimulator(io);

  if (redisClient) {
    simulator.redisClient = redisClient;
  }

  setTimeout(() => {
    simulator.start();
  }, 10000);

  return simulator;
}

module.exports = {
  BetSimulator,
  initializeBetSimulation
};