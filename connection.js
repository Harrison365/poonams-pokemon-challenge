const { Pool } = require("pg");

if (!process.env.PGDATABASE) {
  throw new Error("No PGDATABASE configured");
}

const db = new Pool();

module.exports = db;
