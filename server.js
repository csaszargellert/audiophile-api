const mongoose = require("mongoose");

require("dotenv").config({ path: "config.env" });
const app = require("./app");

const dbConnection = process.env.DB_CONNECTION;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const port = process.env.PORT || 3000;

const DB = dbConnection
  .replace("<username>", dbUsername)
  .replace("<password>", dbPassword);

let server;
mongoose
  .connect(DB)
  .then(() => {
    server = app.listen(port, () => {
      console.log(`App is listening on: http://127.0.0.1:${port}`);
    });
  })
  // Error on initial connection
  .catch((error) => {
    console.error(`Error connecting to DB: ${error}`);
  });

// Connection to DB was successful
mongoose.connection.on("connected", function () {
  console.log("Mongoose has connected to DB successfully");
});

// Error after initial connection was established
mongoose.connection.on("error", function (error) {
  console.error(`Some error happened after initial connection: ${error}`);
});

// Mongoose disconnected
mongoose.connection.on("disconnected", function (error) {
  console.error(`Mongoose has disconnected: ${error}`);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("App has been closed gracefully.");
    mongoose.connection.close(() => {
      console.log("Mongoose connection closed due to app termination");
    });
  });
});
