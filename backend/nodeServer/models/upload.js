 // backend/nodeServer/models/Upload.js
 import mongoose from 'mongoose';
 
 /**
  * Upload Schema - defines the structure of upload documents in MongoDB
  * Think of this as a blueprint for what data each upload record will contain
  */
 const uploadSchema = new mongoose.Schema({
   // Firebase Auth user ID (who uploaded this file)
   userId: {
     type: String,
     required: true,
     index: true // Makes queries by userId faster
   },
   
   // Original file name
   fileName: {
     type: String,
     required: true
   },
   
   // File size in bytes
   fileSize: {
     type: Number,
     required: true
   },
   
   // MIME type (e.g., 'image/jpeg', 'video/mp4')
   fileType: {
     type: String,
     required: true
   },
   
   // Full S3 URL where the file is stored
   s3Url: {
     type: String,
     required: true
   },
   
   // AI-generated labels (e.g., ['dog', 'outdoor', 'sunny'])
   labels: {
     type: [String],
     default: []
   },
   
   // Transcript for audio/video files
   transcript: {
     type: String,
     default: ''
   },
   
   // Timestamp when uploaded
   uploadedAt: {
     type: Date,
     default: Date.now
   }
 });
 
 // Create indexes for better query performance
 uploadSchema.index({ userId: 1, uploadedAt: -1 });
 
 // Export the model
 export const Upload = mongoose.model('Upload', uploadSchema);