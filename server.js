const express = require("express");
const czu = require("czu-lib");
const acceptLanguage = require('accept-language-parser');
const ics = require("./src/makeics");
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
      if (cookies.includes('UISAuth=')) {
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

app.post("/fetchSchedule", async (req, res) => {
  let { start, end, language, numberof, reminderUnit, includeDeadlines, cookies, username } = req.body;

  if (!start || !end || !language) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ error: "Invalid date format." });
  }

  if (startDate > endDate) {
    return res.status(400).json({ error: "'From' date cannot be later than 'To' date." });
  }

  const formattedStartDate = `${new Date(start).getDate().toString().padStart(2, '0')}.${(new Date(start).getMonth() + 1).toString().padStart(2, '0')}.${new Date(start).getFullYear()}`;
  const formattedEndDate = `${new Date(end).getDate().toString().padStart(2, '0')}.${(new Date(start).getMonth() + 1).toString().padStart(2, '0')}.${new Date(start).getFullYear()}`;

  if (language !== 'en' && language !== 'cz') {
    return res.status(400).json({ error: "Invalid language selection." });
  }

  if (!username || !cookies || !cookies.includes('UISAuth=')) {
    req.session.data = { error: 'Invalid credentials' };
    res.redirect('/');
  }

  const schedule = await czu.fetchSchedule(
    cookies,
    formattedStartDate,
    formattedEndDate,
    language,
  );

  const validReminderUnits = ["M", "D", "H", "S"];
  if (!validReminderUnits.includes(reminderUnit)) {
    return res.status(400).json({ error: "Invalid reminder unit selection." });
  }

  includeDeadlines = includeDeadlines === "on";

  const finalTextICS = await ics(schedule, numberof, reminderUnit);

  req.session.data = { finalTextICS, username };
  return res.redirect('/download');
});

app.get("/download", async (req, res) => {
  const { finalTextICS, username } = req.session.data || {};
  if (!finalTextICS || !username) {
    return res.redirect('/');
  }
  res.render('download', { language: req.language, finalTextICS, username });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
