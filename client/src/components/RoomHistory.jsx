// RoomHistory.js

import React from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';
import RefreshIcon from '@material-ui/icons/Refresh';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { Button, IconButton } from '@material-ui/core'; // Import Button from Material-UI
import ReactDOM from 'react-dom';


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


class RoomHistory extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;

    this.state = {
      history: this.props.roomInfo.room_history,
      showPlayerModal: false,
      selectedCreator: null,
      numToShow: 10000,
    }
    this.isComponentMounted = false;
  }


  async componentDidMount() {
    this.isComponentMounted = true;
    this.attachUserLinkListeners();
    this.attachAccessories();
    this.setupSocketConnection();
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    clearInterval(this.interval);
    this.disconnectSocket();
  }

  setupSocketConnection = () => {
    const { socket } = this.props;

    if (socket) {
      socket.on('NEW_LOG', this.handleNewLog);
    } else {
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
    if (!this.isComponentMounted) return;

    const newLog = data.newLog?.[0];
    if (!newLog) {
      console.warn("No valid log data received.");
      return;
    }

    const { _id, status, hosts, qbot, ai_mode, room_id, history, created_at, creator, joined_user } = newLog;

    if (!room_id) {
      console.warn("No room_id found in new log data:", newLog);
      return;
    }

    // Validate or sanitize newLog.history
    let newHistoryItem = history; // Assuming `history` is a string or valid object
    if (typeof history === "string") {
      newHistoryItem = { history, room_id, _id, ai_mode, qbot, status, created_at, hosts, creator, joined_user }; // Wrap it into an object if needed
    }

    this.setState(
      (prevState) => {
        // Add the new history item and retain only the latest 30 entries
        const updatedHistory = [newHistoryItem, ...prevState.history.slice(0, 29)];

        return { history: updatedHistory };
      },
      () => {
        // Callback after state update
        if (this.isComponentMounted) {
          this.attachUserLinkListeners();
          this.attachAccessories();
        }
      }
    );
  };

  retrySocketConnection = () => {
    setTimeout(() => {
      const { socket } = this.props;
      if (socket) {
        socket.on('NEW_LOG', this.handleNewLog);
      } else {
        this.retrySocketConnection();
      }
    }, 1000);
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
    let counter = 0;
    userLinks.forEach(element => {
      if (counter < 3) {
        const userId = element.getAttribute('data-userid');
        const accessory = element.getAttribute('accessory');
        const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
        const portalContainer = document.createElement('div');
        ReactDOM.render(lottieAnimation, portalContainer);
        element.parentNode.insertBefore(portalContainer, element);

        portalContainer.addEventListener('click', () => {
          this.handleOpenPlayerModal(userId);
        });
        portalContainer.style.cursor = 'pointer';
        counter++;
      } else {
        return;
      }
    });
  };

  handleOpenPlayerModal = (creator_id) => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleLoadMore = async () => {
    try {
      const { getRoomInfo, roomId } = this.props;
      const { numToShow } = this.state;

      const newNumToShow = numToShow + 10;

      await getRoomInfo(roomId, newNumToShow, true);
      this.setState({ numToShow: newNumToShow });
    } catch (error) {
      console.error('Error loading more data:', error);
    }
  };

  handleRefresh = async () => {
    try {
      const { getRoomInfo, roomId } = this.props;
      const { numToShow } = this.state;

      await getRoomInfo(roomId, numToShow, true);

    } catch (error) {
      console.error('Error loading more data:', error);
    }
  };


  render() {
    const { roomInfo, isLowGraphics, loading, userId } = this.props;
    const { showPlayerModal, selectedCreator, numToShow, history } = this.state;

    return (
      <div className="room-history-panel">
        {/* <div className="refresh-button refresh-main">
          <IconButton color="primary" onClick={this.handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </div> */}
        {roomInfo && roomInfo.room_history && roomInfo.room_history.length > 1 ? (
          <div className="table main-history-table">
            {showPlayerModal && (
              <PlayerModal
                modalIsOpen={showPlayerModal}
                closeModal={this.handleClosePlayerModal}
                selectedCreator={selectedCreator}
              />
            )}
            {(history || [])
              .slice(0, numToShow)
              .map((row, key) => (
                <div
                  className={`table-row ${(row.joined_user === userId) ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''}`}
                  style={{ animationDelay: `${key * 0.1}s`, padding: '10px' }}
                  key={row._id}
                >
                  <div className="table-cell">
                    <div className="room-id">{row.status}</div>
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
                      className="mobile-only"
                      dangerouslySetInnerHTML={{ __html: row.history }}
                    ></div>
                    <div
                      className="desktop-only"
                      dangerouslySetInnerHTML={{ __html: row.history }}
                    ></div>
                  </div>
                  <div className="table-cell">{Moment(row.created_at).fromNow()}</div>
                  {key === roomInfo.room_history.length - 1 && <div ref={this.lastItemRef}></div>}
                </div>
              ))}
            {numToShow < roomInfo.totalGameLogsCount && (
              <>
                {loading ? (
                  <div className='loading-spinner'>

                  </div>
                ) : (
                  <div className="load-more-btn">
                    <Button
                      id="load-btn"
                      variant="contained"
                      color="primary"
                      onClick={this.handleLoadMore}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <p>No History Yet</p>
        )}
      </div>
    );
  }
}


const mapStateToProps = state => ({
  loading: state.logic.isActiveLoadingOverlay,
  userId: state.auth.user._id,
  socket: state.auth.socket,

});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(RoomHistory);
