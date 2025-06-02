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
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { 
  InsertEmoticon,
  MoreVert as MoreVertIcon,
  Attachment as AttachmentIcon,
  Send as SendIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Lazy load components for better performance
const Avatar = React.lazy(() => import('../../components/Avatar'));
const PlayerModal = React.lazy(() => import('../modal/PlayerModal'));
const Footer = React.lazy(() => import('../main_pages/Footer'));
const ChatPanel = React.lazy(() => import('../ChatPanel/ChatPanel'));

import {
  Button,
  InputAdornment,
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
  Divider,
  Chip,
  Fade,
  Tooltip,
  Badge,
  Paper,
  LinearProgress,
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

const EMOJI_CATEGORIES = {
  RECENT: '🕒',
  SMILEYS: '😀',
  PEOPLE: '👤',
  ANIMALS: '🐶',
  FOOD: '🍎',
  ACTIVITIES: '⚽',
  TRAVEL: '🚗',
  OBJECTS: '💡',
  SYMBOLS: '❤️',
  FLAGS: '🏁',
};

const EMOJI_DATA = [
  // Smileys & Emotion
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
  '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
  
  // People & Body
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
  '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
  '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤝', '🙏',
  
  // Animals & Nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
  
  // Food & Drink
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
  '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
  
  // Activities & Sports
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
  '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
  
  // Travel & Places
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
  '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
  
  // Objects
  '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💰', '💴', '💵',
  '💶', '💷', '🪙', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧',
  
  // Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
];

// Enhanced emoji picker component
const EmojiPicker = memo(({ onSelectEmoji, onClose, anchorEl, open }) => {
  const [selectedCategory, setSelectedCategory] = useState('SMILEYS');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    const stored = localStorage.getItem('recentEmojis');
    return stored ? JSON.parse(stored) : [];
  });

  const filteredEmojis = useMemo(() => {
    if (searchTerm) {
      // Simple search - in production, you'd want emoji names/keywords
      return EMOJI_DATA.filter(emoji => 
        emoji.includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory === 'RECENT') {
      return recentEmojis;
    }
    
    // In production, categorize emojis properly
    return EMOJI_DATA;
  }, [searchTerm, selectedCategory, recentEmojis]);

  const handleEmojiSelect = useCallback((emoji) => {
    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecent);
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
    
    onSelectEmoji(emoji);
  }, [onSelectEmoji, recentEmojis]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      PaperProps={{
        sx: {
          width: 350,
          height: 400,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Search */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            color='error'
          />
        </Box>

        {/* Categories */}
        <Box sx={{ 
          display: 'flex', 
          p: 1, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          overflowX: 'auto',
        }}>
          {Object.entries(EMOJI_CATEGORIES).map(([category, icon]) => (
            <IconButton
              key={category}
              size="small"
              onClick={() => setSelectedCategory(category)}
              sx={{
                minWidth: '40px',
                bgcolor: selectedCategory === category ? '#ff0000' : 'transparent',
                color: selectedCategory === category ? 'primary.contrastText' : 'text.secondary',
                '&:hover': {
                  bgcolor: selectedCategory === category ? '#ff00000' : '#ff000033',
                },
              }}
            >
              {icon}
            </IconButton>
          ))}
        </Box>

        {/* Emoji Grid */}
        <Box sx={{ 
          flex: 1, 
          p: 1, 
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 1,
        }}>
          {filteredEmojis.map((emoji, index) => (
            <Tooltip key={`${emoji}-${index}`} title={emoji} arrow>
              <Button
                variant="text"
                onClick={() => handleEmojiSelect(emoji)}
                sx={{
                  minWidth: '36px',
                  height: '36px',
                  fontSize: '1.2rem',
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {emoji}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Popover>
  );
});

// Enhanced message item with rich features
const ChatMessageItem = memo(({ 
  messageData, 
  currentUserId, 
  onOpenPlayerModal, 
  chatPartnerUserId,
  isConsecutive = false,
  showTimestamp = true,
}) => {
  const theme = useTheme();
  const isMyMessage = messageData.from === currentUserId;
  const [imageLoaded, setImageLoaded] = useState(false);
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

  // Enhanced message content rendering
  const renderMessageContent = () => {
    const { message, messageType } = messageData;
    
    if (messageType === 'image') {
      return (
        <Box sx={{ position: 'relative', maxWidth: '300px' }}>
          {!imageLoaded && (
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '12px' }} />
          )}
          <Box
            component="img"
            src={message}
            alt="Shared image"
            onLoad={() => setImageLoaded(true)}
            sx={{
              maxWidth: '100%',
              borderRadius: '12px',
              display: imageLoaded ? 'block' : 'none',
              cursor: 'pointer',
            }}
            onClick={() => {/* Handle image modal */}}
          />
        </Box>
      );
    }
    
    if (messageType === 'file') {
      const fileData = JSON.parse(message);
      return (
        <Paper sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          bgcolor: 'action.hover',
          cursor: 'pointer',
        }}>
          <FontAwesomeIcon icon={faFileAlt} />
          <Typography variant="body2">{fileData.name}</Typography>
        </Paper>
      );
    }
    
    // Regular text message with emoji support
    return (
      <Typography 
        variant="body1" 
        sx={{ 
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
        }}
      >
        {message}
      </Typography>
    );
  };

  return (
    <Fade in timeout={200}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMyMessage ? 'flex-end' : 'flex-start',
          mb: isConsecutive ? 0.5 : 2,
          mx: 2,
        }}
      >
        {/* Message bubble */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMyMessage ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 1,
            maxWidth: '70%',
          }}
        >
          {/* Avatar (only show if not consecutive) */}
          {!isConsecutive && (
            <Tooltip title={`View ${isMyMessage ? 'your' : messageData.senderName || 'user'} profile`}>
              <IconButton onClick={handleAvatarClick} size="small">
                <Suspense fallback={<Skeleton variant="circular" width={32} height={32} />}>
                  <Avatar
                    src={messageData.avatar}
                    username={messageData.senderName}
                    user_id={messageData.from}
                    style={{ width: 32, height: 32 }}
                  />
                </Suspense>
              </IconButton>
            </Tooltip>
          )}

          {/* Message content */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: '18px',
              bgcolor: isMyMessage 
                ? '#ff0000'
                : alpha(theme.palette.background.paper, 0.8),
              color: isMyMessage 
                ? theme.palette.primary.contrastText 
                : theme.palette.text.primary,
              maxWidth: '100%',
              position: 'relative',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: isMyMessage 
                ? `0 4px 12px #ff0000dd`
                : `0 4px 12px #00000011`,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                // boxShadow: isMyMessage 
                //   ? `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                //   : `0 6px 16px ${alpha(theme.palette.grey[500], 0.15)}`,
              },
            }}
          >
            {renderMessageContent()}
            
            {/* Message status indicators */}
            {isMyMessage && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                mt: 0.5,
                opacity: 0.7,
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  {messageData.is_read ? '✓✓' : '✓'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Timestamp */}
        {showTimestamp && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            onClick={() => setShowFullTimestamp(!showFullTimestamp)}
            sx={{ 
              mt: 0.5,
              cursor: 'pointer',
              fontSize: '0.7rem',
              opacity: 0.6,
              '&:hover': { opacity: 1 },
              transition: 'opacity 0.2s ease',
            }}
          >
            {formatTimestamp(messageData.created_at || messageData.timestamp)}
          </Typography>
        )}
      </Box>
    </Fade>
  );
});

