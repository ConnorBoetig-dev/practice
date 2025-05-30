// backend/nodeServer/utils/s3Client.js
// 🔧 This file handles all S3 operations for ConLearn
// It creates pre-signed URLs that let users upload files safely

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// AWS Configuration
const AWS_CONFIG = {
  bucketName: process.env.AWS_BUCKET_NAME,
  region: process.env.AWS_REGION
};

// Validate required environment variables
if (!AWS_CONFIG.bucketName || !AWS_CONFIG.region) {
  console.error('❌ Missing required AWS environment variables');
  console.error('Please ensure AWS_BUCKET_NAME and AWS_REGION are set in .env');
  process.exit(1);
}

/**
 * 🏗️ Create S3 Client
 * This is like creating a "phone line" to talk to AWS S3
 * It needs your AWS credentials to know who you are
 */
const s3Client = new S3Client({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // Your AWS username
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY  // Your AWS password
  }
});

/**
 * 📤 Generate Pre-signed Upload URL
 * This creates a special temporary link that allows file uploads
 * 
 * @param {string} fileName - Original name of the file (e.g., "vacation.jpg")
 * @param {string} fileType - MIME type of the file (e.g., "image/jpeg")
 * @param {string} userId - Firebase user ID (to organize files by user)
 * @returns {Object} - Contains the upload URL and the S3 key (file path)
 */
export async function generatePresignedUploadUrl(fileName, fileType, userId) {
  try {
    // 🔑 Create a unique file path in S3
    // Example: "user123/uploads/550e8400-e29b-41d4-a716-446655440000.jpg"
    const fileExtension = fileName.split('.').pop(); // Get file extension
    const uniqueId = uuidv4(); // Generate unique ID to prevent overwrites
    const s3Key = `${userId}/uploads/${uniqueId}.${fileExtension}`;
    
    // 📦 Create the S3 upload command
    // This tells S3 what we want to do (PUT = upload a file)
    const command = new PutObjectCommand({
      Bucket: AWS_CONFIG.bucketName,  // Which S3 bucket to use
      Key: s3Key,                     // Where to store the file
      ContentType: fileType           // What type of file it is
    });
    
    // ⏰ Generate the pre-signed URL
    // This URL will work for 5 minutes (300 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300 // URL expires in 5 minutes
    });
    
    console.log('✅ Pre-signed URL generated:', {
      fileName,
      s3Key,
      bucketName: AWS_CONFIG.bucketName,
      region: AWS_CONFIG.region,
      expiresIn: '5 minutes'
    });
    
    return {
      uploadUrl,  // The temporary upload link
      key: s3Key  // Where the file will be stored
    };
    
  } catch (error) {
    console.error('❌ Error generating pre-signed URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

/**
 * 🗑️ Delete File from S3
 * Removes a file from S3 storage
 * (We'll use this later when users want to delete their uploads)
 * 
 * @param {string} fileKey - The S3 key (path) of the file to delete
 */
export async function deleteS3Object(fileKey) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_CONFIG.bucketName,
      Key: fileKey
    });
    
    await s3Client.send(command);
    console.log('✅ File deleted from S3:', fileKey);
    
  } catch (error) {
    console.error('❌ Error deleting from S3:', error);
    throw new Error('Failed to delete file');
  }
}

// Don't forget to import this at the top!
import { DeleteObjectCommand } from '@aws-sdk/client-s3';