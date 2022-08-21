import React, { Component } from 'react';

export default class Avatar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      src: props.src,
      alt: props.alt,
      darkMode: props.darkMode,
      ...props
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.src !== props.src ||
      current_state.alt !== props.alt ||
      current_state.darkMode !== props.darkMode
    ) {
      return {
        ...current_state,
        src: props.src,
        alt: props.alt,
        darkMode: props.darkMode
      };
    }
    return null;
  }

  render() {
    const { src, alt, darkMode, ...rest } = this.state;
    if (src === '') {
      if (darkMode) {
        return (
          <img {...rest} src="/img/profile-thumbnail-dark.svg" alt={alt} />
        );
      }
      return <img {...rest} src="/img/profile-thumbnail.svg" alt={alt} />;
    }

    if (darkMode) {
      return (
        <img
          {...rest}
          src={src}
          alt={alt}
          onError={e => {
            e.target.src = '/img/profile-thumbnail-dark.svg';
          }}
        />
      );
    }
    return (
      <img
        {...rest}
        src={src}
        alt={alt}
        onError={e => {
          e.target.src = '/img/profile-thumbnail.svg';
        }}
      />
    );
  }
}
