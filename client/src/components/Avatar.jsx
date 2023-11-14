import React, { Component } from 'react';
import ColorThief from 'color-thief';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { getRank } from '../util/getRank';
import { connect } from 'react-redux';
import { fetchAccessory } from '../redux/Logic/logic.actions';

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

    this.colorThief = new ColorThief();
  }

  componentDidMount() {
    this.getColor();
  }

  componentDidUpdate(prevProps) {
    if (this.props.src !== prevProps.src) {
      this.getColor();
    }
  }

  getColor() {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = this.props.src;

    image.onload = () => {
      const dominantColor = this.colorThief.getColor(image);
      this.setState({ dominantColor });
    };
  }

  render() {
    let { src, alt, accessory, rank, darkMode, dominantColor } = this.state;

    let borderColor = dominantColor
      ? `4px solid rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`
      : '4px solid transparent';

    const rankColors = {
      1: 'steelblue',
      2: 'forestgreen',
      3: 'slategray',
      4: 'indigo',
      5: 'darkorange',
      6: 'saddlebrown',
      7: 'teal',
      8: 'maroon',
      9: 'navy',
      10: 'firebrick'
    };

    
    
    if (rank !== null) {
      rank = getRank(rank);
      if (rank in rankColors) {
        borderColor = `4px solid ${rankColors[rank]}`;
      } else {
        borderColor = '4px solid red';
      }
    }

    const backgroundColor = darkMode ? '#2D2D2D' : '#F3F3F3';

    return (
      <div
        {...this.props}
        style={{
          position: 'relative',
          backgroundColor
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%' }}
          onError={e => {
            e.target.src = darkMode
              ? '/img/profile-thumbnail-dark.svg'
              : '/img/profile-thumbnail.svg';
          }}
        />
        {renderLottieAvatarAnimation(accessory)}
        {dominantColor && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '6px',
              border: borderColor,
              boxSizing: 'border-box'
            }}
          />
        )}
        <div></div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userInfo: state.auth.user
});

const mapDispatchToProps = {
  fetchAccessory
};

export default connect(mapStateToProps, mapDispatchToProps)(Avatar);
