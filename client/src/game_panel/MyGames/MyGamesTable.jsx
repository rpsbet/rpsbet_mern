import React, { Component } from 'react';
import { connect } from 'react-redux';
import { endGame } from '../../redux/Logic/logic.actions';
import { updateDigitToPoint2 } from '../../util/helper';

class MyGamesTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            myRoomList: this.props.myGames
        }
        this.endRoom = this.endRoom.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        return {
            ...current_state,
            myRoomList: props.myGames
        };
    }

    endRoom(winnings, room_id) {
        if (window.confirm(`Do you want to end this game now? You will take [${winnings}]`)) {
            this.props.endGame(room_id);
        }
    }

    render() {
        return (
            <>
                <label className="tbl_title">MY OPEN GAMES</label>
                <div className="my-open-games">
                    <table className="table table-striped table-hover text-center normal_table">
                        <thead>
                            <tr>
                                <th>Room ID</th>
                                <th>Bet / PR</th>
                                <th>Winnings</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            this.state.myRoomList.length === 0 ? 
                                <tr><td colSpan="4"></td></tr> 
                                : 
                                this.state.myRoomList.map((row, key) => (
                                    <tr key={key}>
                                        <td><img src={`/img/gametype/i${row.game_type.short_name}.png `} alt="" className="td_icon" /> {row.game_type.short_name + '-' + row.index} {row.is_private && <img src="/img/icon-lock.png" alt="" className="td_icon" />}</td>
                                        <td><span>{"£" + updateDigitToPoint2(row.bet_amount) + " / £" + updateDigitToPoint2(row.pr)}</span> <span style={{marginLeft: '20px', color: 'red'}}>{"£" + updateDigitToPoint2(row.endgame_amount)}</span></td>
                                        <td><span style={{color: '#02c526'}}>{row.winnings}</span></td>
                                        <td>
                                            <button 
                                                className="btn btn_finish btn_secondary" 
                                                onClick={(e) => {this.endRoom(row.winnings, e.target.getAttribute('_id'))}}
                                                _id={row._id} 
                                            >
                                                END
                                            </button>
                                        </td>
                                    </tr>
                                ), this)
                        }
                        </tbody>
                    </table>
                </div>
            </>
        );
    }
}

const mapStateToProps = state => ({
    myGames: state.logic.myGames
});

const mapDispatchToProps = {
    endGame
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyGamesTable);
