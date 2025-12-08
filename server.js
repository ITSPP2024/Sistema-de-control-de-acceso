import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import ttlockCallbackRouter from "./src/ttlock/callback.js";
import { ttlockLogin, refreshTTLockToken } from "./src/ttlock/auth.js";
import { syncTTLockDevices } from "./src/ttlock/sync.js";
import axios from "axios";


dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true })); 
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/ttlock/callback", ttlockCallbackRouter);

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

  const query = `SELECT * FROM Administradores WHERE Correo_Administrador = ?`;
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error DB:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const admin = results[0];

    // Soportar ambos nombres de columna por si tienes ñ u otra variante
    const storedRaw = admin.Contrasena_Administrador ?? admin.Contraseña_Administrador ?? null;

    try {
      let hashToCompare = storedRaw;

      // 1) Si no hay nada guardado -> generamos hash con la contraseña proporcionada y guardamos
      if (!storedRaw || storedRaw.trim() === "") {
        const newHash = await bcrypt.hash(password, 10);
        const updateSql = `UPDATE Administradores SET Contrasena_Administrador = ? WHERE idAdministrador = ?`;
        db.query(updateSql, [newHash, admin.idAdministrador], (uErr) => {
          if (uErr) console.error("Error actualizando hash (vacio->hash):", uErr);
          else console.log(`Hash guardado para admin id=${admin.idAdministrador} (was empty).`);
        });
        hashToCompare = newHash;
      } else if (storedRaw.length < 60) {
        // 2) Si el valor existente parece texto plano (hash bcrypt tiene ~60 chars)
        //    Solo lo convertimos si coincide con la contraseña que ingresó el usuario.
        if (storedRaw === password) {
          const newHash = await bcrypt.hash(password, 10);
          const updateSql = `UPDATE Administradores SET Contrasena_Administrador = ? WHERE idAdministrador = ?`;
          db.query(updateSql, [newHash, admin.idAdministrador], (uErr) => {
            if (uErr) console.error("Error actualizando hash (plain->hash):", uErr);
            else console.log(`Plain->hash guardado para admin id=${admin.idAdministrador}.`);
          });
          hashToCompare = newHash;
        } else {
          // Si el texto plano en DB NO coincide con lo ingresado, no sobreescribimos (seguridad)
          return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }
      }
      // 3) Si storedRaw parece ser un hash (length >= 60), lo usamos directamente
      //    (hashToCompare ya apunta a storedRaw en ese caso)

      // Finalmente comparamos
      const passwordMatch = await bcrypt.compare(password, hashToCompare);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Correo o contraseña incorrectos" });
      }

      // Login exitoso - responde con los datos que uses en tu app
      res.json({
        message: "Login exitoso",
        admin: {
          id: admin.idAdministrador,
          nombre: admin.Nombre_Administrador,
          correo: admin.Correo_Administrador,
          telefono: admin.Telefono_Administrador
        }
      });
    } catch (e) {
      console.error("Error en login/migración de contraseña:", e);
      res.status(500).json({ error: "Error interno" });
    }
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

// ✅ Actualizar posición de una zona
app.put("/api/zonas/:id/posicion", (req, res) => {
  const { id } = req.params;
  const { pos_x, pos_y } = req.body;

  const sql = `UPDATE zonas SET pos_x = ?, pos_y = ? WHERE idzonas = ?`;

  db.query(sql, [pos_x, pos_y, id], (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar posición:", err);
      return res.status(500).json({ error: "Error al actualizar posición" });
    }
    res.json({ message: "✅ Posición actualizada correctamente" });
  });
});

// ✅ Obtener todas las conexiones
app.get("/api/conexiones", (req, res) => {
  db.query("SELECT * FROM conexiones", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener conexiones:", err);
      return res.status(500).json({ error: "Error al obtener conexiones" });
    }
    res.json(results);
  });
});

