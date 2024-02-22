import React, { Component } from 'react';
import { Tabs, Tab, Button, Typography, Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Leaderboards from './Leaderboards';
import Comments from './Comments';
import Moment from 'moment';
import PlayerModal from '../game_panel/modal/PlayerModal';
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import DescriptionIcon from '@material-ui/icons/Description';
import HistoryIcon from '@material-ui/icons/History';
import CommentIcon from '@material-ui/icons/Comment';
import BarChartIcon from '@material-ui/icons/BarChart';


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
    color: props => props.isdarkmode ? '#101010' : '#f9f9f9', // Red color for the tab label
    '& .MuiTab-wrapper': {
      color: '#ff0000',

    }
  },
});
class TabbedContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0,
      numToShow: 10,
      showPlayerModal: false,
      room_history: this.props.roomInfo.room_history
    };
    this.handleLoadMore = this.handleLoadMore.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      !current_state.room_history || // Check if room_history is undefined
      current_state.room_history.length === 0 ||
      (props.roomInfo.room_history &&
        current_state.room_history[0]['created_at'] !==
        props.roomInfo.room_history[0]['created_at'])
    ) {
      return {
        ...current_state,
        room_history: updateFromNow(props.roomInfo.room_history)
      };
    }
    return null;
  }

  async componentDidMount() {
    // this.updateReminderTime();
    // this.attachUserLinkListeners();
    // this.attachAccessories();
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
    userLinks.forEach(element => {
      const accessory = element.getAttribute('accessory');
      const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
      const portalContainer = document.createElement('div');
      ReactDOM.render(lottieAnimation, portalContainer);
      element.parentNode.insertBefore(portalContainer, element);
    });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.roomInfo.room_history !== this.props.roomInfo.room_history) {
      this.attachUserLinkListeners();
      this.attachAccessories();
    }
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleLoadMore = () => {
    this.setState(prevState => ({
      numToShow: prevState.numToShow + 10
    }));
  };

  handleTabChange = (event, newValue) => {
    this.setState({ selectedTab: newValue });
  };

  render() {
    const { selectedTab } = this.state;
    const { roomInfo, isLowGraphics, classes, isdarkmode } = this.props;

    return (
      <div>
        <Tabs
          TabIndicatorProps={{ style: { background: '#ff0000' } }}
          value={selectedTab}
          onChange={this.handleTabChange}
        >
          <Tab
            classes={{ selected: classes.activeTab }}
            icon={<DescriptionIcon />}
            label="Description"
          />
            <Tab
              classes={{ selected: classes.activeTab }}
              icon={<CommentIcon />}
              label="Comments"
            />
          <Tab
            classes={{ selected: classes.activeTab }}
            icon={<BarChartIcon />}
            label="Leaderboards"
          />
          <Tab
            classes={{ selected: classes.activeTab }}
            icon={<HistoryIcon />}
            label="History"
          />
        </Tabs>
        <div>
          {selectedTab === 0 && (
            <div className="room-leaderboards-panel">
              <h2 className="room-history-title">Description</h2>
              <div className="description-container" style={{ background: this.props.isDarkMode ? '#101010' : '#f9f9f9' }}>
      <p className="description-text"  style={{ color: this.props.isDarkMode ? '#f9f9f9' : '#010101' }}>
        {this.props.roomInfo.description}
      </p>
    </div>
            </div>
          )}

          {selectedTab === 3 && (
            <div className="room-history-panel">
              <h2 className="room-history-title">Battle History</h2>
              {roomInfo &&
                roomInfo.room_history &&
                roomInfo.room_history.length > 1 ? (
                <div className="table main-history-table">
                  {this.state.showPlayerModal && (
                    <PlayerModal
                      modalIsOpen={this.state.showPlayerModal}
                      closeModal={this.handleClosePlayerModal}
                      selectedCreator={this.state.selectedCreator}
                    // player_name={this.state.userName}
                    // balance={this.state.balance}
                    // avatar={this.props.user.avatar}
                    />
                  )}
                  {roomInfo.room_history
                    .slice(0, this.state.numToShow)
                    .map(
                      (row, key) => (
                        <div
                          className={`table-row ${key < 10 ? 'slide-in' : ''}`}
                          style={{ animationDelay: `${key * 0.1}s` }}
                          key={row._id}
                        >
                          {' '}
                          {renderLottieAvatarAnimation(row.gameBackground, isLowGraphics)}
                          <div>
                            <div className="table-cell">
                              <div className="room-id">{row.status}<div
                                className="mobile-only"
                                dangerouslySetInnerHTML={{ __html: row.history }}
                              ></div></div>
                              <div
                                className="desktop-only"
                                dangerouslySetInnerHTML={{
                                  __html: row.history
                                }}
                              ></div>
                            </div>
                            <div className="table-cell">
                              {Moment(row.created_at).fromNow()}{' '}
                            </div>

                          </div>
                          {key ===
                            roomInfo.room_history.length - 1 && (
                              <div ref={this.lastItemRef}></div>
                            )}
                        </div>
                      ),
                      this
                    )}
                  {this.state.numToShow <
                    roomInfo.room_history.length && (
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
                </div>
              ) : (
                <p>No History Yet</p>
              )}
            </div>
          )}
          {selectedTab === 1 && (
            <div className="room-leaderboards-panel">
              <h2 className="room-history-title">Comments</h2>

              <Comments
                roomId={roomInfo._id}
              />
            </div>
          )}
          {selectedTab === 2 && (
            <div className="room-leaderboards-panel">
              <h2 className="room-history-title">Leaderboards</h2>

              <Leaderboards
                actionList={this.props.actionList}
              />
            </div>
          )}

        </div>
      </div>
    );
  }
}

export default withStyles(styles)(TabbedContent);
