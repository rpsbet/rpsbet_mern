import React, { useState, useRef, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import axios from 'axios';
import Moment from 'moment';
import { getRank } from '../../util/getRank';
import Avatar from '../../components/Avatar';

import {
  Tabs,
  Tab,
  Button,
  InputAdornment,
  TextField,
  Box,
  CircularProgress,
  Popover,
  Typography,
  Skeleton,
} from '@mui/material';

import {
  InsertEmoticon,
  Gif,
  Clear,
  ChatOutlined,
  ChatBubbleOutlineOutlined,
} from '@mui/icons-material';

import GlobalChat from './GlobalChat';
import MyChat from './MyChat';
import { setFocused } from '../../redux/Auth/user.actions.js';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
// Import your custom theme generator
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

const emojis = [
  { command: ':bot:', url: '/img/emotes/brokenbot.webp', alt: 'broken bot' },
  { command: ':dance:', url: '/img/emotes/dance.webp', alt: 'dance' },
  { command: ':goofy:', url: '/img/emotes/goofy.webp', alt: 'goofy' },
  { command: ':cook:', url: '/img/emotes/cook.webp', alt: 'cook' },
  { command: ':catcute:', url: '/img/emotes/catcute.webp', alt: 'cat cute' },
  { command: ':gang:', url: '/img/emotes/gangSigns.webp', alt: 'gang signs' },
  { command: ':happy:', url: '/img/emotes/happy.webp', alt: 'happy' },
  { command: ':sus:', url: '/img/emotes/sus.webp', alt: 'sus' },
  {
    command: ':flatearth:',
    url: '/img/emotes/flatearth.webp',
    alt: 'flat earth',
  },
  { command: ':pepedance:', url: '/img/emotes/pepepe.webp', alt: 'pepe dance' },
  { command: ':leo:', url: '/img/emotes/leo.webp', alt: 'leo' },
  {
    command: ':wellyousee:',
    url: '/img/emotes/wellyousee.webp',
    alt: 'wellyousee',
  },
  { command: ':laugh:', url: '/img/emotes/laugh.webp', alt: 'laugh' },
  {
    command: ':randomemote:',
    url: '/img/emotes/randomemote.webp',
    alt: 'randomemote',
  },
  { command: ':rainbow:', url: '/img/emotes/rainbow.webp', alt: 'rainbow' },
  { command: ':cross:', url: '/img/emotes/cross.webp', alt: 'cross' },
  { command: ':nyancat:', url: '/img/emotes/nyancat.webp', alt: 'nyan cat' },
  { command: ':babycar:', url: '/img/emotes/babycar.webp', alt: 'baby car' },
  { command: ':sexykiss:', url: '/img/emotes/sexykiss.webp', alt: 'sexy kiss' },
  { command: ':sexyclap:', url: '/img/emotes/sexyclap.webp', alt: 'sexy clap' },
  {
    command: ':sexyfinger:',
    url: '/img/emotes/sexyfinger.webp',
    alt: 'sexy finger',
  },
  { command: ':pickle:', url: '/img/emotes/pickle.webp', alt: 'pickle' },
  {
    command: ':trooperbae:',
    url: '/img/emotes/trooperbae.webp',
    alt: 'storm trooper bae',
  },
  { command: ':catpop:', url: '/img/emotes/catpop.webp', alt: 'catpop' },
  { command: ':brother:', url: '/img/emotes/brother.webp', alt: 'brother' },
  { command: ':pepenou:', url: '/img/emotes/pepenou.webp', alt: 'pepenou' },
  { command: ':skibidi:', url: '/img/emotes/skibidi.webp', alt: 'skibidi' },
  { command: ':salute:', url: '/img/emotes/salute.webp', alt: 'salute' },
  {
    command: ':bananacat:',
    url: '/img/emotes/bananacat.webp',
    alt: 'banana cat',
  },
  { command: ':sadthink:', url: '/img/emotes/sadthink.webp', alt: 'sadthink' },
  { command: ':alien:', url: '/img/emotes/alien.webp', alt: 'alien' },
  { command: ':chad:', url: '/img/emotes/chad.webp', alt: 'chad' },
  { command: ':pog:', url: '/img/emotes/pog.webp', alt: 'pog' },
  { command: ':gift:', url: '/img/emotes/gift.webp', alt: 'gift' },
  { command: ':dababy:', url: '/img/emotes/dababy.webp', alt: 'dababy' },
  { command: ':dababyw:', url: '/img/emotes/dababyw.webp', alt: 'dababyw' },
  { command: ':poggies:', url: '/img/emotes/poggies.webp', alt: 'poggies' },
  { command: ':beg:', url: '/img/emotes/beg.webp', alt: 'beg' },
  { command: ':angry:', url: '/img/emotes/angry.webp', alt: 'angry' },
  { command: ':pepesad:', url: '/img/emotes/pepesad.webp', alt: 'pepesad' },
  { command: ':cry:', url: '/img/emotes/cry.webp', alt: 'cry' },
  { command: ':wutdog:', url: '/img/emotes/wutdog.webp', alt: 'wutdog' },
  { command: ':wut:', url: '/img/emotes/wut.webp', alt: 'wut' },
  { command: ':pogger:', url: '/img/emotes/pogger.webp', alt: 'pogger' },
  {
    command: ':pleasecat:',
    url: '/img/emotes/pleasecat.webp',
    alt: 'please cat',
  },
  { command: ':nocap:', url: '/img/emotes/nocap.webp', alt: 'nocap' },
  { command: ':mexican:', url: '/img/emotes/mexican.webp', alt: 'cat' },
  { command: ':mike:', url: '/img/emotes/mike.webp', alt: 'mike' },
  { command: ':kekw:', url: '/img/emotes/kekw.webp', alt: 'kekw' },
  { command: ':butwhy:', url: '/img/emotes/butwhy.webp', alt: 'butwhy' },
  { command: ':sui:', url: '/img/emotes/sui.webp', alt: 'sui' },
  { command: ':lucky:', url: '/img/emotes/lucky.webp', alt: 'lucky' },
  { command: ':hodl:', url: '/img/emotes/hodl.webp', alt: 'hodl' },
  { command: ':doge:', url: '/img/emotes/doge.webp', alt: 'doge' },
  { command: ':3head:', url: '/img/emotes/3head.webp', alt: '3head' },
  { command: ':check:', url: '/img/emotes/check.webp', alt: 'check' },
  { command: ':pepetypo:', url: '/img/emotes/pepetypo.webp', alt: 'pepe typo' },
  { command: ':kirby:', url: '/img/emotes/kirby.webp', alt: 'kirby' },
  { command: ':wow:', url: '/img/emotes/wow.webp', alt: 'wow' },
  { command: ':cat:', url: '/img/emotes/cat.webp', alt: 'cat' },
  {
    command: ':moneypepe:',
    url: '/img/emotes/moneypepe.webp',
    alt: 'moneypepe',
  },
  { command: ':truemf:', url: '/img/emotes/truemf.webp', alt: 'truemf' },
  { command: ':hattip:', url: '/img/emotes/hattip.webp', alt: 'hat tip' },
  { command: ':simp:', url: '/img/emotes/simp.webp', alt: 'simp' },
  { command: ':1x:', url: '/img/emotes/1x.webp', alt: '1x' },
  { command: ':fortnite:', url: '/img/emotes/fortnite.webp', alt: 'fortnite' },
  { command: ':kodak:', url: '/img/emotes/kodak.webp', alt: 'kodak' },
  { command: ':ain:', url: '/img/emotes/ain.webp', alt: 'ain' },
  { command: ':troll:', url: '/img/emotes/troll.webp', alt: 'troll' },
  {
    command: ':minecraftcookie:',
    url: '/img/emotes/minecraftcookie.webp',
    alt: 'minecraftcookie',
  },
];

// Instead of filling with the same reference, create individual objects:
const initialGifState = { loaded: false, url: '', title: '' };

function ChatPanel(props) {
  const {
    isAuthenticated,
    isDarkMode,
    userName,
    user,
    socket,
    onlineUserList,
    is_mobile,
    toggleDrawer,
    setFocused,
    highlightChatId,
  } = props;

  // ------------------ LOCAL STORAGE ------------------
  // 1) Retrieve a previously stored tab index OR default to 1
  const storedTabIndex = localStorage.getItem('selectedTabIndex');
  const initialTabIndex =
    storedTabIndex !== null ? parseInt(storedTabIndex, 10) : 1;

  // ------------------ LOCAL STATE ------------------
  const [selectedTabIndex, setSelectedTabIndex] = useState(initialTabIndex);
  const [text, setText] = useState('');

  // Popover anchor states
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [gifAnchorEl, setGifAnchorEl] = useState(null);

  // Initialize with a new array of 10 distinct objects (not just .fill() of the same object)
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState({
    sender: null,
    avatar: null,
    rank: null,
    accessory: null,
    message: null,
    messageType: null,
    time: null,
  });
  const [hoverTabIndex, setHoverTabIndex] = useState(-1);
  const dispatch = useDispatch();

  // Reference to the TextField for focusing after inserting emoji
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('selectedTabIndex', selectedTabIndex);
  }, [selectedTabIndex]);

  // ------------------ EVENT HANDLERS ------------------

  const onTextAreaKeyDown = (e) => {
    e.stopPropagation();
    if (!socket) return;

    if (user && user._id) {
      if (e.keyCode === 13) {
        e.preventDefault();
        const trimmedText = text.trim();
        if (trimmedText !== '') {
          socket.emit('GLOBAL_CHAT_SEND', {
            sender: userName,
            senderId: user._id,
            message: trimmedText,
            avatar: user.avatar,
            accessory: user.accessory,
            replyTo: selectedMessage,
            rank: user.totalWagered,
          });
          handleClearTooltip();
          handleCloseEmojiPopover();
          handleCloseGifPopover();
        }
      }
    } else {
      dispatch(errorMsgBar('FURR-SST LOG IN!'));
      return;
    }
  };

  const handleClearTooltip = () => {
    setSelectedMessage({
      sender: null,
      avatar: null,
      accessory: null,
      rank: null,
      message: null,
      messageType: null,
      time: null,
    });
    setText(''); // Clear the text field input
  };

  const handleMouseEnter = (index) => {
    setHoverTabIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverTabIndex(-1);
  };

  // ------------------ EMOJI POPOVER ------------------
  const handleEmojiClick = (event) => {
    // If popover is already open, close it
    if (emojiAnchorEl) {
      handleCloseEmojiPopover();
    } else {
      setEmojiAnchorEl(event.currentTarget);
    }
  };

  const handleCloseEmojiPopover = () => {
    setEmojiAnchorEl(null);
  };

  const openEmojiPopover = Boolean(emojiAnchorEl);

  const insertEmoji = (emojiCommand) => {
    const foundEmoji = emojis.find((emoji) => emoji.command === emojiCommand);
    if (foundEmoji) {
      const updatedText = text + foundEmoji.command;
      setText(updatedText);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // ------------------ GIF POPOVER ------------------
  const handleGifButtonClick = (event) => {
    // If popover is already open, close it
    if (gifAnchorEl) {
      handleCloseGifPopover();
    } else {
      setGifAnchorEl(event.currentTarget);
    }
  };

  const handleCloseGifPopover = () => {
    setGifAnchorEl(null);
  };

  const openGifPopover = Boolean(gifAnchorEl);

  const handleGifClick = (gifUrl) => {
    if (user && user._id) {
      if (socket) {
        const message = {
          type: 'gif',
          content: gifUrl,
        };
        socket.emit('GLOBAL_CHAT_SEND', {
          sender: userName,
          senderId: user._id,
          message: JSON.stringify(message),
          rank: user.totalWagered,
          avatar: user.avatar,
          accessory: user.accessory,
          messageType: 'gif',
        });
        handleCloseGifPopover();
        handleCloseEmojiPopover();
      }
    } else {
      dispatch(errorMsgBar('FURR-SST LOG IN!'));
      return;
    }
  };

  /**
   * Called once an <img> finishes loading.
   */
  const handleGifLoad = (index) => {
    setGifs((prevGifs) => {
      const updated = [...prevGifs];
      updated[index] = {
        ...updated[index],
        loaded: true,
      };
      return updated;
    });
  };

  const handleSearchInputChange = async (event) => {
    const searchTerm = event.target.value.trim();
    const apiKey = 'EoYYQ1kbX7mRfqwJ6xC4M6wgQmds4Dq1'; // Replace with your Giphy API key
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${searchTerm}`;

    try {
      setLoading(true);

      // If user clears input, you could handle that separately, e.g. set empty array
      if (!searchTerm) {
        setGifs([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(url);
      const fetchedGifs = response.data.data.map((gif) => ({
        ...initialGifState,
        url: gif.images.fixed_height.url,
        title: gif.title,
      }));

      setGifs(fetchedGifs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setLoading(false);
    }
  };

  // ------------------ COMMON HANDLERS ------------------

  const onChangeText = (e) => {
    setText(e.target.value);
  };

  const onFocusHandler = () => {
    setFocused(true);
  };

  const onBlurHandler = () => {
    setFocused(false);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTabIndex(newValue);
  };

  // ------------------ RENDER ------------------

  const isChatEnabled = isAuthenticated && getRank(user?.totalWagered) >= 1;
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <Box
        className="chat-wrapper"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 1,
          bgcolor: '#1E272E', // override background
          color: 'white', // default text color
          border: '0',
        }}
      >
        {/* Tabs Section */}
        <Tabs
  value={selectedTabIndex}
  onChange={handleTabChange}
  TabIndicatorProps={{
    style: {
      backgroundColor: 'red',
    },
  }}
  sx={{
    '& .MuiTab-root': {
      textTransform: 'none',
      color: 'white',
      '& .MuiTab-iconWrapper': {
        color: 'grey',
        transition: 'color 0.3s ease',
      },
      '&:hover .MuiTab-iconWrapper': {
        color: 'white',
      },
      '&.Mui-selected': {
        color: 'white',
        '& .MuiTab-iconWrapper': {
          color: 'red',
        },
      },
      // Attempt 1: Target the label directly
      '& .MuiTab-label': {
        marginBottom: '8px !important', // Force with !important
      },
      // Attempt 2: Adjust padding of the tab content
      paddingBottom: '8px', // Adds space below the entire tab content
    },
  }}
>
  {/* Inbox Tab */}
  <Tab
    className="custom-tab"
    label={
      <span style={{ marginBottom: '8px', display: 'inline-block' }}>
        Inbox
      </span>
    } // Attempt 3: Wrap label in a span with inline style
    icon={
      <ChatOutlined
        sx={{
          color: hoverTabIndex === 0 || selectedTabIndex === 0 ? 'white' : 'grey',
          transition: 'color 0.3s ease',
        }}
      />
    }
    sx={{
      '&:hover .MuiTab-iconWrapper': {
        color: 'white',
      },
    }}
    onMouseEnter={() => handleMouseEnter(0)}
    onMouseLeave={handleMouseLeave}
  />

  {/* Chat Tab */}
  <Tab
    className="custom-tab"
    label={
      <span style={{ marginBottom: '8px', display: 'inline-block' }}>
        Chat
      </span>
    } // Attempt 3: Wrap label in a span with inline style
    icon={
      <ChatBubbleOutlineOutlined
        sx={{
          color: hoverTabIndex === 1 || selectedTabIndex === 1 ? 'white' : 'grey',
          transition: 'color 0.3s ease',
        }}
      />
    }
    sx={{
      '&:hover .MuiTab-iconWrapper': {
        color: 'white',
      },
    }}
    onMouseEnter={() => handleMouseEnter(1)}
    onMouseLeave={handleMouseLeave}
  />
</Tabs>
        {/* Tab Content */}
        {selectedTabIndex === 0 ? (
          <MyChat
            highlightChatId={highlightChatId}
            is_mobile={is_mobile}
            toggleDrawer={toggleDrawer}
          />
        ) : (
          <GlobalChat
            emojis={emojis}
            setSelectedMessage={setSelectedMessage}
            selectedMessage={selectedMessage}
            onlineUserList={onlineUserList}
          />
        )}

        {/* Chat Input Section (only for Chat tab) */}
        {selectedTabIndex === 1 && (
          <Box className="chat-input-panel" sx={{ mt: 2 }}>
            {selectedMessage && selectedMessage.sender && (
              <Box
                sx={{
                  bottom: '60px',
                  p: 1,
                  zIndex: 1,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  position: 'absolute',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ mr: 1, fontSize: 'small' }}>Reply to:</Box>
                  <Box
                    className="player"
                    sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
                  >
                    <Avatar
                      rank={selectedMessage.rank}
                      accessory={selectedMessage.accessory}
                      src={selectedMessage.avatar}
                      username={selectedMessage.sender}
                      user_id={selectedMessage.senderId}
                      alt="Avatar"
                    />
                  </Box>
                  <Box sx={{ flex: 1, fontSize: 'small', mr: '10px' }}>
                    {selectedMessage.sender}
                  </Box>
                  <Button
                    onClick={handleClearTooltip}
                    color="error"
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: '32px' }}
                  >
                    <Clear />
                  </Button>
                </Box>
              </Box>
            )}

            <TextField
              color="error"
              type="text"
              className="form-control"
              variant="filled"
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              onKeyDown={onTextAreaKeyDown}
              placeholder={isChatEnabled ? 'CHAT HERE...' : 'VETS ONLY'}
              onChange={onChangeText}
              value={text}
              inputRef={textareaRef}
              disabled={!isChatEnabled}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ minWidth: '80px' }}>
                    <Button
                      onClick={handleEmojiClick}
                      color="error"
                      variant="outlined"
                      sx={{ minWidth: '32px', height: '32px', mr: 1 }}
                    >
                      <InsertEmoticon style={{ fontSize: '18px' }} />
                    </Button>
                    <Button
                      onClick={handleGifButtonClick}
                      color="error"
                      variant="outlined"
                      sx={{ minWidth: '32px', height: '32px' }}
                    >
                      <Gif style={{ fontSize: '24px' }} />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            {/* Emoji Popover */}
            <Popover
              open={openEmojiPopover}
              elevation={0}
              anchorEl={emojiAnchorEl}
              onClose={handleCloseEmojiPopover}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transitionDuration={0}
              PaperProps={{
                sx: {
                  p: 1,
                  borderRadius: 1,
                  maxWidth: '200px',
                  overflowY: 'auto',
                  bgcolor: 'background.default',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {emojis.map((emojiItem) => (
                  <Box
                    key={emojiItem.command}
                    component="img"
                    src={emojiItem.url}
                    alt={emojiItem.alt}
                    onClick={() => insertEmoji(emojiItem.command)}
                    sx={{
                      width: '30px',
                      height: '30px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>
            </Popover>

            {/* GIF Popover */}
            <Popover
              open={openGifPopover}
              anchorEl={gifAnchorEl}
              onClose={handleCloseGifPopover}
              elevation={0}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transitionDuration={0}
              PaperProps={{
                sx: {
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  // Adjust the maxWidth here
                  minWidth: '300px',
                  maxWidth: '378px',
                },
              }}
            >
              <Box sx={{ mb: 1 }}>
                <TextField
                  color="error"
                  type="text"
                  placeholder="SEARCH GIFS..."
                  variant="filled"
                  onKeyDown={onTextAreaKeyDown}
                  onChange={handleSearchInputChange}
                  fullWidth
                />
              </Box>

              {loading ? (
                // 1) STILL LOADING
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress color="error" size={20} />
                  <Typography variant="body2">Loading GIFs...</Typography>
                </Box>
              ) : gifs.length === 0 ? null : ( // 2) NO GIFS & NOT LOADING => SHOW NOTHING
                // 3) SHOW GIF GRID
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {gifs.map((gif, index) => (
                    <Box
                      key={index}
                      sx={{ position: 'relative', width: 80, height: 80 }}
                    >
                      {!gif.loaded && (
                        <Skeleton
                          variant="rectangular"
                          width={80}
                          height={80}
                          sx={{ borderRadius: '4px' }}
                        />
                      )}
                      {gif.url && (
                        <img
                          src={gif.url}
                          alt={gif.title}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: gif.loaded ? 'block' : 'none',
                          }}
                          onLoad={() => handleGifLoad(index)}
                          onClick={() => handleGifClick(gif.url)}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Popover>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,
  userName: state.auth.userName,
  user: state.auth.user,
  socket: state.auth.socket,
  onlineUserList: state.logic.onlineUserList,
});

const mapDispatchToProps = {
  setFocused,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChatPanel);