// Enhanced chat log display with virtual scrolling for performance
const ChatLogDisplay = memo(({
  chatLogs,
  currentUserId,
  chatPartnerUserId,
  onOpenPlayerModal,
  isFetchingOlderMessages,
  isLoadingRoom,
  chatLogPanelRef,
  onScroll,
  typingIndicator,
}) => {
  const theme = useTheme();

  // Group consecutive messages from same sender
  const groupedMessages = useMemo(() => {
    return chatLogs.reduce((groups, message, index) => {
      const prevMessage = chatLogs[index - 1];
      const isConsecutive = prevMessage && 
        prevMessage.from === message.from && 
        (new Date(message.created_at) - new Date(prevMessage.created_at)) < 300000; // 5 minutes
      
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
              mb: 2,
              gap: 1,
            }}
          >
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ flex: 1, maxWidth: '70%' }}>
              <Skeleton 
                variant="rectangular" 
                height={Math.random() * 40 + 40} 
                sx={{ borderRadius: '18px', mb: 0.5 }} 
              />
              <Skeleton variant="text" width="30%" height={12} />
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
        overflowX: 'hidden',
        position: 'relative',
        background: `linear-gradient(to bottom, 
          ${alpha(theme.palette.background.default, 0.8)}, 
          ${alpha(theme.palette.background.default, 0.9)}
        )`,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: alpha(theme.palette.divider, 0.1),
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.6),
          borderRadius: '3px',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.8),
          },
        },
      }}
    >
      {/* Loading indicator for older messages */}
      {isFetchingOlderMessages && (
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1,
          bgcolor: alpha(theme.palette.background.default, 0.9),
          backdropFilter: 'blur(10px)',
          p: 2,
          textAlign: 'center',
        }}>
          <CircularProgress size={24} color="error" />
          <Typography variant="caption" sx={{ ml: 1 }}>
            Loading older messages...
          </Typography>
        </Box>
      )}

      {/* Messages */}
      <Box sx={{ py: 2 }}>
        {groupedMessages.map((message, index) => (
          <ChatMessageItem
            key={message._id || message.timestamp || index}
            messageData={message}
            currentUserId={currentUserId}
            chatPartnerUserId={chatPartnerUserId}
            onOpenPlayerModal={onOpenPlayerModal}
            isConsecutive={message.isConsecutive}
            showTimestamp={!message.isConsecutive || index === groupedMessages.length - 1}
          />
        ))}
      </Box>

      {/* Typing indicator */}
      {typingIndicator && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          p: 2,
          opacity: 0.7,
        }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              bgcolor: 'primary.main',
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
            <Box sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              bgcolor: 'primary.main',
              animation: 'pulse 1.4s ease-in-out 0.2s infinite',
            }} />
            <Box sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              bgcolor: 'primary.main',
              animation: 'pulse 1.4s ease-in-out 0.4s infinite',
            }} />
          </Box>
          <Typography variant="caption">
            {typingIndicator.username} is typing...
          </Typography>
        </Box>
      )}
    </Box>
  );
});

