const { Pool } = require('pg');
/*
const pool = new Pool(
{
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  // port: 3211,
	port: process.env.PGPORT
});
*/
const pool = new Pool();

module.exports =
{
  query: (text, params) => pool.query(text, params)
};