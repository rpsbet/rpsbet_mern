import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getHistory } from '../../redux/Logic/logic.actions';
import Moment from 'moment';
import { getSettings } from '../../redux/Setting/setting.action';
import { convertToCurrency } from '../../util/conversion';
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartBroken, faStopwatch, faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';

import FileCopyIcon from '@material-ui/icons/FileCopy';
import {
  Tooltip
} from '@material-ui/core';
import BetArray from '../../components/BetArray';
import CountUp from 'react-countup';
import InlineSVG from 'react-inlinesvg';
import busdSvg from '../JoinGame/busd.svg';
import PlayerModal from '../modal/PlayerModal';
import Lottie from 'react-lottie';
import rain from '../LottieAnimations/rain.json';
import waves from '../LottieAnimations/waves.json';
import hex from '../LottieAnimations/hex.json';

Moment.relativeTimeThreshold('s', 10); // seconds
Moment.relativeTimeThreshold('m', 60); // minutes
Moment.relativeTimeThreshold('h', 24); // hours
Moment.relativeTimeThreshold('d', 30); // days
Moment.relativeTimeThreshold('M', 12); // months


// Define a custom function to format the time duration
function customFromNow(date) {
  const now = Moment();
  const duration = Moment.duration(now.diff(date));

  if (duration.asSeconds() < 60) {
    return `${Math.round(duration.asSeconds())}s ago`;
  } else if (duration.asMinutes() < 60) {
    return `${Math.round(duration.asMinutes())}m ago`;
  } else if (duration.asHours() < 24) {
    return `${Math.round(duration.asHours())}h ago`;
  } else {
    return `${Math.round(duration.asDays())}d ago`;
  }
}

function updateFromNow(history) {
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = customFromNow(Moment(result[i]['created_at']));
  }
  return result;
}

