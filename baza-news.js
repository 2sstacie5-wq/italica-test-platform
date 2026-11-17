// Новини для викладачів (/baza). Редагуються в /admin/baza.
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "data", "baza-news.json");

const SEED = [
  {
    id: "n1", date: "2026-11-17", author: "Настя", pinned: true,
    title: "Цієї суботи — важливий воркшоп про ведення пар і груп 🤍",
    text: "Проводить Марія Волкотруб: https://www.instagram.com/mariia.volkotrub\n\nНатисніть лайк у групі, хто буде.\n\nО 10:30 підʼєднайтесь, будь ласка, до мене в Zoom: 20 хвилин приділимо обговоренню платформи, ще 10 хвилин — на каву, а потім воркшоп 🥺🙏🏽",
  },
  {
    id: "n2", date: "2026-11-17", author: "Настя", pinned: false,
    title: "Граємо в Secret Santa 🎅🤍",
    text: "Заповніть, будь ласка, форму: https://docs.google.com/forms/d/e/1FAIpQLSdqdvzcpyRppjofPCrUkEvaQKm0vSz9eS6qzyR73Lah88_ygw/viewform\n\nВідправляти подаруночки можна 10–15 грудня, за доставку платить відправник — так, щоб посилочка точно доїхала до свят!",
  },
];

function clean(list) {
  return (Array.isArray(list) ? list : [])
    .map((n, i) => ({
      id: String(n.id || "n" + Date.now() + i).slice(0, 40),
      date: String(n.date || "").slice(0, 10),
      author: String(n.author || "").trim().slice(0, 60),
      pinned: !!n.pinned,
      title: String(n.title || "").trim().slice(0, 200),
      text: String(n.text || "").trim().slice(0, 4000),
    }))
    .filter((n) => n.title || n.text)
    .sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
}
function readAll() { try { return clean(JSON.parse(fs.readFileSync(FILE, "utf8"))); } catch (e) { return clean(SEED); } }
function save(list) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const c = clean(list); fs.writeFileSync(FILE, JSON.stringify(c, null, 2), "utf8"); return c; }
module.exports = { readAll, save };
