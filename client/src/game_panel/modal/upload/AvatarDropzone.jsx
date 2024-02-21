import React, { Component } from "react";
import "./AvatarDropzone.css";
import Avatar from "../../../components/Avatar";
import { alertModal } from "../ConfirmAlerts";
import { Button, TextField } from '@material-ui/core';
import Compressor from 'compressorjs';

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

    reader.readAsDataURL(file)
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
  
        // Draw the image on the canvas with the new dimensions
        context.drawImage(image, 0, 0, width, height);
  
        // Convert the canvas content to a blob
        canvas.toBlob((blob) => {
          // Compressing the image by reducing the quality (adjust the value as needed)
          const compressedBlob = blob;
          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
  
          if (compressedFile.size > 4194304) {
            alertModal(this.props.darkMode, "THIS ONE IS NOT VERY PURR-TY, TRY ANOTHER");
            return;
          }
  
          this.previewImage(compressedBlob);
  
          if (this.props.onFileAdded) {
            this.props.onFileAdded(compressedFile);
          }
        }, file.type);
      };
    };
  
    reader.readAsDataURL(file);
  }
  

  onDragOver = (event) => {
    event.preventDefault();
    if (this.props.disabed) return;
    this.setState({ hightlight: true });
  }

  onDragLeave = (event) => {
    this.setState({ hightlight: false });
  }

  onDrop = (event) => {
    event.preventDefault();
    if (this.props.disabed) return;
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
  
      this.setState({ loading: true }); // Set loading state to true
  
      const formData = new FormData();
      const aiTextWithCat = `${this.state.aiText} cat`; // Append ' cat' to the existing text
      formData.append('text', aiTextWithCat);
      formData.append('grid_size', '1'); // Set grid_size to "1" for a single 1x1 image
  
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
        },
        body: formData,
      });
  
      const data = await resp.json();
  
      // Assuming the response contains an 'output_url' field with the generated image URL
      if (data.output_url) {
        this.props.setImageFilename(data.output_url);
        // Handle any other logic or state updates as needed
      } else {
        alertModal(this.props.darkMode, 'Failed to generate 3D Origami image. Please try again.');
      }
    } catch (error) {
      console.error('Error generating 3D Origami image:', error);
      alertModal(this.props.darkMode, 'An error occurred while generating 3D Origami image. Please try again.');
    } finally {
      this.setState({ loading: false }); // Set loading state to false
    }
  };
  
  

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

        <Avatar className="AvatarPreviewPanel" alt="" rank={this.props.rank} accessory={this.props.accessory} src={this.props.imageUrl} darkMode={this.props.darkMode} />
        <div className="AvatarControlPanel">
          <div className="AvatarButtonPanel">
            <Button style={{ marginRight: "5px" }} onClick={(e) => { this.props.setImageFilename("") }}>Remove PFP</Button>
            <Button onClick={this.openFileDialog}>Upload PFP</Button>
          </div>
          <p className="mt-1">OR GENERATE AN AI CAT</p>
          {this.state.showAIText ? (
            <>
              <TextField
                label="AI Text"
                variant="outlined"
                fullWidth
                value={this.state.aiText}
                onChange={this.handleAITextChange}
                className="mt-1"
              />
              <Button className="mt-1" onClick={this.hideTextfield}>Hide</Button>
              <Button className="mt-1" onClick={this.handleGenerateAIImage}>Generate</Button>
            </>
          ) : (
            <Button onClick={this.showTextfield}>ENTER PROMPT</Button>
          )}
        </div>
        <div className="loading-spinner" style={{ display: this.state.loading ? 'block' : 'none' }}>
      </div>
      </div>
    );
  }
}

export default Dropzone;
