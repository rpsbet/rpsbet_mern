import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { getRank } from '../../util/getRank';
import Avatar from '../../components/Avatar';

import {
  Tabs,
  Tab,
  Button,
  InputAdornment,
  TextField,
  Box,
  CircularProgress,
  Popover,
  Typography,
  Skeleton,
  Fade,
  Tooltip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';

import {
  InsertEmoticon,
  Gif,
  Clear,
  ChatOutlined,
  Public,
  Send as SendIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// Lazy load components for better performance
const GlobalChat = React.lazy(() => import('./GlobalChat'));
const MyChat = React.lazy(() => import('./MyChat'));

import { setFocused } from '../../redux/Auth/user.actions';
import { errorMsgBar, successMsgBar } from '../../redux/Notification/notification.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Move to separate constants file in production
const EMOJI_LIST = [
  { command: ':bot:', url: '/img/emotes/brokenbot.webp', alt: 'broken bot', category: 'misc' },
  { command: ':dance:', url: '/img/emotes/dance.webp', alt: 'dance', category: 'action' },
  { command: ':goofy:', url: '/img/emotes/goofy.webp', alt: 'goofy', category: 'emotion' },
  { command: ':cook:', url: '/img/emotes/cook.webp', alt: 'cook', category: 'action' },
  { command: ':catcute:', url: '/img/emotes/catcute.webp', alt: 'cat cute', category: 'animals' },
  { command: ':gang:', url: '/img/emotes/gangSigns.webp', alt: 'gang signs', category: 'action' },
  { command: ':happy:', url: '/img/emotes/happy.webp', alt: 'happy', category: 'emotion' },
  { command: ':sus:', url: '/img/emotes/sus.webp', alt: 'sus', category: 'emotion' },
  { command: ':flatearth:', url: '/img/emotes/flatearth.webp', alt: 'flat earth', category: 'misc' },
  { command: ':pepedance:', url: '/img/emotes/pepepe.webp', alt: 'pepe dance', category: 'memes' },
  { command: ':leo:', url: '/img/emotes/leo.webp', alt: 'leo', category: 'celebrities' },
  { command: ':wellyousee:', url: '/img/emotes/wellyousee.webp', alt: 'wellyousee', category: 'memes' },
  { command: ':laugh:', url: '/img/emotes/laugh.webp', alt: 'laugh', category: 'emotion' },
  { command: ':randomemote:', url: '/img/emotes/randomemote.webp', alt: 'randomemote', category: 'misc' },
  { command: ':rainbow:', url: '/img/emotes/rainbow.webp', alt: 'rainbow', category: 'nature' },
  { command: ':cross:', url: '/img/emotes/cross.webp', alt: 'cross', category: 'symbols' },
  { command: ':nyancat:', url: '/img/emotes/nyancat.webp', alt: 'nyan cat', category: 'memes' },
  { command: ':babycar:', url: '/img/emotes/babycar.webp', alt: 'baby car', category: 'vehicles' },
  { command: ':sexykiss:', url: '/img/emotes/sexykiss.webp', alt: 'sexy kiss', category: 'romance' },
  { command: ':sexyclap:', url: '/img/emotes/sexyclap.webp', alt: 'sexy clap', category: 'action' },
  { command: ':sexyfinger:', url: '/img/emotes/sexyfinger.webp', alt: 'sexy finger', category: 'action' },
  { command: ':pickle:', url: '/img/emotes/pickle.webp', alt: 'pickle', category: 'food' },
  { command: ':trooperbae:', url: '/img/emotes/trooperbae.webp', alt: 'storm trooper bae', category: 'starwars' },
  { command: ':catpop:', url: '/img/emotes/catpop.webp', alt: 'catpop', category: 'animals' },
  { command: ':brother:', url: '/img/emotes/brother.webp', alt: 'brother', category: 'memes' },
  { command: ':pepenou:', url: '/img/emotes/pepenou.webp', alt: 'pepenou', category: 'memes' },
  { command: ':skibidi:', url: '/img/emotes/skibidi.webp', alt: 'skibidi', category: 'memes' },
  { command: ':salute:', url: '/img/emotes/salute.webp', alt: 'salute', category: 'action' },
  { command: ':bananacat:', url: '/img/emotes/bananacat.webp', alt: 'banana cat', category: 'animals' },
  { command: ':sadthink:', url: '/img/emotes/sadthink.webp', alt: 'sadthink', category: 'emotion' },
  { command: ':alien:', url: '/img/emotes/alien.webp', alt: 'alien', category: 'space' },
  { command: ':chad:', url: '/img/emotes/chad.webp', alt: 'chad', category: 'memes' },
  { command: ':pog:', url: '/img/emotes/pog.webp', alt: 'pog', category: 'gaming' },
  { command: ':gift:', url: '/img/emotes/gift.webp', alt: 'gift', category: 'objects' },
  { command: ':dababy:', url: '/img/emotes/dababy.webp', alt: 'dababy', category: 'memes' },
  { command: ':dababyw:', url: '/img/emotes/dababyw.webp', alt: 'dababyw', category: 'memes' },
  { command: ':poggies:', url: '/img/emotes/poggies.webp', alt: 'poggies', category: 'gaming' },
  { command: ':beg:', url: '/img/emotes/beg.webp', alt: 'beg', category: 'emotion' },
  { command: ':angry:', url: '/img/emotes/angry.webp', alt: 'angry', category: 'emotion' },
  { command: ':pepesad:', url: '/img/emotes/pepesad.webp', alt: 'pepesad', category: 'memes' },
  { command: ':cry:', url: '/img/emotes/cry.webp', alt: 'cry', category: 'emotion' },
  { command: ':wutdog:', url: '/img/emotes/wutdog.webp', alt: 'wutdog', category: 'animals' },
  { command: ':wut:', url: '/img/emotes/wut.webp', alt: 'wut', category: 'emotion' },
  { command: ':pogger:', url: '/img/emotes/pogger.webp', alt: 'pogger', category: 'gaming' },
  { command: ':pleasecat:', url: '/img/emotes/pleasecat.webp', alt: 'please cat', category: 'animals' },
  { command: ':nocap:', url: '/img/emotes/nocap.webp', alt: 'nocap', category: 'memes' },
  { command: ':mexican:', url: '/img/emotes/mexican.webp', alt: 'cat', category: 'animals' },
  { command: ':mike:', url: '/img/emotes/mike.webp', alt: 'mike', category: 'memes' },
  { command: ':kekw:', url: '/img/emotes/kekw.webp', alt: 'kekw', category: 'memes' },
  { command: ':butwhy:', url: '/img/emotes/butwhy.webp', alt: 'butwhy', category: 'emotion' },
  { command: ':sui:', url: '/img/emotes/sui.webp', alt: 'sui', category: 'crypto' },
  { command: ':lucky:', url: '/img/emotes/lucky.webp', alt: 'lucky', category: 'emotion' },
  { command: ':hodl:', url: '/img/emotes/hodl.webp', alt: 'hodl', category: 'crypto' },
  { command: ':doge:', url: '/img/emotes/doge.webp', alt: 'doge', category: 'crypto' },
  { command: ':3head:', url: '/img/emotes/3head.webp', alt: '3head', category: 'memes' },
  { command: ':check:', url: '/img/emotes/check.webp', alt: 'check', category: 'symbols' },
  { command: ':pepetypo:', url: '/img/emotes/pepetypo.webp', alt: 'pepe typo', category: 'memes' },
  { command: ':kirby:', url: '/img/emotes/kirby.webp', alt: 'kirby', category: 'gaming' },
  { command: ':wow:', url: '/img/emotes/wow.webp', alt: 'wow', category: 'emotion' },
  { command: ':cat:', url: '/img/emotes/cat.webp', alt: 'cat', category: 'animals' },
  { command: ':moneypepe:', url: '/img/emotes/moneypepe.webp', alt: 'moneypepe', category: 'crypto' },
  { command: ':truemf:', url: '/img/emotes/truemf.webp', alt: 'truemf', category: 'memes' },
  { command: ':hattip:', url: '/img/emotes/hattip.webp', alt: 'hat tip', category: 'action' },
  { command: ':simp:', url: '/img/emotes/simp.webp', alt: 'simp', category: 'memes' },
  { command: ':1x:', url: '/img/emotes/1x.webp', alt: '1x', category: 'gaming' },
  { command: ':fortnite:', url: '/img/emotes/fortnite.webp', alt: 'fortnite', category: 'gaming' },
  { command: ':kodak:', url: '/img/emotes/kodak.webp', alt: 'kodak', category: 'memes' },
  { command: ':ain:', url: '/img/emotes/ain.webp', alt: 'ain', category: 'memes' },
  { command: ':troll:', url: '/img/emotes/troll.webp', alt: 'troll', category: 'memes' },
  { command: ':minecraftcookie:', url: '/img/emotes/minecraftcookie.webp', alt: 'minecraftcookie', category: 'gaming' },
];

// Enhanced constants with better organization
const CONFIG = {
  GIPHY_API_KEY: process.env.REACT_APP_GIPHY_API_KEY || 'EoYYQ1kbX7mRfqwJ6xC4M6wgQmds4Dq1',
  DEBOUNCE_DELAY: 300,
  GIF_SEARCH_LIMIT: 20,
  MAX_MESSAGE_LENGTH: 500,
  STORAGE_KEY: 'selectedTabIndex',
  EMOJI_GRID_SIZE: 8,
};

const INITIAL_STATES = {
  GIF: { loaded: false, url: '', title: '' },
  SELECTED_MESSAGE: {
    sender: null,
    avatar: null,
    rank: null,
    accessory: null,
    elite: null,
    message: null,
    messageType: null,
    time: null,
  },
};

// Custom hooks for better organization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? parseInt(item, 10) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, value.toString());
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

// Enhanced emoji categories for better organization
const EmojiGrid = React.memo(({ emojis, onEmojiSelect, searchTerm = '' }) => {
  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) return emojis;
    
    const term = searchTerm.toLowerCase();
    return emojis.filter(emoji => 
      emoji.command.toLowerCase().includes(term) ||
      emoji.alt.toLowerCase().includes(term) ||
      emoji.category.toLowerCase().includes(term)
    );
  }, [emojis, searchTerm]);

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: `repeat(${CONFIG.EMOJI_GRID_SIZE}, 1fr)`,
      gap: 1,
      maxHeight: '300px',
      overflowY: 'auto',
      p: 1,
    }}>
      {filteredEmojis.map((emojiItem) => (
        <Tooltip key={emojiItem.command} title={emojiItem.alt} arrow>
          <Box
            component="img"
            src={emojiItem.url}
            alt={emojiItem.alt}
            onClick={() => onEmojiSelect(emojiItem.command)}
            sx={{
              width: '32px',
              height: '32px',
              objectFit: 'cover',
              cursor: 'pointer',
              borderRadius: 1,
              border: '2px solid transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                opacity: 0.8, 
                transform: 'scale(1.15)',
                borderColor: 'error.main',
                boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
            loading="lazy"
          />
        </Tooltip>
      ))}
    </Box>
  );
});

