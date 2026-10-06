// Storage semplice basato su file JSON (nessun database esterno da installare).
// Adatto al volume di una scuola di lingue. Se in futuro servisse di più,
// si può sostituire con un vero database senza toccare il resto del codice
// (le funzioni esportate restano le stesse).

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "submissions.json");

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf8");
}

function readAll() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("submissions.json è corrotto, riparto da un archivio vuoto:", e);
    return [];
  }
}

function writeAll(list) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), "utf8");
}

function addSubmission(sub) {
  const all = readAll();
  all.push(sub);
  writeAll(all);
  return sub;
}

function getSubmission(id) {
  return readAll().find((s) => s.id === id);
}

function updateSubmission(id, patch) {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
  return all[idx];
}

// ---------- Test rapido di livello: archivio separato ----------
const PLACEMENT_FILE = path.join(DATA_DIR, "placement.json");

function readPlacement() {
  ensureDb();
  if (!fs.existsSync(PLACEMENT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PLACEMENT_FILE, "utf8"));
  } catch (e) {
    console.error("placement.json è corrotto:", e);
    return [];
  }
}

function addPlacement(result) {
  const all = readPlacement();
  all.push(result);
  fs.writeFileSync(PLACEMENT_FILE, JSON.stringify(all, null, 2), "utf8");
  return result;
}

function getPlacement(id) {
  return readPlacement().find((r) => r.id === id);
}

module.exports = {
  readAll, writeAll, addSubmission, getSubmission, updateSubmission, DATA_DIR,
  readPlacement, addPlacement, getPlacement,
};
