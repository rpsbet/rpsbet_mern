import React, { Component } from 'react';
import { Tabs, Tab, Button, Typography, Box } from '@material-ui/core';
import ShowHistory from '../game_panel/icons/ShowHistory';
import ShowHistoryHover from '../game_panel/icons/ShowHistoryHover';
import ChatHover from '../game_panel/icons/ChatHover';
import ChatRoomHover from '../game_panel/icons/ChatRoomHover';
import Leaderboards from '../game_panel/main_pages/Leaderboards';
import Moment from 'moment';
import PlayerModal from '../game_panel/modal/PlayerModal';

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

  componentDidUpdate(prevProps) {
    if (prevProps.roomInfo.room_history !== this.props.roomInfo.room_history) {
      this.attachUserLinkListeners();

    }
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleLoadMore() {
    this.setState({
      numToShow: this.state.numToShow + 10
    });
  }
  handleTabChange = (event, newValue) => {
    this.setState({ selectedTab: newValue });
  };

  render() {
    const { selectedTab } = this.state;
    // console.log("hi" , this.props.roomInfo)
    return (
      <div>
        <Tabs
          TabIndicatorProps={{ style: { background: '#ff0000' } }}
          value={selectedTab}
          onChange={this.handleTabChange}
        >
          <Tab
            //  icon={
            //   this.state.selectedTab === 0 ? (
            //     <ShowHistoryHover />
            //   ) : (
            //     <ShowHistory />
            //   )
            // }
            label="History"
          />
          {/* <Tab label="Chat" /> */}
          <Tab label="Leaderboards" />
          {/* <Tab label="Players" /> */}
        </Tabs>
        <div>
          {selectedTab === 0 && (
            <div className="room-history-panel">
              <h2 className="room-history-title">Battle History</h2>
              {this.props.roomInfo &&
              this.props.roomInfo.room_history &&
              this.props.roomInfo.room_history.length > 0 ? (
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
                  {this.props.roomInfo.room_history
                    .slice(0, this.state.numToShow)
                    .map((row, key) => (
                      <div className="table-row" key={'history' + row._id}>
                        <div>
                          <div className="table-cell">
                            <div className="room-id">{row.room_name}</div>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: row.history
                              }}
                            ></div>
                          </div>
                          <div className="table-cell">
                            {' '}
                            {Moment(row.created_at).fromNow()}{' '}
                          </div>
                        </div>
                        {key ===
                          this.props.roomInfo.room_history.length - 1 && (
                          <div ref={this.lastItemRef}></div>
                        )}
                      </div>
                    ))}
                  {this.state.numToShow <
                    this.props.roomInfo.room_history.length && (
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
            <div>
              <Leaderboards
                actionList={this.props.actionList}
                getRoomInfo={this.props.roomInfo._id}
                getRoomData={this.props.getRoomData}
              />
            </div>
          )}
          {selectedTab === 2 && (
            <div>
              COMING SOON
              {/* Render Comments component */}
            </div>
          )}
          {selectedTab === 3 && (
            <div>
              COMING SOON
              {/* Render Players Online component */}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TabbedContent;
