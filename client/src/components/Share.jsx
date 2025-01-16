import React, { useState, useRef } from 'react';
import { TwitterShareButton } from 'react-share';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { Tooltip } from '@material-ui/core';
import FileCopy from '@mui/icons-material/FileCopy';

const Share = ({ socket, roomInfo }) => {
  const [clicked, setClicked] = useState(true);
  const [text, setText] = useState('');
  const settingsRef = useRef(null);

  const toggleBtnHandler = () => {
    setClicked(!clicked);
    setText('LINK GRABBED');
    setTimeout(() => {
      setClicked(!clicked);
      setText('');
    }, 1000);
  };

  const copy = () => {
    const twitterLink = `https://rps.game/join/${roomInfo._id}`;
    navigator.clipboard.writeText(twitterLink);
  };

  const twitterLink = `https://rps.game/join/${roomInfo._id}`;
  const buttonStyles = ['copy-btn'];

  if (clicked) {
    buttonStyles.push('clicked');
  }

  return (
    <div className="share-options">
      <TwitterShareButton
        url={twitterLink}
        title={`1v1 ME RPS, P*SSIES: ⚔`}
        className="Demo__some-network__share-button"
      >
        <FontAwesomeIcon icon={faXTwitter} />
      </TwitterShareButton>
      <a
        className={buttonStyles.join(' ')}
        onClick={() => {
          toggleBtnHandler();
          copy();
        }}
      >
        {clicked ? (
          <input
            type="text"
            value={twitterLink}
            readOnly
            onClick={toggleBtnHandler}
          />
        ) : null}
        <Tooltip
          title={!clicked ? 'COPIED LINK!' : 'COPY LINK'}
          placement="top"
        >
          <FileCopy style={{ cursor: 'pointer' }} />
        </Tooltip>
        &nbsp;{text}
      </a>
    </div>
  );
};

export default Share;