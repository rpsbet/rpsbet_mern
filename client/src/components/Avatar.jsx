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
          <img {...rest} src="data:image/svg+xml;base64,UEhOMlp5QjRiV3h1Y3owbmFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jbklIZHBaSFJvUFNjMk5DY2dhR1ZwWjJoMFBTYzJOQ2NnYzNSNWJHVTlKMkpoWTJ0bmNtOTFibVF0WTI5c2IzSTZjbWRpWVNnd0xEQXNNQ3d4S1RzblBqeG5JSE4wZVd4bFBTZG1hV3hzT25KblltRW9NalUxTERJMU5Td3lOVFVzTVNrN0lITjBjbTlyWlRweVoySmhLREkxTlN3eU5UVXNNalUxTERFcE95QnpkSEp2YTJVdGQybGtkR2c2TUM0ek1qc25Qanh5WldOMElDQjRQU2N5TnljZ2VUMG5NVGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2N5TnljZ2VUMG5ORGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2N4TnljZ2VUMG5NVGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2N6TnljZ2VUMG5NVGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2MzSnlCNVBTY3pOeWNnZDJsa2RHZzlKekV3SnlCb1pXbG5hSFE5SnpFd0p5OCtQSEpsWTNRZ0lIZzlKelEzSnlCNVBTY3pOeWNnZDJsa2RHZzlKekV3SnlCb1pXbG5hSFE5SnpFd0p5OCtQQzluUGp3dmMzWm5QZz09" alt={alt} />
        );
      }
      return  <img {...rest} src="data:image/svg+xml;base64,UEhOMlp5QjRiV3h1Y3owbmFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jbklIZHBaSFJvUFNjMk5DY2dhR1ZwWjJoMFBTYzJOQ2NnYzNSNWJHVTlKMkpoWTJ0bmNtOTFibVF0WTI5c2IzSTZjbWRpWVNnd0xEQXNNQ3d4S1RzblBqeG5JSE4wZVd4bFBTZG1hV3hzT25KblltRW9NalUxTERJMU5Td3lOVFVzTVNrN0lITjBjbTlyWlRweVoySmhLREkxTlN3eU5UVXNNalUxTERFcE95QnpkSEp2YTJVdGQybGtkR2c2TUM0ek1qc25Qanh5WldOMElDQjRQU2N5TnljZ2VUMG5NVGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2N5TnljZ2VUMG5ORGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2N4TnljZ2VUMG5NVGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2N6TnljZ2VUMG5NVGNuSUhkcFpIUm9QU2N4TUNjZ2FHVnBaMmgwUFNjeE1DY3ZQanh5WldOMElDQjRQU2MzSnlCNVBTY3pOeWNnZDJsa2RHZzlKekV3SnlCb1pXbG5hSFE5SnpFd0p5OCtQSEpsWTNRZ0lIZzlKelEzSnlCNVBTY3pOeWNnZDJsa2RHZzlKekV3SnlCb1pXbG5hSFE5SnpFd0p5OCtQQzluUGp3dmMzWm5QZz09" alt={alt} />;
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
