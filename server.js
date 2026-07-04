require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const basicAuth = require("express-basic-auth");

const testData = require("./test-data");
const { gradeSubmission } = require("./grading");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme123";

if (!process.env.ADMIN_PASSWORD) {
  console.warn(
    "\n⚠️  ADMIN_PASSWORD non impostata: sto usando la password di default 'changeme123'.\n" +
      "   Imposta ADMIN_USER e ADMIN_PASSWORD in un file .env prima di andare online.\n"
  );
}

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Vista pubblica del test (senza chiave di correzione) ----------
function publicTestView() {
  const clone = JSON.parse(JSON.stringify(testData));
  clone.parts.forEach((part) => {
    if (part.type === "mc") part.items.forEach((i) => delete i.correct);
    if (part.type === "tf") part.items.forEach((i) => delete i.correct);
    if (part.type === "match") delete part.correct;
    if (part.type === "reorder") part.items.forEach((i) => delete i.accepted);
    if (part.type === "fillblank") {
      part.groups.forEach((g) =>
        g.items.forEach((i) => i.blanks.forEach((b) => delete b.accepted))
      );
    }
    if (part.type === "cloze") part.blanks.forEach((b) => delete b.accepted);
  });
  return clone;
}

app.get("/api/test", (req, res) => {
  res.json(publicTestView());
});

// ---------- Upload audio (risposte orali) ----------
const uploadRoot = path.join(store.DATA_DIR, "audio");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.submissionId) req.submissionId = crypto.randomUUID();
    const dir = path.join(uploadRoot, req.submissionId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.fieldname.replace(/[^a-z0-9_]/gi, "");
    cb(null, `${safe}.webm`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const oralFields = testData.finalProduction.oral.map((o) => ({ name: `oral_${o.id}`, maxCount: 1 }));

app.post("/api/submit", upload.fields(oralFields), (req, res) => {
  try {
    const submissionId = req.submissionId || crypto.randomUUID();
    const studentName = (req.body.studentName || "Studente senza nome").trim();
    let answers = {};
    let finalWritten = {};
    try {
      answers = JSON.parse(req.body.answers || "{}");
    } catch (e) {
      return res.status(400).json({ error: "Campo 'answers' non è un JSON valido." });
    }
    try {
      finalWritten = JSON.parse(req.body.finalWritten || "{}");
    } catch (e) {
      return res.status(400).json({ error: "Campo 'finalWritten' non è un JSON valido." });
    }

    const { autoScore, maxAutoScore, details, p7Pending } = gradeSubmission(testData, answers);

    const audioFiles = {};
    testData.finalProduction.oral.forEach((o) => {
      const field = `oral_${o.id}`;
      if (req.files && req.files[field] && req.files[field][0]) {
        audioFiles[o.id] = `${submissionId}/${field}.webm`;
      }
    });

    const submission = {
      id: submissionId,
      studentName,
      submittedAt: new Date().toISOString(),
      answers,
      details,
      finalWritten,
      audioFiles,
      autoScore,
      maxAutoScore,
      p7Pending, // in attesa di correzione manuale (max 10 punti)
      review: {
        reviewed: false,
        p7Scores: null, // array di 5 interi 0-2 assegnati dall'insegnante
        finalProductionVerdict: null, // 'sufficiente' | 'insufficiente'
        overrides: {}, // { detailKey: puntiCorretti } per correggere il punteggio automatico
        notes: "",
      },
      totalScore: null,
      passed: null,
    };

    store.addSubmission(submission);

    res.json({
      submissionId,
      autoScore,
      maxAutoScore,
      message:
        "Consegna ricevuta. Il punteggio delle parti oggettive è provvisorio: il punteggio finale e l'esito del certificato saranno confermati dall'insegnante dopo la correzione della Parte 7 e della Parte finale (orale/scritta).",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore del server durante il salvataggio della consegna." });
  }
});

// ---------- Area insegnante (protetta da password) ----------
const adminAuth = basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASSWORD },
  challenge: true,
  realm: "AdminAreaInsegnante",
});

app.use("/admin", adminAuth, express.static(path.join(__dirname, "admin")));
app.use("/api/admin", adminAuth);

app.get("/api/admin/submissions", (req, res) => {
  const all = store.readAll().map((s) => ({
    id: s.id,
    studentName: s.studentName,
    submittedAt: s.submittedAt,
    autoScore: s.autoScore,
    maxAutoScore: s.maxAutoScore,
    reviewed: s.review.reviewed,
    totalScore: s.totalScore,
    passed: s.passed,
  }));
  all.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json(all);
});

app.get("/api/admin/submissions/:id", (req, res) => {
  const sub = store.getSubmission(req.params.id);
  if (!sub) return res.status(404).json({ error: "Consegna non trovata." });
  res.json({
    submission: sub,
    finalProductionPrompts: testData.finalProduction,
    p7Items: testData.parts.find((p) => p.id === "p7").items,
    p7PointsPerQ: testData.parts.find((p) => p.id === "p7").pointsPerQ,
    meta: testData.meta,
  });
});

app.get("/api/admin/audio/:id/:field", (req, res) => {
  const filePath = path.join(uploadRoot, req.params.id, `${req.params.field}.webm`);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

app.post("/api/admin/submissions/:id/review", (req, res) => {
  const sub = store.getSubmission(req.params.id);
  if (!sub) return res.status(404).json({ error: "Consegna non trovata." });

  const { p7Scores, finalProductionVerdict, overrides, notes } = req.body;

  const p7PointsPerQ = testData.parts.find((p) => p.id === "p7").pointsPerQ;
  const cleanP7 = Array.isArray(p7Scores)
    ? p7Scores.map((v) => Math.max(0, Math.min(p7PointsPerQ, Number(v) || 0)))
    : sub.review.p7Scores || [0, 0, 0, 0, 0];
  const p7Total = cleanP7.reduce((a, b) => a + b, 0);

  const cleanOverrides = overrides && typeof overrides === "object" ? overrides : sub.review.overrides || {};

  // Ricalcola il punteggio delle parti 1-6 applicando eventuali correzioni manuali (override)
  let objectiveScore = 0;
  sub.details.forEach((d) => {
    objectiveScore += cleanOverrides[d.key] !== undefined ? Number(cleanOverrides[d.key]) : d.points;
  });

  const totalScore = objectiveScore + p7Total;
  const passed = totalScore >= testData.meta.passPercent; // passPercent è anche il punteggio minimo su 100

  const updated = store.updateSubmission(sub.id, {
    review: {
      reviewed: true,
      p7Scores: cleanP7,
      finalProductionVerdict: finalProductionVerdict || sub.review.finalProductionVerdict,
      overrides: cleanOverrides,
      notes: notes !== undefined ? notes : sub.review.notes,
    },
    totalScore,
    passed,
  });

  res.json({ ok: true, submission: updated });
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  console.log(`Pannello insegnante su http://localhost:${PORT}/admin  (utente: ${ADMIN_USER})`);
});
