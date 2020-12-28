import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo } from '../../redux/Logic/logic.actions';

class MyHistoryTable extends Component {
	constructor(props) {
		super(props);
		this.state = {
			myHistory: this.props.myHistory
		};

		this.openChat = this.openChat.bind(this);
	}

	openChat = (e) => {
		this.props.setChatRoomInfo({
			avatar: e.target.getAttribute('avatar'),
			username: e.target.getAttribute('username'),
			chatLogs: []
		});
		history.push('/chat/' + e.target.getAttribute('_id'));
	}

	static getDerivedStateFromProps(props, current_state) {
		return {
			...current_state,
			myHistory: props.myHistory
		};
	}

	render() {
		const history_keys = Object.keys(this.state.myHistory).sort((a, b) => { 
			return this.state.myHistory[a].updated_at < this.state.myHistory[b].updated_at ? 1 : -1;
		});

		return (
			<div className="history">
				<div className="table my-history-table">
					{
						this.state.myHistory.length === 0 ? 
							<div></div>
							: 
							history_keys.map((row, key) => (
								<div className="table-row" key={key}>
									<div>
										<div className="table-cell"><img src={`${this.state.myHistory[row].avatar} `} alt="" className="avatar" onError={(e)=>{e.target.src='../img/avatar.png'}} /></div>
										<div className="table-cell desktop-only">{this.state.myHistory[row].username}<br/>{this.state.myHistory[row].message}</div>
										<div className="table-cell desktop-only">{this.state.myHistory[row].unread_message_count === 0 ? <></> : <span className="unread_message_badge">{this.state.myHistory[row].unread_message_count}</span>}</div>
										<div className="table-cell">{this.state.myHistory[row].created_at_str}</div>
										<div className="table-cell desktop-only">
											<button 
												className="btn btn_join" 
												onClick={this.openChat}
												_id={this.state.myHistory[row]._id} 
												avatar={this.state.myHistory[row].avatar} 
												username={this.state.myHistory[row].username} 
											>
												Open
											</button>
										</div>
									</div>
									<div className="mobile-only">
										<div className="table-cell">{this.state.myHistory[row].username}<br/>{this.state.myHistory[row].message}</div>
										<div className="table-cell">
											<button 
												className="btn btn_join" 
												onClick={this.openChat}
												_id={this.state.myHistory[row]._id} 
												avatar={this.state.myHistory[row].avatar} 
												username={this.state.myHistory[row].username} 
											>
												Open
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
	myHistory: state.logic.myHistory
});

const mapDispatchToProps = {
	setChatRoomInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyHistoryTable);
