// Сховище трекера "Il mio percorso".
// За замовчуванням — файл data/percorso.json (на безкоштовному Render він стирається при кожному деплої).
// Щоб дані не губились, задайте змінні середовища GITHUB_TOKEN і GIST_ID:
// тоді все зберігається у приватному GitHub Gist (безкоштовно, переживає деплої).
const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "percorso.json");
const GIST_ID = process.env.GIST_ID || "";
const TOKEN = process.env.GITHUB_TOKEN || "";
const GIST_FILE = "percorso.json";
const useGist = !!(GIST_ID && TOKEN);

const DEFAULT_TEACHERS = ["Маестра Наті", "Маестра Ліза"];
let state = { students: {}, syllabus: null, teachers: DEFAULT_TEACHERS.slice() };
let ready = null;
let saveTimer = null;

function readLocal() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { return null; }
}
function writeLocal() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(state), "utf8"); }
  catch (e) { console.error("percorso: не вдалося записати файл", e.message); }
}
async function gistFetch(method, body) {
  const r = await fetch("https://api.github.com/gists/" + GIST_ID, {
    method,
    headers: { Authorization: "Bearer " + TOKEN, Accept: "application/vnd.github+json", "User-Agent": "italica-percorso", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error("gist " + r.status);
  return r.json();
}
async function load() {
  if (useGist) {
    try {
      const g = await gistFetch("GET");
      const f = g.files && g.files[GIST_FILE];
      let txt = f && f.content;
      if (f && f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      if (txt) state = JSON.parse(txt);
      console.log("percorso: дані завантажено з Gist");
      return;
    } catch (e) { console.error("percorso: Gist недоступний, читаю локальний файл", e.message); }
  }
  const local = readLocal();
  if (local) state = local;
}
function init() { if (!ready) ready = load().then(() => { state.students = state.students || {}; if (!Array.isArray(state.teachers)) state.teachers = DEFAULT_TEACHERS.slice(); }); return ready; }
function scheduleSave() {
  writeLocal();
  if (!useGist) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    gistFetch("PATCH", { files: { [GIST_FILE]: { content: JSON.stringify(state, null, 1) } } })
      .catch((e) => console.error("percorso: не вдалося зберегти в Gist", e.message));
  }, 1500);
}
function merge(a, b) {
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (v && typeof v === "object" && !Array.isArray(v)) a[k] = merge(a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) ? a[k] : {}, v);
    else a[k] = v;
  }
  return a;
}
module.exports = {
  init,
  usesGist: () => useGist,
  all: () => ({ students: Object.entries(state.students).map(([id, s]) => ({ ...s, id })), syllabus: state.syllabus ? state.syllabus.levels : null, teachers: state.teachers }),
  setTeachers: (list) => { state.teachers = list; scheduleSave(); },
  syllabus: () => (state.syllabus ? state.syllabus.levels : null),
  byCode: (code) => { const e = Object.entries(state.students).find(([, s]) => String(s.code).toUpperCase() === String(code).toUpperCase()); return e ? { ...e[1], id: e[0] } : null; },
  get: (id) => state.students[id],
  set: (id, data) => { const d = { ...data }; delete d.id; state.students[id] = d; scheduleSave(); },
  patch: (id, p) => { if (!state.students[id]) return false; const d = { ...p }; delete d.id; merge(state.students[id], d); scheduleSave(); return true; },
  remove: (id) => { delete state.students[id]; scheduleSave(); },
  setSyllabus: (v) => { state.syllabus = v; scheduleSave(); },
  importAll: (obj) => { if (obj.students) state.students = obj.students; if ("syllabus" in obj) state.syllabus = obj.syllabus; if (Array.isArray(obj.teachers)) state.teachers = obj.teachers; scheduleSave(); },
  exportAll: () => state,
};
