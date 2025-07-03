import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from '@mui/material';

import {
  InsertEmoticon,
  Gif,
  Clear,
  ChatOutlined,
  Public,
} from '@mui/icons-material';

import GlobalChat from './GlobalChat';
import MyChat from './MyChat';
import { setFocused } from '../../redux/Auth/user.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

/**
 * List of custom emoji data for chat functionality
 * Each emoji has a command, image URL, and alt text for accessibility
 */
const EMOJI_LIST = [
  { command: ':bot:', url: '/img/emotes/brokenbot.webp', alt: 'broken bot' },
  { command: ':dance:', url: '/img/emotes/dance.webp', alt: 'dance' },
  { command: ':goofy:', url: '/img/emotes/goofy.webp', alt: 'goofy' },
  { command: ':cook:', url: '/img/emotes/cook.webp', alt: 'cook' },
  { command: ':catcute:', url: '/img/emotes/catcute.webp', alt: 'cat cute' },
  { command: ':gang:', url: '/img/emotes/gangSigns.webp', alt: 'gang signs' },
  { command: ':happy:', url: '/img/emotes/happy.webp', alt: 'happy' },
  { command: ':sus:', url: '/img/emotes/sus.webp', alt: 'sus' },
  { command: ':flatearth:', url: '/img/emotes/flatearth.webp', alt: 'flat earth' },
  { command: ':pepedance:', url: '/img/emotes/pepepe.webp', alt: 'pepe dance' },
  { command: ':leo:', url: '/img/emotes/leo.webp', alt: 'leo' },
  { command: ':wellyousee:', url: '/img/emotes/wellyousee.webp', alt: 'wellyousee' },
  { command: ':laugh:', url: '/img/emotes/laugh.webp', alt: 'laugh' },
  { command: ':randomemote:', url: '/img/emotes/randomemote.webp', alt: 'randomemote' },
  { command: ':rainbow:', url: '/img/emotes/rainbow.webp', alt: 'rainbow' },
  { command: ':cross:', url: '/img/emotes/cross.webp', alt: 'cross' },
  { command: ':nyancat:', url: '/img/emotes/nyancat.webp', alt: 'nyan cat' },
  { command: ':babycar:', url: '/img/emotes/babycar.webp', alt: 'baby car' },
  { command: ':sexykiss:', url: '/img/emotes/sexykiss.webp', alt: 'sexy kiss' },
  { command: ':sexyclap:', url: '/img/emotes/sexyclap.webp', alt: 'sexy clap' },
  { command: ':sexyfinger:', url: '/img/emotes/sexyfinger.webp', alt: 'sexy finger' },
  { command: ':pickle:', url: '/img/emotes/pickle.webp', alt: 'pickle' },
  { command: ':trooperbae:', url: '/img/emotes/trooperbae.webp', alt: 'storm trooper bae' },
  { command: ':catpop:', url: '/img/emotes/catpop.webp', alt: 'catpop' },
  { command: ':brother:', url: '/img/emotes/brother.webp', alt: 'brother' },
  { command: ':pepenou:', url: '/img/emotes/pepenou.webp', alt: 'pepenou' },
  { command: ':skibidi:', url: '/img/emotes/skibidi.webp', alt: 'skibidi' },
  { command: ':salute:', url: '/img/emotes/salute.webp', alt: 'salute' },
  { command: ':bananacat:', url: '/img/emotes/bananacat.webp', alt: 'banana cat' },
  { command: ':sadthink:', url: '/img/emotes/sadthink.webp', alt: 'sadthink' },
  { command: ':alien:', url: '/img/emotes/alien.webp', alt: 'alien' },
  { command: ':chad:', url: '/img/emotes/chad.webp', alt: 'chad' },
  { command: ':pog:', url: '/img/emotes/pog.webp', alt: 'pog' },
  { command: ':gift:', url: '/img/emotes/gift.webp', alt: 'gift' },
  { command: ':dababy:', url: '/img/emotes/dababy.webp', alt: 'dababy' },
  { command: ':dababyw:', url: '/img/emotes/dababyw.webp', alt: 'dababyw' },
  { command: ':poggies:', url: '/img/emotes/poggies.webp', alt: 'poggies' },
  { command: ':beg:', url: '/img/emotes/beg.webp', alt: 'beg' },
  { command: ':angry:', url: '/img/emotes/angry.webp', alt: 'angry' },
  { command: ':pepesad:', url: '/img/emotes/pepesad.webp', alt: 'pepesad' },
  { command: ':cry:', url: '/img/emotes/cry.webp', alt: 'cry' },
  { command: ':wutdog:', url: '/img/emotes/wutdog.webp', alt: 'wutdog' },
  { command: ':wut:', url: '/img/emotes/wut.webp', alt: 'wut' },
  { command: ':pogger:', url: '/img/emotes/pogger.webp', alt: 'pogger' },
  { command: ':pleasecat:', url: '/img/emotes/pleasecat.webp', alt: 'please cat' },
  { command: ':nocap:', url: '/img/emotes/nocap.webp', alt: 'nocap' },
  { command: ':mexican:', url: '/img/emotes/mexican.webp', alt: 'cat' },
  { command: ':mike:', url: '/img/emotes/mike.webp', alt: 'mike' },
  { command: ':kekw:', url: '/img/emotes/kekw.webp', alt: 'kekw' },
  { command: ':butwhy:', url: '/img/emotes/butwhy.webp', alt: 'butwhy' },
  { command: ':sui:', url: '/img/emotes/sui.webp', alt: 'sui' },
  { command: ':lucky:', url: '/img/emotes/lucky.webp', alt: 'lucky' },
  { command: ':hodl:', url: '/img/emotes/hodl.webp', alt: 'hodl' },
  { command: ':doge:', url: '/img/emotes/doge.webp', alt: 'doge' },
  { command: ':3head:', url: '/img/emotes/3head.webp', alt: '3head' },
  { command: ':check:', url: '/img/emotes/check.webp', alt: 'check' },
  { command: ':pepetypo:', url: '/img/emotes/pepetypo.webp', alt: 'pepe typo' },
  { command: ':kirby:', url: '/img/emotes/kirby.webp', alt: 'kirby' },
  { command: ':wow:', url: '/img/emotes/wow.webp', alt: 'wow' },
  { command: ':cat:', url: '/img/emotes/cat.webp', alt: 'cat' },
  { command: ':moneypepe:', url: '/img/emotes/moneypepe.webp', alt: 'moneypepe' },
  { command: ':truemf:', url: '/img/emotes/truemf.webp', alt: 'truemf' },
  { command: ':hattip:', url: '/img/emotes/hattip.webp', alt: 'hat tip' },
  { command: ':simp:', url: '/img/emotes/simp.webp', alt: 'simp' },
  { command: ':1x:', url: '/img/emotes/1x.webp', alt: '1x' },
  { command: ':fortnite:', url: '/img/emotes/fortnite.webp', alt: 'fortnite' },
  { command: ':kodak:', url: '/img/emotes/kodak.webp', alt: 'kodak' },
  { command: ':ain:', url: '/img/emotes/ain.webp', alt: 'ain' },
  { command: ':troll:', url: '/img/emotes/troll.webp', alt: 'troll' },
  { command: ':minecraftcookie:', url: '/img/emotes/minecraftcookie.webp', alt: 'minecraftcookie' },
];// Move emoji list to a separate file

