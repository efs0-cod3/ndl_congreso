import { createHash, timingSafeEqual } from "node:crypto";

// Esta función corre en el servidor de Vercel, nunca en el navegador.
// Es el único lugar donde existe la llave con permiso de lectura: si esto
// viviera en el front, cualquiera podría descargarse la lista de doctores.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLAVE = process.env.DASHBOARD_PASSWORD;
const TABLA = process.env.SUPABASE_TABLE || "leads_congreso_lab";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Comparar los hashes (y no los textos) evita filtrar el largo de la clave y
// mantiene el tiempo de comparación constante.
function sha256(valor) {
  return createHash("sha256").update(String(valor)).digest();
}

function claveValida(recibida) {
  if (!CLAVE || typeof recibida !== "string" || recibida === "") return false;
  return timingSafeEqual(sha256(recibida), sha256(CLAVE));
}

function supabase(ruta, opciones = {}) {
  return fetch(SUPABASE_URL + "/rest/v1/" + ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      ...(opciones.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");

  if (!SUPABASE_URL || !SERVICE_KEY || !CLAVE) {
    return res.status(500).json({
      error:
        "Faltan variables de entorno en Vercel (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DASHBOARD_PASSWORD).",
    });
  }

  if (!claveValida(req.headers["x-clave"])) {
    // Pequeña espera para que probar claves a lo bruto sea lento.
    await new Promise((resolver) => setTimeout(resolver, 600));
    return res.status(401).json({ error: "Clave incorrecta" });
  }

  try {
    if (req.method === "GET") {
      const respuesta = await supabase(
        TABLA + "?select=*&order=created_at.desc"
      );
      if (!respuesta.ok) throw new Error("Supabase respondió " + respuesta.status);
      return res.status(200).json({ leads: await respuesta.json() });
    }

    if (req.method === "PATCH") {
      const cuerpo =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { id, contactado } = cuerpo;

      if (!UUID_RE.test(String(id || ""))) {
        return res.status(400).json({ error: "id inválido" });
      }
      if (typeof contactado !== "boolean") {
        return res.status(400).json({ error: "contactado debe ser booleano" });
      }

      const respuesta = await supabase(TABLA + "?id=eq." + id, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          contactado,
          contactado_at: contactado ? new Date().toISOString() : null,
        }),
      });
      if (!respuesta.ok) throw new Error("Supabase respondió " + respuesta.status);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    // El detalle va al log de Vercel; al navegador solo un mensaje genérico.
    console.error("Error hablando con Supabase:", error);
    return res.status(502).json({ error: "No se pudo consultar la base." });
  }
}