// Enhanced GIF grid with better loading states
const GifGrid = React.memo(({ gifs, onGifSelect, loading }) => {
  const [loadedGifs, setLoadedGifs] = useState(new Set());

  const handleGifLoad = useCallback((index) => {
    setLoadedGifs(prev => new Set([...prev, index]));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, gap: 1 }}>
        <CircularProgress color="error" size={24} />
        <Typography variant="body2" color="text.secondary">Searching GIFs...</Typography>
      </Box>
    );
  }

  if (gifs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <SearchIcon sx={{ fontSize: '2rem', color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Search for GIFs to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
      gap: 1,
      maxHeight: '300px',
      overflowY: 'auto',
      p: 1,
    }}>
      {gifs.map((gif, index) => (
        <Box
          key={`${gif.url}-${index}`}
          sx={{ 
            position: 'relative', 
            aspectRatio: '1',
            borderRadius: 1,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            },
          }}
          onClick={() => onGifSelect(gif.url)}
        >
          {!loadedGifs.has(index) && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              sx={{ position: 'absolute', top: 0, left: 0 }}
            />
          )}
          <Box
            component="img"
            src={gif.url}
            alt={gif.title}
            onLoad={() => handleGifLoad(index)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: loadedGifs.has(index) ? 'block' : 'none',
            }}
            loading="lazy"
          />
        </Box>
      ))}
    </Box>
  );
});

