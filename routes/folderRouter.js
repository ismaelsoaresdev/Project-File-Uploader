// routes/folderRouter.js
const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// 1. CREATE FOLDER (POST)
router.post('/folders/create', ensureAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send('Folder name is required.');

    await prisma.folder.create({
      data: {
        name,
        userId: req.user.id
      }
    });

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating folder.');
  }
});

// 2. VIEW FOLDER DETAILS (GET)
router.get('/folders/:id', ensureAuthenticated, async (req, res) => {
  try {
    const folderId = parseInt(req.params.id);

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId: req.user.id },
      include: { files: true }
    });

    if (!folder) return res.status(404).send('Folder not found.');

    // Render the folderDetails.ejs view and pass the folder object
    res.render('folderDetails', { folder });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error opening folder.');
  }
});

// 3. DELETE FOLDER (POST)
router.post('/folders/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    const folderId = parseInt(req.params.id);

    await prisma.folder.delete({
      where: { id: folderId, userId: req.user.id }
    });

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting folder.');
  }
});

module.exports = router;