class HistoryTable extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;

    this.state = {
      history: this.props.history,
      showPlayerModal: false,
      rain: 0,
      copiedRowId: null

    };
    this.isComponentMounted = false;
  }


  async componentDidMount() {
    this.isComponentMounted = true;

    // Attach listeners and fetch initial data
    this.attachUserLinkListeners();
    this.attachAccessories();

    try {
      const settings = await this.props.getSettings();
      if (this.isComponentMounted) {
        this.setState({ ...settings });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }

    try {
      await this.props.getHistory();
    } catch (error) {
      console.error("Error fetching history:", error);
    }

    this.setupSocketConnection();
  }


  componentWillUnmount() {
    this.isComponentMounted = false;
    // Clear any intervals and clean up socket connections
    clearInterval(this.interval);
    this.disconnectSocket();
  }
  
  setupSocketConnection = () => {
    const { socket } = this.props;

    if (socket) {
      socket.on('NEW_LOG', this.handleNewLog);
    } else {
      // console.error('Socket is null or undefined. Retrying in 5 seconds...');
      this.retrySocketConnection();
    }
  }

  disconnectSocket = () => {
    const { socket } = this.props;
    if (socket) {
      socket.off('NEW_LOG', this.handleNewLog);
    }
  }

  handleNewLog = (data) => {
    if (!this.isComponentMounted) return; // Ensure the component is still mounted

    const newLog = data.newLog?.[0]; // Use optional chaining for safer access

    if (!newLog) {
      console.warn("No valid log data received.");
      return;
    }

    const { room_id } = newLog;

    if (!room_id) {
      console.warn("No room_id found in new log data:", newLog);
      return;
    }

    // Highlight the room
    if (this.props.setHighlightedRooms) {
      this.props.setHighlightedRooms(new Set([room_id]));

      // Clear highlight after a timeout
      setTimeout(() => {
        if (this.isComponentMounted) { // Ensure component is still mounted
          this.props.setHighlightedRooms(new Set());
        }
      }, 4000);
    }

    // Update the component's state
    this.setState((prevState) => {
      const updatedHistory = [newLog, ...prevState.history.slice(0, 29)]; // Prepend newLog, limit to 30 entries
      const finalHistory = updateFromNow(updatedHistory);

      return { history: finalHistory };
    }, () => {
      // Safely call these methods after the state update
      if (this.isComponentMounted) {
        this.attachUserLinkListeners();
        this.attachAccessories();
      }
    });
  };

  retrySocketConnection = () => {
    setTimeout(() => {
      const { socket } = this.props;
      if (socket) {
        socket.on('NEW_LOG', this.handleNewLog);
      } else {
        this.retrySocketConnection(); // Retry again if socket is still null
      }
    }, 1000); // Retry after  seconds
  }

  // static getDerivedStateFromProps(props, current_state) {
  //   if (
  //     current_state.history?.length === 0 ||
  //     (props.history &&
  //       current_state.history[0]['created_at'] !==
  //       props.history[0]['created_at'])
  //   ) {
  //     return {
  //       ...current_state,
  //       history: updateFromNow(props.history)
  //     };
  //   }
  //   return null;
  // }

  componentDidUpdate(prevProps, prevState) {

    if (prevProps.history !== this.props.history) {
      this.setState({ history: updateFromNow(this.props.history) });
    }
  }



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
    let counter = 0; // Counter variable to track the number of items processed
    userLinks.forEach(element => {
      if (counter < 3) { // Process only the first 3 items
        const userId = element.getAttribute('data-userid'); // Get userId from the user-link element
        const accessory = element.getAttribute('accessory');
        const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
        const portalContainer = document.createElement('div');
        ReactDOM.render(lottieAnimation, portalContainer);
        element.parentNode.insertBefore(portalContainer, element);

        // Attach click event listener to the accessory element
        portalContainer.addEventListener('click', () => {
          this.handleOpenPlayerModal(userId);
        });
        portalContainer.style.cursor = 'pointer';
        counter++; // Increment the counter
      } else {
        return; // Exit the loop once the first 5 items are processed
      }
    });
  };


  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  updateReminderTime = () => {
    this.setState({ history: updateFromNow(this.state.history) });
  };

  copyToClipboard = (rowId) => {
    navigator.clipboard.writeText(rowId)
      .then(() => {
        this.setState({ copiedRowId: rowId });
        setTimeout(() => {
          this.setState({ copiedRowId: null });
        }, 1500); // Reset the copied row after 1.5 seconds
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };


  // handleGameTypeButtonClicked = async short_name => {
  //   this.setState({ selectedGameType: short_name });
  //   this.props.getHistory({
  //     game_type: short_name
  //   });
  // };

  // handleBtnLeftClicked = e => {
  //   const scrollAmount = 200; // Change this value to adjust the scroll amount
  //   this.game_type_panel.scrollLeft -= scrollAmount;
  // };

  // handleBtnRightClicked = e => {
  //   const scrollAmount = 200; // Change this value to adjust the scroll amount
  //   this.game_type_panel.scrollLeft += scrollAmount;
  // };

  // generateGameTypePanel = () => {
  //   const gameTypeStyleClass = {
  //     RPS: 'rps',
  //     'S!': 'spleesh',
  //     MB: 'mystery-box',
  //     BG: 'brain-game',
  //     QS: 'quick-shoot',
  //     DG: 'drop-game',
  //     'B!': 'bang',
  //     R: 'roll'
  //   };

  //   const gameTypePanel = (
  //     <Box
  //       display="flex"
  //       justifyContent="space-evenly"
  //       flexWrap="nowrap"
  //       gap="15px"
  //     >
  //       <Box key="open-game-left-button">
  //         <IconButton
  //           className="btn-arrow-left"
  //           onClick={this.handleBtnLeftClicked}
  //         >
  //           <ChevronLeftIcon />
  //         </IconButton>
  //       </Box>
  //       <Button
  //         className={`btn-game-type title btn-icon all-games ${
  //           this.state.selectedGameType === 'All' ? 'active' : ''
  //         }`}
  //         key="open-game-all-game-button"
  //         onClick={() => {
  //           this.handleGameTypeButtonClicked('All');
  //         }}
  //       >
  //         All Games
  //       </Button>
  //       {this.props.gameTypeList.map((gameType, index) => (
  //         <Button
  //           className={`btn-game-type title btn-icon ${
  //             gameTypeStyleClass[gameType.short_name]
  //           } ${
  //             this.state.selectedGameType === gameType.short_name
  //               ? 'active'
  //               : ''
  //           }`}
  //           key={index}
  //           onClick={() => {
  //             this.handleGameTypeButtonClicked(gameType.short_name);
  //           }}
  //         >
  //           {gameType.game_type_name}
  //         </Button>
  //       ))}
  //       <Box key="open-game-right-button">
  //         <IconButton
  //           className="btn-arrow-right"
  //           onClick={this.handleBtnRightClicked}
  //         >
  //           <ChevronRightIcon />
  //         </IconButton>
  //       </Box>
  //     </Box>
  //   );

  //   return gameTypePanel;
  // };

  render() {
    const { isLowGraphics } = this.props;
    // const gameTypePanel = this.generateGameTypePanel();
    const HeartIcon = ({ isOpen }) => {
      const icon = isOpen ? faHeart : faHeartBroken;

      return <FontAwesomeIcon icon={icon} />;
    };
    const uniqueHistory = this.state.history.filter((row, index, self) =>
      index === self.findIndex((t) => (
        t._id === row._id
      ))
    );

    return (
      <div className="overflowX">
        {/* <div className="outer-div">
          <div className="border-mask" />
          
          <Lottie
            options={{
              loop: isLowGraphics ? false: true,
              autoplay: isLowGraphics ? false: true,
              animationData: hex
            }}
            style={{
              width: '142px',
              height: '100%',
              overflow: 'hidden',
              margin: '-2px 0px -136px',
              outline: 'none',
              filter: 'grayscale(100%)',
              maxWidth: '100%'
            }}
          />
         
          <InlineSVG
            className="rain"
            id="busd"
            src={busdSvg}
          />
          <CountUp
            end={this.state.rain}
            start={this.state.prevRain}
            duration={2}
            separator=","
            decimals={6}
          >
            {({ countUpRef, start }) => (
              <h1
                id="rain"
                ref={countUpRef}
                style={{
                  color: '#fff',
                  fontSize: '1em',
                  position: 'relative',
                  display: 'inline-block',
                  zIndex: '1',
                  textShadow: '0 0 4px #0058b6'
                }}
              />
            )}
          </CountUp>
          <span
            style={{
              color: '#fff',
              position: 'relative',
              zIndex: '1',
              fontSize: '0.6em',
              paddingLeft: '10px',
              textShadow: '0 0 12px #0058b6'
            }}
          >
            / 10.00 (NEXT BIG GIVEAWAY EVENT)
          </span>
        </div> */}
        {/* <div className="game-type-container">
          <div
            className="game-type-panel"
            ref={elem => {
              this.game_type_panel = elem;
            }}
          >
            {gameTypePanel}
          </div>
        </div> */}
        <div className="table main-history-table">
          {this.state.history?.length === 0 && (
            <div className="dont-have-game-msg">
              <div>NO HISTORY YET</div>
            </div>
          )}
          {uniqueHistory.map(
            (row, key) => (

              <div
                className={`table-row ${(row.creator?._id === this.props.userId || row.joined_user === this.props.userId) ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''}`}
                style={{
                  animationDelay: `${key * 0.1}s`,
                  filter: row.status !== 'open' ? 'opacity(60%)' : 'none'  // Apply grayscale filter if status is "open"
                }}
                key={row._id}
              >
                {' '}
                {/* {renderLottieAvatarAnimation(row.gameBackground, isLowGraphics)} */}
                <div>
                  <div className="table-cell">
                    <div className="room-id">
                      {row.status === 'open' ? (
                        <>
                          {row.status}  <HeartIcon isOpen={true} />
                        </>
                      ) : row.room_name === 'Withdrawal' ? (
                        <>
                          MONEY OUT <FontAwesomeIcon icon={faArrowCircleDown} />
                        </>
                      ) : (
                        <>
                          finished  <HeartIcon isOpen={false} />
                        </>
                      )}                    </div>
                    {row.ai_mode && (
                      <div id="ai_mode">
                        <span className="room-id ai_mode">
                          {row.ai_mode}
                        </span>
                        {row.qbot && (<>
                          <span className="room-id qbot">
                            Q-BOT
                          </span>
                        </>)}
                      </div>

                    )}

                    <div
                      className="desktop-only"
                      dangerouslySetInnerHTML={{ __html: row.history }}
                    ></div>
                  </div>
                  <div className="table-cell">
                    {row.from_now && row.from_now.split('').map((char, index) => (
                      <span key={index} style={{ fontSize: isNaN(char) ? '0.5em' : '0.8em' }}>{char}</span>
                    ))}
                    &nbsp;<FontAwesomeIcon icon={faStopwatch} />
                  </div>
                  <div className="table-cell row-copy">

                    <Tooltip title={this.state.copiedRowId === row._id ? "COPIED ID!" : "COPY BET ID"} placement="top">
                      <a style={{ padding: "5px", cursor: "pointer" }} onClick={() => this.copyToClipboard(row._id)}>
                        <FileCopyIcon style={{ width: "12px" }} />
                      </a>
                    </Tooltip>

                  </div>
                </div>

                <div>
                  <div
                    className="table-cell mobile-only"
                    dangerouslySetInnerHTML={{ __html: row.history }}
                  ></div>
                </div>
              </div>
            ),
            this
          )}
          <div
            className="table-gradient"
          ></div>
        </div>
        {this.state.showPlayerModal && (
          <PlayerModal
            modalIsOpen={this.state.showPlayerModal}
            closeModal={this.handleClosePlayerModal}
            selectedCreator={this.state.selectedCreator}
          />
        )}

      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  history: state.logic.history,
  pageNumber: state.logic.historyPageNumber,
  totalPage: state.logic.historyTotalPage,
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics
  // gameTypeList: state.logic.gameTypeList
});

const mapDispatchToProps = {
  getHistory,
  getSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(HistoryTable);
