// routes/authRouter.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const passport = require('passport');

// GET sign-up form view
router.get('/signup', (req, res) => {
  res.render('signup');
});

// POST sign-up logic
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Hash the password using bcryptjs (10 rounds of salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Create user in PostgreSQL via Prisma
    await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword
      }
    });

    // 3. Redirect to login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user. Email might already be taken.');
  }
});

// GET login form view
router.get('/login', (req, res) => {
  res.render('login');
});

// POST login logic using Passport local strategy
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

// GET logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

module.exports = router;