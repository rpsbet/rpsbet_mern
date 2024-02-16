import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import styled from 'styled-components';
import { renderLottieAnimation } from '../../util/LottieAnimations';

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
  Typography,
  LinearProgress
} from '@material-ui/core';
import { Warning } from '@material-ui/icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { convertToCurrency } from '../../util/conversion';

import { faMoneyBill, faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons'; // Replace with the appropriate icon
import { alertModal } from '../modal/ConfirmAlerts';
import axios from '../../util/Api';

import {
  acGetCustomerInfo,
  getCustomerStatisticsData
} from '../../redux/Customer/customer.action';
import {
  queryProducts
} from '../../redux/Item/item.action';
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
const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;
const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #303438, #ffb000);
  border-radius: 20px;
  padding: 10px;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  cursor: pointer;
  -webkit-transition: -webkit-transform 0.2s;
  -webkit-transition: transform 0.2s;
  transition: transform 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.03);
  }
`;
const ProductImage = styled.img`
  max-width: 50%;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 17px #333;
  border-radius: 10px;
`;

const ProductInfo = styled.div`
  text-align: center;
`;

const ProductName = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5p;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.00938em;
  background: linear-gradient(354deg, #ffdd0775, #494e54);
  width: 100%;
  border: 1px soli#9c0c0c;
  border-radius: 23%;
  text-shadow: 2px -2px 4px #f3b01b;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #28a74524, -1px 2px #dabf1475;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
`;

const LinearContainer = styled.div`
  width: 80%;
  max-width: 1200px;
  margin: 20px 0;
`;

const CommissionPower = styled.span`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 30px;
  height: 30px;
  background: #28a745;
  border-radius: 10px;
  box-shadow: inset 0px -1px 11px #005b15;
  color: #fff;
  font-weight: 500;
  text-align: center;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;


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
      productArray: [],
      isTipModalOpen: false,
      tipAmount: '',
      balance: props.balance,
      actorType: 'Both',
      gameType: 'All',
      timeType: '7',
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
          `R U FURR-REAL? TIP AMOUNT MUST BE MORE THAN 0!`
        );
        return;
      }

      if (this.state.tipAmount > this.props.balance) {
        alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
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
    await this.props.queryProducts(127, 1, this.state._id);
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
    // console.log(userData)

    this.setState({
      ...result,
      username: userData.username,
      avatar: userData.avatar,
      accessory: userData.accessory,
      rank: userData.totalWagered,
      dateJoined: userData.created_at,
      creditScore: userData.credit_score,
      actorType: actorType,
      gameType: gameType,
      timeType: timeType,
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
    const { loading, productArray, isLowGraphics } = this.props;
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
                <h2 className="modal-title">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />

                  Player Card</h2>
                <Button className="btn-close" onClick={this.handleCloseModal}>
                  ×
                </Button>
              </div>
              <div className="modal-body profile edit-modal-body">
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
                      actorType={this.state.actorType}
                      gameType={this.state.gameType}
                      timeType={this.state.timeType}
                      dateJoined={this.state.dateJoined}
                      last_seen={this.state.last_seen}
                      creditScore={this.state.creditScore}
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

                <MarketplaceContainer>
                  <h5>INVENTORY</h5>
                  {!loading ? (
                    <ProductGrid>


                      {productArray.map(row => (
                        <ProductCard
                          key={row._id}

                        >
                          {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                            renderLottieAnimation(row.image, isLowGraphics)
                          ) : (
                            <ProductImage src={row.image} alt={row.productName} />
                          )}
                          {row.item_type === '653ee81117c9f5ee2124564b' ? (
                            <CommissionPower>{row.CP}</CommissionPower>
                          ) : (
                            ''
                          )}

                          <ProductInfo>
                            <ProductName>{row.productName}</ProductName>

                          </ProductInfo>


                        </ProductCard>
                      ))}
                    </ProductGrid>
                  ) : (
                    <LinearContainer>
                      <LinearProgress color="secondary" />
                    </LinearContainer>
                  )}
                </MarketplaceContainer>
              </div>
              {this.props.userInfo._id !== this.state._id ? (
                <div className="modal-footer">
                  <Button className="tip-button" onClick={this.handleTip}>
                    Tip&nbsp;
                    <FontAwesomeIcon icon={faMoneyBill} />
                  </Button>
                  <Button className="send-msg" onClick={this.handleOpenChat}>
                    Message&nbsp;
                    <FontAwesomeIcon icon={faEnvelope} />
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
                  <h2 className="modal-title">
                    <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />

                    ENTER TIP AMOUNT</h2>
                  <Button className="btn-close" onClick={this.handleCloseModal}>
                    ×
                  </Button>
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
  balance: state.auth.balance,
  productArray: state.itemReducer.productArray,
  isLowGraphics: state.auth.isLowGraphics

});

const mapDispatchToProps = {
  getCustomerStatisticsData,
  acGetCustomerInfo,
  setChatRoomInfo,
  setBalance,
  queryProducts,
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayerModal);
