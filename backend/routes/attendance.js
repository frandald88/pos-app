const express = require("express");
const Attendance = require("../models/Attendance");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

// Check-in
router.post("/checkin", async (req, res) => {
  const { userId } = req.body;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  try {
    const existing = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    });

    if (existing && existing.checkInTime) {
      return res.status(400).json({ msg: "Ya hizo check-in hoy" });
    }

    const attendance = existing || new Attendance({ userId, date: new Date() });
    attendance.checkInTime = new Date();
    attendance.status = "Present";
    await attendance.save();
    res.json({ msg: "Check-in registrado" });
  } catch (err) {
    res.status(500).json({ error: "Error en check-in" });
  }
});

// Check-out
router.post("/checkout", async (req, res) => {
  const { userId } = req.body;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  try {
    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ msg: "No hizo check-in hoy" });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();
    res.json({ msg: "Check-out registrado" });
  } catch (err) {
    res.status(500).json({ error: "Error en check-out" });
  }
});

// Registrar falta
router.post("/absence", async (req, res) => {
  const { userId, reason } = req.body;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  try {
    const existing = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    });

    if (existing) {
      return res.status(400).json({ msg: "Ya hay registro de hoy" });
    }

    const absence = new Attendance({
      userId,
      date: new Date(),
      status: "Absent",
      absenceReason: reason,
    });

    await absence.save();
    res.json({ msg: "Falta registrada" });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar falta" });
  }
});

// Reporte de asistencia por usuario y rango de fechas (Solo admin)
router.get("/report", verifyToken, requireAdmin, async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  const filter = {};

  if (userId) filter.userId = userId;

  if (startDate && endDate) {
    // Ajuste rápido: Tomar inicio del día y fin del día como hora local
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);
    filter.date = { $gte: start, $lte: end };
  }

  try {
    const records = await Attendance.find(filter)
      .populate("userId", "username role")
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el reporte" });
  }
});

module.exports = router;
