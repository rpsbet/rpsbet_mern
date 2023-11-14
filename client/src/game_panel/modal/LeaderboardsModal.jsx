import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { fetchLeaderboardsData } from '../../redux/Customer/customer.action';
import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import { convertToCurrency } from '../../util/conversion';
import {
  Button,
  Table,
  TableHead,
  Paper,
  TableRow,
  TableCell,
  TableBody
} from '@material-ui/core';
import { Sort } from '@material-ui/icons';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },

  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0
  }
};

const styles = theme => ({
  root: {
    width: '150px',
    padding: '8px 15px',
    fontSize: '16px',
    background: '#191a1d'
  },
  dropdownStyle: {}
});

class LeaderboardsModal extends Component {
  state = {
    sortField: 'totalProfit',
    sortOrder: 'desc',
    showPlayerModal: false,
    selectedCreator: ''
  };

 

  async componentDidMount() {
    await this.props.fetchLeaderboardsData()
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleSort = field => {
    this.setState(prevState => ({
      sortField: field,
      sortOrder:
        prevState.sortField === field
          ? prevState.sortOrder === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc'
    }));
  };

  render() {
    const {
      sortField,
      sortOrder,
      isLoading,
      showPlayerModal,
      selectedCreator
    } = this.state;
    const { leaderboards, isDarkMode, loading } = this.props;
    
    // Sort the leaderboards data based on current sorting options
    const sortedLeaderboards = [...leaderboards].sort((a, b) => {
      const aValue = a[this.state.sortField];
      const bValue = b[this.state.sortField];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Leaderboards Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">Leaderboards</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={this.handleClosePlayerModal}
              // {...this.state.selectedRow}
            />
          )}
          <div className="modal-body edit-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
              {!loading ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => this.handleSort('username')}>
                        PLAYER {sortField === 'username' && <Sort />}
                      </TableCell>
                      <TableCell
                        onClick={() => this.handleSort('totalWagered')}
                      >
                        TOTAL WAGERED {sortField === 'totalWagered' && <Sort />}
                      </TableCell>
                      <TableCell onClick={() => this.handleSort('totalProfit')}>
                        NET PROFIT {sortField === 'totalProfit' && <Sort />}
                      </TableCell>
                      <TableCell
                        onClick={() => this.handleSort('profitAllTimeHigh')}
                      >
                        ALL-TIME-HIGH (ATH){' '}
                        {sortField === 'profitAllTimeHigh' && <Sort />}
                      </TableCell>
                      <TableCell
                        onClick={() => this.handleSort('profitAllTimeLow')}
                      >
                        ALL-TIME-LOW (ATL){' '}
                        {sortField === 'profitAllTimeLow' && <Sort />}
                      </TableCell>
                      <TableCell onClick={() => this.handleSort('gamePlayed')}>
                        GAMES PLAYED {sortField === 'gamePlayed' && <Sort />}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedLeaderboards.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {' '}
                          <a
                            className="player"
                            onClick={() =>
                              this.handleOpenPlayerModal(entry._id)
                            }
                          >
                            <Avatar
                              className="avatar"
                              src={entry.avatar}
                              rank={entry.totalWagered}
                              alt=""
                              darkMode={isDarkMode}
                            />
                            {entry.username}
                          </a>
                          {/* <i
                        className={`online-status${
                          this.props.onlineUserList.filter(
                            user => user === row.creator_id
                          ).length > 0
                            ? ' online'
                            : ''
                        }`}
                      ></i> */}
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(entry.totalWagered)}
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(entry.totalProfit)}
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(entry.profitAllTimeHigh)}
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(entry.profitAllTimeLow)}
                        </TableCell>
                        <TableCell>
                          {entry.gamePlayed}
                        </TableCell>{' '}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                
<LinearProgress color='secondary' />
              )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
  leaderboards: state.customerReducer.leaderboards,
  loading: state.customerReducer.loading,

});

const mapDispatchToProps = {
  fetchLeaderboardsData
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(LeaderboardsModal));