// ✅ Crear una nueva conexión entre zonas
app.post("/api/conexiones", (req, res) => {
  const { id_zona_origen, id_zona_destino } = req.body;
  if (!id_zona_origen || !id_zona_destino) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sql = `INSERT INTO conexiones (id_zona_origen, id_zona_destino) VALUES (?, ?)`;

  db.query(sql, [id_zona_origen, id_zona_destino], (err, result) => {
    if (err) {
      console.error("❌ Error MySQL:", err);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json({ id: result.insertId, message: "✅ Conexión creada" });
  });
});

// ✅ Eliminar conexión
app.delete("/api/conexiones/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM conexiones WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("❌ Error al eliminar conexión:", err);
      return res.status(500).json({ error: "Error al eliminar conexión" });
    }
    res.json({ message: "🗑️ Conexión eliminada" });
  });
});

// ===========================
// 🔹 CRUD DE EMPRESA (PERFIL)
// ===========================

// Obtener datos de la empresa (asumiendo solo un registro con id = 1)
app.get("/api/empresa", (req, res) => {
  const sql = "SELECT * FROM empresa WHERE id = 1";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener empresa:", err);
      return res.status(500).json({ error: "Error al obtener empresa" });
    }
    if (results.length === 0) return res.status(404).json({ error: "Empresa no encontrada" });
    res.json(results[0]);
  });
});

// Actualizar datos de la empresa
app.put("/api/empresa/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    address,
    phone,
    email,
    logo,
    primary_color,
    secondary_color,
    accent_color
  } = req.body;

  const sql = `
    UPDATE empresa SET
      nombre_empresa = ?,
      description_empresa = ?,
      direccion_empresa = ?,
      telefono_empresa = ?,
      correo_empresa = ?,
      logo = ?,
      primary_color = ?,
      secondary_color = ?,
      accent_color = ?
    WHERE id = ?
  `;

  db.query(sql, [
    name,
    description,
    address,
    phone,
    email,
    logo,
    primary_color,
    secondary_color,
    accent_color,
    id
  ], (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar empresa:", err);
      return res.status(500).json({ error: "Error al actualizar empresa" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: "Empresa no encontrada" });
    res.json({ message: "✅ Empresa actualizada correctamente" });
  });
});

// ===============================
// 🔹 SUBIDA DE LOGO DE EMPRESA
// ===============================

import fs from "fs";

// Configurar almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `logo_empresa${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// Endpoint para subir el logo
app.post("/api/upload-logo", upload.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ninguna imagen" });
  }

  // Ruta pública del logo (por ejemplo /uploads/logo_empresa.png)
  const logoPath = `/uploads/${req.file.filename}`;

  const sql = "UPDATE empresa SET logo = ? WHERE id = 1";
  db.query(sql, [logoPath], (err, result) => {
    if (err) {
      console.error("❌ Error al guardar el logo:", err);
      return res.status(500).json({ error: "Error al guardar el logo" });
    }
    res.json({ message: "✅ Logo actualizado correctamente", logo: logoPath });
  });
});

// ===========================
// 🔹 CRUD de ACCESOS (Registro de Entradas y Salidas)
// ===========================

