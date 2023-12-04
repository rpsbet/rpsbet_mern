import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo, getMyChat } from '../../redux/Logic/logic.actions';
import Avatar from "../../components/Avatar";
import Moment from 'moment';
import {Button} from '@material-ui/core';

class MyChat extends Component {
	constructor(props) {
		super(props);
		this.state = {
			myChat: this.props.myChat
		};
		this.state.myChat = this.props.myChat || {};

	}

	
	// async componentDidUpdate(prevProps) {
	// 	if (prevProps.myChat !== this.props.myChat) {
	// 	  console.log('j');
	// 	}
	// 	this.chat_log_panel.scrollTop = this.chat_log_panel.scrollHeight;
	//   }

	openChat = (e) => {
		const { avatar, username, rank } = e.currentTarget.dataset;
		const chatRoomId = e.currentTarget.dataset.id;

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
		const {loading} = this.props;
		const history_keys = Object.keys(this.state.myChat).sort((a, b) => { 
			return this.state.myChat[a].updated_at < this.state.myChat[b].updated_at ? 1 : -1;
		});

		return (
			<div className="chat">
				<div className="table my-chat-table">
					{
						this.state.myChat.length === 0 && loading ? 
							<div className='loading-spinner'></div>
							: 
							history_keys.map((row, key) => (
								<div className="table-row" key={key}>
									<div>
										<div className="table-cell">
											<Avatar accessory={this.state.myChat[row].accessory} rank={this.state.myChat[row].rank} src={this.state.myChat[row].avatar} alt="" className="avatar" darkMode={this.props.isDarkMode} />
											{/* {this.state.myChat[row].username} */}
										</div>
									</div>
									<div className="message-panel">
										<div className="table-cell">{this.state.myChat[row].message}</div>
										<div className="table-cell message-date">{Moment(this.state.myChat[row].created_at_str).format('DD / MM')}</div>
										<div><div className="table-cell" title="Unread message">{this.state.myChat[row].unread_message_count === 0 ? <></> : <span className="unread_message_badge">{this.state.myChat[row].unread_message_count}</span>}</div></div>
									</div>
									<div>
										<div className="table-cell">
										</div>
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
	getMyChat
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyChat);
