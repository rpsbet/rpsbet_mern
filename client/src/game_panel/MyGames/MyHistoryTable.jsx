import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getMyHistory } from '../../redux/Logic/logic.actions'

import Moment from 'moment';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Pagination from '../../components/Pagination';

function updateFromNow(history) {
	const result = JSON.parse(JSON.stringify(history));
	for (let i=0; i<result.length; i++) {
		result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
	}
	return result;
}

class MyHistoryTable extends Component {
	constructor(props) {
		super(props);
		this.state = {
			myHistory: this.props.myHistory,
			selectedGameType: 'RPS'
		};
	}

	static getDerivedStateFromProps(props, current_state) {
		if (current_state.myHistory.length === 0 
			|| current_state.myHistory.length !== props.myHistory.length
			|| (props.myHistory && current_state.myHistory[0]['created_at'] !== props.myHistory[0]['created_at'])) {
			return {
				...current_state,
				myHistory: updateFromNow(props.myHistory)
			};
		}
		return null;
	}

	updateReminderTime = () => {
		this.setState({ myHistory: updateFromNow(this.state.myHistory) });
	}

	async componentDidMount() {
		this.updateReminderTime();
		this.interval = setInterval(this.updateReminderTime(), 3000);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	handleGameTypeButtonClicked = async (e) => {
		const short_name = e.target.getAttribute('short_name');
		this.setState({ selectedGameType: short_name });
		this.props.getMyHistory({
			game_type: short_name
		});
		return;
	}

	handleBtnLeftClicked = (e) => {
		this.game_type_panel.scrollLeft = 0;
	}

	handleBtnRightClicked = (e) => {
		this.game_type_panel.scrollLeft = this.game_type_panel.scrollWidth;
	}

	generateGameTypePanel = () => {
		const gameTypeStyleClass = {
			'RPS': 'rps',
			'S!': 'spleesh',
			'MB': 'mystery-box',
			'BG': 'brain-game',
			'QS': 'quick-shoot',
		}

		const gameTypePanel = [
			<div className="btn-arrow-left" key="open-game-left-button" onClick={this.handleBtnLeftClicked}><ChevronLeftIcon /></div>,
			<div className="btn-arrow-right" key="open-game-right-button" onClick={this.handleBtnRightClicked}><ChevronRightIcon /></div>,
			<div className={`btn-game-type all-games ${this.state.selectedGameType === 'All' ? 'active' : ''}`} 
				key="open-game-all-game-button" 
				game_type_id={null} 
				short_name="All"
				onClick={this.handleGameTypeButtonClicked}>
				All Games
			</div>
		];

		this.props.gameTypeList.map((gameType, index) => {
			gameTypePanel.push(
				<div className={`btn-game-type ${gameTypeStyleClass[gameType.short_name]} ${this.state.selectedGameType === gameType.short_name ? 'active' : ''}`} 
					game_type_id={gameType._id}
					short_name={gameType.short_name}
					key={index} 
					onClick={this.handleGameTypeButtonClicked}>
					{gameType.game_type_name}
				</div>
			);
		});

		return gameTypePanel;
	}

	handlePageNumberClicked = (page) => {
		this.props.getMyHistory({
			page: page,
			game_type: this.state.selectedGameType
		});
	}

	handlePrevPageClicked = () => {
		if (this.props.pageNumber === 1) return;
		this.props.getMyHistory({
			page: this.props.pageNumber - 1,
			game_type: this.state.selectedGameType
		});
	}

	handleNextPageClicked = () => {
		if (this.props.pageNumber === this.props.totalPage) return;
		this.props.getMyHistory({
			page: this.props.pageNumber + 1,
			game_type: this.state.selectedGameType
		});
	}

	render() {
		const gameTypePanel = this.generateGameTypePanel();

		return (
			<div className="overflowX">
				<div className="game-type-container">
					<div className="game-type-panel" ref={(elem) => {this.game_type_panel = elem}}>
						{gameTypePanel}
					</div>
				</div>
				<div className="table main-history-table">
					{this.state.myHistory.length === 0 && 
						<div className="dont-have-game-msg">
							<div>There aren't any histories right now.</div>
						</div>}
					{this.state.myHistory.map((row, key) => (
						<div className="table-row" key={'my_history' + row._id}>
							<div>
								<div className="table-cell">
									<div className="room-id">{row.room_name}</div>
									<div className="desktop-only" dangerouslySetInnerHTML={{ __html: row.history }}></div>
								</div>
								<div className="table-cell">{row.from_now}</div>
							</div>
							<div>
								<div className="table-cell mobile-only" dangerouslySetInnerHTML={{ __html: row.history }}></div>
							</div>
						</div>
					), this)}
				</div>
				{this.state.myHistory.length > 0 && 
					<Pagination 
						handlePageNumberClicked={this.handlePageNumberClicked}
						handlePrevPageClicked={this.handlePrevPageClicked}
						handleNextPageClicked={this.handleNextPageClicked}
						pageNumber={this.props.pageNumber}
						totalPage={this.props.totalPage}
						prefix="MyHistory"
					/>}
			</div>
		);
	}
}

const mapStateToProps = state => ({
	myHistory: state.logic.myHistory,
	pageNumber: state.logic.myHistoryPageNumber,
	totalPage: state.logic.myHistoryTotalPage,
	gameTypeList: state.logic.gameTypeList,
});

const mapDispatchToProps = {
	getMyHistory
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyHistoryTable);
