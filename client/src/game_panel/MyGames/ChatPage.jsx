import React, { useState, useRef, useEffect, useCallback, memo, Suspense, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getChatRoomInfo,
  addChatLog,
  getMyChat,
  loadOlderChatMessages,
} from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPaperPlane,
  faImage,
  faFileAlt,
  faSmile,
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';

import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Lazy load components for better performance
const Avatar = React.lazy(() => import('../../components/Avatar'));
const PlayerModal = React.lazy(() => import('../modal/PlayerModal'));
const Footer = React.lazy(() => import('../main_pages/Footer'));
const ChatPanel = React.lazy(() => import('../ChatPanel/ChatPanel'));

import {
  Button,
  Popover,
  Typography,
  Drawer,
  Box,
  Skeleton,
  TextField,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Fade,
  Tooltip,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';

// Enhanced constants with better organization
const CONFIG = {
  SCROLL_LOAD_THRESHOLD: 20,
  SCROLL_NEAR_BOTTOM_THRESHOLD: 50,
  CHAT_LOG_SKELETON_COUNT: 8,
  MAX_MESSAGE_LENGTH: 2000,
  TYPING_INDICATOR_TIMEOUT: 3000,
  MESSAGE_BATCH_SIZE: 20,
  AUTO_SCROLL_DELAY: 100,
  DEBOUNCE_DELAY: 300,
};

const EMOJI_DATA = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
  '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤝',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '⭐', '✨', '💫', '🌟', '💯', '🎉', '🎊', '🎈', '🎁',
];

// Compact emoji picker component
const EmojiPicker = memo(({ onSelectEmoji, onClose, anchorEl, open }) => {
  const [recentEmojis, setRecentEmojis] = useState(() => {
    const stored = localStorage.getItem('recentEmojis');
    return stored ? JSON.parse(stored) : [];
  });

  const handleEmojiSelect = useCallback((emoji) => {
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecent);
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
    onSelectEmoji(emoji);
    onClose();
  }, [onSelectEmoji, recentEmojis, onClose]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          width: 280,
          maxHeight: 240,
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ p: 1 }}>
        {recentEmojis.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', px: 1 }}>
              Recent
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(8, 1fr)', 
              gap: 0.5,
              mt: 0.5,
              mb: 1,
            }}>
              {recentEmojis.slice(0, 8).map((emoji, index) => (
                <Button
                  key={`recent-${emoji}-${index}`}
                  variant="text"
                  onClick={() => handleEmojiSelect(emoji)}
                  sx={{
                    minWidth: '28px',
                    height: '28px',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    p: 0,
                    '&:hover': {
                      bgcolor: 'rgba(255, 0, 0, 0.1)',
                    },
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(8, 1fr)', 
          gap: 0.5,
          maxHeight: 160,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: '2px' 
          },
        }}>
          {EMOJI_DATA.map((emoji, index) => (
            <Button
              key={`emoji-${emoji}-${index}`}
              variant="text"
              onClick={() => handleEmojiSelect(emoji)}
              sx={{
                minWidth: '28px',
                height: '28px',
                fontSize: '1rem',
                borderRadius: '4px',
                p: 0,
                '&:hover': {
                  bgcolor: 'rgba(255, 0, 0, 0.1)',
                },
              }}
            >
              {emoji}
            </Button>
          ))}
        </Box>
      </Box>
    </Popover>
  );
});

