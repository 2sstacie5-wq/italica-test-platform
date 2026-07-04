// Logica di normalizzazione e correzione automatica delle parti oggettive (Parte 1-6).
// La Parte 7 e la Parte finale (orale/scritta) restano sempre a valutazione manuale
// dell'insegnante nel pannello admin: l'insegnante può anche correggere/sovrascrivere
// qualsiasi punteggio automatico, quindi questa correzione è pensata per essere
// generosa (case/accenti/punteggiatura non contano) piuttosto che perfetta.

function normalize(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove accenti per un confronto più tollerante
    .replace(/[’']/g, "'")
    .replace(/[.,;:!?"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAccepted(value, accepted) {
  const n = normalize(value);
  if (!n) return false;
  return accepted.some((a) => normalize(a) === n);
}

// Restituisce { autoScore, maxAutoScore, details } dove details è un array piatto
// di { key, label, points, max, correct } utile sia per il riepilogo studente
// sia per la vista dettagliata dell'admin.
function gradeSubmission(testData, answers) {
  const details = [];
  let autoScore = 0;
  let maxAutoScore = 0;

  const p1 = testData.parts.find((p) => p.id === "p1");
  const a1 = (answers && answers.p1) || {};
  p1.items.forEach((item) => {
    const given = a1[item.id];
    const ok = given === item.correct;
    if (ok) autoScore += p1.pointsPerQ;
    maxAutoScore += p1.pointsPerQ;
    details.push({ key: `p1-${item.id}`, part: "Parte 1", label: item.text, given, correctAnswer: item.correct, points: ok ? p1.pointsPerQ : 0, max: p1.pointsPerQ });
  });

  const p2 = testData.parts.find((p) => p.id === "p2");
  const a2 = (answers && answers.p2) || {};
  p2.items.forEach((item) => {
    const given = a2[item.id];
    const ok = given === item.correct;
    if (ok) autoScore += p2.pointsPerQ;
    maxAutoScore += p2.pointsPerQ;
    details.push({ key: `p2-${item.id}`, part: "Parte 2", label: item.text, given, correctAnswer: item.correct, points: ok ? p2.pointsPerQ : 0, max: p2.pointsPerQ });
  });

  const p3 = testData.parts.find((p) => p.id === "p3");
  const a3 = (answers && answers.p3) || {};
  p3.prompts.forEach((prompt) => {
    const given = a3[prompt.id];
    const correct = p3.correct[prompt.id];
    const ok = given === correct;
    if (ok) autoScore += p3.pointsPerQ;
    maxAutoScore += p3.pointsPerQ;
    details.push({ key: `p3-${prompt.id}`, part: "Parte 3", label: prompt.text, given, correctAnswer: correct, points: ok ? p3.pointsPerQ : 0, max: p3.pointsPerQ });
  });

  const p4 = testData.parts.find((p) => p.id === "p4");
  const a4 = (answers && answers.p4) || {};
  p4.items.forEach((item) => {
    const given = a4[item.id];
    const ok = matchesAccepted(given, item.accepted);
    if (ok) autoScore += p4.pointsPerQ;
    maxAutoScore += p4.pointsPerQ;
    details.push({ key: `p4-${item.id}`, part: "Parte 4", label: item.words, given, correctAnswer: item.accepted[0], points: ok ? p4.pointsPerQ : 0, max: p4.pointsPerQ });
  });

  const p5 = testData.parts.find((p) => p.id === "p5");
  const a5 = (answers && answers.p5) || {};
  p5.groups.forEach((group) => {
    group.items.forEach((item) => {
      item.blanks.forEach((blank, idx) => {
        const key = `${group.id}-${item.id}-${idx}`;
        const given = a5[key];
        const ok = matchesAccepted(given, blank.accepted);
        if (ok) autoScore += p5.pointsPerBlank;
        maxAutoScore += p5.pointsPerBlank;
        details.push({ key: `p5-${key}`, part: `Parte 5 (${group.id})`, label: item.text, given, correctAnswer: blank.accepted[0], points: ok ? p5.pointsPerBlank : 0, max: p5.pointsPerBlank });
      });
    });
  });

  const p6 = testData.parts.find((p) => p.id === "p6");
  const a6 = (answers && answers.p6) || {};
  p6.blanks.forEach((blank) => {
    const given = a6[blank.id];
    const ok = matchesAccepted(given, blank.accepted);
    if (ok) autoScore += p6.pointsPerBlank;
    maxAutoScore += p6.pointsPerBlank;
    details.push({ key: `p6-${blank.id}`, part: "Parte 6", label: `Spazio ${blank.id}`, given, correctAnswer: blank.accepted[0], points: ok ? p6.pointsPerBlank : 0, max: p6.pointsPerBlank });
  });

  // Parte 7: registrata ma NON inclusa in autoScore/maxAutoScore -> valutazione manuale obbligatoria
  const p7 = testData.parts.find((p) => p.id === "p7");
  const a7 = (answers && answers.p7) || {};
  const p7Pending = p7.items.map((item) => ({ key: `p7-${item.id}`, part: "Parte 7", label: item.text, given: a7[item.id] || "", max: p7.pointsPerQ }));

  return { autoScore, maxAutoScore, details, p7Pending };
}

module.exports = { normalize, matchesAccepted, gradeSubmission };
