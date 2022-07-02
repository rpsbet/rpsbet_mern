import React, { Component } from 'react';
import { connect } from 'react-redux';
import './Chat.css';

class GlobalChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chat_list: []
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.chat_list.length !== props.globalChatList.length) {
      return {
        ...current_state,
        chat_list: props.globalChatList
      };
    }

    return null;
  }

  render() {
    return (
      <div className="chat-panel global-chat">
        {this.state.chat_list.map(
          (chat, key) => (
            <div className="chat-line" key={key}>
              <div className="chat-content">
                <span className="sender-name">{chat.sender}:</span>
                <span className="chat-text">{chat.message}</span>
              </div>
              <div className="chat-time">{chat.time}</div>
            </div>
          ),
          this
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userName: state.auth.userName,
  isDarkMode: state.auth.isDarkMode,
  socket: state.auth.socket,
  globalChatList: state.logic.globalChatList
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);
