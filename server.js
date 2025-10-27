import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 🔌 Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) console.error("❌ Error de conexión MySQL:", err);
  else console.log("✅ Conectado a MySQL");
});

// ===========================
// 🔹 LOGIN
// ===========================
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Faltan datos" });

  const query = `
    SELECT * FROM Administradores
    WHERE Correo_Administrador = ? AND Contraseña_Administrador = ?
  `;

  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });

    const admin = results[0];
    res.json({
      message: "Login exitoso",
      admin: {
        id: admin.idAdministrador,
        nombre: admin.Nombre_Administrador,
        correo: admin.Correo_Administrador,
        telefono: admin.Telefono_Administrador
      }
    });
  });
});

// ===========================
// 🔹 CRUD de USUARIOS
// ===========================

// ✅ OBTENER USUARIOS
app.get("/api/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) {
      console.error("Error al obtener usuarios:", err);
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
    res.json(results);
  });
});

// ✅ CREAR NUEVO USUARIO
app.post("/api/usuarios", (req, res) => {
  const {
    nombre_usuario,
    apellido_usuario,
    correo_usuario,
    cargo_usuario,
    nivel_acceso,
    targeta_usuario,
    telefono_usuario
  } = req.body;

  if (!nombre_usuario || !apellido_usuario || !correo_usuario || !cargo_usuario || !nivel_acceso) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO usuarios 
    (nombre_usuario, apellido_usuario, correo_usuario, cargo_usuario, nivel_acceso, targeta_usuario, telefono_usuario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nombre_usuario, apellido_usuario, correo_usuario, cargo_usuario, nivel_acceso, targeta_usuario || null, telefono_usuario || null],
    (err, result) => {
      if (err) {
        console.error("❌ Error MySQL:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }
      res.json({ id: result.insertId, message: "✅ Usuario creado con éxito" });
    }
  );
});

// ✅ ACTUALIZAR USUARIO
app.put("/api/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const {
    nombre_usuario,
    apellido_usuario,
    correo_usuario,
    cargo_usuario,
    nivel_acceso,
    targeta_usuario,
    telefono_usuario
  } = req.body;

  const sql = `
    UPDATE usuarios SET
      nombre_usuario = ?,
      apellido_usuario = ?,
      correo_usuario = ?,
      cargo_usuario = ?,
      nivel_acceso = ?,
      targeta_usuario = ?,
      telefono_usuario = ?
    WHERE idUsuarios = ?
  `;

  db.query(
    sql,
    [nombre_usuario, apellido_usuario, correo_usuario, cargo_usuario, nivel_acceso, targeta_usuario || null, telefono_usuario || null, id],
    (err, result) => {
      if (err) {
        console.error("❌ Error MySQL:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });
      res.json({ message: "Usuario actualizado con éxito" });
    }
  );
});

// ✅ ELIMINAR USUARIO
app.delete("/api/usuarios/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM usuarios WHERE idUsuarios = ?", [id], (err, result) => {
    if (err) {
      console.error("❌ Error MySQL:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado con éxito" });
  });
});

// ===========================
// 🔹 CRUD de ZONAS
// ===========================

// ✅ OBTENER TODAS LAS ZONAS
app.get("/api/zonas", (req, res) => {
  db.query("SELECT * FROM zonas", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener zonas:", err);
      return res.status(500).json({ error: "Error al obtener zonas" });
    }
    res.json(results);
  });
});

// ✅ CREAR NUEVA ZONA
app.post("/api/zonas", (req, res) => {
  const {
    nombre_zona,
    descripcion_zona,
    nivel_seguridad_zona,
    capacidad_maxima_zona,
    horario_inicio_zona,
    horario_fin_zona,
    requiresEscort,
    estado_zona
  } = req.body;

  if (!nombre_zona || !nivel_seguridad_zona) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO zonas (
      nombre_zona,
      descripcion_zona,
      nivel_seguridad_zona,
      capacidad_maxima_zona,
      horario_inicio_zona,
      horario_fin_zona,
      requiresEscort,
      estado_zona
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    nombre_zona,
    descripcion_zona || null,
    nivel_seguridad_zona,
    capacidad_maxima_zona || null,
    horario_inicio_zona || null,
    horario_fin_zona || null,
    requiresEscort ? 1 : 0,
    estado_zona || "Activa"
  ], (err, result) => {
    if (err) {
      console.error("❌ Error MySQL:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json({ idzonas: result.insertId, message: "✅ Zona creada con éxito" });
  });
});

// ✅ ACTUALIZAR ZONA
app.put("/api/zonas/:id", (req, res) => {
  const { id } = req.params;
  const {
    nombre_zona,
    descripcion_zona,
    nivel_seguridad_zona,
    capacidad_maxima_zona,
    horario_inicio_zona,
    horario_fin_zona,
    requiresEscort,
    estado_zona
  } = req.body;

  const sql = `
    UPDATE zonas SET
      nombre_zona = ?,
      descripcion_zona = ?,
      nivel_seguridad_zona = ?,
      capacidad_maxima_zona = ?,
      horario_inicio_zona = ?,
      horario_fin_zona = ?,
      requiresEscort = ?,
      estado_zona = ?
    WHERE idzonas = ?
  `;

  db.query(sql, [
    nombre_zona,
    descripcion_zona,
    nivel_seguridad_zona,
    capacidad_maxima_zona,
    horario_inicio_zona,
    horario_fin_zona,
    requiresEscort ? 1 : 0,
    estado_zona,
    id
  ], (err) => {
    if (err) {
      console.error("❌ Error al actualizar zona:", err);
      return res.status(500).json({ error: "Error al actualizar zona" });
    }
    res.json({ message: "✅ Zona actualizada correctamente" });
  });
});

// ✅ ELIMINAR ZONA
app.delete("/api/zonas/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM zonas WHERE idzonas = ?", [id], (err) => {
    if (err) {
      console.error("❌ Error al eliminar zona:", err);
      return res.status(500).json({ error: "Error al eliminar zona" });
    }
    res.json({ message: "🗑️ Zona eliminada correctamente" });
  });
});

// 🚀 Iniciar servidor
app.listen(process.env.PORT || 5001, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 5001}`);
});
