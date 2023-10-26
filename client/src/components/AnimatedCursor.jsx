import React, { useEffect, useState } from 'react';
import clawCursor from './claw-cursor.svg';
import clawCursorSound from './claw-cursor.mp3';
import { connect } from 'react-redux';

function useEventListener(eventName, handler, element = document) {
  const savedHandler = React.useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return () => {};

    const eventListener = (event) => savedHandler.current(event);

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
 function AnimatedCursor(props) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const cursorInnerRef = React.useRef();
  const audio = new Audio(clawCursorSound);

  const onMouseDown = (event) => {
    setIsMouseDown(true);
    const top = event.clientY - 22; // Adjust to top
    const left = event.clientX - 16; // Adjust to right
    cursorInnerRef.current.style.top = top + 'px';
    cursorInnerRef.current.style.left = left + 'px';
    if (!props.isMuted) {
      audio.play();
    }
  };

  const onMouseUp = () => {
    setIsMouseDown(false);
    audio.pause();
    audio.currentTime = 0; // Reset the audio to the beginning
  };

  useEventListener('mousedown', onMouseDown, document);
  useEventListener('mouseup', onMouseUp, document);

  const cursorStyle = {
    zIndex: 9999,
    position: 'fixed',
    opacity: isMouseDown ? 1 : 0, // Show cursor only on mousedown
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-in-out',
  };

  return (
    <div
      ref={cursorInnerRef}
      style={{
        ...cursorStyle,
        backgroundImage: `url(${clawCursor})`,
        backgroundRepeat: 'no-repeat',
        width: '32px',
        height: '32px',
      }}
    />
  );
}


const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  isMuted: state.auth.isMuted,
});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(AnimatedCursor);
