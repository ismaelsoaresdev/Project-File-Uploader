// config/passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');

passport.use(
  new LocalStrategy(
    { usernameField: 'email' }, // Use 'email' as the login field
    async (email, password, done) => {
      try {
        // 1. Find the user by email
        const user = await prisma.user.findUnique({
          where: { email: email }
        });

        if (!user) {
          return done(null, false, { message: 'Email not registered.' });
        }

        // 2. Compare the provided password with the hashed password in PostgreSQL
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        // 3. Authentication successful
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Stores only the user ID in the Session table's 'data' column
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieves the full user object from PostgreSQL on every authenticated request
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;