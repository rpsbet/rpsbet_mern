import React, { Component } from 'react';
// import ColorThief from 'color-thief';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { getRank } from '../util/getRank';
import { connect } from 'react-redux';
import chroma from 'chroma-js';
import Lottie from 'react-lottie';
import verified from '../game_panel/LottieAnimations/verified.json';


class Avatar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      src: props.src,
      alt: props.alt,
      accessory: props.accessory,
      username: props.username,
      rank: props.rank,
      darkMode: props.darkMode,
      dominantColor: null
    };

    // this.colorThief = new ColorThief();
  }

  componentDidMount() {
    // this.getColor();

  }

  // componentDidUpdate(prevProps) {
  //   if (this.props.src !== prevProps.src) {
  //     this.getColor();
  //   }
  // }

  // getColor() {
  //   const image = new Image();
  //   image.crossOrigin = 'Anonymous';
  //   image.src = this.props.src;

  //   image.onload = () => {
  //     const dominantColor = this.colorThief.getColor(image);
  //     this.setState({ dominantColor });
  //   };
  // }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.src !== prevState.src ||
      nextProps.alt !== prevState.alt ||
      nextProps.accessory !== prevState.accessory ||
      nextProps.username !== prevState.username ||
      nextProps.rank !== prevState.rank
    ) {
     
      return {
        src: nextProps.src,
        alt: nextProps.alt,
        accessory: nextProps.accessory,
        username: nextProps.username,
        rank: nextProps.rank,
        dominantColor: '3px solid transparent'
      };
    }

    
    return null;
  }

  render() {

    let { src, alt, accessory, rank, darkMode, dominantColor } = this.state;
    const { isLowGraphics, isDarkMode } = this.props;
    let borderColor = '3px solid transparent';
    let rankColor = '#3498db';
    let shadedColor = chroma(rankColor).darken(4).hex();
    if (!isDarkMode) {
      rankColor = '#2c3e50'; // Change to your dark mode color
      shadedColor = chroma(rankColor).brighten(8).hex(); // Adjust as needed for dark mode shading
    }
    const rankColors = {
        1: '#1E90FF',   // Dodger Blue
        2: '#00C851',   // Bright Green
        3: '#2F4F4F',   // Dark Slate Grey
        4: '#8A2BE2',   // Blue Violet
        5: '#FF8C00',   // Dark Orange
        6: '#D2691E',   // Chocolate
        7: '#00CED1',   // Dark Turquoise
        8: '#B22222',   // Firebrick Red
        9: '#4169E1',   // Royal Blue
        10: '#FF4500',  // Orange Red
        11: '#DC143C',  // Crimson
        12: '#FFD700',  // Gold
        13: '#66CDAA',  // Medium Aquamarine
        14: '#483D8B',  // Dark Slate Blue
        15: '#00BFFF',  // Deep Sky Blue
        16: '#FF1493',  // Deep Pink
        17: '#20B2AA',  // Light Sea Green
        18: '#FF6347',  // Tomato
        19: '#00FF7F',  // Spring Green
        20: '#DAA520',  // Goldenrod
        21: '#1E90FF',  // Vivid Dodger Blue
        22: '#32CD32',  // Lime Green
        23: '#9932CC',  // Dark Orchid
        24: '#D2691E',  // Vibrant Chocolate
        25: '#8B0000',  // Dark Red (changed from Navy Blue)
        26: '#A0522D',  // Sienna
        27: '#7FFFD4',  // Aquamarine
        28: '#6A5ACD',  // Slate Blue
        29: '#CD853F',  // Peru
        30: '#2F4F4F',  // Dark Slate Grey
        31: '#FF69B4',  // Hot Pink (changed from Orange Red)
        32: '#708090',  // Slate Gray (changed from Steel Blue)
        33: '#4B0082',  // Indigo (changed from Gold)
    };



    if (rank !== null && !isNaN(rank)) {
      rank = getRank(rank); // Assuming getRank function returns a valid rank number
      if (rank in rankColors) {
        // Valid rank found in rankColors
        borderColor = `3px solid ${rankColors[rank]}`;
        rankColor = rankColors[rank];
      } else {
        // Handle case where rank is not in rankColors (this should ideally not happen if rankColors is properly defined)
        borderColor = '3px solid red';
        rankColor = 'red';
      }
    } else {
      // Handle case where rank is null or NaN
      rank = ''; // or any fallback value you want to display
      borderColor = '3px solid transparent'; // or any fallback border style
      rankColor = 'transparent'; // or any fallback color
    }

    const backgroundColor = darkMode ? '#2D2D2D' : '#F3F3F3';
    const backgroundColorStyle = rankColors[rank] ? rankColors[rank] : 'transparent';

    const username = this.state.username || '';

    const isBot = username.toUpperCase().includes('BOT');
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
      'NO BROKIES'
    ];
    const isSystem = systemUsernames.includes(username);

    const verifiedUsernames = [
      'pimpedpistols',
      'KEKW',
      'Guru47',
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

    const isVerified = verifiedUsernames.includes(username);


    return (
      <div
        // {...this.props}
        className="avatar"
        style={{
          position: 'relative',
          backgroundColor: isNaN(backgroundColor) ? 'transparent' : backgroundColor,
        }}
      >
        <img
        id="user-avatar"
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            border: isBot ? '3px solid red' : isSystem ? '3px solid grey' : borderColor,
            boxShadow: isBot
              ? 'none'
              : isSystem
                ? 'none'
                : `0 6px 20px 0px ${rankColor}, 0 0 5px ${shadedColor}`,
          }}
          onError={(e) => {
            e.target.src = darkMode
              ? '/img/profile-thumbnail-dark.svg'
              : '/img/profile-thumbnail.svg';
          }}
        />
        {renderLottieAvatarAnimation(accessory, isLowGraphics)}
        {dominantColor && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: '-1',
              // border: isBot ? '3px solid red' : isSystem ? '3px solid grey' : borderColor,
              boxShadow: isBot
                ? 'none'
                : isSystem
                  ? 'none'
                  : `0 6px 20px 0px ${rankColor}, 0 0 5px ${shadedColor}`,
              boxSizing: 'border-box',
              borderRadius: '9px',
            }}
          />
        )}
        {!isBot && !isSystem && rank !== null && (
          <div
            className="rank-icon"
            style={{
              position: 'absolute',
              bottom: '1px',
              left: '-6px',
              width: '1.8em',
              height: '1.8em',
              backgroundColor: backgroundColorStyle,
              color: isDarkMode ? '#2d2d2d' : '#f9f9f9',
              borderRadius: '5px',
              fontSize: '0.55em',
              // boxShadow: `0 0px 2px 0px ${rankColor || 'transparent'}, 0 0 1px ${shadedColor || 'transparent'}`,
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {rank}
          </div>
        )}


        {isVerified && (
          <div
            className='verified'
            style={{
              width: '32px',
              height: '32px',
              position: 'absolute',
              top: '0',
              right: '0',
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
          </div>
        )}
      </div>
    );

  }
}


const mapStateToProps = state => ({
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  isDarkMode: state.auth.isDarkMode

});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(Avatar);
