import React, { Component } from "react";
import CloudUpload from '@material-ui/icons/CloudUpload';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../../../redux/Question/question.action';
import { alertModal } from "../../../../game_panel/modal/ConfirmAlerts"

import "./Dropzone.css";

class Dropzone extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hightlight: false,
      imagePreviewUrl: ''
    };
    this.fileInputRef = React.createRef();
  }

  static getDerivedStateFromProps(props, state) {
    return {
      imagePreviewUrl: props.imagePreviewUrl,
    };
  }

  openFileDialog = () => {
    if (this.props.disabled) return;
    this.fileInputRef.current.click();
  }

  

  previewImage = (file) => {
    if (!file) return;

    let reader = new FileReader();

    reader.onloadend = () => {
      this.props.setCurrentQuestionInfo({
        image: reader.result
      });
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

        const maxWidth = 400;
        const maxHeight = 400;

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
            alertModal(this.props.darkMode, "THIS ONE IS NOT VERY PURR-TY, TRY ANOTHER");
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

  render() {
    return (
      <div
        className={`Dropzone ${this.state.hightlight ? "Highlight" : ""}`}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
        onClick={this.openFileDialog}
        style={{ cursor: this.props.disabled ? "default" : "pointer" }}
      >
        <input
          ref={this.fileInputRef}
          className="FileInput"
          type="file"
          accept="image/x-png,image/gif,image/jpeg"
          onChange={this.onFileAdded}
        />
        <CloudUpload />
        {/* <span>Upload Image</span> */}
        {this.state.imagePreviewUrl ? <img className="PreviewPanel" alt="" src={this.state.imagePreviewUrl} /> : null}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  imagePreviewUrl: state.questionReducer.image
});

const mapDispatchToProps = {
  setCurrentQuestionInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dropzone);
