import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import ProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/ProductPage';
import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import {
  getRoomList,
  getHistory,
  getRoomCount,
  clearRoomListCache,
  setCurRoomInfo,
  getMyChat,
  getGameTypeList,
  getWithdrawals,
  getWins,
} from '../../redux/Logic/logic.actions';
import { Info } from '@material-ui/icons';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import MyGamesTable from '../MyGames/MyGamesTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';
import RefreshIcon from '@material-ui/icons/Refresh';
import ShowHistory from '../icons/ShowHistory.js';
import ShowHistoryHover from '../icons/ShowHistoryHover';
import Battle from '../icons/Battle.js';
import BattleHover from '../icons/BattleHover';
import Manage from '../icons/Manage.js';
import ManageHover from '../icons/ManageHover';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/live';
import { Button } from '@material-ui/core';
import AiPanel from '../../components/AiPanel';
import JukeboxPanel from '../../components/JukeboxPanel.jsx';
import { Tabs, Tab, Drawer, IconButton, Tooltip } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { convertToCurrency } from '../../util/conversion.js';
import { faCoins, faStore, faLink } from '@fortawesome/free-solid-svg-icons';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import DrawerButton from './DrawerButton';
import SupportButton from './SupportButton';
import ChatPanel from '../ChatPanel/ChatPanel';
import OpenGamesTable from '../LiveGames/OpenGamesTable';
import HistoryTable from '../LiveGames/HistoryTable';
import Footer from './Footer';
import { Translate } from '@material-ui/icons';

const customStyles = {
  tabRoot: {
    textTransform: 'none',
    width: '50%',
    height: '48px'
  }
};

const calculateDaysUntilNextMonth = () => {
  const now = moment();
  const nextMonth = now.clone().add(1, 'months').startOf('month');
  const daysUntilNextMonth = nextMonth.diff(now, 'days');
  return daysUntilNextMonth > 0 ? `${daysUntilNextMonth}d` : '0d';
};


const formatTimeAgo = (date) => {
  const duration = moment.duration(moment().diff(moment(date)));
  const seconds = Math.floor(duration.asSeconds());
  const minutes = Math.floor(duration.asMinutes());
  const hours = Math.floor(duration.asHours());
  const days = Math.floor(duration.asDays());

  if (seconds < 60) return `${seconds} s`;
  if (minutes < 60) return `${minutes} m`;
  if (hours < 24) return `${hours} h`;
  return `${days}d`;
};


class MainPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: this.props.balance,
      is_mobile: window.innerWidth < 1024 ? true : false,
      selectedMobileTab: 'live_games',
      show_open_game: 0,
      selectedGameType: 'All',
      isDrawerOpen: true,
      showP2PLending: false,
      showMarketplace: false,
      refreshing: false,
      selectedCreator: '',
           remainingDays: calculateDaysUntilNextMonth()
    };
    this.toggleDrawer = this.toggleDrawer.bind(this);
  }

  async componentDidMount() {
    const { selectedGameType } = this.state;
    const {
      getRoomList,
      getRoomCount,
      getHistory,
      getWins,
      getWithdrawals,
      // getGameTypeList,
      isAuthenticated,
      getMyChat
    } = this.props;
    // this.gamesListInterval = setInterval(this.handleRefresh, 100000);
    const promises = [getRoomList({ pageSize: 7 }), getWins(), getWithdrawals(), getRoomCount({ game_type: selectedGameType })];
    if (isAuthenticated) {
      promises.push(getMyChat());
    }

    await Promise.all(promises);
    if (this.state.is_mobile && !this.props.isDrawerOpen) {
      this.toggleDrawer();
    }

  }

  toggleP2PLending = () => {
    this.setState({
      showP2PLending: !this.state.showP2PLending,
      showMarketplace: false
    });
  };

  toggleMarketplace = () => {
    this.setState({
      showMarketplace: !this.state.showMarketplace,
      showP2PLending: false
    });
  };

  showOpenGameOrHistory = (e, newValue) => {
    e.preventDefault();
    this.setState({
      show_open_game: newValue
    });
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleRefresh = async () => {
    this.setState({ refreshing: true }, async () => {
      await this.props.clearRoomListCache();
      await this.props.getRoomCount();
      await this.props.getRoomList({ pageSize: 7 });
      this.setState({ refreshing: false });
    })
  };

  onChangeGameType = async (newType, callback) => {
    await this.props.getRoomCount({ game_type: newType });
    this.setState({
      selectedGameType: newType,
    }, callback);
  };

  toggleDrawer = () => {
    this.props.toggleDrawer(!this.props.isDrawerOpen);
  };

  getActiveTabText = () => {
    if (this.state.selectedMobileTab === 'marketplace') {
      return null; // Render nothing if selectedMobileTab is not 'marketplace'
    }
    const defaultOptions = {
      loop: this.props.isLowGraphics ? false : true,
      autoplay: this.props.isLowGraphics ? false : true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    };

    return (
      (this.state.is_mobile && this.state.selectedMobileTab === 'live_games' && this.state.show_open_game !== 1) ||
        (!this.state.is_mobile && this.props.selectedMainTabIndex === 0) ? (
        <>
          <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
            <h2 className="main-title recently-closed-title" style={{ padding: "0 0 15px 0" }}>TOP PLAYS</h2>
          </div>
          <div className='top-wins'>
            {this.props.topWins?.map((row, index) => (
              <div
                key={`table-cell-${index}-${row.room}`}
                className="table-cell"
                onClick={() => window.location.href = `/join/${row.room}`}
                style={{ cursor: 'pointer' }}
              >
                <div key={`carousel-content-${index}-${row.room}`} className="carousel-content table-row slide-in">
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <a
                      href="#"
                      className="player"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.handleOpenPlayerModal(row.joined_user._id);
                      }} style={{ marginRight: "-15px" }}
                    >
                      <Avatar
                        className="avatar"
                        src={row.joined_user.avatar}
                        accessory={row.joined_user.accessory}
                        username={row.joined_user.username}
                        rank={row.joined_user.totalWagered}
                        alt=""
                        darkMode={this.props.isDarkMode}
                      />
                      {/* <i
                          className={`online-status${onlineUserList.includes(row.creator._id) ? ' online' : ''}`}
                        ></i> */}
                    </a>
                  </div>

                  <div className="cell" style={{ lineHeight: '0.5em', marginBottom: "5px", textAlign: "right" }} >
                    <span style={{ whiteSpace: "nowrap" }}>
                      +{convertToCurrency(row.winnings)}  </span>
                    <br />
                    <span style={{ whiteSpace: "nowrap", fontSize: "xx-small" }}>
                      {(row.winnings / row.bet_amount).toFixed(2)}x / ${(row.winnings * 0.119).toFixed(2)}
                    </span>

                  </div>
                  <div className="cell" style={{ whiteSpace: "nowrap", fontSize: "xx-small", position: "absolute", right: '5px', bottom: '0px' }}>
                    <span style={{ color: "unset", whiteSpace: "nowrap", fontSize: "xx-small", marginRight: "-5px", paddingBottom: "10px", paddingTop: "5px" }}>
                      {formatTimeAgo(row.created_at)} ago
                    </span>
                  </div>


                </div>
              </div>

            ))}
          </div>
          <div style={{ display: "inline-flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h2 className="main-title recently-closed-title" style={{ padding: "0 0 15px 0" }}>
          TOP WITHDRAWALS (NEXT WITHDRAWAL OPEN IN {this.state.remainingDays})
        </h2>
            <Tooltip
              style={{ float: "right", right: "20px" }}
              title={'WITHDRAWALS OPEN ON THE 1ST OF EVERY MONTH, VERIFIED USERS HAVE PRIORITY 1 DAY EARLY.'}
              placement="top"
            >
              <Info style={{ cursor: "pointer", width: "20px", height: "20px", transform: "translateY(-8px" }} />
            </Tooltip>
          </div>

          <div className='top-wins' style={{ marginBottom: "20px" }}>
            {this.props.topWithdrawals?.map((row, index) => (
              <div
                key={`table-cell-${index}-${row.room}`}
                className="table-cell"
                onClick={() => window.location.href = `/join/${row.room}`}
                style={{ cursor: 'pointer' }}
              >
                <div key={`carousel-content-${index}-${row.room}`} className="carousel-content table-row slide-in">
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <a
                      href="#"
                      className="player"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.handleOpenPlayerModal(row.user_id._id);
                      }} style={{ marginRight: "-15px" }}
                    >
                      <Avatar
                        className="avatar"
                        src={row.user_id.avatar}
                        accessory={row.user_id.accessory}
                        username={row.user_id.username}
                        rank={row.user_id.totalWagered}
                        alt=""
                        darkMode={this.props.isDarkMode}
                      />
                      {/* <i
                          className={`online-status${onlineUserList.includes(row.creator._id) ? ' online' : ''}`}
                        ></i> */}
                    </a>
                  </div>

                  <div className="cell" style={{ lineHeight: '0.5em', marginBottom: "5px", textAlign: "right" }} >
                    <span style={{ color: "#00ff3a", whiteSpace: "nowrap" }}>
                      +{convertToCurrency(row.amount)}  </span>
                    <br />
                    <span style={{ color: "#00ff3a", whiteSpace: "nowrap", fontSize: "xx-small" }}>
                      ${(row.amount * 0.119).toFixed(2)}
                    </span>

                  </div>
                  <div className="cell" style={{ whiteSpace: "nowrap", fontSize: "xx-small", position: "absolute", right: '5px', bottom: '0px' }}>
                    <span style={{ color: "unset", whiteSpace: "nowrap", fontSize: "xx-small", marginRight: "-5px", paddingBottom: "10px", paddingTop: "5px" }}>
                      {formatTimeAgo(row.created_at)} ago
                    </span>
                  </div>


                </div>
              </div>

            ))}
          </div>
          <div id="liveStakes">
            {this.props.rooms_count} BATTLES
            <Lottie options={defaultOptions} width={40} />
          </div>

          <div className="refresh-main">
            <IconButton color="primary" onClick={this.handleRefresh}>
              <span>GET LATEST GAMES</span>
              <RefreshIcon />
            </IconButton>
          </div>
        </>
      ) : (
        'Your Battles'
      )
    );
  };


  render() {
    const { isDrawerOpen, isLowGraphics } = this.props;

    return (
      <div
        className="main-game"
        style={{
          gridTemplateColumns: this.props.isDrawerOpen
            ? '260px calc(100% - 610px) 350px'
            : 'calc(100% - 350px) 350px'
        }}
      >
        {((this.state.is_mobile && this.state.selectedMobileTab === 'chat') ||
          !this.state.is_mobile) && (
            <Drawer
              className="mat-chat"
              style={{ display: this.props.isDrawerOpen ? 'flex' : 'none' }}
              variant="persistent"
              anchor="left"
              open={isDrawerOpen}
            >
              <ChatPanel toggleDrawer={this.toggleDrawer}
                is_mobile={this.state.is_mobile} />
            </Drawer>
          )}
        {this.state.is_mobile &&
          this.state.selectedMobileTab === 'marketplace' && (
            // <Drawer
            //   className="mat-chat"
            //   style={{ display: this.props.isDrawerOpen ? 'flex' : 'none' }}
            //   variant="persistent"
            //   anchor="left"
            //   open={isDrawerOpen}
            // >
            <>
              <div style={{ padding: '30px' }}>
                <div style={{ textAlign: "center" }}>

                  <Button style={{ width: "100%", padding: "60px" }} onClick={this.toggleP2PLending}>
                    {this.state.showP2PLending ? '-' : '+'} <h2 className="modal-title title">
                      <FontAwesomeIcon icon={faCoins} className="mr-2" />
                      CENTRAL BANK
                    </h2>
                  </Button>
                  {this.state.showP2PLending && <BankPage />}
                </div>
                <div style={{ textAlign: "center" }}>

                  <Button style={{ width: "100%", padding: "60px" }} onClick={this.toggleMarketplace}>
                    {this.state.showMarketplace ? '-' : '+'}<h2 className="modal-title title">
                      <FontAwesomeIcon icon={faStore} className="mr-2" />
                      Marketplace
                    </h2>
                  </Button>
                  {this.state.showMarketplace && <ProductPage />}
                </div>
              </div>
            </>
            // </Drawer>
          )}
        {this.state.is_mobile &&
          (this.state.selectedMobileTab === 'live_games' ||
            this.state.selectedMobileTab === 'my_games') && (
            <Tabs
              value={this.state.show_open_game}
              onChange={this.showOpenGameOrHistory}
              TabIndicatorProps={{ style: { background: '#ff0000' } }}
              className="main-game-page-tabs"
            >
              <Tab
                label={
                  this.state.show_open_game === 0 &&
                    this.state.selectedMobileTab === 'live_games'
                    ? 'PVP'
                    : this.state.show_open_game === 0 &&
                      this.state.selectedMobileTab === 'my_games'
                      ? 'MANAGE'
                      : this.state.selectedMobileTab === 'live_games'
                        ? 'PVP'
                        : 'MANAGE'
                }
                icon={
                  this.state.show_open_game === 0 &&
                    this.state.selectedMobileTab === 'live_games' ? (
                    <BattleHover />
                  ) : this.state.show_open_game === 0 &&
                    this.state.selectedMobileTab === 'my_games' ? (
                    <ManageHover />
                  ) : this.state.selectedMobileTab === 'live_games' ? (
                    <Battle />
                  ) : (
                    <Manage />
                  )
                }
                style={customStyles.tabRoot}
              />
              <Tab
                label={
                  this.state.show_open_game === 1
                    ? this.state.selectedMobileTab === 'live_games'
                      ? 'History'
                      : 'Your History'
                    : 'History'
                }
                icon={
                  this.state.show_open_game === 1 ? (
                    <ShowHistoryHover />
                  ) : (
                    <ShowHistory />
                  )
                }
                style={customStyles.tabRoot}
              />
            </Tabs>
          )}
        <div className="main-panel">
          <h2 className="main-title">{this.getActiveTabText()}</h2>
          {((!this.state.is_mobile && this.props.selectedMainTabIndex === 0) ||
            (this.state.is_mobile &&
              this.state.selectedMobileTab === 'live_games' &&
              this.state.show_open_game === 0)) && (
              <>

                <OpenGamesTable
                  selectedCreator={this.state.selectedCreator}
                  refreshing={this.state.refreshing}
                  showPlayerModal={this.state.showPlayerModal}
                  handleRefresh={this.handleRefresh}
                  handleOpenPlayerModal={this.handleOpenPlayerModal}
                  handleClosePlayerModal={this.handleClosePlayerModal}
                  roomList={this.props.roomList}
                  isAuthenticated={this.props.isAuthenticated}
                  rooms_count={this.props.rooms_count}
                  pageNumber={this.props.pageNumber}
                  balance={this.props.balance}
                  onChangeGameType={this.onChangeGameType}
                  isDarkMode={this.props.isDarkMode}
                  selectedGameType={this.state.selectedGameType}
                  onlineUserList={this.props.onlineUserList}
                  gameTypeList={this.props.gameTypeList}
                />
                {this.state.is_mobile && (
                  <>
                    <h2 className="main-title">AI PANEL</h2>

                    <AiPanel user_id={this.props.user._id} />
                  </>
                )}
              </>

            )}
          {((!this.state.is_mobile && this.props.selectedMainTabIndex === 1) ||
            (this.state.is_mobile &&
              this.state.selectedMobileTab === 'my_games' &&
              this.state.show_open_game === 0)) && (
              <MyGamesTable gameTypeList={this.props.gameTypeList} />
            )}
          {this.state.is_mobile &&
            this.state.selectedMobileTab === 'live_games' &&
            this.state.show_open_game === 1 && <HistoryTable userId={this.props.user._id} />}
          {this.state.is_mobile &&
            this.state.selectedMobileTab === 'my_games' &&
            this.state.show_open_game === 1 && <MyHistoryTable />}
        </div>
        <div className="sub-panel">
          {/* {!this.state.is_mobile && (
            <>
              <h2 className="main-title desktop-only">JUKEBOX</h2>
              <JukeboxPanel isMusicEnabled={this.props.isMusicEnabled} />
            </>
          )} */}

          {!this.state.is_mobile && this.props.selectedMainTabIndex === 0 && (
            <>
              <h2 className="main-title desktop-only">AI PANEL</h2>
              <AiPanel user_id={this.props.user._id} />
            </>
          )}

          {!this.state.is_mobile && this.props.selectedMainTabIndex === 0 && (
            <>
              <h2 className="main-title desktop-only" style={{ marginBottom: "10px" }}>HISTORY</h2>
              <HistoryTable userId={this.props.user._id} />
            </>
          )}
          <DrawerButton
            open={this.props.isDrawerOpen}
            toggleDrawer={this.toggleDrawer}
          />
          <SupportButton
            open={this.props.isSupportOpen}
          // toggleDrawer={this.toggleDrawer}
          />
          {!this.state.is_mobile && this.props.selectedMainTabIndex === 1 && (
            <>
              <h2 className="main-title desktop-only">AI PANEL</h2>

              <AiPanel user_id={this.props.user._id} />
            </>
          )}
          {!this.state.is_mobile && this.props.selectedMainTabIndex === 1 && (
            <>
              <h2 className="main-title desktop-only" style={{ marginBottom: "10px" }}>YOUR HISTORY</h2>
              <MyHistoryTable />
            </>
          )}
        </div>
        {this.state.is_mobile && (
          <div className="mobile-only main-page-nav-button-group">
            <Button
              className={`mobile-tab-live ${this.state.selectedMobileTab === 'live_games' ? 'active' : ''
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
                    this.state.selectedMobileTab === 'live_games'
                      ? '#fff'
                      : '#8E9297'
                  }
                  strokeWidth="1.5"
                  d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
                />
              </svg>
              {this.state.selectedMobileTab === 'live_games' && 'LIVE BATTLES'}&nbsp;
            </Button>
            <Button
              className={`mobile-tab-my ${this.state.selectedMobileTab === 'my_games' ? 'active' : ''
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
                  stroke={
                    this.state.selectedMobileTab === 'my_games'
                      ? '#fff'
                      : '#8E9297'
                  }
                  strokeWidth="1.5"
                  d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
                />
                <path
                  fill={
                    this.state.selectedMobileTab === 'my_games'
                      ? '#fff'
                      : '#8E9297'
                  }
                  d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
                />
              </svg>
              {this.state.selectedMobileTab === 'my_games' && 'YOUR BATTLES'}&nbsp;
            </Button>
            <button
              className={`mobile-tab-marketplace ${this.state.selectedMobileTab === 'marketplace' ? 'active' : ''
                }`}
              onClick={e => {
                this.setState({ selectedMobileTab: 'marketplace' });
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* <rect width="32" height="32" rx="8" fill="#3A3F42"/> */}
                <path
                  d="M25 14L21.5 7L18 14H25Z"
                  fill={
                    this.state.selectedMobileTab === 'marketplace'
                      ? '#fff'
                      : '#8E9297'
                  }
                  stroke="#EEEEEC"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M7 18.25L13.75 25"
                  fill={
                    this.state.selectedMobileTab === 'marketplace'
                      ? '#fff'
                      : '#8E9297'
                  }
                  stroke="#ECEDEE"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M13.75 18.25L7 25"
                  fill={
                    this.state.selectedMobileTab === 'marketplace'
                      ? '#fff'
                      : '#8E9297'
                  }
                  stroke="#ECEDEE"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <rect
                  x="7"
                  y="7"
                  width="7"
                  height="7"
                  rx="1"
                  fill="#FFA7A7"
                  stroke="#ECEDEE"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <circle
                  cx="21.5"
                  cy="21.5"
                  r="3.5"
                  fill={
                    this.state.selectedMobileTab === 'marketplace'
                      ? '#fff'
                      : '#8E9297'
                  }
                  stroke="#ECEDEE"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>

              {this.state.selectedMobileTab === 'marketplace' && 'ASSETS'}&nbsp;
            </button>
            <Button
              className={`mobile-tab-chat ${this.state.selectedMobileTab === 'chat' ? 'active' : ''
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
                  stroke={
                    this.state.selectedMobileTab === 'chat' ? '#fff' : '#8E9297'
                  }
                  strokeWidth="1.5"
                  d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
                />
                <circle
                  cx="10.5"
                  cy="16"
                  r="2"
                  stroke={
                    this.state.selectedMobileTab === 'chat' ? '#fff' : '#8E9297'
                  }
                  strokeWidth="1.5"
                />
                <circle
                  cx="16.5"
                  cy="16"
                  r="2"
                  stroke={
                    this.state.selectedMobileTab === 'chat' ? '#fff' : '#8E9297'
                  }
                  strokeWidth="1.5"
                />
                <circle
                  cx="22.5"
                  cy="16"
                  r="2"
                  stroke={
                    this.state.selectedMobileTab === 'chat' ? '#fff' : '#8E9297'
                  }
                  strokeWidth="1.5"
                />
              </svg>
              {this.state.selectedMobileTab === 'chat' && 'CHAT'}&nbsp;
            </Button>
          </div>
        )}
        <Footer
          className="footer"
          open={this.props.isDrawerOpen}
          style={{ marginLeft: this.props.isDrawerOpen ? '270px' : '0' }}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  topWins: state.logic.topWins,
  topWithdrawals: state.logic.topWithdrawals,
  isAuthenticated: state.auth.isAuthenticated,
  roomList: state.logic.roomList,
  history: state.logic.history,
  roomCount: state.logic.roomCount,
  pageNumber: state.logic.pageNumber,
  balance: state.auth.balance,
  user: state.auth.user,
  isMusicEnabled: state.auth.isMusicEnabled,
  isLowGraphics: state.auth.isLowGraphics,
  isDarkMode: state.auth.isDarkMode,
  onlineUserList: state.logic.onlineUserList,
  isDrawerOpen: state.auth.isDrawerOpen,
  rooms_count: state.logic.rooms_count,
  gameTypeList: state.logic.gameTypeList,
  selectedMainTabIndex: state.logic.selectedMainTabIndex
});

const mapDispatchToProps = {
  getRoomList,
  getRoomCount,
  getHistory,
  getWins,
  getWithdrawals,
  setCurRoomInfo,
  getGameTypeList,
  clearRoomListCache,
  getMyChat,
  toggleDrawer
};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
