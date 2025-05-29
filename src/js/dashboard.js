// 📊 src/js/dashboard.js – Dashboard functionality
// -------------------------------------------------
// Key change: we no longer grab `currentUser` synchronously.
// We wait for Firebase Auth to restore the session first.

document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Dashboard loading…');

  /* --------------------------------------------------
     1️⃣  Wait for Firebase to tell us who the user is.
     -------------------------------------------------- */
  window.authFunctions.onAuthChange((currentUser) => {
    if (!currentUser) {
      // Nobody signed in ➜ bounce to home
      alert('Please log in first!');
      window.location.href = '../../index.html';
      return;
    }

    /* --------------------------------------------------
       2️⃣  Once we have a user, build the dashboard UI.
       -------------------------------------------------- */

    // 🔥 Firebase handles
    const storage    = firebase.storage();
    const storageRef = storage.ref();
    const db         = firebase.firestore();

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

    // 🎯 Show the user’s e-mail in the corner
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
        // Disable button & show progress bar
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading…';
        progressWrapper.style.display = 'block';
        statusMessage.style.display  = 'none';

        // Unique file name (timestamp to avoid clashes)
        const timestamp = Date.now();
        const fileName  = `${timestamp}-${selectedFile.name}`;
        const filePath  = `users/${currentUser.uid}/uploads/${fileName}`;

        // Start the upload
        const uploadTask = storageRef.child(filePath).put(selectedFile);

        // Track progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = pct + '%';
            progressText.textContent = Math.round(pct) + '%';
            console.log('Upload progress:', pct.toFixed(2) + '%');
          },
          (error) => {
            console.error('Upload error:', error);
            showStatus('Upload failed: ' + error.message, 'error');
            resetUploadUI();
          },
          async () => {
            console.log('Upload complete!');

            // Get the download URL
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

            // Save file metadata in Firestore
            await saveFileMetadata({
              name: selectedFile.name,
              size: selectedFile.size,
              type: selectedFile.type,
              url:  downloadURL,
              path: filePath,
              uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
              userId: currentUser.uid,
            });

            showStatus('File uploaded successfully! 🎉', 'success');
            resetUploadUI();
            loadUserFiles();
          }
        );
      } catch (err) {
        console.error(err);
        showStatus('Unexpected error: ' + err.message, 'error');
        resetUploadUI();
      }
    });

    /* ---------- Firestore helpers ---------- */
    async function saveFileMetadata(meta) {
      try {
        await db.collection('user_files').add(meta);
        console.log('File metadata saved');
      } catch (err) {
        console.error('Error saving metadata:', err);
      }
    }

    /* ---------- File-list loader ---------- */
    async function loadUserFiles() {
      try {
        filesGrid.innerHTML = '<p class="loading-text">Loading your files…</p>';

        const snap = await db
          .collection('user_files')
          .where('userId', '==', currentUser.uid)
          .orderBy('uploadedAt', 'desc')
          .get();

        if (snap.empty) {
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
        snap.forEach((doc) => {
          filesGrid.appendChild(createFileCard(doc.data()));
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

      const fileSize   = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const uploadDate = file.uploadedAt
        ? new Date(file.uploadedAt.toDate()).toLocaleDateString()
        : 'Unknown date';

      const isImage = file.type?.startsWith('image/');
      const isVideo = file.type?.startsWith('video/');

      card.innerHTML = `
        <div class="${isVideo ? 'video-preview' : ''}">
          ${
            isImage
              ? `<img src="${file.url}" alt="${file.name}" class="file-preview">`
              : isVideo
              ? `<video src="${file.url}" class="file-preview"></video>`
              : `<div class="file-preview" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📄</div>`
          }
        </div>
        <div class="file-info">
          <div class="file-name"  title="${file.name}">${file.name}</div>
          <div class="file-date">${uploadDate}</div>
          <div class="file-size">${fileSize}</div>
        </div>
      `;

      card.addEventListener('click', () => window.open(file.url, '_blank'));
      return card;
    }

    /* ---------- Helper: status banner ---------- */
    function showStatus(msg, type = 'info') {
      statusMessage.textContent = msg;
      statusMessage.className   = `status-message ${type}`;
      statusMessage.style.display = 'block';
      setTimeout(() => (statusMessage.style.display = 'none'), 5000);
    }

    /* ---------- Helper: reset upload UI ---------- */
    function resetUploadUI() {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload to Cloud';
      progressWrapper.style.display = 'none';
      progressFill.style.width  = '0%';
      progressText.textContent  = '0%';
      fileInput.value = '';
      fileNameDisplay.textContent = 'No file selected';
      selectedFile = null;
    }

    /* ---------- Log-out link ---------- */
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.authFunctions.logout();
        // onAuthChange will catch the redirect
      } catch (err) {
        console.error('Logout error:', err);
        alert('Error logging out: ' + err.message);
      }
    });

    /* ---------- Initial load of user files ---------- */
    loadUserFiles();
  });
});
