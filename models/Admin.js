const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }, 
  role: { type: String, enum: ["superadmin", "moderator"], default: "moderator" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Admin", adminSchema);
