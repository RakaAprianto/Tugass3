const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const fileRoutes = require('./routes/fileroutes.js');

// Memuat konfigurasi dari file .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api', fileRoutes);

// Routes utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware penanganan error global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

// Middleware untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ error: 'Route tidak ditemukan' });
});

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});