import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { acGetCustomerInfo, getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import './Modals.css';


Modal.setAppElement('#root')



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
      _id: props._id || '',
      username: props.username || '',
      avatar: props.avatar,
      dataLoaded: false
    }
    }
    updateSelectedRow(selectedRow) {
      this.setState({selectedRow});
    }

    async componentDidMount() {
      console.log('Props received in PlayerModal: ', this.props);

      if (!this._isMounted) return;

      const result = await this.props.getCustomerStatisticsData(this.state._id)
      this.setState({
        ...result
      })
      console.log(this.state.username);
       
    }

    

    handleAvatarLoaded = (filename) => {
        console.log(filename)
    }

    handleCloseModal = () => {
    this.props.closeModal();
}

  componentWillUnmount() {
    console.log("PlayerModal component unmounting");

    this._isMounted = false;
    
}
  

// componentWillReceiveProps(nextProps) {
//   if (nextProps._id !== nextProps._id) {
//     this.props.getCustomerStatisticsData(nextProps._id)
//       .then(result => this.setState({ ...result }));
//   }
// }
    render() {
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
});

const mapDispatchToProps = {
    getCustomerStatisticsData,
    acGetCustomerInfo
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PlayerModal);