// ✅ OBTENER TODOS LOS ACCESOS
app.get("/api/accesos", (req, res) => {
  const sql = `
    SELECT 
      a.idacceso,
      a.tipo_acceso,
      a.tipo_dispositivo_acceso,
      a.idDispositivo,
      a.estado_acceso,
      a.motivo_rechazo_acceso,
      a.fecha_inicio_acceso,
      a.fecha_fin_acceso,
      a.duracion_acceso,
      a.tarjeta_id,
      u.idUsuarios AS idUsuario,
      CONCAT(u.nombre_usuario, ' ', u.apellido_usuario) AS nombre_usuario,
      z.idzonas AS idZona,
      z.nombre_zona
    FROM acceso a
    LEFT JOIN usuarios u ON a.idUsuario = u.idUsuarios
    LEFT JOIN zonas z ON a.idZona = z.idzonas
    ORDER BY a.fecha_inicio_acceso DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener accesos:", err);
      return res.status(500).json({ error: "Error al obtener accesos" });
    }
    res.json(results);
  });
});

// ===========================
// 🔹 CRUD de Alertas 
// ===========================

// ✅ Obtener todas las alertas
app.get("/api/alertas", (req, res) => {
  db.query(
    `SELECT idAlerta, tipo_alerta, detalles_alerta, zona, usuario, resolucion, fecha_inicio, fecha_fin, estado, severidad, iddispositivo, idUsuario 
     FROM alerta 
     ORDER BY fecha_inicio DESC`,
    (err, results) => {
      if (err) {
        console.error("Error al obtener alertas:", err);
        return res.status(500).json({ error: "Error al obtener alertas" });
      }
      res.json(results);
    }
  );
});


// ✅ Marcar alerta como resuelta
app.put("/api/alertas/:id/resolver", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "UPDATE Alerta SET estado = 'Resuelto', fecha_fin = NOW() WHERE idAlerta = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }
    res.json({ message: "Alerta marcada como resuelta" });
  } catch (error) {
    console.error("Error al actualizar alerta:", error);
    res.status(500).json({ error: "Error al actualizar alerta" });
  }
});

// 📊 REPORTES DE ACCESOS
app.get("/api/reportes", (req, res) => {
  // --- Total de accesos, autorizados, denegados ---
  const sqlTotales = `
    SELECT 
      COUNT(*) AS total_accesos,
      SUM(estado_acceso = 'Autorizado') AS total_autorizados,
      SUM(estado_acceso = 'Denegado') AS total_denegados
    FROM acceso
  `;

  db.query(sqlTotales, (err, totales) => {
    if (err) {
      console.error("Error obteniendo totales:", err);
      return res.status(500).json({ error: "Error obteniendo totales" });
    }

    // --- Accesos por hora ---
    const sqlPorHora = `
      SELECT 
        DATE_FORMAT(fecha_inicio_acceso, '%H:00') AS hour,
        COUNT(*) AS accesos
      FROM acceso
      GROUP BY hour
      ORDER BY hour
    `;

    db.query(sqlPorHora, (err, porHora) => {
      if (err) {
        console.error("Error obteniendo accesos por hora:", err);
        return res.status(500).json({ error: "Error obteniendo accesos por hora" });
      }

      // --- Accesos por zona ---
      const sqlPorZona = `
        SELECT 
          z.nombre_zona AS name,
          COUNT(*) AS value
        FROM acceso a
        JOIN zonas z ON a.idZona = z.idzonas
        GROUP BY z.nombre_zona
      `;

      db.query(sqlPorZona, (err, porZona) => {
        if (err) {
          console.error("Error obteniendo accesos por zona:", err);
          return res.status(500).json({ error: "Error obteniendo accesos por zona" });
        }

        // --- Tendencia semanal ---
        const sqlSemanal = `
          SELECT 
            DAYNAME(fecha_inicio_acceso) AS dia,
            SUM(estado_acceso = 'Autorizado') AS accesos,
            SUM(estado_acceso = 'Denegado') AS denegados
          FROM acceso
          WHERE fecha_inicio_acceso >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY dia
          ORDER BY FIELD(dia, 'Lun','Mar','Mier','Juev','Vier','Sab','Dom')
        `;

        db.query(sqlSemanal, (err, semanal) => {
          if (err) {
            console.error("Error obteniendo tendencia semanal:", err);
            return res.status(500).json({ error: "Error obteniendo tendencia semanal" });
          }

          // --- Top usuarios ---
          const sqlTopUsuarios = `
            SELECT 
              CONCAT(u.nombre_usuario, ' ', u.apellido_usuario) AS name,
              COUNT(a.idacceso) AS accesos,
              u.cargo_usuario AS departamento
            FROM acceso a
            JOIN usuarios u ON a.idUsuario = u.idUsuarios
            GROUP BY u.idUsuarios
            ORDER BY accesos DESC
            LIMIT 5
          `;

          db.query(sqlTopUsuarios, (err, topUsuarios) => {
            if (err) {
              console.error("Error obteniendo top usuarios:", err);
              return res.status(500).json({ error: "Error obteniendo top usuarios" });
            }

            // 🔹 Responder con todos los datos
            res.json({
              totales: totales[0],
              porHora,
              porZona,
              semanal,
              topUsuarios
            });
          });
        });
      });
    });
  });
});

// ==========================
// 📊 ENDPOINTS PARA DASHBOARD
// ==========================

// ✅ Obtener estadísticas principales para el dashboard
app.get("/api/dashboard/stats", (req, res) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM usuarios) AS totalUsers,
      (SELECT COUNT(DISTINCT idUsuario) 
         FROM acceso 
         WHERE DATE(fecha_inicio_acceso) = CURDATE()) AS activeUsers,
      (SELECT COUNT(*) 
         FROM acceso 
         WHERE DATE(fecha_inicio_acceso) = CURDATE()) AS todayAccesses,
      (SELECT COUNT(*) 
         FROM acceso 
         WHERE estado_acceso = 'Denegado' AND DATE(fecha_inicio_acceso) = CURDATE()) AS unauthorizedAttempts,
      (SELECT COUNT(*) 
         FROM zonas 
         WHERE estado_zona = 'Activa') AS secureZones
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error obteniendo stats dashboard:", err);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json(results[0]);
  });
});

// ✅ Obtener últimos accesos recientes
app.get("/api/dashboard/recent-accesses", (req, res) => {
  const sql = `
    SELECT 
      a.idacceso AS id,
      CONCAT(u.nombre_usuario, ' ', u.apellido_usuario) AS user,
      z.nombre_zona AS zone,
      TIME(a.fecha_inicio_acceso) AS time,
      a.estado_acceso AS status
    FROM acceso a
    LEFT JOIN usuarios u ON a.idUsuario = u.idUsuarios
    LEFT JOIN zonas z ON a.idZona = z.idzonas
    ORDER BY a.fecha_inicio_acceso DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error obteniendo accesos recientes:", err);
      return res.status(500).json({ error: err.sqlMessage });
    }
    // Convertir estado a 'success' o 'denied' para frontend
    const mapped = results.map(r => ({
      ...r,
      status: r.status === "Autorizado" ? "success" : "denied",
      time: r.time ? r.time.substring(0,5) : ""
    }));
    res.json(mapped);
  });
});

