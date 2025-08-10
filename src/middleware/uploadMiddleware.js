const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadTo = (folderName) => {
  const uploadPath = path.join(__dirname, `../../uploads/${folderName}`);

  // Pastikan folder ada
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .png, and .pdf files are allowed'));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // Max 10MB
    }
  });
};

module.exports = uploadTo;
