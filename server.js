const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = require("./src/database");

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

app.get("/", (req, res) => {
  res.render('index', { title: 'Home Page', user: 'John Doe' });
});

app.get("/fetchSchedule", (req, res) => {
  
});

app.get("/", (req, res) => {
  
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
