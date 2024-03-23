import React, { Component } from 'react';
// import ColorThief from 'color-thief';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { getRank } from '../util/getRank';
import { connect } from 'react-redux';
import { fetchAccessory } from '../redux/Logic/logic.actions';
import chroma from 'chroma-js';

class Avatar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      src: props.src,
      alt: props.alt,
      accessory: props.accessory,
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
    // Check if any prop values have changed
    if (
      nextProps.src !== prevState.src ||
      nextProps.alt !== prevState.alt ||
      nextProps.accessory !== prevState.accessory ||
      nextProps.rank !== prevState.rank
    ) {
      // If any prop has changed, return the updated state
      return {
        src: nextProps.src,
        alt: nextProps.alt,
        accessory: nextProps.accessory,
        rank: nextProps.rank,
        dominantColor: '3px solid transparent' // Reset dominantColor when props change
      };
    }

    // If no prop has changed, return null
    return null;
  }

  render() {
    
    let { src, alt, accessory, rank, darkMode, dominantColor } = this.state;
    const { isLowGraphics, isDarkMode } = this.props;
    let borderColor = '3px solid transparent';
    let rankColor = '#3498db';
    let shadedColor = chroma(rankColor).darken(4).hex();
    if (!darkMode) {
      rankColor = '#2c3e50'; // Change to your dark mode color
      shadedColor = chroma(rankColor).brighten(8).hex(); // Adjust as needed for dark mode shading
    }
    const rankColors = {
      1: 'steelblue',
      2: 'forestgreen',
      3: 'slategray',
      4: 'indigo',
      5: 'darkorange',
      6: 'saddlebrown',
      7: 'teal',
      8: 'maroon',
      9: 'royalblue', // replacing navy with royalblue
      10: 'firebrick',
      11: 'crimson',
      12: 'goldenrod',
      13: 'mediumaquamarine',
      14: 'darkslateblue',
      15: 'olivedrab',
      16: 'mediumvioletred',
      17: 'darkcyan',
      18: 'orangered',
      19: 'mediumspringgreen',
      20: 'darkgoldenrod'
  };
  


    if (rank !== null) {
      rank = getRank(rank);
      if (rank in rankColors) {
        borderColor = `3px solid ${rankColors[rank]}`;
        rankColor = rankColors[rank];
      } else {
        borderColor = '3px solid red';
        rankColor = 'red';

      }
    }

    const backgroundColor = darkMode ? '#2D2D2D' : '#F3F3F3';

    return (
      <div
        // {...this.props}
        className='avatar'
        style={{
          position: 'relative',
          backgroundColor,
        }}
      >
        <img

          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            border: borderColor,
            boxShadow: `0 6px 20px 0px ${rankColor}, 0 0 5px ${shadedColor}`,
          }}
          onError={e => {
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
              border: borderColor,
              boxShadow: `0 6px 20px 0px ${rankColor}, 0 0 5px ${shadedColor}`,
              boxSizing: 'border-box',
              borderRadius: '9px'
            }}
          />
        )}
        {rank !== null && (
          <div
            className='rank-icon'
            style={{
              position: 'absolute',
              bottom: '1px',
              left: '-6px',
              width: '1.8em',
              height: '1.8em',
              backgroundColor: rankColors[rank],
              color: isDarkMode ? '#2d2d2d' : '#f9f9f9',
              borderRadius: '5px',
              // border: isDarkMode ? '1px solid #2d2d2d' : '1px solid #f9f9f9',
              fontSize: '0.55em',
              boxShadow: `0 0px 2px 0px ${rankColor}, 0 0 1px ${shadedColor}`,
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {rank}
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
  fetchAccessory
};

export default connect(mapStateToProps, mapDispatchToProps)(Avatar);
