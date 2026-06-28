// db.js
require('dotenv').config();
const { Pool } = require('pg');

let db;

// 1. Check if a unified connection string URI exists (for Production / Cloud Hosting)
if (process.env.DATABASE_URL) {
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Cloud providers like Neon/Supabase require SSL encrypted traffic over public connections
        ssl: { rejectUnauthorized: false }
    });
} else {
    // 2. Fall back to local separate environmental keys if running locally
    db = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
}

// Open and test the pool worker connections
db.connect()
    .then(() => console.log("Database Connected Successfully"))
    .catch(err => console.error("Database Connection Error:", err));

module.exports = db;