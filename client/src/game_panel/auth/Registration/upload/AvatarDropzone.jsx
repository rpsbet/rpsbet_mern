import React, { Component } from "react";
import CloudUpload from '@material-ui/icons/CloudUpload';
import { connect } from 'react-redux';
import { setCurrentProductInfo } from '../../../../redux/Item/item.action';
import "./AvatarDropzone.css";
import { alertModal } from '../../../modal/ConfirmAlerts';

class Dropzone extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hightlight: false,
      imagePreviewUrl: ''
    };
    this.fileInputRef = React.createRef();

    this.openFileDialog = this.openFileDialog.bind(this);
    this.onFileAdded = this.onFileAdded.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (state.imagePreviewUrl != props.imagePreviewUrl) {
      return {
        imagePreviewUrl: props.imagePreviewUrl,
      };
    }
    return null;
  }

  openFileDialog() {
    if (this.props.disabled) return;
    this.fileInputRef.current.click();
  }

  previewImage(file) {
    if (!file) return;

    let reader = new FileReader();

    reader.onloadend = () => {
      this.props.setCurrentProductInfo({
        image: reader.result
      });
    }

    reader.readAsDataURL(file)
  }

  onFileAdded(evt) {
    if (this.props.disabled) return;
    const file = evt.target.files[0];

    if (file.size / 1024 / 1024 > 2) {//file size > 2MB
      alertModal(this.props.isDarkMode, "The file size is more than 2 MB. Please select another file to upload.");
      return;
    }

    this.previewImage(file);

    if (this.props.onFileAdded) {
      this.props.onFileAdded(file);
    }
  }

  onDragOver(event) {
    event.preventDefault();
    if (this.props.disabed) return;
    this.setState({ hightlight: true });
  }

  onDragLeave(event) {
    this.setState({ hightlight: false });
  }

  onDrop(event) {
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
        className={`AvatarDropzone ${this.state.hightlight ? "AvatarHighlight" : ""}`}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
        onClick={this.openFileDialog}
      >
        <input
          ref={this.fileInputRef}
          className="AvatarFileInput"
          type="file"
          accept="image/x-png,image/gif,image/jpeg"
          onChange={this.onFileAdded}
        />
        <CloudUpload />
        <span>Upload Image</span>
        {this.state.imagePreviewUrl ? <img className="AvatarPreviewPanel" alt="" src={`${this.state.imagePreviewUrl} `} /> : null}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  imagePreviewUrl: state.itemReducer.image
});

const mapDispatchToProps = {
  setCurrentProductInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dropzone);
