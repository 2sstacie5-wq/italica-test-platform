// Доступ викладачів до внутрішньої бази (/baza).
// Кожен викладач має свій персональний код входу. Коли викладач іде з Італіки,
// адмін вимикає або видаляє його в панелі /admin/baza — і доступ зникає одразу.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "baza-teachers.json");
const SECRET_FILE = path.join(DATA_DIR, "baza-secret");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf8");
}
function readAll() {
  ensure();
  try { return JSON.parse(fs.readFileSync(FILE, "utf8") || "[]"); } catch (e) { return []; }
}
function writeAll(list) { ensure(); fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8"); }

let secret = null;
function getSecret() {
  if (secret) return secret;
  ensure();
  if (process.env.BAZA_SECRET) return (secret = process.env.BAZA_SECRET);
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"), "utf8");
  return (secret = fs.readFileSync(SECRET_FILE, "utf8").trim());
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без схожих 0/O, 1/I
function newCode() {
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return "ITALICA-" + s;
}
const norm = (c) => String(c || "").trim().toUpperCase().replace(/\s+/g, "");

function add(name) {
  const list = readAll();
  const codes = new Set(list.map((t) => t.code));
  let code = newCode();
  while (codes.has(code)) code = newCode();
  const t = { id: crypto.randomUUID(), name: String(name).trim().slice(0, 80), code, active: true, createdAt: new Date().toISOString(), lastSeen: null, version: 1 };
  list.push(t); writeAll(list); return t;
}
function update(id, patch) {
  const list = readAll(); const i = list.findIndex((t) => t.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch }; writeAll(list); return list[i];
}
function regenerate(id) {
  const list = readAll(); const t = list.find((x) => x.id === id);
  if (!t) return null;
  // нова версія робить недійсними всі старі входи цього викладача
  return update(id, { code: newCode(), version: (t.version || 1) + 1 });
}
function remove(id) { writeAll(readAll().filter((t) => t.id !== id)); }
function byCode(code) { const c = norm(code); return readAll().find((t) => t.code === c) || null; }
function byId(id) { return readAll().find((t) => t.id === id) || null; }

function sign(id, version) {
  const payload = `${id}.${version}`;
  const mac = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}
function verify(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [id, version, mac] = parts;
  const good = crypto.createHmac("sha256", getSecret()).update(`${id}.${version}`).digest("base64url");
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  const t = byId(id);
  if (!t || !t.active || String(t.version || 1) !== version) return null;
  return t;
}

module.exports = { readAll, add, update, regenerate, remove, byCode, byId, sign, verify };
