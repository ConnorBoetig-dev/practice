// I'm creating the dashboard component that handles file uploads and displays user files.
// This replaces your dashboard.html and includes all the upload logic from your dashboard.js file.

import React, { useState, useEffect } from 'react';
import { authService } from '../services/firebase';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [userFiles, setUserFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const API_URL = 'http://localhost:4000/api';

  // I'm loading user files when the component mounts
  useEffect(() => {
    if (user) {
      loadUserFiles();
    }
  }, [user]);

  // I'm handling file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      console.log('File selected:', {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type,
      });
    }
  };

  // I'm handling the file upload process
  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    hideStatus();

    try {
      // Step 1: I'm getting the presigned URL from our backend
      showStatus('Getting upload URL...', 'info');

      const presignResponse = await fetch(`${API_URL}/files/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          userId: user.uid
        })
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignResponse.json();
      console.log('Got presigned URL:', { uploadUrl, key });

      // Step 2: I'm uploading the file directly to S3
      showStatus('Uploading to S3...', 'info');

      // I'm simulating progress since S3 PUT doesn't give us real progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Content-Type': selectedFile.type
        },
        body: selectedFile
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      console.log('File uploaded to S3 successfully');

      // Step 3: I'm recording the metadata in our database
      showStatus('Saving metadata...', 'info');

      const completeResponse = await fetch(`${API_URL}/files/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          userId: user.uid
        })
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to save file metadata');
      }

      // Success! I'm resetting the UI and reloading files
      showStatus('File uploaded successfully! 🎉', 'success');
      resetUploadUI();
      loadUserFiles();

    } catch (error) {
      console.error('Upload error:', error);
      showStatus('Upload failed: ' + error.message, 'error');
      resetUploadUI();
    }
  };

  // I'm loading the user's uploaded files
  const loadUserFiles = async () => {
    if (!user) return;

    setLoadingFiles(true);
    try {
      const response = await fetch(`${API_URL}/files/user/${user.uid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch files');
      }

      const { uploads } = await response.json();
      setUserFiles(uploads || []);

    } catch (error) {
      console.error('Error loading files:', error);
      showStatus('Error loading files: ' + error.message, 'error');
    } finally {
      setLoadingFiles(false);
    }
  };

  // I'm creating individual file cards for the grid
  const createFileCard = (file) => {
    const fileSize = file.fileSize ?
      (file.fileSize / 1024 / 1024).toFixed(2) + ' MB' :
      'Unknown size';

    const uploadDate = file.uploadedAt
      ? new Date(file.uploadedAt).toLocaleDateString()
      : 'Unknown date';

    const isImage = file.fileType?.startsWith('image/');
    const isVideo = file.fileType?.startsWith('video/');

    return (
      <div key={file._id} className="file-card">
        <div className="file-preview-container">
          {isImage ? (
            <img
              src={file.s3Url}
              alt={file.fileName}
              className="file-preview"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : isVideo ? (
            <video
              src={file.s3Url}
              className="file-preview"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="file-preview generic-file">
              <div style={{fontSize: '3rem'}}>📄</div>
              <div>File</div>
            </div>
          )}

          {(isImage || isVideo) && (
            <div className="error-placeholder" style={{display: 'none'}}>
              <div>{isImage ? '🖼️' : '🎥'}</div>
              <div>Preview Error</div>
            </div>
          )}
        </div>

        <div className="file-info">
          <div className="file-name" title={file.fileName}>{file.fileName}</div>
          <div className="file-date">{uploadDate}</div>
          <div className="file-size">{fileSize}</div>
          <button
            className="view-file-btn"
            onClick={() => window.open(file.s3Url, '_blank')}
          >
            View File
          </button>
        </div>
      </div>
    );
  };

  // I'm creating helper functions for UI management
  const showStatus = (message, type = 'info') => {
    setStatusMessage(message);
    setStatusType(type);

    if (type === 'success' || type === 'error') {
      setTimeout(() => hideStatus(), 5000);
    }
  };

  const hideStatus = () => {
    setStatusMessage('');
  };

  const resetUploadUI = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    // I'm resetting the file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome to ConLearn</h1>
        <div className="user-info">
          <span>Logged in as: {user?.email}</span>
          <button onClick={handleLogout} className="logout-link">
            Logout
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-card">
        <h2>📸 Upload Media Files</h2>
        <p>Upload images or videos to your personal cloud storage</p>

        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-input"
            accept="image/*,video/*"
            className="file-input"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-input" className="file-input-label">
            Choose File
          </label>
          <span className="file-name">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </span>
        </div>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="upload-btn"
        >
          {isUploading ? 'Uploading...' : 'Upload to Cloud'}
        </button>

        {/* Progress Bar */}
        {isUploading && (
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}

        {/* Status Messages */}
        {statusMessage && (
          <div className={`status-message ${statusType}`}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="files-section">
        <h2>📁 Your Uploaded Files</h2>
        <div className="files-grid">
          {loadingFiles ? (
            <p className="loading-text">Loading your files...</p>
          ) : userFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <p>No files uploaded yet</p>
              <p>Upload your first file to get started!</p>
            </div>
          ) : (
            userFiles.map(file => createFileCard(file))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
