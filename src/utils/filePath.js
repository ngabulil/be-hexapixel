const path = require('path');

// Fungsi untuk menghasilkan URL file yang di-upload
const generateFileUrl = (folder, filename, req) => {
    // Mendapatkan protokol dan host yang digunakan pada permintaan
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Membuat URL lengkap berdasarkan folder dan nama file
    const fileUrl = `${baseUrl}/uploads/${folder}/${filename}`;

    return fileUrl;
};

module.exports = {
    generateFileUrl
};
