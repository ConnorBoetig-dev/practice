// backend/nodeServer/routes/files.js
import express from 'express';
import { generatePresignedUploadUrl } from '../utils/s3Client.js';
import { Upload } from '../models/Upload.js';

const router = express.Router();

/**
 * POST /api/files/upload
 * Generates presigned URL and saves file metadata
 */
router.post('/upload', async (req, res) => {
  try {
    const { fileName, fileType, userId } = req.body;
    
    // Validate required fields
    if (!fileName || !fileType || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileName, fileType, userId' 
      });
    }
    
    // Generate presigned URL for S3 upload
    const { uploadUrl, fileKey } = await generatePresignedUploadUrl(
      fileName,
      fileType,
      userId
    );
    
    // S3 URL where file will be accessible after upload
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    
    // Save metadata to MongoDB
    const upload = new Upload({
      userId,
      fileName,
      fileSize: req.body.fileSize || 0,
      fileType,
      s3Url
    });
    
    await upload.save();
    
    res.json({
      uploadUrl,
      fileKey,
      s3Url,
      uploadId: upload._id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * GET /api/files/user/:userId
 * Get all uploads for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all uploads for this user, sorted by newest first
    const uploads = await Upload.find({ userId })
      .sort({ uploadedAt: -1 })
      .limit(50);
    
    res.json({ uploads });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

export default router;