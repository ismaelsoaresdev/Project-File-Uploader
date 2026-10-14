// config/multer.js
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary using variables from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'file-uploader', // The folder name that will be created in your Cloudinary account
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'pdf'],
    resource_type: 'auto',
  },
});

// File filter for size and type validation
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedFileTypes.test(file.originalname.toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, GIF) and PDFs are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;