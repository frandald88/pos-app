const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: { type: String, enum: ["Present", "Absent"], default: "Present" },
  absenceReason: { type: String, default: "" },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
    