import React, { useState, useCallback } from 'react';
import Dropzone from './AvatarDropzone';
import uniqid from 'uniqid';

function Upload(props) {
  const {
    darkMode,
    avatar,
    setImageFilename,
    rank,
    accessory,
    username,
  } = props;

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
    [], // No external dependencies besides uploadFiles
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
      setSuccessfullUploaded(true); // Still sets to true despite error; consider changing if unintended
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

        // Resolve with formData and filename for potential upload
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
            disabled={uploading && successfullUploaded} // Consider logic: should be || if disabling during either state
            darkMode={darkMode}
            imageUrl={avatar}
            setImageFilename={setImageFilename}
            rank={rank}
            accessory={accessory}
            username={username}
            avatar={avatar}
          />
        </div>
      </div>
    </div>
  );
}

export default Upload;