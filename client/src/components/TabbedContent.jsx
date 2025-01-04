import React, { Component } from 'react';
import { Tabs, Tab, Checkbox, FormControlLabel, Typography, Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Leaderboards from './Leaderboards';
import RoomHistory from './RoomHistory';
import Comments from './Comments';
import Moment from 'moment';
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { Skeleton } from "@material-ui/lab";
import Joyride from 'react-joyride';
import { tutorialStepsGame } from '../util/tutorialStepsGame';
import RPS from '../game_panel/JoinGame/RPS';
import QuickShoot from '../game_panel/JoinGame/QuickShoot';
import CoHostModal from '../game_panel/modal/CoHostModal';
import { getRank } from '../util/getRank';

function updateFromNow(history) {
  if (!history) {
    return [];
  }

  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

const styles = theme => ({
  activeTab: {
    color: props => (props.isDarkMode ? '#f9f9f9' : '#ff0000'),
    '& .MuiTab-wrapper': {
      color: '#ff0000',
    },
  },
  inactiveTab: {
    color: props => (props.isDarkMode ? '#aaa' : '#ccc'),
    '& .MuiTab-wrapper': {
      color: props => (props.isDarkMode ? '#aaa' : '#ccc'),
    },
  },
  flexContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  column: {
    flex: 1,
    minWidth: '100%',
  },
  checkboxContainer: {
    marginTop: '5px',
    display: 'flex',
    gap: '16px',
    marginBottom: '0',
  },
  checkbox: {
    color: props => (props.isDarkMode ? '#f9f9f9' : '#ff0000'),

  },
});

class TabbedContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0,
      numToShow: 10,
      showPlayerModal: false,
      room_history: this.props.roomInfo.room_history,
      activeTabs: [0, 1],
      isMobile: window.innerWidth < 767,
    };
    this.handleLoadMore = this.handleLoadMore.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    const { roomInfo } = props;
    if (
      !current_state.room_history ||
      current_state.room_history.length === 0 ||
      (roomInfo?.room_history &&
        current_state.room_history[0]?.created_at !== roomInfo.room_history[0]?.created_at)
    ) {
      return {
        ...current_state,
        room_history: updateFromNow(roomInfo?.room_history || []),
      };
    }
    return null;
  }

  componentDidMount() {
    this.attachUserLinkListeners();
    this.attachAccessories();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomInfo.room_history !== this.props.roomInfo.room_history) {
      this.attachUserLinkListeners();
      this.attachAccessories();
    }
  }

  handleResize = () => {
    this.setState({ isMobile: window.innerWidth < 767 });
  };

  attachUserLinkListeners = () => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach(link => {
      link.addEventListener('click', event => {
        const userId = event.target.getAttribute('data-userid');
        this.handleOpenPlayerModal(userId);
      });
    });
  };

  attachAccessories = () => {
    const { isLowGraphics } = this.props;
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach(element => {
      const accessory = element.getAttribute('accessory');
      const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
      const portalContainer = document.createElement('div');
      ReactDOM.render(lottieAnimation, portalContainer);
      element.parentNode.insertBefore(portalContainer, element);
    });
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleLoadMore = () => {
    this.setState(prevState => ({
      numToShow: prevState.numToShow + 10,
    }));
  };

  handleTabChange = (event, newValue) => {
    this.setState({ selectedTab: newValue });
  };

  handleCheckboxChange = (event, tabIndex) => {
    this.setState(prevState => {
      const isActive = prevState.activeTabs.includes(tabIndex);
      return {
        activeTabs: isActive
          ? prevState.activeTabs.filter(tab => tab !== tabIndex)
          : [...prevState.activeTabs, tabIndex],
      };
    });
  };

  renderTabContent(tabIndex) {
    const {
      roomInfo,
      isLowGraphics,
      selectedCreator,
      showPlayerModal,
      strategies,
      betting,
      result,
      attached,
      ai_mode,
      user_id,
      bankroll,
      betResult,
      bgColorChanged,
      playSound,
      changeBgColor,
      getAttachedRooms,
      handleDetachAttachChange,
      onChangeState,
      is_mobile,
      gameResult,
      handleJoyrideCallback,
      updateSelectedRps,
      rpsbetitems,
      refreshHistory,
      handleOpenPlayerModal,
      predictedBetAmount,
      handleClosePlayerModal,
      join,
      selected_qs_position,
      handleSwitchChange,
      cp,
      selected_rps,
      isDarkMode,
      total_wagered,
      updateUserStrategy,
      actionList,
      getRoomData,
      run,
      qsbetitems,
      solPrice,
      borderColor,
      updateSelectedQs,
      changeBgColorQs,
    } = this.props;

    switch (tabIndex) {
      case 0: // "Play" Tab
        if (!roomInfo || !roomInfo.game_type) {
          return (
            <div className="join-game-panel">
              <div className="game-page loading-skeleton">
                <div className="game-contents">
                  <Skeleton variant="rect" width="100%" height={60} />
                  <div
                    className="game-info-panel"
                    style={{ position: 'relative', zIndex: 10, paddingBottom: "90px" }}
                  >
                    <Skeleton variant="text" width="20%" height={30} />
                    <Skeleton variant="text" width="80%" height={30} />
                    <Skeleton variant="text" width="60%" height={100} />
                    <Skeleton variant="text" width="80%" height={30} />
                    <Skeleton variant="text" width="10%" height={90} />
                    <Skeleton variant="text" width="20%" height={90} />
                  </div>
                </div>
              </div>
            </div>
          );
        }
    
        return (
          <div className="join-game-panel">
            <Joyride
              steps={tutorialStepsGame}
              run={run}
              callback={handleJoyrideCallback}
              continuous
              showProgress
              showSkipButton
              styles={{
                options: {
                  zIndex: 10000,
                  backgroundColor: isDarkMode ? 'rgb(81 48 98 / 60%)' : '#ccc9',
                  primaryColor: '#ff0000',
                  arrowColor: isDarkMode ? 'rgb(81 48 98 / 60%)' : '#ccc9',
                  textColor: isDarkMode ? '#f9f9f9' : '#333',
                  width: 300,
                  padding: 20,
                  borderRadius: 5,
                },
                buttonClose: {
                  borderRadius: '0.3em',
                  color: isDarkMode ? '#f9f9f9' : '#333',
                },
                buttonBack: {
                  borderRadius: '0.3em',
                  color: isDarkMode ? '#f9f9f9' : '#333',
                },
                buttonNext: {
                  borderRadius: '0.3em',
                  color: isDarkMode ? '#f9f9f9' : '#333',
                },
                buttonSkip: {
                  borderRadius: '0.3em',
                  color: isDarkMode ? '#f9f9f9' : '#333',
                },
              }}
            />
    
            {roomInfo.game_type === 'RPS' ? (
              <RPS
                changeBgColor={changeBgColor}
                bgColorChanged={bgColorChanged}
                betting={betting}
                strategies={strategies}
                result={result}
                ai_mode={ai_mode}
                getAttachedRooms={getAttachedRooms}
                handleDetachAttachChange={handleDetachAttachChange}
                onChangeState={onChangeState}
                cp={cp}
                is_mobile={is_mobile}
                gameResult={gameResult}
                rpsbetitems={rpsbetitems}
                attached={attached}
                updateSelectedRps={updateSelectedRps}
                selected_rps={selected_rps}
                refreshHistory={refreshHistory}
                playSound={playSound}
                join={join}
                handleSwitchChange={handleSwitchChange}
                betResult={betResult}
                roomInfo={roomInfo}
                rps_game_type={roomInfo.rps_game_type}
                user_id={user_id}
                rank={getRank(total_wagered)}
                handleOpenPlayerModal={handleOpenPlayerModal}
                handleClosePlayerModal={handleClosePlayerModal}
                selectedCreator={selectedCreator}
                showPlayerModal={showPlayerModal}
                creator_id={roomInfo.creator_id}
                bet_amount={roomInfo.bet_amount}
                pr={roomInfo.pr}
                updateUserStrategy={updateUserStrategy}
                bankroll={bankroll}
                predictedBetAmount={predictedBetAmount}
                is_private={roomInfo.is_private}
                endgame_type={roomInfo.endgame_type}
                actionList={actionList}
                getRoomData={getRoomData}
              />
            ) : roomInfo.game_type === 'Quick Shoot' ? (
              <QuickShoot
                handleOpenPlayerModal={handleOpenPlayerModal}
                handleClosePlayerModal={handleClosePlayerModal}
                selectedCreator={selectedCreator}
                showPlayerModal={showPlayerModal}
                refreshHistory={refreshHistory}
                handleDetachAttachChange={handleDetachAttachChange}
                join={join}
                result={result}
                gameResult={gameResult}
                getAttachedRooms={getAttachedRooms}
                endgame_type={roomInfo.endgame_type}
                attached={attached}
                updateUserStrategy={updateUserStrategy}
                borderColor={borderColor}
                bgColorChanged={bgColorChanged}
                changeBgColor={changeBgColorQs}
                updateSelectedQs={updateSelectedQs}
                user_id={user_id}
                betResult={betResult}
                is_mobile={is_mobile}
                qsbetitems={qsbetitems}
                creator_id={roomInfo.creator_id}
                qs_game_type={roomInfo.qs_game_type}
                bankroll={bankroll}
                bet_amount={roomInfo.bet_amount}
                is_private={roomInfo.is_private}
                selected_qs_position={selected_qs_position}
                roomInfo={roomInfo}
                playSound={playSound}
                ai_mode={ai_mode}
                betting={betting}
                strategies={strategies}
                handleSwitchChange={handleSwitchChange}
                pr={roomInfo.pr}
                onChangeState={onChangeState}
                cp={cp}
                actionList={actionList}
                getRoomData={getRoomData}
              />
            ) : (
              <div>Unsupported game type.</div>
            )}
          </div>
        );
      case 1:
        return (
          <div>
            <CoHostModal
              isDarkMode={this.props.isDarkMode}
              coHostAmount={this.props.coHostAmount}
              selectedRow={roomInfo}
              balance={this.props.balance}
              user={this.props.user}
              togglePopup={this.togglePopup}
              handleClose={this.handleCloseCoHostModal}
              handleSendCoHost={this.props.handleSendCoHost}
              handleCoHostAmountChange={this.props.handleCoHostAmountChange}
              has_joined={this.props.has_joined}
              solPrice={solPrice}
              input_only={false}
            />
          </div>
        );
      case 2:
        return <RoomHistory roomId={roomInfo._id} getRoomInfo={this.props.getRoomInfo} roomInfo={roomInfo} isLowGraphics={isLowGraphics} />;
      case 3:
        return (
          <div>
            <Comments roomId={roomInfo._id} />
          </div>
        );
      case 4:
        return <Leaderboards roomId={roomInfo._id} />;
      default:
        return null;
    }
  }

  render() {
    const { selectedTab, activeTabs, isMobile } = this.state;
    const { classes } = this.props;

    if (isMobile) {
      return (
        <div className='tabs-container'>
          <Tabs
            TabIndicatorProps={{ style: { background: '#ff0000' } }}
            value={selectedTab}
            onChange={this.handleTabChange}
          >
            <Tab label="Chart" />
            <Tab label="History" />
            <Tab label="Thread" />
            <Tab label="Insights" />
          </Tabs>
          <div>
            {selectedTab === 0 && this.renderTabContent(0)}
            {selectedTab === 1 && this.renderTabContent(1)}
            {selectedTab === 2 && this.renderTabContent(2)}
            {selectedTab === 3 && this.renderTabContent(3)}
          </div>
        </div>
      );
    }

    // Desktop view with checkboxes
    return (
      <div>
        <div className={classes.checkboxContainer}>
          {['Play', 'Chart', 'History', 'Thread', 'Insights'].map((label, index) => (
            <FormControlLabel
              key={index}
              className={classes.checkbox}
              control={
                <Checkbox
                  checked={activeTabs.includes(index)}
                  onChange={e => this.handleCheckboxChange(e, index)}
                  color="secondary"
                />
              }
              label={label}
            />
          ))}
        </div>

        <div className={classes.flexContainer}>
          {activeTabs.map(tabIndex => (
            <div key={tabIndex} className={classes.column}>
              {this.renderTabContent(tabIndex)}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(TabbedContent);