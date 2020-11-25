import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomList, getHistory, setCurRoomInfo, startLoading, endLoading } from '../../redux/Logic/logic.actions'
import Moment from 'moment';
import { openAlert } from '../../redux/Notification/notification.actions';
import { FaSearch } from 'react-icons/fa';

import { updateDigitToPoint2 } from '../../util/helper'

function updateFromNow(history) {
    const result = JSON.parse(JSON.stringify(history));
    for (let i=0; i<result.length; i++) {
        result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
    }
    return result;
}

class RoomList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageNumber: props.pageNumber,
            balance: this.props.balance,
            history: this.props.history,
            search_room_text: '',
            search_history_text: '',
        };

        this.joinRoom = this.joinRoom.bind(this);
        this.searchRoom = this.searchRoom.bind(this);
        this.searchHistory = this.searchHistory.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.balance !== props.balance || 
            (current_state.history.length === 0 || (props.history && current_state.history[0]['created_at'] !== props.history[0]['created_at']))) {
            return {
                ...current_state,
                balance: props.balance,
                history: updateFromNow(props.history)
            };
        }
        return null;
    }

    updateReminderTime() {
        this.setState({ history: updateFromNow(this.state.history) });
    }

    async componentDidMount() {
        this.IsAuthenticatedReroute();
        this.props.getRoomList({
            page: this.state.pageNumber,
            keyword: this.state.search_room_text
        });
        await this.props.getHistory({keyword: this.state.search_history_text});
        this.interval = setInterval(this.updateReminderTime.bind(this), 3000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    async searchRoom(e) {
        e.preventDefault();
        this.props.startLoading();
        await this.props.getRoomList({
            page: this.state.pageNumber,
            keyword: this.state.search_room_text
        });
        this.props.endLoading();
    }

    async searchHistory(e) {
        e.preventDefault();
        this.props.startLoading();
        await this.props.getHistory({keyword: this.state.search_history_text});
        this.props.endLoading();
    }

    joinRoom(e) {
        const creator_id = e.target.getAttribute('creator_id');
        const bet_amount = e.target.getAttribute('bet_amount');

        if (bet_amount > this.state.balance / 100.0) {
            this.props.openAlert('warning', 'Warning!', `Not enough balance!`);
            return;
        }

        if (e.target.getAttribute('room_status') === 'finished') {
            this.props.openAlert('warning', 'Warning!', `You can't join the game. This game has finished.`);
            return;
        }

        const room_id = e.target.getAttribute('_id');
        this.props.setCurRoomInfo({
            _id: room_id,
            game_type: e.target.getAttribute('game_type'),
            bet_amount: bet_amount,
            creator_id: creator_id,
            spleesh_bet_unit: parseInt(e.target.getAttribute('spleesh_bet_unit')),
            box_price: parseFloat(e.target.getAttribute('box_price')),
            game_log_list: [],
            box_list: [],
            brain_game_type: {
                _id: e.target.getAttribute('brain_game_type_id'),
                game_type_name: e.target.getAttribute('brain_game_type_name')
            },
            brain_game_score: e.target.getAttribute('brain_game_score'),
        });
        history.push('/join/' + room_id);
    }

    render() {
        const pageNumbers = [];

        for (let i = 1; i <= this.props.totalPage; i++) {
            pageNumbers.push(
                <button 
                    key={i}
                    className={`btn_main_table_page_number ${i === this.props.pageNumber ? 'active' : ''}`}
                    onClick={(e)=>{
                        this.props.getRoomList({
                            page: i,
                            keyword: this.state.search_room_text
                        });}
                    }>
                    {i}
                </button>);
        }

        return (
            <>
                <div>

                    <h1 className="main_title">Join a game</h1>
                </div>
                <div className="table_title_with_search">
                    <label className="tbl_title">Open Games</label>
                    <form className="search_panel" onSubmit={this.searchRoom}>
                        <input type="text" className="search_text" value={this.state.search_room_text} onChange={(e)=>{this.setState({search_room_text: e.target.value})}} />
                        <button className="btn"><FaSearch /></button>
                    </form>
                </div>
                <div className="overflowX">
                    <table className="table table-striped table-hover text-center normal_table">
                        <thead>
                            <tr>
                                <th>Room ID</th>
                                <th>Host</th>
                                <th>Bet</th>
                                <th>Winnings</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.props.roomList.map((row, key) => (
                            <tr className={row.creator_id === this.props.user._id ? 'logged_in_users_game' : ''} key={key}>
                                <td><img src={`/img/gametype/i${row.game_type.short_name}.png `} alt="" className="td_icon" /> {row.game_type.short_name + '-' + row.index} {row.is_private && <img src="/img/icon-lock.png" alt="" className="td_icon" />}</td>
                                <td><img className="avatar" src={`${row.creator_avatar} `} alt="" />{row.creator}</td>
                                <td>{"£" + updateDigitToPoint2(row.user_bet) /*+ " / £" + row.pr*/}</td>
                                <td style={{color: "rgb(2, 197, 38)"}}>{row.winnings}</td>
                                <td>
                                    <button 
                                        className="btn btn_join" 
                                        onClick={this.joinRoom} 
                                        _id={row._id}
                                        creator_id={row.creator_id}
                                        room_status={row.status} 
                                        game_type={row.game_type.game_type_name} 
                                        bet_amount={row.user_bet} 
                                        spleesh_bet_unit={row.spleesh_bet_unit} 
                                        box_price={row.box_price}
                                        brain_game_type_id={row.brain_game_type ? row.brain_game_type._id : ''}
                                        brain_game_type_name={row.brain_game_type ? row.brain_game_type.game_type_name : ''}
                                        brain_game_score={row.brain_game_score ? row.brain_game_score : 0}
                                    >
                                        JOIN GAME
                                    </button>
                                </td>
                            </tr>
                        ), this)}
                        </tbody>
                    </table>
                    <div className="main_table_pagination">
                        {pageNumbers}
                    </div>
                </div>
                <div className="table_title_with_search">
                    <label className="tbl_title black">History</label>
                    <form className="search_panel" onSubmit={this.searchHistory}>
                        <input type="text" className="search_text" value={this.state.search_history_text} onChange={(e)=>{this.setState({search_history_text: e.target.value})}} />
                        <button className="btn"><FaSearch /></button>
                    </form>
                </div>
                <div className="overflowX">
                    <table className="table table-black">
                        <thead>
                            <tr>
                                <th>Room ID</th>
                                <th>History</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.state.history.map((row, key) => (
                            <tr key={key}>
                                <td>{row.room_name}</td>
                                <td dangerouslySetInnerHTML={{ __html: row.history }}></td>
                                <td>{row.from_now}</td>
                            </tr>
                        ), this)}
                        </tbody>
                    </table>
                </div>
            </>
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth.isAuthenticated,
    roomList: state.logic.roomList,
    history: state.logic.history,
    roomCount: state.logic.roomCount,
    pageNumber: state.logic.pageNumber,
    totalPage: state.logic.totalPage,
    balance: state.auth.balance,
    user: state.auth.user,
    isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {
    getRoomList,
    getHistory,
    setCurRoomInfo,
    openAlert,
    startLoading,
    endLoading
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomList);
