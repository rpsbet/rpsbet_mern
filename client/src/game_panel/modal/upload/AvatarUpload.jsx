import React, { useState, useCallback } from 'react';
import Dropzone from './AvatarDropzone';
import uploadAvatarToPinata from '../../../actions/uploadAvatarToPinata';

function Upload(props) {
  const {
    darkMode,
    avatar,
    setImageFilename,
    rank,
    accessory,
    username,
    elite,
  } = props;

  const dispatch = useDispatch();
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
    [],
  );

  // UPDATED: Upload the file using Pinata
  const uploadFiles = useCallback(async (file) => {
    setUploadProgress({});
    setUploading(true);
    
    try {
      // Upload to Pinata and get URL
      const imageUrl = await dispatch(uploadAvatarToPinata(file));
      
      // Set the Pinata URL (not base64 data!)
      setImageFilename(imageUrl);
      setSuccessfullUploaded(true);
      
      console.log('✅ Avatar upload completed:', imageUrl);
      
    } catch (err) {
      console.error('❌ Avatar upload failed:', err);
      setSuccessfullUploaded(false);
    } finally {
      setUploading(false);
    }
  }, [dispatch, setImageFilename]);

  return (
    <div className="Upload">
      <div className="Content">
        <div style={{ margin: '20px auto auto auto' }}>
          <Dropzone
            onFileAdded={onFileAdded}
            disabled={uploading}
            darkMode={darkMode}
            imageUrl={avatar}
            setImageFilename={setImageFilename}
            rank={rank}
            accessory={accessory}
            elite={elite}
            username={username}
            avatar={avatar}
          />
          {uploading && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <p>Uploading avatar...</p>
            </div>
          )}
          {successfullUploaded && (
            <div style={{ textAlign: 'center', marginTop: '10px', color: 'green' }}>
              <p>✅ Avatar uploaded successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Upload;