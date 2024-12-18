import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo, getMyChat } from '../../redux/Logic/logic.actions';
import Avatar from "../../components/Avatar";
import Moment from 'moment';
import { Button } from '@material-ui/core';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import { Skeleton } from "@material-ui/lab";


class MyChat extends Component {
	constructor(props) {
		super(props);
		this.state = {
			myChat: this.props.myChat,
			chatOpenMobile: false,
			is_mobile: window.innerWidth < 1024 ? true : false
		};

	}


	openChat = (e) => {
		const { avatar, username, rank } = e.currentTarget.dataset;
		const chatRoomId = e.currentTarget.dataset.id;
		if (this.state.is_mobile) {
			this.props.toggleDrawer();
		}
		this.props.setChatRoomInfo({
			avatar,
			rank,
			username,
			chatLogs: []
		});

		history.push('/chat/' + chatRoomId);
	}


	static getDerivedStateFromProps(props, current_state) {
		return {
			...current_state,
			myChat: props.myChat
		};
	}

	async componentDidMount() {
		await this.props.getMyChat();

	}

	render() {
		const { loading } = this.props;
		const history_keys = Object.keys(this.state.myChat).sort((a, b) => {
			return this.state.myChat[a].updated_at < this.state.myChat[b].updated_at ? 1 : -1;
		});

		return (

			<div className="chat">
				<div className="table my-chat-table">
					{
						this.state.myChat.length === 0 && loading ? (
							<div>
								{[...Array(5)].map((_, index) => (
									<div
										key={index}
										className="table-row"
										style={{
											display: 'flex',
											alignItems: 'center',
											padding: '10px 0',
											borderBottom: '1px solid #ccc',
										}}
									>
										{/* Skeleton for Avatar */}
										<div style={{ marginRight: '15px' }}>
											<Skeleton
												variant="circular"
												width={40}
												height={40}
												style={{ borderRadius: '50%' }}
											/>
										</div>

										{/* Skeleton for Message Content */}
										<div style={{ flex: 1, marginRight: '15px' }}>
											<Skeleton
												variant="text"
												width="60%"
												height={20}
												style={{ marginBottom: '8px' }}
											/>
											<Skeleton
												variant="text"
												width="40%"
												height={15}
												style={{ marginBottom: '4px' }}
											/>
										</div>

										{/* Skeleton for Unread Badge */}
										<div style={{ marginRight: '15px' }}>
											<Skeleton
												variant="rounded"
												width={30}
												height={20}
												style={{ borderRadius: '10px' }}
											/>
										</div>

										{/* Skeleton for Button */}
										<div>
											<Skeleton
												variant="rounded"
												width={60}
												height={30}
												style={{ borderRadius: '5px' }}
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							history_keys.map((row, key) => (
								<div className="table-row" key={key}>
									<div>
										<div className="table-cell">
											<Avatar
												accessory={this.state.myChat[row].accessory}
												rank={this.state.myChat[row].rank}
												src={this.state.myChat[row].avatar}
												username={this.state.myChat[row].username}
												alt=""
												className="avatar"
												darkMode={this.props.isDarkMode}
											/>
										</div>
									</div>
									<div className="message-panel title">
										<div className="table-cell">
											{this.state.myChat[row].message}
										</div>
										<div className="table-cell message-date">
											{Moment(this.state.myChat[row].created_at_str).format('DD / MM')}
										</div>
										<div>
											<div className="table-cell" title="Unread message">
												{this.state.myChat[row].unread_message_count === 0 ? (
													<></>
												) : (
													<span className="unread_message_badge">
														{this.state.myChat[row].unread_message_count}
													</span>
												)}
											</div>
										</div>
									</div>
									<div>
										<div className="table-cell"></div>
										<div className="table-cell">
											<Button
												className="btn btn_join"
												onClick={this.openChat}
												data-id={this.state.myChat[row]._id}
												data-avatar={this.state.myChat[row].avatar}
												data-rank={this.state.myChat[row].totalWagered}
												data-username={this.state.myChat[row].username}
											>
												Open
											</Button>
										</div>
									</div>
								</div>
							), this)
						)
					}
				</div>
			</div>

		);
	}
}

const mapStateToProps = state => ({
	isDarkMode: state.auth.isDarkMode,
	myChat: state.logic.myChat,
	loading: state.logic.isActiveLoadingOverlay,

});

const mapDispatchToProps = {
	setChatRoomInfo,
	getMyChat,
	toggleDrawer
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(MyChat);