// Compact message item
const ChatMessageItem = memo(({ 
  messageData, 
  currentUserId, 
  onOpenPlayerModal, 
  isConsecutive = false,
  showTimestamp = true,
}) => {
  const isMyMessage = messageData.from === currentUserId;
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);

  const handleAvatarClick = useCallback(() => {
    const targetUserId = isMyMessage ? currentUserId : messageData.from;
    onOpenPlayerModal(targetUserId);
  }, [isMyMessage, onOpenPlayerModal, currentUserId, messageData.from]);

  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    
    return showFullTimestamp 
      ? date.toLocaleString()
      : date.toLocaleDateString();
  }, [showFullTimestamp]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMyMessage ? 'flex-end' : 'flex-start',
        mb: isConsecutive ? 0.5 : 1.5,
        mx: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMyMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 1,
          maxWidth: '70%',
        }}
      >
        {!isConsecutive && (
          <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0 }}>
            <Suspense fallback={<Skeleton variant="circular" width={28} height={28} />}>
              <Avatar
                src={messageData.avatar}
                username={messageData.senderName}
                user_id={messageData.from}
                style={{ width: 28, height: 28 }}
              />
            </Suspense>
          </IconButton>
        )}

        <Box
          sx={{
            padding: '8px 12px',
            borderRadius: '12px',
            background: isMyMessage 
              ? '#ff0000'
              : 'rgba(255, 255, 255, 0.05)',
            color: isMyMessage ? '#fff' : 'rgba(255, 255, 255, 0.9)',
            maxWidth: '100%',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.8rem',
            lineHeight: 1.4,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {messageData.message}
          
          {isMyMessage && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              mt: 0.5,
              opacity: 0.7,
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                {messageData.is_read ? '✓✓' : '✓'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {showTimestamp && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          onClick={() => setShowFullTimestamp(!showFullTimestamp)}
          sx={{ 
            mt: 0.25,
            cursor: 'pointer',
            fontSize: '0.65rem',
            opacity: 0.6,
            '&:hover': { opacity: 1 },
          }}
        >
          {formatTimestamp(messageData.created_at || messageData.timestamp)}
        </Typography>
      )}
    </Box>
  );
});

// Compact chat log display
const ChatLogDisplay = memo(({
  chatLogs,
  currentUserId,
  onOpenPlayerModal,
  isFetchingOlderMessages,
  isLoadingRoom,
  chatLogPanelRef,
  onScroll,
  typingIndicator,
}) => {
  const groupedMessages = useMemo(() => {
    return chatLogs.reduce((groups, message, index) => {
      const prevMessage = chatLogs[index - 1];
      const isConsecutive = prevMessage && 
        prevMessage.from === message.from && 
        (new Date(message.created_at) - new Date(prevMessage.created_at)) < 300000;
      
      groups.push({ ...message, isConsecutive });
      return groups;
    }, []);
  }, [chatLogs]);

  if (isLoadingRoom) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        {[...Array(CONFIG.CHAT_LOG_SKELETON_COUNT)].map((_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: index % 2 === 0 ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              mb: 1.5,
              gap: 1,
            }}
          >
            <Skeleton variant="circular" width={28} height={28} />
            <Box sx={{ flex: 1, maxWidth: '70%' }}>
              <Skeleton 
                variant="rectangular" 
                height={Math.random() * 30 + 30} 
                sx={{ borderRadius: '12px', mb: 0.25 }} 
              />
              <Skeleton variant="text" width="25%" height={10} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      ref={chatLogPanelRef}
      onScroll={onScroll}
      sx={{
        flex: 1,
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.01)',
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { 
          background: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: '2px' 
        },
      }}
    >
      {isFetchingOlderMessages && (
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          p: 1,
        }}>
          <CircularProgress size={16} color="error" />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading...
          </Typography>
        </Box>
      )}

      <Box sx={{ py: 1 }}>
        {groupedMessages.map((message, index) => (
          <ChatMessageItem
            key={message._id || message.timestamp || index}
            messageData={message}
            currentUserId={currentUserId}
            onOpenPlayerModal={onOpenPlayerModal}
            isConsecutive={message.isConsecutive}
            showTimestamp={!message.isConsecutive || index === groupedMessages.length - 1}
          />
        ))}
      </Box>

      {typingIndicator && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          opacity: 0.7,
        }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{ 
                width: 4, 
                height: 4, 
                borderRadius: '50%', 
                bgcolor: '#ff0000',
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </Box>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {typingIndicator.username} is typing...
          </Typography>
        </Box>
      )}
    </Box>
  );
});

