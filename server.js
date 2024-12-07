const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const czu = require("czu-lib");
const path = require("path");
const acceptLanguage = require('accept-language-parser');
const db = require("./src/database");
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  const acceptedLanguages = req.headers['accept-language'];
  const supportedLanguages = ['en', 'cs'];
  const defaultLanguage = 'en';

  if (acceptedLanguages) {
    const userLanguage = acceptLanguage.pick(supportedLanguages, acceptedLanguages) || defaultLanguage;
    req.language = userLanguage;
  } else {
    req.language = defaultLanguage;
  }

  next();
});

app.use(session({
  secret: '444g41frg89r418r4gr8tg4rt88g4r8tr4rgr854g1', //Change
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

app.get("/", (req, res) => {
  let error = null;
  if (req.session.data) {
    error = req.session.data.error;
  }
  res.render('index', { 
    language: req.language,
    error
  });
});

app.post("/auth", async (req, res) => {
  const { username, password } = req.body;

  try {
    if ( !username || !password) {
      req.session.data = { error: 'Missing username or password' };
      return res.redirect('/');
    } else {
      const cookies = await czu.login(username, password);
      const cookieString = cookies.cookies.map(cookie => `${cookie.key}=${cookie.value}`).join('; ');
      if (cookieString.includes('UISAuth=')) {
        req.session.data = { cookies: cookies, username: username };
        return res.redirect('/options');
      } else {
        req.session.data = { error: 'Invalid credentials' };
        res.redirect('/');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error. If it persists, please report it: 2-0-0-4@seznam.cz' });
  }
});

app.get("/options", async (req, res) => {
  const { cookies, username } = req.session.data || {};
  if (!cookies || !username) return res.redirect('/');
  res.render('options', { language: req.language, cookies, username });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
