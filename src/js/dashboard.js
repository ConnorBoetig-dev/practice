// 📊 src/js/dashboard.js - Dashboard functionality
// This file handles all the dashboard features like file uploads

// 🏁 Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 Dashboard loading...');
  
  // 🔐 Check if user is logged in
  const currentUser = window.authFunctions.getCurrentUser();
  if (!currentUser) {
    // Not logged in? Send them back to home page
    alert('Please log in first!');
    window.location.href = '../../index.html';
    return;
  }
  
  // 🔥 Get Firebase Storage reference
  const storage = firebase.storage();
  const storageRef = storage.ref();
  
  // 🔥 Get Firestore reference (for saving file metadata)
  const db = firebase.firestore();
  
  // 📦 Get page elements
  const userEmailElement = document.getElementById('user-email');
  const fileInput = document.getElementById('file-input');
  const fileNameDisplay = document.getElementById('file-name');
  const uploadBtn = document.getElementById('upload-btn');
  const progressWrapper = document.getElementById('progress-wrapper');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const statusMessage = document.getElementById('status-message');
  const filesGrid = document.getElementById('files-grid');
  const logoutLink = document.getElementById('logout-link');
  
  // 🎯 Display user email
  userEmailElement.textContent = `Logged in as: ${currentUser.email}`;
  
  // 📁 Variable to store selected file
  let selectedFile = null;
  
  // 🎯 File input change handler
  fileInput.addEventListener('change', function(event) {
    selectedFile = event.target.files[0];
    
    if (selectedFile) {
      // Show file name
      fileNameDisplay.textContent = selectedFile.name;
      
      // Enable upload button
      uploadBtn.disabled = false;
      
      // Log file info
      console.log('File selected:', {
        name: selectedFile.name,
        size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        type: selectedFile.type
      });
    } else {
      fileNameDisplay.textContent = 'No file selected';
      uploadBtn.disabled = true;
    }
  });
  
  // 📤 Upload button click handler
  uploadBtn.addEventListener('click', async function() {
    if (!selectedFile) return;
    
    try {
      // Disable button during upload
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';
      
      // Show progress bar
      progressWrapper.style.display = 'block';
      statusMessage.style.display = 'none';
      
      // Create a unique file name to avoid collisions
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name}`;
      const filePath = `users/${currentUser.uid}/uploads/${fileName}`;
      
      // Create storage reference
      const fileRef = storageRef.child(filePath);
      
      // Start upload
      const uploadTask = fileRef.put(selectedFile);
      
      // Monitor upload progress
      uploadTask.on('state_changed', 
        // Progress handler
        function(snapshot) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressFill.style.width = progress + '%';
          progressText.textContent = Math.round(progress) + '%';
          
          console.log('Upload progress:', progress.toFixed(2) + '%');
        },
        
        // Error handler
        function(error) {
          console.error('Upload error:', error);
          showStatus('Upload failed: ' + error.message, 'error');
          resetUploadUI();
        },
        
        // Success handler
        async function() {
          console.log('Upload complete!');
          
          // Get download URL
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          
          // Save file metadata to Firestore
          await saveFileMetadata({
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            url: downloadURL,
            path: filePath,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser.uid
          });
          
          showStatus('File uploaded successfully! 🎉', 'success');
          resetUploadUI();
          
          // Reload files list
          loadUserFiles();
        }
      );
      
    } catch (error) {
      console.error('Upload error:', error);
      showStatus('Upload failed: ' + error.message, 'error');
      resetUploadUI();
    }
  });
  
  // 💾 Save file metadata to Firestore
  async function saveFileMetadata(metadata) {
    try {
      await db.collection('user_files').add(metadata);
      console.log('File metadata saved');
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  }
  
  // 📁 Load user's files
  async function loadUserFiles() {
    try {
      filesGrid.innerHTML = '<p class="loading-text">Loading your files...</p>';
      
      // Query Firestore for user's files
      const snapshot = await db.collection('user_files')
        .where('userId', '==', currentUser.uid)
        .orderBy('uploadedAt', 'desc')
        .get();
      
      if (snapshot.empty) {
        filesGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <p>No files uploaded yet</p>
            <p>Upload your first file to get started!</p>
          </div>
        `;
        return;
      }
      
      // Clear grid
      filesGrid.innerHTML = '';
      
      // Display each file
      snapshot.forEach(doc => {
        const file = doc.data();
        const fileCard = createFileCard(file);
        filesGrid.appendChild(fileCard);
      });
      
    } catch (error) {
      console.error('Error loading files:', error);
      filesGrid.innerHTML = '<p class="error-text">Error loading files</p>';
    }
  }
  
  // 🎨 Create file card element
  function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    
    // Format file size
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    
    // Format upload date
    const uploadDate = file.uploadedAt ? 
      new Date(file.uploadedAt.toDate()).toLocaleDateString() : 
      'Unknown date';
    
    // Determine if it's an image or video
    const isImage = file.type && file.type.startsWith('image/');
    const isVideo = file.type && file.type.startsWith('video/');
    
    card.innerHTML = `
      <div class="${isVideo ? 'video-preview' : ''}">
        ${isImage ? 
          `<img src="${file.url}" alt="${file.name}" class="file-preview">` :
          isVideo ?
          `<video src="${file.url}" class="file-preview"></video>` :
          `<div class="file-preview" style="display: flex; align-items: center; justify-content: center; font-size: 3rem;">📄</div>`
        }
      </div>
      <div class="file-info">
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="file-date">${uploadDate}</div>
        <div class="file-size">${fileSize}</div>
      </div>
    `;
    
    // Add click handler to open file
    card.addEventListener('click', function() {
      window.open(file.url, '_blank');
    });
    
    return card;
  }
  
  // 🎯 Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusMessage.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
  
  // 🔄 Reset upload UI
  function resetUploadUI() {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload to Cloud';
    progressWrapper.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    fileInput.value = '';
    fileNameDisplay.textContent = 'No file selected';
    selectedFile = null;
  }
  
  // 🚪 Logout handler
  logoutLink.addEventListener('click', async function(event) {
    event.preventDefault();
    
    try {
      await window.authFunctions.logout();
      window.location.href = '../../index.html';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out: ' + error.message);
    }
  });
  
  // 👀 Watch for auth state changes
  window.authFunctions.onAuthChange(function(user) {
    if (!user) {
      // User logged out, redirect to home
      window.location.href = '../../index.html';
    }
  });
  
  // 📁 Load files when page loads
  loadUserFiles();
});