// Enhanced reply preview component
const ReplyPreview = React.memo(({ selectedMessage, onClear }) => {
  if (!selectedMessage?.sender) return null;

  return (
    <Fade in>
      <Box sx={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        p: 2,
        mb: 1,
        zIndex: 1,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(12px)',
        borderRadius: '12px 12px 0 0',
        border: '1px solid',
        borderColor: 'divider',
        borderBottom: 'none',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Replying to:
          </Typography>
          <Avatar
            rank={selectedMessage.rank}
            accessory={selectedMessage.accessory}
            elite={selectedMessage.elite}
            src={selectedMessage.avatar}
            username={selectedMessage.sender}
            user_id={selectedMessage.senderId}
            alt={`${selectedMessage.sender}'s avatar`}
            style={{ width: 24, height: 24 }}
          />
          {/* <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            {selectedMessage.sender}
          </Typography> */}
          <Tooltip title="Cancel reply" arrow>
            <Button
              onClick={onClear}
              color="error"
              variant="outlined"
              size="small"
              sx={{ minWidth: '32px', width: '32px', height: '32px', p: 0 }}
            >
              <Clear sx={{ fontSize: '16px' }} />
            </Button>
          </Tooltip>
        </Box>
        {selectedMessage.message && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'block',
              mt: 0.5,
              ml: 4,
              fontStyle: 'italic',
              // overflow: 'hidden',
              // textOverflow: 'ellipsis',
              // whiteSpace: 'nowrap',
            }}
          >
            "{selectedMessage.message.length > 50 
              ? `${selectedMessage.message.substring(0, 50)}...` 
              : selectedMessage.message}"
          </Typography>
        )}
      </Box>
    </Fade>
  );
});

