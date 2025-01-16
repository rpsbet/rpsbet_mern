import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Typography,
  Box
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Leaderboards from './Leaderboards';
import RoomHistory from './RoomHistory';
import Comments from './Comments';
import Moment from 'moment';
// import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { Skeleton } from '@material-ui/lab';
import Joyride from 'react-joyride';
import { tutorialStepsGame } from '../util/tutorialStepsGame';
import RPS from '../game_panel/JoinGame/RPS';
import QuickShoot from '../game_panel/JoinGame/QuickShoot';
import CoHostModal from '../game_panel/modal/CoHostModal';
import { getRank } from '../util/getRank';

function updateFromNow(history) {
  if (!history) return [];
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i].from_now = Moment(result[i].created_at).fromNow();
  }
  return result;
}

const styles = (theme) => ({
  activeTab: {
    color: (props) => (props.isDarkMode ? '#f9f9f9' : '#ff0000'),
    '& .MuiTab-wrapper': {
      color: '#ff0000',
    },
  },
  inactiveTab: {
    color: (props) => (props.isDarkMode ? '#aaa' : '#ccc'),
    '& .MuiTab-wrapper': {
      color: (props) => (props.isDarkMode ? '#aaa' : '#ccc'),
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
    color: (props) => (props.isDarkMode ? '#f9f9f9' : '#ff0000'),
  },
});

function TabbedContent(props) {
  const {
    classes,
    roomInfo,
    isLowGraphics,
    isDarkMode,
    solPrice,
    balance,
    user,
    has_joined,
    coHostAmount,
    handleCoHostAmountChange,
    handleSendCoHost,
    handleCloseCoHostModal,
    togglePopup,
    // Joyride / tutorial
    run,
    handleJoyrideCallback,
    // RPS / QuickShoot shared props:
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
    total_wagered,
    updateUserStrategy,
    actionList,
    getRoomData,
    qsbetitems,
    bet_amount,
    borderColor,
    updateSelectedQs,
    changeBgColorQs
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [selectedTab, setSelectedTab] = useState(0);
  const [numToShow, setNumToShow] = useState(10);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [roomHistory, setRoomHistory] = useState(
    updateFromNow(roomInfo.room_history || [])
  );
  const [activeTabs, setActiveTabs] = useState([0, 1]); // By default, tab "Play" (0) & "Chart" (1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 767);

  // In the class version, we had getDerivedStateFromProps. 
  // Here, we replicate that logic with a useEffect that listens to changes in `roomInfo`
  useEffect(() => {
    if (
      !roomHistory ||
      roomHistory.length === 0 ||
      (roomInfo?.room_history &&
        roomHistory[0]?.created_at !== roomInfo.room_history[0]?.created_at)
    ) {
      setRoomHistory(updateFromNow(roomInfo?.room_history || []));
    }
  }, [roomInfo.room_history]);

  // componentDidMount logic → attachUserLinkListeners & attachAccessories, add event listener
  useEffect(() => {
    attachUserLinkListeners();
    // attachAccessories();
    window.addEventListener('resize', handleResize);

    return () => {
      // componentWillUnmount logic
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // componentDidUpdate logic for roomInfo.room_history → re-run attach logic if it changes
  useEffect(() => {
    attachUserLinkListeners();
    // attachAccessories();
  }, [roomInfo.room_history]);

  // ------------------ HANDLERS ------------------
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 767);
  }, []);

  const attachUserLinkListeners = useCallback(() => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-userid');
        handleOpenPlayerModalLocal(userId);
      });
    });
  }, []);

  // const attachAccessories = useCallback(() => {
  //   const userLinks = document.querySelectorAll('.user-link');
  //   userLinks.forEach((element) => {
  //     const accessory = element.getAttribute('accessory');
  //     const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
  //     const portalContainer = document.createElement('div');
  //     ReactDOM.render(lottieAnimation, portalContainer);
  //     element.parentNode.insertBefore(portalContainer, element);
  //   });
  // }, [isLowGraphics]);

  const handleOpenPlayerModalLocal = useCallback((creator_id) => {
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModalLocal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    setNumToShow((prev) => prev + 10);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue);
  }, []);

  const handleCheckboxChange = useCallback((event, tabIndex) => {
    setActiveTabs((prevActiveTabs) => {
      const isActive = prevActiveTabs.includes(tabIndex);
      if (isActive) {
        return prevActiveTabs.filter((tab) => tab !== tabIndex);
      } else {
        return [...prevActiveTabs, tabIndex];
      }
    });
  }, []);

  // ------------------ RENDERERS ------------------
  const renderTabContent = (tabIndex) => {
    switch (tabIndex) {
      case 0: {
        // "Play" Tab
        if (!roomInfo || !roomInfo.game_type) {
          return (
            <div className="join-game-panel">
              <div className="game-page loading-skeleton">
                <div className="game-contents">
                  <Skeleton variant="rect" width="100%" height={60} />
                  <div
                    className="game-info-panel"
                    style={{ position: 'relative', zIndex: 10, paddingBottom: '90px' }}
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
                showPlayerModal={showPlayerModal}
                creator_id={roomInfo.creator_id}
                bet_amount={bet_amount}
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
                bet_amount={bet_amount}
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
      }

      case 1: {
        // "Chart" Tab (in your original code, it's labeled "CoHostModal" or something)
        return (
          <div>
            <CoHostModal
              isDarkMode={isDarkMode}
              coHostAmount={coHostAmount}
              selectedRow={roomInfo}
              balance={balance}
              user={user}
              togglePopup={togglePopup}
              handleClose={handleCloseCoHostModal}
              handleSendCoHost={handleSendCoHost}
              handleCoHostAmountChange={handleCoHostAmountChange}
              has_joined={has_joined}
              solPrice={solPrice}
              input_only={false}
            />
          </div>
        );
      }

      case 2: {
        // "History" Tab
        return (
          <RoomHistory
            roomId={roomInfo._id}
            getRoomInfo={props.getRoomInfo}
            roomInfo={roomInfo}
            isLowGraphics={isLowGraphics}
          />
        );
      }

      case 3: {
        // "Thread" Tab
        return (
          <div>
            <Comments roomId={roomInfo._id} />
          </div>
        );
      }

      case 4: {
        // "Insights" Tab
        return <Leaderboards roomId={roomInfo._id} />;
      }

      default:
        return null;
    }
  };

  // ------------------ RENDER ------------------
  if (isMobile) {
    // Mobile layout
    return (
      <div className="tabs-container">
        <Tabs
          TabIndicatorProps={{ style: { background: '#ff0000' } }}
          value={selectedTab}
          onChange={handleTabChange}
        >
          <Tab label="Chart" />
          <Tab label="History" />
          <Tab label="Thread" />
          <Tab label="Insights" />
        </Tabs>
        <div>
          {selectedTab === 0 && renderTabContent(0)}
          {selectedTab === 1 && renderTabContent(1)}
          {selectedTab === 2 && renderTabContent(2)}
          {selectedTab === 3 && renderTabContent(3)}
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
                onChange={(e) => handleCheckboxChange(e, index)}
                color="secondary"
              />
            }
            label={label}
          />
        ))}
      </div>

      <div className={classes.flexContainer}>
        {activeTabs.map((tabIndex) => (
          <div key={tabIndex} className={classes.column}>
            {renderTabContent(tabIndex)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default withStyles(styles)(TabbedContent);