// Compact chat header
const ChatHeader = memo(({
  onNavigateBack,
  onOpenPlayerModal,
  chatPartnerUserId,
  chatPartnerAvatar,
  chatPartnerUsername,
  chatPartnerAccessory,
  chatPartnerElite,
  isOnline,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleUserClick = useCallback(() => {
    if (chatPartnerUserId) {
      onOpenPlayerModal(chatPartnerUserId);
    }
  }, [chatPartnerUserId, onOpenPlayerModal]);

  const handleMenuOpen = useCallback((event) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Back button */}
      <IconButton
        onClick={onNavigateBack}
        size="small"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': { color: '#fff' },
        }}
      >
        <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '14px' }} />
      </IconButton>

      {/* Chat partner info */}
      {chatPartnerUsername && (
        <Box
          onClick={handleUserClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flex: 1,
            cursor: 'pointer',
            mx: 2,
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <Suspense fallback={<Skeleton variant="circular" width={36} height={36} />}>
            <Avatar
              src={chatPartnerAvatar}
              username={chatPartnerUsername}
              accessory={chatPartnerAccessory}
              elite={chatPartnerElite}
              user_id={chatPartnerUserId}
              style={{ width: 36, height: 36 }}
            />
          </Suspense>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {chatPartnerUsername}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: isOnline ? '#4caf50' : 'rgba(255, 255, 255, 0.6)', 
              fontSize: '0.7rem' 
            }}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Menu button */}
      <IconButton 
        onClick={handleMenuOpen} 
        size="small"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': { color: '#fff' },
        }}
      >
        <FontAwesomeIcon icon={faEllipsisV} style={{ fontSize: '14px' }} />
      </IconButton>

      {/* Options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            minWidth: 150,
            '& .MuiMenuItem-root': {
              fontSize: '0.8rem',
              py: 0.75,
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              },
            },
          }
        }}
      >
        <MenuItem onClick={handleUserClick}>View Profile</MenuItem>
      </Menu>
    </Box>
  );
});

// Compact input area
const ChatInputArea = memo(({
  text,
  onTextChange,
  onSendMessage,
  onKeyDown,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

  const handleEmojiToggle = useCallback((event) => {
    setEmojiAnchorEl(prev => prev ? null : event.currentTarget);
  }, []);

  const handleSend = useCallback(() => {
    if (text.trim() && !disabled) {
      onSendMessage();
    }
  }, [text, disabled, onSendMessage]);

  return (
    <Box
      sx={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        px: 1,
        '&:focus-within': {
          borderColor: '#ff0000',
        },
      }}>
        <TextField
          multiline
          maxRows={3}
          fullWidth
          variant="standard"
          placeholder={placeholder}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '0.8rem',
              color: '#fff',
              '& textarea': {
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                },
              },
            },
          }}
          sx={{ py: 1 }}
        />

        {/* Character count */}
        {text.length > CONFIG.MAX_MESSAGE_LENGTH * 0.8 && (
          <Typography
            variant="caption"
            color={text.length >= CONFIG.MAX_MESSAGE_LENGTH ? "error" : "text.secondary"}
            sx={{ fontSize: '0.65rem', minWidth: 'fit-content' }}
          >
            {text.length}/{CONFIG.MAX_MESSAGE_LENGTH}
          </Typography>
        )}

        {/* Emoji button */}
        <IconButton
          onClick={handleEmojiToggle}
          disabled={disabled}
          size="small"
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#fff' },
          }}
        >
          <FontAwesomeIcon icon={faSmile} style={{ fontSize: '14px' }} />
        </IconButton>

        {/* Send button */}
        {text.trim() && (
          <IconButton
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            size="small"
            sx={{
              color: '#ff0000',
              '&:hover': { bgcolor: 'rgba(255, 0, 0, 0.1)' },
              '&:disabled': { color: 'rgba(255, 255, 255, 0.3)' },
            }}
          >
            <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '14px' }} />
          </IconButton>
        )}
      </Box>

      {/* Emoji Picker */}
      <EmojiPicker
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        onSelectEmoji={(emoji) => {
          onTextChange(text + emoji);
        }}
      />
    </Box>
  );
});

