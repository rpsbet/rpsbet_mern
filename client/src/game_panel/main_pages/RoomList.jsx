import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomList, setCurRoomInfo } from '../../redux/Logic/logic.actions'

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
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    joinRoom(e) {
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
            bet_amount: bet_amount
        });
        history.push('/join/' + room_id);
    }

    render() {
        return (
            <>
                <h1 className="main_title">Join a game</h1>
                <label className="tbl_title">Open Games</label>
                <div className="col-md-12">
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
                                <td>{"£" + row.bet_amount + " / " + row.pr}</td>
                                <td>{row.winnings}</td>
                                <td>{row.status}</td>
                                <td><button className="btn btn_join" onClick={this.joinRoom} _id={row._id} room_status={row.status} game_type={row.game_type.game_type_name} bet_amount={row.bet_amount}>JOIN GAME</button></td>
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
    roomCount: state.logic.roomCount,
    pageNumber: state.logic.pageNumber,
    balance: state.auth.balance
});

const mapDispatchToProps = {
    getRoomList,
    setCurRoomInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomList);
