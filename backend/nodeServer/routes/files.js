// backend/nodeServer/routes/files.js
import express from 'express';
import { generatePresignedUploadUrl } from '../utils/s3Client.js';
import { Upload } from '../models/Upload.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

/**
 * POST /api/files/presign
 * Generates presigned URL for S3 upload
 */
router.post('/presign', async (req, res) => {
  try {
    const { fileName, fileType, userId, fileSize } = req.body;
    
    // Validate required fields
    if (!fileName || !fileType || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileName, fileType, userId' 
      });
    }

    // Validate fileSize if provided
    if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize <= 0)) {
      return res.status(400).json({
        error: 'fileSize must be a positive number'
      });
    }
    
    // Generate presigned URL for S3 upload
    const { uploadUrl, key } = await generatePresignedUploadUrl(
      fileName,
      fileType,
      userId
    );
    
    res.json({
      uploadUrl,
      key
    });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * POST /api/files/complete
 * Records file metadata after successful upload
 */
router.post('/complete', async (req, res) => {
  try {
    const { userId, fileName, fileType, fileSize, key } = req.body;
    
    // Validate required fields
    if (!userId || !fileName || !fileType || !key) {
      return res.status(400).json({
        error: 'Missing required fields: userId, fileName, fileType, key'
      });
    }

    // Construct S3 URL
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Create and save upload record
    const upload = new Upload({
      userId,
      fileName,
      fileSize,
      fileType,
      s3Url,
      key
    });
    
    await upload.save();
    
    res.json({
      uploadId: upload._id,
      s3Url
    });
  } catch (error) {
    console.error('Upload completion error:', error);
    res.status(500).json({ error: 'Failed to record upload metadata' });
  }
});

/**
 * GET /api/files/user/:userId
 * Get all uploads for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all non-deleted uploads for this user, sorted by newest first
    const uploads = await Upload.find({ 
      userId,
      deletedAt: null 
    })
      .sort({ uploadedAt: -1 })
      .limit(50);
    
    res.json({ uploads });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

export default router;