const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, // ✅ Hacemos la fecha requerida (mejor control de faltas)
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: { type: String, enum: ["Present", "Absent"], default: "Present" }, // ✅ Puede ser Present o Absent
  absenceReason: { type: String, default: "" },
  tienda: { type: mongoose.Schema.Types.ObjectId, ref: "Tienda", required: true }
});

// ✅ Index para evitar registros duplicados por usuario + día
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
