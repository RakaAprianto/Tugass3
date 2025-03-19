const { PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucketName } = require('../config/s3');

// Upload file ke S3
async function uploadFile(fileBuffer, fileName, mimeType) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return fileName;
}

// Daftar file dari S3
async function listFiles() {
  const command = new ListObjectsV2Command({
    Bucket: bucketName
  });

  const data = await s3Client.send(command);
  console.log("Data dari S3:", data); 
  const files = [];

  if (data.Contents) {
    for (const item of data.Contents) {
      try {
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: item.Key
        });
        const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        
        files.push({
          name: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          url: url
        });
      } catch (error) {
        console.error(`Error processing file ${item.Key}:`, error);
      }
    }
  }
  console.log("Files yang dikirim ke frontend:", files);
  return files;
}

// Menghapus file dari S3
async function deleteFile(fileName) {
    // Cek apakah file ada di bucket sebelum menghapusnya
    const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
    const data = await s3Client.send(listCommand);
    const fileExists = data.Contents?.some(item => item.Key === fileName);
  
    if (!fileExists) {
      throw new Error(`File ${fileName} tidak ditemukan di S3`);
    }
  
    // Hapus file jika ditemukan
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName
    });
  
    await s3Client.send(command);
    return { message: `File ${fileName} berhasil dihapus` };
  }

// Download file dari s3
async function getFileStream(fileName) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName
  });
  
  const response = await s3Client.send(command);
  return response;
}

module.exports = {
  uploadFile,
  listFiles,
  deleteFile,
  getFileStream
};