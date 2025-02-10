import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo, getMyChat, markChatAsRead } from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';

import Avatar from '../../components/Avatar';
import moment from 'moment';

import {
	Skeleton,
	Box,
	Typography,
	Paper
} from '@mui/material';

// Import your custom theme generator
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

function MyChat(props) {
	const {
		isDarkMode,
		myChat: myChatFromProps,
		loading,
		toggleDrawer,
		getMyChat,
		setChatRoomInfo,
		highlightChatId,
		markChatAsRead,
		unreadMessageCount
	} = props;

	// ------------------ LOCAL STATE ------------------
	const [myChat, setMyChat] = useState(myChatFromProps);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
	const [activeChatId, setActiveChatId] = useState(highlightChatId);

	// ------------------ EFFECTS ------------------
	useEffect(() => {
		getMyChat();
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		if (unreadMessageCount !== undefined && unreadMessageCount !== null) {
		  getMyChat();
		}
	  }, [unreadMessageCount, getMyChat]);

	useEffect(() => {
		setMyChat(myChatFromProps);
	}, [myChatFromProps]);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 1024);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// ------------------ HANDLERS ------------------
	const openChat = useCallback(
		(e) => {
			const { avatar, username, rank, id } = e.currentTarget.dataset;

			if (isMobile) {
				// Toggle drawer only if on mobile
				toggleDrawer();
			}

			setActiveChatId(id);
			markChatAsRead(id);
			// Navigate to /chat/:id
			history.push('/chat/' + id);
		},
		[isMobile, toggleDrawer, setChatRoomInfo]
	);

	// Sort keys in descending order by updated_at
	const historyKeys = Object.keys(myChat).sort((a, b) => {
		return myChat[a].updated_at < myChat[b].updated_at ? 1 : -1;
	});

	// Theme
	const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
	function formatDateShort(dateString) {
		const now = moment();
		const date = moment(dateString);
		const diffSeconds = now.diff(date, 'seconds');
	  
		// Less than 1 minute => seconds
		if (diffSeconds < 60) {
		  return `${diffSeconds}s`;
		}
	  
		const diffMinutes = Math.floor(diffSeconds / 60);
		// Less than 1 hour => minutes
		if (diffMinutes < 60) {
		  return `${diffMinutes}m`;
		}
	  
		const diffHours = Math.floor(diffMinutes / 60);
		// Less than 24 hours => hours
		if (diffHours < 24) {
		  return `${diffHours}h`;
		}
	  
		// 24+ hours => either "D MMM" (same year) or "D MMM YYYY" (past year)
		if (date.year() === now.year()) {
		  // e.g. "23 Jan"
		  return date.format('D MMM');
		} else {
		  // e.g. "23 Jan 2022"
		  return date.format('D MMM YYYY');
		}
	  }

	return (
		<ThemeProvider theme={theme}>
			<Box sx={{ background: 'rgba(170, 170, 170, 0.06)', borderRadius: '0.3em' }}>

				{Object.keys(myChat).length === 0 && loading ? (
					// Skeleton placeholders
					<Box>
						{[...Array(5)].map((_, index) => (
							<Box
								key={index}
								sx={{
									display: 'flex',
									alignItems: 'center',
									py: 1.25,
									borderBottom: '1px solid',
									borderColor: 'divider',
								}}
							>
								<Box sx={{ mr: 2 }}>
									<Skeleton variant="circular" width={40} height={40} />
								</Box>
								<Box sx={{ flex: 1, mr: 2 }}>
									<Skeleton
										variant="text"
										sx={{ width: '60%', height: 20, mb: 1 }}
									/>
									<Skeleton
										variant="text"
										sx={{ width: '40%', height: 15, mb: 0.5 }}
									/>
								</Box>
								<Box sx={{ mr: 2 }}>
									<Skeleton
										variant="circular"
										sx={{
											width: 30,
											height: 20,
											borderRadius: '10px',
										}}
									/>
								</Box>
							</Box>
						))}
					</Box>
				) : (
					<Box>
						{historyKeys.length === 0 && !loading ? (
							<Typography variant="body2" color="text.secondary">
								Your inbox is dry, find some friends?
							</Typography>
						) : (
							historyKeys.map((rowKey, index) => {
								const rowData = myChat[rowKey];
								const isActive = rowData._id === activeChatId;

								return (
									// Entire row is clickable
									<Box
										key={index}
										data-id={rowData._id}
										data-avatar={rowData.avatar}
										data-rank={rowData.totalWagered}
										data-username={rowData.username}
										onClick={openChat}
										sx={{
											display: 'flex',
											alignItems: 'center',
											py: 1.25,
											px: 1,
											p: '15px',
											backgroundColor: isActive ? 'rgba(255, 0, 0, 0.1)' : 'inherit',
											borderRight: isActive ? '4px solid red' : 'none',
											borderBottom: '1px solid',
											borderColor: 'divider',
											transition: 'background-color 0.2s',
											cursor: 'pointer',
											'&:hover': {
												backgroundColor: 'action.hover',
											},
										}}
									>
										{/* Avatar */}
										<Box className='player' sx={{ mr: 2 }}>
											<Avatar
												accessory={rowData.accessory}
												rank={rowData.rank}
												src={rowData.avatar}
												username={rowData.username}
												user_id={rowData._id}
												alt=""
												className="avatar"
												darkMode={isDarkMode}
												style={{ width: 40, height: 40 }}
											/>
										</Box>

										{/* Message + Date */}
										<Box
											sx={{
												flex: 1,
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												mr: 2,
											}}
										>
											<Typography
												variant="subtitle2"
												sx={{ fontWeight: 'bold', color: 'text.primary' }}
											>
												{rowData.username}
											</Typography>
											<Typography
												variant="body2"
												sx={{ color: 'text.secondary', mb: 0.5 }}
											>
												{rowData.message}
											</Typography>
											<Typography
												variant="caption"
												sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
											>
												{formatDateShort(rowData.created_at_str)}

											</Typography>
										</Box>

										{/* Unread Badge */}
										{rowData.unread_message_count > 0 && (
											<Box
												component="span"
												sx={{
													display: 'inline-flex',
													alignItems: 'center',
													justifyContent: 'center',
													backgroundColor: 'error.main',
													color: '#fff',
													borderRadius: '12px',
													px: 1,
													py: 0.25,
													fontSize: '0.75em',
													fontWeight: 'bold',
													minWidth: 24,
													textAlign: 'center',
												}}
											>
												{rowData.unread_message_count}
											</Box>
										)}
									</Box>
								);
							})
						)}
					</Box>
				)}
			</Box>

		</ThemeProvider>
	);
}

// Redux connect
const mapStateToProps = (state) => ({
	isDarkMode: state.auth.isDarkMode,
	myChat: state.logic.myChat,
	loading: state.logic.isActiveLoadingOverlay,
	unreadMessageCount: state.auth.unreadMessageCount,

});

const mapDispatchToProps = {
	setChatRoomInfo,
	getMyChat,
	toggleDrawer,
	markChatAsRead
};

export default connect(mapStateToProps, mapDispatchToProps)(MyChat);