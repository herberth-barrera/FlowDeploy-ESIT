require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { createDatabase } = require("../src/db/connection");

const dbPath = process.env.DB_PATH || "./data/nova-campus.db";
const resolvedPath = path.resolve(dbPath);

if (dbPath !== ":memory:") {
  for (const suffix of ["", "-shm", "-wal"]) {
    fs.rmSync(`${resolvedPath}${suffix}`, { force: true });
  }
}

const db = createDatabase(dbPath);
db.close();
console.log("Base de datos recreada correctamente.");
