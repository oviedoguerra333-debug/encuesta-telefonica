const { getStore } = require("@netlify/blobs");

const ADMIN_KEY = process.env.ADMIN_KEY || "cambiar-esta-clave-secreta";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const store = getStore("respuestas");

  // POST — guardar nueva respuesta
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      const id = `resp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await store.setJSON(id, { ...body, id, ts: new Date().toISOString() });
      return { statusCode: 201, headers, body: JSON.stringify({ ok: true, id }) };
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Datos inválidos" }) };
    }
  }

  // GET — leer todas las respuestas (requiere clave admin)
  if (event.httpMethod === "GET") {
    const key = event.headers["x-admin-key"] || event.queryStringParameters?.key;
    if (key !== ADMIN_KEY) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "No autorizado" }) };
    }
    try {
      const { blobs } = await store.list();
      const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
      const sorted = items.filter(Boolean).sort((a, b) => new Date(a.ts) - new Date(b.ts));
      return { statusCode: 200, headers, body: JSON.stringify(sorted) };
    } catch (e) {
