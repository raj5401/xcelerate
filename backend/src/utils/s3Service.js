const AWS = require('aws-sdk')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const uploadToS3 = async (file, folderPath) => {
  const fileKey = `${folderPath}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${file.originalname}`
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }

  try {
    const result = await s3.upload(params).promise()
    return result.Location
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`)
  }
}

const deleteFromS3 = async (fileKey) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
  }

  try {
    await s3.deleteObject(params).promise()
    return true
  } catch (error) {
    throw new Error(`S3 deletion failed: ${error.message}`)
  }
}

const getSignedUrl = async (fileKey, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Expires: expiresIn,
  }

  try {
    const url = await s3.getSignedUrlPromise('getObject', params)
    return url
  } catch (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
}
