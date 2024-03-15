import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getChatRoomInfo, addChatLog } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faHome } from '@fortawesome/free-solid-svg-icons';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import DrawerButton from '../main_pages/DrawerButton';
import Footer from '../main_pages/Footer';
import HistoryTable from '../LiveGames/HistoryTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';
import MyGamesTable from '../MyGames/MyGamesTable';
import ChatPanel from '../ChatPanel/ChatPanel';

import {
  loadRoomInfo,
  // getRoomList,
  setCurRoomInfo,
  getMyChat,
  getMyGames,
  getMyHistory,
  getHistory,
  getGameTypeList
} from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import { Button, Tabs, Tab, Drawer } from '@material-ui/core';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/live';

const moment = require('moment');

class ChatPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chatLogs: this.props.chatLogs,
      my_info: this.props.my_info,
      text: '',
      socket: this.props.socket,
      showPlayerModal: false,
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

  toggleDrawer = () => {
    this.props.toggleDrawer(!this.props.isDrawerOpen);
  };

  sendMessage = e => {
    const text = this.state.text.trim();

    if (text !== '') {
      const chatLog = {
        to: this.props.user_id,
        from: this.state.my_info._id,
        message: text,
        is_read: false,
        created_at: moment(new Date()).format('LLL')
      };
      this.props.addChatLog(chatLog);
      this.state.socket.emit('SEND_CHAT', chatLog);
      this.setState({ text: '', showEmojiPanel: false });
    }
  };

  onTextAreaKeyDown = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.sendMessage();
    }
  };

  static getDerivedStateFromProps(props, current_state) {
    return {
      ...current_state,
      chatLogs: props.chatLogs,
      my_info: props.my_info,
      socket: props.socket
    };
  }

  async componentDidMount() {
    try {
      const { id } = this.props.match.params;
      await this.initializeRoomData(id);
      this.props.getHistory();

      if (this.state.socket) {
        this.state.socket.on('connect', () => {
          this.state.socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', {
            to: this.state.my_info._id
          });
        });
      }
    } catch (error) {
      console.error('Error in componentDidMount:', error);
    }
  }

  async initializeRoomData(id) {
    try {
      await this.props.getChatRoomInfo(id);

      await this.props.getHistory();

      await this.props.getGameTypeList();
      if (this.props.isAuthenticated) {
        // await this.props.getMyGames();
        await this.props.getMyHistory();

        await this.props.getMyChat();
      }

    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  }

  async componentDidUpdate(prevProps) {
    const { id } = this.props.match.params;
    if (prevProps.user_id !== this.props.user_id) {
      await this.props.getChatRoomInfo(id);
    }

    this.chat_log_panel.scrollTop = this.chat_log_panel.scrollHeight;
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  showOpenGameOrHistory = (e, newValue) => {
    e.preventDefault();
    this.setState({
      show_open_game: newValue
    });
  };

  //   getActiveTabText = () =>
  //     (this.state.is_mobile && this.state.selectedMobileTab === 'live_games') ||
  //     (!this.state.is_mobile && this.props.selectedMainTabIndex === 0) ? (
  //       <div id="liveStakes">
  //         {this.props.roomCount} LIVE BATTLES
  //         {/* <Lottie options={defaultOptions} width={40} /> */}
  //       </div>
  //     ) : (
  //       'Your Battles'
  //     );

  render() {
    const {
      showPlayerModal,
      is_mobile,
      selectedCreator,
      my_info,
      text,
      selectedMobileTab,
      show_open_game,
      showEmojiPanel
    } = this.state;
    const {
      open,
      loading,
      rank,
      accessory,
      avatar,
      chatLogs,
      username,
      gameTypeList,
      isDrawerOpen,
      user_id,
      selectedMainTabIndex
    } = this.props;

    const customStyles = {
      tabRoot: {
        textTransform: 'none',
        width: '50%'
      }
    };

    return (
      <div
        className="main-game"
        style={{
          gridTemplateColumns: isDrawerOpen
            ? '260px calc(100% - 610px) 350px'
            : 'calc(100% - 350px) 350px'
        }}
      >
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={this.handleClosePlayerModal}
          />
        )}
        {((is_mobile && selectedMobileTab === 'chat') || !is_mobile) && (
          <Drawer
            className="mat-chat"
            style={{ display: isDrawerOpen ? 'flex' : 'none' }}
            variant="persistent"
            anchor="left"
            open={isDrawerOpen}
          >
            <ChatPanel />
          </Drawer>
        )}
        {!is_mobile &&
          (!selectedMobileTab === 'live_games' ||
            !selectedMobileTab === 'my_games') && (
            <Tabs
              value={show_open_game}
              onChange={this.showOpenGameOrHistory}
              TabIndicatorProps={{ style: { background: '#ff0000' } }}
              className="main-game-page-tabs"
            >
              <Tab
                label={
                  selectedMobileTab === 'live_games'
                    ? 'Live Battles'
                    : 'Your Battles'
                }
                style={customStyles.tabRoot}
              />
              <Tab label="History" style={customStyles.tabRoot} />
            </Tabs>
          )}
        {/* <h2 className="main-title desktop-only">{this.getActiveTabText()}</h2> */}
        <div className="chat-page">
          <div
            className="chat-header"
            style={{
              width: isDrawerOpen ? 'calc(100% - 610px)' : 'calc(100% - 350px)'
            }}
          >
            <Button
              className="btn-back"
              onClick={() => {
                history.push('/');
              }}
            >
              Home&nbsp;
              <FontAwesomeIcon icon={faHome} />
            </Button>
            <a
              className="player"
              onClick={() => this.handleOpenPlayerModal(user_id)}
              style={{ display: 'flex', flexDirection: 'row' }}
            >
              <Avatar
                src={avatar}
                rank={rank}
                accessory={accessory}
                className="avatar"
              />
                
              <span style={{marginLeft: "10px", display: "flex", alignItems: "center"}}>{username}</span>
            </a>
          </div>

          <div
            className="chat-log-panel"
            ref={elem => {
              this.chat_log_panel = elem;
            }}
          >
            {!loading ? (
              <>
                {chatLogs.map((row, key) => (
                  <div
                    className={
                      row.from === my_info._id ? 'my-message' : 'other-message'
                    }
                    key={key}
                  >
                    <div className="message-content">{row.message}</div>
                    <div className="message-header">
                      {row.from !== my_info._id && (
                        <div
                        onClick={() => this.handleOpenPlayerModal(user_id)}
                        style={{ cursor: "pointer", position: "relative" }}
                        >
                        <Avatar
                          src={avatar}
                          rank={rank}
                          accessory={accessory}
                          className="avatar"
                        />
                        </div>
                      )}
                      <div>
                        <div className="message-time">{row.created_at}</div>
                        <div className="message_username">
                          {row.from === my_info._id
                            ? my_info.username
                            : username}
                        </div>
                      </div>
                      {row.from === my_info._id && (
                        <div
                        onClick={() => this.handleOpenPlayerModal(my_info._id)}
                        style={{ cursor: "pointer", position: "relative" }}
                        >
                        <Avatar
                          src={my_info.avatar}
                          rank={my_info.totalWagered}
                          accessory={my_info.accessory}
                          className="avatar"
                        />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="loading-spinner"></div>
            )}
          </div>
          <div
            className={`chat-input-panel ${showEmojiPanel ? 'show-emoji' : ''}`}
          >
            <div className={`emoticon-panel ${showEmojiPanel ? 'active' : ''}`}>
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
              onClick={() => {
                this.setState({ showEmojiPanel: !showEmojiPanel });
              }}
            ></Button>
            <input
              type="text"
              className="form-control"
              placeholder="Chat here..."
              onKeyDown={this.onTextAreaKeyDown}
              onChange={this.onChangeText}
              value={text}
              ref={elem => {
                this.textarea = elem;
              }}
            />
            <Button className="btn-send-message" onClick={this.sendMessage}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </Button>
          </div>
          {((!is_mobile && selectedMainTabIndex === 1) ||
            (is_mobile &&
              selectedMobileTab === 'my_games' &&
              show_open_game === 0)) && (
            <MyGamesTable gameTypeList={gameTypeList} />
          )}
          {is_mobile &&
            selectedMobileTab === 'live_games' &&
            show_open_game === 1 && <HistoryTable />}
          {is_mobile &&
            selectedMobileTab === 'my_games' &&
            show_open_game === 1 && <MyHistoryTable />}
        </div>
        <div className="sub-panel">
          <h2 className="main-title desktop-only">HISTORY</h2>
          {!is_mobile && selectedMainTabIndex === 0 && <HistoryTable />}
          <DrawerButton open={isDrawerOpen} toggleDrawer={this.toggleDrawer} />
          {!is_mobile && selectedMainTabIndex === 1 && <MyHistoryTable />}
        </div>
        {!is_mobile && (
          <div className="mobile-only main-page-nav-button-group">
            <Button
              className={`mobile-tab-live ${
                selectedMobileTab === 'live_games' ? 'active' : ''
              }`}
              onClick={e => {
                this.setState({ selectedMobileTab: 'live_games' });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="none"
                viewBox="0 0 32 32"
              >
                <path
                  stroke={
                    selectedMobileTab === 'live_games' ? '#fff' : '#8E9297'
                  }
                  strokeWidth="1.5"
                  d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
                />
              </svg>
              {selectedMobileTab === 'live_games' && 'LIVE BATTLES'}
            </Button>
            <Button
              className={`mobile-tab-my ${
                selectedMobileTab === 'my_games' ? 'active' : ''
              }`}
              onClick={e => {
                this.setState({ selectedMobileTab: 'my_games' });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="33"
                height="32"
                fill="none"
                viewBox="0 0 33 32"
              >
                <path
                  stroke={selectedMobileTab === 'my_games' ? '#fff' : '#8E9297'}
                  strokeWidth="1.5"
                  d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
                />
                <path
                  fill={selectedMobileTab === 'my_games' ? '#fff' : '#8E9297'}
                  d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
                />
              </svg>
              {selectedMobileTab === 'my_games' && 'YOUR BATTLES'}
            </Button>
            <button
              className={`mobile-tab-marketplace ${
                selectedMobileTab === 'marketplace' ? 'active' : ''
              }`}
              onClick={e => {
                this.setState({ selectedMobileTab: 'marketplace' });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="none"
                viewBox="0 0 32 32"
              >
                <path
                  stroke={
                    selectedMobileTab === 'marketplace' ? '#fff' : '#8E9297'
                  }
                  strokeWidth="1.5"
                  d="M10.083 6.083h11.833v8.584c0 3.268-2.649 5.917-5.916 5.917-3.268 0-5.917-2.65-5.917-5.917V6.083zM9.333 26.666h13.333M22.223 14.597c3.528-.571 4.444-4.538 4.444-6.597H22M9.777 14.597C6.25 14.026 5.333 10.06 5.333 8H10M16 21.334v5.333"
                />
              </svg>
              {selectedMobileTab === 'marketplace' && 'MARKETPLACE'}
            </button>
            <Button
              className={`mobile-tab-chat ${
                selectedMobileTab === 'chat' ? 'active' : ''
              }`}
              onClick={e => {
                this.setState({ selectedMobileTab: 'chat' });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="33"
                height="32"
                fill="none"
                viewBox="0 0 33 32"
              >
                <path
                  stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                  strokeWidth="1.5"
                  d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
                />
                <circle
                  cx="10.5"
                  cy="16"
                  r="2"
                  stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                  strokeWidth="1.5"
                />
                <circle
                  cx="16.5"
                  cy="16"
                  r="2"
                  stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                  strokeWidth="1.5"
                />
                <circle
                  cx="22.5"
                  cy="16"
                  r="2"
                  stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                  strokeWidth="1.5"
                />
              </svg>
              {selectedMobileTab === 'chat' && 'CHAT'}
            </Button>
          </div>
        )}
        <Footer
          className="footer"
          open={isDrawerOpen}
          style={{ marginLeft: isDrawerOpen ? '270px' : '0' }}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  my_info: state.auth.user,
  socket: state.auth.socket,
  user_id: state.logic.chatRoomInfo.user_id,
  avatar: state.logic.chatRoomInfo.avatar,
  rank: state.logic.chatRoomInfo.rank,
  accessory: state.logic.chatRoomInfo.accessory,
  username: state.logic.chatRoomInfo.username,
  chatLogs: state.logic.chatRoomInfo.chatLogs,
  gameTypeList: state.logic.gameTypeList,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  isDrawerOpen: state.auth.isDrawerOpen,
  isDarkMode: state.auth.isDarkMode,
  history: state.logic.history,
  loading: state.logic.isActiveLoadingOverlay,
  pageNumber: state.logic.pageNumber,
  totalPage: state.logic.totalPage
});

const mapDispatchToProps = {
  getChatRoomInfo,
  addChatLog,
  getHistory,
  getMyGames,
  getMyHistory,
  getGameTypeList,
  setCurRoomInfo,
  loadRoomInfo,
  getMyChat,
  toggleDrawer
};

export default connect(mapStateToProps, mapDispatchToProps)(ChatPage);
