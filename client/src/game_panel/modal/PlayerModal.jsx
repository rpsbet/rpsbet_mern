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
            _id: props.selectedCreator || '',
            username: '',
            avatar: '',
            loading: true
        }
    }

    async componentDidMount() {
        console.log('Props received in PlayerModal: ', this.props);
    
        const result = await this.props.getCustomerStatisticsData(this.props.selectedCreator)
        const userData = await this.props.acGetCustomerInfo(this.props.selectedCreator)
        this.setState({
          ...result,
          username: userData.username,
          avatar: userData.avatar,
          loading: false
        })
    }
    


    handleCloseModal = () => {
        this.props.closeModal();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps._id !== this.props._id) {
            this.setState({ loading: true });
            this.props.getCustomerStatisticsData(nextProps._id)
                .then(result => this.setState({ ...result, loading: false }));
        }
    }

    render() {
        return (
            <Modal
                isOpen={this.props.modalIsOpen}
                onRequestClose={this.handleCloseModal}
                style={customStyles}
                contentLabel="Player Modal"
            >
                <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                    <div className="modal-body edit-modal-body">
                        <button className="btn-close" onClick={this.handleCloseModal}>×</button>
                        <h2 className="modal-title">{this.state.selectedCreator}</h2>
                        <div className='align-center'>
                            {this.state.loading ? (
                                <div>LOADING...</div>
                            ) : (
                                <Avatar
                                    src={this.state.avatar ? this.state.avatar : '/img/profile-thumbnail.svg'}
                                    alt=""
                                />
                            )}
                        </div>
                        {this.state.loading ? null : (
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
                        )}
                    </div>
                </div>
            </Modal>
        )
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

