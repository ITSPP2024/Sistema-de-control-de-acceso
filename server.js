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

// 🔹 Endpoint de login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const query = `
    SELECT * FROM Administradores
    WHERE Correo_Administrador = ? AND Contraseña_Administrador = ?
  `;

  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

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
// ✅ OBTENER USUARIOS
app.get("/api/usuarios", (req, res) => {
  const sql = "SELECT * FROM usuarios";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener usuarios:", err);
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
    res.json(results);
  });
});

// ✅ CREAR NUEVO USUARIO (actualizado con nivel_acceso y sin zona)
app.post("/api/usuarios", (req, res) => {
    console.log("📩 Datos recibidos en /api/usuarios:", req.body);

  const {
    nombre_usuario,
    apellido_usuario,
    correo_usuario,
    cargo_usuario,
    nivel_acceso,   // 👈 nuevo campo
    targeta_usuario,
    telefono_usuario,
  } = req.body;

  if (
    !nombre_usuario ||
    !apellido_usuario ||
    !correo_usuario ||
    !cargo_usuario ||
    !nivel_acceso
  ) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO usuarios 
    (nombre_usuario, apellido_usuario, correo_usuario, cargo_usuario, nivel_acceso, targeta_usuario, telefono_usuario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    db.query(
    sql,
    [
      nombre_usuario,
      apellido_usuario,
      correo_usuario,
      cargo_usuario,
      nivel_acceso,
      targeta_usuario || null,
      telefono_usuario || null,
    ],
    (err, result) => {
      console.log("🧾 SQL ejecutado:", sql);
      console.log("📦 Datos enviados:", [
        nombre_usuario,
        apellido_usuario,
        correo_usuario,
        cargo_usuario,
        nivel_acceso,
        targeta_usuario,
        telefono_usuario,
      ]);

      if (err) {
        console.error("❌ Error MySQL:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }

      console.log("✅ Usuario insertado con ID:", result.insertId);
      res.json({ id: result.insertId, message: "✅ Usuario creado con éxito" });
    }
  );
});



// 🚀 Iniciar servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
