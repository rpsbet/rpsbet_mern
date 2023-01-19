import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
// import { setUserInfo, getUser } from '../../redux/Auth/user.actions';
import { acGetCustomerInfo, getCustomerStatisticsData } from '../../redux/Customer/customer.action';
// import { alertModal } from './ConfirmAlerts';
import Avatar from '../../components/Avatar';

// import ReactApexChart from 'react-apexcharts';
// import styled from 'styled-components';
// import Elevation from '../../Styles/Elevation';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
// import {
//   updateDigitToPoint2,  
//   addCurrencySignal
// } from '../../util/helper';
// import moment from 'moment';
import './Modals.css';
// import { convertToCurrency } from '../../util/conversion';


Modal.setAppElement('#root')


// function generateData(gameLogList) {
//   const series = [];
//   let totalProfit = 0;
//   gameLogList && gameLogList.forEach((log, index) => {
//     totalProfit += log.profit;
//     series.push({ x: `${Number(index) + 1}`, y: totalProfit })
//   })
//   return series;
// }

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
        this._isMounted = true;
        this.cancel = false;
        this.state = {
          _id: props._id || '',
        username: props.username || '',
            avatar: this.props.avatar,
            // joined_date: this.props.userInfo.joined_date,
        }
    }
    updateSelectedRow(selectedRow) {
      this.setState({selectedRow});
    }

    async componentDidMount() {
      if (this.cancel) return;
  
      const result = await this.props.getCustomerStatisticsData(this.state._id)
      this.setState({
        ...result
      })
          // console.log(this.state.username);
    }

    handleAvatarLoaded = (filename) => {
        console.log(filename)
        // this.props.setUserInfo({ ...this.props.userInfo, avatar: filename });
    }

   

    handleCloseModal = () => {
    // this.props.getUser(true);
    this.props.closeModal();
}

    
  // dataPointSelection = async (event, chartContext, config) => {
  //   console.log(this.props.gameLogList[config.dataPointIndex]);
  //   const gameLogList = this.props.gameLogList;
  //   const room_id = gameLogList[config.dataPointIndex].room_id;
  //   const actionList = await this.props.getRoomStatisticsData(room_id);
  //   this.setState({
  //     room_info: {
  //       room_name: gameLogList[config.dataPointIndex].game_id,
  //       actionList: actionList
  //     }
  //   });
  // };
  componentWillUnmount() {
    this.cancel = true;
    this._isMounted = false;
    console.log("PlayerModal component unmounting");
    
}
  

componentDidUpdate(prevProps, prevState){
    if(prevProps.selectedRow && prevProps.selectedRow !== this.props.selectedRow){
      console.log(prevProps.selectedRow);
    }
  }


    render() {
        // const gameLogList = this.props.gameLogList;
        // const series = [{ name: 'Jan', data: generateData(gameLogList) }];
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
                    <div className='align-center'>
                    <Avatar
                      src={this.state.avatar ? this.state.avatar : '/img/profile-thumbnail.svg'}
                      alt=""
                    />
                    </div>
                    <div className="user-statistics">
                      <StatisticsForm
                        username={this.state.username}
                        joined_date={this.state.joined_date}
                        gameLogList={this.state.gameLogList}
                        deposit={this.state.deposit}
                        withdraw={this.state.withdraw}
                        gameProfit={this.state.gameProfit}
                        balance={this.state.balance}
                        gamePlayed={this.state.gamePlayed}
                        totalWagered={this.state.totalWagered}
                        netProfit={this.state.netProfit}
                        profitAllTimeHigh={this.state.profitAllTimeHigh}
                        profitAllTimeLow={this.state.profitAllTimeLow}
                        getRoomStatisticsData={this.props.getRoomStatisticsData}
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
    // userInfo: state.auth.user,
    // creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
    // setUserInfo,
    // changePasswordAndAvatar,
    // getUser,
    getCustomerStatisticsData,
    acGetCustomerInfo
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PlayerModal);



// const ChartDivEl = styled.div`
//   grid-area: Charts;
//   justify-self: center;
//   width: 100%;
//   border-radius: 5px;
//   background-color: #424242;
//   padding: 25px;
//   align-items: center;
//   ${Elevation[2]}
// `;

// const H2 = styled.h2`
//   border-bottom: 3px solid white;
// `;

// const Span = styled.span`
//   font-size: 14px;
//   float: right;
//   margin-top: 18px;
// `;

// const ChartEl = styled(ReactApexChart)``;