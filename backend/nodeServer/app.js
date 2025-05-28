/* ------------------------------------------------------------------
   Express server that hands out pre-signed S3 URLs.
   ------------------------------------------------------------------ */

import express from "express";
import dotenv   from "dotenv";
import { S3Client, PutObjectCommand }        from "@aws-sdk/client-s3";
import { getSignedUrl }                      from "@aws-sdk/s3-request-presigner";

/* 🟢 1. Load environment variables (LOCAL only) */
dotenv.config();         // looks for backend/nodeServer/.env

/* 🟢 2. Configuration */
const PORT      = process.env.PORT || 4000;
const REGION    = process.env.AWS_REGION;
const BUCKET    = process.env.S3_BUCKET;

/* 🟢 3. Create one S3 client that we reuse */
const s3 = new S3Client({ region: REGION });

/* 🟢 4. Spin up Express */
const app = express();

/* 🟢 5. Single route --------------- */
app.get("/generate-presigned-url", async (req, res) => {
  try {
    const { fileName, fileType, userId } = req.query;

    if (!fileName || !fileType || !userId) {
      return res.status(400).json({ message: "fileName, fileType, userId required" });
    }

    /* Key pattern: userId/uploads/fileName  */
    const key = `${userId}/uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    });

    /* URL works for 60 s */
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    return res.json({
      url,
      method: "PUT",
      headers: { "Content-Type": fileType }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* 🟢 6. Start server */
app.listen(PORT, () => {
  console.log(`🚀  Presign server ready  →  http://localhost:${PORT}`);
});
