import React, { Component } from "react";
import Dropzone from "./AvatarDropzone";
import { connect } from 'react-redux';
import { setCurrentProductInfo } from '../../../../redux/Item/item.action';
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

    this.onFileAdded = this.onFileAdded.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
  }

  onFileAdded(file) {
    if (file.size / 1024 / 1024 > 2) //file size > 2MB
      return;
    this.setState({ file: file });
    this.uploadFiles(file);
  }

  async uploadFiles(file) {
    this.setState({ uploadProgress: {}, uploading: true });
    const promises = [];
    promises.push(this.sendRequest(file));
    try {
      await Promise.all(promises);

      this.setState({ successfullUploaded: true, uploading: false });
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({ successfullUploaded: true, uploading: false });
    }
  }

  sendRequest(file) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      let file_ext = file.name.split('.').pop();
      let filename = uniqid('IMG_') + '.' + file_ext;

      req.upload.addEventListener("progress", event => {
        console.log((event.loaded / event.total) * 100, '%');
      });

      req.upload.addEventListener("load", event => {
        console.log('Done. 100%', this.props);
        this.props.setImageFilename('/img/uploads/' + filename);
      });

      req.upload.addEventListener("error", event => {
        console.log(req.response);
      });

      const formData = new FormData();
  
      formData.append("file", file, filename);

      console.log(formData);
      req.open("POST", "/api/upload/");
      // req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      req.send(formData);
    });
  }

  render() {
    return (
      <div className="Upload">
        <div className="Content">
          <div style={{margin: 'auto'}}>
            <Dropzone
              onFileAdded={this.onFileAdded}
              disabled={this.state.uploading && this.state.successfullUploaded}
              minSize={0}
              maxSize={2097152}
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
  setCurrentProductInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Upload);
