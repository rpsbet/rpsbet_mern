import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomList, getHistory, setCurRoomInfo, startLoading, endLoading, getMyGames, getMyHistory, getGameTypeList } from '../../redux/Logic/logic.actions'
import MyGamesTable from '../MyGames/MyGamesTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';

import Moment from 'moment';
import { alertModal } from '../modal/ConfirmAlerts';
import SearchIcon from '@material-ui/icons/Search';

import { updateDigitToPoint2 } from '../../util/helper'

import { Tabs, Tab, Button } from '@material-ui/core';
import Avatar from "../../components/Avatar";

import './MainPages.css';

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
			selected_main_tab_index: 0,
			selected_sub_tab_index: 0,
			mobile_show_panel: window.innerWidth < 1024 ? 'join_game' : '',
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
		this.props.getRoomList({
			page: this.state.pageNumber,
			keyword: this.state.search_room_text
		});
		this.props.getMyGames(1);
		this.props.getMyHistory();
		this.props.getGameTypeList();
		await this.props.getHistory({keyword: this.state.search_history_text});
		this.interval = setInterval(this.updateReminderTime.bind(this), 3000);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

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

		if (!this.props.isAuthenticated) {
            alertModal(this.props.isDarkMode, `Please login to join this game!`)
			return;
		}

		if (bet_amount > this.state.balance / 100.0) {
            alertModal(this.props.isDarkMode, `Not enough balance!`)
			return;
		}

		if (e.target.getAttribute('room_status') === 'finished') {
            alertModal(this.props.isDarkMode, `You can't join the game. This game has been finished.`)
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

	handleMainTabChange = (event, newValue) => {
		this.setState({selected_main_tab_index: newValue});
	}

	handleSubTabChange = (event, newValue) => {
		this.setState({selected_sub_tab_index: newValue});
	}

	render() {
		const pageNumbers = [];

		for (let i = 1; i <= this.props.totalPage; i++) {
			pageNumbers.push(
				<button 
					key={i}
					className={`btn btn_main_table_page_number ${i === this.props.pageNumber ? 'active' : ''}`}
					onClick={(e)=>{
						this.props.getRoomList({
							page: i,
							keyword: this.state.search_room_text
						});}
					}>
					{i}
				</button>);
		}

		const gameTypeStyleClass = {
			'RPS': 'classic-rps',
			'S!': 'spleesh',
			'MB': 'mystery-box',
			'BG': 'brain-game',
			'QS': 'quick-shoot',
		}
		const createGamePanel = this.props.gameTypeList.map((gameType, index) => (
			<div className="btn-create-game" key={index} onClick={(e) => { 
				if (this.props.isAuthenticated) {
					history.push(`/create/${gameType.game_type_name}`) 
				} else {
					alertModal(this.props.isDarkMode, 'Please login to create a new game room.')
				}
			}}>
				<i className={`game-type-icon ${gameTypeStyleClass[gameType.short_name]}`}></i>
				<div className="game-type-name">{gameType.game_type_name}</div>
			</div>
		))

		return (
			<div className="main-game">
				{ this.state.mobile_show_panel !== 'my_activity' &&
					<div className="main-panel">
						<div className="create-game mobile-only">
							<h2 className="main-title">Create New Game <span>- For greater Winnings!</span></h2>
							<div className="create-game-panel-parent">
								<div className="create-game-panel">
									{ createGamePanel }
								</div>
							</div>
						</div>
						<h2 className="main-title">All Open Games</h2>
						<Tabs
							value={this.state.selected_main_tab_index}
							onChange={this.handleMainTabChange}
							TabIndicatorProps={{style: {background: '#c438ef'}}}
							className="main-game-page-tabs"
						>
							<Tab label="Live Games" style={{textTransform: 'none'}} />
							<Tab label="Global History" style={{textTransform: 'none'}} />
						</Tabs>
						{
							this.state.selected_main_tab_index === 0 && <>
								<div className="table_title_with_search">
									<form className="search_panel" onSubmit={this.searchRoom}>
										<button className="btn"><SearchIcon size="small" /></button>
										<input type="text" className="search_text" value={this.state.search_room_text} onChange={(e)=>{this.setState({search_room_text: e.target.value})}} placeholder="Search" />
									</form>
									<div className="desktop-only">
										{/* Sort by: */}
									</div>
								</div>
								<div className="overflowX">
									<div className="table main-game-table">
										{this.props.roomList.map((row, key) => (
											<div className="table-row" key={key}>
												<div>
													<div className="table-cell cell-room-info">
														<img src={`/img/gametype/i${row.game_type.short_name}.png `} alt="" className="game-type-icon" /> 
														<div>
															<div className="cell-game-type">{row.game_type.game_type_name}</div>
															<div className="cell-game-id">{'#' + row.index}</div>
														</div>
													</div>
													<div className="table-cell desktop-only cell-user-name">
														<Avatar className="avatar" src={row.creator_avatar} alt="" darkMode={this.props.isDarkMode} />
														<span>{row.creator}</span>
														<i className={`online-status ${this.props.onlineUserList.indexOf(row.creator_id) >= 0 ? 'online' : ''}`}></i>
													</div>
													<div className="table-cell desktop-only cell-amount-info">
														{row.game_type.game_type_name === "Spleesh!" ? "£" + row.spleesh_bet_unit + " - £" + row.spleesh_bet_unit * 10 : "£" + updateDigitToPoint2(row.user_bet)} / {row.winnings}
													</div>
													<div className="table-cell cell-action">
														<button 
															className="btn_join" 
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
															{row.is_private && <img src="/img/icon-lock.png" alt="" className="lock-icon" />}
															Join Game
														</button>
													</div>
												</div>
												<div className="mobile-only">
													<div className="table-cell cell-user-name">
														<Avatar className="avatar" src={row.creator_avatar} alt="" darkMode={this.props.isDarkMode} />
														<span>{row.creator}</span>
														<i className="online-status online"></i>
													</div>
													<div className="table-cell cell-amount-info">
														{"£" + updateDigitToPoint2(row.user_bet) /*+ " / £" + row.pr*/} / {row.winnings}
													</div>
												</div>
											</div>
										), this)}
									</div>
									<div className="main_table_pagination">
										{pageNumbers}
									</div>
								</div>
							</>
						}
						{
							this.state.selected_main_tab_index === 1 && <>
								<div className="table_title_with_search">
									<form className="search_panel" onSubmit={this.searchHistory}>
										<button className="btn"><SearchIcon size="small" /></button>
										<input type="text" className="search_text" value={this.state.search_history_text} onChange={(e)=>{this.setState({search_history_text: e.target.value})}} placeholder="Search" />
									</form>
								</div>
								<div className="overflowX">
									<div className="table main-history-table">
										{this.state.history.map((row, key) => (
											<div className="table-row" key={key}>
												<div>
													<div className="table-cell">{row.room_name}</div>
													<div className="table-cell desktop-only" dangerouslySetInnerHTML={{ __html: row.history }}></div>
													<div className="table-cell">{row.from_now}</div>
												</div>
												<div className="mobile-only">
													<div className="table-cell" dangerouslySetInnerHTML={{ __html: row.history }}></div>
												</div>
											</div>
										), this)}
									</div>
								</div>
							</>
						}
					</div>
				}
				{ this.state.mobile_show_panel !== 'join_game' &&
					<div className="sub-panel">
						<div className="create-game">
							<h2 className="main-title">Create New Game <span>- For greater Winnings!</span></h2>
							<div className="create-game-panel-parent">
								<div className="create-game-panel">
									{ createGamePanel }
								</div>
							</div>
						</div>
						<h2 className="main-title">My Games</h2>
						<Tabs
							value={this.state.selected_sub_tab_index}
							onChange={this.handleSubTabChange}
							TabIndicatorProps={{style: {background: '#b9b9b9'}}}
							className="main-game-page-tabs sub-tabs"
						>
							<Tab label="Open Games" style={{textTransform: 'none'}} />
							<Tab label="History" style={{textTransform: 'none'}} />
						</Tabs>
						{ this.state.selected_sub_tab_index === 0 && <MyGamesTable /> }
						{ this.state.selected_sub_tab_index === 1 && <MyHistoryTable /> }
					</div>
				}
				<div className="mobile-only main-page-nav-button-group">
					<Button onClick={(e) => { this.setState({mobile_show_panel: 'join_game'}) }} className={this.state.mobile_show_panel === 'join_game' ? 'active' : ''}>Join Game</Button>
					<Button onClick={(e) => { this.setState({mobile_show_panel: 'my_activity'}) }} className={this.state.mobile_show_panel === 'my_activity' ? 'active' : ''}>My Activity</Button>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => ({
	isAuthenticated: state.auth.isAuthenticated,
	roomList: state.logic.roomList,
	history: state.logic.history,
	roomCount: state.logic.roomCount,
	pageNumber: state.logic.pageNumber,
	totalPage: state.logic.totalPage,
	balance: state.auth.balance,
	user: state.auth.user,
	isDarkMode: state.auth.isDarkMode,
	onlineUserList: state.logic.onlineUserList,
  	gameTypeList: state.logic.gameTypeList,
});

const mapDispatchToProps = {
	getRoomList,
	getHistory,
	setCurRoomInfo,
	startLoading,
	endLoading,
	getMyGames, 
	getMyHistory,
	getGameTypeList
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomList);
