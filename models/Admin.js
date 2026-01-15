const db = require("../config/db");

const adminsCollection = db.collection("admins");

module.exports = adminsCollection;