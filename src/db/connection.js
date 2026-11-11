const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const businessRules = require("../config/business-rules");
const schemaTemplate = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

const schema = schemaTemplate
  .replace("{{CREDITS_MIN}}", businessRules.course.creditsMin)
  .replace("{{CREDITS_MAX}}", businessRules.course.creditsMax)
  .replace("{{YEAR_MIN}}", businessRules.academicPeriod.yearMin)
  .replace("{{YEAR_MAX}}", businessRules.academicPeriod.yearMax)
  .replace("{{TERMS}}", businessRules.academicPeriod.terms.join(", "));

function createDatabase(dbPath = process.env.DB_PATH || "./data/nova-campus.db") {
  const resolvedPath = dbPath === ":memory:" ? dbPath : path.resolve(dbPath);

  if (resolvedPath !== ":memory:") {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma("foreign_keys = ON");
  db.exec(schema);
  return db;
}

module.exports = { createDatabase };
