import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import {
  setChatRoomInfo,
  addNewTransaction
} from '../../redux/Logic/logic.actions';
import history from '../../redux/history';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@material-ui/core';
import { Warning } from '@material-ui/icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { convertToCurrency } from '../../util/conversion';

import { faMoneyBill } from '@fortawesome/free-solid-svg-icons'; // Replace with the appropriate icon
import { alertModal } from '../modal/ConfirmAlerts';
import axios from '../../util/Api';

import {
  acGetCustomerInfo,
  getCustomerStatisticsData
} from '../../redux/Customer/customer.action';
import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import './Modals.css';

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

class PlayerModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      _id: props.selectedCreator || '',
      username: '',
      avatar: '',
      accessory: '',
      selectedCreatorBalance: '',
      rank: '',
      isLoading: false,
      myChat: [],
      actorType: 'Both',
      message: '',
      gameType: 'All',
      timeType: '7',
      isTipModalOpen: false,
      tipAmount: '',
      balance: props.balance
    };
  }

  handleMessage = event => {
    this.setState({ message: event.target.value });
  };

  handleTip = () => {
    this.setState({ isTipModalOpen: true });
  };

  handleCloseTipModal = () => {
    this.setState({ isTipModalOpen: false });
  };

  handleTipAmountChange = event => {
    this.setState({ tipAmount: event.target.value });
  };

  handleSendTip = async () => {
    try {
      if (this.state.tipAmount < 0) {
        alertModal(
          this.props.isDarkMode,
          `TIP AMOUNT MUST BE MORE THAN 0 ETH DUMBASS`
        );
        return;
      }

      if (this.state.tipAmount > this.props.balance) {
        alertModal(this.props.isDarkMode, `TRY LATER BROKIE`);
        return;
      }

      this.setState({ isLoading: true });
      const result = await axios.post('/game/tip/', {
        amount: this.state.tipAmount,
        addressTo: this.state._id,
        message: this.state.message
      });

      if (result.data.success) {
        alertModal(this.props.isDarkMode, result.data.message);
        this.props.setBalance(result.data.balance);
        this.props.addNewTransaction(result.data.newTransaction);
        this.setState({ isLoading: false });
        this.props.closeModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, result.data.message);
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.amount <= 0) {
        alertModal(this.props.isDarkMode, `Failed transaction.`);
        return;
      }
    }
  };

  async componentDidMount() {
    await this.fetchStatisticsData();
  }

  fetchStatisticsData = async () => {
    const { _id, actorType, gameType, timeType } = this.state;
    const result = await this.props.getCustomerStatisticsData(
      _id,
      actorType,
      gameType,
      timeType
    );
    const userData = await this.props.acGetCustomerInfo(
      this.props.selectedCreator
    );

    this.setState({
      ...result,
      username: userData.username,
      avatar: userData.avatar,
      accessory: userData.accessory,
      rank: userData.totalWagered,
      dateJoined: userData.created_at
    });
  };

  handleOpenChat = e => {
    const selectedCreator = this.props.selectedCreator;
    const chatExists = this.state.myChat.find(
      chat => chat._id === selectedCreator
    );

    if (!chatExists) {
      const newChatRoom = {
        _id: selectedCreator,
        username: e.target.getAttribute('username'),
        avatar: e.target.getAttribute('avatar'),
        accessory: e.target.getAttribute('accessory'),
        rank: e.target.getAttribute('totalWagered'),
        chatLogs: []
      };
      this.setState(prevState => ({
        myChat: [...prevState.myChat, newChatRoom]
      }));
      this.props.setChatRoomInfo(newChatRoom);
      history.push('/chat/' + selectedCreator);
    } else {
      // Handle case where chat exists
      this.props.setChatRoomInfo({
        avatar: e.target.getAttribute('avatar'),
        rank: e.target.getAttribute('totalWagered'),
        accessory: e.target.getAttribute('accessory'),
        username: e.target.getAttribute('username'),
        chatLogs: chatExists.chatLogs
      });
      history.push('/chat/' + selectedCreator);
    }
  };

  handleDropdownChange = (dropdownName, selectedValue) => {
    this.setState(
      {
        [dropdownName]: selectedValue
      },
      async () => {
        await this.fetchStatisticsData();
      }
    );
  };

  handleCloseModal = () => {
    this.props.closeModal();
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps._id !== this.props._id) {
      this.setState({ isLoading: false });
      this.props
        .getCustomerStatisticsData(nextProps._id)
        .then(result => this.setState({ ...result }));
    }
  }

  render() {
    const { isLoading } = this.state;
    const { loading } = this.props;
    return (
      <>
        {isLoading && (
          <LoadingOverlay
            active={isLoading}
            spinner
            text="Sending Tip..."
            styles={{
              wrapper: {
                position: 'fixed',
                width: '100%',
                top: '0',
                left: '0',
                height: '100vh',
                zIndex: '99'
              }
            }}
          />
        )}
        {!isLoading && (
          <Modal
            isOpen={this.props.modalIsOpen}
            onRequestClose={this.handleCloseModal}
            style={customStyles}
            contentLabel="Player Modal"
          >
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
              <div className="modal-header">
                <h2 className="modal-title">Player Card</h2>
                <Button className="btn-close" onClick={this.handleCloseModal}>
                  ×
                </Button>
              </div>
              <div className="modal-body edit-modal-body">
                <div className="align-center">
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <div className='avatar-border'>
                    <Avatar
                      src={
                        this.state.avatar
                          ? this.state.avatar
                          : '/img/profile-thumbnail.svg'
                      }
                      accessory={this.state.accessory}
                      rank={this.state.rank}
                      alt=""
                    />
                    </div>
                  )}
                </div>
                {loading ? null : (
                  <div className="user-statistics">
                    <StatisticsForm
                      onDropdownChange={this.handleDropdownChange}
                      username={this.state.username}
                      dateJoined={this.state.dateJoined}
                      gameLogList={this.state.gameLogList}
                      deposit={this.state.deposit}
                      withdraw={this.state.withdraw}
                      gameProfit={this.state.gameProfit}
                      balance={this.state.balance}
                      gamePlayed={this.state.gamePlayed}
                      gameHosted={this.state.gameHosted}
                      gameJoined={this.state.gameJoined}
                      totalWagered={this.state.totalWagered}
                      rank={this.state.rank}
                      netProfit={this.state.netProfit}
                      profitAllTimeHigh={this.state.profitAllTimeHigh}
                      profitAllTimeLow={this.state.profitAllTimeLow}
                      averageWager={this.state.averageWager}
                      averageGamesPlayedPerRoom={
                        this.state.averageGamesPlayedPerRoom
                      }
                      averageProfit={this.state.averageProfit}
                    />
                  </div>
                )}
              </div>
              {this.props.userInfo._id !== this.state._id ? (
                <div className="modal-footer">
                  <Button className="tip-button" onClick={this.handleTip}>
                    Tip&nbsp;
                    <FontAwesomeIcon icon={faMoneyBill} />
                  </Button>
                  <Button className="send-msg" onClick={this.handleOpenChat}>
                    Send Message
                  </Button>
                </div>
              ) : null}
            </div>
            <Modal
              isOpen={this.state.isTipModalOpen}
              onRequestClose={this.handleCloseTipModal}
              style={customStyles}
              contentLabel="Tip Modal"
            >
              <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                <div className="modal-header">
                  <h2>ENTER TIP AMOUNT</h2>
                </div>
                <div className="modal-body">
                  <div className="modal-content-wrapper">
                    <div className="modal-content-panel">
                      <div className="input-amount">
                        <TextField
                          label="Amount"
                          value={this.state.tipAmount}
                          onChange={this.handleTipAmountChange}
                          pattern="^\\d*\\.?\\d*$"
                          variant="outlined"
                          autoComplete="off"
                          InputProps={{
                            endAdornment: 'ETH'
                          }}
                          className="form-control"
                        />
                      </div>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <span>IN-GAME BALANCE:</span>
                            </TableCell>
                            <TableCell>
                              {convertToCurrency(this.props.balance)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <span>TIP AMOUNT:</span>
                            </TableCell>
                            <TableCell style={{ color: 'red' }}>
                              {convertToCurrency(this.state.tipAmount * -1)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <span>NEW BALANCE:</span>
                            </TableCell>
                            <TableCell>
                              {convertToCurrency(
                                this.props.balance - this.state.tipAmount
                              )}
                              &nbsp;
                              {this.props.balance - this.state.tipAmount <
                                0 && <Warning width="15pt" />}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <div className="input-amount">
                        <Typography>Add Message?</Typography>
                        <TextField
                          label="Message"
                          value={this.state.message}
                          onChange={this.handleMessage}
                          variant="outlined"
                          autoComplete="off"
                          className="form-control"
                          inputProps={{ maxLength: 8 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <Button className="btn-submit" onClick={this.handleSendTip}>
                    Send Tip
                  </Button>
                  <Button
                    className="btn-back"
                    onClick={this.handleCloseTipModal}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          </Modal>
        )}
      </>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  myChat: state.logic.myChat,
  loading: state.logic.isActiveLoadingOverlay,
  userInfo: state.auth.user,
  balance: state.auth.balance
});

const mapDispatchToProps = {
  getCustomerStatisticsData,
  acGetCustomerInfo,
  setChatRoomInfo,
  setBalance,
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayerModal);
