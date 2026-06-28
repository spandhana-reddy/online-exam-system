// routes/result.js
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');
const { checkStudent } = require('./student');

const view = file => path.join(__dirname, '../views', file);

router.get('/student/results', checkStudent, (req, res) => {
    res.sendFile(view('results.html'));
});

router.get('/student/results/data', checkStudent, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT exam_id, score, submitted_at FROM results WHERE student_id=$1', 
            [req.session.studentId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

router.get('/student/study-plan', checkStudent, (req, res) => {
    res.sendFile(view('study-plan.html'));
});

router.get('/student/study-plan/data', checkStudent, async (req, res) => {
    try {
        const result = await db.query('SELECT AVG(score) AS average FROM results WHERE student_id=$1', [req.session.studentId]);
        const avg = Math.round(result.rows[0].average || 0);
        let message = '';

        if (avg >= 80) {
            message = 'Excellent performance! Continue practicing regularly.';
        } else if (avg >= 50) {
            message = 'Good performance. Revise difficult topics and solve more MCQs.';
        } else {
            message = 'Needs Improvement. Study for at least 2 hours daily and focus on weak subjects.';
        }

        res.json({ average: avg, message });
    } catch (err) {
        res.status(500).json({ average: 0, message: 'Unable to generate study plan' });
    }
});

module.exports = router;