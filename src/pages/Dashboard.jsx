// 📄 Dashboard.jsx - The main page users see after logging in
import React, { useState } from 'react';
import '../styles/dashboard.css';  // Import our dashboard-specific styles

// This is a React component - think of it as a template that creates HTML
function Dashboard() {
  // 🎯 State variables - these are like containers that hold changing data
  // When these change, React automatically updates what the user sees
  
  // selectedFile: holds the file the user picked (starts as null = nothing)
  const [selectedFile, setSelectedFile] = useState(null);
  
  // uploadProgress: tracks upload percentage (0 to 100)
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // uploadStatus: shows messages like "Uploading..." or "Success!"
  const [uploadStatus, setUploadStatus] = useState('');
  
  // isUploading: true when upload is happening, false when not
  const [isUploading, setIsUploading] = useState(false);

  // 📁 This function runs when user picks a file
  const handleFileSelect = (event) => {
    // event.target is the <input> element
    // event.target.files is an array of selected files
    // [0] gets the first file (we only allow one)
    const file = event.target.files[0];
    
    if (file) {
      console.log('File selected:', file.name, 'Size:', file.size, 'bytes');
      setSelectedFile(file);  // Save the file in our state
      setUploadStatus('');    // Clear any old messages
      setUploadProgress(0);   // Reset progress bar
    }
  };

  // 📤 This function handles the upload when button is clicked
  const handleUpload = async () => {
    // Safety check: make sure a file was selected
    if (!selectedFile) {
      setUploadStatus('Please select a file first!');
      return;  // Stop here if no file
    }

    // Prevent multiple uploads at once
    setIsUploading(true);
    setUploadStatus('Requesting upload permission...');

    try {
      // 🎫 Step 1: Ask our backend for a pre-signed URL
      // Build the API URL with query parameters
      const apiUrl = `${import.meta.env.VITE_API_BASE}/generate-presigned-url`;
      const params = new URLSearchParams({
        fileName: selectedFile.name,
        fileType: selectedFile.type
      });
      
      console.log('Requesting presigned URL from:', `${apiUrl}?${params}`);
      
      // Make the API call
      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          // TODO: Add Firebase auth token here later
          // 'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const presignData = await response.json();
      console.log('Received presign data:', presignData);
      
      // 📤 Step 2: Upload file to S3 using the pre-signed URL
      setUploadStatus('Uploading file to cloud storage...');
      
      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
          console.log(`Upload progress: ${percentComplete}%`);
        }
      });
      
      // Handle completion
      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        // Open connection and set headers
        xhr.open(presignData.method || 'PUT', presignData.url);
        
        // Set content type header
        if (presignData.headers && presignData.headers['Content-Type']) {
          xhr.setRequestHeader('Content-Type', presignData.headers['Content-Type']);
        }
        
        // Send the file
        xhr.send(selectedFile);
      });
      
      setUploadStatus('Upload complete! 🎉');
      console.log('File uploaded successfully to:', presignData.key);
      
      // Reset file selection after successful upload
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.querySelector('.file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      // This runs whether upload succeeded or failed
      setIsUploading(false);
    }
  };

  // 🎨 This is what the component displays (JSX = JavaScript + HTML)
  return (
    <div className="dashboard-container">
      <h1>Welcome to Your Dashboard! 🎯</h1>
      
      {/* Upload Card Section */}
      <div className="upload-card">
        <h2>📤 Upload Media to Cloud Storage</h2>
        <p>
          Select an image or video file to upload to your secure cloud storage. 
          Files are stored safely in Amazon S3 and only you can access them.
        </p>
        
        {/* File Input - lets user pick a file */}
        <input
          type="file"
          className="file-input"
          accept="image/*,video/*"  // Only allow images and videos
          onChange={handleFileSelect}  // Run handleFileSelect when file picked
          disabled={isUploading}  // Disable during upload
        />
        
        {/* Show selected file info */}
        {selectedFile && (
          <p style={{ color: '#888', fontSize: '14px' }}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        
        {/* Upload Button */}
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}  // Disable if no file or uploading
        >
          {isUploading ? 'Uploading...' : 'Upload to S3'}
        </button>
        
        {/* Progress Bar - only show during upload */}
        {uploadProgress > 0 && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}  // Dynamic width based on progress
            />
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
        
        {/* Status Message */}
        {uploadStatus && (
          <div className={`status-message ${uploadStatus.includes('complete') ? 'success' : uploadStatus.includes('failed') ? 'error' : ''}`}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
}

// Export so other files can import and use this component
export default Dashboard;