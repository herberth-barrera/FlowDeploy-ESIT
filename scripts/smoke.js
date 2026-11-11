const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const directory = fs.mkdtempSync(path.join(__dirname, "../work/nova-campus-smoke-"));
  process.env.DB_PATH = path.join(directory, "smoke.db");

  let app;
  let db;
  let server;

  try {
    const { createApp } = require("../src/app");
    const { createDatabase } = require("../src/db/connection");
    db = createDatabase(process.env.DB_PATH);
    app = createApp({ db });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.status !== 200) {
      throw new Error(`/health respondió ${healthResponse.status}.`);
    }
    const health = await healthResponse.json();
    if (health.status !== "ok") {
      throw new Error("/health no devolvió el estado esperado.");
    }

    const homeResponse = await fetch(baseUrl);
    if (homeResponse.status !== 200) {
      throw new Error(`/ respondió ${homeResponse.status}.`);
    }
    const home = await homeResponse.text();
    if (!home.includes("Panel académico")) {
      throw new Error("La página de inicio no mostró el panel académico.");
    }

    console.log("Smoke test correcto: /health y / respondieron como se esperaba.");
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (db) db.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("Smoke test fallido:", error.message);
  process.exitCode = 1;
});
