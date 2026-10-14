// routes/index.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const upload = require('../config/multer');
const prisma = require('../db/prisma');

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// GET home page (dashboard with folders and root files)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch files in the root folder (no folder associated)
    const userFiles = await prisma.file.findMany({
      where: { userId: req.user.id, folderId: null }
    });

    // Fetch user folders
    const userFolders = await prisma.folder.findMany({
      where: { userId: req.user.id }
    });

    // Render the index.ejs view, passing the user data, folders, and files
    res.render('index', {
      user: req.user,
      userFolders,
      userFiles
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading home page.');
  }
});

// POST route to handle file upload with validation and folder support
router.post('/upload', ensureAuthenticated, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('File is too large! The maximum limit is 5 MB.');
      }
      return res.status(400).send(`Upload error: ${err.message}`);
    } else if (err) {
      return res.status(400).send(err.message);
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    try {
      const { folderId } = req.body;

      await prisma.file.create({
        data: {
          name: req.file.originalname,
          size: req.file.size,
          url: req.file.path,
          userId: req.user.id,
          folderId: folderId ? parseInt(folderId) : null
        }
      });

      console.log('File uploaded and saved to database successfully!');

      if (folderId) {
        res.redirect(`/folders/${folderId}`);
      } else {
        res.redirect('/');
      }
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).send('Server error during file upload.');
    }
  });
});

// GET file details (renders EJS view)
router.get('/files/:id', ensureAuthenticated, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: req.user.id }
    });

    if (!file) return res.status(404).send('File not found.');

    const backLink = file.folderId ? `/folders/${file.folderId}` : '/';

    res.render('fileDetails', { file, backLink });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading file details.');
  }
});

// GET download file route
router.get('/files/:id/download', ensureAuthenticated, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: req.user.id }
    });

    if (!file) return res.status(404).send('File not found.');

    res.download(file.url, file.name);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error downloading file.');
  }
});

// POST route to delete a file
router.post('/files/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: req.user.id }
    });

    if (!file) return res.status(404).send('File not found.');

    if (fs.existsSync(file.url)) {
      fs.unlinkSync(file.url);
    }

    await prisma.file.delete({
      where: { id: fileId }
    });

    console.log('File deleted successfully!');

    if (file.folderId) {
      res.redirect(`/folders/${file.folderId}`);
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting file.');
  }
});

module.exports = router;