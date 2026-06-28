// routes/student.js
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');
const bcrypt = require('bcrypt');

const view = file => path.join(__dirname, '../views', file);

// Secure Authorization Lock
const checkStudent = (req, res, next) => {
    if (!req.session.studentId) {
        return res.redirect('/');
    }
    next();
};

/* Student Authentication Views */
router.get('/', (req, res) => {
    res.sendFile(view('login.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(view('register.html'));
});

/* Authentication Engine Actions */
// Upgraded Route in routes/student.js
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // 1. Structural Sanity Validations
        if (!name || !email || !password) {
            return res.status(400).send('All input parameters are required.');
        }

        if (name.trim().length < 2) {
            return res.status(400).send('Name must be at least 2 characters long.');
        }

        // 2. Email Pattern Verification (Regex Guard)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send('Please enter a valid structural email address.');
        }

        // 3. Password Complexity Enforcement
        if (password.length < 6) {
            return res.status(400).send('Password must be a minimum of 6 characters.');
        }

        // Clean values before writing to the database
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        
        const hash = await bcrypt.hash(password, 10);
        
        await db.query(
            'INSERT INTO students(name, email, password) VALUES($1, $2, $3)',
            [cleanName, cleanEmail, hash]
        );
        res.sendFile(view('registration-success.html'));
    } catch (err) {
        console.error("Registration Failure:", err);
        if (err.code === '23505') { // Unique constraint violation code for PostgreSQL
            return res.status(400).send('An account with this email address already exists.');
        }
        res.status(500).send('Registration Failed due to an internal server error.');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM students WHERE email=$1', [email]);

        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        const student = result.rows[0];
        const match = await bcrypt.compare(password, student.password);

        if (!match) {
            return res.status(401).send('Invalid Password');
        }

        req.session.studentId = student.student_id;
        res.redirect('/dashboard');
    } catch (err) {
        console.error("Login Failure:", err);
        res.status(500).send('Database Error');
    }
});

router.get('/dashboard', checkStudent, (req, res) => {
    res.sendFile(view('dashboard.html'));
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Export both the router and the tracking block
module.exports = { router, checkStudent };