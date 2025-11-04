// src/ttlock/auth.js
import axios from "axios";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear conexión a MySQL (ajústala según tu server.js)
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// ===============================================
// ✅ Función principal: obtener token TTLock
// ===============================================
export async function getAccessToken() {
  try {
    // 1️⃣ Buscar token guardado en BD
    const [rows] = await db.execute("SELECT * FROM ttlock_tokens ORDER BY id DESC LIMIT 1");

    if (rows.length > 0) {
      const token = rows[0];
      const now = new Date();
      const lastUpdate = new Date(token.last_update);
      const expiresIn = token.expires_in * 1000;

      // Si el token aún es válido, reutilízalo
      if (now - lastUpdate < expiresIn - 60000) {
        console.log("✅ Token TTLock aún válido.");
        return token.access_token;
      }

      // Si expiró, intenta refrescarlo
      if (token.refresh_token) {
        console.log("♻️ Token expirado. Intentando refrescar...");
        const newToken = await refreshAccessToken(token.refresh_token);
        return newToken;
      }
    }

    // 2️⃣ Si no hay token guardado o falló refrescar, solicitar uno nuevo
    console.log("🔑 Solicitando nuevo access_token a TTLock...");
    const response = await axios.post("https://api.ttlock.com/oauth2/token", null, {
      params: {
        client_id: process.env.TTLOCK_CLIENT_ID,
        client_secret: process.env.TTLOCK_CLIENT_SECRET,
        username: process.env.TTLOCK_USERNAME,
        password: process.env.TTLOCK_PASSWORD,
        grant_type: "password",
      },
    });

    const data = response.data;
    console.log("✅ Nuevo token obtenido correctamente.");

    // Guardar en BD
    await db.execute(
      "INSERT INTO ttlock_tokens (access_token, refresh_token, expires_in, last_update) VALUES (?, ?, ?, NOW())",
      [data.access_token, data.refresh_token, data.expires_in]
    );

    return data.access_token;
  } catch (error) {
    console.error("❌ Error al obtener token TTLock:", error.response?.data || error.message);
    throw new Error("Error en la autenticación TTLock");
  }
}

// ===============================================
// 🔁 Refrescar token
// ===============================================
export async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post("https://api.ttlock.com/oauth2/token", null, {
      params: {
        client_id: process.env.TTLOCK_CLIENT_ID,
        client_secret: process.env.TTLOCK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
    });

    const data = response.data;
    console.log("✅ Token refrescado correctamente.");

    await db.execute(
      "INSERT INTO ttlock_tokens (access_token, refresh_token, expires_in, last_update) VALUES (?, ?, ?, NOW())",
      [data.access_token, data.refresh_token, data.expires_in]
    );

    return data.access_token;
  } catch (error) {
    console.error("⚠️ No se pudo refrescar el token:", error.response?.data || error.message);
    throw new Error("Error al refrescar token TTLock");
  }
}
