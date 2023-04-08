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
          <img {...rest} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23212121'%3E%3Cpath d='M12 2c-4.8 0-8.7 3.9-8.7 8.7s3.9 8.7 8.7 8.7 8.7-3.9 8.7-8.7S16.8 2 12 2zM3.3 12c0-4.3 3.5-7.8 7.8-7.8s7.8 3.5 7.8 7.8-3.5 7.8-7.8 7.8-7.8-3.5-7.8-7.8zm11.1 6.8c-2.1 1.5-4.8 2.4-7.7 2.4s-5.6-.8-7.7-2.4c-.5-.4-.5-1.2 0-1.6 2.1-1.5 4.8-2.4 7.7-2.4s5.6.8 7.7 2.4c.5.4.5 1.2 0 1.6z'/%3E%3C/svg%3E" alt={alt} />
        );
      }
      return  <img {...rest} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23212121'%3E%3Cpath d='M12 2c-4.8 0-8.7 3.9-8.7 8.7s3.9 8.7 8.7 8.7 8.7-3.9 8.7-8.7S16.8 2 12 2zM3.3 12c0-4.3 3.5-7.8 7.8-7.8s7.8 3.5 7.8 7.8-3.5 7.8-7.8 7.8-7.8-3.5-7.8-7.8zm11.1 6.8c-2.1 1.5-4.8 2.4-7.7 2.4s-5.6-.8-7.7-2.4c-.5-.4-.5-1.2 0-1.6 2.1-1.5 4.8-2.4 7.7-2.4s5.6.8 7.7 2.4c.5.4.5 1.2 0 1.6z'/%3E%3C/svg%3E" alt={alt} />;
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
