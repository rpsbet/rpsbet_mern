import React, { Component } from "react";
import Dropzone from "./AvatarDropzone";
import { connect } from 'react-redux';
import "./AvatarUpload.css";

const uniqid = require('uniqid');

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      uploading: false,
      uploadProgress: {},
      successfullUploaded: false
    };
  }

  onFileAdded = (file) => {
    this.setState({ file: file });
    this.uploadFiles(file);
  }
  uploadFiles = async (file) => {
    this.setState({ uploadProgress: {}, uploading: true });
    const promises = [];
    promises.push(this.prepareFormData(file));
    try {
      await Promise.all(promises);
      this.setState({ successfullUploaded: true, uploading: false });
    } catch (e) {
      this.setState({ successfullUploaded: true, uploading: false });
    }
  }

  prepareFormData = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const file_ext = file.name.split('.').pop();
        const filename = uniqid('IMG_') + '.' + file_ext;
  
        const formData = new FormData();
        formData.append("file", file, filename);
        resolve({ formData, filename });
      } catch (error) {
        console.error("Error preparing FormData:", error);
        reject(error);
      }
    });
  };

  render() {
    return (
      <div className="Upload">
        <div className="Content">
          <div style={{margin: '20px auto auto auto'}}>
            <Dropzone
              onFileAdded={this.onFileAdded}
              disabled={this.state.uploading && this.state.successfullUploaded}
              darkMode={this.props.darkMode}
              imageUrl={this.props.avatar}
              setImageFilename={this.props.setImageFilename}
              rank={this.props.rank}
              accessory={this.props.accessory}
              username={this.props.username}
              avatar={this.props.avatar}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Upload);
