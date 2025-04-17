import React, { useState, useRef, useCallback } from 'react';
import './AvatarDropzone.css';
import { useDispatch } from 'react-redux';
import { errorMsgBar } from '../../../redux/Notification/notification.actions';
import { Button, TextField, Grid, Box } from '@mui/material';
import uniqid from 'uniqid';

import Avatar from '../../../components/Avatar';

/**
 * @component AvatarDropzone
 * A drag-and-drop area for uploading a user avatar. Includes an optional
 * AI-based image generator (DeepAI) for creating cat-themed images.
 */
function AvatarDropzone({
  darkMode,
  imageUrl,
  rank,
  username,
  accessory,
  elite,
  setImageFilename,
  onFileAdded,
  disabled,
}) {
  // -------------------------------
  //            STATE
  // -------------------------------
  const [highlight, setHighlight] = useState(false);
  const [aiText, setAiText] = useState('');
  const [showAIText, setShowAIText] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // -------------------------------
  //       REFS & CALLBACKS
  // -------------------------------
  const fileInputRef = useRef(null);

  /**
   * Opens the native file dialog.
   */
  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  /**
   * Displays the selected or dropped image in the UI by converting
   * it to a base64 data URL and passing it to `setImageFilename`.
   */
  const previewImage = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFilename(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------
  //       DRAG & DROP HANDLERS
  // -------------------------------
  const onDragOverHandler = (event) => {
    event.preventDefault();
    if (!disabled) {
      setHighlight(true);
    }
  };

  const onDragLeaveHandler = () => {
    setHighlight(false);
  };

  const onDropHandler = (event) => {
    event.preventDefault();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      previewImage(file);
      if (onFileAdded) onFileAdded(file);
    }
    setHighlight(false);
  };

  // -------------------------------
  //     IMAGE FILE ADDED HANDLER
  // -------------------------------
  const onFileAddedHandler = (evt) => {
    if (disabled) return;

    const file = evt.target.files?.[0];
    if (!file) return;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      image.src = e.target.result;
      image.onload = () => {
        // Scale down if needed
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const maxHeight = 800;

        let { width, height } = image;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        // Convert to blob and check size
        canvas.toBlob((blob) => {
          if (!blob) return;

          if (blob.size > 4_194_304) {
            dispatch(errorMsgBar('THIS ONE IS TOO LARGE, TRY ANOTHER'));
            return;
          }

          // Dynamically generate a name for the blob
          const originalName = file.name || 'image';
          const fileExt = originalName.split('.').pop();
          const uniqueName = `${uniqid('IMG_')}.${fileExt}`;

          // Assign the new name, then preview & pass back
          blob.name = uniqueName;
          previewImage(blob);
          if (onFileAdded) onFileAdded(blob);
        }, file.type);
      };
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------
  //         AI IMAGE LOGIC
  // -------------------------------
  const handleAITextChange = (e) => {
    setAiText(e.target.value);
  };

  const handleGenerateAIImage = async () => {
    try {
      setLoading(true);
      const apiKey = '42c3b8b2-0fb5-4890-a78d-5f684ead8a3a';
      const apiUrl = 'https://api.deepai.org/api/origami-3d-generator';

      const formData = new FormData();
      const aiTextWithCat = `${aiText} cat`;

      formData.append('text', aiTextWithCat);
      formData.append('grid_size', '1');

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
        },
        body: formData,
      });

      const data = await resp.json();
      if (data.output_url) {
        setImageFilename(data.output_url);
      } else {
        dispatch(errorMsgBar('Failed to generate 3D Origami image. Please try again.'));
      }
    } catch (error) {
      console.error('Error generating 3D Origami image:', error);
      dispatch(errorMsgBar('An error occurred while generating 3D Origami image. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  //             RENDER
  // -------------------------------
  return (
    <div
      className={`AvatarDropzone ${highlight ? 'AvatarHighlight' : ''}`}
      onDragOver={onDragOverHandler}
      onDragLeave={onDragLeaveHandler}
      onDrop={onDropHandler}
    >
      <input
        ref={fileInputRef}
        className="AvatarFileInput"
        type="file"
        accept="image/x-png,image/gif,image/jpeg,image/jpg,image/heic"
        onChange={onFileAddedHandler}
      />

      {/* Avatar Preview */}
      <Avatar
        className="AvatarPreviewPanel"
        alt=""
        rank={rank}
        username={username}
        elite={elite}
        accessory={accessory}
        src={imageUrl}
        darkMode={darkMode}
      />

      {/* Controls Panel */}
      <Box className="AvatarControlPanel">
        <Grid container spacing={2} direction="column" alignItems="center">
          {/* Change Image Button */}
          <Grid item>
            <Button
              color="error"
              variant="outlined"
              onClick={openFileDialog}
              fullWidth
            >
              CHANGE IMAGE
            </Button>
          </Grid>

          {/* AI Generate Buttons & Text Fields */}
          <Grid item>
            {showAIText ? (
              <>
                <TextField
                  color="error"
                  label="ENTER PROMPT"
                  variant="filled"
                  fullWidth
                  value={aiText}
                  onChange={handleAITextChange}
                  sx={{ mb: 1 }}
                />
                <Grid
                  container
                  spacing={2}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Grid item xs={6}>
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => setShowAIText(false)}
                      fullWidth
                    >
                      Hide
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={handleGenerateAIImage}
                      fullWidth
                    >
                      Generate
                    </Button>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Button
                color="error"
                variant="outlined"
                onClick={() => setShowAIText(true)}
                fullWidth
              >
                AI GENERATE
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Loading Spinner */}
      <div
        className="loading-spinner"
        style={{ display: loading ? 'block' : 'none' }}
      />
    </div>
  );
}

export default AvatarDropzone;