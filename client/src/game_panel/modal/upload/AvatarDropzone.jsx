import React, { Component } from "react";
import "./AvatarDropzone.css";
import Avatar from "../../../components/Avatar";
import { alertModal } from "../ConfirmAlerts";
import { Button, TextField, Grid } from '@material-ui/core';

class Dropzone extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hightlight: false,
      aiText: '',
      showAIText: false,
      loading: false,
    };
    this.fileInputRef = React.createRef();
  }

  openFileDialog = () => {
    if (this.props.disabled) return;
    this.fileInputRef.current.click();
  }

  previewImage = (file) => {
    if (!file) return;
    let reader = new FileReader();
    reader.onloadend = () => {
      this.props.setImageFilename(reader.result);
    }
    reader.readAsDataURL(file);
  }

  onFileAdded = (evt) => {
    if (this.props.disabled) return;
    const file = evt.target.files[0];
    const image = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      image.src = e.target.result;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const maxWidth = 800;
        const maxHeight = 800;

        let width = image.width;
        let height = image.height;
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

        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob.size > 4194304) {
            alertModal(this.props.darkMode, "THIS ONE IS TOO LARGE, TRY ANOTHER");
            return;
          }
          this.previewImage(blob);
          if (this.props.onFileAdded) {
            this.props.onFileAdded(blob);
          }
        }, file.type);
      };
    };
    reader.readAsDataURL(file);
  }

  onDragOver = (event) => {
    event.preventDefault();
    if (this.props.disabled) return;
    this.setState({ hightlight: true });
  }

  onDragLeave = (event) => {
    this.setState({ hightlight: false });
  }

  onDrop = (event) => {
    event.preventDefault();
    if (this.props.disabled) return;
    const file = event.dataTransfer.files[0];
    if (this.props.onFileAdded) {
      this.props.onFileAdded(file);
    }
    this.previewImage(file);
    this.setState({ hightlight: false });
  }

  handleAITextChange = (e) => {
    this.setState({ aiText: e.target.value });
  }

  handleGenerateAIImage = async () => {
    try {
      const apiKey = '42c3b8b2-0fb5-4890-a78d-5f684ead8a3a';
      const apiUrl = 'https://api.deepai.org/api/origami-3d-generator';

      this.setState({ loading: true });

      const formData = new FormData();
      const aiTextWithCat = `${this.state.aiText} cat`;
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
        this.props.setImageFilename(data.output_url);
      } else {
        alertModal(this.props.darkMode, 'Failed to generate 3D Origami image. Please try again.');
      }
    } catch (error) {
      console.error('Error generating 3D Origami image:', error);
      alertModal(this.props.darkMode, 'An error occurred while generating 3D Origami image. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  }

  showTextfield = () => {
    this.setState({ showAIText: true });
  }

  hideTextfield = () => {
    this.setState({ showAIText: false });
  }

  render() {
    return (
      <div
        className={`AvatarDropzone ${this.state.hightlight ? "AvatarHighlight" : ""}`}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
      >
        <input ref={this.fileInputRef} className="AvatarFileInput" type="file" accept="image/x-png,image/gif,image/jpeg, image/jpg, image/heic" onChange={this.onFileAdded} />

        <Avatar
          className="AvatarPreviewPanel"
          alt=""
          rank={this.props.rank}
          username={this.props.username}
          accessory={this.props.accessory}
          src={this.props.imageUrl}
          darkMode={this.props.darkMode}
        />
        <div className="AvatarControlPanel">
          <Grid container spacing={2} direction="column" alignItems="center">
            <Grid item>
              <Button onClick={this.openFileDialog} fullWidth>CHANGE IMAGE</Button>
            </Grid>
            <Grid item>
              {this.state.showAIText ? (
                <>
                  <TextField
                    label="ENTER PROMPT"
                    variant="filled"
                    fullWidth
                    value={this.state.aiText}
                    onChange={this.handleAITextChange}
                  />
                  <Grid container spacing={2} direction="row" justifyContent="space-between" alignItems="center">
                    <Grid item>
                      <Button onClick={this.hideTextfield} fullWidth>Hide</Button>
                    </Grid>
                    <Grid item>
                      <Button onClick={this.handleGenerateAIImage} fullWidth>Generate</Button>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Button onClick={this.showTextfield} fullWidth>AI GENERATE</Button>
              )}
            </Grid>
          </Grid>
        </div>
        <div className="loading-spinner" style={{ display: this.state.loading ? 'block' : 'none' }}></div>
      </div>
    );
  }
}

export default Dropzone;