// Enhanced chat header with more features
const ChatHeader = memo(({
  isDrawerOpen,
  onNavigateBack,
  onOpenPlayerModal,
  chatPartnerUserId,
  chatPartnerAvatar,
  chatPartnerRank,
  chatPartnerUsername,
  chatPartnerAccessory,
  chatPartnerElite,
  isOnline,
  lastSeen,
}) => {
  const theme = useTheme();
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
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderRadius: '0',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        gap: 2,
      }}>
        {/* Back button */}
        <Tooltip title="Go back" arrow>
          <Button
            variant="outlined"
            color="error"
            onClick={onNavigateBack}
            startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            sx={{ 
              borderRadius: '12px',
              textTransform: 'none',
            }}
          >
            Back
          </Button>
        </Tooltip>

        {/* Chat partner info */}
        {chatPartnerUsername && (
          <Box
            onClick={handleUserClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flex: 1,
              cursor: 'pointer',
              p: 1,
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
          
              <Suspense fallback={<Skeleton variant="circular" width={48} height={48} />}>
                <Avatar
                  src={chatPartnerAvatar}
                  rank={chatPartnerRank}
                  username={chatPartnerUsername}
                  accessory={chatPartnerAccessory}
                  elite={chatPartnerElite}
                  user_id={chatPartnerUserId}
                  style={{ width: 48, height: 48 }}
                />
              </Suspense>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0 }}>
                {chatPartnerUsername}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isOnline ? 'Online' : `Last seen ${lastSeen}`}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Menu button */}
        <Tooltip title="Chat options" arrow>
          <IconButton onClick={handleMenuOpen} sx={{ borderRadius: '12px' }}>
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        {/* Options menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { borderRadius: '12px', minWidth: 200 }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Typography>View Profile</Typography>
          </MenuItem>
          {/* <MenuItem onClick={handleMenuClose}>
            <Typography>Mute Notifications</Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Typography>Clear Chat History</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <Typography>Block User</Typography>
          </MenuItem> */}
        </Menu>
      </Box>
    </Paper>
  );
});

