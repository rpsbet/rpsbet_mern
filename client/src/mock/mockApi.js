import {
  dummyRooms,
  dummyGameTypes,
  dummyGlobalChat,
  dummyHistory,
  buildProcessedRoom,
  buildRoomInfo,
  buildRoomHistory,
  getDummyRoomById,
  buildMyChat,
  buildChatRoomInfo,
} from './mockData';

const normalizeUrl = (url) => (url || '').split('?')[0];

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

const buildRoomIdsResponse = ({ query, game_type, limit = 30, page = 1, sort_by = 'default' }) => {
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

const buildRoomResponse = (roomId) => {
  const room = getDummyRoomById(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  return { success: true, room: buildProcessedRoom(room) };
};

const buildRoomInfoResponse = (roomId) => {
  const room = getDummyRoomById(roomId);
  if (!room) {
    return { success: false, err: 'Room not found' };
  }
  return {
    success: true,
    query: {},
    roomInfo: {
      ...buildRoomInfo(room),
      room_history: buildRoomHistory(roomId),
      game_logs: [],
    },
    totalGameLogsCount: buildRoomHistory(roomId).length,
  };
};

const topWins = [...dummyHistory]
  .sort((a, b) => b.winnings - a.winnings)
  .slice(0, 4);

const mockHandlers = [
  {
    match: (method, url) => method === 'get' && url === '/game/game_types/top',
    handle: () => ({ success: true, gameTypes: dummyGameTypes.slice(0, 16) }),
  },
  {
    match: (method, url) => method === 'get' && url === '/game/game_types',
    handle: () => ({
      success: true,
      query: {},
      gameTypeList: dummyGameTypes.map((type, index) => ({
        _id: `gt-${index + 1}`,
        game_type_name: type,
        short_name: type.slice(0, 3).toUpperCase(),
        created_at: new Date(Date.now() - index * 1000 * 60),
        updated_at: new Date(Date.now() - index * 1000 * 60),
      })),
    }),
  },
  {
    match: (method, url) => method === 'get' && url === '/game/rooms/ids',
    handle: (config) => {
      const params = config?.params || {};
      return buildRoomIdsResponse(params);
    },
  },
  {
    match: (method, url) => method === 'get' && url === '/game/rooms/search',
    handle: (config) => {
      const params = config?.params || {};
      return buildRoomIdsResponse(params);
    },
  },
  {
    match: (method, url) => method === 'get' && url.startsWith('/game/room/'),
    handle: (config, url) => {
      const roomId = url.split('/').pop();
      return buildRoomResponse(roomId);
    },
  },
  {
    match: (method, url) => method === 'get' && url.startsWith('/game/game-room/'),
    handle: (config, url) => {
      const roomId = url.split('/').pop();
      return buildRoomInfoResponse(roomId);
    },
  },
  {
    match: (method, url) => method === 'get' && url === '/game/history',
    handle: () => ({ success: true, latestItem: dummyHistory[0] || null, cached: false }),
  },
  {
    match: (method, url) => method === 'get' && url === '/game/topWins',
    handle: () => ({ success: true, pageSize: 4, history: topWins }),
  },
  {
    match: (method, url) => method === 'post' && url === '/game/getGlobalChatLogs',
    handle: () => ({ success: true, chatLogs: dummyGlobalChat, cached: false }),
  },
  {
    match: (method, url) => method === 'get' && url === '/game/my_chat',
    handle: () => ({ success: true, myChat: buildMyChat() }),
  },
  {
    match: (method, url) => method === 'post' && url === '/game/get_chat_room_info',
    handle: (config, url, data) => ({ success: true, chatRoomInfo: buildChatRoomInfo(data?.user_id) }),
  },
  {
    match: (method, url) => method === 'post' && url === '/game/mark_chat_as_read',
    handle: () => ({ success: true }),
  },
  {
    match: (method, url) => method === 'get' && url === '/game/notifications',
    handle: () => ({ success: true, notifications: [] }),
  },
  {
    match: (method, url) => method === 'post' && url === '/game/rooms',
    handle: () => ({ success: true, message: 'Dummy room created (offline mode).' }),
  },
  {
    match: (method, url) => method === 'get' && url.startsWith('/game/comments/'),
    handle: () => ({ success: true, comments: [] }),
  },
  {
    match: (method, url) => method === 'post' && url === '/game/comments',
    handle: () => ({ success: true }),
  },
  {
    match: (method, url) => method === 'delete' && url.startsWith('/game/comments/'),
    handle: () => ({ success: true }),
  },
];

const findHandler = (method, url) => mockHandlers.find((entry) => entry.match(method, url));

const buildDefaultResponse = (method, url) => {
  if (url.startsWith('/auth') || url.startsWith('/user')) {
    return { success: false, message: 'Mock auth disabled' };
  }

  return { success: true };
};

const respond = (data) => Promise.resolve({ data });

export const createMockApi = () => {
  const request = (method, url, config = {}, data = null) => {
    const normalized = normalizeUrl(url);
    const handler = findHandler(method, normalized);
    const response = handler
      ? handler.handle(config, normalized, data)
      : buildDefaultResponse(method, normalized);

    if (config?.responseType === 'blob') {
      return respond(new Blob());
    }

    return respond(response);
  };

  return {
    get: (url, config) => request('get', url, config),
    post: (url, data, config) => request('post', url, config, data),
    put: (url, data, config) => request('put', url, config, data),
    patch: (url, data, config) => request('patch', url, config, data),
    delete: (url, config) => request('delete', url, config),
  };
};