// Constants
const GIPHY_API_KEY = 'EoYYQ1kbX7mRfqwJ6xC4M6wgQmds4Dq1';
const INITIAL_GIF_STATE = { loaded: false, url: '', title: '' };
const INITIAL_SELECTED_MESSAGE = {
  sender: null,
  avatar: null,
  rank: null,
  accessory: null,
  elite: null,
  message: null,
  messageType: null,
  time: null,
};

/**
 * ChatPanel component for displaying and interacting with global and personal chats
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.is_mobile - Whether the device is mobile
 * @param {Function} props.toggleDrawer - Function to toggle drawer
 * @param {string} props.highlightChatId - ID of chat to highlight
 * @returns {JSX.Element} Chat panel component
 */
function ChatPanel({ is_mobile, toggleDrawer, highlightChatId }) {
  const dispatch = useDispatch();

  // Redux state
  const { isAuthenticated, isDarkMode, userName, user, socket } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    isDarkMode: state.auth.isDarkMode,
    userName: state.auth.userName,
    user: state.auth.user,
    socket: state.auth.socket,
  }));

  const onlineUserList = useSelector((state) => state.logic.onlineUserList);

  // Get stored tab index from local storage
  const storedTabIndex = localStorage.getItem('selectedTabIndex');
  const initialTabIndex = storedTabIndex !== null ? parseInt(storedTabIndex, 10) : 1;

  // Local state
  const [selectedTabIndex, setSelectedTabIndex] = useState(initialTabIndex);
  const [text, setText] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [gifAnchorEl, setGifAnchorEl] = useState(null);
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(INITIAL_SELECTED_MESSAGE);
  const [hoverTabIndex, setHoverTabIndex] = useState(-1);

  const textareaRef = useRef(null);
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const isChatEnabled = isAuthenticated && getRank(user?.totalWagered) >= 1;

  const handleClearReply = useCallback(() => {
    setSelectedMessage(INITIAL_SELECTED_MESSAGE);
  }, []);

  // Persist tab index to local storage
  useEffect(() => {
    localStorage.setItem('selectedTabIndex', selectedTabIndex);
  }, [selectedTabIndex]);

  // Message handlers
  const handleSendMessage = useCallback((message) => {
    // Add socket validation to prevent errors
    if (!socket || !socket.connected || typeof socket.emit !== 'function') {
      console.warn('Cannot send message - socket not ready');
      dispatch(errorMsgBar('Chat connection lost. Please refresh the page.'));
      return;
    }

    try {
      socket.emit('GLOBAL_CHAT_SEND', message);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      dispatch(errorMsgBar('Failed to send message. Please try again.'));
    }
  }, [socket?.id, dispatch]);

  const onTextAreaKeyDown = useCallback((e) => {
    e.stopPropagation();

    if (!socket?.connected || !user?._id) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        dispatch(errorMsgBar('Please wait for connection...'));
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedText = text.trim();

      if (trimmedText !== '') {
        const message = {
          sender: user.username || userName,
          senderId: user._id,
          username: user.username || userName,
          message: trimmedText,
          avatar: user.avatar,
          accessory: user.accessory,
          elite: user.elite,
          replyTo: selectedMessage.sender ? selectedMessage : null, // Check this condition
          rank: user.totalWagered,
        };

        // 🔍 DEBUG: Log the reply data being sent
     
        handleSendMessage(message);
        handleClearReply();
        setText('');
      }
    }
  }, [socket?.connected, user, userName, text, selectedMessage, handleSendMessage, handleClearReply, dispatch]);


  const handleTabChange = useCallback((_, newValue) => {
    setSelectedTabIndex(newValue);
  }, []);

  const handleMouseEnter = useCallback((index) => {
    setHoverTabIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverTabIndex(-1);
  }, []);

  // Focus handlers
  const onFocusHandler = useCallback(() => {
    dispatch(setFocused(true));
  }, [dispatch]);

  const onBlurHandler = useCallback(() => {
    dispatch(setFocused(false));
  }, [dispatch]);

  // Text input handler
  const onChangeText = useCallback((e) => {
    setText(e.target.value);
  }, []);

  // -------------------- Emoji Handlers --------------------
  const handleEmojiClick = useCallback((event) => {
    setEmojiAnchorEl(prev => prev ? null : event.currentTarget);
  }, []);

  const handleCloseEmojiPopover = useCallback(() => {
    setEmojiAnchorEl(null);
  }, []);

  const insertEmoji = useCallback((emojiCommand) => {
    const foundEmoji = EMOJI_LIST.find((emoji) => emoji.command === emojiCommand);
    if (foundEmoji) {
      setText(prev => prev + foundEmoji.command);
      textareaRef.current?.focus();
    }
  }, []);

  // -------------------- GIF Handlers --------------------
  const handleGifButtonClick = useCallback((event) => {
    setGifAnchorEl(prev => prev ? null : event.currentTarget);
  }, []);

  const handleCloseGifPopover = useCallback(() => {
    setGifAnchorEl(null);
  }, []);

  const handleGifClick = useCallback((gifUrl) => {
    if (!user?._id || !socket?.connected) {
      dispatch(errorMsgBar('Connection not ready. Please wait...'));
      return;
    }

    // Check if socket is actually ready to send
    if (typeof socket.emit !== 'function') {
      console.error('Socket emit not available');
      dispatch(errorMsgBar('Chat connection error. Please refresh the page.'));
      return;
    }

    try {
      const message = {
        type: 'gif',
        content: gifUrl,
      };

      socket.emit('GLOBAL_CHAT_SEND', {
        sender: user.username || userName, // <-- FIX: Ensure sender is not empty
        senderId: user._id,
        message: JSON.stringify(message),
        rank: user.totalWagered,
        avatar: user.avatar,
        accessory: user.accessory,
        elite: user.elite,
        messageType: 'gif',
      });

      setGifAnchorEl(null);
      setEmojiAnchorEl(null);
    } catch (error) {
      console.error('❌ Failed to send GIF:', error);
      dispatch(errorMsgBar('Failed to send GIF. Please try again.'));
    }
  }, [user, socket?.id, socket?.connected, userName, dispatch]);


  const handleGifLoad = useCallback((index) => {
    setGifs(prevGifs => {
      const updated = [...prevGifs];
      updated[index] = {
        ...updated[index],
        loaded: true,
      };
      return updated;
    });
  }, []);

  const handleSearchGifs = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setGifs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm.trim()}&limit=20`;
      const response = await axios.get(url);

      const fetchedGifs = response.data.data.map((gif) => ({
        ...INITIAL_GIF_STATE,
        url: gif.images.fixed_height.url,
        title: gif.title,
      }));

      setGifs(fetchedGifs);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInputChange = useCallback((event) => {
    const searchTerm = event.target.value;
    const debounceTimer = setTimeout(() => {
      handleSearchGifs(searchTerm);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [handleSearchGifs]);

  // UI elements
  const renderTabs = () => (
    <Tabs
      value={selectedTabIndex}
      onChange={handleTabChange}
      TabIndicatorProps={{
        style: { backgroundColor: '#FF0000' },
      }}
      sx={{
        '& .MuiTab-root': {
          textTransform: 'none',
          color: 'white',
          '& .MuiTab-iconWrapper': {
            color: 'grey',
            transition: 'color 0.3s ease',
          },
          '&:hover .MuiTab-iconWrapper': {
            color: 'white',
          },
          '&.Mui-selected': {
            color: 'white',
            '& .MuiTab-iconWrapper': {
              color: '#FF0000',
            },
          },
        },
      }}
    >
      <Tab
        className="custom-tab"
        icon={
          <ChatOutlined
            sx={{
              color: hoverTabIndex === 0 || selectedTabIndex === 0 ? 'white' : 'grey',
              transition: 'color 0.3s ease',
            }}
          />
        }
        onMouseEnter={() => handleMouseEnter(0)}
        onMouseLeave={handleMouseLeave}
      />
      <Tab
        className="custom-tab"
        icon={
          <Public
            sx={{
              color: hoverTabIndex === 1 || selectedTabIndex === 1 ? 'white' : 'grey',
              transition: 'color 0.3s ease',
            }}
          />
        }
        onMouseEnter={() => handleMouseEnter(1)}
        onMouseLeave={handleMouseLeave}
      />
    </Tabs>
  );

  const renderReplyPreview = () => (
    selectedMessage.sender && (
      <Box
        sx={{
          bottom: '60px',
          p: 1,
          zIndex: 1,
          borderRadius: 1,
          bgcolor: 'background.default',
          position: 'absolute',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ mr: 1, fontSize: 'small' }}>Reply to:</Box>
          <Box
            className="player"
            sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
          >
            <Avatar
              rank={selectedMessage.rank}
              accessory={selectedMessage.accessory}
              elite={selectedMessage.elite}
              src={selectedMessage.avatar}
              username={selectedMessage.sender}
              user_id={selectedMessage.senderId}
              alt="Avatar"
            />
          </Box>
          <Box sx={{ flex: 1, fontSize: 'small', mr: '10px' }}>
            {selectedMessage.sender}
          </Box>
          <Button
            onClick={handleClearReply}
            color="error"
            variant="outlined"
            size="small"
            sx={{ minWidth: '32px' }}
          >
            <Clear />
          </Button>
        </Box>
      </Box>
    )
  );

  const renderChatInput = () => (
    <TextField
      color="error"
      type="text"
      className="form-control"
      variant="outlined"
      onFocus={onFocusHandler}
      onBlur={onBlurHandler}
      onKeyDown={onTextAreaKeyDown}
      placeholder={isChatEnabled ? 'CHAT HERE...' : 'VETS ONLY'}
      onChange={onChangeText}
      value={text}
      inputRef={textareaRef}
      disabled={!isChatEnabled}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end" sx={{ minWidth: '80px' }}>
            <Button
              onClick={handleEmojiClick}
              color="error"
              variant="outlined"
              sx={{ minWidth: '32px', height: '32px', mr: 1 }}
            >
              <InsertEmoticon style={{ fontSize: '18px' }} />
            </Button>
            <Button
              onClick={handleGifButtonClick}
              color="error"
              variant="outlined"
              sx={{ minWidth: '32px', height: '32px' }}
            >
              <Gif style={{ fontSize: '24px' }} />
            </Button>
          </InputAdornment>
        ),
      }}
    />
  );

  const renderEmojiPopover = () => {
    const openEmojiPopover = Boolean(emojiAnchorEl);

    return (
      <Popover
        open={openEmojiPopover}
        elevation={0}
        anchorEl={emojiAnchorEl}
        onClose={handleCloseEmojiPopover}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transitionDuration={0}
        PaperProps={{
          sx: {
            p: 1,
            borderRadius: '12px',
            maxWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            bgcolor: 'rgba(25, 25, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {EMOJI_LIST.map((emojiItem) => (
            <Box
              key={emojiItem.command}
              component="img"
              src={emojiItem.url}
              alt={emojiItem.alt}
              onClick={() => insertEmoji(emojiItem.command)}
              sx={{
                width: '30px',
                height: '30px',
                objectFit: 'cover',
                cursor: 'pointer',
                borderRadius: 1,
                '&:hover': { opacity: 0.8, transform: 'scale(1.1)' },
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>
      </Popover>
    );
  };

  const renderGifPopover = () => {
    const openGifPopover = Boolean(gifAnchorEl);

    return (
      <Popover
        open={openGifPopover}
        anchorEl={gifAnchorEl}
        onClose={handleCloseGifPopover}
        elevation={0}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transitionDuration={0}
        PaperProps={{
          sx: {
            p: 1,
            borderRadius: '12px',
            maxWidth: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            bgcolor: 'rgba(25, 25, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          },
        }}
      >
        <Box sx={{ mb: 1 }}>
          <TextField
            color="error"
            type="text"
            placeholder="SEARCH GIFS..."
            variant="outlined"
            onChange={handleSearchInputChange}
            fullWidth
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, gap: 1 }}>
            <CircularProgress color="error" size={20} />
            <Typography variant="body2">Loading GIFs...</Typography>
          </Box>
        ) : gifs.length === 0 ? (
          <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
            Search for GIFs to display
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
            }}
          >
            {gifs.map((gif, index) => (
              <Box
                key={index}
                sx={{ position: 'relative', width: 80, height: 80 }}
              >
                {!gif.loaded && (
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={80}
                    sx={{ borderRadius: '4px' }}
                  />
                )}
                {gif.url && (
                  <img
                    src={gif.url}
                    alt={gif.title}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: gif.loaded ? 'block' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                    onLoad={() => handleGifLoad(index)}
                    onClick={() => handleGifClick(gif.url)}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    );
  };

  // Main component render
  return (
    <ThemeProvider theme={theme}>
      <Box
        className="chat-wrapper"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 1,
          color: 'white',
          border: '0',
          background: 'rgba(25, 25, 25, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Tab Navigation */}
        {renderTabs()}

        {/* Tab Content */}
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

        {/* Chat Input Section (only for Global Chat tab) */}
        {selectedTabIndex === 1 && (
          <Box className="chat-input-panel" sx={{ mt: 2 }}>
            {renderReplyPreview()}
            {renderChatInput()}
            {renderEmojiPopover()}
            {renderGifPopover()}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default React.memo(ChatPanel);