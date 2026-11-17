// Дайджест подій для викладачів (/baza). Події редагуються в /admin/baza.
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "data", "baza-events.json");

const SEED = [
  { date: "2026-11-07", time: "11:00", type: "workshop", title: "Воркшоп з викладачем ораторського мистецтва", details: "Будемо говорити про голос, дикцію і про те, як не захрипати після пʼяти уроків 🤍" },
  { date: "2026-11-21", time: "11:00", type: "workshop", title: "Воркшоп: груп / peer-менеджмент", details: "" },
  { date: "2026-11-27", time: "21:00", type: "social", title: "Онлайн-аперитив", details: "Вже будемо до свят готуватись — пора говорити про Secret Santa 🎅" },
  { date: "2026-12-11", time: "11:00", type: "workshop", title: "Практичний воркшоп від Жені", details: "" },
  { date: "2026-12-24", time: "", type: "off", title: "Вихідний", details: "" },
  { date: "2026-12-25", time: "", type: "off", title: "Вихідний", details: "" },
  { date: "2026-12-31", time: "", type: "off", title: "Вихідний", details: "" },
];
const TYPES = ["workshop", "social", "off", "other"];

function clean(list) {
  return (Array.isArray(list) ? list : [])
    .map((e) => ({
      date: String(e.date || "").slice(0, 10),
      time: String(e.time || "").slice(0, 5),
      type: TYPES.includes(e.type) ? e.type : "other",
      title: String(e.title || "").trim().slice(0, 200),
      details: String(e.details || "").trim().slice(0, 1000),
    }))
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.title)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
function readAll() {
  try { return clean(JSON.parse(fs.readFileSync(FILE, "utf8"))); } catch (e) { return clean(SEED); }
}
function save(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const c = clean(list); fs.writeFileSync(FILE, JSON.stringify(c, null, 2), "utf8"); return c;
}
module.exports = { readAll, save };
