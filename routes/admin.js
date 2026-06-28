// routes/admin.js

const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../db');

const view = (file) => path.join(__dirname, '../views', file);

/* ==========================
   ADMIN SESSION GUARD
========================== */

const checkAdmin = (req, res, next) => {
    if (!req.session.adminId) {
        return res.redirect('/admin');
    }
    next();
};


/* ==========================
   ADMIN LOGIN PAGE
========================== */

router.get('/admin', (req, res) => {

    if (req.session.adminId) {
        return res.redirect('/admin/dashboard');
    }

    res.sendFile(view('admin-login.html'));

});


/* ==========================
   ADMIN LOGIN
========================== */

router.post('/admin/login', async (req, res) => {

    try {

        let { username, password } = req.body;

        // Empty validation
        if (!username || !password) {
            return res
                .status(400)
                .send('Username and password required');
        }

        username = username.trim().toLowerCase();

        console.log("Login username:", username);

        // Find admin
        const result = await db.query(
            `SELECT * FROM admin
             WHERE LOWER(username)=LOWER($1)`,
            [username]
        );

        // Username not found
        if (result.rows.length === 0) {

            console.log("Admin not found");

            return res
                .status(401)
                .send('Invalid username or password');
        }

        const admin = result.rows[0];

        console.log("Database user:", admin.username);

        // Compare password
        const match = await bcrypt.compare(
            password.trim(),
            admin.password
        );

        console.log("Password Match:", match);

        if (!match) {

            return res
                .status(401)
                .send('Invalid username or password');
        }

        // Save session
        req.session.adminId = admin.admin_id;
        req.session.adminUser = admin.username;

        console.log("Login successful");

        res.redirect('/admin/dashboard');

    }

    catch (err) {

        console.error(
            "Login error:",
            err
        );

        res
            .status(500)
            .send("Internal server error");
    }

});


/* ==========================
   ADMIN REGISTER PAGE
========================== */

router.get('/admin/register', (req, res) => {

    res.sendFile(
        view('admin-register.html')
    );

});


/* ==========================
   ADMIN REGISTER
========================== */

router.post('/admin/register', async (req, res) => {

    try {

        let { username, password } = req.body;

        if (!username || !password) {

            return res
                .status(400)
                .send('All fields required');
        }

        username = username.trim();

        // Check duplicate username

        const existing = await db.query(
            `SELECT * FROM admin
             WHERE LOWER(username)=LOWER($1)`,
            [username]
        );

        if (existing.rows.length > 0) {

            return res
                .status(400)
                .send('Username already exists');
        }

        // Hash password

        const hash = await bcrypt.hash(
            password,
            10
        );

        // Insert admin

        await db.query(
            `INSERT INTO admin
            (username,password)
            VALUES($1,$2)`,
            [username, hash]
        );

        console.log(
            "Admin registered"
        );

        res.redirect('/admin');

    }

    catch (err) {

        console.error(
            "Registration Error:",
            err
        );

        res
            .status(500)
            .send(
                "Registration failed"
            );
    }

});


/* ==========================
   DASHBOARD PAGES
========================== */

router.get(
    '/admin/dashboard',
    checkAdmin,
    (req,res)=>{
        res.sendFile(
            view(
                'admin-dashboard.html'
            )
        );
    }
);

router.get(
    '/admin/create-exam',
    checkAdmin,
    (req,res)=>{
        res.sendFile(
            view(
                'create-exam.html'
            )
        );
    }
);

router.get(
    '/admin/add-question',
    checkAdmin,
    (req,res)=>{
        res.sendFile(
            view(
                'add-question.html'
            )
        );
    }
);

router.get(
    '/admin/delete-exam',
    checkAdmin,
    (req,res)=>{
        res.sendFile(
            view(
                'delete-exam.html'
            )
        );
    }
);

router.get(
    '/admin/results',
    checkAdmin,
    (req,res)=>{
        res.sendFile(
            view(
                'admin-results.html'
            )
        );
    }
);


/* ==========================
   CREATE EXAM
========================== */

router.post(
'/admin/create-exam',
checkAdmin,
async(req,res)=>{

try{

const {
exam_name,
subject,
duration,
total_marks
}=req.body;

await db.query(
`INSERT INTO exams
(exam_name,subject,duration,total_marks)
VALUES($1,$2,$3,$4)`,

[
exam_name.trim(),
subject.trim(),
duration,
total_marks
]
);

res.redirect(
'/admin/add-question'
);

}
catch(err){

console.log(err);

res
.status(500)
.send(
'Error creating exam'
);

}

}
);


/* ==========================
   ADD QUESTION
========================== */

router.post(
'/admin/add-question',
checkAdmin,
async(req,res)=>{

try{

const {
exam_id,
question_text,
question_type,
option1,
option2,
option3,
option4,
correct_answer
}=req.body;

await db.query(

`INSERT INTO questions
(exam_id,
question_text,
question_type,
option1,
option2,
option3,
option4,
correct_answer)

VALUES
($1,$2,$3,$4,$5,$6,$7,$8)`,

[
exam_id,
question_text,
question_type,
option1,
option2,
option3,
option4,
correct_answer
]

);

res.redirect(
'/admin/dashboard'
);

}

catch(err){

console.log(err);

res
.status(500)
.send(
'Error adding question'
);

}

}
);


/* ==========================
   FETCH EXAMS
========================== */

router.get(
'/admin/delete-exam/data',
checkAdmin,
async(req,res)=>{

try{

const result=
await db.query(
'SELECT exam_id,exam_name FROM exams'
);

res.json(
result.rows
);

}
catch(err){

res.json([]);

}

}
);


/* ==========================
   DELETE EXAM
========================== */

router.post(
'/admin/delete-exam/:id',
checkAdmin,
async(req,res)=>{

try{

await db.query(
'DELETE FROM exams WHERE exam_id=$1',
[req.params.id]
);

res.json({
success:true
});

}
catch(err){

res.json({
success:false
});

}

}
);


/* ==========================
   RESULTS
========================== */

router.get(
'/admin/results/data',
checkAdmin,
async(req,res)=>{

try{

const result=
await db.query(

`SELECT
students.name,
exams.exam_name,
results.score,
results.submitted_at

FROM results

JOIN students
ON students.student_id=
results.student_id

JOIN exams
ON exams.exam_id=
results.exam_id`

);

res.json(
result.rows
);

}

catch(err){

res.json([]);

}

}
);


/* ==========================
   LOGOUT
========================== */

router.get(
'/admin/logout',
(req,res)=>{

req.session.destroy(
()=>{

res.redirect(
'/admin'
);

}
);

}
);


module.exports = router;