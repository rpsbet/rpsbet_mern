import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomList, getHistory, setCurRoomInfo } from '../../redux/Logic/logic.actions'

class RoomList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageNumber: props.pageNumber,
            balance: this.props.balance
        };
        this.joinRoom = this.joinRoom.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.balance !== props.balance) {
            return {
                ...current_state,
                balance: props.balance
            };
        }
        return null;
    }

    componentDidMount() {
        console.log(this.props);
        this.IsAuthenticatedReroute();
        this.props.getRoomList({
            page: this.state.pageNumber,
        });
        this.props.getHistory();
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    joinRoom(e) {
        const creator_id = e.target.getAttribute('creator_id');
        if (creator_id === this.props.user._id) {
            alert(`Oop! This game is yours. You can't join this game.`);
            return;
        }

        const bet_amount = e.target.getAttribute('bet_amount');
        if (bet_amount > this.state.balance / 100.0) {
            alert("Not enough balance!");
            return;
        }

        if (e.target.getAttribute('room_status') === 'finished') {
            alert("You can't join the game. This game has been finished.");
            return;
        }

        const room_id = e.target.getAttribute('_id');
        this.props.setCurRoomInfo({
            _id: room_id,
            game_type: e.target.getAttribute('game_type'),
            bet_amount: bet_amount,
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
        return (
            <>
                <h1 className="main_title">Join a game</h1>
                <label className="tbl_title">Open Games</label>
                <div className="overflowX">
                    <table className="table table-striped table-hover text-center normal_table">
                        <thead>
                            <tr>
                                <th>Room ID</th>
                                <th>Host</th>
                                <th>Bet / PR</th>
                                <th>Winnings</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.props.roomList.map((row, key) => (
                            <tr key={key}>
                                <td>{row.game_type.game_type_name + ' ' + row.index}</td>
                                <td>{row.creator}</td>
                                <td>{"£" + row.user_bet + " / £" + row.pr}</td>
                                <td>{row.winnings}</td>
                                <td>{row.status}</td>
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
                        {this.props.history.map((row, key) => (
                            <tr key={key}>
                                <td>{row.room_name}</td>
                                <td dangerouslySetInnerHTML={{ __html: row.history }}></td>
                                <td>{row.created_at}</td>
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
    balance: state.auth.balance,
    user: state.auth.user
});

const mapDispatchToProps = {
    getRoomList,
    getHistory,
    setCurRoomInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomList);
