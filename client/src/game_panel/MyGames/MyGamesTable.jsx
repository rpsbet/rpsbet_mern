import React, { Component } from 'react';
import { connect } from 'react-redux';
import { endGame } from '../../redux/Logic/logic.actions';

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

    endRoom(e) {
        if (window.confirm('Do you want to end this game now?')) {
            this.props.endGame(e.target.getAttribute('_id'));
        }
    }

    render() {
        return (
            <>
                <label className="tbl_title">MY OPEN GAMES</label>
                <div className="">
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
                                        <td>{row.game_type.game_type_name + ' ' + row.index}</td>
                                        <td><span>{"£" + row.bet_amount + " / £" + row.pr}</span> <span style={{marginLeft: '20px', color: 'red'}}>{"£" + row.end_game_amount}</span></td>
                                        <td><span style={{color: '#02c526'}}>{row.winnings}</span></td>
                                        <td>
                                            <button 
                                                className="btn btn_finish btn_secondary" 
                                                onClick={this.endRoom}
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
