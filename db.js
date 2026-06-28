// db.js
require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

db.connect()
    .then(() => console.log("Database Connected Successfully"))
    .catch(err => console.error("Database Connection Error:", err));

module.exports = db;