require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("node:path");
const routes = require("./routes");

function createApp({ db } = {}) {
  const app = express();

  app.locals.db = db;
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.set("layout", "layout");
  app.use(expressLayouts);
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, "public")));
  app.use(routes);

  app.use((req, res) => {
    res.status(404).render("error", {
      title: "Página no encontrada",
      message: "No encontramos la página que buscas.",
    });
  });

  app.use((error, req, res, _next) => {
    console.error(error);
    res.status(500).render("error", {
      title: "Error del servidor",
      message: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
    });
  });

  return app;
}

module.exports = { createApp };