// ✅ Obtener alertas activas (opcional para mostrar en dashboard)
app.get("/api/dashboard/active-alerts", (req, res) => {
  const sql = `
    SELECT COUNT(*) AS count
    FROM alerta
    WHERE estado = 'Pendiente' AND DATE(fecha_inicio) = CURDATE()
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error obteniendo alertas activas:", err);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json({ activeAlerts: results[0].count });
  });
});

// ==============================================
// 🧾 AUDITORÍA (usando la tabla administradores con búsqueda por correo)
// ==============================================

app.post("/api/auditoria", (req, res) => {
  const { correo, accion, entidad, entidad_id, detalle } = req.body;

  if (!correo || !accion || !entidad) {
    return res.status(400).json({ error: "Faltan campos obligatorios (correo, accion o entidad)" });
  }

  // Buscar el administrador por correo
  const sqlBuscar = `
    SELECT idAdministrador 
    FROM administradores 
    WHERE Correo_Administrador = ?
    LIMIT 1
  `;

  db.query(sqlBuscar, [correo], (err, result) => {
    if (err) {
      console.error("❌ Error al buscar administrador:", err);
      return res.status(500).json({ error: "Error al buscar administrador" });
    }

    if (result.length === 0) {
      console.warn(`⚠️ No se encontró administrador con el correo: ${correo}`);
      return res.status(404).json({ error: "Administrador no encontrado" });
    }

    const usuario_id = result[0].idAdministrador;

    // Insertar la auditoría
    const sqlInsert = `
      INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [usuario_id, accion, entidad, entidad_id || null, detalle || null];

    db.query(sqlInsert, values, (err2) => {
      if (err2) {
        console.error("❌ Error al registrar auditoría:", err2);
        return res.status(500).json({ error: "Error al registrar auditoría" });
      }

      console.log(`✅ Auditoría registrada (${correo} → ${accion} ${entidad})`);
      res.json({ message: "Auditoría registrada correctamente" });
    });
  });
});


