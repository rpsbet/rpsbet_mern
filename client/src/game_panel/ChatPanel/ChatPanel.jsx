import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import Moment from 'moment';
import { alertModal } from '../modal/ConfirmAlerts';
import { getRank } from '../../util/getRank';
import Avatar from '../../components/Avatar';
import {
  Tabs,
  Tab,
  Button,
  InputAdornment,
  TextField
} from '@material-ui/core';
import { InsertEmoticon, Gif, Clear } from '@mui/icons-material';
import GlobalChat from './GlobalChat';
import MyChat from './MyChat';
import Chat from '../icons/Chat.js';
import ChatHover from '../icons/ChatHover';
import ChatRoom from '../icons/ChatRoom';
import ChatRoomHover from '../icons/ChatRoomHover.js';
import { setFocused } from '../../redux/Auth/user.actions.js';


const emojis = [
  { command: ':bot:', url: '/img/emotes/brokenbot.webp', alt: 'broken bot' },
  { command: ':dance:', url: '/img/emotes/dance.webp', alt: 'dance' },
  { command: ':goofy:', url: '/img/emotes/goofy.webp', alt: 'goofy' },
  { command: ':cook:', url: '/img/emotes/cook.webp', alt: 'cook' },
  { command: ':catcute:', url: '/img/emotes/catcute.webp', alt: 'cat cute' },
  { command: ':gang:', url: '/img/emotes/gangSigns.webp', alt: 'gang signs' },
  { command: ':happy:', url: '/img/emotes/happy.webp', alt: 'happy' },
  { command: ':sus:', url: '/img/emotes/sus.webp', alt: 'sus' },
  { command: ':flatearth:', url: '/img/emotes/flatearth.webp', alt: 'flat earth' },
  { command: ':pepedance:', url: '/img/emotes/pepepe.webp', alt: 'pepe dance' },
  { command: ':leo:', url: '/img/emotes/leo.webp', alt: 'leo' },
  {
    command: ':wellyousee:',
    url: '/img/emotes/wellyousee.webp',
    alt: 'wellyousee'
  },
  { command: ':laugh:', url: '/img/emotes/laugh.webp', alt: 'laugh' },
  {
    command: ':randomemote:',
    url: '/img/emotes/randomemote.webp',
    alt: 'randomemote'
  },
  { command: ':rainbow:', url: '/img/emotes/rainbow.webp', alt: 'rainbow' },
  { command: ':cross:', url: '/img/emotes/cross.webp', alt: 'cross' },
  { command: ':nyancat:', url: '/img/emotes/nyancat.webp', alt: 'nyan cat' },
  { command: ':babycar:', url: '/img/emotes/babycar.webp', alt: 'baby car' },
  { command: ':sexykiss:', url: '/img/emotes/sexykiss.webp', alt: 'sexy kiss' },
  { command: ':sexyclap:', url: '/img/emotes/sexyclap.webp', alt: 'sexy clap' },
  { command: ':sexyfinger:', url: '/img/emotes/sexyfinger.webp', alt: 'sexy finger' },
  { command: ':pickle:', url: '/img/emotes/pickle.webp', alt: 'pickle' },
  { command: ':trooperbae:', url: '/img/emotes/trooperbae.webp', alt: 'storm trooper bae' },
  { command: ':catpop:', url: '/img/emotes/catpop.webp', alt: 'catpop' },
  { command: ':brother:', url: '/img/emotes/brother.webp', alt: 'brother' },
  { command: ':pepenou:', url: '/img/emotes/pepenou.webp', alt: 'pepenou' },
  { command: ':skibidi:', url: '/img/emotes/skibidi.webp', alt: 'skibidi' },
  { command: ':salute:', url: '/img/emotes/salute.webp', alt: 'salute' },
  { command: ':bananacat:', url: '/img/emotes/bananacat.webp', alt: 'banana cat' },
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
  { command: ':pleasecat:', url: '/img/emotes/pleasecat.webp', alt: 'please cat' },
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
    alt: 'moneypepe'
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
    alt: 'minecraftcookie'
  }
];

