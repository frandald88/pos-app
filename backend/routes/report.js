// routes/report.js
const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const { verifyToken } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// GET /api/report/ventas
router.get("/ventas", verifyToken, async (req, res) => {
  try {
    const { tipoVenta, inicio, fin } = req.query;

    const match = {};

    if (inicio && fin) {
      match.date = {
        $gte: new Date(inicio),
        $lte: new Date(fin),
      };
    }

    if (tipoVenta === "mixta") {
      match.method = { $in: ["efectivo", "transferencia", "tarjeta"] };
      match.$expr = {
        $gt: [
          {
            $size: {
              $setIntersection: [
                ["efectivo", "tarjeta", "transferencia"],
                "$method",
              ],
            },
          },
          1,
        ],
      };
    } else if (tipoVenta && tipoVenta !== "todos") {
      match.method = tipoVenta;
    }

    const ventas = await Sale.find(match)
      .populate("user", "username")
      .sort({ date: -1 });

    res.json(ventas);
  } catch (error) {
    console.error("Error al generar reporte de ventas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
