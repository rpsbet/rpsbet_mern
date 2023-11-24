import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
// import DialogContent from '@material-ui/core/DialogContent';

const YouTubeModal = ({ open, onClose, rps }) => {
  const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
  const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
  const [videoURL, setVideoURL] = useState('');

  const getYouTubeURL = rps => {
    switch (rps) {
      case 'Bear':
      case 'MoonBear':
        return 'https://www.youtube.com/embed/cA2VbTsbfys';

      case 'Bull':
      case 'MoonBull':
        return 'https://www.youtube.com/embed/yWQf28jbzM8';

      case 'Whale':
      case 'MoonWhale':
        return 'https://www.youtube.com/embed/8DPAGxdJtW8';

      case 'Rock':
      case 'MoonRock':
        return 'https://www.youtube.com/embed/yWQf28jbzM8';

      case 'Paper':
      case 'MoonPaper':
        return 'https://www.youtube.com/embed/Cl_9RfmvqIk';

      case 'Scissors':
      case 'MoonScissors':
        return 'https://www.youtube.com/embed/Cl_9RfmvqIk';

      case 'Tumbledryer':
        return 'https://www.youtube.com/embed/T20K8xxg9pk';

      case 'Knife':
        return 'https://www.youtube.com/embed/muBmq_M6dfw';

      case 'Gorilla':
        return 'https://www.youtube.com/embed/HBmwkU0AR7I';

      case 'Microwave':
        return 'https://www.youtube.com/embed/HBmwkU0AR7I';

      case 'Quick Ball':
        return 'https://www.youtube.com/embed/HBmwkU0AR7I';

      case 'Blender':
        return 'https://www.youtube.com/embed/HBmwkU0AR7I';

      case 'Snowman':
        return 'https://www.youtube.com/embed/hlc-IW-6TC4';

      case 'Sledge':
        return 'https://www.youtube.com/embed/hlc-IW-6TC4';

      case 'Brain':
        return 'https://www.youtube.com/embed/gTOkbh7v6w8';

      default:
        return ''; // Default to an empty URL or handle as needed
    }
  };

  // Update videoURL when the component mounts or when rps changes
  React.useEffect(() => {
    setVideoURL(getYouTubeURL(rps));
  }, [rps]);

  return (
    <Dialog open={open} onClose={onClose}>
      {/* <DialogContent> */}
        {videoURL ? (
          <iframe
            width="194  "
            height="345"
            src={videoURL}
            fs="0"
            autoplay="1"
            frameBorder="0"
            controls="0"
          />
        ) : (
          <div className="loading-gif-container">
            <img src={randomGifUrl} id="isLoading" alt="loading" />
          </div>
        )}
      {/* </DialogContent> */}
    </Dialog>
  );
};

export default YouTubeModal;
