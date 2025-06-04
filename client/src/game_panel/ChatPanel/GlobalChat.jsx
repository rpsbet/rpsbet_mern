import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FixedSizeList as VirtualizedList } from 'react-window';
import Avatar from '../../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointDown } from '@fortawesome/free-solid-svg-icons';
import { 
  Skeleton, 
  Box, 
  ButtonBase, 
  CircularProgress, 
  Fade,
  Typography,
  Tooltip
} from '@mui/material';

const PlayerModal = React.lazy(() => import('../modal/PlayerModal'));

// Utility function with better error handling
const safeParseJSON = (jsonString, defaultValue = null) => {
  if (typeof jsonString !== 'string' || !jsonString.trim()) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed && typeof parsed.content === 'string' ? parsed : defaultValue;
  } catch (e) {
    console.warn("Failed to parse JSON string:", e);
    return defaultValue;
  }
};

// Enhanced emoji wrapping with caching
const createEmojiWrapper = (() => {
  const cache = new Map();
  
  return (message, emojis, keyPrefix = '') => {
    if (!message || typeof message !== 'string') return null;
    
    const cacheKey = `${keyPrefix}-${message}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const validEmojis = Array.isArray(emojis) ? emojis : [];
    const result = message.split(/(:\w+:)/g).map((part, i) => {
      if (part.startsWith(':') && part.endsWith(':')) {
        const emojiObj = validEmojis.find((e) => e.command === part);
        if (emojiObj) {
          const { url, alt } = emojiObj;
          return (
            <img 
              key={`${keyPrefix}-${i}-emoji-${part}`} 
              src={url} 
              alt={alt} 
              className="emoji" 
              style={{ 
                width: '20px', 
                height: '20px', 
                verticalAlign: 'middle', 
                margin: '0 2px',
                objectFit: 'contain'
              }}
              // loading="lazy"
            />
          );
        }
      }
      return part;
    });
    
    // Cache with size limit
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, result);
    
    return result;
  };
})();

// Enhanced message item with better performance and modern styling
const ChatMessageItem = React.memo(({
  chat,
  isPending,
  effectiveIsDarkMode,
  emojis,
  onOpenPlayerModal,
  onMessageClick,
  isSelected,
  style
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoized content rendering
  const { wrappedMessage, wrappedReplyMessage, gifContent, replyGifContent } = useMemo(() => {
    const msgKey = `msg-${chat.id || chat.senderId}-${chat.time}`;
    const replyKey = `reply-${chat.id || chat.senderId}-${chat.time}`;
    
    return {
      wrappedMessage: chat.messageType === 'gif' ? null : 
        createEmojiWrapper(chat.message, emojis, msgKey),
      wrappedReplyMessage: (!chat.replyTo || chat.replyTo.messageType === 'gif') ? null :
        createEmojiWrapper(chat.replyTo.message, emojis, replyKey),
      gifContent: chat.messageType === 'gif' ? safeParseJSON(chat.message) : null,
      replyGifContent: chat.replyTo?.messageType === 'gif' ? 
        safeParseJSON(chat.replyTo.message) : null
    };
  }, [chat.id, chat.senderId, chat.time, chat.message, chat.messageType, chat.replyTo, emojis]);

  // Event handlers
  const handleItemClick = useCallback((e) => {
    e.preventDefault();
    onMessageClick(chat);
  }, [onMessageClick, chat]);

  const handleAvatarClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    onOpenPlayerModal(chat.senderId);
  }, [onOpenPlayerModal, chat.senderId]);

  const handleReplyAvatarClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (chat.replyTo?.senderId) {
      onOpenPlayerModal(chat.replyTo.senderId);
    }
  }, [onOpenPlayerModal, chat.replyTo?.senderId]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Enhanced modern styling with glassmorphism
  const messageStyle = {
    background: '#2f2f2f',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: isSelected 
      ? '2px solidrgb(255, 0, 21)' 
      : effectiveIsDarkMode 
        ? '1px solid rgba(255, 255, 255, 0.1)' 
        : '1px solid rgba(0, 0, 0, 0.05)',
    borderRadius: '12px',
    boxShadow: isSelected 
      ? '0 8px 32px rgba(255, 71, 87, 0.3), 0 0 0 1px rgba(255, 0, 21, 0.2)' 
      : effectiveIsDarkMode 
        ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
        : '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isPending ? 0.7 : 1,
    position: 'relative',
    overflow: 'hidden',
  };

  // Add subtle animated gradient for special messages
  const specialMessageOverlay = chat.sender === 'SYSTEM' ? {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(0, 255, 58, 0.1), transparent)',
      animation: 'shimmer 2s infinite',
    }
  } : {};

  return (
    <div style={style}>
      <Box
        className={`chat-line ${chat.sender === 'SYSTEM' ? 'special-message' : ''} ${
          chat.sender === 'SYSTEM' && chat.message?.includes('debt') ? 'special-message-rent' : ''
        } ${isPending ? 'pending-message' : ''} ${isSelected ? 'selected-message' : ''}`}
        onClick={handleItemClick}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          mb: 2,
          transition: 'transform 0.2s ease',
      
          ...specialMessageOverlay,
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleItemClick(e)}
      >
        {/* Reply Section with enhanced glassmorphism */}
        {chat.replyTo?.message && (
          <Fade in timeout={300}>
            <Box className="reply-to" sx={{ 
              mb: 1, 
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 45,
                top: -10,
                width: 2,
                height: 30,
              }
            }}>
              <Tooltip 
                title={`Reply to ${chat.replyTo.username}`} 
                arrow
                placement="top"
                
              >
                <ButtonBase
                  className="chat-player"
                  onClick={handleReplyAvatarClick}
                 
                >
                    <div className="reply-border" style={{
                    borderColor: 'rgba(255, 0, 21, 0.3)',
                    borderWidth: '2px',
                    borderStyle: 'solid solid solid solid',
                    borderRight: 'none',
                  }} />
                  <Avatar
                    className="avatar"
                    src={chat.replyTo.avatar}
                    alt={`${chat.replyTo.username || 'Replied user'}'s avatar`}
                    username={chat.replyTo.username}
                    rank={chat.replyTo.rank}
                    accessory={chat.replyTo.accessory}
                    elite={chat.replyTo.elite}
                    user_id={chat.replyTo.senderId}
                    darkMode={true}
                  />
                </ButtonBase>
              </Tooltip>
              <Typography 
                variant="caption" 
                className="reply-sender sender-name"
                sx={{ 
                  fontWeight: 700,
                  color: '#ff4757',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                {chat.replyTo.username}
              </Typography>
              <Typography 
                variant="body2" 
                className="reply-message chat-text"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                  opacity: 0.8,
                  fontStyle: 'italic',
                }}
              >
                {replyGifContent?.content ? (
                  <img 
                    src={replyGifContent.content} 
                    alt="GIF reply" 
                    style={{ 
                      maxHeight: '60px', 
                      maxWidth: '100px', 
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ) : (
                  wrappedReplyMessage
                )}
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Main Message Content */}
        <div className="chat-content">
          <Tooltip 
            title={`View ${chat.sender}'s profile`} 
            arrow
            placement="top"
            
          >
            <ButtonBase
              className="chat-player"
              onClick={handleAvatarClick}
              sx={{ 
                zIndex: 1,
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <Avatar
                className="avatar"
                src={chat.avatar}
                elite={chat.elite}
                accessory={chat.accessory}
                alt={`${chat.sender || 'User'}'s avatar`}
                user_id={chat.senderId}
                username={chat.sender}
                rank={chat.rank}
                darkMode={true}
              />
            </ButtonBase>
          </Tooltip>

          <Box className="chat-msg" sx={messageStyle}>
            <Typography 
              variant="subtitle2" 
              className="sender-name"
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg,rgb(255, 0, 21),rgb(255, 0, 25))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '0.9rem',
              }}
            >
              {chat.sender}
            </Typography>
            
            <Typography 
              variant="body2" 
              className="chat-text"
              component="div"
              sx={{ 
                wordBreak: 'break-word',
                lineHeight: 1.5,
                color: effectiveIsDarkMode ? '#e1e5e9' : '#2c3e50',
              }}
            >
              {isPending ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#ff4757' }} />
                  <Typography variant="caption" sx={{ 
                    opacity: 0.7,
                    fontStyle: 'italic',
                  }}>
                    Sending...
                  </Typography>
                </Box>
              ) : gifContent?.content ? (
                <Box sx={{ position: 'relative' }}>
                  {!imageLoaded && !imageError && (
                    <Skeleton 
                      variant="rectangular" 
                      width={200} 
                      height={150} 
                      sx={{ 
                        borderRadius: '12px',
                        bgcolor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  )}
                  {!imageError && (
                    <img 
                      src={gifContent.content} 
                      alt="GIF message" 
                      style={{ 
                        maxHeight: '150px', 
                        maxWidth: '100%', 
                        borderRadius: '12px',
                        display: imageLoaded ? 'block' : 'none',
                        objectFit: 'cover',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      }}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  )}
                  {imageError && (
                    <Box sx={{ 
                      p: 2, 
                      background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.1), rgba(255, 71, 87, 0.05))',
                      borderRadius: '12px',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                    }}>
                      <Typography variant="caption" sx={{ color: '#ff4757', fontWeight: 600 }}>
                        Failed to load GIF
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                wrappedMessage
              )}
            </Typography>
          </Box>

          {/* Enhanced timestamp with modern styling */}
          <Box className="chat-time" sx={{ position: 'absolute', right: '10px' }}>
           
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  opacity: 0.6,
                  color: effectiveIsDarkMode ? '#a0a6ab' : '#6c757d',
                 
                  display: 'inline-block',
                  cursor: 'pointer',
                  
                }}
              >
                {typeof chat.time === 'string' || typeof chat.time === 'number' 
                  ? chat.time 
                  : ''}
              </Typography>
          </Box>
        </div>
      </Box>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.effectiveIsDarkMode === nextProps.effectiveIsDarkMode
  );
});

