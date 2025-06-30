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

    // 🟢 Buscar la tienda del usuario
    const user = await require("../models/User").findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!user.tienda) {
      return res.status(400).json({ msg: "El empleado no tiene tienda asignada" });
    }

    const attendance = existing || new Attendance({
      userId,
      date: new Date(),
      tienda: user.tienda,  // ✅ Aquí asignas la tienda del usuario
    });

    attendance.checkInTime = new Date();
    attendance.status = "Present";
    await attendance.save();
    res.json({ msg: "Check-in registrado" });
  } catch (err) {
    console.error("Error en check-in:", err);
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

    if (attendance.checkOutTime) {
      return res.status(400).json({ msg: "Ya hizo check-out hoy" });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();
    res.json({ msg: "Check-out registrado" });
  } catch (err) {
    res.status(500).json({ error: "Error en check-out" });
  }
});

// Registrar falta
router.post("/absence", verifyToken, requireAdmin, async (req, res) => {
  const { userId, reason } = req.body;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  try {
    // Verificar si ya hay asistencia registrada hoy
    const existing = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay },
    });

    if (existing) {
      return res.status(400).json({ msg: "Ya hay registro de hoy" });
    }

    // Buscar el usuario para obtener su tienda
    const user = await require("../models/User").findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!user.tienda) {
      return res.status(400).json({ msg: "El empleado no tiene tienda asignada" });
    }

    const absence = new Attendance({
      userId,
      date: new Date(),
      status: "Absent",
      absenceReason: reason,
      tienda: user.tienda,  // ✅ Aquí guardas la tienda del usuario
    });

    await absence.save();

    res.json({ msg: "Falta registrada correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar falta:", err);
    res.status(500).json({ error: "Error al registrar falta" });
  }
});

// Reporte de asistencia por usuario y rango de fechas (Solo admin)
router.get("/report", verifyToken, requireAdmin, async (req, res) => {
  const { userId, startDate, endDate, tiendaId } = req.query;

  const filter = {};

    if (userId) filter.userId = userId;

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59.999`);
      filter.date = { $gte: start, $lte: end };
    }

    // ✅ Filtro por tienda del usuario
    if (tiendaId) {
      filter["userId.tienda"] = tiendaId;
    }

  try {
    const records = await Attendance.find(filter)
  .populate({
    path: "userId",
    select: "username role tienda",
    populate: {
      path: "tienda",
      select: "nombre",
    },
  })
  .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el reporte" });
  }
});

module.exports = router;
