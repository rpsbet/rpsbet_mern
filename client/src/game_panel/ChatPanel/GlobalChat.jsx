import React, { Component } from 'react';
import { connect } from 'react-redux';
import './Chat.css';
import PlayerModal from '../modal/PlayerModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointDown } from '@fortawesome/free-solid-svg-icons';

import Avatar from '../../components/Avatar';
import {
  fetchId,
  acGetCustomerInfo
} from '../../redux/Customer/customer.action';

class GlobalChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chat_list: [],
      fetchedGloabal: false,
      newMessages: 0,
      showTooltip: false,
      showPlayerModal: false,
      selectedCreator: '',
      isLoaded: false,
      mentionedUsers: {}
    };

    this.chatBoxRef = React.createRef();
  }

  componentDidMount() {
    this.chatBoxRef.current.addEventListener('scroll', this.handleScroll);

    if (this.state.chat_list.length > 0) {
      this.handleInitialScroll();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.globalChatList.length > 0 &&
      prevProps.globalChatList.length < this.props.globalChatList.length
    ) {
      this.setState(
        {
          newMessages:
            this.props.globalChatList.length - prevProps.globalChatList.length,
          showTooltip: true
        },
        () => console.log(this.state.newMessages, this.state.showTooltip)
      );
    }
    if (
      prevProps.isDrawerOpen !== this.props.isDrawerOpen ||
      prevProps.globalChatList.length < this.props.globalChatList.length
    ) {
      if (this.state.isLoaded === false) {
        this.handleInitialScroll();
      }
    }
  }
  componentWillUnmount() {
    this.chatBoxRef.current.removeEventListener('scroll', this.handleScroll);
  }

  handleInitialScroll() {
    const offset = 50;
    this.chatBoxRef.current.scrollTop =
      this.chatBoxRef.current.scrollHeight + offset;

    this.setState({ isLoaded: true });

    console.log('hdh');
  }

  handleScroll = () => {
    const chatBox = this.chatBoxRef.current;
  
    // Calculate the difference between the scroll height and the scroll position plus the client height
    const scrollDifference = chatBox.scrollHeight - (chatBox.scrollTop + chatBox.clientHeight);
  
    // If the difference is very small (considering potential floating point errors), assume the user is at the bottom
    if (scrollDifference < 30) {
      this.setState({ showTooltip: false });
    }
  };
  
  static getDerivedStateFromProps(props, current_state) {
    if (!props.globalChatList) return null;

    if (current_state.chat_list.length !== props.globalChatList.length) {
      return {
        ...current_state,
        chat_list: props.globalChatList
      };
    }

    return null;
  }

  handleOpenPlayerModal = senderId => {
    // console.log('senderId', senderId)
    this.setState({ showPlayerModal: true, selectedCreator: senderId });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleMessageClick = message => {
    const { selectedMessage, setSelectedMessage } = this.props;

    if (selectedMessage.sender === message.sender) {
      // Deselect the message if it was already selected
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
      // Select the clicked message
      setSelectedMessage({
        sender: message.sender,
        rank: message.rank,
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

  fetchAndUpdateId(username) {
    // Check if the user is already in the state
    const mentionedUser = this.state.mentionedUsers[username];

    if (mentionedUser && mentionedUser._id) {
      // User already has an _id, no need to fetch
      return Promise.resolve(mentionedUser);
    } else {
      // Fetch the _id for the mentioned user
      return new Promise((resolve, reject) => {
        fetchId(username)
          .then(user => {
            if (user && user._id) {
              // Update the state with the fetched _id
              this.setState(prevState => ({
                mentionedUsers: {
                  ...prevState.mentionedUsers,
                  [username]: user
                }
              }));
            }
            resolve(user);
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }

  render() {
    const { chat_list } = this.state;
    const { fetchId, emojis, selectedMessage } = this.props;
    const offset = 50;
    return (
      <div className="chat-panel global-chat" ref={this.chatBoxRef} onScroll={this.handleScroll}>
        {this.state.showTooltip && (
          <div
            onClick={() => {
              this.chatBoxRef.current.scrollTop =
                this.chatBoxRef.current.scrollHeight + offset;
              this.setState({ showTooltip: false });
            }}
            className="msgtooltip"
          >
            {this.state.newMessages} new chat(s) &nbsp;{' '}
            <FontAwesomeIcon icon={faHandPointDown} />
          </div>
        )}
        {this.state.showPlayerModal && (
          <PlayerModal
            selectedCreator={this.state.selectedCreator}
            modalIsOpen={this.state.showPlayerModal}
            closeModal={this.handleClosePlayerModal}
          />
        )}
        {chat_list && chat_list.length > 0 ? (
          <>
            {chat_list.map((chat, key) => {
              const message = chat.message;
              const mentions = message.match(/@(\w+)/g);

              const wrappedMessage = message
                .split(/(@\w+|:\w+:)/g)
                .map((part, index) => {
                  if (part.startsWith('@')) {
                    const username = part.substring(1);

                    // Call fetchAndUpdateId to fetch the _id and update the state
                    const mentionedUser = this.fetchAndUpdateId(username);

                    if (mentionedUser && mentionedUser._id) {
                      // Render the link with _id if available
                      return (
                        <a
                          key={index}
                          className="player"
                          onClick={event => {
                            event.stopPropagation();
                            this.handleOpenPlayerModal(mentionedUser._id);
                          }}
                        >
                          {part}
                        </a>
                      );
                    } else if (mentionedUser && !mentionedUser._id) {
                      // Mentioned user exists but doesn't have an _id
                      return (
                        <span key={index} className="mention-link">
                          {part}
                        </span>
                      );
                    } else {
                      // Fetching the _id, render the mention link without _id for now
                      return (
                        <span key={index} className="mention-link">
                          {part}
                        </span>
                      );
                    }
                  } else if (part.startsWith(':') && part.endsWith(':')) {
                    const emojiCommand = part;
                    const emoji = emojis.find(
                      emoji => emoji.command === emojiCommand
                    );

                    if (emoji) {
                      const { url, alt } = emoji;
                      return (
                        <img
                          key={index}
                          src={url}
                          alt={alt}
                          className="emoji"
                        />
                      );
                    }
                  }
                  return part;
                });

              // Handle replyTo message
              let wrappedReplyMessage = null;
              if (chat.replyTo && chat.replyTo.message) {
                const replyMessage = chat.replyTo.message;
                wrappedReplyMessage = replyMessage
                  .split(/(@\w+|:\w+:)/g)
                  .map((part, index) => {
                    if (part.startsWith('@')) {
                      const username = part.substring(1);
                      const mentionedUser = this.state.mentionedUsers[username];

                      if (mentionedUser && mentionedUser._id) {
                        // Render the link with _id if available
                        return (
                          <a
                            key={index}
                            className="player"
                            onClick={event => {
                              event.stopPropagation();
                              this.handleOpenPlayerModal(mentionedUser._id);
                            }}
                          >
                            {part}
                          </a>
                        );
                      } else if (mentionedUser && !mentionedUser._id) {
                        // Mentioned user exists but doesn't have an _id
                        return (
                          <span key={index} className="mention-link">
                            {part}
                          </span>
                        );
                      } else {
                        // Fetch the _id for the mentioned user only if it's not already in the state
                        fetchId(username)
                          .then(id => {
                            const updatedMentionedUsers = {
                              ...this.state.mentionedUsers
                            };
                            updatedMentionedUsers[username] = { _id: id };
                            this.setState({
                              mentionedUsers: updatedMentionedUsers
                            });
                          })
                          .catch(error => {
                            console.error(
                              `Error fetching _id for ${username}:`,
                              error
                            );
                          });

                        // Render the mention link without _id for now
                        return (
                          <span key={index} className="mention-link">
                            {part}
                          </span>
                        );
                      }
                    } else if (part.startsWith(':') && part.endsWith(':')) {
                      const emojiCommand = part;
                      const emoji = emojis.find(
                        emoji => emoji.command === emojiCommand
                      );

                      if (emoji) {
                        const { url, alt } = emoji;
                        return (
                          <img
                            key={index}
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
                  key={key}
                  className={`chat-line ${
                    selectedMessage === chat ? 'selected' : ''
                  }`}
                  onClick={() => this.handleMessageClick(chat)}
                >
                  {chat.replyTo && chat.replyTo.sender && (
                    <div className="reply-to">
                      <a
                        className="chat-player"
                        onClick={() =>
                          this.handleOpenPlayerModal(chat.senderId)
                        }
                      >
                        <div className="reply-border"></div>
                        <Avatar
                          className="avatar"
                          src={chat.replyTo.avatar}
                          alt=""
                          rank={chat.replyTo.rank}
                          accessory={chat.replyTo.accessory}
                          darkMode={this.props.isDarkMode}
                        />
                      </a>
                      <span className="reply-sender sender-name">
                        {chat.replyTo.sender}
                      </span>
                      <span className="reply-message chat-text">
                        {chat.replyTo.messageType === 'gif' ? (
                          <img
                            src={JSON.parse(chat.replyTo.message).content}
                            alt="gif"
                          />
                        ) : (
                          wrappedReplyMessage
                        )}
                      </span>
                      {/* <span className="reply-time chat-time">{chat.replyTo.time}</span> */}
                    </div>
                  )}
                  <div className="chat-content">
                    <a
                      className="chat-player"
                      onClick={() => this.handleOpenPlayerModal(chat.senderId)}
                    >
                      <Avatar
                        className="avatar"
                        src={chat.avatar}
                        accessory={chat.accessory}
                        alt=""
                        rank={chat.rank}
                        darkMode={this.props.isDarkMode}
                      />
                    </a>

                    <div className="chat-msg">
                      <span className="sender-name">{chat.sender}</span>

                      <span className="chat-text">
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
          <div className="loading-spinner"></div>
        )}
      </div>
    );
  }
}
const mapStateToProps = state => ({
  userName: state.auth.userName,
  user: state.auth.user,
  isDarkMode: state.auth.isDarkMode,
  socket: state.auth.socket,
  globalChatList: state.logic.globalChatList,
  isDrawerOpen: state.auth.isDrawerOpen
});

const mapDispatchToProps = {
  acGetCustomerInfo,
  fetchId
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);
