import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo, getMyChat } from '../../redux/Logic/logic.actions';
import Avatar from '../../components/Avatar';
import Moment from 'moment';
import { Button, Skeleton, Box } from '@mui/material';
import { toggleDrawer } from '../../redux/Auth/user.actions';

function MyChat(props) {
	const { isDarkMode, myChat: myChatFromProps, loading, toggleDrawer } = props;

	// ------------------ LOCAL STATE ------------------
	const [myChat, setMyChat] = useState(myChatFromProps);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

	// ------------------ EFFECTS ------------------

	// Equivalent to componentDidMount: fetch chat data once
	useEffect(() => {
		props.getMyChat();
	}, []);

	// Equivalent to getDerivedStateFromProps: whenever props.myChat changes, update local myChat state
	useEffect(() => {
		setMyChat(myChatFromProps);
	}, [myChatFromProps]);

	// ------------------ HANDLERS ------------------
	const openChat = useCallback(
		(e) => {
			const { avatar, username, rank, id } = e.currentTarget.dataset;

			if (isMobile) {
				// Toggle drawer only if on mobile
				toggleDrawer();
			}

			// Provide chat info to Redux
			props.setChatRoomInfo({
				avatar,
				rank,
				username,
				chatLogs: []
			});

			// Navigate to /chat/:id
			history.push('/chat/' + id);
		},
		[isMobile, toggleDrawer, props]
	);

	// ------------------ RENDER ------------------
	// Sort the myChat keys in descending order by updated_at
	// Note: myChat is an object keyed by room ID or something similar
	const historyKeys = Object.keys(myChat).sort((a, b) => {
		return myChat[a].updated_at < myChat[b].updated_at ? 1 : -1;
	});

	return (
		<div className="chat">
			<div className="table my-chat-table">
				{Object.keys(myChat).length === 0 && loading ? (
					// If no chats yet and still loading, show Skeleton placeholders
					<div>
						{[...Array(5)].map((_, index) => (
							<Box
								key={index}
								className="table-row"
								sx={{
									display: 'flex',
									alignItems: 'center',
									padding: '10px 0',
									borderBottom: '1px solid #ccc',
								}}
							>
								{/* Skeleton for Avatar */}
								<Box sx={{ marginRight: 2 }}>
									<Skeleton variant="circular" sx={{ width: 40, height: 40 }} />
								</Box>

								{/* Skeleton for Message Content */}
								<Box sx={{ flex: 1, marginRight: 2 }}>
									<Skeleton variant="text" sx={{ width: '60%', height: 20, marginBottom: 1 }} />
									<Skeleton variant="text" sx={{ width: '40%', height: 15, marginBottom: 0.5 }} />
								</Box>

								{/* Skeleton for Unread Badge */}
								<Box sx={{ marginRight: 2 }}>
									<Skeleton variant="circular" sx={{ width: 30, height: 20, borderRadius: '10px' }} />
								</Box>

								{/* Skeleton for Button */}
								<Box>
									<Skeleton variant="rectangular" sx={{ width: 60, height: 30, borderRadius: 1 }} />
								</Box>
							</Box>
						))}
					</div>
				) : (
					// Otherwise, render the list of chat items
					historyKeys.map((rowKey, index) => (
						<div className="table-row" key={index}>
							<div>
								<div className="table-cell">
									<Avatar
										accessory={myChat[rowKey].accessory}
										rank={myChat[rowKey].rank}
										src={myChat[rowKey].avatar}
										username={myChat[rowKey].username}
										alt=""
										className="avatar"
										darkMode={isDarkMode}
									/>
								</div>
							</div>
							<div className="message-panel title">
								<div className="table-cell">
									{myChat[rowKey].message}
								</div>
								<div className="table-cell message-date">
									{Moment(myChat[rowKey].created_at_str).format('DD / MM')}
								</div>
								<div>
									<div className="table-cell" title="Unread message">
										{myChat[rowKey].unread_message_count === 0 ? (
											<></>
										) : (
											<span className="unread_message_badge">
												{myChat[rowKey].unread_message_count}
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
										onClick={openChat}
										data-id={myChat[rowKey]._id}
										data-avatar={myChat[rowKey].avatar}
										data-rank={myChat[rowKey].totalWagered}
										data-username={myChat[rowKey].username}
									>
										Open
									</Button>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
	isDarkMode: state.auth.isDarkMode,
	myChat: state.logic.myChat,
	loading: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
	setChatRoomInfo,
	getMyChat,
	toggleDrawer
};

export default connect(mapStateToProps, mapDispatchToProps)(MyChat);