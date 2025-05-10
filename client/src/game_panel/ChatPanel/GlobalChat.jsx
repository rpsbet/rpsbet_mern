import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
const PlayerModal = React.lazy(() => import('../modal/PlayerModal'));
import Avatar from '../../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointDown } from '@fortawesome/free-solid-svg-icons';
import { Skeleton, Box, ButtonBase, CircularProgress } from '@mui/material';
import Moment from 'moment'; // Consider if Moment is a large dep and if native Date methods suffice

// Helper to parse message content safely for GIFs
const safeParseJSON = (jsonString, defaultValue = null) => {
  if (typeof jsonString !== 'string') return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    // Ensure it has a content property for GIFs
    return parsed && typeof parsed.content === 'string' ? parsed : defaultValue;
  } catch (e) {
    console.warn("Failed to parse JSON string:", jsonString, e);
    return defaultValue;
  }
};


const ChatMessageItem = React.memo(({
  chat,
  isPending,
  effectiveIsDarkMode,
  emojis,
  onOpenPlayerModal,
  onMessageClick,
}) => {
  // Memoize emoji wrapping for main message
  const wrappedMessage = useMemo(() => {
    if (!chat.message || chat.messageType === 'gif') return null;
    // Ensure emojis is an array before calling find
    const validEmojis = Array.isArray(emojis) ? emojis : [];
    return chat.message.split(/(:\w+:)/g).map((part, i) => {
      if (part.startsWith(':') && part.endsWith(':')) {
        const emojiObj = validEmojis.find((e) => e.command === part);
        if (emojiObj) {
          const { url, alt } = emojiObj;
          // Use a more stable key if chat.id is available, or combine with index
          return <img key={`msg-${chat.id || i}-emoji-${part}`} src={url} alt={alt} className="emoji" style={{ width: '20px', height: '20px', verticalAlign: 'middle', margin: '0 2px' }} />;
        }
      }
      return part;
    });
  }, [chat.id, chat.message, chat.messageType, emojis]);

  // Memoize emoji wrapping for reply message
  const wrappedReplyMessage = useMemo(() => {
    if (!chat.replyTo || !chat.replyTo.message || chat.replyTo.messageType === 'gif') return null;
    const validEmojis = Array.isArray(emojis) ? emojis : [];
    return chat.replyTo.message.split(/(:\w+:)/g).map((part, i) => {
      if (part.startsWith(':') && part.endsWith(':')) {
        const emojiObj = validEmojis.find((e) => e.command === part);
        if (emojiObj) {
          const { url, alt } = emojiObj;
          return <img key={`reply-${chat.id || i}-emoji-${part}`} src={url} alt={alt} className="emoji" style={{ width: '16px', height: '16px', verticalAlign: 'middle', margin: '0 2px' }}/>;
        }
      }
      return part;
    });
  }, [chat.id, chat.replyTo, emojis]);

  const gifContent = chat.messageType === 'gif' ? safeParseJSON(chat.message) : null;
  const replyGifContent = chat.replyTo && chat.replyTo.messageType === 'gif' ? safeParseJSON(chat.replyTo.message) : null;

  const handleItemClick = useCallback(() => {
    onMessageClick(chat);
  }, [onMessageClick, chat]);

  const handleAvatarClick = useCallback((e) => {
    e.stopPropagation(); // Prevent triggering message click
    onOpenPlayerModal(chat.senderId);
  }, [onOpenPlayerModal, chat.senderId]);

  const handleReplyAvatarClick = useCallback((e) => {
    e.stopPropagation(); // Prevent triggering message click
    if (chat.replyTo && chat.replyTo.senderId) {
        onOpenPlayerModal(chat.replyTo.senderId);
    }
  }, [onOpenPlayerModal, chat.replyTo]);

  return (
    <div
      className={`chat-line ${chat.sender === 'SYSTEM' ? 'special-message' : ''} ${chat.sender === 'SYSTEM' && chat.message && chat.message.includes('debt') ? 'special-message-rent' : ''} ${isPending ? 'pending-message' : ''}`}
      onClick={handleItemClick}
    >
      {chat.replyTo && chat.replyTo.message && (
        <Box className="reply-to">
          <a
            className="chat-player"
            onClick={handleReplyAvatarClick} // Use specific handler
            role="button" // Accessibility
            tabIndex={0} // Accessibility
            onKeyDown={(e) => e.key === 'Enter' && handleReplyAvatarClick(e)} // Accessibility
          >
            <div className="reply-border" />
            <Avatar
              className="avatar"
              src={chat.replyTo.avatar}
              alt={(chat.replyTo.username || 'Replied user') + "'s avatar"}
              username={chat.replyTo.username}
              rank={chat.replyTo.rank}
              accessory={chat.replyTo.accessory}
              elite={chat.replyTo.elite}
              user_id={chat.replyTo.senderId}
              darkMode={true}
            />
          </a>
          <span className="reply-sender sender-name">{chat.replyTo.username}</span>
          <span className="reply-message chat-text title">
            {replyGifContent && replyGifContent.content ? (
              <img src={replyGifContent.content} alt="GIF reply" style={{ maxHeight: '100px', maxWidth: '150px', borderRadius: '4px', display: 'block' }} />
            ) : (
              wrappedReplyMessage
            )}
          </span>
        </Box>
      )}

      <div className="chat-content">
        <a 
            className="chat-player" 
            style={{ zIndex: 1 }} 
            onClick={handleAvatarClick} // Use specific handler
            role="button" // Accessibility
            tabIndex={0} // Accessibility
            onKeyDown={(e) => e.key === 'Enter' && handleAvatarClick(e)} // Accessibility
        >
          <Avatar
            className="avatar"
            src={chat.avatar}
            elite={chat.elite}
            accessory={chat.accessory}
            alt={(chat.sender || 'User') + "'s avatar"}
            user_id={chat.senderId}
            username={chat.sender}
            rank={chat.rank}
            darkMode={true}
          />
        </a>
        <div className="chat-msg"
          style={{
            // Original styling is preserved
            background: effectiveIsDarkMode
            ? 'rgba(20, 20, 20, 0.65)'
            : 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          // The original code had two 'border' properties. The last one wins.
          // border: effectiveIsDarkMode
          //   ? '1px solid rgba(255, 255, 255, 0.1)'
          //   : '1px solid rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)', // This is the one that applies
            borderRadius: '4px',
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
          }}>
          <span className="sender-name">{chat.sender}</span>
          <span className="chat-text title">
            {isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : gifContent && gifContent.content ? (
              <img src={gifContent.content} alt="GIF message" style={{ maxHeight: '150px', maxWidth: '200px', borderRadius: '4px', display: 'block' }}/>
            ) : (
              wrappedMessage
            )}
          </span>
        </div>
        <div className="chat-time">
          {/* Ensure chat.time is a string or a valid child */}
          <div>{typeof chat.time === 'string' || typeof chat.time === 'number' ? chat.time : ''}</div>
        </div>
      </div>
    </div>
  );
});


