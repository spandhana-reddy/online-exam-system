// routes/exam.js
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');
const { checkStudent } = require('./student');

const view = file => path.join(__dirname, '../views', file);

router.get('/student/exams', checkStudent, (req, res) => {
    res.sendFile(view('student-exams.html'));
});

router.get('/student/exams/data', checkStudent, async (req, res) => {
    try {
        const result = await db.query('SELECT exam_id, exam_name, subject, duration, total_marks FROM exams');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

router.get('/exam/:examId', checkStudent, (req, res) => {
    res.sendFile(view('exam.html'));
});

router.get('/exam/:examId/questions', checkStudent, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM questions WHERE exam_id=$1', [req.params.examId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

router.post('/exam/:examId/submit', checkStudent, async (req, res) => {
    const examId = req.params.examId;
    const studentId = req.session.studentId;
    const answers = req.body.answers || {};

    try {
        const questionData = await db.query('SELECT * FROM questions WHERE exam_id=$1', [examId]);
        const questions = questionData.rows;
        let score = 0;

        questions.forEach(question => {
            const studentAnswer = answers[question.question_id];
            if (studentAnswer && studentAnswer.trim() === question.correct_answer.trim()) {
                score += (question.question_type === "MCQ") ? 2 : 5;
            }
        });

        await db.query(
            'INSERT INTO results(student_id, exam_id, score) VALUES($1, $2, $3)',
            [studentId, examId, score]
        );

        res.json({ score });
    } catch (err) {
        console.error("Evaluation and scoring failed:", err);
        res.status(500).json({ score: 0, error: 'Failed to process evaluation score' });
    }
});

router.get('/exam/:examId/duration', checkStudent, async (req, res) => {
    try {
        const result = await db.query('SELECT duration FROM exams WHERE exam_id=$1', [req.params.examId]);
        if (result.rows.length === 0) {
            return res.json({ duration: 10 });
        }
        res.json({ duration: result.rows[0].duration });
    } catch (err) {
        res.json({ duration: 10 });
    }
});

module.exports = router;