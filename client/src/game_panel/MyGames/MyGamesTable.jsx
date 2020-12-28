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
			<div className="my-open-games">
				<div className="table my-open-game-table">
					<div className="table-header">
						<div className="table-cell room-id">Room ID</div>
						<div className="table-cell bet-info">Bet / PR</div>
						<div className="table-cell winnings">Winnings</div>
						<div className="table-cell action desktop-only">Action</div>
					</div>
					{
						this.state.myRoomList.length === 0 ? 
							<div></div>
							: 
							this.state.myRoomList.map((row, key) => (
								<div className="table-row" key={key}>
									<div>
										<div className="table-cell room-id"><img src={`/img/gametype/i${row.game_type.short_name}.png `} alt="" className="game-type-icon" /> {row.game_type.short_name + '-' + row.index} {row.is_private && <img src="/img/icon-lock.png" alt="" className="td_icon" />}</div>
										<div className="table-cell bet-info"><span className="bet-pr">{"£" + updateDigitToPoint2(row.bet_amount) + " / £" + updateDigitToPoint2(row.pr)}</span> <span className="end-amount">{"£" + updateDigitToPoint2(row.endgame_amount)}</span></div>
										<div className="table-cell winnings"><span>{row.winnings}</span></div>
										<div className="table-cell action desktop-only">
											<button 
												className="btn_end" 
												onClick={(e) => {this.endRoom(row.winnings, e.target.getAttribute('_id'))}}
												_id={row._id} 
											>
												End
											</button>
										</div>
									</div>
									<div className="mobile-only">
										<div className="table-cell room-id"></div>
										<div className="table-cell action">
											<button 
												className="btn_end" 
												onClick={(e) => {this.endRoom(row.winnings, e.target.getAttribute('_id'))}}
												_id={row._id} 
											>
												End
											</button>
										</div>
									</div>
								</div>
							), this)
					}
				</div>
			</div>
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
