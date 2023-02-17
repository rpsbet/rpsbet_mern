import React, { Component } from 'react';
import { connect } from 'react-redux';

import Moment from 'moment';
// import { alertModal } from '../modal/ConfirmAlerts';
import Avatar from '../../components/Avatar';
import { Tabs, Tab } from '@material-ui/core';
import GlobalChat from './GlobalChat';
import MyChat from './MyChat';
// function updateFromNow(history) {
// 	const result = JSON.parse(JSON.stringify(history));
// 	for (let i=0; i<result.length; i++) {
// 		result[i]['from_now'] = Moment(result [i]['created_at']).fromNow();
// 	}
// 	return result;
// }

const customStyles = {
  tabRoot: {
    minWidth: '50%',
    textTransform: 'none',
    backgroundColor: 'rgba(47, 49, 54, 0.5)'
  }
};

class ChatPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_tab_index: 1,
      text: '',
      showEmojiPanel: false
    };
  }

  insertEmoji = e => {
    this.setState({ text: this.state.text + e.target.innerHTML });
    this.textarea.focus();
  };

  onChangeText = e => {
    this.setState({ text: e.target.value });
  };

  handleTabChange = (event, newValue) => {
    this.setState({ selected_tab_index: newValue });
  };

  onTextAreaKeyDown = e => {
    if (!this.props.socket) return;

    if (e.keyCode === 13) {
      e.preventDefault();
      const text = this.state.text.trim();

      if (text !== '') {
        this.props.socket.emit('GLOBAL_CHAT_SEND', {
          sender: this.props.userName,
          senderId: this.props.user._id,
          message: this.state.text,
          avatar: this.props.user.avatar
        });
        this.setState({ text: '', showEmojiPanel: false });
      }
    }
  };

  toggleEmojiPanel = e => {
    e.preventDefault();
    this.setState({ showEmojiPanel: !this.state.showEmojiPanel });
  };

  render() {
    return (
      <div className="chat-wrapper">
        <Tabs
          value={this.state.selected_tab_index}
          onChange={this.handleTabChange}
          TabIndicatorProps={{ style: { background: '#c438ef' } }}
          className="main-game-page-tabs"
        >
          <Tab label="MY CHAT" style={customStyles.tabRoot} />
          <Tab label="GLOBAL CHAT" style={customStyles.tabRoot} />
        </Tabs>
        {this.state.selected_tab_index === 0 ? <MyChat /> : <GlobalChat />}
        {this.state.selected_tab_index === 1 && (
          <div className="chat-input-panel">
            <div
              className={`emoticon-panel ${
                this.state.showEmojiPanel ? 'active' : ''
              }`}
            >
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🤬
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🖕
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🖕🏿
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🖕🏽
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🖕🏻
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                😭
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🤔
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🤑
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🤣
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                😎
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                😏
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                ☔️
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🏆
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🎁
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🎯
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                ❤
              </span>
            </div>
            <button
              className="btn-show-emoticon"
              onClick={this.toggleEmojiPanel}
            ></button>
            <input
              type="text"
              className="form-control"
              placeholder="SAY HI..."
              onKeyDown={this.onTextAreaKeyDown}
              onChange={this.onChangeText}
              value={this.state.text}
              ref={elem => {
                this.textarea = elem;
              }}
            />
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,
  userName: state.auth.userName,
  user: state.auth.user,
  socket: state.auth.socket
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(ChatPanel);