/**
 * Enhanced ChatPanel component with improved performance and professional styling
 */
function ChatPanel({ is_mobile, toggleDrawer, highlightChatId }) {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Redux state with memoized selector
  const {
    isAuthenticated,
    isDarkMode,
    userName,
    user,
    socket,
    onlineUserList
  } = useSelector(
    useCallback((state) => ({
      isAuthenticated: state.auth.isAuthenticated,
      isDarkMode: state.auth.isDarkMode,
      userName: state.auth.userName,
      user: state.auth.user,
      socket: state.auth.socket,
      onlineUserList: state.logic.onlineUserList,
    }), [])
  );

  // Enhanced local storage hook
  const [selectedTabIndex, setSelectedTabIndex] = useLocalStorage(CONFIG.STORAGE_KEY, 1);

  // Local state with better organization
  const [text, setText] = useState('');
  const [emojiSearchTerm, setEmojiSearchTerm] = useState('');
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [gifAnchorEl, setGifAnchorEl] = useState(null);
  const [gifs, setGifs] = useState([]);
  const [isGifLoading, setIsGifLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(INITIAL_STATES.SELECTED_MESSAGE);
  const [hoverTabIndex, setHoverTabIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const gifSearchRef = useRef(null);
  const emojiSearchRef = useRef(null);

  // Debounced search terms
  const debouncedGifSearch = useDebounce(gifSearchTerm, CONFIG.DEBOUNCE_DELAY);

  // Memoized computed values
  const customTheme = useMemo(() => getCustomTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode]);
  const isChatEnabled = useMemo(() => 
    isAuthenticated && getRank(user?.totalWagered) >= 1, 
    [isAuthenticated, user?.totalWagered]
  );

  // Enhanced GIF search with error handling and caching
  const handleGifSearch = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setGifs([]);
      setIsGifLoading(false);
      return;
    }

    try {
      setIsGifLoading(true);
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: CONFIG.GIPHY_API_KEY,
          q: searchTerm.trim(),
          limit: CONFIG.GIF_SEARCH_LIMIT,
          rating: 'pg-13',
        },
        timeout: 5000,
      });

      const fetchedGifs = response.data.data.map((gif) => ({
        ...INITIAL_STATES.GIF,
        url: gif.images.fixed_height.url,
        title: gif.title,
        id: gif.id,
      }));

      setGifs(fetchedGifs);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      dispatch(errorMsgBar('Failed to load GIFs. Please try again.'));
      setGifs([]);
    } finally {
      setIsGifLoading(false);
    }
  }, [dispatch]);

  // Effect for debounced GIF search
  useEffect(() => {
    handleGifSearch(debouncedGifSearch);
  }, [debouncedGifSearch, handleGifSearch]);

  // Enhanced message sending with validation
  const handleSendMessage = useCallback(async (messageData) => {
    if (!socket || !user?._id) {
      dispatch(errorMsgBar('Connection error. Please refresh and try again.'));
      return;
    }

    try {
      socket.emit('GLOBAL_CHAT_SEND', messageData);
      // Optional: Add optimistic UI update here
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch(errorMsgBar('Failed to send message. Please try again.'));
    }
  }, [socket, user?._id, dispatch]);

  // Enhanced text input handler with typing indicators
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    
    if (newText.length <= CONFIG.MAX_MESSAGE_LENGTH) {
      setText(newText);
      
      // Typing indicator logic
      if (newText.trim() && !isTyping) {
        setIsTyping(true);
        // Emit typing start event
        socket?.emit('TYPING_START', { userId: user?._id });
      } else if (!newText.trim() && isTyping) {
        setIsTyping(false);
        // Emit typing stop event
        socket?.emit('TYPING_STOP', { userId: user?._id });
      }
    }
  }, [isTyping, socket, user?._id]);

  // Enhanced keyboard handler
  const handleKeyDown = useCallback((e) => {
    e.stopPropagation();
    
    if (!socket || !user?._id || !isChatEnabled) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedText = text.trim();
      
      if (trimmedText) {
        const message = {
          sender: userName,
          senderId: user._id,
          message: trimmedText,
          avatar: user.avatar,
          accessory: user.accessory,
          elite: user.elite,
          replyTo: selectedMessage.sender ? selectedMessage : null,
          rank: user.totalWagered,
          timestamp: Date.now(),
        };

        handleSendMessage(message);
        setText('');
        setSelectedMessage(INITIAL_STATES.SELECTED_MESSAGE);
        setIsTyping(false);
        socket?.emit('TYPING_STOP', { userId: user._id });
      }
    }

    if (e.key === 'Escape') {
      setSelectedMessage(INITIAL_STATES.SELECTED_MESSAGE);
      setEmojiAnchorEl(null);
      setGifAnchorEl(null);
    }
  }, [socket, user, userName, text, selectedMessage, isChatEnabled, handleSendMessage]);

  // Enhanced emoji selection
  const handleEmojiSelect = useCallback((emojiCommand) => {
    const foundEmoji = EMOJI_LIST.find((emoji) => emoji.command === emojiCommand);
    if (foundEmoji) {
      setText(prev => prev + foundEmoji.command + ' ');
      textareaRef.current?.focus();
      // Keep popover open for multiple selections
    }
  }, []);

  // Enhanced GIF selection
  const handleGifSelect = useCallback((gifUrl) => {
    if (!user?._id || !socket) {
      dispatch(errorMsgBar('Please log in to send GIFs'));
      return;
    }

    const message = {
      sender: userName,
      senderId: user._id,
      message: JSON.stringify({ type: 'gif', content: gifUrl }),
      rank: user.totalWagered,
      avatar: user.avatar,
      accessory: user.accessory,
      elite: user.elite,
      messageType: 'gif',
      timestamp: Date.now(),
    };
    
    handleSendMessage(message);
    setGifAnchorEl(null);
    setGifSearchTerm('');
  }, [user, socket, userName, dispatch, handleSendMessage]);

  // Enhanced popover handlers
  const handleEmojiToggle = useCallback((event) => {
    setEmojiAnchorEl(prev => prev ? null : event.currentTarget);
    setGifAnchorEl(null); // Close other popovers
  }, []);

  const handleGifToggle = useCallback((event) => {
    setGifAnchorEl(prev => prev ? null : event.currentTarget);
    setEmojiAnchorEl(null); // Close other popovers
  }, []);

  // Focus handlers with improved UX
  const handleFocus = useCallback(() => {
    dispatch(setFocused(true));
  }, [dispatch]);

  const handleBlur = useCallback(() => {
    dispatch(setFocused(false));
    setIsTyping(false);
    socket?.emit('TYPING_STOP', { userId: user?._id });
  }, [dispatch, socket, user?._id]);

  // Tab handlers
  const handleTabChange = useCallback((_, newValue) => {
    setSelectedTabIndex(newValue);
  }, [setSelectedTabIndex]);

  // Enhanced tabs with badges for notifications
  const renderTabs = () => (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider'}}>
      <Tabs
        value={selectedTabIndex}
        onChange={handleTabChange}
        variant="fullWidth"
        TabIndicatorProps={{
          style: { 
            backgroundColor: theme.palette.error.main,
            height: '3px',
            borderRadius: '3px 3px 0 0',
          },
        }}
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            color: 'text.secondary',
            minHeight: '56px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              color: 'text.primary',
              backgroundColor: alpha(theme.palette.error.main, 0.08),
            },
            '&.Mui-selected': {
              color: 'error.main',
              fontWeight: 600,
            },
          },
        }}
      >
        <Tab
          icon={
            <Badge 
              color="error" 
              variant="dot" 
              invisible={true} // Add notification logic here
            >
              <ChatOutlined />
            </Badge>
          }
          label="Inbox"
          onMouseEnter={() => setHoverTabIndex(0)}
          onMouseLeave={() => setHoverTabIndex(-1)}
        />
        <Tab
          icon={
            <Badge 
              color="error" 
              variant="dot" 
              invisible={true} // Add notification logic here
            >
              <Public />
            </Badge>
          }
          label="Global Chat"
          onMouseEnter={() => setHoverTabIndex(1)}
          onMouseLeave={() => setHoverTabIndex(-1)}
        />
      </Tabs>
    </Box>
  );

  // Enhanced input area with better UX
  const renderChatInput = () => (
    <Box sx={{ position: 'relative' }}>
      <ReplyPreview 
        selectedMessage={selectedMessage}
        onClear={() => setSelectedMessage(INITIAL_STATES.SELECTED_MESSAGE)}
      />
      
      <Box sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        background: (theme) => alpha(theme.palette.background.paper, 0.8),
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <TextField
          ref={textareaRef}
          multiline
          maxRows={4}
          fullWidth
          variant="outlined"
          color="error"
          placeholder={isChatEnabled ? 'Type your message...' : 'Chat restricted to verified users'}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={!isChatEnabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'transparent',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: alpha(theme.palette.error.main, 0.3),
              },
              '&.Mui-focused fieldset': {
                borderColor: 'error.main',
                borderWidth: '2px',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '0.9rem',
              lineHeight: 1.4,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Add emoji" arrow>
                    <Button
                      onClick={handleEmojiToggle}
                      color="error"
                      variant={emojiAnchorEl ? "contained" : "outlined"}
                      size="small"
                      sx={{ 
                        minWidth: '40px', 
                        width: '40px', 
                        height: '40px', 
                        p: 0,
                        borderRadius: '8px',
                      }}
                    >
                      <InsertEmoticon sx={{ fontSize: '20px' }} />
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Add GIF" arrow>
                    <Button
                      onClick={handleGifToggle}
                      color="error"
                      variant={gifAnchorEl ? "contained" : "outlined"}
                      size="small"
                      sx={{ 
                        minWidth: '40px', 
                        width: '40px', 
                        height: '40px', 
                        p: 0,
                        borderRadius: '8px',
                      }}
                    >
                      <Gif sx={{ fontSize: '22px' }} />
                    </Button>
                  </Tooltip>
                </Box>
              </InputAdornment>
            ),
          }}
        />
        
        <Tooltip title="Send message" arrow>
          <Button
            onClick={() => {
              if (text.trim()) {
                const e = { key: 'Enter', shiftKey: false, preventDefault: () => {}, stopPropagation: () => {} };
                handleKeyDown(e);
              }
            }}
            variant="contained"
            color="error"
            disabled={!text.trim() || !isChatEnabled}
            sx={{
              minWidth: '48px',
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              boxShadow: text.trim() && isChatEnabled ? '0 4px 12px rgba(255, 0, 0, 0.3)' : 'none',
              '&:hover': {
                boxShadow: text.trim() && isChatEnabled ? '0 6px 16px rgba(255, 0, 0, 0.4)' : 'none',
                transform: text.trim() && isChatEnabled ? 'translateY(-1px)' : 'none',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <SendIcon sx={{ fontSize: '20px' }} />
          </Button>
        </Tooltip>
      </Box>
      
      {/* Character count indicator */}
      {text.length > CONFIG.MAX_MESSAGE_LENGTH * 0.8 && (
        <Typography 
          variant="caption" 
          color={text.length >= CONFIG.MAX_MESSAGE_LENGTH ? "error" : "text.secondary"}
          sx={{ 
            position: 'absolute',
            bottom: '-20px',
            right: '8px',
            fontSize: '0.7rem',
          }}
        >
          {text.length}/{CONFIG.MAX_MESSAGE_LENGTH}
        </Typography>
      )}
    </Box>
  );

  // Enhanced emoji popover
  const renderEmojiPopover = () => (
    <Popover
      open={Boolean(emojiAnchorEl)}
      anchorEl={emojiAnchorEl}
      onClose={() => setEmojiAnchorEl(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      PaperProps={{
        sx: {
          mt: -1,
          borderRadius: '16px',
          minWidth: '320px',
          maxWidth: '400px',
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Choose an Emoji
        </Typography>
        
        <TextField
          ref={emojiSearchRef}
          size="small"
          fullWidth
          placeholder="Search emojis..."
          value={emojiSearchTerm}
          onChange={(e) => setEmojiSearchTerm(e.target.value)}
          color="error"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="error" sx={{ fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />
        
        <EmojiGrid 
          emojis={EMOJI_LIST}
          onEmojiSelect={handleEmojiSelect}
          searchTerm={emojiSearchTerm}
        />
      </Box>
    </Popover>
  );

  // Enhanced GIF popover
  const renderGifPopover = () => (
    <Popover
      open={Boolean(gifAnchorEl)}
      anchorEl={gifAnchorEl}
      onClose={() => setGifAnchorEl(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      PaperProps={{
        sx: {
          mt: -1,
          borderRadius: '16px',
          minWidth: '350px',
          maxWidth: '450px',
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Choose a GIF
        </Typography>
        
        <TextField
          ref={gifSearchRef}
          size="small"
          fullWidth
          placeholder="Search GIFs..."
          value={gifSearchTerm}
          onChange={(e) => setGifSearchTerm(e.target.value)}
          color="error"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="error" sx={{ fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />
        
        <GifGrid 
          gifs={gifs}
          onGifSelect={handleGifSelect}
          loading={isGifLoading}
        />
      </Box>
    </Popover>
  );

  // Loading fallback for lazy components
  const LazyComponentFallback = ({ height = "400px" }) => (
    <Box sx={{ 
      height, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 2,
    }}>
      <CircularProgress color="error" size={32} />
      <Typography variant="body2" color="text.secondary">
        Loading chat...
      </Typography>
    </Box>
  );

  // Cleanup effects
  useEffect(() => {
    return () => {
      // Cleanup typing indicator on unmount
      if (isTyping && socket && user?._id) {
        socket.emit('TYPING_STOP', { userId: user._id });
      }
    };
  }, [isTyping, socket, user?._id]);

  // Main render
  return (
    <ThemeProvider theme={customTheme}>
      <Box
        className="chat-wrapper"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header with tabs */}
        <Box>
          {renderTabs()}
        </Box>

        {/* Chat content */}
        <Box sx={{ flex: 1, overflow: 'scroll' }}>
          <Suspense fallback={<LazyComponentFallback />}>
            {selectedTabIndex === 0 ? (
              <MyChat
                highlightChatId={highlightChatId}
                is_mobile={is_mobile}
                toggleDrawer={toggleDrawer}
              />
            ) : (
              <GlobalChat
                emojis={EMOJI_LIST}
                setSelectedMessage={setSelectedMessage}
                selectedMessage={selectedMessage}
                onlineUserList={onlineUserList}
              />
            )}
          </Suspense>
        </Box>

        {/* Chat input (only for Global Chat) */}
        {selectedTabIndex === 1 && (
          <Box sx={{ pt: 1 }}>
            {renderChatInput()}
          </Box>
        )}

        {/* Popovers */}
        {renderEmojiPopover()}
        {renderGifPopover()}
      </Box>
    </ThemeProvider>
  );
}

export default React.memo(ChatPanel);