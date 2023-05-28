import React, { Component } from 'react';
import { connect } from 'react-redux';

import Moment from 'moment';
// import { alertModal } from '../modal/ConfirmAlerts';
import Avatar from '../../components/Avatar';
import { Tabs, Tab, Button, TextField } from '@material-ui/core';
import GlobalChat from './GlobalChat';
import MyChat from './MyChat';
import Chat from '../icons/Chat.js';
import ChatHover from '../icons/ChatHover';
import ChatRoom from '../icons/ChatRoom';
import ChatRoomHover from '../icons/ChatRoomHover.js';


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
    textTransform: 'none'
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


  handleMouseEnter = (index) => {
    this.setState({ hoverTabIndex: index });
  }
  
  handleMouseLeave = () => {
    this.setState({ hoverTabIndex: -1 });
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
          TabIndicatorProps={{ style: { background: '#ff0000' } }}
          className="main-game-page-tabs"
        >
          <Tab
            className="custom-tab"
            icon={
              this.state.hoverTabIndex === 0 || this.state.selected_tab_index === 0 ? (
                <ChatHover />
              ) : (
                <Chat />
              )
            }
            style={customStyles.tabRoot}
            onMouseEnter={() => this.handleMouseEnter(0)}
    onMouseLeave={this.handleMouseLeave}
          />
          <Tab
            className="custom-tab"

            icon={
              this.state.hoverTabIndex === 1 || this.state.selected_tab_index === 1 ? (
                <ChatRoomHover />
              ) : (
                <ChatRoom />
              )
            }
            style={customStyles.tabRoot} 
            onMouseEnter={() => this.handleMouseEnter(1)}
    onMouseLeave={this.handleMouseLeave}
        />
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
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                😩
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                😍
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                😊
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                ☠
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🔥
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🏝
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🚀
              </span>
              <span role="img" aria-label="" onClick={this.insertEmoji}>
                🥩
              </span>
            </div>
            <Button
              className="btn-show-emoticon"
              onClick={this.toggleEmojiPanel}
            ></Button>
            <TextField
              type="text"
              className="form-control"
              variant="outlined"
              placeholder="SAY HI..."
              onKeyDown={this.onTextAreaKeyDown}
              onChange={this.onChangeText}
              value={this.state.text}
              autoComplete="off"
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
