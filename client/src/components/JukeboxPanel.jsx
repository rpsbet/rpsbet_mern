import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOff from '@material-ui/icons/VolumeOff';


import {
  Slider,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress
} from '@material-ui/core/';
import SearchIcon from '@material-ui/icons/Search';
import {
  addToQueue,
  getQueue,
} from '../redux/Setting/setting.action';

const JukeboxPanel = ({
  isMusicEnabled,
  queue,
  addToQueue,
  getQueue,
}) => {
  const [player, setPlayer] = useState(null);
  const [videoId, setVideoId] = useState('');
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [volume, setVolume] = useState(50);
  const [videoTitle, setVideoTitle] = useState('');
  const [totalDuration, setDuration] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [progress, setProgress] = useState(0); // New state for progress
  const [isMuted, setIsMuted] = useState(true);
  const [searchResults, setSearchResults] = useState([]); // New state for search results


  const toggleMute = () => {
    if (player && player.hasOwnProperty('mute') && player.hasOwnProperty('unMute')) {
      const newMuteStatus = !isMuted;

      if (newMuteStatus) {
        player.mute();
      } else {
        player.unMute();
      }

      setIsMuted(newMuteStatus);
    }
  };


  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress((prevProgress) => prevProgress + 1);

      if (progress >= totalDuration) {
        setProgress(0);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [progress]);

  useEffect(() => {
    const fetchData = async () => {
      await getQueue();
    };

    fetchData();
  }, [getQueue]); // The dependency array ensures that the effect runs when getQueue changes


  useEffect(() => {
    if (isPlayerReady && queue.length > 0 && player) {
      const currentVideo = queue[0];
      const startSeconds = isNaN(currentVideo.progress) ? 0 : currentVideo.progress;

      player.loadVideoById({
        videoId: currentVideo.videoId,
        startSeconds: startSeconds,
      });
      setVideoId(currentVideo.videoId);
      setVideoTitle(currentVideo.title);
      setDuration(currentVideo.totalDuration);
      setProgress(currentVideo.progress);
    }
  }, [queue, player, isPlayerReady]);



  const handleSearchAndClose = async () => {
    handleMenuClose();
    await getQueue();
    handleSearch();
  };

  const onPlayerReady = (event) => {
    setIsPlayerReady(true);

  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      handleVideoEnd();

    }
  };

  const handleVideoEnd = async () => {
    await getQueue();
    if (queue.length > 0) {
      const updatedQueue = [...queue];
      // const completedVideo = updatedQueue.shift();

      if (updatedQueue.length > 0) {
        const nextVideo = updatedQueue[0];
        player.loadVideoById({
          videoId: nextVideo.videoId,
          startSeconds: (nextVideo.progress),
        });
        setVideoId(nextVideo.videoId);
        setVideoTitle(nextVideo.title);
        setProgress(nextVideo.progress);
        setDuration(nextVideo.totalDuration);

      }
    } else {
      setVideoId(null);
      setVideoTitle(null);
      setProgress(null);
      setDuration(null);
      return;
    }
  };


  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleTextFieldKeyPress = (e) => {
    const { key, target } = e;

    // Check if the key is Enter and the target is the input field
    if (key === 'Enter' && target.tagName.toLowerCase() === 'input') {
      e.preventDefault(); // Prevent the default behavior of the Enter key (form submission)
      handleSearchAndClose();
    }
  };

  const handleSearch = async () => {
    const apiKey1 = 'AIzaSyC3Z8D1Z-jabuDei92PgLqB26MIsaLK4xs';
    const apiKey2 = 'AIzaSyBWskONpYP9zTdGM-yd7cDLu1rv0SK-8jg';
    const tryApiKey = async (apiKey) => {
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&key=${apiKey}`;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.items.length > 0) {

          setSearchResults(data.items); // Update search results state

          const fetchedVideoId = data.items[0].id.videoId;
          const videoTitle = data.items[0].snippet.title;

          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${fetchedVideoId}&part=contentDetails&key=${apiKey}`;
          const detailsResponse = await fetch(videoDetailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.items.length > 0) {
            const isoDuration = detailsData.items[0].contentDetails.duration;
            const totalDuration = parseDuration(isoDuration);
            addToQueue(fetchedVideoId, videoTitle, totalDuration);
            if (queue.length >= 1) {
              if (player) {
                player.loadVideoById({ videoId: fetchedVideoId });
              } else {
                initializePlayer();
              }
            }
          }
        }
      } catch (error) {
        if (apiKey === apiKey1) {
          await tryApiKey(apiKey2);
        }
      }
    };
    await tryApiKey(apiKey1);
  };


  const parseDuration = (isoDuration) => {
    const matches = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  };


  const [isYouTubeApiLoaded, setIsYouTubeApiLoaded] = useState(true);

  const initializePlayer = () => {
    const newPlayer = new window.YT.Player('youtube-player', {
      videoId: '',
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        showinfo: 0,
        rel: 0,
        loop: 1,
        mute: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
    setPlayer(newPlayer);
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      if (player && !isYouTubeApiLoaded) {
        initializePlayer();
        setIsYouTubeApiLoaded(true);
      }
    }

    // Cleanup function
    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [player, isYouTubeApiLoaded]);

  const handleVolumeChange = (event, value) => {
    player.setVolume(value);
    setVolume(value);
  };


  const containerStyle = {
    position: 'relative',
  };

  const overlayStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const controlsStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  };

  const sliderStyle = {
    color: 'red',
    minWidth: '50px'
  };

  const QueueList = () => (
    <div style={{ padding: "5px" }}>
      <h6 style={{ margin: "10px auto 0", fontWeight: "400", whiteSpace: "nowrap" }}>Up Next:</h6>
      <ul style={{ height: "40px", overflowY: "scroll", overflowX: "hidden" }}>
        {queue.slice(1).map((video, index) => (
          <li style={{ fontSize: "0.8em" }} key={index}>
            {video.title.length > 30 ? `${video.title.slice(0, 30)}...` : video.title}

          </li>
        ))}
      </ul>
    </div>
  );


  return (
    <div  style={containerStyle}>
      <div style={overlayStyle}>
        <div id="youtube-player" style={{ display: "none" }} ></div>
        <div style={controlsStyle}>
          

          <IconButton onClick={handleMenuOpen} className="search-icon">
            <SearchIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            >
            <TextField
              label="Search YouTube"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleTextFieldKeyPress}
              />
            {searchResults.map((result) => (
              <MenuItem key={result.id.videoId} onClick={() => setSearchQuery(result.id.videoId)}>
                {result.snippet.title}
              </MenuItem>
            ))}

            <MenuItem onClick={handleSearchAndClose}>
              Search and Play
            </MenuItem>
          </Menu>
          {/* <LinearProgress
  style={{
    width: `${(progress / totalDuration) * 100}%`, // Use template literals for dynamic width
    position: "relative",
  }}
  variant="determinate"
  value={progress}
/> */}
<div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              alignItems: 'center',
            }}
          >

          <div  style={{
              fontSize: '0.8em',
            }} >{((progress / totalDuration) * 100).toFixed(2)}%</div>
          <div  style={{
              overflow: 'hidden',
              padding: '0 5px',
              width: '70%',
              fontSize: '0.8em',
            }} >
            <div className="ticker-text">{videoTitle}</div>
          </div>
          </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              alignItems: 'center',
            }}
          >

            <IconButton onClick={toggleMute} className="music-controls">
              {isMuted ? (
                <VolumeOff style={{ fontSize: '12px' }} />
              ) : (
                <VolumeUp style={{ fontSize: '12px' }} />
              )}
            </IconButton>


            <Slider
              value={volume}
              onChange={handleVolumeChange}
              min={0}
              max={100}
              style={sliderStyle}
            />
            <QueueList />

          </div>
        </div>
      </div>

  );
};


const mapStateToProps = state => ({
  queue: state.setting.queue,

});

export default connect(mapStateToProps, { addToQueue, getQueue })(JukeboxPanel);