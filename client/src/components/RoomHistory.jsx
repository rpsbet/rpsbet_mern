// RoomHistory.js

import React from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';
import RefreshIcon from '@material-ui/icons/Refresh';

import PlayerModal from '../game_panel/modal/PlayerModal';
import { Button, IconButton } from '@material-ui/core'; // Import Button from Material-UI

class RoomHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showPlayerModal: false,
      selectedCreator: null,
      numToShow: 10, // Add numToShow state for Load More
    };
  }
 
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
    const { roomInfo, isLowGraphics, loading } = this.props;
    const { showPlayerModal, selectedCreator, numToShow } = this.state;

    return (
      <div className="room-history-panel">
        <h2 className="room-history-title">Battle History</h2>
        <div className="refresh-button">
          <IconButton color="primary" onClick={this.handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </div>
        {roomInfo && roomInfo.room_history && roomInfo.room_history.length > 1 ? (
          <div className="table main-history-table">
            {showPlayerModal && (
              <PlayerModal
                modalIsOpen={showPlayerModal}
                closeModal={this.handleClosePlayerModal}
                selectedCreator={selectedCreator}
              />
            )}
            {roomInfo.room_history
              .slice(0, numToShow)
              .map((row, key) => (
                <div className={`table-row ${key < 10 ? 'slide-in' : ''}`} key={row._id}>
                  <div>
                    <div className="table-cell">
                      <div className="room-id">{row.status}</div>
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
                  </div>
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
});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(RoomHistory);
