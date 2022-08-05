require('dotenv').config()
const Pool = require("pg").Pool;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: process.env.DATABASE_NAME,
  user: "postgres",
  password: process.env.DATABASE_PASSWORD,
});

module.exports = pool;
