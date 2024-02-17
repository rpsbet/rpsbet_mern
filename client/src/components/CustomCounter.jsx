import React, { Component } from 'react';

class CustomCounter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: this.props.start,
      elapsedTime: 0,
    };
  }

  componentDidMount() {
    this.startCount();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.start !== this.props.start ) {
        console.log('wwq');
        
      this.setState({ count: this.props.start, elapsedTime: 0 }, () => {
        this.startCount();
      });
    }
  }

  startCount = () => {
    const { start, end, duration } = this.props;
    const startTime = Date.now();

    this.interval = setInterval(() => {
      const now = Date.now();
      const elapsedTime = now - startTime;

      if (elapsedTime >= duration * 1000) {
        clearInterval(this.interval);
        this.setState({ count: end, elapsedTime });
        if (this.props.onEnd) {
          this.props.onEnd();
        }
      } else {
        const progress = elapsedTime / (duration * 1000);
        const count = start + (end - start) * progress;
        this.setState({ count, elapsedTime });
      }
    }, 1000 / 60); // Adjust the frequency of updates if necessary
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { decimals } = this.props;
    return <span>{(parseFloat(this.state.count)).toFixed(2)}</span>;
  }
}

export default CustomCounter;
