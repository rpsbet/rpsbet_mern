import React, { Component } from 'react';
import { connect } from 'react-redux';
import { endGame, getMyGames } from '../../redux/Logic/logic.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { confirmModalClosed } from '../modal/ConfirmAlerts';

class MyGamesTable extends Component {
	constructor(props) {
		super(props);
		this.endRoom = this.endRoom.bind(this);
	}

	endRoom(winnings, room_id) {
		confirmModalClosed(this.props.isDarkMode, `Do you want to end this game now? You will take [${winnings}]`, 'Okay', 'Cancel', () => {
			this.props.endGame(room_id);
		});
	}

	render() {
		const pageNumbers = [];

		for (let i = 1; i <= this.props.myGamesTotalPage; i++) {
			pageNumbers.push(
				<button 
					key={i}
					className={`btn btn_main_table_page_number ${i === this.props.pageNumber ? 'active' : ''}`}
					onClick={(e)=>{ this.props.getMyGames(i); } }>
					{i}
				</button>);
		}

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
						this.props.myGames.length === 0 ? 
							<div></div>
							: 
							this.props.myGames.map((row, key) => (
								<div className="table-row" key={key}>
									<div>
										<div className="table-cell room-id">
											<img src={`/img/gametype/i${row.game_type.short_name}.png `} alt="" className="game-type-icon" />
											{row.game_type.short_name + '-' + row.index} 
											{row.is_private && <img src="/img/icon-lock.png" alt="" className="lock-icon" />}
										</div>
										<div className="table-cell bet-info">
											<span className="bet-pr">{"£" + updateDigitToPoint2(row.bet_amount) + " / £" + updateDigitToPoint2(row.pr)}</span>
											<span className="end-amount">{"£" + updateDigitToPoint2(row.endgame_amount)}</span></div>
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
				<div className="main_table_pagination">
					{pageNumbers}
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => ({
  	isDarkMode: state.auth.isDarkMode,
  	myGames: state.logic.myGames,
	myGamesTotalPage: state.logic.myGamesTotalPage,
	pageNumber: state.logic.myGamesPageNumber,
});

const mapDispatchToProps = {
	endGame,
	getMyGames
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyGamesTable);
