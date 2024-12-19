import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getHistory } from '../../redux/Logic/logic.actions';
import Moment from 'moment';
import { getSettings } from '../../redux/Setting/setting.action';
import { convertToCurrency } from '../../util/conversion';
import { Skeleton } from "@material-ui/lab";
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartBroken, faStopwatch, faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';

import FileCopyIcon from '@material-ui/icons/FileCopy';
import {
  Tooltip
} from '@material-ui/core';
import PlayerModal from '../modal/PlayerModal';

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

    const { room_id } = newLog;

    if (!room_id) {
      console.warn("No room_id found in new log data:", newLog);
      return;
    }

    if (this.props.setHighlightedRooms) {
      this.props.setHighlightedRooms(new Set([room_id]));

      setTimeout(() => {
        if (this.isComponentMounted) {
          this.props.setHighlightedRooms(new Set());
        }
      }, 4000);
    }

    this.setState((prevState) => {
      const updatedHistory = [newLog, ...prevState.history.slice(0, 29)];
      const finalHistory = updateFromNow(updatedHistory);

      return { history: finalHistory };
    });
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

  componentDidUpdate(prevProps, prevState) {

    if (prevProps.history !== this.props.history) {
      this.attachUserLinkListeners();
      this.attachAccessories();
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
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  render() {
    const { isLowGraphics } = this.props;
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
        <div className="table main-history-table">
          {this.state.history?.length === 0 && (
            <div className="dont-have-game-msg">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {/* Skeleton Loader */}
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} variant="rect" width="100%" height={70} />
                ))}
              </div>
            </div>
          )}
          {uniqueHistory.map(
            (row, key) => (
              <div
                className={`table-row ${(row.creator?._id === this.props.userId || row.joined_user === this.props.userId) ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''}`}
                style={{
                  animationDelay: `${key * 0.1}s`,
                  filter: row.status !== 'open' ? 'opacity(60%)' : 'none'
                }}
                key={row._id}
              >
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
                      )}
                    </div>
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
          <div className="table-gradient"></div>
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