// Main ChatPage component
function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  // Redux state selection
  const {
    currentUser,
    socket,
    isAuthenticated,
    chatPartnerUserId,
    chatPartnerAvatar,
    chatPartnerAccessory,
    chatPartnerElite,
    chatPartnerUsername,
    chatLogs,
    hasMoreMessages,
    isMobile,
    isDrawerOpen,
    isDarkMode,
    selectedMobileTab,
    isLoadingRoom,
    isFetchingOlderMessages,
  } = useSelector(
    useCallback((state) => ({
      currentUser: state.auth.user,
      socket: state.auth.socket,
      isAuthenticated: state.auth.isAuthenticated,
      chatPartnerUserId: state.logic.chatRoomInfo.user_id,
      chatPartnerAvatar: state.logic.chatRoomInfo.avatar,
      chatPartnerAccessory: state.logic.chatRoomInfo.accessory,
      chatPartnerElite: state.logic.chatRoomInfo.elite,
      chatPartnerUsername: state.logic.chatRoomInfo.username,
      chatLogs: state.logic.chatRoomInfo.chatLogs || [],
      hasMoreMessages: state.logic.chatRoomInfo.hasMore,
      isMobile: Boolean(state.logic.is_mobile),
      isDrawerOpen: state.auth.isDrawerOpen,
      isDarkMode: state.auth.isDarkMode,
      selectedMobileTab: state.logic.selectedMobileTab,
      isLoadingRoom: state.logic.isActiveLoadingOverlay,
      isFetchingOlderMessages: state.logic.fetchingOlder,
    }), [])
  );

  // Local state
  const [text, setText] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(null);

  // Refs
  const chatLogPanelRef = useRef(null);
  const oldScrollHeightRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // Theme
  const customTheme = useMemo(() => getCustomTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode]);

  // Scroll management
  const handleScroll = useCallback((event) => {
    const panel = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = panel;

    const atBottom = scrollHeight - (scrollTop + clientHeight) < CONFIG.SCROLL_NEAR_BOTTOM_THRESHOLD;
    setIsUserAtBottom(atBottom);

    if (scrollTop < CONFIG.SCROLL_LOAD_THRESHOLD && hasMoreMessages && !isFetchingOlderMessages) {
      oldScrollHeightRef.current = scrollHeight;
      dispatch(loadOlderChatMessages(routeId));
    }
  }, [dispatch, routeId, hasMoreMessages, isFetchingOlderMessages]);

  // Message sending
  const sendMessage = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !currentUser?._id || !chatPartnerUserId) return;

    const chatMessage = {
      _id: `temp_${Date.now()}`,
      to: chatPartnerUserId,
      from: currentUser._id,
      message: trimmedText,
      is_read: false,
      created_at: new Date().toISOString(),
      senderName: currentUser.username,
      avatar: currentUser.avatar,
      temporary: true,
    };

    dispatch(addChatLog(chatMessage));
    setText('');

    if (socket) {
      socket.emit('SEND_CHAT', chatMessage);
    }
  }, [text, currentUser, chatPartnerUserId, dispatch, socket]);

  // Keyboard handling
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
    
    if (event.key === 'Escape') {
      setText('');
    }

    // Typing indicator
    if (socket && currentUser?._id && text.trim()) {
      socket.emit('TYPING_START', { 
        chatId: routeId, 
        userId: currentUser._id,
        username: currentUser.username,
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('TYPING_STOP', { chatId: routeId, userId: currentUser._id });
      }, CONFIG.TYPING_INDICATOR_TIMEOUT);
    }
  }, [sendMessage, socket, currentUser, routeId, text]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = (data) => {
      if (data.chatId === routeId && data.userId !== currentUser?._id) {
        setTypingIndicator({ username: data.username });
      }
    };

    const handleTypingStop = (data) => {
      if (data.chatId === routeId) {
        setTypingIndicator(null);
      }
    };

    socket.on('TYPING_START', handleTypingStart);
    socket.on('TYPING_STOP', handleTypingStop);

    return () => {
      socket.off('TYPING_START', handleTypingStart);
      socket.off('TYPING_STOP', handleTypingStop);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, routeId, currentUser?._id]);

  // Initial data loading
  useEffect(() => {
    if (routeId) {
      dispatch(getChatRoomInfo(routeId, 0, CONFIG.MESSAGE_BATCH_SIZE));
      if (isAuthenticated) {
        dispatch(getMyChat());
      }
    }
  }, [routeId, dispatch, isAuthenticated]);

  // Auto-scroll management
  useEffect(() => {
    const panel = chatLogPanelRef.current;
    if (!panel) return;

    if (!isFetchingOlderMessages && oldScrollHeightRef.current > 0) {
      const newScrollHeight = panel.scrollHeight;
      panel.scrollTop = newScrollHeight - oldScrollHeightRef.current;
      oldScrollHeightRef.current = 0;
    } else if (isUserAtBottom && chatLogs.length > 0 && !isLoadingRoom) {
      setTimeout(() => {
        if (panel) {
          panel.scrollTop = panel.scrollHeight;
        }
      }, CONFIG.AUTO_SCROLL_DELAY);
    }
  }, [chatLogs, isFetchingOlderMessages, isUserAtBottom, isLoadingRoom]);

  // Event handlers
  const handleOpenPlayerModal = useCallback((playerId) => {
    setSelectedPlayerId(playerId);
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
    setSelectedPlayerId(null);
  }, []);

  const handleNavigateBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleToggleDrawer = useCallback(() => {
    dispatch(toggleDrawer(!isDrawerOpen));
  }, [dispatch, isDrawerOpen]);

  // Loading fallback component
  const LoadingFallback = ({ height = "200px" }) => (
    <Box sx={{ 
      height, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 1,
    }}>
      <CircularProgress color="error" size={24} />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
        Loading...
      </Typography>
    </Box>
  );

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.02)',
        color: '#fff',
      }}>
        {/* Player Modal */}
        {showPlayerModal && selectedPlayerId && (
          <Suspense fallback={<LoadingFallback />}>
            <PlayerModal
              selectedCreator={selectedPlayerId}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
            />
          </Suspense>
        )}

        {/* Mobile Chat Drawer */}
        {isMobile && selectedMobileTab === 'chat' && (
          <Drawer
            variant="persistent"
            anchor="left"
            open={isDrawerOpen}
            sx={{
              '& .MuiDrawer-paper': {
                width: 280,
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <Suspense fallback={<LoadingFallback height="100%" />}>
              <ChatPanel
                is_mobile={isMobile}
                toggleDrawer={handleToggleDrawer}
              />
            </Suspense>
          </Drawer>
        )}

        {/* Main Chat Area */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
        }}>
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            m: 1,
            overflow: 'hidden',
          }}>
            {/* Chat Header */}
            <ChatHeader
              onNavigateBack={handleNavigateBack}
              onOpenPlayerModal={handleOpenPlayerModal}
              chatPartnerUserId={chatPartnerUserId}
              chatPartnerAvatar={chatPartnerAvatar}
              chatPartnerUsername={chatPartnerUsername}
              chatPartnerAccessory={chatPartnerAccessory}
              chatPartnerElite={chatPartnerElite}
              isOnline={true} // Add real online status logic
            />

            {/* Chat Messages */}
            <ChatLogDisplay
              chatLogs={chatLogs}
              currentUserId={currentUser?._id}
              onOpenPlayerModal={handleOpenPlayerModal}
              isFetchingOlderMessages={isFetchingOlderMessages}
              isLoadingRoom={isLoadingRoom}
              chatLogPanelRef={chatLogPanelRef}
              onScroll={handleScroll}
              typingIndicator={typingIndicator}
            />

            {/* Chat Input */}
            <ChatInputArea
              text={text}
              onTextChange={setText}
              onSendMessage={sendMessage}
              onKeyDown={handleKeyDown}
              disabled={!chatPartnerUserId}
              placeholder={chatPartnerUserId ? "Type a message..." : "Select a chat to start messaging"}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Suspense fallback={null}>
          <Footer open={isDrawerOpen} />
        </Suspense>
      </Box>
    </ThemeProvider>
  );
}

export default ChatPage;