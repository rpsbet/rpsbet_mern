import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import AvatarUpload from './upload/AvatarUpload';
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
        backgroundColor: 'rgba(47, 49, 54, 0.8)',
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

class ProfileModal extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
            _id: this.props.userInfo._id,
            username: this.props.userInfo.username,
            email: this.props.userInfo.email,
            password: '',
            passwordConfirmation: '',
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

    handleChangePassword = (e) => {
        e.preventDefault();
        this.setState({ password: e.target.value });
    }

    handleChangePasswordConfirmation = (e) => {
        e.preventDefault();
        this.setState({ passwordConfirmation: e.target.value });
    }

    saveUserInfo = async (e) => {
        e.preventDefault();
        if (this.state.password !== this.state.passwordConfirmation) {
            alertModal(this.props.isDarkMode, `Password confirmation doesn't match the password.`);
            return;
        }

        const is_success = await this.props.changePasswordAndAvatar(this.state.password, this.state.avatar);
        if (is_success) {
            this.props.closeModal();
        }
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
            contentLabel="Profile Modal"
        >
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                <div className="modal-body edit-modal-body">
                    <button className="btn-close" onClick={this.handleCloseModal}>×</button>
                    <h2 className="modal-title">Your Profile</h2>
                    <div className="edit-avatar-panel">
                        <AvatarUpload setImageFilename={this.handleAvatarLoaded} darkMode={this.props.isDarkMode} avatar={this.state.avatar} />
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
                    <div className="modal-edit-panel">
                        <div>
                            <p>USERNAME</p>
                            <input className="form-control" value={this.state.username} readOnly />
                        </div>
                        <div>
                            <p>EMAIL</p>
                            <input className="form-control" value={this.state.email} readOnly />
                        </div>    
                        <div>
                            <p>NEW PASSWORD</p>
                            <input type="password" className="form-control" value={this.state.password} onChange={this.handleChangePassword} />
                        </div>
                        <div>
                            <p>PASSWORD CONFIRMATION</p>
                            <input type="password" className="form-control" value={this.state.passwordConfirmation} onChange={this.handleChangePasswordConfirmation} />
                        </div>    
                    </div>
                    <div className="modal-action-panel">
                        <button className="btn-submit" onClick={this.saveUserInfo}>Save</button>
                    </div>
                </div>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
    isDarkMode: state.auth.isDarkMode,
    userInfo: state.auth.user,
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
)(ProfileModal);


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