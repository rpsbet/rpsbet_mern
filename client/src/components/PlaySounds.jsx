// PlaySounds.jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import buttonHoverSound from './main-select.mp3';
import typingSound from './typing-sound.mp3';

class PlaySounds extends Component {
  playSound = (soundPath, volume) => {
    const { isMuted , gameSounds} = this.props;
    if (!isMuted || !gameSounds) {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      audio.play();
    }
  };

  playSoundOnHover = () => {
    this.playSound(buttonHoverSound, 0.06);
  };

  playTypingSound = () => {
    this.playSound(typingSound, 0.08);
  };

  render() {
    const { children } = this.props;

    return <React.Fragment>{children(this.playSoundOnHover, this.playTypingSound)}</React.Fragment>;
  }
}

const mapStateToProps = (state) => {
  return {
    isMuted: state.auth.isMuted,
    gameSounds: state.auth.gameSounds,
  };
};

export default connect(mapStateToProps)(PlaySounds);
