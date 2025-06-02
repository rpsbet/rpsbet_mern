import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChatRoomInfo, getMyChat, markChatAsRead } from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import Avatar from '../../components/Avatar';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  format,
  isValid,
  isSameYear,
} from 'date-fns';
import { 
  Skeleton, 
  Box, 
  Typography, 
  Paper, 
  TextField,
  InputAdornment,
  IconButton,
  Fade,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  Person as PersonIcon 
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Component
function MyChat({ highlightChatId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const myChatFromRedux = useSelector((state) => state.logic.myChat);
  const loading = useSelector((state) => state.logic.isActiveLoadingOverlay);
  const unreadMessageCount = useSelector((state) => state.auth.unreadMessageCount);

  // Local state
  const [myChat, setMyChat] = useState(myChatFromRedux);
  const [activeChatId, setActiveChatId] = useState(highlightChatId);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  // Search functionality
  const filteredChatKeys = useMemo(() => {
    const allKeys = Object.keys(myChat).sort((a, b) => {
      return myChat[a].updated_at < myChat[b].updated_at ? 1 : -1;
    });

    if (!searchQuery.trim()) {
      return allKeys;
    }

    const query = searchQuery.toLowerCase().trim();
    return allKeys.filter((key) => {
      const chat = myChat[key];
      return (
        chat.username?.toLowerCase().includes(query) ||
        chat.message?.toLowerCase().includes(query)
      );
    });
  }, [myChat, searchQuery]);

  // Search handlers
  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
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
    [isMobile, dispatch, navigate]
  );

  // Custom theme from your config
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  function formatDateShort(dateString) {
    const now = new Date();
    const date = new Date(dateString);
  
    if (!isValid(date)) return 'Invalid Date';
  
    const diffSeconds = differenceInSeconds(now, date);
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
  
    return isSameYear(date, now) ? format(date, 'd MMM') : format(date, 'd MMM yyyy');
  }

  // Calculate search results info
  const totalChats = Object.keys(myChat).length;
  const searchResultsCount = filteredChatKeys.length;
  const hasSearchResults = searchQuery.trim() && searchResultsCount > 0;
  const hasNoSearchResults = searchQuery.trim() && searchResultsCount === 0;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ borderRadius: '0.3em', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Search Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            color="error"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                },
                '&.Mui-focused': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 0 0 2px rgba(255, 0, 0, 0.2)',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon 
                    color="error" 
                    sx={{ 
                      fontSize: '1.2rem',
                      opacity: isSearchFocused ? 1 : 0.7,
                      transition: 'opacity 0.2s ease',
                    }} 
                  />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSearchClear}
                    color="error"
                    sx={{ 
                      padding: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <ClearIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Search Results Info */}
          {searchQuery.trim() && (
            <Fade in>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<PersonIcon />}
                  label={
                    hasNoSearchResults 
                      ? 'No conversations found'
                      : `${searchResultsCount} of ${totalChats} conversations`
                  }
                  size="small"
                  color={hasNoSearchResults ? 'default' : 'error'}
                  variant={hasNoSearchResults ? 'outlined' : 'filled'}
                  sx={{
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-icon': {
                      fontSize: '0.9rem',
                    },
                  }}
                />
                {hasSearchResults && (
                  <Typography variant="caption" color="text.secondary">
                    for "{searchQuery}"
                  </Typography>
                )}
              </Box>
            </Fade>
          )}
        </Box>

        {/* Chat List */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {Object.keys(myChat).length === 0 && loading ? (
            <Box sx={{ p: 1 }}>
              {[...Array(5)].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
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
                    <Skeleton variant="text" width="30%" />
                  </Box>
                  <Box sx={{ mr: 1 }}>
                    <Skeleton variant="circular" width={24} height={20} sx={{ borderRadius: '12px' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              height: '100%', 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 0, 0, 0.6)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(255, 0, 0, 0.8)',
                },
              },
            }}>
              {filteredChatKeys.length === 0 && !loading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  {searchQuery.trim() ? (
                    <Fade in>
                      <Box>
                        <SearchIcon 
                          sx={{ 
                            fontSize: '3rem', 
                            color: 'text.disabled', 
                            mb: 2,
                            opacity: 0.5,
                          }} 
                        />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No conversations found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Try searching for a different username or message
                        </Typography>
                      </Box>
                    </Fade>
                  ) : (
                    <Fade in>
                      <Box>
                        <PersonIcon 
                          sx={{ 
                            fontSize: '3rem', 
                            color: 'text.disabled', 
                            mb: 2,
                            opacity: 0.5,
                          }} 
                        />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          Your inbox is empty
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Start a conversation to see it here
                        </Typography>
                      </Box>
                    </Fade>
                  )}
                </Box>
              ) : (
                filteredChatKeys.map((rowKey, index) => {
                  const rowData = myChat[rowKey];
                  const isActive = rowData._id === activeChatId;
                  
                  // Highlight search terms in username and message
                  const highlightText = (text, query) => {
                    if (!query.trim() || !text) return text;
                    
                    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const parts = text.split(regex);
                    
                    return parts.map((part, i) => 
                      regex.test(part) ? (
                        <Box
                          key={i}
                          component="span"
                          sx={{
                            backgroundColor: 'error.main',
                            color: 'error.contrastText',
                            px: 0.5,
                            borderRadius: '2px',
                            fontSize: 'inherit',
                            fontWeight: 'bold',
                          }}
                        >
                          {part}
                        </Box>
                      ) : part
                    );
                  };

                  return (
                    <Fade in timeout={100 * (index + 1)} key={rowKey}>
                      <Box
                        data-id={rowData._id}
                        data-avatar={rowData.avatar}
                        data-rank={rowData.totalWagered}
                        data-username={rowData.username}
                        onClick={openChat}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 1.5,
                          px: 2,
                          backgroundColor: isActive ? 'rgba(255, 0, 0, 0.1)' : 'inherit',
                          borderRight: isActive ? '4px solid' : 'none',
                          borderRightColor: 'error.main',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          '&:hover': { 
                            backgroundColor: isActive 
                              ? 'rgba(255, 0, 0, 0.15)' 
                              : 'action.hover',
                            transform: 'translateX(2px)',
                          },
                          '&:active': {
                            transform: 'translateX(1px)',
                          },
                        }}
                      >
                        {/* Avatar */}
                        <Box className="player" sx={{ mr: 2, position: 'relative', zIndex: 1 }}>
                          <Avatar
                            accessory={rowData.accessory}
                            rank={rowData.rank}
                            src={rowData.avatar}
                            elite={rowData.elite}
                            username={rowData.username}
                            user_id={rowData._id}
                            alt={`${rowData.username}'s avatar`}
                            darkMode={isDarkMode}
                            style={{ 
                              width: 40, 
                              height: 40,
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </Box>

                        {/* Message Content */}
                        <Box sx={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          mr: 2,
                          minWidth: 0, // Prevent flex item from overflowing
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: 'text.primary',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {highlightText(rowData.username, searchQuery)}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'text.secondary', 
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                            }}
                          >
                            {highlightText(
                              rowData.message.length > 30 
                                ? `${rowData.message.substring(0, 30)}...` 
                                : rowData.message,
                              searchQuery
                            )}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              textTransform: 'uppercase', 
                              color: 'text.disabled',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                            }}
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
                              color: 'error.contrastText',
                              borderRadius: '12px',
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              minWidth: 20,
                              height: 20,
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(255, 0, 0, 0.3)',
                              animation: rowData.unread_message_count > 0 ? 'pulse 2s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': {
                                  boxShadow: '0 2px 4px rgba(255, 0, 0, 0.3)',
                                },
                                '50%': {
                                  boxShadow: '0 2px 8px rgba(255, 0, 0, 0.6)',
                                },
                                '100%': {
                                  boxShadow: '0 2px 4px rgba(255, 0, 0, 0.3)',
                                },
                              },
                            }}
                          >
                            {rowData.unread_message_count > 99 ? '99+' : rowData.unread_message_count}
                          </Box>
                        )}
                      </Box>
                    </Fade>
                  );
                })
              )}
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default MyChat;