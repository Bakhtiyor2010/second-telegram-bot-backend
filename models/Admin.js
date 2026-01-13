const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 3-parametrda collection nomi "datas"
module.exports = mongoose.model("Admin", adminSchema, "datas");
