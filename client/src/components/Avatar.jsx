import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import verified from '../game_panel/LottieAnimations/verified.json';
import { Box, Avatar as MUIAvatar, Badge } from '@mui/material';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { getRank } from '../util/getRank';

function Avatar(props) {
  const {
    src: initialSrc,
    alt: initialAlt,
    accessory: initialAccessory,
    username: initialUsername,
    rank: initialRank,
    darkMode: initialDarkMode,
    isLowGraphics,
    isDarkMode,
    onlineUserList = [],
    user_id, // ID to check if user is online
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [src, setSrc] = useState(initialSrc);
  const [alt, setAlt] = useState(initialAlt);
  const [accessory, setAccessory] = useState(initialAccessory);
  const [username, setUsername] = useState(initialUsername);
  const [rank, setRank] = useState(initialRank);
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [dominantColor, setDominantColor] = useState(null);

  // --------------- SIDE EFFECTS ---------------
  useEffect(() => {
    setSrc(initialSrc);
    setAlt(initialAlt);
    setAccessory(initialAccessory);
    setUsername(initialUsername);
    setRank(initialRank);
    setDarkMode(initialDarkMode);
    setDominantColor(null); // If you compute a color from the avatar, do it here
  }, [
    initialSrc,
    initialAlt,
    initialAccessory,
    initialUsername,
    initialRank,
    initialDarkMode,
  ]);

  // --------------- RENDER LOGIC ---------------
  const isOnline = user_id ? onlineUserList.includes(user_id) : false;

  const rankColors = {
    1: '#1E90FF',  // Dodger Blue
    2: '#00C851',  // Bright Green
    3: '#FF1493',  // Deep Pink
    4: '#FF4500',  // Orange Red
    5: '#8A2BE2',  // Blue Violet
    6: '#DC143C',  // Crimson
    7: '#7FFF00',  // Chartreuse
    8: '#FF6347',  // Tomato
    9: '#40E0D0',  // Turquoise
    10: '#8B4513', // Saddle Brown
    11: '#5F9EA0', // Cadet Blue
    12: '#D2691E', // Chocolate
    13: '#DA70D6', // Orchid (replacing Hot Pink)
    14: '#FFD700'  // Gold
  };
  

  let adjustedRank = rank;
  if (adjustedRank !== null && !isNaN(adjustedRank)) {
    adjustedRank = getRank(adjustedRank); // your custom utility
  } else {
    adjustedRank = '';
  }

  const rankColor = rankColors[adjustedRank] || 'transparent';
  const usernameString = username || '';

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

  const isSystem = systemUsernames.includes(usernameString);
  const isVerified = verifiedUsernames.includes(usernameString);

  // ---------------- BADGES SETUP ----------------
  // Outer badge = rank (bottom-right)
  // Inner badge = online (top-left)

  return (
    <Badge
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        (!isBot && !isSystem && adjustedRank) ? adjustedRank : null
      }
      slotProps={{
        badge: {
          sx: {
            backgroundColor: rankColor,
            color: '#212121',
            borderRadius: '4px',
            fontSize: '0.5rem',
            fontWeight: 'bold',
            maxWidth: '0.4rem',
            maxheight: '0.4rem',
          },
        },
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        variant="dot"
        slotProps={{
          badge: {
            sx: {
              backgroundColor: isOnline ? '#00ff3a' : 'gray',
              width: '0.75rem',
              height: '0.75rem',
            },
          },
        }}
      >
        <Box className="player" sx={{ position: 'relative', display: 'inline-block' }}>
          {/* MUI Avatar */}
          <MUIAvatar
            src={src}
            alt={alt}
            className='avatar'
            variant="rounded"
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 1,
              border: 'none',
            }}
            onError={(e) => {
              e.target.src = darkMode
                ? '/img/profile-thumbnail-dark.svg'
                : '/img/profile-thumbnail.svg';
            }}
          />

          {/* Lottie Accessory */}
          {renderLottieAvatarAnimation(accessory, isLowGraphics)}

 

          {/* Verified Badge (top-right) */}
          {isVerified && (
            <Box
              sx={{
                width: '32px',
                height: '32px',
                position: 'absolute',
                top: 0,
                right: 0,
                transform: 'translate(13px, -15px) scale(0.6)',
                filter: isSystem ? 'grayscale(1)' : 'none',
              }}
            >
              <Lottie
                options={{
                  loop: !isLowGraphics,
                  autoplay: !isLowGraphics,
                  animationData: verified,
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          )}
        </Box>
      </Badge>
    </Badge>
  );
}

// Connect to Redux if needed
const mapStateToProps = (state) => ({
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  isDarkMode: state.auth.isDarkMode,
  onlineUserList: state.logic.onlineUserList,
});

export default connect(mapStateToProps)(Avatar);