// Enhanced Global Chat with modern styling
function GlobalChatComponent(props) {
  const {
    globalChatList: propGlobalChatList = [],
    selectedMessage,
    setSelectedMessage,
    isDarkMode: propIsDarkMode,
    emojis,
  } = props;

  // Redux selectors
  const reduxUser = useSelector((state) => state.auth.user);
  const reduxIsDarkMode = useSelector((state) => state.auth.isDarkMode);
  const reduxGlobalChatList = useSelector((state) => state.logic.globalChatList);

  // Enhanced state management
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : reduxIsDarkMode;
  const baseChatList = Array.isArray(propGlobalChatList) && propGlobalChatList.length > 0 
    ? propGlobalChatList 
    : Array.isArray(reduxGlobalChatList) ? reduxGlobalChatList : [];

  const [chatList, setChatList] = useState(() => baseChatList);
  const [newMessages, setNewMessages] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [userIsAtBottom, setUserIsAtBottom] = useState(true);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [isVirtualized, setIsVirtualized] = useState(false);

  const chatBoxRef = useRef(null);
  const virtualListRef = useRef(null);
  const prevGlobalChatListLength = useRef(baseChatList.length);
  const autoScrollTimeoutRef = useRef(null);

  // Determine if virtualization should be used
  useEffect(() => {
    setIsVirtualized(chatList.length > 100);
  }, [chatList.length]);

  // Enhanced chat list management
  const uniqueMessagesToRender = useMemo(() => {
    const seen = new Set();
    return chatList.filter(chat => {
      const key = chat.id || `${chat.senderId}-${chat.time}-${chat.message?.substring(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.time || 0).getTime();
      const timeB = new Date(b.time || 0).getTime();
      return timeA - timeB;
    });
  }, [chatList]);

  // Enhanced scroll management with debouncing
  const scrollToBottom = useCallback(() => {
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    autoScrollTimeoutRef.current = setTimeout(() => {
      if (isVirtualized && virtualListRef.current) {
        virtualListRef.current.scrollToItem(uniqueMessagesToRender.length - 1, 'end');
      } else if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 50);
  }, [isVirtualized, uniqueMessagesToRender.length]);

  // Enhanced scroll position detection
  const evaluateUserPosition = useCallback(() => {
    const element = isVirtualized ? virtualListRef.current?.props?.children?.ref?.current 
      : chatBoxRef.current;
    
    if (!element) return;
    
    const scrollDiff = element.scrollHeight - (element.scrollTop + element.clientHeight);
    const currentlyAtBottom = scrollDiff < 100;
    
    if (userIsAtBottom !== currentlyAtBottom) {
      setUserIsAtBottom(currentlyAtBottom);
    }
  }, [userIsAtBottom, isVirtualized]);

  // Chat list update effect
  useEffect(() => {
    if (baseChatList !== chatList) {
      setChatList(baseChatList);
    }
  }, [baseChatList]);

  // Auto-scroll and new message handling
  useEffect(() => {
    const oldLen = prevGlobalChatListLength.current;
    const newLen = baseChatList.length;

    if (!hasScrolledOnce && newLen > 0) {
      scrollToBottom();
      setHasScrolledOnce(true);
    } else if (newLen > oldLen) {
      const diff = newLen - oldLen;
      const newestMsg = baseChatList[newLen - 1];

      if (userIsAtBottom || (newestMsg?.senderId === reduxUser?._id)) {
        scrollToBottom();
        if (showTooltip) setShowTooltip(false);
        if (newMessages > 0) setNewMessages(0);
      } else {
        setNewMessages(prev => prev + diff);
        if (!showTooltip) setShowTooltip(true);
      }
    }
    
    prevGlobalChatListLength.current = newLen;
  }, [baseChatList, hasScrolledOnce, userIsAtBottom, reduxUser?._id, scrollToBottom, newMessages, showTooltip]);

  // Event handlers
  const handleOpenPlayerModal = useCallback((senderId) => {
    if (senderId) {
      setSelectedCreator(senderId);
      setShowPlayerModal(true);
    }
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleMessageClick = useCallback((message) => {
    const isCurrentlySelected = selectedMessage?.senderId === message.senderId && 
      selectedMessage?.time === message.time;

    if (isCurrentlySelected) {
      setSelectedMessage({});
    } else {
      setSelectedMessage({
        sender: message.sender,
        rank: message.rank,
        username: message.sender,
        accessory: message.accessory,
        elite: message.elite,
        senderId: message.senderId,
        avatar: message.avatar,
        message: message.message,
        messageType: message.messageType,
        replyTo: message.replyTo,
        time: message.time,
      });
    }
  }, [selectedMessage, setSelectedMessage]);

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
    setShowTooltip(false);
    setNewMessages(0);
  }, [scrollToBottom]);

  // Virtualized list item renderer
  const VirtualizedMessageItem = useCallback(({ index, style }) => {
    const chat = uniqueMessagesToRender[index];
    const isPending = pendingMessages.some(p => 
      p.time === chat.time && p.senderId === chat.senderId
    );
    const isSelected = selectedMessage?.senderId === chat.senderId && 
      selectedMessage?.time === chat.time;

    return (
      <ChatMessageItem
        style={style}
        chat={chat}
        isPending={isPending}
        isSelected={isSelected}
        effectiveIsDarkMode={effectiveIsDarkMode}
        emojis={emojis}
        onOpenPlayerModal={handleOpenPlayerModal}
        onMessageClick={handleMessageClick}
      />
    );
  }, [uniqueMessagesToRender, pendingMessages, selectedMessage, effectiveIsDarkMode, emojis, handleOpenPlayerModal, handleMessageClick]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box
      className="chat-panel global-chat"
      sx={{
        position: 'relative',
        height: '100%',
        background: '#1e1e1e',
        backdropFilter: 'blur(20px) saturate(180%)',
        overflow: 'hidden',
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          zIndex: 1,
        },
      }}
    >
      {/* Enhanced new message notification */}
      {showTooltip && newMessages > 0 && (
        <Fade in>
          <ButtonBase
            onClick={handleScrollToBottom}
            className="msgtooltip"
            sx={{
              position: 'absolute',
              bottom: '20px',
              transform: 'translateX(-50%)',
              zIndex: 10,
              background: 'linear-gradient(135deg, #ff4757, #ff6b7a)',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: '25px',
              boxShadow: '0 8px 32px rgba(255, 71, 87, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff3742, #ff5a6b)',
                transform: 'translateX(-50%) translateY(-2px) scale(1.05)',
                boxShadow: '0 12px 40px rgba(255, 71, 87, 0.5)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Typography variant="caption" sx={{ mr: 1, fontWeight: 600 }}>
              {newMessages} new message{newMessages > 1 ? 's' : ''}
            </Typography>
            <FontAwesomeIcon icon={faHandPointDown} style={{ fontSize: '14px' }} />
          </ButtonBase>
        </Fade>
      )}

      {/* Player Modal */}
      {showPlayerModal && (
        <Suspense 
          fallback={
            <Box sx={{
              position: 'fixed', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              p: 3,
            }}>
              <CircularProgress sx={{ color: '#ff4757' }} />
            </Box>
          }
        >
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        </Suspense>
      )}

      {/* Chat Messages */}
      {uniqueMessagesToRender.length > 0 ? (
        isVirtualized ? (
          <VirtualizedList
            ref={virtualListRef}
            height={400}
            itemCount={uniqueMessagesToRender.length}
            itemSize={120}
            onScroll={evaluateUserPosition}
            style={{
              background: 'transparent',
            }}
          >
            {VirtualizedMessageItem}
          </VirtualizedList>
        ) : (
          <Box
            ref={chatBoxRef}
            sx={{ 
              height: '100%',
              overflowY: 'auto',
              p: 2,
              pt: 3,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(180deg, rgba(255, 71, 87, 0.6), rgba(255, 71, 87, 0.3))',
                borderRadius: '3px',
                '&:hover': {
                  background: 'linear-gradient(180deg, rgba(255, 71, 87, 0.8), rgba(255, 71, 87, 0.5))',
                },
              },
            }}
            onScroll={evaluateUserPosition}
          >
            {uniqueMessagesToRender.map((chat, index) => {
              const key = chat.id || `chat-${chat.senderId}-${chat.time}-${index}`;
              const isPending = pendingMessages.some(p => 
                p.time === chat.time && p.senderId === chat.senderId
              );
              const isSelected = selectedMessage?.senderId === chat.senderId && 
                selectedMessage?.time === chat.time;

              return (
                <ChatMessageItem
                  key={key}
                  chat={chat}
                  isPending={isPending}
                  isSelected={isSelected}
                  effectiveIsDarkMode={effectiveIsDarkMode}
                  emojis={emojis}
                  onOpenPlayerModal={handleOpenPlayerModal}
                  onMessageClick={handleMessageClick}
                />
              );
            })}
          </Box>
        )
      ) : (
        <Box sx={{ p: 3 }}>
          {[...Array(10)].map((_, index) => (
            <Fade in timeout={200 * (index + 1)} key={`skeleton-${index}`}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                gap: 2,
                p: 2,
                borderRadius: '16px',
                background: effectiveIsDarkMode 
                  ? 'linear-gradient(135deg, rgba(30, 30, 35, 0.4), rgba(20, 20, 25, 0.3))'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(250, 250, 250, 0.4))',
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }}>
                <Skeleton 
                  variant="circular" 
                  width={50} 
                  height={50} 
                  sx={{
                    bgcolor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton 
                    variant="text" 
                    width="30%" 
                    height={20} 
                    sx={{ 
                      mb: 1,
                      bgcolor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="70%" 
                    height={16} 
                    sx={{
                      bgcolor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    }}
                  />
                </Box>
              </Box>
            </Fade>
          ))}
        </Box>
      )}
    </Box>
  );
}

const GlobalChat = React.memo(GlobalChatComponent);
export default GlobalChat;