function GlobalChatComponent(props) {
  const {
    globalChatList: propGlobalChatList = [], // Default to empty array if undefined
    selectedMessage,
    setSelectedMessage,
    isDarkMode: propIsDarkMode,
    emojis, // Assuming emojis is an array of { command: string, url: string, alt: string }
    // socket, // If handleSendMessage is to be used, socket should be a prop or from Redux
  } = props;

  const dispatch = useDispatch(); // Keep if used for other actions not shown
  const reduxUser = useSelector((state) => state.auth.user);
  const reduxIsDarkMode = useSelector((state) => state.auth.isDarkMode);
  const reduxGlobalChatList = useSelector((state) => state.logic.globalChatList);
  const socket = useSelector((state) => state.auth.socket); // Assuming socket is needed for handleSendMessage

  // Effective values: Prioritize props, then Redux, then sensible defaults
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
  const [userIsAtBottom, setUserIsAtBottom] = useState(true); // Default to true for initial scroll
  const [pendingMessages, setPendingMessages] = useState([]);

  const chatBoxRef = useRef(null);
  const prevGlobalChatListLength = useRef(baseChatList.length);


  useEffect(() => {
    // Only update chatList if the source reference changes and is different
    if (baseChatList !== chatList) {
        setChatList(baseChatList);
    }
  }, [baseChatList]); // chatList removed from deps as it causes loop

  const scrollToBottom = useCallback(() => {
    if (!chatBoxRef.current) return;
    // Using requestAnimationFrame for smoother scroll after DOM updates
    requestAnimationFrame(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    });
  }, []);

  useEffect(() => {
    const oldLen = prevGlobalChatListLength.current;
    const newLen = baseChatList.length;

    if (!hasScrolledOnce && newLen > 0 && chatBoxRef.current) {
      scrollToBottom();
      setHasScrolledOnce(true);
    } else if (newLen > oldLen) {
      const diff = newLen - oldLen;
      const newestMsg = baseChatList[newLen - 1];

      if (userIsAtBottom || (newestMsg && newestMsg.senderId === reduxUser?._id)) {
        scrollToBottom();
        if (showTooltip) setShowTooltip(false); // Hide tooltip if was shown
        if (newMessages > 0) setNewMessages(0);  // Reset new messages
      } else {
        setNewMessages((prev) => prev + diff);
        if (!showTooltip) setShowTooltip(true); // Show tooltip if not already shown
      }
    }
    prevGlobalChatListLength.current = newLen;
  }, [baseChatList, hasScrolledOnce, userIsAtBottom, reduxUser?._id, scrollToBottom, newMessages, showTooltip]);


  const evaluateUserPosition = useCallback(() => {
    if (!chatBoxRef.current) return;
    const box = chatBoxRef.current;
    // Consider a slightly larger threshold for "at bottom" to account for subpixel rendering
    const scrollDiff = box.scrollHeight - (box.scrollTop + box.clientHeight);
    const currentlyAtBottom = scrollDiff < 50; // Increased threshold
    if (userIsAtBottom !== currentlyAtBottom) {
        setUserIsAtBottom(currentlyAtBottom);
    }
  }, [userIsAtBottom]); // Added userIsAtBottom to only set state if it changes

  const handleScroll = useCallback(() => {
    evaluateUserPosition();
    // Check current state directly instead of relying on potentially stale userIsAtBottom from closure
    if (chatBoxRef.current) {
        const box = chatBoxRef.current;
        const scrollDiff = box.scrollHeight - (box.scrollTop + box.clientHeight);
        if (scrollDiff < 50) { // if user scrolls to bottom
            if (showTooltip) setShowTooltip(false);
            if (newMessages > 0) setNewMessages(0);
        }
    }
  }, [evaluateUserPosition, showTooltip, newMessages]); // evaluateUserPosition will update userIsAtBottom state

  useEffect(() => {
    const currentChatBox = chatBoxRef.current;
    if (currentChatBox) {
      currentChatBox.addEventListener('scroll', handleScroll, { passive: true }); // Use passive listener
      evaluateUserPosition(); // Initial check
    }
    return () => {
      if (currentChatBox) {
        currentChatBox.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, evaluateUserPosition]); // evaluateUserPosition added

  const handleOpenPlayerModal = useCallback((senderId) => {
    if (senderId) { // Ensure senderId is present
        setSelectedCreator(senderId);
        setShowPlayerModal(true);
    }
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
    //setSelectedCreator(''); // Optionally reset creator ID
  }, []);

  const handleMessageClick = useCallback((message) => {
    // Ensure selectedMessage is properly initialized
    const currentSelectedSender = selectedMessage?.sender;

    if (currentSelectedSender === message.sender) {
      setSelectedMessage({ /* initial empty state */ }); // Use your defined initial state
    } else {
      setSelectedMessage({
        sender: message.sender,
        rank: message.rank,
        username: message.sender, // username and sender are often the same
        accessory: message.accessory,
        elite: message.elite,
        senderId: message.senderId,
        avatar: message.avatar,
        message: message.message,
        messageType: message.messageType,
        replyTo: message.replyTo, // Pass the whole replyTo object
        time: message.time,
      });
    }
  }, [selectedMessage, setSelectedMessage]);

  // This function relies on `socket` which needs to be available in this scope (e.g., via props or Redux)
  // If this component is purely for display, this function might belong in the parent (ChatPanel)
  const handleSendMessage = useCallback(async (messageContent) => {
    if (!socket || !reduxUser?._id) {
        console.warn("Socket or user not available for sending message.");
        return; // Or dispatch an error
    }

    // Construct the full message object as expected by the backend/socket event
    const messageToSend = {
      sender: reduxUser.username, // Assuming username is the display name
      senderId: reduxUser._id,
      avatar: reduxUser.avatar,
      accessory: reduxUser.accessory,
      elite: reduxUser.elite,
      rank: reduxUser.totalWagered, // Or relevant rank property
      message: messageContent, // This is just the text/content
      // messageType: 'text', // Explicitly set type if not just text
      // replyTo: selectedMessage?.sender ? selectedMessage : null, // Include reply context if any
      time: Moment().format('HH:mm'), // Client-side time, server might override
    };

    const tempMessage = {
      ...messageToSend,
      isPending: true,
    };

    setChatList((prev) => [...prev, tempMessage]);
    setPendingMessages((prev) => [...prev, tempMessage]); // Add to pending

    try {
      socket.emit('GLOBAL_CHAT_SEND', messageToSend); // Send the fully structured message
      // Optimistically assume success for removing pending flag,
      // actual message from socket event should replace it or confirm it.
      // Backend should echo the message back with its final ID and timestamp.
      // The logic to remove from pendingMessages might be better handled when the message is confirmed from the server.
      // For now, we'll keep it simple:
      // setTimeout(() => { // Simulate ack from server
      //   setPendingMessages((prev) => prev.filter((pending) => pending.time !== tempMessage.time || pending.senderId !== tempMessage.senderId ));
      // }, 1000); // Remove after a delay, or better, on actual ack.
    } catch (error) {
      console.error('Error sending message:', error);
      setChatList((prev) => prev.filter((chat) => chat !== tempMessage)); // Remove if send fails immediately
      setPendingMessages((prev) => prev.filter((pending) => pending.time !== tempMessage.time || pending.senderId !== tempMessage.senderId ));
    }
  }, [socket, reduxUser, /* selectedMessage (if replyTo is included) */]);


  // Deduplication: This runs on every render.
  // If chatList source can guarantee uniqueness, this can be removed.
  // The Set should be defined outside map, and items pushed to a new array.
  const uniqueMessagesToRender = useMemo(() => {
    const uniqueSet = new Set();
    const result = [];
    chatList.forEach(chat => {
        // Create a key that's reasonably unique for a message instance.
        // Using a server-side ID (chat.id or chat._id) would be best if available.
        // For pending messages, a client-generated temp ID or timestamp+content could be used.
        const messageInstanceKey = chat.id || `${chat.senderId}-${chat.time}-${chat.message}`;
        if (!uniqueSet.has(messageInstanceKey)) {
            uniqueSet.add(messageInstanceKey);
            result.push(chat);
        }
    });
    return result;
  }, [chatList]);


  return (
    <Box
      className="chat-panel global-chat" // Existing class names are preserved
      ref={chatBoxRef}
      sx={{ // Existing sx props are preserved
        height: 'calc(100% - 120px)', // Adjust if input panel height changes
        overflowY: 'auto',
        position: 'relative', // For tooltip positioning
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {showTooltip && newMessages > 0 && (
        <ButtonBase
          onClick={() => {
            scrollToBottom();
            setShowTooltip(false); // Explicitly hide
            setNewMessages(0);    // Explicitly reset
          }}
          className="msgtooltip" // Assumed to be styled by CSS
          // Add some inline styles for position if not fully handled by CSS class
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            // ... other styles from your CSS for msgtooltip
          }}
        >
          {newMessages} new chat(s)
          <FontAwesomeIcon icon={faHandPointDown} style={{ marginLeft: '5px' }} />
        </ButtonBase>
      )}

      {/* Player Modal Suspense */}
      {showPlayerModal && (
        <Suspense fallback={<Box sx={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}><CircularProgress /></Box>}>
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        </Suspense>
      )}

      {/* Chat List Rendering */}
      {uniqueMessagesToRender.length > 0 ? (
        uniqueMessagesToRender.map((chat, index) => {
          // Generate a key: use chat.id if available (from server),
          // or a temporary client ID for pending messages,
          // or fall back to a composite key or index.
          // For pending messages, a key like `pending-${chat.time}-${chat.message.substring(0,10)}`
          // When the real message arrives from the server, it should have a real ID and replace the pending one.
          const key = chat.id || chat._id || `chat-${chat.isPending ? 'pending-' : ''}${chat.senderId}-${chat.time}-${index}`;
          const isPending = pendingMessages.some(p => p.time === chat.time && p.senderId === chat.senderId && p.message === chat.message);


          return (
            <ChatMessageItem
              key={key}
              chat={chat}
              isPending={isPending}
              effectiveIsDarkMode={effectiveIsDarkMode}
              emojis={emojis}
              onOpenPlayerModal={handleOpenPlayerModal}
              onMessageClick={handleMessageClick}
            />
          );
        })
      ) : (
        // Skeleton Loading state
        <Box sx={{ p: 1 }}> {/* Add padding to skeleton container */}
          {[...Array(10)].map((_, index) => (
            <div
              key={`skeleton-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                gap: '10px',
              }}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <div style={{ flex: 1 }}>
                <Skeleton variant="text" width="30%" sx={{mb: 0.5}}/> {/* Sender name skeleton */}
                <Skeleton variant="text" width="60%" /> {/* Message skeleton */}
              </div>
            </div>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Memoize GlobalChatComponent for performance
const GlobalChat = React.memo(GlobalChatComponent);
export default GlobalChat;