import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';

import {
  getChatRoomInfo,
  addChatLog,
  getMyChat,
  getMyHistory,
  getGameTypeList,
  loadRoomInfo,
  setCurRoomInfo
} from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPenSquare } from '@fortawesome/free-solid-svg-icons';

import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import DrawerButton from '../main_pages/DrawerButton';
import Footer from '../main_pages/Footer';
import ChatPanel from '../ChatPanel/ChatPanel';
import {
  InsertEmoticon,
} from '@mui/icons-material';
import {
  Button,
  InputAdornment,
  Popover,
  Typography,
  Drawer,
  Box,
  Skeleton,
  TextField
} from '@mui/material';

const moment = require('moment');

function ChatPage(props) {
  const {
    // Redux props
    match,
    user_id,
    chatLogs,
    my_info,
    socket,
    is_mobile,
    isDrawerOpen,
    isAuthenticated,
    selectedMobileTab,
    selectedMainTabIndex,
    rank,
    accessory,
    avatar,
    username,
    loading,
    gameTypeList,
    isDarkMode,

    // Redux actions
    getChatRoomInfo,
    addChatLog,
    getMyChat,
    toggleDrawer,
  } = props;

  // ---------- LOCAL STATE ----------
  const [text, setText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null); // anchor for the Popover

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [show_open_game, setShowOpenGame] = useState(0);
  const { id: routeId } = match.params;

  // ---------- REFS ----------
  const chatLogPanelRef = useRef(null);
  const textareaRef = useRef(null);
  console.log("chatLogs", chatLogs)
  // componentDidMount equivalent
  useEffect(() => {
    const { id } = match.params;
    initializeRoomData(id);

    // When socket connects, request unread count
    if (socket) {
      socket.on('connect', () => {
        socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', {
          to: my_info?._id,
        });
      });
    }
    // eslint-disable-next-line
  }, []);


  // ...
  useEffect(() => {
    const { id } = match.params;
    if (id) {
      // Re-fetch chat data for this new "id"
      getChatRoomInfo(id);
    }
    scrollChatToBottom();

  }, [match.params.id, getChatRoomInfo]);

  // Scroll to bottom whenever chatLogs change
  useEffect(() => {
    scrollChatToBottom();
  }, [chatLogs]);

  // ---------- METHODS ----------

  const initializeRoomData = async (id) => {
    try {
      await getChatRoomInfo(id);
      if (isAuthenticated) {
        await getMyChat();
      }
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  };

  const scrollChatToBottom = () => {
    if (chatLogPanelRef.current) {
      chatLogPanelRef.current.scrollTop = chatLogPanelRef.current.scrollHeight;
    }
  };

  const openPopover = Boolean(anchorEl);

  // Called when user clicks the emoji icon (end adornment)
  const handleEmojiClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close the popover
  const handleEmojiClose = () => {
    setAnchorEl(null);
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  const onChangeText = (e) => {
    setText(e.target.value);
  };

  const onTextAreaKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleDrawerAction = () => {
    toggleDrawer(!isDrawerOpen);
  };

  const sendMessage = () => {
    const trimmed = text.trim();
    if (trimmed !== '') {
      const chatLog = {
        to: user_id,
        from: my_info?._id,
        message: trimmed,
        is_read: false,
        created_at: moment().format('MM-DD-YYYY HH:mm:ss')
      };
      addChatLog(chatLog);

      if (socket) {
        socket.emit('SEND_CHAT', chatLog);
      }
      setText('');
      setShowEmojiPanel(false);
    }
  };

  const handleOpenPlayerModal = (creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  function formatCustomDate(dateString) {
    const date = moment(dateString, 'MM-DD-YYYY HH:mm:ss');

    if (date.isSame(moment(), 'day')) {
      return `Today, ${date.format('h:mm a')}`;
    } else if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      return `Yesterday, ${date.format('h:mm a')}`;
    } else {
      return date.format('D MMM YYYY, h:mm a');
    }
  }

  // ---------- STYLING ----------
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <Box
        className="main-game"

      >
        {/* Player Modal */}
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        {/* Drawer for chat if mobile */}
        {is_mobile && selectedMobileTab === 'chat' && (
          <Drawer
            className="mat-chat"
            sx={{ display: isDrawerOpen ? 'flex' : 'none' }}
            variant="persistent"
            anchor="left"
            open={isDrawerOpen}
          >
            <ChatPanel is_mobile={is_mobile} toggleDrawer={toggleDrawerAction} />
          </Drawer>
        )}

        <Box
          sx={{
            mb: 2,
            background: 'rgba(170, 170, 170, 0.06)',
            borderRadius: '0.3em',
          }}
        >
          {/* Main Chat Layout */}
          <Box className="chat-page" sx={{ position: 'relative' }}>
            {/* Chat Header */}
            <Box
              className="chat-header title"
              sx={{
                width: isDrawerOpen ? 'calc(100% - 610px)' : 'calc(100% - 350px)',
                display: 'flex',
                alignItems: 'center',
                p: 1,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Button
                variant='text' color='error'
                onClick={() => {
                  history.push('/');
                }}

                sx={{ position: 'absolute', left: '15px' }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />&nbsp;
                Go Back
              </Button>
              <Box
                component="a"
                onClick={() => handleOpenPlayerModal(user_id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  cursor: 'pointer',
                  ml: 4,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                className='player'
              >
                <Avatar
                  src={avatar}
                  rank={rank}
                  username={username}
                  accessory={accessory}
                  className="avatar"
                />
                <Box component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                  {username}
                </Box>
              </Box>
            </Box>

            {/* Chat Log Panel */}
            <Box
              className="chat-log-panel"
              ref={chatLogPanelRef}
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                minHeight: 300,
                maxHeight: '60vh',
              }}
            >
              {!loading ? (
                <>
                  {chatLogs.map((row, idx) => (
                    <Box
                      key={idx}
                      className={
                        row.from === my_info?._id ? 'my-message' : 'other-message'
                      }
                      sx={{ mb: 2 }}
                    >
                      <Box className="message-content" sx={{ mb: 1 }}>
                        {row.message}
                      </Box>
                      <Box className="message-header" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8em' }}>
                        {row.from !== my_info?._id && (
                          <Box
                            onClick={() => handleOpenPlayerModal(user_id)}
                            sx={{ cursor: 'pointer', position: 'relative' }}
                          />
                        )}
                        <Box>
                          <Box className="message-time">{formatCustomDate(row.created_at)}
                          </Box>
                        </Box>
                        {row.from === my_info?._id && (
                          <Box
                            onClick={() => handleOpenPlayerModal(my_info?._id)}
                            sx={{ cursor: 'pointer', position: 'relative' }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </>
              ) : (
                // Skeleton placeholders while loading
                <Box>
                  {[...Array(5)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        mb: 2,
                        gap: 1,
                        alignItems: index % 2 === 0 ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Skeleton
                        variant="circular"
                        height={20}
                        width={60}
                        sx={{ borderRadius: '10px', alignSelf: 'flex-end' }}
                      />
                      <Skeleton
                        variant="text"
                        width={60}
                        height={15}
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Chat Input Panel */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >

              <TextField
                type="text"
                variant='filled'
                color="error"
                placeholder="CHAT HERE..."
                onKeyDown={onTextAreaKeyDown}
                onChange={onChangeText}
                value={text}
                inputRef={textareaRef}
                sx={{ flex: 1, mr: 1 }}

                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {/* Emoji Icon */}
                      <Button variant="outlined" color="error" onClick={handleEmojiClick}>
                        <InsertEmoticon sx={{ fontSize: "18px" }} />
                      </Button>
                      {/* Popover-based emoji panel */}
                      <Popover
                        open={openPopover}
                        anchorEl={anchorEl}
                        onClose={handleEmojiClose}
                        elevation='0'
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        TransitionProps={{
                          timeout: 0
                        }}
                        transformOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        sx={{
                          // optional styling
                        }}
                      >
                        <PopoverEmojiGrid onSelect={insertEmoji} />
                      </Popover>
                    </InputAdornment>
                  )
                }}
              />


              <Button
                onClick={sendMessage}
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faPenSquare} />}
                color='error'
              >
                <Typography variant="button">[&#x23CE;]</Typography>
              </Button>
            </Box>


          </Box>


        </Box>
      </Box>

      {/* Footer */}
      <Footer className="footer" open={isDrawerOpen} />
    </ThemeProvider>
  );
}

function PopoverEmojiGrid({ onSelect }) {
  // A small set of emojis for demonstration
  const emojis = ['🤬', '🖕', '🖕🏿', '🖕🏽', '🖕🏻', '😀', '😂', '🤣', '😀', '😃', '😄', '😁', '😆', '🤣', '😂', '🙂', '🙃', '😉',
    '😊', '😇', '😍', '😘', '😜', '😎', '🤩', '😤', '😡', '🤯', '🤬', '🥶', '😱', '🥵', '🤔', '🤓', '🤑', '🤠', '🥳', '💩',
    '💵', '💸', '💰', '🍀', '🏦',];

  return (
    <Box sx={{ p: 2, maxWidth: 200, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {emojis.map((emoji) => (
        <Box
          key={emoji}
          sx={{
            cursor: 'pointer',
            fontSize: '1.5rem',
            '&:hover': { opacity: 0.7 },
          }}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </Box>
      ))}
    </Box>
  );
}


// mapStateToProps remains the same
const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  my_info: state.auth.user,
  socket: state.auth.socket,
  user_id: state.logic.chatRoomInfo.user_id,
  avatar: state.logic.chatRoomInfo.avatar,
  rank: state.logic.chatRoomInfo.rank,
  accessory: state.logic.chatRoomInfo.accessory,
  username: state.logic.chatRoomInfo.username,
  chatLogs: state.logic.chatRoomInfo.chatLogs,
  gameTypeList: state.logic.gameTypeList,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  isDrawerOpen: state.auth.isDrawerOpen,
  isDarkMode: state.auth.isDarkMode,
  history: state.logic.history,
  loading: state.logic.isActiveLoadingOverlay,
  pageNumber: state.logic.pageNumber,
  is_mobile: state.logic.is_mobile, // Or however you track mobile
  selectedMobileTab: state.logic.selectedMobileTab,
});

const mapDispatchToProps = {
  getChatRoomInfo,
  addChatLog,
  getMyHistory,
  getGameTypeList,
  setCurRoomInfo,
  loadRoomInfo,
  getMyChat,
  toggleDrawer,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChatPage);