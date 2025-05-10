import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getChatRoomInfo,
  addChatLog,
  getMyChat,
  loadOlderChatMessages,
} from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPenSquare } from '@fortawesome/free-solid-svg-icons';
import { InsertEmoticon } from '@mui/icons-material';

import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

import Avatar from '../../components/Avatar'; // Assuming Avatar is memoized or simple
import PlayerModal from '../modal/PlayerModal'; // Assuming PlayerModal is memoized or handles its own state well
import Footer from '../main_pages/Footer'; // Assuming Footer is memoized
import ChatPanel from '../ChatPanel/ChatPanel'; // Assuming ChatPanel is memoized

import {
  Button,
  InputAdornment,
  Popover,
  Typography,
  Drawer,
  Box,
  Skeleton,
  TextField,
  CircularProgress,
} from '@mui/material';

// ---------- CONSTANTS ----------
const SCROLL_LOAD_THRESHOLD = 20; // Pixels from top to trigger loading older messages
const SCROLL_NEAR_BOTTOM_THRESHOLD = 50; // Pixels from bottom to be considered "at bottom"
const CHAT_HEADER_DESKTOP_OPEN_DRAWER_OFFSET = '610px';
const CHAT_HEADER_DESKTOP_CLOSED_DRAWER_OFFSET = '350px';
const CHAT_LOG_SKELETON_COUNT = 5;

// ---------- HELPER COMPONENTS (can be moved to separate files) ----------

/**
 * @param {object} props
 * @param {string} props.emoji
 * @param {function(string): void} props.onSelect
 */
const EmojiItem = memo(({ emoji, onSelect }) => (
  <Box
    sx={{
      cursor: 'pointer',
      fontSize: '1.5rem',
      '&:hover': { opacity: 0.7 },
    }}
    onClick={() => onSelect(emoji)}
    role="button"
    aria-label={`emoji ${emoji}`}
  >
    {emoji}
  </Box>
));

/**
 * @param {object} props
 * @param {function(string): void} props.onSelectEmoji
 */
const PopoverEmojiGrid = memo(({ onSelectEmoji }) => {
  const emojis = [
    '🤬', '🖕', '🖕🏿', '🖕🏽', '🖕🏻', '😀', '😂', '🤣', '😃', '😄',
    '😁', '😆', '🙂', '🙃', '😉', '😊', '😇', '😍', '😘', '😜',
    '😎', '🤩', '😤', '😡', '🤯', '🥶', '😱', '🥵', '🤔', '🤓',
    '🤑', '🤠', '🥳', '💩', '💵', '💸', '💰', '🍀', '🏦',
  ];

  return (
    <Box
      sx={{ p: 2, maxWidth: 200, display: 'flex', flexWrap: 'wrap', gap: 1 }}
    >
      {emojis.map((emoji) => (
        <EmojiItem key={emoji} emoji={emoji} onSelect={onSelectEmoji} />
      ))}
    </Box>
  );
});

/**
 * @param {object} props
 * @param {object} props.messageData
 * @param {string} props.currentUserId
 * @param {function(string): void} props.onOpenPlayerModal
 * @param {string} props.chatPartnerUserId // ID of the other user in the chat
 */
const ChatMessageItem = memo(({ messageData, currentUserId, onOpenPlayerModal, chatPartnerUserId }) => {
  const isMyMessage = messageData.from === currentUserId;

  const handleAvatarClick = useCallback(() => {
    if (isMyMessage) {
      onOpenPlayerModal(currentUserId);
    } else {
      // For other messages, open the profile of the sender of that message.
      // If this is a 1-on-1 chat, messageData.from should be chatPartnerUserId.
      onOpenPlayerModal(messageData.from);
    }
  }, [isMyMessage, onOpenPlayerModal, currentUserId, messageData.from]);

  return (
    <Box
      className={isMyMessage ? 'my-message' : 'other-message'}
      sx={{ 
        mb: 2, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMyMessage ? 'flex-end' : 'flex-start',
      }}
    >
      <Box 
        className="message-content" 
        sx={{
          p: 1,
          borderRadius: '10px',
          bgcolor: isMyMessage ? 'firebrick' : 'grey.700', // Example colors
          color: isMyMessage ? 'primary.contrastText' : 'common.white',
          maxWidth: '70%',
        }}
      >
        {messageData.message}
      </Box>
      <Box
        className="message-header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.8em',
          mt: 0.5,
          color: 'text.secondary'
        }}
      >
        {/* You might want to show sender's name/avatar here for group chats */}
        {/* For 1-on-1, it's implicit. If you want to add timestamps: */}
        {/* <Box className="message-time">{formatCustomDate(messageData.created_at)}</Box> */}
        {/* The original code had empty Box onClick here, which wasn't ideal. */}
        {/* Clicking the content or a dedicated avatar (if shown) is better. */}
      </Box>
    </Box>
  );
});


/**
 * @param {object} props
 * @param {Array<object>} props.chatLogs
 * @param {string} props.currentUserId
 * @param {string} props.chatPartnerUserId
 * @param {function(string): void} props.onOpenPlayerModal
 * @param {boolean} props.isFetchingOlderMessages
 * @param {boolean} props.isLoadingRoom
 * @param {React.RefObject<HTMLDivElement>} props.chatLogPanelRef
 * @param {(event: React.UIEvent<HTMLDivElement>) => void} props.onScroll
 */
const ChatLogDisplay = memo(({
  chatLogs,
  currentUserId,
  chatPartnerUserId,
  onOpenPlayerModal,
  isFetchingOlderMessages,
  isLoadingRoom,
  chatLogPanelRef,
  onScroll,
}) => {
  if (isLoadingRoom) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(CHAT_LOG_SKELETON_COUNT)].map((_, index) => (
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
            <Skeleton variant="rectangular" height={40} width="60%" sx={{ borderRadius: '10px' }} />
            <Skeleton variant="text" width="30%" height={15} sx={{ borderRadius: 1, mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      className="chat-log-panel"
      ref={chatLogPanelRef}
      sx={{
        position: 'relative',
        overflowY: 'auto',
        flex: 1,
        p: 2,
        minHeight: 300, // Or dynamic based on screen
        maxHeight: 'calc(100vh - 200px)', // Adjust based on header/footer/input height
      }}
      onScroll={onScroll}
    >
      {isFetchingOlderMessages && (
        <Box
          sx={{
            position: 'sticky', // Changed from absolute to sticky
            top: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            py: 1,
            zIndex: 1, // Ensure it's above messages
            backgroundColor: (theme) => theme.palette.background.default, // Match background
          }}
        >
          <CircularProgress color="error" size={36} />
        </Box>
      )}
      {chatLogs.map((log) => (
        <ChatMessageItem
          key={log._id || log.timestamp} // Ensure a stable key, e.g., message ID
          messageData={log}
          currentUserId={currentUserId}
          chatPartnerUserId={chatPartnerUserId}
          onOpenPlayerModal={onOpenPlayerModal}
        />
      ))}
    </Box>
  );
});

/**
 * @param {object} props
 * @param {boolean} props.isDrawerOpen
 * @param {function(): void} props.onNavigateBack
 * @param {function(string): void} props.onOpenPlayerModal
 * @param {string} props.chatPartnerUserId
 * @param {string} props.chatPartnerAvatar
 * @param {string} props.chatPartnerRank
 * @param {string} props.chatPartnerUsername
 * @param {string} props.chatPartnerAccessory
 * @param {string} props.chatPartnerElite
 */
const ChatHeader = memo(({
  isDrawerOpen,
  onNavigateBack,
  onOpenPlayerModal,
  chatPartnerUserId,
  chatPartnerAvatar,
  chatPartnerRank,
  chatPartnerUsername,
  chatPartnerAccessory,
  chatPartnerElite,
}) => {
  const handleUserClick = useCallback(() => {
    if (chatPartnerUserId) {
      onOpenPlayerModal(chatPartnerUserId);
    }
  }, [chatPartnerUserId, onOpenPlayerModal]);

  return (
    <Box
      className="chat-header title"
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid rgba(255,255,255,0.1)', // Adjust for theme
        position: 'sticky', // Make header sticky
        top: 0,
        backgroundColor: (theme) => theme.palette.background.paper, // Match theme
        zIndex: 10,
      }}
    >
      <Button
        variant="text"
        color="error"
        onClick={onNavigateBack}
        sx={{ position: 'absolute', left: '15px' }} // Consider responsive adjustments
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        &nbsp;Go Back
      </Button>
      {chatPartnerUsername && ( // Only show if there's a chat partner
        <Box
          onClick={handleUserClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1, // Allow it to take space
            justifyContent: 'center'
          }}
          className="player"
        >
          <Avatar
            src={chatPartnerAvatar}
            rank={chatPartnerRank}
            username={chatPartnerUsername}
            accessory={chatPartnerAccessory}
            elite={chatPartnerElite}
            user_id={chatPartnerUserId} // Keep user_id if Avatar component expects it
            className="avatar" // Pass className if Avatar uses it
          />
          <Typography component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            {chatPartnerUsername}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

/**
 * @param {object} props
 * @param {string} props.text
 * @param {function(string): void} props.onTextChange
 * @param {function(): void} props.onSendMessage
 * @param {(event: React.KeyboardEvent<HTMLDivElement>) => void} props.onTextAreaKeyDown
 * @param {(event: React.MouseEvent<HTMLElement>) => void} props.onEmojiIconClick
 * @param {boolean} props.isEmojiPopoverOpen
 * @param {HTMLElement | null} props.emojiAnchorEl
 * @param {function(): void} props.onEmojiPopoverClose
 * @param {function(string): void} props.onInsertEmoji
 */
const ChatInputArea = memo(({
  text,
  onTextChange,
  onSendMessage,
  onTextAreaKeyDown,
  onEmojiIconClick,
  isEmojiPopoverOpen,
  emojiAnchorEl,
  onEmojiPopoverClose,
  onInsertEmoji,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        borderTop: '1px solid rgba(255,255,255,0.1)', // Adjust for theme
        backgroundColor: (theme) => theme.palette.background.paper, // Match theme
        position: 'sticky', // Make input area sticky
        bottom: 0,
        zIndex: 10,
      }}
    >
      <TextField
        type="text"
        variant="filled"
        color="error" // Or primary, secondary based on theme
        placeholder="CHAT HERE..."
        onKeyDown={onTextAreaKeyDown}
        onChange={(e) => onTextChange(e.target.value)}
        value={text}
        sx={{ flex: 1, mr: 1 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button
                variant="outlined"
                color="error" // Or primary
                onClick={onEmojiIconClick}
                aria-haspopup="true"
                aria-expanded={isEmojiPopoverOpen}
                aria-label="Open emoji picker"
              >
                <InsertEmoticon sx={{ fontSize: '18px' }} />
              </Button>
              <Popover
                open={isEmojiPopoverOpen}
                anchorEl={emojiAnchorEl}
                onClose={onEmojiPopoverClose}
                elevation={1} // Slight elevation might look better
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Adjusted for typical emoji popover
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Adjusted
              >
                <PopoverEmojiGrid onSelectEmoji={onInsertEmoji} />
              </Popover>
            </InputAdornment>
          ),
        }}
        multiline // Allow multiline for better chat experience
        maxRows={4} // Limit growth
      />
      <Button
        onClick={onSendMessage}
        variant="contained" // Contained might be more prominent for send
        color="error" // Or primary
        startIcon={<FontAwesomeIcon icon={faPenSquare} />}
        disabled={!text.trim()} // Disable if text is empty
      >
        <Typography variant="button">Send</Typography> {/* Text instead of [⏎] for clarity */}
      </Button>
    </Box>
  );
});


// ---------- MAIN CHAT PAGE COMPONENT ----------
function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  // ---------- REDUX STATE ----------
  const {
    currentUser,
    socket,
    isAuthenticated,
    chatPartnerUserId,
    chatPartnerAvatar,
    chatPartnerRank,
    chatPartnerAccessory,
    chatPartnerElite,
    chatPartnerUsername,
    chatLogs,
    hasMoreMessages,
    isMobile,
    isDrawerOpen,
    isDarkMode,
    selectedMobileTab,
    isLoadingRoom,
    isFetchingOlderMessages,
  } = useSelector((state) => ({
    // Current user info
    currentUser: state.auth.user,
    socket: state.auth.socket,
    isAuthenticated: state.auth.isAuthenticated,

    // Chat partner info (from chatRoomInfo)
    chatPartnerUserId: state.logic.chatRoomInfo.user_id,
    chatPartnerAvatar: state.logic.chatRoomInfo.avatar,
    chatPartnerRank: state.logic.chatRoomInfo.rank,
    chatPartnerAccessory: state.logic.chatRoomInfo.accessory,
    chatPartnerElite: state.logic.chatRoomInfo.elite,
    chatPartnerUsername: state.logic.chatRoomInfo.username,
    
    // Chat specific data
    chatLogs: state.logic.chatRoomInfo.chatLogs || [],
    hasMoreMessages: state.logic.chatRoomInfo.hasMore,

    // UI and App state
    isMobile: state.logic.is_mobile, // will be converted to boolean if not already
    isDrawerOpen: state.auth.isDrawerOpen,
    isDarkMode: state.auth.isDarkMode,
    selectedMobileTab: state.logic.selectedMobileTab,
    
    // Loading states
    isLoadingRoom: state.logic.isActiveLoadingOverlay,
    isFetchingOlderMessages: state.logic.fetchingOlder,
  }));

  // ---------- LOCAL STATE ----------
  const [text, setText] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null); // For PlayerModal
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  // ---------- REFS ----------
  const chatLogPanelRef = useRef(null);
  const oldScrollHeightRef = useRef(0); // To store scrollHeight before prepending old messages

  // ---------- EFFECTS ----------

  // Initial room load and fetching current user's chats
  useEffect(() => {
    if (routeId) {
      dispatch(getChatRoomInfo(routeId, 0, 20)); // page 0, limit 20 (example)
      if (isAuthenticated) {
        dispatch(getMyChat());
      }
    }
  }, [routeId, dispatch, isAuthenticated]);

  // Scroll management effect
  useEffect(() => {
    const panel = chatLogPanelRef.current;
    if (!panel) return;

    if (!isFetchingOlderMessages && oldScrollHeightRef.current > 0) {
      // Restore scroll position after older messages are loaded
      const newScrollHeight = panel.scrollHeight;
      panel.scrollTop = newScrollHeight - oldScrollHeightRef.current;
      oldScrollHeightRef.current = 0; // Reset ref
    } else if (isUserAtBottom && chatLogs.length > 0 && !isLoadingRoom) {
      // Auto-scroll to bottom for new messages if user was at the bottom
      // Use timeout to ensure DOM has updated
      const timerId = setTimeout(() => {
        panel.scrollTop = panel.scrollHeight;
      }, 0);
      return () => clearTimeout(timerId);
    }
  }, [chatLogs, isFetchingOlderMessages, isUserAtBottom, isLoadingRoom]);


  // ---------- EVENT HANDLERS & METHODS (useCallback for optimization) ----------

  const handleScroll = useCallback((event) => {
    const panel = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = panel;

    const atBottom = scrollHeight - (scrollTop + clientHeight) < SCROLL_NEAR_BOTTOM_THRESHOLD;
    setIsUserAtBottom(atBottom);

    // Load older messages if scrolled to top and more messages are available
    if (scrollTop < SCROLL_LOAD_THRESHOLD && hasMoreMessages && !isFetchingOlderMessages) {
      oldScrollHeightRef.current = scrollHeight; // Store current scroll height
      dispatch(loadOlderChatMessages(routeId));
    }
  }, [dispatch, routeId, hasMoreMessages, isFetchingOlderMessages]);

  const sendMessage = useCallback(() => {
    const trimmedText = text.trim();
    if (trimmedText && currentUser?._id && chatPartnerUserId) {
      const chatMessage = {
        to: chatPartnerUserId, // Send to the other user in the chat
        from: currentUser._id,
        message: trimmedText,
        is_read: false, // Or handle read status appropriately
        // timestamp: new Date().toISOString(), // Consider adding client-side timestamp if needed
      };
      dispatch(addChatLog(chatMessage));

      if (socket) {
        socket.emit('SEND_CHAT', chatMessage);
      }
      setText('');
      setEmojiAnchorEl(null); // Close emoji popover
    }
  }, [text, currentUser, chatPartnerUserId, dispatch, socket]);

  const handleTextAreaKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Send on Enter, new line on Shift+Enter
      event.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleEmojiIconClick = useCallback((event) => {
    setEmojiAnchorEl(event.currentTarget);
  }, []);

  const handleEmojiPopoverClose = useCallback(() => {
    setEmojiAnchorEl(null);
  }, []);

  const handleInsertEmoji = useCallback((emoji) => {
    setText((prevText) => prevText + emoji);
    // setEmojiAnchorEl(null); // Optionally close popover after selection
  }, []);

  const handleToggleDrawer = useCallback(() => {
    dispatch(toggleDrawer(!isDrawerOpen));
  }, [dispatch, isDrawerOpen]);

  const handleOpenPlayerModal = useCallback((playerId) => {
    setSelectedPlayerId(playerId);
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
    setSelectedPlayerId(null);
  }, []);
  
  const handleNavigateBack = useCallback(() => {
    navigate('/');
  }, [navigate]);


  // ---------- THEME ----------
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const isEmojiPopoverOpen = Boolean(emojiAnchorEl);

  // ---------- RENDER ----------
  return (
    <ThemeProvider theme={theme}>
      <Box className="main-game" sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {showPlayerModal && selectedPlayerId && (
          <PlayerModal
            selectedCreator={selectedPlayerId} // Prop name from original
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        {isMobile && selectedMobileTab === 'chat' && (
          <Drawer
            className="mat-chat" // Keep existing class if styles depend on it
            sx={{ display: isDrawerOpen ? 'flex' : 'none' }} // Or manage open via sx only
            variant="persistent"
            anchor="left"
            open={isDrawerOpen}
          >
            <ChatPanel
              is_mobile={isMobile} // Prop name from original
              toggleDrawer={handleToggleDrawer}
            />
          </Drawer>
        )}

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' /* Prevents page scroll */ }}>
          {/* Sidebar area if any - not shown in original snippet for main chat view */}
          {/* Main Chat Area */}
          <Box
            className="chat-page-container" // New wrapper for better structure
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%', // Ensure it takes full height of its flex container
            }}
          >
            <ChatHeader
              isDrawerOpen={isDrawerOpen}
              onNavigateBack={handleNavigateBack}
              onOpenPlayerModal={handleOpenPlayerModal}
              chatPartnerUserId={chatPartnerUserId}
              chatPartnerAvatar={chatPartnerAvatar}
              chatPartnerRank={chatPartnerRank}
              chatPartnerUsername={chatPartnerUsername}
              chatPartnerAccessory={chatPartnerAccessory}
              chatPartnerElite={chatPartnerElite}
            />

            <ChatLogDisplay
              chatLogs={chatLogs}
              currentUserId={currentUser?._id}
              chatPartnerUserId={chatPartnerUserId}
              onOpenPlayerModal={handleOpenPlayerModal}
              isFetchingOlderMessages={isFetchingOlderMessages}
              isLoadingRoom={isLoadingRoom}
              chatLogPanelRef={chatLogPanelRef}
              onScroll={handleScroll}
            />

            <ChatInputArea
              text={text}
              onTextChange={setText}
              onSendMessage={sendMessage}
              onTextAreaKeyDown={handleTextAreaKeyDown}
              onEmojiIconClick={handleEmojiIconClick}
              isEmojiPopoverOpen={isEmojiPopoverOpen}
              emojiAnchorEl={emojiAnchorEl}
              onEmojiPopoverClose={handleEmojiPopoverClose}
              onInsertEmoji={handleInsertEmoji}
            />
          </Box>
        </Box>
      </Box>
      {/* Footer might be outside the main flex scroll if it's fixed at page bottom */}
      <Footer className="footer" open={isDrawerOpen} />
    </ThemeProvider>
  );
}

export default ChatPage;