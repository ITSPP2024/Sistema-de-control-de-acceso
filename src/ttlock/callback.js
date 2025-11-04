// src/ttlock/callback.js
import express from "express";
const router = express.Router();

// TTLock enviará datos a este endpoint (por ejemplo, logs o desbloqueos)
router.post("/", (req, res) => {
  console.log("📬 Callback recibido de TTLock:");
  console.log(req.body);

  // Aquí luego guardarás los datos en BD si lo deseas
  res.status(200).send("OK");
});

export default router;
