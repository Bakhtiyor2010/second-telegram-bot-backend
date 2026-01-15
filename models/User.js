const db = require("../config/db");

const usersCollection = db.collection("users");

module.exports = usersCollection;
