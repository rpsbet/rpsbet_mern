import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import Dropzone from './AvatarDropzone';
import uniqid from 'uniqid';

function Upload(props) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [successfullUploaded, setSuccessfullUploaded] = useState(false);

  // Handle new file added
  const onFileAdded = useCallback(
    (file) => {
      setFile(file);
      uploadFiles(file);
    },
    [] // No external dependencies besides uploadFiles
  );

  // Upload the file(s)
  const uploadFiles = useCallback(async (file) => {
    setUploadProgress({});
    setUploading(true);
    try {
      await Promise.all([prepareFormData(file)]);
      setSuccessfullUploaded(true);
      setUploading(false);
    } catch (err) {
      console.error('Error uploading files:', err);
      setSuccessfullUploaded(true);
      setUploading(false);
    }
  }, []);

  // Prepare FormData (returns a promise)
  const prepareFormData = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const file_ext = file.name.split('.').pop();
        const filename = uniqid('IMG_') + '.' + file_ext;

        const formData = new FormData();
        formData.append('file', file, filename);

        // You likely want to do something with { formData, filename } here
        // such as sending it to the server with fetch/axios
        // For now, we just resolve.
        resolve({ formData, filename });
      } catch (error) {
        console.error('Error preparing FormData:', error);
        reject(error);
      }
    });
  };

  return (
    <div className="Upload">
      <div className="Content">
        <div style={{ margin: '20px auto auto auto' }}>
          <Dropzone
            onFileAdded={onFileAdded}
            disabled={uploading && successfullUploaded}
            darkMode={props.darkMode}
            imageUrl={props.avatar}
            setImageFilename={props.setImageFilename}
            rank={props.rank}
            accessory={props.accessory}
            username={props.username}
            avatar={props.avatar}
          />
        </div>
      </div>
    </div>
  );
}

// If you need Redux state or actions, define them here:
const mapStateToProps = (state) => ({});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Upload);
