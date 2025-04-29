import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
const PlayerModal = React.lazy(() => import('../modal/PlayerModal'));
import Avatar from '../../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointDown } from '@fortawesome/free-solid-svg-icons';
import { Skeleton, Box, ButtonBase, CircularProgress } from '@mui/material';
import { fetchId } from '../../redux/Customer/customer.action';
import Moment from 'moment';

function GlobalChat(props) {
  const {
    globalChatList: propGlobalChatList = [],
    selectedMessage,
    setSelectedMessage,
    isDarkMode: propIsDarkMode,
    emojis,
  } = props;

  const user = useSelector((state) => state.auth.user);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const globalChatList = useSelector((state) => state.logic.globalChatList);

  // Use prop values if provided, otherwise fall back to Redux state
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveGlobalChatList = propGlobalChatList.length > 0 ? propGlobalChatList : globalChatList;

  // State
  const [chatList, setChatList] = useState(effectiveGlobalChatList || []);
  const [newMessages, setNewMessages] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [userIsAtBottom, setUserIsAtBottom] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]); // Track messages being sent

  // Refs
  const chatBoxRef = useRef(null);
  const prevGlobalChatListLength = useRef(effectiveGlobalChatList.length);
  const dispatch = useDispatch();

  // Effects
  useEffect(() => {
    if (!effectiveGlobalChatList.length) {
      dispatch(fetchId());
    }
    setChatList(effectiveGlobalChatList);
  }, [dispatch, effectiveGlobalChatList]);

  useEffect(() => {
    const oldLen = prevGlobalChatListLength.current;
    const newLen = effectiveGlobalChatList.length;

    if (!hasScrolledOnce && newLen > 0) {
      scrollToBottom();
      setHasScrolledOnce(true);
    } else if (newLen > oldLen) {
      const diff = newLen - oldLen;
      const newestMsg = effectiveGlobalChatList[newLen - 1];

      if (userIsAtBottom || (newestMsg && newestMsg.senderId === user?._id)) {
        scrollToBottom();
        setShowTooltip(false);
        setNewMessages(0);
      } else {
        setNewMessages((prev) => prev + diff);
        setShowTooltip(true);
      }
    }

    prevGlobalChatListLength.current = newLen;
  }, [effectiveGlobalChatList, hasScrolledOnce, userIsAtBottom, user?._id]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.addEventListener('scroll', handleScroll);
      evaluateUserPosition();
    }
    return () => {
      if (chatBoxRef.current) {
        chatBoxRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Handlers
  const scrollToBottom = () => {
    if (!chatBoxRef.current) return;
    setTimeout(() => {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }, 0);
  };

  const evaluateUserPosition = () => {
    if (!chatBoxRef.current) return;
    const box = chatBoxRef.current;
    const scrollDiff = box.scrollHeight - (box.scrollTop + box.clientHeight);
    setUserIsAtBottom(scrollDiff < 30);
  };

  const handleScroll = () => {
    evaluateUserPosition();
    if (userIsAtBottom) {
      setShowTooltip(false);
      setNewMessages(0);
    }
  };

  const handleOpenPlayerModal = (senderId) => {
    setSelectedCreator(senderId);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const handleMessageClick = (message) => {
    if (selectedMessage.sender === message.sender) {
      setSelectedMessage({
        sender: null,
        senderId: null,
        avatar: null,
        elite: null,
        accessory: null,
        rank: null,
        message: null,
        messageType: null,
        replyTo: null,
        time: null,
      });
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
  };

  const wrapEmojis = (text) => {
    return text.split(/(:\w+:)/g).map((part, i) => {
      if (part.startsWith(':') && part.endsWith(':')) {
        const emojiObj = emojis.find((e) => e.command === part);
        if (emojiObj) {
          const { url, alt } = emojiObj;
          return <img key={i} src={url} alt={alt} className="emoji" />;
        }
      }
      return part;
    });
  };

  const handleSendMessage = async (message) => {
    const tempMessage = {
      ...message,
      senderId: user?._id,
      time: Moment().format('HH:mm'),
      isPending: true, // Mark as pending
    };

    // Add the message to the chat list optimistically
    setChatList((prev) => [...prev, tempMessage]);
    setPendingMessages((prev) => [...prev, tempMessage]);

    try {
      // Send the message to the backend
      await socket.emit('GLOBAL_CHAT_SEND', message);

      // Remove the pending flag once the message is sent
      setPendingMessages((prev) =>
        prev.filter((pending) => pending !== tempMessage)
      );
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove the message from the chat list if sending fails
      setChatList((prev) => prev.filter((chat) => chat !== tempMessage));
      setPendingMessages((prev) =>
        prev.filter((pending) => pending !== tempMessage)
      );
    }
  };

  // Rendering
  const uniqueMessages = new Set();

  return (
    <Box
      className="chat-panel global-chat"
      ref={chatBoxRef}
      sx={{
        height: 'calc(100% - 120px)',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none', // For Firefox
        msOverflowStyle: 'none',
      }}
    >
      {showTooltip && newMessages > 0 && (
        <ButtonBase
          onClick={() => {
            scrollToBottom();
            setShowTooltip(false);
            setNewMessages(0);
          }}
          className="msgtooltip"
        >
          {newMessages} new chat(s)
          <FontAwesomeIcon icon={faHandPointDown} />
        </ButtonBase>
      )}

      {showPlayerModal && (
        <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={200} />}>
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        </Suspense>
      )}

      {chatList && chatList.length > 0 ? (
        <>
          {chatList.map((chat, index) => {
            const messageKey = chat.message + chat.time;
            if (uniqueMessages.has(messageKey)) {
              return null;
            }
            uniqueMessages.add(messageKey);

            const wrappedMessage =
              chat.messageType === 'gif' ? null : wrapEmojis(chat.message);

            let wrappedReplyMessage = null;
            if (chat.replyTo && chat.replyTo.message) {
              wrappedReplyMessage =
                chat.replyTo.messageType === 'gif'
                  ? null
                  : wrapEmojis(chat.replyTo.message);
            }

            const isPending = pendingMessages.includes(chat);

            return (
              <div
                key={index}
                className={`chat-line ${chat.sender === 'SYSTEM' ? 'special-message' : ''} ${chat.sender === 'SYSTEM' && chat.message.includes('debt') ? 'special-message-rent' : ''} ${isPending ? 'pending-message' : ''}`}
                onClick={() => handleMessageClick(chat)}
              >
                {chat.replyTo && chat.replyTo.message && (
                  <Box className="reply-to">
                    <a
                      className="chat-player"
                      onClick={() => handleOpenPlayerModal(chat.replyTo.senderId)}
                    >
                      <div className="reply-border" />
                      <Avatar
                        className="avatar"
                        src={chat.replyTo.avatar}
                        alt=""
                        username={chat.replyTo.username}
                        rank={chat.replyTo.rank}
                        accessory={chat.replyTo.accessory}
                        elite={chat.replyTo.elite}
                        user_id={chat.replyTo.senderId}
                        darkMode={true} // Set to true for dark mode Avatar styling
                      />
                    </a>
                    <span className="reply-sender sender-name">{chat.replyTo.username}</span>
                    <span className="reply-message chat-text title">
                      {chat.replyTo.messageType === 'gif' ? (
                        <img src={JSON.parse(chat.replyTo.message).content} alt="gif" />
                      ) : (
                        wrappedReplyMessage
                      )}
                    </span>
                  </Box>
                )}

                <div className="chat-content">
                  <a className="chat-player" style={{ zIndex: 1 }} onClick={() => handleOpenPlayerModal(chat.senderId)}>
                    <Avatar
                      className="avatar"
                      src={chat.avatar}
                      elite={chat.elite}
                      accessory={chat.accessory}
                      alt=""
                      user_id={chat.senderId}
                      username={chat.sender}
                      rank={chat.rank}
                      darkMode={true} // Set to true for dark mode Avatar styling
                    />
                  </a>
                  <div className="chat-msg"
                    style={{
                      // Glassmorphism styles (default dark mode colors)
                      background: effectiveIsDarkMode 
                      ? 'rgba(20, 20, 20, 0.65)' 
                      : 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: effectiveIsDarkMode 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(255, 255, 255, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      '@supports not (backdrop-filter: blur(10px))': {
                        background: 'rgba(0, 0, 0, 0.4)',
                      },
                    }}>
                    <span className="sender-name">{chat.sender}</span>
                    <span className="chat-text title">
                      {isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : chat.messageType === 'gif' ? (
                        <img src={JSON.parse(chat.message).content} alt="gif" />
                      ) : (
                        wrappedMessage
                      )}
                    </span>
                  </div>
                  <div className="chat-time">
                    <div>{chat.time}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div>
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                gap: '10px',
              }}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <div style={{ flex: 1 }}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
}

export default GlobalChat;