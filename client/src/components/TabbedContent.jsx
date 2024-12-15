import React, { Component } from 'react';
import { Tabs, Tab, Checkbox, FormControlLabel, Typography, Box } from '@material-ui/core';
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
    minWidth: '300px',
  },
  checkboxContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
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
      activeTabs: [], // Keep track of active (checked) tabs
      isMobile: window.innerWidth < 767, // Determine if the view is mobile
    };
    this.handleLoadMore = this.handleLoadMore.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      !current_state.room_history ||
      current_state.room_history.length === 0 ||
      (props.roomInfo.room_history &&
        current_state.room_history[0]['created_at'] !==
        props.roomInfo.room_history[0]['created_at'])
    ) {
      return {
        ...current_state,
        room_history: updateFromNow(props.roomInfo.room_history),
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
    const { roomInfo, isLowGraphics } = this.props;

    switch (tabIndex) {
      case 0:
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
            />
          </div>
        );
      case 1:
        return <RoomHistory roomId={roomInfo._id} getRoomInfo={this.props.getRoomInfo} roomInfo={roomInfo} isLowGraphics={isLowGraphics} />;
      case 2:
        return (
          <div>
            <Comments roomId={roomInfo._id} />
          </div>
        );
      case 3:
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
            <Tab label="Trade" />
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
          {['Trade', 'History', 'Thread', 'Insights'].map((label, index) => (
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