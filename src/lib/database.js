// Connect to the database
// On save dev => Local database
require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
  connectionString: process.env.DB_URL_DEV || process.env.DB_URL,
});

module.exports = pool;