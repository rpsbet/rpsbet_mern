import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { setUserInfo, changePasswordAndAvatar, getUser } from '../../redux/Auth/user.actions';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import { alertModal } from './ConfirmAlerts';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import Elevation from '../../Styles/Elevation';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import {
  updateDigitToPoint2,  
  addCurrencySignal
} from '../../util/helper';
import moment from 'moment';
import './Modals.css';
import { convertToCurrency } from '../../util/conversion';


Modal.setAppElement('#root')


function generateData(gameLogList) {
  const series = [];
  let totalProfit = 0;
  gameLogList && gameLogList.forEach((log, index) => {
    totalProfit += log.profit;
    series.push({ x: `${Number(index) + 1}`, y: totalProfit })
  })
  return series;
}

const customStyles = {
    overlay: {
        zIndex: 3,
        backgroundColor: 'rgba(47, 49, 54, 0.2)',
        backdropFilter: 'blur(4px)'
    },
    content: {
        top         : '50%',
        left        : '50%',
        right       : 'auto',
        bottom      : 'auto',
        transform   : 'translate(-50%, -50%)',
        background: 'transparent',
        padding: 0,
        border: 0
    }
}

class PlayerModal extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
            _id: this.props.userInfo._id,
            username: this.props.userInfo.username,
            avatar: this.props.userInfo.avatar,
            joined_date: this.props.userInfo.joined_date,
        }
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.avatar !== props.avatar || current_state.username !== props.username || current_state.email !== props.email ) {
            return {
                ...current_state,
                avatar: props.userInfo.avatar,
                username: props.userInfo.username,
                email: props.userInfo.email,
            };
        }
        return null;
    }

    async componentDidMount() {
      const result = await this.props.getCustomerStatisticsData(this.state._id)
      this.setState({
        ...result
      })
    }

    handleAvatarLoaded = (filename) => {
        console.log(filename)
        this.props.setUserInfo({ ...this.props.userInfo, avatar: filename });
    }

   

    handleCloseModal = () => {
    this.props.getUser(true);
    this.props.closeModal();
}

    
  dataPointSelection = async (event, chartContext, config) => {
    console.log(this.props.gameLogList[config.dataPointIndex]);
    const gameLogList = this.props.gameLogList;
    const room_id = gameLogList[config.dataPointIndex].room_id;
    const actionList = await this.props.getRoomStatisticsData(room_id);
    this.setState({
      room_info: {
        room_name: gameLogList[config.dataPointIndex].game_id,
        actionList: actionList
      }
    });
  };

    render() {
        const gameLogList = this.props.gameLogList;
        const series = [{ name: 'Jan', data: generateData(gameLogList) }];
        return <Modal
            isOpen={this.props.modalIsOpen}
            onRequestClose={this.handleCloseModal}
            style={customStyles}
            contentLabel="Player Modal"
        >
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                <div className="modal-body edit-modal-body">
                    <button className="btn-close" onClick={this.handleCloseModal}>×</button>
                    <h2 className="modal-title">Player Profile</h2>
                    <div className="user-statistics">
                      <StatisticsForm
                        username={this.state.player_name}
                        joined_date={this.state.joined_date}
                        // gameLogList={this.state.gameLogList}
                        // deposit={this.state.deposit}
                        // withdraw={this.state.withdraw}
                        // gameProfit={this.state.gameProfit}
                        // balance={this.state.balance}
                        // gamePlayed={this.state.gamePlayed}
                        // totalWagered={this.state.totalWagered}
                        // netProfit={this.state.netProfit}
                        // profitAllTimeHigh={this.state.profitAllTimeHigh}
                        // profitAllTimeLow={this.state.profitAllTimeLow}
                        // getRoomStatisticsData={this.props.getRoomStatisticsData}
                      />
                    </div>
                    <div className="modal-action-panel">
                        <button className="btn-submit" onClick={this.handleCloseModal}>Done</button>
                    </div>
                </div>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
    isDarkMode: state.auth.isDarkMode,
    userInfo: state.auth.user,
    creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
    setUserInfo,
    changePasswordAndAvatar,
    getUser,
    getCustomerStatisticsData
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PlayerModal);



const ChartDivEl = styled.div`
  grid-area: Charts;
  justify-self: center;
  width: 100%;
  border-radius: 5px;
  background-color: #424242;
  padding: 25px;
  align-items: center;
  ${Elevation[2]}
`;

const H2 = styled.h2`
  border-bottom: 3px solid white;
`;

const Span = styled.span`
  font-size: 14px;
  float: right;
  margin-top: 18px;
`;

const ChartEl = styled(ReactApexChart)``;