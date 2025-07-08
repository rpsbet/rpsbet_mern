import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FixedSizeList as VirtualizedList } from 'react-window';
import Avatar from '../../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
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
                width: '16px',
                height: '16px',
                verticalAlign: 'middle',
                margin: '0 2px',
                objectFit: 'contain'
              }}
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

// Compact message item
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

  const isSystemMessage = chat.sender === 'SYSTEM';

  return (
    <div style={style}>
      <Box
        onClick={handleItemClick}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          mb: 1,
          p: 1.5,
          borderRadius: '8px',
          background: isSelected 
            ? 'rgba(255, 0, 0, 0.1)' 
            : isSystemMessage 
              ? 'rgba(0, 255, 58, 0.05)'
              : 'rgba(255, 255, 255, 0.02)',
          border: '1px solid',
          borderColor: isSelected 
            ? 'rgba(255, 0, 0, 0.3)' 
            : 'rgba(255, 255, 255, 0.05)',
          opacity: isPending ? 0.7 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            background: isSelected 
              ? 'rgba(255, 0, 0, 0.15)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderColor: isSelected 
              ? 'rgba(255, 0, 0, 0.4)' 
              : 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {/* Reply Section */}
        {(chat.replyTo && (chat.replyTo.message || chat.replyTo.messageType === 'gif')) && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            pl: 2,
            borderLeft: '2px solid rgba(255, 0, 0, 0.3)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '4px',
            p: 1,
          }}>
            <ButtonBase
              onClick={handleReplyAvatarClick}
              sx={{ mr: 1 }}
            >
              <Avatar
                src={chat.replyTo.avatar}
                username={chat.replyTo.username}
                rank={chat.replyTo.rank}
                accessory={chat.replyTo.accessory}
                elite={chat.replyTo.elite}
                user_id={chat.replyTo.senderId}
                style={{ width: 24, height: 24 }}
              />
            </ButtonBase>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: '#ff0000',
                  fontSize: '0.7rem',
                  display: 'block',
                  mb: 0.25,
                }}
              >
                {chat.replyTo.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.65rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  fontStyle: 'italic',
                }}
              >
                {replyGifContent?.content ? (
                  <img
                    src={replyGifContent.content}
                    alt="GIF reply"
                    style={{
                      maxHeight: '30px',
                      maxWidth: '60px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  wrappedReplyMessage
                )}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Main Message Content */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {!isSystemMessage && (
            <ButtonBase
              onClick={handleAvatarClick}
              sx={{ flexShrink: 0 }}
            >
              <Avatar
                src={chat.avatar}
                elite={chat.elite}
                accessory={chat.accessory}
                user_id={chat.senderId}
                username={chat.sender}
                rank={chat.rank}
                style={{ width: 32, height: 32 }}
              />
            </ButtonBase>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {!isSystemMessage && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#ff0000',
                  fontSize: '0.8rem',
                  mb: 0.25,
                }}
              >
                {chat.sender}
              </Typography>
            )}

            <Typography
              variant="body2"
              component="div"
              sx={{
                wordBreak: 'break-word',
                lineHeight: 1.4,
                color: isSystemMessage ? '#00ff3a' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8rem',
                fontWeight: isSystemMessage ? 600 : 400,
                textAlign: isSystemMessage ? 'center' : 'left',
                textTransform: isSystemMessage ? 'uppercase' : 'none',
              }}
            >
              {isPending ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={12} color='error' />
                  <Typography variant="caption" sx={{
                    opacity: 0.7,
                    fontStyle: 'italic',
                    fontSize: '0.7rem',
                  }}>
                    Sending...
                  </Typography>
                </Box>
              ) : gifContent?.content ? (
                <Box sx={{ position: 'relative' }}>
                  {!imageLoaded && !imageError && (
                    <Skeleton
                      variant="rectangular"
                      width={120}
                      height={90}
                      sx={{
                        borderRadius: '8px',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    />
                  )}
                  {!imageError && (
                    <img
                      src={gifContent.content}
                      alt="GIF message"
                      style={{
                        maxHeight: '90px',
                        maxWidth: '120px',
                        borderRadius: '8px',
                        display: imageLoaded ? 'block' : 'none',
                        objectFit: 'cover',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  )}
                  {imageError && (
                    <Box sx={{
                      p: 1.5,
                      background: 'rgba(255, 0, 0, 0.1)',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" sx={{ color: '#ff0000', fontWeight: 600, fontSize: '0.7rem' }}>
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

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              opacity: 0.6,
              color: 'rgba(255, 255, 255, 0.6)',
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          >
            {typeof chat.time === 'string' || typeof chat.time === 'number'
              ? chat.time
              : ''}
          </Typography>
        </Box>
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

// Enhanced Global Chat with clean styling
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
    const messageId = message.id || `${message.senderId}-${message.time}-${message.message?.substring(0, 20)}`;
    const selectedMessageId = selectedMessage?.id ||
      `${selectedMessage?.senderId}-${selectedMessage?.time}-${selectedMessage?.message?.substring(0, 20)}`;

    const isCurrentlySelected = selectedMessageId === messageId;

    if (isCurrentlySelected) {
      setSelectedMessage({});
    } else {
      setSelectedMessage({
        id: messageId,
        sender: message.sender,
        senderId: message.senderId,
        username: message.sender || message.username,
        rank: message.rank,
        accessory: message.accessory,
        elite: message.elite,
        avatar: message.avatar,
        message: message.message,
        messageType: message.messageType,
        time: message.time,
        created_at: message.created_at || new Date().toISOString(),
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
    const messageId = chat.id || `${chat.senderId}-${chat.time}-${chat.message?.substring(0, 20)}`;
    const selectedMessageId = selectedMessage?.id ||
      `${selectedMessage?.senderId}-${selectedMessage?.time}-${selectedMessage?.message?.substring(0, 20)}`;

    const isPending = pendingMessages.some(p =>
      p.time === chat.time && p.senderId === chat.senderId
    );
    const isSelected = selectedMessageId === messageId;

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
      sx={{
        position: 'relative',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.01)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
      }}
    >
      {/* New message notification */}
      {showTooltip && newMessages > 0 && (
        <Fade in>
          <ButtonBase
            onClick={handleScrollToBottom}
            sx={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              background: '#ff0000',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': {
                background: '#cc0000',
                transform: 'translateX(-50%) translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {newMessages} new message{newMessages > 1 ? 's' : ''}
            </Typography>
            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px' }} />
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
            }}>
              <CircularProgress color="error" />
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
            itemSize={80}
            onScroll={evaluateUserPosition}
            style={{ background: 'transparent' }}
          >
            {VirtualizedMessageItem}
          </VirtualizedList>
        ) : (
          <Box
            ref={chatBoxRef}
            sx={{
              height: '100%',
              overflowY: 'auto',
              p: 1,
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '2px' 
              },
            }}
            onScroll={evaluateUserPosition}
          >
            {uniqueMessagesToRender.map((chat, index) => {
              const key = chat.id || `chat-${chat.senderId}-${chat.time}-${index}`;
              const messageId = chat.id || `${chat.senderId}-${chat.time}-${chat.message?.substring(0, 20)}`;
              const selectedMessageId = selectedMessage?.id ||
                `${selectedMessage?.senderId}-${selectedMessage?.time}-${selectedMessage?.message?.substring(0, 20)}`;

              const isPending = pendingMessages.some(p =>
                p.time === chat.time && p.senderId === chat.senderId
              );
              const isSelected = selectedMessageId === messageId;

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
          {[...Array(11)].map((_, index) => (
            <Fade in timeout={150 * (index + 1)} key={`skeleton-${index}`}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                gap: 1,
                p: 1.5,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="25%"
                    height={16}
                    sx={{ mb: 0.5, bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={14}
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
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