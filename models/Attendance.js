const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  status: { type: String, enum: ["present","absent"], required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