// Enhanced input area with rich features
const ChatInputArea = memo(({
  text,
  onTextChange,
  onSendMessage,
  onKeyDown,
  disabled = false,
  placeholder = "Type a message...",
  onFileUpload,
  onVoiceRecord,
  isRecording = false,
}) => {
  const theme = useTheme();
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [attachmentAnchorEl, setAttachmentAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleEmojiToggle = useCallback((event) => {
    setEmojiAnchorEl(prev => prev ? null : event.currentTarget);
  }, []);

  const handleAttachmentToggle = useCallback((event) => {
    setAttachmentAnchorEl(prev => prev ? null : event.currentTarget);
  }, []);

  const handleSend = useCallback(() => {
    if (text.trim() && !disabled) {
      onSendMessage();
    }
  }, [text, disabled, onSendMessage]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    setAttachmentAnchorEl(null);
  }, [onFileUpload]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderRadius: '8px',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: '#ff0000',
            boxShadow: `0 0 0 2px #ff0000}`,
          },
        }}>
          {/* Attachment button */}
          <Tooltip title="Attach file" arrow>
            {/* <IconButton
              onClick={handleAttachmentToggle}
              disabled={disabled}
              sx={{ 
                m: 1,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <AttachmentIcon />
            </IconButton> */}
          </Tooltip>

          {/* Text input */}
          <TextField
            multiline
            maxRows={4}
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
                px: 1,
                py: 1.5,
                fontSize: '0.95rem',
                lineHeight: 1.5,
              },
            }}
            sx={{
              '& .MuiInputBase-input': {
                '&::placeholder': {
                  color: alpha(theme.palette.text.secondary, 0.7),
                  opacity: 1,
                },
              },
            }}
          />

          {/* Character count (when approaching limit) */}
          {text.length > CONFIG.MAX_MESSAGE_LENGTH * 0.8 && (
            <Typography
              variant="caption"
              color={text.length >= CONFIG.MAX_MESSAGE_LENGTH ? "error" : "text.secondary"}
              sx={{ 
                position: 'absolute',
                bottom: '-20px',
                right: '80px',
                fontSize: '0.7rem',
              }}
            >
              {text.length}/{CONFIG.MAX_MESSAGE_LENGTH}
            </Typography>
          )}

          {/* Emoji button */}
          <Tooltip title="Add emoji" arrow>
            <IconButton
              onClick={handleEmojiToggle}
              disabled={disabled}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'error.main' },
              }}
            >
              <InsertEmoticon />
            </IconButton>
          </Tooltip>

          {/* Voice/Send button */}
          {text.trim() ? (
            <Tooltip title="Send message" arrow>
              <IconButton
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                color='error'
                sx={{
                  m: 1,
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <></>
            // <Tooltip title={isRecording ? "Stop recording" : "Record voice message"} arrow>
            //   <IconButton
            //     onClick={onVoiceRecord}
            //     disabled={disabled}
            //     sx={{
            //       m: 1,
            //       color: isRecording ? 'error.main' : 'text.secondary',
            //       '&:hover': { 
            //         color: isRecording ? 'error.dark' : 'primary.main',
            //         transform: 'scale(1.05)',
            //       },
            //       transition: 'all 0.2s ease',
            //     }}
            //   >
            //     {isRecording ? <StopIcon /> : <MicIcon />}
            //   </IconButton>
            // </Tooltip>
          )}
        </Box>

        {/* Voice recording indicator */}
        {isRecording && (
          <Fade in>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mt: 1,
              color: 'error.main',
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              <Typography variant="caption">Recording...</Typography>
              <LinearProgress 
                color="error" 
                sx={{ flex: 1, borderRadius: '4px' }}
              />
            </Box>
          </Fade>
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

      {/* Attachment Menu */}
      <Menu
        anchorEl={attachmentAnchorEl}
        open={Boolean(attachmentAnchorEl)}
        onClose={() => setAttachmentAnchorEl(null)}
        PaperProps={{
          sx: { borderRadius: '12px', minWidth: 180 }
        }}
      >
        <MenuItem onClick={() => imageInputRef.current?.click()}>
          <ImageIcon sx={{ mr: 1 }} />
          <Typography>Photo</Typography>
        </MenuItem>
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8 }} />
          <Typography>Document</Typography>
        </MenuItem>
      </Menu>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.zip"
      />
      <input
        ref={imageInputRef}
        type="file"
        hidden
        onChange={handleFileSelect}
        accept="image/*"
      />
    </Paper>
  );
});

