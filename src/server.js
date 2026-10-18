require("dotenv").config();

const { createApp } = require("./app");
const { createDatabase } = require("./db/connection");

const port = Number(process.env.PORT) || 3000;
const db = createDatabase();
const app = createApp({ db });

app.listen(port, "0.0.0.0", () => {
  console.log(`Nova Campus está disponible en el puerto ${port}`);
});
