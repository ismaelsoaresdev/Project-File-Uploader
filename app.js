// app.js
const express = require('express');
const session = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const passport = require('./config/passport');
const prisma = require('./db/prisma');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/authRouter');
const folderRouter = require('./routes/folderRouter');

const app = express();

app.set('view engine', 'ejs');

// 1. Parse incoming request bodies (form data and JSON) FIRST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));

// 2. Express-session configuration with PostgreSQL Session store via Prisma
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    },
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000, // Clean up expired sessions every 2 minutes
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
  })
);

// 3. Initialize Passport and session management
app.use(passport.initialize());
app.use(passport.session());

// 4. Global middleware to make currentUser available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// 5. MOUNT ROUTES AT THE VERY END (After sessions and passport are ready)
app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', folderRouter);


app.listen(3000, () => console.log('Server running on port 3000!'));