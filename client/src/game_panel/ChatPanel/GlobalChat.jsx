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
              loading="lazy"
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

// Enhanced message item with better performance
const ChatMessageItem = React.memo(({
  chat,
  isPending,
  effectiveIsDarkMode,
  emojis,
  onOpenPlayerModal,
  onMessageClick,
  isSelected,
  style // For virtualization
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

  // Enhanced styling with better visual feedback
  const messageStyle = {
    background: effectiveIsDarkMode
      ? 'rgba(20, 20, 20, 0.65)'
      : 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: isSelected 
      ? '2px solid #ff0000' 
      : '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    transform: isPending ? 'scale(0.98)' : 'scale(1)',
    opacity: isPending ? 0.7 : 1,
  };

  return (
    <div style={style}> {/* Wrapper for virtualization */}
      <div
        className={`chat-line ${chat.sender === 'SYSTEM' ? 'special-message' : ''} ${
          chat.sender === 'SYSTEM' && chat.message?.includes('debt') ? 'special-message-rent' : ''
        } ${isPending ? 'pending-message' : ''} ${isSelected ? 'selected-message' : ''}`}
        onClick={handleItemClick}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleItemClick(e)}
      >
        {/* Reply Section with enhanced styling */}
        {chat.replyTo?.message && (
          <Fade in timeout={200}>
            <Box className="reply-to" sx={{ mb: 1 }}>
              <Tooltip title={`Reply to ${chat.replyTo.username}`} arrow>
                <ButtonBase
                  className="chat-player"
                  onClick={handleReplyAvatarClick}
                  sx={{ borderRadius: '50%' }}
                >
                  <div className="reply-border" />
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
                sx={{ fontWeight: 600 }}
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
                  maxWidth: '200px'
                }}
              >
                {replyGifContent?.content ? (
                  <img 
                    src={replyGifContent.content} 
                    alt="GIF reply" 
                    style={{ 
                      maxHeight: '60px', 
                      maxWidth: '100px', 
                      borderRadius: '4px',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
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
          <Tooltip title={`View ${chat.sender}'s profile`} arrow>
            <ButtonBase
              className="chat-player"
              onClick={handleAvatarClick}
              sx={{ borderRadius: '50%', zIndex: 1 }}
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

          <div className="chat-msg" style={messageStyle}>
            <Typography 
              variant="subtitle2" 
              className="sender-name"
              sx={{ 
                fontWeight: 600,
                color: '#b9bbbe',
                mb: 0.5
              }}
            >
              {chat.sender}
            </Typography>
            
            <Typography 
              variant="body2" 
              className="chat-text"
              component="div"
              sx={{ wordBreak: 'break-word' }}
            >
              {isPending ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
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
                      sx={{ borderRadius: '4px' }}
                    />
                  )}
                  {!imageError && (
                    <img 
                      src={gifContent.content} 
                      alt="GIF message" 
                      style={{ 
                        maxHeight: '150px', 
                        maxWidth: '200px', 
                        borderRadius: '4px',
                        display: imageLoaded ? 'block' : 'none',
                        objectFit: 'cover'
                      }}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      loading="lazy"
                    />
                  )}
                  {imageError && (
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(255,0,0,0.1)', 
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="caption" color="error">
                        Failed to load GIF
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                wrappedMessage
              )}
            </Typography>
          </div>

          {/* Enhanced timestamp */}
          <div className="chat-time">
            <Tooltip title={new Date(chat.time).toLocaleString()} arrow>
              <div>
                {typeof chat.time === 'string' || typeof chat.time === 'number' 
                  ? chat.time 
                  : ''}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.effectiveIsDarkMode === nextProps.effectiveIsDarkMode
  );
});

// Enhanced Global Chat with virtualization and better performance
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
      // Ensure proper chronological order
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
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
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
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              bgcolor: 'error.main',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: '20px',
              boxShadow: 3,
              '&:hover': {
                bgcolor: 'error.dark',
                transform: 'translateX(-50%) scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Typography variant="caption" sx={{ mr: 1 }}>
              {newMessages} new message{newMessages > 1 ? 's' : ''}
            </Typography>
            <FontAwesomeIcon icon={faHandPointDown} />
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
              zIndex: 9999
            }}>
              <CircularProgress />
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
            height={400} // Adjust based on your container
            itemCount={uniqueMessagesToRender.length}
            itemSize={120} // Estimated item height
            onScroll={evaluateUserPosition}
          >
            {VirtualizedMessageItem}
          </VirtualizedList>
        ) : (
          <Box
            ref={chatBoxRef}
            sx={{ 
              height: '100%',
              overflowY: 'auto',
              p: 1
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
        <Box sx={{ p: 2 }}>
          {[...Array(10)].map((_, index) => (
            <Fade in timeout={200 * (index + 1)} key={`skeleton-${index}`}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                gap: 1,
              }}>
                <Skeleton variant="circular" width={50} height={50} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="30%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="70%" height={16} />
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