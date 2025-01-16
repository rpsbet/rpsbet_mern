import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Skeleton } from '@material-ui/lab';
import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointDown } from '@fortawesome/free-solid-svg-icons';
import ButtonBase from '@material-ui/core/ButtonBase';

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
  const [fetchedGlobal, setFetchedGlobal] = useState(false); // not used in original code, but preserved
  const [newMessages, setNewMessages] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState({});

  // ------------------- Refs -------------------
  const chatBoxRef = useRef(null);

  // We’ll use these to compare current vs. previous values in "componentDidUpdate"-like logic
  const prevGlobalChatListLength = useRef(globalChatList.length);
  const prevIsDrawerOpen = useRef(isDrawerOpen);

  // ------------------- Lifecycle: componentDidMount / componentWillUnmount -------------------
  useEffect(() => {
    // Add scroll listener on mount
    const chatBox = chatBoxRef.current;
    if (chatBox) {
      chatBox.addEventListener('scroll', handleScroll);
    }

    // Remove scroll listener on unmount
    return () => {
      if (chatBox) {
        chatBox.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    // If we initially have some chat messages, scroll to bottom once
    if (chatList.length > 0) {
      handleInitialScroll();
    }
    // eslint-disable-next-line
  }, []);

  // ------------------- Lifecycle: componentDidUpdate logic -------------------
  useEffect(() => {
    // 1) Check if globalChatList changed in length to see if new messages arrived
    if (
      prevGlobalChatListLength.current > 0 &&
      prevGlobalChatListLength.current < globalChatList.length
    ) {
      // Update new messages count & show the tooltip
      const difference = globalChatList.length - prevGlobalChatListLength.current;
      setNewMessages(difference);
      setShowTooltip(true);

      // If the newest message is from the current user, scroll to bottom
      if (globalChatList[globalChatList.length - 1].senderId === user._id) {
        handleInitialScroll();
      }
    }

    // 2) If the drawer just opened/closed or if we have new messages
    //    and haven't set isLoaded yet, scroll to bottom
    if (
      (!isLoaded &&
        (prevIsDrawerOpen.current !== isDrawerOpen ||
          prevGlobalChatListLength.current < globalChatList.length))
    ) {
      handleInitialScroll();
    }

    // Update refs for next cycle
    prevGlobalChatListLength.current = globalChatList.length;
    prevIsDrawerOpen.current = isDrawerOpen;
  }, [globalChatList, isDrawerOpen, user._id, isLoaded]);

  // ------------------- Sync local chatList with prop globalChatList (getDerivedStateFromProps) -------------------
  useEffect(() => {
    // If globalChatList changes length, update local chatList
    if (globalChatList && globalChatList.length !== chatList.length) {
      setChatList(globalChatList);
    }
  }, [globalChatList, chatList.length]);

  // ------------------- Handlers -------------------
  const handleInitialScroll = () => {
    if (!chatBoxRef.current) return;
    const offset = 50;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight + offset;
    setIsLoaded(true);
  };

  const handleScroll = () => {
    if (!chatBoxRef.current) return;

    const chatBox = chatBoxRef.current;
    // difference between the total scroll height and (current scroll position + element's height)
    const scrollDifference = chatBox.scrollHeight - (chatBox.scrollTop + chatBox.clientHeight);

    // If near the bottom, hide the tooltip
    if (scrollDifference < 30) {
      setShowTooltip(false);
    }
  };

  const handleOpenPlayerModal = (senderId) => {
    setShowPlayerModal(true);
    setSelectedCreator(senderId);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const handleMessageClick = (message) => {
    // If the clicked message is the same as the selected message, deselect
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
        time: null,
      });
    } else {
      // Otherwise, select it
      setSelectedMessage({
        sender: message.sender,
        rank: message.rank,
        accessory: message.accessory,
        senderId: message.senderId,
        avatar: message.avatar,
        message: message.message,
        messageType: message.messageType,
        replyTo: message.replyTo,
        time: message.time,
      });
    }
  };

  // This replicates your fetchAndUpdateId method for mentions
  const fetchAndUpdateId = async (username) => {
    // Check if we already have the user in state
    const mentionedUser = mentionedUsers[username];
    if (mentionedUser && mentionedUser._id) {
      return mentionedUser;
    } else {
      // If not found, fetch from the server
      try {
        const userData = await fetchId(username);
        if (userData && userData._id) {
          setMentionedUsers((prevState) => ({
            ...prevState,
            [username]: userData,
          }));
        }
        return userData;
      } catch (error) {
        // handle error as needed
        return null;
      }
    }
  };

  // ------------------- Rendering -------------------
  const offset = 50;
  const uniqueMessages = new Set();

  return (
    <div className="chat-panel global-chat" ref={chatBoxRef} onScroll={handleScroll}>
      {/* Tooltip for new messages */}
      {showTooltip && (
        <ButtonBase
          onClick={() => {
            if (!chatBoxRef.current) return;
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight + offset;
            setShowTooltip(false);
          }}
          className="msgtooltip"
        >
          {newMessages} new chat(s) &nbsp;
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
            const message = chat.message;
            // Combine message + time to identify unique messages
            const messageTimeKey = message + chat.time;

            if (uniqueMessages.has(messageTimeKey)) {
              return null;
            }
            uniqueMessages.add(messageTimeKey);

            // Split & replace emojis for main message
            const wrappedMessage = message
              .split(/(:\w+:)/g)
              .map((part, i) => {
                if (part.startsWith(':') && part.endsWith(':')) {
                  const emojiObj = emojis.find((e) => e.command === part);
                  if (emojiObj) {
                    const { url, alt } = emojiObj;
                    return (
                      <img
                        key={i}
                        src={url}
                        alt={alt}
                        className="emoji"
                      />
                    );
                  }
                }
                return part;
              });

            // Split & replace emojis for reply message
            let wrappedReplyMessage = null;
            if (chat.replyTo && chat.replyTo.message) {
              const replyMessage = chat.replyTo.message;
              wrappedReplyMessage = replyMessage
                .split(/(:\w+:)/g)
                .map((part, i) => {
                  if (part.startsWith(':') && part.endsWith(':')) {
                    const emojiObj = emojis.find((e) => e.command === part);
                    if (emojiObj) {
                      const { url, alt } = emojiObj;
                      return (
                        <img
                          key={i}
                          src={url}
                          alt={alt}
                          className="emoji"
                        />
                      );
                    }
                  }
                  return part;
                });
            }

            return (
              <div
                key={index}
                className={`chat-line ${
                  selectedMessage === chat ? 'selected' : ''
                } ${
                  chat.sender === 'SYSTEM' ? 'special-message' : ''
                } ${
                  chat.sender === 'SYSTEM' && chat.message.includes('rent')
                    ? 'special-message-rent'
                    : ''
                }`}
                onClick={() => handleMessageClick(chat)}
              >
                {/* If replying to another message */}
                {chat.replyTo && chat.replyTo.message && (
                  <div className="reply-to">
                    <a
                      className="chat-player"
                      onClick={() => handleOpenPlayerModal(chat.replyTo.senderId)}
                    >
                      <div className="reply-border" />
                      <Avatar
                        className="avatar"
                        src={chat.replyTo.avatar}
                        alt=""
                        username={chat.replyTo.sender}
                        rank={chat.replyTo.rank}
                        accessory={chat.replyTo.accessory}
                        darkMode={isDarkMode}
                      />
                      <i
                        className={`online-status${
                          onlineUserList.includes(chat.replyTo.senderId)
                            ? ' online'
                            : ''
                        }`}
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
                  </div>
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
                      username={chat.sender}
                      rank={chat.rank}
                      darkMode={isDarkMode}
                    />
                    <i
                      className={`online-status${
                        onlineUserList.includes(chat.senderId)
                          ? ' online'
                          : ''
                      }`}
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
              <Skeleton variant="circle" width={40} height={40} />
              <div style={{ flex: 1 }}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------- Redux -------------------
const mapStateToProps = (state) => ({
  userName: state.auth.userName,
  user: state.auth.user,
  isDarkMode: state.auth.isDarkMode,
  socket: state.auth.socket,
  globalChatList: state.logic.globalChatList,
  isDrawerOpen: state.auth.isDrawerOpen,
});

const mapDispatchToProps = {
  fetchId,
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);