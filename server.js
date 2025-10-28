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

// ✅ CREAR NUEVO REGISTRO DE ACCESO
app.post("/api/accesos", (req, res) => {
  const {
    idUsuario,
    idZona,
    tipo_acceso,
    tipo_dispositivo_acceso,
    idDispositivo,
    estado_acceso,
    motivo_rechazo_acceso,
    fecha_inicio_acceso,
    fecha_fin_acceso,
    tarjeta_id
  } = req.body;

  const sql = `
    INSERT INTO acceso (
      idUsuario,
      idZona,
      tipo_acceso,
      tipo_dispositivo_acceso,
      idDispositivo,
      estado_acceso,
      motivo_rechazo_acceso,
      fecha_inicio_acceso,
      fecha_fin_acceso,
      tarjeta_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    idUsuario || null,
    idZona || null,
    tipo_acceso || "RFID",
    tipo_dispositivo_acceso || null,
    idDispositivo || null,
    estado_acceso || "Autorizado",
    motivo_rechazo_acceso || null,
    fecha_inicio_acceso || new Date(),
    fecha_fin_acceso || null,
    tarjeta_id || null
  ], (err, result) => {
    if (err) {
      console.error("❌ Error al crear acceso:", err);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json({ id: result.insertId, message: "✅ Acceso registrado correctamente" });
  });
});

// ✅ ACTUALIZAR REGISTRO DE ACCESO
app.put("/api/accesos/:id", (req, res) => {
  const { id } = req.params;
  const {
    idUsuario,
    idZona,
    tipo_acceso,
    tipo_dispositivo_acceso,
    idDispositivo,
    estado_acceso,
    motivo_rechazo_acceso,
    fecha_inicio_acceso,
    fecha_fin_acceso,
    tarjeta_id
  } = req.body;

  const sql = `
    UPDATE acceso SET
      idUsuario = ?,
      idZona = ?,
      tipo_acceso = ?,
      tipo_dispositivo_acceso = ?,
      idDispositivo = ?,
      estado_acceso = ?,
      motivo_rechazo_acceso = ?,
      fecha_inicio_acceso = ?,
      fecha_fin_acceso = ?,
      tarjeta_id = ?
    WHERE idacceso = ?
  `;

  db.query(sql, [
    idUsuario || null,
    idZona || null,
    tipo_acceso,
    tipo_dispositivo_acceso,
    idDispositivo,
    estado_acceso,
    motivo_rechazo_acceso,
    fecha_inicio_acceso,
    fecha_fin_acceso,
    tarjeta_id,
    id
  ], (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar acceso:", err);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json({ message: "✅ Acceso actualizado correctamente" });
  });
});

// ✅ ELIMINAR REGISTRO DE ACCESO
app.delete("/api/accesos/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM acceso WHERE idacceso = ?", [id], (err, result) => {
    if (err) {
      console.error("❌ Error al eliminar acceso:", err);
      return res.status(500).json({ error: "Error al eliminar acceso" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Registro de acceso no encontrado" });

    res.json({ message: "🗑️ Acceso eliminado correctamente" });
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
          ORDER BY FIELD(dia, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
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


// 🚀 Iniciar servidor
app.listen(process.env.PORT || 5001, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 5001}`);
});