// Obtener todas las acciones de auditoría
app.get("/api/auditoria", (req, res) => {
  const sql = `
    SELECT a.*, ad.Nombre_Administrador, ad.Apellido_Administrador
    FROM auditoria a
    LEFT JOIN administradores ad ON a.usuario_id = ad.idAdministrador
    ORDER BY a.fecha DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});


// Detalles de alertas recientes
app.get("/api/dashboard/alerts-detail", (req, res) => {
  const sql = `
    SELECT 
      a.id, 
      CONCAT(ad.Nombre_Administrador, ' ', ad.Apellido_Administrador) AS usuario, 
      a.accion, 
      a.entidad, 
      a.detalle, 
      a.fecha
    FROM auditoria a
    LEFT JOIN administradores ad ON a.usuario_id = ad.idAdministrador
    WHERE DATE(a.fecha) = CURDATE()
    ORDER BY a.fecha DESC
    LIMIT 20
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});
// ✅ Ruta temporal para probar autenticación TTLock
app.get("/api/ttlock/test-login", async (req, res) => {
  try {
    const tokenData = await ttlockLogin(); // <-- esta función SÍ existe en auth.js
    res.json({ success: true, data: tokenData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/ttlock/sync-locks", async (req, res) => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${process.env.TTLOCK_BASE_URL}/v3/lock/list`,
      new URLSearchParams({
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken: token,
        pageNo: 1,
        pageSize: 50,
        date: Date.now(),
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const locks = response.data.list || [];
    console.log(`🔐 Cerraduras encontradas: ${locks.length}`);

    // Guardar en base de datos
    const conn = await pool.getConnection();
    try {
      for (const lock of locks) {
        await conn.query(
          `INSERT INTO dispositivos 
            (nombre_dispositivo, tipo_dispositivo, nombre_zona_dispositivo, ubicacion, Estado, lock_key, wifi_lock)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            nombre_dispositivo = VALUES(nombre_dispositivo),
            Estado = VALUES(Estado),
            lock_key = VALUES(lock_key),
            wifi_lock = VALUES(wifi_lock)`,
          [
            lock.lockAlias || "Cerradura TTLock",
            "Cerradura inteligente",
            "Sin zona",
            "Sin ubicación",
            "Activa",
            lock.lockKey,
            lock.wifiLock ? 1 : 0,
          ]
        );
      }
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      locks,
    });
  } catch (error) {
    console.error("❌ Error sincronizando cerraduras:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
// 🧩 Ruta para sincronizar manualmente
app.get("/api/ttlock/sync", async (req, res) => {
  try {
    const result = await syncTTLockDevices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🚀 Sincroniza automáticamente al iniciar el servidor
syncTTLockDevices()
  .then(() => console.log("✅ Sincronización inicial TTLock completada."))
  .catch((err) => console.error("⚠️ Error en sincronización inicial:", err.message));

// =======================================================
// 🧠 TTLOCK: Crear registro pendiente de Huella
// =======================================================
app.post("/api/ttlock/requestFingerprint", async (req, res) => {
  const { correo_usuario, admin_email } = req.body;
  if (!correo_usuario) return res.status(400).json({ error: "Correo del usuario requerido" });

  try {
    const [users] = await db.promise().query("SELECT * FROM usuarios WHERE correo_usuario = ?", [correo_usuario]);
    if (users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const user = users[0];

    // Guardar registro pendiente en DB
    await db.promise().query(
      "UPDATE usuarios SET huella_estado = ? WHERE idUsuarios = ?",
      ["pendiente", user.idUsuarios]
    );

    // Registrar auditoría
    await db.promise().query(
      "INSERT INTO auditoria (correo, accion, entidad, entidad_id, detalle, fecha) VALUES (?, ?, ?, ?, ?, NOW())",
      [
        admin_email || "sistema@local",
        "SOLICITAR_HUELLA",
        "USUARIO",
        user.idUsuarios,
        `Solicitud de huella pendiente para ${user.nombre_usuario} ${user.apellido_usuario}`,
      ]
    );

    res.json({
      success: true,
      message: "✅ Solicitud creada. Acércate a la cerradura y registra la huella con la app TTLock.",
    });

    console.log(`✅ Registro pendiente de huella creado para ${user.nombre_usuario} ${user.apellido_usuario}`);
  } catch (error) {
    console.error("❌ Error creando registro pendiente de huella:", error.message);
    res.status(500).json({ error: "Error al crear registro pendiente de huella" });
  }
});

// =======================================================
// 🧠 TTLOCK: Sincronizar huellas registradas y actualizar DB
// =======================================================
// Vincular huella existente y manejar todos los datos
app.post("/api/ttlock/linkFingerprint", async (req, res) => {
  const { correo_usuario, admin_email } = req.body;
  if (!correo_usuario) return res.status(400).json({ error: "Correo del usuario requerido" });

  try {
    // 1️⃣ Buscar usuario en la base de datos
    const [users] = await db.promise().query(
      "SELECT * FROM usuarios WHERE correo_usuario = ?",
      [correo_usuario]
    );
    if (users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const user = users[0];

    // 2️⃣ Obtener token TTLock
    const tokenData = await refreshTTLockToken();
    const accessToken = tokenData.access_token;

    // 3️⃣ Listar huellas del lock
    const params = new URLSearchParams();
    params.append("clientId", process.env.TTLOCK_CLIENT_ID);
    params.append("accessToken", accessToken);
    params.append("lockId", process.env.TTLOCK_LOCK_ID);
    params.append("pageNo", "1");
    params.append("pageSize", "200");
    params.append("orderBy", "0"); // Orden por nombre
    params.append("date", Date.now().toString());

    const response = await axios.get(`${process.env.TTLOCK_BASE_URL}/v3/fingerprint/list?${params.toString()}`);
    const fingerprints = response.data.list || [];

    // 4️⃣ Buscar huella que coincida con nombre + apellido
    const matchedFingerprint = fingerprints.find(fp =>
      fp.fingerprintName === `${user.nombre_usuario} ${user.apellido_usuario}`
    );

    if (!matchedFingerprint) {
      return res.status(404).json({ error: "No se encontró huella con ese nombre en la cerradura" });
    }

    // 5️⃣ Guardar fingerprintId en la base de datos
    await db.promise().query(
      "UPDATE usuarios SET huella_usuario = ? WHERE idUsuarios = ?",
      [matchedFingerprint.fingerprintNumber, user.idUsuarios]
    );

    // 7️⃣ Responder con toda la info de la huella
    res.json({
      success: true,
      message: "✅ Huella vinculada exitosamente al usuario",
      fingerprint: matchedFingerprint
    });

  } catch (err) {
    console.error("❌ Error vinculando huella TTLock:", err.response?.data || err.message);
    res.status(500).json({ error: "Error al vincular huella TTLock" });
  }
});
// =======================================================
// 🧠 TTLOCK: Vincular tarjeta existente y actualizar DB
// =======================================================
app.post("/api/ttlock/linkCard", async (req, res) => {
  const { correo_usuario } = req.body;
  if (!correo_usuario)
    return res.status(400).json({ error: "Correo del usuario requerido" });

  try {
    // Buscar usuario
    const [users] = await db
      .promise()
      .query("SELECT * FROM usuarios WHERE correo_usuario = ?", [
        correo_usuario,
      ]);

    if (users.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const user = users[0];

    // Obtener accessToken
    const tokenData = await refreshTTLockToken();
    const accessToken = tokenData.access_token;

    // Parámetros TTLock
    const params = new URLSearchParams();
    params.append("clientId", process.env.TTLOCK_CLIENT_ID);
    params.append("accessToken", accessToken);
    params.append("lockId", process.env.TTLOCK_LOCK_ID);
    params.append("pageNo", "1");
    params.append("pageSize", "200");
    params.append("orderBy", "0");
    params.append("date", Date.now().toString());

    // Llamada al endpoint OFICIAL correcto
    const response = await axios.get(
      `${process.env.TTLOCK_BASE_URL}/v3/identityCard/list?${params.toString()}`
    );

    const cards = response.data.list || [];

    // Buscar tarjeta por nombre EXACTO
    const matchedCard = cards.find(
      (c) =>
        c.cardName === `${user.nombre_usuario} ${user.apellido_usuario}`
    );

    if (!matchedCard) {
      return res.status(404).json({
        error: "No se encontró una tarjeta en la cerradura con este nombre",
      });
    }

    // Guardar tarjeta en DB
    await db.promise().query(
  "UPDATE usuarios SET targeta_usuario = ? WHERE idUsuarios = ?",
  [matchedCard.cardId, user.idUsuarios]
);
;

    res.json({
      success: true,
      message: "Tarjeta vinculada correctamente",
      card: matchedCard,
    });

  } catch (error) {
    console.error(
      "❌ Error vinculando tarjeta TTLock:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Error al vincular tarjeta TTLock",
      detalle: error.response?.data || error.message,
    });
  }
});

// 🚀 Iniciar servidor
app.listen(process.env.PORT || 5001, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 5001}`);
});
