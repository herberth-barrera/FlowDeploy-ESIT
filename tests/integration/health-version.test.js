const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../../src/app");
const { createDatabase } = require("../../src/db/connection");

let server;
let db;
let baseUrl;

before(async () => {
  db = createDatabase(":memory:");
  const app = createApp({ db });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve, reject) => {
  server.close((error) => {
    db.close();
    if (error) reject(error);
    else resolve();
  });
}));

test("GET /health responde 200 con estado ok", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("GET /version devuelve la versión configurada", async () => {
  const previousVersion = process.env.APP_VERSION;
  const previousSha = process.env.GIT_SHA;
  process.env.APP_VERSION = "1.2.3-test";
  process.env.GIT_SHA = "abc123";

  try {
    const response = await fetch(`${baseUrl}/version`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      version: "1.2.3-test",
      commit: "abc123",
    });
  } finally {
    if (previousVersion === undefined) delete process.env.APP_VERSION;
    else process.env.APP_VERSION = previousVersion;
    if (previousSha === undefined) delete process.env.GIT_SHA;
    else process.env.GIT_SHA = previousSha;
  }
});
