import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import chroma from 'chroma-js';
import verified from '../game_panel/LottieAnimations/verified.json';
import { Box, Avatar as MUIAvatar } from '@mui/material';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { getRank } from '../util/getRank';

function Avatar(props) {
  const {
    // Redux-level or passed-down props
    src: initialSrc,
    alt: initialAlt,
    accessory: initialAccessory,
    username: initialUsername,
    rank: initialRank,
    darkMode: initialDarkMode,
    isLowGraphics,
    isDarkMode,
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [src, setSrc] = useState(initialSrc);
  const [alt, setAlt] = useState(initialAlt);
  const [accessory, setAccessory] = useState(initialAccessory);
  const [username, setUsername] = useState(initialUsername);
  const [rank, setRank] = useState(initialRank);
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  // Although `dominantColor` is in the original code,
  // it never gets set to anything other than `'3px solid transparent'`.
  // We'll keep it for completeness:
  const [dominantColor, setDominantColor] = useState(null);

  // --------------- SIDE EFFECTS / "getDerivedStateFromProps" ---------------
  // If any of the relevant props change, update local state accordingly
  useEffect(() => {
    setSrc(initialSrc);
    setAlt(initialAlt);
    setAccessory(initialAccessory);
    setUsername(initialUsername);
    setRank(initialRank);
    setDarkMode(initialDarkMode);
    setDominantColor('3px solid transparent');
  }, [initialSrc, initialAlt, initialAccessory, initialUsername, initialRank, initialDarkMode]);

  // --------------- RENDER LOGIC ---------------
  let borderColor = '3px solid transparent';
  let rankColor = '#3498db';
  let shadedColor = chroma(rankColor).darken(4).hex();

  if (!isDarkMode) {
    rankColor = '#2c3e50';
    shadedColor = chroma(rankColor).brighten(8).hex();
  }

  // Predefined rank colors
  const rankColors = {
    1: '#1E90FF',
    2: '#00C851',
    3: '#2F4F4F',
    4: '#8A2BE2',
    5: '#FF8C00',
    6: '#D2691E',
    7: '#00CED1',
    8: '#B22222',
    9: '#4169E1',
    10: '#FF4500',
    11: '#DC143C',
    12: '#FFD700',
    13: '#66CDAA',
    14: '#483D8B',
    15: '#00BFFF',
    16: '#FF1493',
    17: '#20B2AA',
    18: '#FF6347',
    19: '#00FF7F',
    20: '#DAA520',
    21: '#1E90FF',
    22: '#32CD32',
    23: '#9932CC',
    24: '#D2691E',
    25: '#8B0000',
    26: '#A0522D',
    27: '#7FFFD4',
    28: '#6A5ACD',
    29: '#CD853F',
    30: '#2F4F4F',
    31: '#FF69B4',
    32: '#708090',
    33: '#4B0082',
  };

  let adjustedRank = rank;
  if (adjustedRank !== null && !isNaN(adjustedRank)) {
    adjustedRank = getRank(adjustedRank);
    if (adjustedRank in rankColors) {
      borderColor = `3px solid ${rankColors[adjustedRank]}`;
      rankColor = rankColors[adjustedRank];
    } else {
      borderColor = '3px solid red';
      rankColor = 'red';
    }
  } else {
    adjustedRank = '';
    borderColor = '3px solid transparent';
    rankColor = 'transparent';
  }

  const usernameString = username || '';

  // Identify if user is "bot" or "system" or "verified"
  const isBot = usernameString.toUpperCase().includes('BOT');
  const systemUsernames = [
    'pimpedpistols',
    'GIGACHAD',
    'KEKW',
    'smellyfingers',
    'SUPPORT',
    'OFFICIALRPSGAME',
    '69',
    'SYSTEM',
    'WHALE WATCHERS',
    'NO BROKIES',
  ];
  const isSystem = systemUsernames.includes(usernameString);

  const verifiedUsernames = [
    'pimpedpistols',
    'KEKW',
    'GIGACHAD',
    'smellyfingers',
    'SUPPORT',
    'OFFICIALRPSGAME',
    'SYSTEM',
    'WHALE WATCHERS',
    'NO BROKIES',
    'Tydrellinbg',
    'Bearbland11',
    'Sachin5512',
    'jimbobjocorn',
  ];
  const isVerified = verifiedUsernames.includes(usernameString);

  const backgroundColorStyle = rankColors[adjustedRank] ? rankColors[adjustedRank] : 'transparent';
  return (
    <Box
      className="avatar"
      sx={{
        position: 'relative',
        backgroundColor: 'transparent',
      }}
    >
      {/* Avatar Image */}
      <MUIAvatar
        id="user-avatar"
        src={src}
        alt={alt}
        variant="rounded" // Makes the avatar square with rounded corners
        sx={{
          width: '100%',
          height: '100%',
          border: isBot
            ? '3px solid red'
            : isSystem
            ? '3px solid grey'
            : borderColor,
          boxShadow: isBot
            ? 'none'
            : isSystem
            ? 'none'
            : `0 6px 20px 0px ${rankColor}`,
        }}
        onError={(e) => {
          e.target.src = darkMode
            ? '/img/profile-thumbnail-dark.svg'
            : '/img/profile-thumbnail.svg';
        }}
      />
  
      {/* Lottie Animation */}
      {renderLottieAvatarAnimation(accessory, isLowGraphics)}
  
      {/* Dominant Color Background */}
      {dominantColor && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            boxShadow: isBot
              ? 'none'
              : isSystem
              ? 'none'
              : `0 6px 20px 0px ${rankColor}, 0 0 5px ${shadedColor}`,
            boxSizing: 'border-box',
            borderRadius: '0.3em', // Slightly rounded corners for background
          }}
        />
      )}
  
      {/* Rank Icon */}
      {!isBot && !isSystem && adjustedRank !== null && adjustedRank !== '' && (
        <Box
          className="rank-icon"
          sx={{
            position: 'absolute',
            bottom: '1px',
            left: '-6px',
            width: '1.8em',
            height: '1.8em',
            backgroundColor: backgroundColorStyle,
            color: isDarkMode ? '#2d2d2d' : '#f9f9f9',
            borderRadius: '5px', // Slightly rounded corners for the rank icon
            fontSize: '0.55em',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {adjustedRank}
        </Box>
      )}
  
      {/* Verified Badge */}
      {isVerified && (
        <Box
          className="verified"
          sx={{
            width: '32px',
            height: '32px',
            position: 'absolute',
            top: 0,
            right: 0,
            marginTop: '-15px',
            marginRight: '-14px',
            transform: 'scale(0.7)',
            filter: isSystem ? 'grayscale(1)' : 'hue-rotate(55deg)',
          }}
        >
          <Lottie
            options={{
              loop: isLowGraphics ? false : true,
              autoplay: isLowGraphics ? false : true,
              animationData: verified,
            }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </Box>
      )}
    </Box>
  );
}

// Connect to Redux if needed
const mapStateToProps = (state) => ({
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  isDarkMode: state.auth.isDarkMode,
});

export default connect(mapStateToProps)(Avatar);