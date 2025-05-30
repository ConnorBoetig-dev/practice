// 📊 src/js/dashboard.js – Dashboard functionality (FIXED VERSION)
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
          const errorData = await presignResponse.json();
          throw new Error(errorData.error || 'Failed to get upload URL');
        }

        const { uploadUrl, key } = await presignResponse.json();
        console.log('Got presigned URL:', { uploadUrl, key });

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
          mode: 'cors',
          headers: {
            'Content-Type': selectedFile.type
          },
          body: selectedFile
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressText.textContent = '100%';

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to S3');
        }

        console.log('File uploaded to S3 successfully');

        // Step 3: Record metadata in our database
        uploadBtn.textContent = 'Saving metadata...';
        
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
            userId: currentUser.uid
          })
        });

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json();
          throw new Error(errorData.error || 'Failed to save file metadata');
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch files');
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

    /* ---------- File-card factory (PROPERLY FIXED!) ---------- */
    function createFileCard(file) {
      const card = document.createElement('div');
      card.className = 'file-card';

      const fileSize = file.fileSize ? 
        (file.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 
        'Unknown size';
        
      const uploadDate = file.uploadedAt
        ? new Date(file.uploadedAt).toLocaleDateString()
        : 'Unknown date';

      const isImage = file.fileType?.startsWith('image/');
      const isVideo = file.fileType?.startsWith('video/');

      // Use the s3Url from database
      const fileUrl = file.s3Url;
      
      console.log('🖼️ Creating file card:', {
        fileName: file.fileName,
        fileUrl: fileUrl,
        fileType: file.fileType,
        isImage,
        isVideo
      });

      // Create the HTML structure
      card.innerHTML = `
        <div class="file-preview-container">
          ${
            isImage
              ? `<img 
                   src="${fileUrl}" 
                   alt="${file.fileName}" 
                   class="file-preview"
                   style="display: block;"
                 >
                 <div class="error-placeholder" style="display: none;">
                   <div>🖼️</div>
                   <div>Preview Error</div>
                 </div>`
              : isVideo
              ? `<video 
                   src="${fileUrl}" 
                   class="file-preview"
                   style="display: block;"
                 ></video>
                 <div class="error-placeholder" style="display: none;">
                   <div>🎥</div>
                   <div>Preview Error</div>
                 </div>`
              : `<div class="file-preview generic-file">
                   <div style="font-size:3rem;">📄</div>
                   <div>File</div>
                 </div>`
          }
        </div>
        <div class="file-info">
          <div class="file-name" title="${file.fileName}">${file.fileName}</div>
          <div class="file-date">${uploadDate}</div>
          <div class="file-size">${fileSize}</div>
          <button class="view-file-btn">View File</button>
        </div>
      `;

      // Add event listeners after the HTML is created
      const previewImage = card.querySelector('img');
      const previewVideo = card.querySelector('video');
      const errorPlaceholder = card.querySelector('.error-placeholder');
      const viewButton = card.querySelector('.view-file-btn');

      // Handle image/video load errors
      if (previewImage && errorPlaceholder) {
        previewImage.onload = () => {
          console.log('✅ Image loaded successfully:', file.fileName);
        };
        previewImage.onerror = () => {
          console.log('❌ Image failed to load:', file.fileName);
          previewImage.style.display = 'none';
          errorPlaceholder.style.display = 'flex';
        };
      }

      if (previewVideo && errorPlaceholder) {
        previewVideo.onloadeddata = () => {
          console.log('✅ Video loaded successfully:', file.fileName);
        };
        previewVideo.onerror = () => {
          console.log('❌ Video failed to load:', file.fileName);
          previewVideo.style.display = 'none';
          errorPlaceholder.style.display = 'flex';
        };
      }

      // Handle view button click
      viewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔗 Opening file:', fileUrl);
        window.open(fileUrl, '_blank');
      });

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