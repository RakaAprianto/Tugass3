const express = require('express');
const multer = require('multer');
const { uploadFile, listFiles, deleteFile } = require('../services/s3Service');
const { s3Client, bucketName } = require('../config/s3');
const { GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // limit 100MB
  }
});

// Route untuk upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }

    const file = req.file;
    const fileName = Date.now() + '-' + file.originalname;

    await uploadFile(file.buffer, fileName, file.mimetype);

    res.status(200).json({ 
      message: 'File berhasil diunggah',
      fileName: fileName
    });
  } catch (error) {
    console.error('Error saat mengunggah file:', error);
    res.status(500).json({ error: 'Gagal mengunggah file' });
  }
});

// Route untuk daftar file
router.get('/files', async (req, res) => {
  try {
    const files = await listFiles();
    res.status(200).json(files);
  } catch (error) {
    console.error('Error saat mengambil daftar file:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar file' });
  }
});

// Route untuk download file - PERBAIKAN
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filename
    });

    const response = await s3Client.send(command);

    // Set header agar browser bisa download file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');

    // jika terjadi error
    response.Body.pipe(res);
  } catch (error) {
    console.error('Error saat mengunduh file:', error);
    return res.status(500).json({ error: 'Gagal mengunduh file atau file tidak ditemukan' });
  }
});

// Route untuk menghapus file 
router.delete('/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Periksa apakah file ada di S3 sebelum menghapusnya
    const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
    const data = await s3Client.send(listCommand);
    const fileExists = data.Contents?.some(item => item.Key === filename);

    if (!fileExists) {
      return res.status(404).json({ error: `File ${filename} tidak ditemukan di S3` });
    }

    // Hapus file dari S3 jika ditemukan
    await deleteFile(filename);
    return res.status(200).json({ message: `File ${filename} berhasil dihapus` });
  } catch (error) {
    console.error('Error saat menghapus file:', error);
    return res.status(500).json({ error: 'Gagal menghapus file' });
  }
});

module.exports = router;
