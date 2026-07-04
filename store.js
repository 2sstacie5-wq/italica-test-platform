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

module.exports = { readAll, writeAll, addSubmission, getSubmission, updateSubmission, DATA_DIR };