const initialGifState = {
  loaded: false,
  url: '',
  title: '',
};

const customStyles = {
  tabRoot: {
    minWidth: '50%',
    textTransform: 'none'
  }
};

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
    setFocused
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [selectedTabIndex, setSelectedTabIndex] = useState(1);
  const [text, setText] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [gifs, setGifs] = useState(Array(10).fill(initialGifState));
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({
    sender: null,
    avatar: null,
    rank: null,
    accessory: null,
    message: null,
    messageType: null,
    time: null
  });
  const [hoverTabIndex, setHoverTabIndex] = useState(-1);

  // Reference to the TextField for focusing after inserting emoji
  const textareaRef = useRef(null);

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
            showEmojiPanel: false,
            showSearchPopup: false
          });
          handleClearTooltip();
          setShowEmojiPanel(false);
          setShowSearchPopup(false);
        }
      }
    } else {
      alertModal(isDarkMode, 'FURR-SST LOG IN!');
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
      time: null
    });
    setText(''); // Clear the text field input
  };

  const handleMouseEnter = (index) => {
    setHoverTabIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverTabIndex(-1);
  };

  const handleGifClick = (gifUrl) => {
    if (user && user._id) {
      if (socket) {
        const message = {
          type: 'gif',
          content: gifUrl
        };
        socket.emit('GLOBAL_CHAT_SEND', {
          sender: userName,
          senderId: user._id,
          message: JSON.stringify(message),
          rank: user.totalWagered,
          avatar: user.avatar,
          accessory: user.accessory,
          messageType: 'gif'
        });
        setShowSearchPopup(false);
        setShowEmojiPanel(false);
      }
    } else {
      alertModal(isDarkMode, 'FURR-SST LOG IN!');
      return;
    }
  };

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

  const onChangeText = (e) => {
    setText(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTabIndex(newValue);
  };

  const toggleEmojiPanel = () => {
    setShowEmojiPanel((prev) => !prev);
    setShowSearchPopup(false);
  };

  const onFocusHandler = () => {
    setFocused(true);
  };

  const onBlurHandler = () => {
    setFocused(false);
  };

  const toggleSearchPopup = () => {
    setShowSearchPopup((prev) => !prev);
    setShowEmojiPanel(false);
  };

  const handleGifLoad = (index) => {
    const updatedGifs = [...gifs];
    updatedGifs[index].loaded = true;
    setGifs(updatedGifs);
  };

  const handleSearchInputChange = async (event) => {
    const searchTerm = event.target.value;
    const apiKey = 'EoYYQ1kbX7mRfqwJ6xC4M6wgQmds4Dq1'; // Replace with your Giphy API key
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${searchTerm}`;

    try {
      setLoading(true);
      const response = await axios.get(url);
      const fetchedGifs = response.data.data.map((gif) => ({
        ...initialGifState,
        url: gif.images.fixed_height.url,
        title: gif.title
      }));
      setGifs(fetchedGifs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setLoading(false);
    }
  };

  // ------------------ RENDER UTILITIES ------------------
  const renderSearchPopup = () => {
    return (
      <div className={`search-popup ${showSearchPopup ? 'active' : ''}`}>
        {showSearchPopup && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <TextField
                type="text"
                placeholder="SEARCH GIFS..."
                variant="filled"
                onKeyDown={onTextAreaKeyDown}
                onChange={handleSearchInputChange}
              />
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="gif-results">
                {gifs.map((gif, index) => (
                  <img
                    key={index}
                    src={gif.url}
                    alt={gif.title}
                    onLoad={() => handleGifLoad(index)}
                    onClick={() => handleGifClick(gif.url)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ------------------ RENDER ------------------
  const isChatEnabled = isAuthenticated && getRank(user.totalWagered) > 10;

  return (
    <div className="chat-wrapper">
      <Tabs
        value={selectedTabIndex}
        onChange={handleTabChange}
        TabIndicatorProps={{ style: { background: '#ff0000' } }}
        className="main-game-page-tabs"
      >
        <Tab
          className={`custom-tab ${
            hoverTabIndex === 0 ? 'fade-animation fade-in' : 'fade-animation fade-out'
          }`}
          label="Inbox"
          icon={hoverTabIndex === 0 || selectedTabIndex === 0 ? <ChatHover /> : <Chat />}
          style={customStyles.tabRoot}
          onMouseEnter={() => handleMouseEnter(0)}
          onMouseLeave={handleMouseLeave}
        />
        <Tab
          className={`custom-tab ${
            hoverTabIndex === 1 ? 'fade-animation fade-in' : 'fade-animation fade-out'
          }`}
          label="Chat"
          icon={
            hoverTabIndex === 1 || selectedTabIndex === 1 ? (
              <ChatRoomHover />
            ) : (
              <ChatRoom />
            )
          }
          style={customStyles.tabRoot}
          onMouseEnter={() => handleMouseEnter(1)}
          onMouseLeave={handleMouseLeave}
        />
      </Tabs>

      {selectedTabIndex === 0 ? (
        <MyChat is_mobile={is_mobile} toggleDrawer={toggleDrawer} />
      ) : (
        <GlobalChat
          emojis={emojis}
          setSelectedMessage={setSelectedMessage}
          selectedMessage={selectedMessage}
          onlineUserList={onlineUserList}
        />
      )}

      {selectedTabIndex === 1 && (
        <div className="chat-input-panel">
          {selectedMessage && selectedMessage.sender && (
            <div className="tooltip reply">
              <div className="tooltip-content">
                Replying to:
                <div className="tooltip-avatar">
                  <Avatar
                    rank={selectedMessage.rank}
                    accessory={selectedMessage.accessory}
                    src={selectedMessage.avatar}
                    username={selectedMessage.sender}
                    alt="Avatar"
                  />
                </div>
                {selectedMessage.sender}
                <Button className="tooltip-cross">
                  <Clear onClick={handleClearTooltip} />
                </Button>
              </div>
            </div>
          )}

          {renderSearchPopup()}

          <div className={`emoticon-panel ${showEmojiPanel ? 'active' : ''}`}>
            {emojis.map((emojiItem) => (
              <img
                key={emojiItem.command}
                src={emojiItem.url}
                alt={emojiItem.alt}
                onClick={() => insertEmoji(emojiItem.command)}
              />
            ))}
          </div>

          <TextField
            type="text"
            className="form-control"
            variant="outlined"
            onFocus={onFocusHandler}
            onBlur={onBlurHandler}
            onKeyDown={onTextAreaKeyDown}
            placeholder={isChatEnabled ? 'CHAT HERE...' : 'RANK MUST BE 10+'}
            onChange={onChangeText}
            value={text}
            inputRef={textareaRef}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  style={{ minWidth: '60px', background: 'transparent' }}
                >
                  <Button
                    className="btn-show-emoticon"
                    onClick={toggleEmojiPanel}
                    style={{ minWidth: '32px' }}
                  >
                    <InsertEmoticon style={{ fontSize: '16px' }} />
                  </Button>
                  <Button
                    className="btn-search-gifs"
                    onClick={toggleSearchPopup}
                    style={{ minWidth: '32px', marginLeft: '2px' }}
                  >
                    <Gif style={{ fontSize: '32px' }} />
                  </Button>
                </InputAdornment>
              )
            }}
            disabled={!isChatEnabled}
          />
        </div>
      )}
    </div>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,
  userName: state.auth.userName,
  user: state.auth.user,
  socket: state.auth.socket,
  onlineUserList: state.logic.onlineUserList
});

const mapDispatchToProps = {
  setFocused
};

export default connect(mapStateToProps, mapDispatchToProps)(ChatPanel);