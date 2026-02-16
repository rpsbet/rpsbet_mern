const mongoose = require('mongoose');
const moment = require('moment');

const FORCE_DUMMY = process.env.USE_DUMMY_DATA === 'true';

const shouldUseDummyData = () => FORCE_DUMMY || mongoose.connection.readyState !== 1;

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const svgDataUrl = (label, bg) => {
  const safeLabel = String(label || '').slice(0, 3).toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" rx="16" ry="16" fill="${bg}"/>` +
    `<text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#ffffff">${safeLabel}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const dummyUsers = [
  {
    _id: 'u-1',
    username: 'Astra',
    avatar: svgDataUrl('A', '#ff6b6b'),
    accessory: 'crown',
    elite: 'red',
    totalWagered: 18240,
    status: 'on',
    balance: 42.5,
  },
  {
    _id: 'u-2',
    username: 'Nova',
    avatar: svgDataUrl('N', '#4ecdc4'),
    accessory: 'halo',
    elite: '',
    totalWagered: 9420,
    status: 'on',
    balance: 18.2,
  },
  {
    _id: 'u-3',
    username: 'Cipher',
    avatar: svgDataUrl('C', '#845ef7'),
    accessory: 'visor',
    elite: 'blue',
    totalWagered: 15330,
    status: 'on',
    balance: 67.9,
  },
  {
    _id: 'u-4',
    username: 'Blitz',
    avatar: svgDataUrl('B', '#ffd43b'),
    accessory: 'spark',
    elite: '',
    totalWagered: 5080,
    status: 'on',
    balance: 6.4,
  },
  {
    _id: 'u-5',
    username: 'Echo',
    avatar: svgDataUrl('E', '#5c7cfa'),
    accessory: 'mask',
    elite: 'red',
    totalWagered: 22110,
    status: 'on',
    balance: 120.7,
  },
  {
    _id: 'u-6',
    username: 'Lumen',
    avatar: svgDataUrl('L', '#12b886'),
    accessory: 'gem',
    elite: '',
    totalWagered: 7340,
    status: 'on',
    balance: 14.8,
  },
];

const roomSeeds = [
  { name: 'Neon Dice Arena', ticker: 'DICE', game_type: ['casino', 'dice'], description: 'Roll neon dice for stacked multipliers.', color: '#1f8ef1' },
  { name: 'Solar Crash', ticker: 'CRSH', game_type: ['casino', 'crash'], description: 'Cash out before the solar flare hits.', color: '#ff922b' },
  { name: 'Prism Poker', ticker: 'PKR', game_type: ['cards', 'casino'], description: 'Fast hands, bright blinds, big pots.', color: '#845ef7' },
  { name: 'Turbo Slots', ticker: 'SLOT', game_type: ['casino', 'slots'], description: 'High-speed reels with bonus streaks.', color: '#20c997' },
  { name: 'Quantum RPS', ticker: 'RPS', game_type: ['casual', 'arcade'], description: 'Classic RPS with quantum twists.', color: '#748ffc' },
  { name: 'Meteor Dash', ticker: 'DASH', game_type: ['arcade', 'action'], description: 'Dodge meteors and chase streaks.', color: '#ff6b6b' },
  { name: 'Glacier Slide', ticker: 'ICE', game_type: ['puzzle', 'casual'], description: 'Slide tiles to unlock icy combos.', color: '#4dabf7' },
  { name: 'Circuit Clash', ticker: 'CLSH', game_type: ['strategy', 'arcade'], description: 'Outplay opponents in circuit duels.', color: '#12b886' },
  { name: 'Lunar Loot', ticker: 'MOON', game_type: ['adventure', 'casual'], description: 'Collect lunar relics for boosted payouts.', color: '#ced4da' },
  { name: 'Dragon Run', ticker: 'DRGN', game_type: ['action', 'runner'], description: 'Sprint with dragons for fire multipliers.', color: '#ff8787' },
  { name: 'Cyber Blackjack', ticker: 'BJ', game_type: ['cards', 'casino'], description: 'Hit 21 with cyber-styled decks.', color: '#495057' },
  { name: 'Stellar Spin', ticker: 'SPIN', game_type: ['casino', 'wheel'], description: 'Spin the galaxy wheel for jackpots.', color: '#91a7ff' },
  { name: 'Volt Volley', ticker: 'VOLT', game_type: ['sports', 'arcade'], description: 'Volley for electric streak bonuses.', color: '#ffec99' },
  { name: 'Rune Runner', ticker: 'RUNE', game_type: ['adventure', 'arcade'], description: 'Dash through runes for mystic wins.', color: '#b197fc' },
  { name: 'Zen Mines', ticker: 'MINE', game_type: ['puzzle', 'casino'], description: 'Find safe tiles, avoid the mines.', color: '#20c997' },
  { name: 'Velocity Vibe', ticker: 'VIBE', game_type: ['racing', 'casual'], description: 'Speed laps for turbo rewards.', color: '#74c0fc' },
  { name: 'Astro Roulette', ticker: 'ROUL', game_type: ['casino', 'roulette'], description: 'Orbit the numbers and lock wins.', color: '#ffa94d' },
  { name: 'Pixel Raid', ticker: 'RAID', game_type: ['action', 'multiplayer'], description: 'Raid dungeons for stacked loot.', color: '#fab005' },
];

const now = Date.now();

const buildHosts = (creator, stake) => ([
  {
    host: creator._id,
    rank: creator.totalWagered,
    avatar: creator.avatar,
    username: creator.username,
    walletAddress: 'offline-wallet',
    accessory: creator.accessory,
    elite: creator.elite,
    share: 100,
    stake,
  },
]);

const dummyRooms = roomSeeds.map((seed, index) => {
  const creator = dummyUsers[index % dummyUsers.length];
  const createdAt = new Date(now - (index + 1) * 36 * 60 * 1000);
  const updatedAt = new Date(now - index * 18 * 60 * 1000);
  const userBet = Number((8 + index * 1.7).toFixed(2));
  const betAmount = Number((userBet * 0.2).toFixed(2));
  const likes = dummyUsers
    .filter((_, idx) => idx % 2 === index % 2)
    .map((user) => user._id);
  const dislikes = dummyUsers
    .filter((_, idx) => idx % 3 === index % 3)
    .map((user) => user._id)
    .slice(0, 2);

  return {
    _id: `room-${index + 1}`,
    room_number: 100 + index + 1,
    name: seed.name,
    description: seed.description,
    image: svgDataUrl(seed.ticker, seed.color),
    ticker: seed.ticker,
    game_type: seed.game_type,
    bet_amount: betAmount,
    user_bet: userBet,
    pr: Number((userBet * 0.35).toFixed(2)),
    host_pr: Number((userBet * 0.75).toFixed(2)),
    endgame_type: true,
    endgame_amount: Number((userBet * 2).toFixed(2)),
    is_private: false,
    status: 'open',
    created_at: createdAt,
    updated_at: updatedAt,
    battles: (index * 7) % 140,
    likes,
    dislikes,
    creator: creator._id,
    joiners: dummyUsers
      .filter((user) => user._id !== creator._id)
      .slice(0, 2)
      .map((user) => user._id),
    hosts: buildHosts(creator, userBet),
    website_link: '',
    telegram_link: '',
    x_link: '',
    tax: 0.0,
    pool_id: '',
  };
});

const dummyState = {
  globalChatLogs: [],
  directMessages: [],
};

const historyActionToResult = (action) => {
  switch (action) {
    case 'won':
      return 1;
    case 'lost':
      return -1;
    case 'created':
      return -3000;
    case 'split':
      return 0;
    case 'rugged':
      return -100;
    case 'receivedAutoPayout':
      return 3;
    case 'jeet':
      return 666;
    case 'pumped':
      return 444;
    case 'withdrew':
      return 777;
    default:
      return -1;
  }
};

const buildHistoryEntry = ({ id, room, creator, joinedUser, action, createdAt, multiplier }) => {
  const betAmount = Number(room.bet_amount || 0.1);
  const winnings = action === 'won'
    ? Number((betAmount * (multiplier || 1.8)).toFixed(3))
    : action === 'split'
      ? Number((betAmount * 1).toFixed(3))
      : 0;

  return {
    _id: id,
    game_result: historyActionToResult(action),
    created_at: createdAt,
    ai_mode: '',
    hosts: room.hosts || [],
    commission: 0,
    endgame_amount: room.endgame_amount || 0,
    host_pr: room.host_pr || 0,
    bet_amount: betAmount,
    winnings,
    user_bet: Number(room.user_bet || betAmount),
    multiplier: multiplier || 1.0,
    action,
    room: {
      _id: room._id,
      room_number: room.room_number,
      status: room.status || 'open',
      created_at: room.created_at,
      image: room.image,
      ticker: room.ticker,
    },
    creator: creator ? {
      _id: creator._id,
      avatar: creator.avatar,
      totalWagered: creator.totalWagered,
      accessory: creator.accessory || '',
      elite: creator.elite || '',
      username: creator.username || '',
    } : null,
    joined_user: joinedUser ? {
      _id: joinedUser._id,
      avatar: joinedUser.avatar,
      totalWagered: joinedUser.totalWagered,
      accessory: joinedUser.accessory || '',
      elite: joinedUser.elite || '',
      username: joinedUser.username || '',
    } : null,
  };
};

const historyActions = [
  'won',
  'lost',
  'created',
  'split',
  'pumped',
  'withdrew',
  'jeet',
  'rugged',
  'receivedAutoPayout',
];

const seedGlobalChat = () => {
  if (dummyState.globalChatLogs.length > 0) return;
  const messages = [
    'Anyone riding the Neon Dice streak?',
    'Solar Crash got spicy fast.',
    'Prism Poker table feels hot tonight.',
    'Zen Mines is chilling.',
    'We need more action in Pixel Raid.',
    'Turbo Slots just paid out big!',
    'Astro Roulette is calling my name.',
  ];

  messages.forEach((message, idx) => {
    const sender = dummyUsers[idx % dummyUsers.length];
    const createdAt = new Date(now - (messages.length - idx) * 2 * 60 * 1000);
    dummyState.globalChatLogs.push({
      id: `gc-${idx + 1}`,
      sender: sender.username,
      senderId: sender._id,
      message,
      messageType: 'text',
      messageContent: '',
      avatar: sender.avatar,
      accessory: sender.accessory,
      elite: sender.elite,
      rank: sender.totalWagered,
      time: formatTime(createdAt),
      created_at: createdAt,
      replyTo: null,
    });
  });
};

const seedDirectMessages = () => {
  if (dummyState.directMessages.length > 0) return;
  const pairs = [
    ['u-1', 'u-2'],
    ['u-1', 'u-3'],
    ['u-2', 'u-4'],
    ['u-3', 'u-5'],
  ];

  const sampleTexts = [
    'Yo, that crash room is wild.',
    'Up for a quick match?',
    'I just hit a 4x streak!',
    'Let me know when you jump in.',
    'Need a partner for Pixel Raid?',
  ];

  let msgIndex = 0;
  pairs.forEach(([a, b]) => {
    for (let i = 0; i < 4; i += 1) {
      const from = i % 2 === 0 ? a : b;
      const to = i % 2 === 0 ? b : a;
      const createdAt = new Date(now - (msgIndex + 1) * 5 * 60 * 1000);
      dummyState.directMessages.push({
        from,
        to,
        message: sampleTexts[msgIndex % sampleTexts.length],
        created_at: createdAt,
        updated_at: createdAt,
        is_read: i < 2,
      });
      msgIndex += 1;
    }
  });
};

const getDummyUser = (id) => {
  if (!id) return null;
  return dummyUsers.find((user) => user._id === id) || null;
};

const buildFallbackUser = (id = 'offline-user') => ({
  _id: id,
  username: 'Offline Player',
  avatar: svgDataUrl('OP', '#343a40'),
  accessory: '',
  elite: '',
  totalWagered: 0,
  status: 'on',
  balance: 0,
});

const getUserOrFallback = (id) => getDummyUser(id) || buildFallbackUser(id);

const dummyHistory = roomSeeds.slice(0, 12).map((_, index) => {
  const room = dummyRooms[index % dummyRooms.length];
  const creator = getUserOrFallback(room.creator);
  const joinedUser = dummyUsers.find((user) => user._id !== creator._id) || creator;
  const action = historyActions[index % historyActions.length];
  const createdAt = new Date(now - (index + 1) * 3 * 60 * 1000);
  const multiplier = action === 'won' ? 1.5 + (index % 4) * 0.5 : 1.0;

  return buildHistoryEntry({
    id: `hist-${index + 1}`,
    room,
    creator,
    joinedUser,
    action,
    createdAt,
    multiplier,
  });
}).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

const filterRooms = ({ query, game_type }) => {
  let rooms = dummyRooms.filter((room) => room.status === 'open');

  if (game_type && game_type !== 'All') {
    const lower = String(game_type).toLowerCase();
    rooms = rooms.filter((room) =>
      Array.isArray(room.game_type)
        ? room.game_type.some((type) => String(type).toLowerCase().includes(lower))
        : String(room.game_type || '').toLowerCase().includes(lower)
    );
  }

  if (query) {
    const lowerQuery = String(query).toLowerCase();
    rooms = rooms.filter((room) => {
      const nameMatch = String(room.name || '').toLowerCase().includes(lowerQuery);
      const descMatch = String(room.description || '').toLowerCase().includes(lowerQuery);
      const typeMatch = Array.isArray(room.game_type)
        ? room.game_type.some((type) => String(type).toLowerCase().includes(lowerQuery))
        : String(room.game_type || '').toLowerCase().includes(lowerQuery);
      return nameMatch || descMatch || typeMatch;
    });
  }

  return rooms;
};

const sortRooms = (rooms, sortBy) => {
  const sorted = [...rooms];
  switch (sortBy) {
    case 'bankroll_high':
      return sorted.sort((a, b) => b.user_bet - a.user_bet || b.updated_at - a.updated_at);
    case 'bankroll_low':
      return sorted.sort((a, b) => a.user_bet - b.user_bet || b.updated_at - a.updated_at);
    case 'battles_high':
      return sorted.sort((a, b) => b.battles - a.battles || b.updated_at - a.updated_at);
    case 'battles_low':
      return sorted.sort((a, b) => a.battles - b.battles || b.updated_at - a.updated_at);
    case 'age_newest':
      return sorted.sort((a, b) => b.created_at - a.created_at || b.updated_at - a.updated_at);
    case 'age_oldest':
      return sorted.sort((a, b) => a.created_at - b.created_at || b.updated_at - a.updated_at);
    default:
      return sorted.sort((a, b) => b.updated_at - a.updated_at);
  }
};

const paginate = (items, page, limit) => {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const paged = items.slice(start, end);

  return {
    items: paged,
    pagination: {
      currentPage,
      totalPages,
      totalCount,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      limit,
    },
  };
};

const buildProcessedRoom = (room) => {
  const creator = getUserOrFallback(room.creator);
  return {
    _id: room._id,
    creator_id: creator._id,
    joiners: room.joiners.map((joinerId) => {
      const joiner = getUserOrFallback(joinerId);
      return {
        avatar: joiner.avatar,
        rank: joiner.totalWagered,
        username: joiner.username,
        accessory: joiner.accessory,
        elite: joiner.elite,
        _id: joiner._id,
      };
    }),
    ticker: room.ticker || room.room_number,
    rank: creator.totalWagered || 0,
    creator_avatar: creator.avatar || '',
    accessory: creator.accessory || '',
    elite: creator.elite || '',
    username: creator.username || '',
    creator_status: creator.status || '',
    game_type: room.game_type || [],
    name: room.name,
    description: room.description,
    image: room.image,
    bet_amount: room.bet_amount,
    pr: room.pr,
    endgame_amount: room.endgame_amount,
    host_pr: room.host_pr,
    room_name: `${Array.isArray(room.game_type) && room.game_type.length > 0 ? room.game_type[0] : 'Unknown'}-${room.room_number}`,
    total_stakes: room.hosts.reduce((acc, host) => acc + (host.stake || 0), 0),
    user_bet: Number(room.user_bet || 0),
    is_private: room.is_private,
    status: room.status,
    index: room.room_number,
    created_at: room.created_at,
    updated_at: room.updated_at,
    battles: room.battles,
    likes: room.likes,
    dislikes: room.dislikes,
    hosts: room.hosts,
    winnings: Number(room.user_bet || 0),
  };
};

const buildRoomInfo = (room) => {
  const creator = getUserOrFallback(room.creator);
  const totalStakes = room.hosts.reduce((sum, host) => sum + (host.share || 0), 0);

  return {
    _id: room._id,
    name: room.name,
    image: room.image,
    ticker: room.ticker,
    pool_id: room.pool_id,
    gameCode: '',
    x_link: room.x_link,
    tax: room.tax,
    website_link: room.website_link,
    telegram_link: room.telegram_link,
    created_at: room.created_at,
    likes: room.likes.length,
    dislikes: room.dislikes.length,
    creator_id: creator._id,
    username: creator.username,
    creator_avatar: creator.avatar,
    rank: creator.totalWagered,
    accessory: creator.accessory,
    elite: creator.elite,
    hosts: room.hosts,
    endgame_amount: room.endgame_amount,
    endgame_type: room.endgame_type,
    description: room.description,
    joiners: room.joiners.map((joinerId) => {
      const joiner = getUserOrFallback(joinerId);
      return {
        _id: joiner._id,
        avatar: joiner.avatar,
        username: joiner.username,
        accessory: joiner.accessory,
        elite: joiner.elite,
        totalWagered: joiner.totalWagered,
      };
    }),
    game_type: room.game_type,
    bet_amount: Number(room.bet_amount),
    user_bet: Number(room.user_bet),
    host_pr: room.host_pr,
    pr: room.pr,
    room_name: `${Array.isArray(room.game_type) && room.game_type.length > 0 ? room.game_type[0] : 'Unknown'}-${room.room_number}`,
    total_stakes: totalStakes,
    battles: room.battles,
    status: room.status,
    is_private: room.is_private,
    room_history: [],
    game_logs: [],
  };
};

const getDummyRoomById = (roomId) => dummyRooms.find((room) => room._id === roomId) || null;

const getDummyRoomResponse = (roomId) => {
  const room = getDummyRoomById(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  return { success: true, room: buildProcessedRoom(room) };
};

const getDummyRoomIdsResponse = ({ game_type = 'All', limit = 30, page = 1, sort_by = 'default' }) => {
  const rooms = sortRooms(filterRooms({ game_type }), sort_by);
  const { items, pagination } = paginate(rooms, Number(page), Number(limit));
  return {
    success: true,
    roomIds: items.map((room) => room._id),
    pagination,
    sortBy: sort_by,
  };
};

const getDummyRoomSearchResponse = ({ query = '', game_type = 'All', limit = 20, page = 1, sort_by = 'default' }) => {
  const rooms = sortRooms(filterRooms({ query, game_type }), sort_by);
  const { items, pagination } = paginate(rooms, Number(page), Number(limit));
  return {
    success: true,
    roomIds: items.map((room) => room._id),
    pagination,
    searchQuery: query,
    sortBy: sort_by,
  };
};

const getDummyRoomInfoResponse = (roomId, query = {}) => {
  const room = getDummyRoomById(roomId);
  if (!room) {
    return { success: false, err: 'Room not found' };
  }

  const roomHistory = dummyHistory
    .filter((entry) => entry.room?._id === room._id)
    .slice(0, 12);

  return {
    success: true,
    query,
    roomInfo: {
      ...buildRoomInfo(room),
      room_history: roomHistory,
      game_logs: [],
    },
    totalGameLogsCount: roomHistory.length,
  };
};

const getDummyTopGameTypesResponse = () => {
  const types = [...new Set(dummyRooms.flatMap((room) => room.game_type || []))];
  return {
    success: true,
    gameTypes: types.slice(0, 16),
  };
};

const getDummyGameTypeListResponse = () => {
  const types = [...new Set(dummyRooms.flatMap((room) => room.game_type || []))];
  return {
    success: true,
    query: {},
    gameTypeList: types.map((type, index) => ({
      _id: `gt-${index + 1}`,
      game_type_name: type,
      short_name: type.slice(0, 3).toUpperCase(),
      created_at: new Date(now - index * 1000 * 60),
      updated_at: new Date(now - index * 1000 * 60),
    })),
  };
};

const getDummyGlobalChatLogsResponse = () => {
  seedGlobalChat();
  const chatLogs = dummyState.globalChatLogs.slice(-9);
  return {
    success: true,
    chatLogs,
    cached: false,
  };
};

const appendDummyGlobalChat = (data) => {
  seedGlobalChat();
  const senderId = data.senderId || 'offline-user';
  const sender = data.sender || 'Offline Player';
  const createdAt = new Date();
  const id = `gc-${dummyState.globalChatLogs.length + 1}`;
  const chatData = {
    id,
    sender,
    senderId,
    message: data.message || '',
    messageType: data.messageType || 'text',
    messageContent: data.messageContent || '',
    avatar: data.avatar || getUserOrFallback(senderId).avatar,
    accessory: data.accessory || '',
    elite: data.elite || '',
    rank: data.rank || 0,
    time: formatTime(createdAt),
    created_at: createdAt,
    replyTo: data.replyTo || null,
  };

  dummyState.globalChatLogs.push(chatData);
  if (dummyState.globalChatLogs.length > 60) {
    dummyState.globalChatLogs.splice(0, dummyState.globalChatLogs.length - 60);
  }

  return chatData;
};

const getDummyHistoryLatestItem = () => dummyHistory[0] || null;

const getDummyTopWinsResponse = () => {
  const topWins = [...dummyHistory]
    .sort((a, b) => b.winnings - a.winnings)
    .slice(0, 4);

  return {
    success: true,
    pageSize: 4,
    history: topWins,
  };
};

const addDummyDirectMessage = (data) => {
  seedDirectMessages();
  const createdAt = new Date();
  dummyState.directMessages.push({
    from: data.from,
    to: data.to,
    message: data.message || '',
    created_at: createdAt,
    updated_at: createdAt,
    is_read: false,
  });
};

const markDummyMessagesRead = (fromId, toId) => {
  seedDirectMessages();
  dummyState.directMessages.forEach((msg) => {
    if (msg.from === fromId && msg.to === toId) {
      msg.is_read = true;
    }
  });
};

const getDummyUnreadCount = (toId) => {
  seedDirectMessages();
  return dummyState.directMessages.filter((msg) => msg.to === toId && !msg.is_read).length;
};

const ensureConversationSeeded = (userA, userB) => {
  seedDirectMessages();
  const hasConversation = dummyState.directMessages.some((msg) =>
    (msg.from === userA && msg.to === userB) || (msg.from === userB && msg.to === userA)
  );
  if (hasConversation) return;

  const starterMessages = [
    'Hey! Want to try a new room?',
    'Sure, which one are you looking at?',
    'Neon Dice seems active right now.',
    'I am in. Give me a minute.',
  ];

  starterMessages.forEach((message, idx) => {
    const from = idx % 2 === 0 ? userA : userB;
    const to = idx % 2 === 0 ? userB : userA;
    const createdAt = new Date(now - (idx + 1) * 4 * 60 * 1000);
    dummyState.directMessages.push({
      from,
      to,
      message,
      created_at: createdAt,
      updated_at: createdAt,
      is_read: true,
    });
  });
};

const getDummyMyChatResponse = (currentUser) => {
  seedDirectMessages();
  const userId = currentUser?._id || 'offline-user';
  const myChat = {};

  dummyState.directMessages.forEach((msg) => {
    if (msg.from !== userId && msg.to !== userId) return;
    const otherId = msg.from === userId ? msg.to : msg.from;
    const otherUser = getUserOrFallback(otherId);
    const existing = myChat[otherId];

    if (!existing || existing.updated_at < msg.updated_at) {
      myChat[otherId] = {
        _id: otherUser._id,
        message: msg.message,
        username: otherUser.username,
        avatar: otherUser.avatar,
        accessory: otherUser.accessory,
        elite: otherUser.elite,
        rank: otherUser.totalWagered,
        created_at: msg.created_at,
        created_at_str: moment(msg.created_at).format('LLL'),
        updated_at: msg.updated_at,
        unread_message_count: 0,
      };
    }

    if (msg.to === userId && !msg.is_read) {
      myChat[otherId].unread_message_count += 1;
    }
  });

  if (Object.keys(myChat).length === 0) {
    const fallbackUser = dummyUsers.find((user) => user._id !== userId) || dummyUsers[0];
    myChat[fallbackUser._id] = {
      _id: fallbackUser._id,
      message: 'No chat history yet. Say hi!',
      username: fallbackUser.username,
      avatar: fallbackUser.avatar,
      accessory: fallbackUser.accessory,
      elite: fallbackUser.elite,
      rank: fallbackUser.totalWagered,
      created_at: new Date(),
      created_at_str: moment().format('LLL'),
      updated_at: new Date(),
      unread_message_count: 0,
    };
  }

  return { success: true, myChat };
};

const getDummyChatRoomInfoResponse = (currentUserId, otherUserId, offset = 0, limit = 20) => {
  const userId = currentUserId || 'offline-user';
  const otherId = otherUserId || dummyUsers[0]._id;

  ensureConversationSeeded(userId, otherId);

  const conversation = dummyState.directMessages
    .filter((msg) =>
      (msg.from === userId && msg.to === otherId) || (msg.from === otherId && msg.to === userId)
    )
    .sort((a, b) => b.created_at - a.created_at); // newest first

  const slice = conversation.slice(Number(offset), Number(offset) + Number(limit)).reverse();
  const messages = slice.map((msg) => ({
    from: msg.from,
    to: msg.to,
    message: msg.message,
    created_at: moment(msg.created_at).format('MM-DD-YYYY HH:mm:ss'),
  }));

  const hasMore = Number(offset) + Number(limit) < conversation.length;
  const otherUser = getUserOrFallback(otherId);

  return {
    success: true,
    chatRoomInfo: {
      user_id: otherUser._id,
      accessory: otherUser.accessory,
      elite: otherUser.elite,
      avatar: otherUser.avatar,
      rank: otherUser.totalWagered,
      username: otherUser.username,
      chatLogs: messages,
      hasMore,
    },
  };
};

module.exports = {
  shouldUseDummyData,
  getDummyUser,
  getUserOrFallback,
  getDummyRoomResponse,
  getDummyRoomIdsResponse,
  getDummyRoomSearchResponse,
  getDummyRoomInfoResponse,
  getDummyTopGameTypesResponse,
  getDummyGameTypeListResponse,
  getDummyGlobalChatLogsResponse,
  getDummyHistoryLatestItem,
  getDummyTopWinsResponse,
  appendDummyGlobalChat,
  addDummyDirectMessage,
  markDummyMessagesRead,
  getDummyUnreadCount,
  getDummyMyChatResponse,
  getDummyChatRoomInfoResponse,
};
