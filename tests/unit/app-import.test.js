const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("importar app no crea la base de datos", (t) => {
  const directory = fs.mkdtempSync(path.join(__dirname, "../../work/nova-app-import-"));
  const databasePath = path.join(directory, "should-not-exist.db");
  const previousPath = process.env.DB_PATH;
  process.env.DB_PATH = databasePath;

  t.after(() => {
    if (previousPath === undefined) delete process.env.DB_PATH;
    else process.env.DB_PATH = previousPath;
    fs.rmSync(directory, { recursive: true, force: true });
  });

  require("../../src/app");
  assert.equal(fs.existsSync(databasePath), false);
});
