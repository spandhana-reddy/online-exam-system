// server.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'onlineexamsecret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
const studentModule = require('./routes/student');
app.use(studentModule.router);
app.use(require('./routes/admin'));
app.use(require('./routes/exam'));
app.use(require('./routes/result'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running safely at http://localhost:${PORT}`);
});