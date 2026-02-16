const now = Date.now();

const svgDataUrl = (label, bg) => {
  const safeLabel = String(label || '').slice(0, 3).toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" rx="16" ry="16" fill="${bg}"/>` +
    `<text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#ffffff">${safeLabel}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const dummyUsers = [
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
];

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

export const dummyRooms = roomSeeds.map((seed, index) => {
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

export const dummyGameTypes = [...new Set(dummyRooms.flatMap((room) => room.game_type || []))];

export const dummyGlobalChat = [
  'Anyone riding the Neon Dice streak?',
  'Solar Crash got spicy fast.',
  'Prism Poker table feels hot tonight.',
  'Zen Mines is chilling.',
  'We need more action in Pixel Raid.',
  'Turbo Slots just paid out big!',
  'Astro Roulette is calling my name.',
].map((message, idx) => {
  const sender = dummyUsers[idx % dummyUsers.length];
  const createdAt = new Date(now - (dummyUsers.length - idx) * 2 * 60 * 1000);
  return {
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
    time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    created_at: createdAt,
    replyTo: null,
  };
});

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

export const buildHistoryEntry = ({ id, room, creator, joinedUser, action, createdAt, multiplier }) => {
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

export const dummyHistory = dummyRooms.slice(0, 12).map((room, index) => {
  const creator = dummyUsers[index % dummyUsers.length];
  const joinedUser = dummyUsers[(index + 1) % dummyUsers.length];
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

export const getDummyUser = (id) => dummyUsers.find((user) => user._id === id) || null;

export const getUserOrFallback = (id) => getDummyUser(id) || {
  _id: id || 'offline-user',
  username: 'Offline Player',
  avatar: svgDataUrl('OP', '#343a40'),
  accessory: '',
  elite: '',
  totalWagered: 0,
  status: 'on',
  balance: 0,
};

export const getDummyRoomById = (roomId) => dummyRooms.find((room) => room._id === roomId) || null;

export const buildProcessedRoom = (room) => {
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

export const buildRoomInfo = (room) => {
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
  };
};

export const buildRoomHistory = (roomId) => dummyHistory.filter((entry) => entry.room?._id === roomId);

export const buildMyChat = (currentUserId = 'u-1') => {
  const myChat = {};
  dummyUsers.filter((user) => user._id !== currentUserId).slice(0, 3).forEach((user, idx) => {
    myChat[user._id] = {
      _id: user._id,
      message: idx === 0 ? 'No chat history yet. Say hi!' : 'Catch you in the next round.',
      username: user.username,
      avatar: user.avatar,
      accessory: user.accessory,
      elite: user.elite,
      rank: user.totalWagered,
      created_at: new Date(now - (idx + 1) * 60 * 1000),
      created_at_str: new Date(now - (idx + 1) * 60 * 1000).toLocaleString(),
      updated_at: new Date(now - (idx + 1) * 60 * 1000),
      unread_message_count: idx === 0 ? 1 : 0,
    };
  });
  return myChat;
};

export const buildChatRoomInfo = (otherUserId = 'u-2') => {
  const otherUser = getUserOrFallback(otherUserId);
  const messages = [
    { from: otherUser._id, to: 'u-1', message: 'Hey! Want to try a new room?', created_at: new Date(now - 5 * 60 * 1000) },
    { from: 'u-1', to: otherUser._id, message: 'Sure, which one are you looking at?', created_at: new Date(now - 3 * 60 * 1000) },
    { from: otherUser._id, to: 'u-1', message: 'Neon Dice seems active right now.', created_at: new Date(now - 1 * 60 * 1000) },
  ].map((msg) => ({
    ...msg,
    created_at: msg.created_at.toLocaleString('en-US', { hour12: false }),
  }));

  return {
    user_id: otherUser._id,
    accessory: otherUser.accessory,
    elite: otherUser.elite,
    avatar: otherUser.avatar,
    rank: otherUser.totalWagered,
    username: otherUser.username,
    chatLogs: messages,
    hasMore: false,
  };
};

