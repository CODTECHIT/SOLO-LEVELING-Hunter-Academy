const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable' });

pool.query('SELECT title, "videoUrl" FROM "Lesson"')
  .then(res => {
    console.log(res.rows);
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
