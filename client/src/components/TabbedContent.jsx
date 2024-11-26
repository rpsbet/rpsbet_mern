import React, { Component } from 'react';
import { Tabs, Tab, Button, Typography, Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Leaderboards from './Leaderboards';
import RoomHistory from './RoomHistory';
import Comments from './Comments';
import Moment from 'moment';
import PlayerModal from '../game_panel/modal/PlayerModal';
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import DescriptionIcon from '@material-ui/icons/Description';
import HistoryIcon from '@material-ui/icons/History';
import CommentIcon from '@material-ui/icons/Comment';
import BarChartIcon from '@material-ui/icons/BarChart';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import CoHostModal from '../game_panel/modal/CoHostModal';

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
    color: props => props.isDarkMode ? '#f9f9f9' : '#ff0000',
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
    this.attachUserLinkListeners();
    this.attachAccessories();
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
    const { selectedTab, coHostAmount } = this.state;
    const { roomInfo, isLowGraphics, classes, isDarkMode } = this.props;

    return (
      <div className='tabs-container'>
        <Tabs
          TabIndicatorProps={{ style: { background: '#ff0000' } }}
          value={selectedTab}
          onChange={this.handleTabChange}
        >
          <Tab
            classes={{ selected: classes.activeTab }}
            icon={<SwapHorizIcon />} // Updated to SwapHorizIcon
            label="Trade" // Updated label
          />
          <Tab
            classes={{ selected: classes.activeTab }}
            icon={<HistoryIcon />}
            label="History"
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
        </Tabs>
        <div>
          {selectedTab === 0 && (
            <div className="room-leaderboards-panel">

              <h2 className="room-history-title">Chart & Trading</h2>
              <div className="description-container" style={{ background: isDarkMode ? 'linear-gradient(45deg,  rgb(119 0 255), rgba(40, 40, 40, 0.15))' : 'linear-gradient(45deg, #d81719, #f3f3f326)' }}>
                <Typography
                  variant="body2"
                  className="description-text"
                  style={{
                    color: this.props.isDarkMode ? "#f9f9f9" : "#010101",
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                    {this.props.roomInfo.description ? (
                      this.props.roomInfo.description.split(",").map((tag, index) => (
                        <a
                          key={index}
                          href={`https://twitter.com/search?q=%23${tag.trim()}`} // Twitter search URL with the tag
                          target="_blank" // Open in a new tab
                          rel="noopener noreferrer" // Security for opening in a new tab
                          style={{
                            backgroundColor: this.props.isDarkMode ? "#333" : "#e0e0e0",
                            color: this.props.isDarkMode ? "#f9f9f9" : "#010101",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            display: "inline-block",
                            textDecoration: "none", // Remove underline
                          }}
                        >
                          #{tag.trim()} {/* Add the # symbol before each tag */}
                        </a>
                      ))
                    ) : (
                      <span>No tags available</span> // Optional fallback message
                    )}
                  </div>
                </Typography>
              </div>
              <CoHostModal
                isDarkMode={this.props.isDarkMode}
                coHostAmount={this.props.coHostAmount}
                selectedRow={this.props.roomInfo}
                balance={this.props.balance}
                user={this.props.user}
                togglePopup={this.togglePopup}
                handleClose={this.handleCloseCoHostModal}
                handleSendCoHost={this.props.handleSendCoHost}
                handleCoHostAmountChange={this.props.handleCoHostAmountChange}
                has_joined={this.props.has_joined}
              />
            </div>
          )}

          {selectedTab === 1 && (
            <RoomHistory roomId={roomInfo._id} getRoomInfo={this.props.getRoomInfo} roomInfo={roomInfo} isLowGraphics={isLowGraphics} />
          )}
          {selectedTab === 2 && (
            <div className='room-leaderboards-panel '>
              <h2 className="room-history-title">Comments</h2>
              <div className="glass-container" style={{ padding: "30px", marginTop: "20px" }}>

                <Comments
                  roomId={roomInfo._id}
                />
              </div>
            </div>

          )}
          {selectedTab === 3 && (
            <div className="room-leaderboards-panel">
              <h2 className="room-history-title">Leaderboards</h2>

              <Leaderboards roomId={roomInfo._id}
              />
            </div>
          )}

        </div>
      </div>
    );
  }
}

export default withStyles(styles)(TabbedContent);
