// backend/nodeServer/routes/files.js - DEBUG VERSION
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
    
    // 🐛 DEBUG: Log what we received
    console.log('🔍 PRESIGN REQUEST:', {
      fileName,
      fileType,
      userId,
      fileSize,
      headers: req.headers
    });
    
    // Validate required fields
    if (!fileName || !fileType || !userId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: fileName, fileType, userId' 
      });
    }

    // Validate fileSize if provided
    if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize <= 0)) {
      console.log('❌ Invalid fileSize:', fileSize);
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
    
    // 🐛 DEBUG: Log what we're returning
    console.log('✅ PRESIGN SUCCESS:', {
      uploadUrl: uploadUrl.substring(0, 100) + '...', // Don't log full URL for security
      key,
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION
    });
    
    res.json({
      uploadUrl,
      key
    });
  } catch (error) {
    console.error('❌ PRESIGN ERROR:', error);
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
    
    // 🐛 DEBUG: Log what we received
    console.log('🔍 COMPLETE REQUEST:', {
      userId,
      fileName,
      fileType,
      fileSize,
      key
    });
    
    // Validate required fields
    if (!userId || !fileName || !fileType || !key) {
      console.log('❌ Missing required fields for complete');
      return res.status(400).json({
        error: 'Missing required fields: userId, fileName, fileType, key'
      });
    }

    // Construct S3 URL - Let's make this more robust
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    
    if (!bucketName || !region) {
      console.error('❌ Missing AWS environment variables:', { bucketName, region });
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    
    // 🐛 DEBUG: Log the constructed URL
    console.log('🔗 CONSTRUCTED S3 URL:', s3Url);

    // Create and save upload record
    const upload = new Upload({
      userId,
      fileName,
      fileSize: fileSize || 0, // Default to 0 if not provided
      fileType,
      s3Url,  // Save the full URL so frontend doesn't need to reconstruct
      uploadedAt: new Date()
    });
    
    const savedUpload = await upload.save();
    
    // 🐛 DEBUG: Log what we saved
    console.log('💾 SAVED TO DATABASE:', {
      uploadId: savedUpload._id,
      userId: savedUpload.userId,
      fileName: savedUpload.fileName,
      s3Url: savedUpload.s3Url,
      uploadedAt: savedUpload.uploadedAt
    });
    
    res.json({
      uploadId: savedUpload._id,
      s3Url: savedUpload.s3Url,
      success: true
    });
  } catch (error) {
    console.error('❌ COMPLETE ERROR:', error);
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
    
    // 🐛 DEBUG: Log the request
    console.log('🔍 FETCH FILES REQUEST for userId:', userId);
    
    // Find all non-deleted uploads for this user, sorted by newest first
    const uploads = await Upload.find({ 
      userId,
      deletedAt: null 
    })
      .sort({ uploadedAt: -1 })
      .limit(50);
    
    // 🐛 DEBUG: Log what we found
    console.log('📁 FOUND FILES:', {
      userId,
      count: uploads.length,
      files: uploads.map(upload => ({
        id: upload._id,
        fileName: upload.fileName,
        s3Url: upload.s3Url,
        fileType: upload.fileType,
        uploadedAt: upload.uploadedAt
      }))
    });
    
    res.json({ uploads });
  } catch (error) {
    console.error('❌ FETCH FILES ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

/**
 * 🐛 DEBUG ENDPOINT - Check S3 URLs
 * GET /api/files/debug/urls/:userId
 * This endpoint helps us debug URL issues
 */
router.get('/debug/urls/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔧 DEBUG URL CHECK for userId:', userId);
    
    const uploads = await Upload.find({ userId }).limit(10);
    
    const debugInfo = {
      userId,
      environment: {
        AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
        AWS_REGION: process.env.AWS_REGION,
        NODE_ENV: process.env.NODE_ENV
      },
      uploads: uploads.map(upload => ({
        fileName: upload.fileName,
        storedS3Url: upload.s3Url,
        reconstructedUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${upload.key || 'NO-KEY'}`,
        hasKey: !!upload.key,
        uploadedAt: upload.uploadedAt
      }))
    };
    
    console.log('🔧 DEBUG INFO:', debugInfo);
    
    res.json(debugInfo);
  } catch (error) {
    console.error('❌ DEBUG ERROR:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

export default router;