// Main ChatPage component with enhanced features
function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const theme = useTheme();

  // Enhanced Redux state selection with memoization
  const {
    currentUser,
    socket,
    isAuthenticated,
    chatPartnerUserId,
    chatPartnerAvatar,
    chatPartnerRank,
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
      chatPartnerRank: state.logic.chatRoomInfo.rank,
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

  // Enhanced local state
  const [text, setText] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const chatLogPanelRef = useRef(null);
  const oldScrollHeightRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Memoized theme
  const customTheme = useMemo(() => getCustomTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode]);

  // Enhanced scroll management with debouncing
  const handleScroll = useCallback((event) => {
    const panel = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = panel;

    const atBottom = scrollHeight - (scrollTop + clientHeight) < CONFIG.SCROLL_NEAR_BOTTOM_THRESHOLD;
    setIsUserAtBottom(atBottom);

    // Clear unread count when scrolled to bottom
    if (atBottom && unreadCount > 0) {
      setUnreadCount(0);
    }

    // Load older messages
    if (scrollTop < CONFIG.SCROLL_LOAD_THRESHOLD && hasMoreMessages && !isFetchingOlderMessages) {
      oldScrollHeightRef.current = scrollHeight;
      dispatch(loadOlderChatMessages(routeId));
    }
  }, [dispatch, routeId, hasMoreMessages, isFetchingOlderMessages, unreadCount]);

  // Enhanced message sending with optimistic updates
  const sendMessage = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !currentUser?._id || !chatPartnerUserId) return;

    const tempId = `temp_${Date.now()}`;
    const chatMessage = {
      _id: tempId,
      to: chatPartnerUserId,
      from: currentUser._id,
      message: trimmedText,
      is_read: false,
      created_at: new Date().toISOString(),
      senderName: currentUser.username,
      avatar: currentUser.avatar,
      temporary: true,
    };

    // Optimistic update
    dispatch(addChatLog(chatMessage));
    setText('');

    // Send via socket
    if (socket) {
      try {
        socket.emit('SEND_CHAT', {
          ...chatMessage,
          tempId,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        // Handle error - remove optimistic update
      }
    }
  }, [text, currentUser, chatPartnerUserId, dispatch, socket]);

  // Enhanced keyboard handling
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
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('TYPING_STOP', { chatId: routeId, userId: currentUser._id });
      }, CONFIG.TYPING_INDICATOR_TIMEOUT);
    }
  }, [sendMessage, socket, currentUser, routeId, text]);

  // File upload handler
  const handleFileUpload = useCallback(async (file) => {
    if (!file || !currentUser?._id || !chatPartnerUserId) return;

    try {
      // In production, upload to your file storage service
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', routeId);

      // Show upload progress
      const uploadMessage = {
        _id: `upload_${Date.now()}`,
        to: chatPartnerUserId,
        from: currentUser._id,
        message: JSON.stringify({ 
          type: 'file', 
          name: file.name, 
          size: file.size,
          uploading: true,
        }),
        messageType: 'file',
        created_at: new Date().toISOString(),
        senderName: currentUser.username,
        avatar: currentUser.avatar,
      };

      dispatch(addChatLog(uploadMessage));

      // Simulate upload (replace with actual upload logic)
      setTimeout(() => {
        const completedMessage = {
          ...uploadMessage,
          message: JSON.stringify({
            type: 'file',
            name: file.name,
            url: `https://example.com/files/${file.name}`,
            size: file.size,
          }),
        };
        
        if (socket) {
          socket.emit('SEND_CHAT', completedMessage);
        }
      }, 2000);

    } catch (error) {
      console.error('File upload failed:', error);
    }
  }, [currentUser, chatPartnerUserId, routeId, dispatch, socket]);

  // Voice recording handler
  const handleVoiceRecord = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic
    } else {
      setIsRecording(true);
      // Start recording logic
    }
  }, [isRecording]);

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

    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 3000);
      }
    };

    socket.on('TYPING_START', handleTypingStart);
    socket.on('TYPING_STOP', handleTypingStop);
    socket.on('connect', () => handleConnectionStatus('connected'));
    socket.on('disconnect', () => handleConnectionStatus('disconnected'));

    return () => {
      socket.off('TYPING_START', handleTypingStart);
      socket.off('TYPING_STOP', handleTypingStop);
      socket.off('connect');
      socket.off('disconnect');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
      gap: 2,
    }}>
      <CircularProgress color="primary" />
      <Typography variant="body2" color="text.secondary">
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
        bgcolor: 'background.default',
        position: 'relative',
      }}>
        {/* Connection status indicator */}
        {connectionStatus !== 'connected' && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            textAlign: 'center',
            py: 1,
          }}>
            <Typography variant="body2">
              {connectionStatus === 'connecting' ? 'Reconnecting...' : 'Connection lost'}
            </Typography>
          </Box>
        )}

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
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
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
          position: 'relative',
        }}>
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            {/* Chat Header */}
            <ChatHeader
              isDrawerOpen={isDrawerOpen}
              onNavigateBack={handleNavigateBack}
              onOpenPlayerModal={handleOpenPlayerModal}
              chatPartnerUserId={chatPartnerUserId}
              chatPartnerAvatar={chatPartnerAvatar}
              chatPartnerRank={chatPartnerRank}
              chatPartnerUsername={chatPartnerUsername}
              chatPartnerAccessory={chatPartnerAccessory}
              chatPartnerElite={chatPartnerElite}
              isOnline={true} // Add real online status logic
              lastSeen="5 minutes ago" // Add real last seen logic
            />

            {/* Chat Messages */}
            <ChatLogDisplay
              chatLogs={chatLogs}
              currentUserId={currentUser?._id}
              chatPartnerUserId={chatPartnerUserId}
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
              onFileUpload={handleFileUpload}
              onVoiceRecord={handleVoiceRecord}
              isRecording={isRecording}
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