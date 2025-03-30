import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointDown } from '@fortawesome/free-solid-svg-icons';
import { Skeleton, Box, ButtonBase } from '@mui/material';

import { fetchId } from '../../redux/Customer/customer.action';

function GlobalChat(props) {
  const {
    globalChatList = [],
    selectedMessage,
    setSelectedMessage,
    user,
    isDarkMode,
    isDrawerOpen,
    onlineUserList,
    emojis
  } = props;

  // ------------------- State -------------------
  const [chatList, setChatList] = useState(globalChatList || []);
  const [newMessages, setNewMessages] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [userIsAtBottom, setUserIsAtBottom] = useState(false);

  // ------------------- Refs -------------------
  const chatBoxRef = useRef(null);

  // We compare old vs new length to detect new messages
  const prevGlobalChatListLength = useRef(globalChatList.length);

  // ------------------- Effects -------------------

  // Keep local chatList in sync with globalChatList
  useEffect(() => {
    if (globalChatList.length !== chatList.length) {
      setChatList(globalChatList);
    }
  }, [globalChatList, chatList.length]);

  /**
   * Whenever globalChatList changes, check:
   * 1) If it's our first load, do an initial scroll if there's content
   * 2) If new messages arrived ( newLen > oldLen ), check if user is at bottom or if self-sent => auto-scroll, else show tooltip
   */
  useEffect(() => {
    const oldLen = prevGlobalChatListLength.current;
    const newLen = globalChatList.length;

    if (!hasScrolledOnce && newLen > 0) {
      // first load => scroll once
      scrollToBottom();
      setHasScrolledOnce(true);
    } else if (newLen > oldLen) {
      // new messages arrived
      const diff = newLen - oldLen;
      const newestMsg = globalChatList[newLen - 1];

      // If user is near bottom OR if the newest msg is from this user => auto-scroll
      if (userIsAtBottom || (newestMsg && newestMsg.senderId === user._id)) {
        scrollToBottom();
        setShowTooltip(false);
        setNewMessages(0);
      } else {
        // we are away from bottom => accumulate new messages
        setNewMessages((prev) => prev + diff);
        setShowTooltip(true);
      }
    }

    prevGlobalChatListLength.current = newLen;
  }, [globalChatList, hasScrolledOnce, userIsAtBottom, user._id]);

  // On mount, add scroll listener + evaluate if at bottom initially
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
    // eslint-disable-next-line
  }, []);

  // ------------------- Handlers -------------------
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

    // If within ~30px => near bottom
    setUserIsAtBottom(scrollDiff < 30);
  };

  const handleScroll = () => {
    evaluateUserPosition();
    // If user just scrolled to bottom => hide tooltip, reset newMessages
    if (userIsAtBottom) {
      setShowTooltip(false);
      setNewMessages(0);
    }
  };

  // Opening the player modal
  const handleOpenPlayerModal = (senderId) => {
    setSelectedCreator(senderId);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // If user clicks a message => toggling selected
  const handleMessageClick = (message) => {
    if (selectedMessage.sender === message.sender) {
      setSelectedMessage({
        sender: null,
        senderId: null,
        avatar: null,
        accessory: null,
        rank: null,
        message: null,
        messageType: null,
        replyTo: null,
        time: null
      });
    } else {
      setSelectedMessage({
        sender: message.sender,
        rank: message.rank,
        username: message.sender,
        accessory: message.accessory,
        senderId: message.senderId,
        avatar: message.avatar,
        message: message.message,
        messageType: message.messageType,
        replyTo: message.replyTo,
        time: message.time
      });
    }
  };

  // A helper to replace emoji commands like ":smile:" with images
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

  // ------------------- Rendering -------------------
  const uniqueMessages = new Set();

  return (
    <Box
      className="chat-panel global-chat"
      ref={chatBoxRef}
      sx={{
        height: '100%', overflowY: 'auto', '&::-webkit-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none', // For Firefox
        msOverflowStyle: 'none'
      }}
    >
      {/* If we have new messages and user is not at bottom => show tooltip */}
      {showTooltip && newMessages > 0 && (
        <ButtonBase
          onClick={() => {
            scrollToBottom();
            setShowTooltip(false);
            setNewMessages(0);
          }}
          className="msgtooltip"
        >
          {newMessages} new chat(s)&nbsp;
          <FontAwesomeIcon icon={faHandPointDown} />
        </ButtonBase>
      )}

      {/* Player Modal */}
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      {/* Main Chat List */}
      {chatList && chatList.length > 0 ? (
        <>
          {chatList.map((chat, index) => {
            // Avoid duplicates if (message + time) is the same
            const messageKey = chat.message + chat.time;
            if (uniqueMessages.has(messageKey)) {
              return null;
            }
            uniqueMessages.add(messageKey);

            // Wrap main message
            const wrappedMessage =
              chat.messageType === 'gif'
                ? null
                : wrapEmojis(chat.message);

            // If there's a reply to some older message, do the same
            let wrappedReplyMessage = null;
            if (chat.replyTo && chat.replyTo.message) {
              wrappedReplyMessage =
                chat.replyTo.messageType === 'gif'
                  ? null
                  : wrapEmojis(chat.replyTo.message);
            }

            return (
              <div
                key={index}
                className={`chat-line ${chat.sender === 'SYSTEM' ? 'special-message' : ''
                  } ${chat.sender === 'SYSTEM' && chat.message.includes('debt')
                    ? 'special-message-rent'
                    : ''
                  }`}
                onClick={() => handleMessageClick(chat)}
              >
                {/* If replying to another message */}
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
                        user_id={chat.replyTo.senderId}
                        darkMode={isDarkMode}
                      />
                   
                    </a>
                    <span className="reply-sender sender-name">
                      {chat.replyTo.username}
                    </span>
                    <span className="reply-message chat-text title">
                      {chat.replyTo.messageType === 'gif' ? (
                        <img
                          src={JSON.parse(chat.replyTo.message).content}
                          alt="gif"
                        />
                      ) : (
                        wrappedReplyMessage
                      )}
                    </span>
                  </Box>
                )}

                {/* Main chat content */}
                <div className="chat-content">
                  <a
                    className="chat-player"
                    onClick={() => handleOpenPlayerModal(chat.senderId)}
                  >
                    <Avatar
                      className="avatar"
                      src={chat.avatar}
                      accessory={chat.accessory}
                      alt=""
                      user_id={chat.senderId}
                      username={chat.sender}
                      rank={chat.rank}
                      darkMode={isDarkMode}
                    />
                  
                  </a>
                  <div className="chat-msg">
                    <span className="sender-name">{chat.sender}</span>
                    <span className="chat-text title">
                      {chat.messageType === 'gif' ? (
                        <img
                          src={JSON.parse(chat.message).content}
                          alt="gif"
                        />
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
        // If no messages, show skeleton placeholders
        <div>
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                gap: '10px'
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

const mapStateToProps = (state) => ({
  user: state.auth.user,
  isDarkMode: state.auth.isDarkMode,
  globalChatList: state.logic.globalChatList,
});

const mapDispatchToProps = {
  fetchId,
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);