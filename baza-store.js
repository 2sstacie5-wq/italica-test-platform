// Доступ викладачів до внутрішньої бази (/baza): один спільний логін і пароль.
// Коли викладач іде з Італіки, адмін змінює пароль у /admin/baza —
// усі старі входи одразу стають недійсними.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "baza-config.json");
const SECRET_FILE = path.join(DATA_DIR, "baza-secret");

// Початкові дані (у репозиторії зберігається лише хеш пароля, не сам пароль).
const DEFAULT = {
  user: "italica.team",
  salt: "2c460c4784b767391daeade2cb0c1b34",
  hash: "4ea86bc92df771b3687420c543d480a5b1b527ce5755d5131991a11f91b9751e",
  version: 1,
  changedAt: null,
};

function ensure() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
function config() {
  ensure();
  try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch (e) { return { ...DEFAULT }; }
}
function save(cfg) { ensure(); fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), "utf8"); }

let secret = null;
function getSecret() {
  if (secret) return secret;
  ensure();
  if (process.env.BAZA_SECRET) return (secret = process.env.BAZA_SECRET);
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"), "utf8");
  return (secret = fs.readFileSync(SECRET_FILE, "utf8").trim());
}

const hashOf = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString("hex");
function eq(a, b) { const A = Buffer.from(a), B = Buffer.from(b); return A.length === B.length && crypto.timingSafeEqual(A, B); }

function check(user, pw) {
  const c = config();
  return String(user || "").trim().toLowerCase() === c.user.toLowerCase() && eq(hashOf(pw, c.salt), c.hash);
}
function setCredentials(user, pw) {
  const c = config();
  const salt = crypto.randomBytes(16).toString("hex");
  const next = { user: String(user).trim(), salt, hash: hashOf(pw, salt), version: (c.version || 1) + 1, changedAt: new Date().toISOString() };
  save(next); return next;
}
function sign() {
  const v = String(config().version || 1);
  return `${v}.${crypto.createHmac("sha256", getSecret()).update("baza." + v).digest("base64url")}`;
}
function verify(token) {
  const [v, mac] = String(token || "").split(".");
  if (!v || !mac || v !== String(config().version || 1)) return false;
  return eq(mac, crypto.createHmac("sha256", getSecret()).update("baza." + v).digest("base64url"));
}
function info() { const c = config(); return { user: c.user, changedAt: c.changedAt, version: c.version }; }

module.exports = { check, setCredentials, sign, verify, info };
