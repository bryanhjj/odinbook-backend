const mongoose = require("mongoose");

const mongoDb = process.env.DB_URL;

mongoose.connect(mongoDb, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));
db.once("open", function () {
  ("Connected to MongoDB!");
});