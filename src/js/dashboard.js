// 📊 src/js/dashboard.js – Dashboard functionality
// This file handles file uploads and displays user's files

document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Dashboard loading…');

  // Backend API URL
  const API_URL = 'http://localhost:4000/api';

  /* --------------------------------------------------
     1️⃣  Wait for Firebase to tell us who the user is.
     -------------------------------------------------- */
  window.authFunctions.onAuthChange(async (currentUser) => {
    if (!currentUser) {
      // Nobody signed in ➜ bounce to home
      alert('Please log in first!');
      window.location.href = '../../index.html';
      return;
    }

    /* --------------------------------------------------
       2️⃣  Once we have a user, build the dashboard UI.
       -------------------------------------------------- */

    // 📦 Page elements
    const userEmailElement = document.getElementById('user-email');
    const fileInput        = document.getElementById('file-input');
    const fileNameDisplay  = document.getElementById('file-name');
    const uploadBtn        = document.getElementById('upload-btn');
    const progressWrapper  = document.getElementById('progress-wrapper');
    const progressFill     = document.getElementById('progress-fill');
    const progressText     = document.getElementById('progress-text');
    const statusMessage    = document.getElementById('status-message');
    const filesGrid        = document.getElementById('files-grid');
    const logoutLink       = document.getElementById('logout-link');

    // 🎯 Show the user's email
    userEmailElement.textContent = `Logged in as: ${currentUser.email}`;

    // 📁 Keep track of the file the user picks
    let selectedFile = null;

    /* ---------- File-picker handler ---------- */
    fileInput.addEventListener('change', (event) => {
      selectedFile = event.target.files[0];

      if (selectedFile) {
        fileNameDisplay.textContent = selectedFile.name;
        uploadBtn.disabled = false;

        console.log('File selected:', {
          name: selectedFile.name,
          size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
          type: selectedFile.type,
        });
      } else {
        fileNameDisplay.textContent = 'No file selected';
        uploadBtn.disabled = true;
      }
    });

    /* ---------- Upload-button handler ---------- */
    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile) return;

      try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Getting upload URL...';
        progressWrapper.style.display = 'block';
        statusMessage.style.display = 'none';

        // Step 1: Get presigned URL from backend
        const presignResponse = await fetch(`${API_URL}/files/presign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            userId: currentUser.uid
          })
        });

        if (!presignResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, s3Url } = await presignResponse.json();

        // Step 2: Upload file directly to S3
        uploadBtn.textContent = 'Uploading to S3...';
        
        // Simple progress simulation (since S3 PUT doesn't give us progress)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress <= 90) {
            progressFill.style.width = progress + '%';
            progressText.textContent = progress + '%';
          }
        }, 200);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type
          }
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressText.textContent = '100%';

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to S3');
        }

        // Step 3: Record metadata in our database
        uploadBtn.textContent = 'Saving metadata...';
        
        const completeResponse = await fetch(`${API_URL}/files/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            s3Url
          })
        });

        if (!completeResponse.ok) {
          throw new Error('Failed to save file metadata');
        }

        // Success!
        showStatus('File uploaded successfully! 🎉', 'success');
        resetUploadUI();
        loadUserFiles();

      } catch (error) {
        console.error('Upload error:', error);
        showStatus('Upload failed: ' + error.message, 'error');
        resetUploadUI();
      }
    });

    /* ---------- File-list loader ---------- */
    async function loadUserFiles() {
      try {
        filesGrid.innerHTML = '<p class="loading-text">Loading your files…</p>';

        // Fetch from MongoDB via backend API
        const response = await fetch(`${API_URL}/files/user/${currentUser.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        
        const { uploads } = await response.json();
        
        if (!uploads || uploads.length === 0) {
          filesGrid.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">📁</div>
              <p>No files uploaded yet</p>
              <p>Upload your first file to get started!</p>
            </div>
          `;
          return;
        }
        
        // Clear grid and render cards
        filesGrid.innerHTML = '';
        uploads.forEach((file) => {
          filesGrid.appendChild(createFileCard(file));
        });
      } catch (err) {
        console.error('Error loading files:', err);
        filesGrid.innerHTML = '<p class="error-text">Error loading files</p>';
      }
    }

    /* ---------- File-card factory ---------- */
    function createFileCard(file) {
      const card = document.createElement('div');
      card.className = 'file-card';

      const fileSize = (file.fileSize / 1024 / 1024).toFixed(2) + ' MB';
      const uploadDate = file.uploadedAt
        ? new Date(file.uploadedAt).toLocaleDateString()
        : 'Unknown date';

      const isImage = file.fileType?.startsWith('image/');
      const isVideo = file.fileType?.startsWith('video/');

      card.innerHTML = `
        <div class="${isVideo ? 'video-preview' : ''}">
          ${
            isImage
              ? `<img src="${file.s3Url}" alt="${file.fileName}" class="file-preview">`
              : isVideo
              ? `<video src="${file.s3Url}" class="file-preview"></video>`
              : `<div class="file-preview" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📄</div>`
          }
        </div>
        <div class="file-info">
          <div class="file-name" title="${file.fileName}">${file.fileName}</div>
          <div class="file-date">${uploadDate}</div>
          <div class="file-size">${fileSize}</div>
        </div>
      `;

      card.addEventListener('click', () => window.open(file.s3Url, '_blank'));
      return card;
    }

    /* ---------- Helper: status banner ---------- */
    function showStatus(msg, type = 'info') {
      statusMessage.textContent = msg;
      statusMessage.className = `status-message ${type}`;
      statusMessage.style.display = 'block';
      setTimeout(() => (statusMessage.style.display = 'none'), 5000);
    }

    /* ---------- Helper: reset upload UI ---------- */
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

    /* ---------- Log-out link ---------- */
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.authFunctions.logout();
        window.location.href = '../../index.html';
      } catch (err) {
        console.error('Logout error:', err);
        alert('Error logging out: ' + err.message);
      }
    });

    /* ---------- Initial load of user files ---------- */
    loadUserFiles();
  });
});