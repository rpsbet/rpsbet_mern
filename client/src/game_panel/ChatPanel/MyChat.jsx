import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Replace history with useNavigate
import { setChatRoomInfo, getMyChat, markChatAsRead } from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import Avatar from '../../components/Avatar';
import moment from 'moment';
import { Skeleton, Box, Typography, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Component
function MyChat({ highlightChatId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Add useNavigate hook

  // Redux state
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const myChatFromRedux = useSelector((state) => state.logic.myChat);
  const loading = useSelector((state) => state.logic.isActiveLoadingOverlay);
  const unreadMessageCount = useSelector((state) => state.auth.unreadMessageCount);

  // Local state
  const [myChat, setMyChat] = useState(myChatFromRedux);
  const [activeChatId, setActiveChatId] = useState(highlightChatId);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Fetch chat data on mount and when unreadMessageCount changes
  useEffect(() => {
    dispatch(getMyChat());
  }, [dispatch]);

  useEffect(() => {
    if (unreadMessageCount !== undefined && unreadMessageCount !== null) {
      dispatch(getMyChat());
    }
  }, [unreadMessageCount, dispatch]);

  // Update local chat state if Redux state changes
  useEffect(() => {
    setMyChat(myChatFromRedux);
  }, [myChatFromRedux]);

  // Handle window resize for mobile check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handler: open chat when a row is clicked
  const openChat = useCallback(
    (e) => {
      const { avatar, username, rank, id } = e.currentTarget.dataset;
      if (isMobile) {
        dispatch(toggleDrawer());
      }
      setActiveChatId(id);
      dispatch(markChatAsRead(id));
      navigate('/chat/' + id);
    },
    [isMobile, dispatch, navigate] // Add navigate to dependencies
  );

  // Sort keys in descending order by updated_at
  const historyKeys = Object.keys(myChat).sort((a, b) => {
    return myChat[a].updated_at < myChat[b].updated_at ? 1 : -1;
  });

  // Custom theme from your config
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // Optional: date formatter (if needed)
  function formatDateShort(dateString) {
    const now = moment();
    const date = moment(dateString);
    const diffSeconds = now.diff(date, 'seconds');
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h`;
    }
    return date.year() === now.year() ? date.format('D MMM') : date.format('D MMM YYYY');
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
        {Object.keys(myChat).length === 0 && loading ? (
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
                  <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="40%" sx={{ mb: 0.5 }} />
                </Box>
                <Box sx={{ mr: 2 }}>
                  <Skeleton variant="circular" width={30} height={20} sx={{ borderRadius: '10px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box>
            {historyKeys.length === 0 && !loading ? (
              <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
                Your inbox is dry, find some friends?
              </Typography>
            ) : (
              historyKeys.map((rowKey, index) => {
                const rowData = myChat[rowKey];
                const isActive = rowData._id === activeChatId;
                return (
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
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    {/* Avatar */}
                    <Box className="player" sx={{ mr: 2 }}>
                      <Avatar
                        accessory={rowData.accessory}
                        rank={rowData.rank}
                        src={rowData.avatar}
                        username={rowData.username}
                        user_id={rowData._id}
                        alt=""
                        darkMode={isDarkMode}
                        style={{ width: 40, height: 40 }}
                      />
                    </Box>
                    {/* Message + Date */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', mr: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {rowData.username}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {rowData.message.length > 10 ? `${rowData.message.substring(0, 10)}...` : rowData.message}
                      </Typography>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.disabled' }}>
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

export default MyChat;