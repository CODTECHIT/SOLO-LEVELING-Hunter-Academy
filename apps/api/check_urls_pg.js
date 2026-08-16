const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); // or just rely on process.env.DATABASE_URL

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lms' });

pool.query('SELECT title, "videoUrl" FROM "Lesson"')
  .then(res => {
    console.log(res.rows);
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
