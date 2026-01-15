const db = require("../config/db");

const groupsCollection = db.collection("groups");

module.exports = groupsCollection;
