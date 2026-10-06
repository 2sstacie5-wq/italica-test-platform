const appEl = document.getElementById("app");

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("it-IT");
}

async function router() {
  const hash = location.hash.replace(/^#\/?/, "");
  const isLivello = hash === "livello" || hash.startsWith("livello/");
  document.getElementById("navA1").classList.toggle("active", !isLivello);
  document.getElementById("navLivello").classList.toggle("active", isLivello);
  if (hash === "livello") return renderPlacementList();
  if (hash.startsWith("livello/")) return renderPlacementDetail(hash.slice("livello/".length));
  if (!hash) return renderList();
  return renderDetail(hash);
}

// ------------------------------------------------- TEST DI LIVELLO ------
function fmtDuration(sec) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

async function renderPlacementList() {
  appEl.innerHTML = `<div class="card"><h1>Test di livello</h1><p class="muted">Caricamento...</p></div>`;
  const rows = await (await fetch("/api/admin/placement")).json();
  const link = `${location.origin}/livello`;
  const shareHtml = `<div class="share">Link per gli studenti: <a href="${link}" target="_blank">${link}</a></div>`;
  if (rows.length === 0) {
    appEl.innerHTML = `<div class="card"><h1>Test di livello</h1>${shareHtml}<p class="muted">Nessun risultato finora.</p></div>`;
    return;
  }
  appEl.innerHTML = `
    <div class="card">
      <h1>Test di livello (${rows.length})</h1>
      ${shareHtml}
      <table>
        <thead><tr><th>Studente</th><th>Contatto</th><th>Data</th><th>Punti</th><th>Livello</th><th>Tempo</th><th></th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td>${escapeHtml(r.studentName)}</td>
              <td>${escapeHtml(r.contact || "—")}</td>
              <td>${fmtDate(r.submittedAt)}</td>
              <td>${r.score}/${r.maxScore}</td>
              <td><span class="lvl">${r.level}</span>${r.borderline ? ` <span class="badge pending" title="Al confine tra due livelli: consigliato un colloquio orale">confine</span>` : ""}</td>
              <td>${fmtDuration(r.durationSec)}${r.timedOut ? " ⏱" : ""}</td>
              <td><a class="row-link" href="#/livello/${r.id}">Apri &rarr;</a></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

async function renderPlacementDetail(id) {
  appEl.innerHTML = `<p class="muted">Caricamento...</p>`;
  const res = await fetch(`/api/admin/placement/${id}`);
  if (!res.ok) {
    appEl.innerHTML = `<div class="card">Risultato non trovato. <a href="#/livello">Torna alla lista</a></div>`;
    return;
  }
  const { result: r, items } = await res.json();
  const byId = {};
  r.details.forEach((d) => (byId[d.id] = d));
  const L = ["A", "B", "C", "D"];
  appEl.innerHTML = `
    <a class="back-link" href="#/livello">&larr; Tutti i risultati</a>
    <div class="card">
      <h1>${escapeHtml(r.studentName)}</h1>
      <p class="muted">${escapeHtml(r.contact || "")}${r.contact ? " · " : ""}${fmtDate(r.submittedAt)}</p>
      <div class="facts">
        <div class="fact"><b>${r.level}</b>livello</div>
        <div class="fact"><b>${r.score}/${r.maxScore}</b>risposte giuste</div>
        <div class="fact"><b>${fmtDuration(r.durationSec)}</b>${r.timedOut ? "tempo scaduto" : "tempo impiegato"}</div>
      </div>
      ${r.borderline ? `<p class="badge pending" style="margin:0 0 14px">Al confine tra due livelli: consigliato un colloquio orale</p>` : ""}
      <h2>Per livello</h2>
      <div class="lvl-bars">
        ${Object.entries(r.byLevel)
          .map(
            ([lvl, v]) => `<span class="lvl">${lvl}</span>
          <span class="lvl-bar"><i style="width:${v.total ? (100 * v.correct) / v.total : 0}%"></i></span>
          <span>${v.correct}/${v.total}</span>`
          )
          .join("")}
      </div>
    </div>
    <div class="card">
      <h2>Risposte</h2>
      ${items
        .map((it, n) => {
          const d = byId[it.id] || { given: null, ok: false };
          const given = d.given === null ? `<span class="muted">non risposto</span>` : `<span class="${d.ok ? "correct" : "wrong"}">${L[d.given]}) ${escapeHtml(it.options[d.given])}</span>`;
          const right = d.ok ? "" : ` → <span class="correct">${L[it.correct]}) ${escapeHtml(it.options[it.correct])}</span>`;
          return `<div class="qrow"><span class="lvl">${it.level}</span><div class="qtext"><b>${n + 1}.</b> ${escapeHtml(it.text)}<br>${given}${right}</div><span>${d.ok ? "✅" : "❌"}</span></div>`;
        })
        .join("")}
    </div>`;
}
window.addEventListener("hashchange", router);

async function renderList() {
  appEl.innerHTML = `<div class="card"><h1>Consegne studenti</h1><p class="muted">Caricamento...</p></div>`;
  const res = await fetch("/api/admin/submissions");
  const rows = await res.json();

  if (rows.length === 0) {
    appEl.innerHTML = `<div class="card"><h1>Consegne studenti</h1><p class="muted">Nessuna consegna ricevuta finora.</p></div>`;
    return;
  }

  appEl.innerHTML = `
    <div class="card">
      <h1>Consegne studenti (${rows.length})</h1>
      <table>
        <thead>
          <tr><th>Studente</th><th>Data</th><th>Punteggio oggettivo</th><th>Stato</th><th></th></tr>
        </thead>
        <tbody>
          ${rows
            .map((r) => {
              let badge = `<span class="badge pending">Da correggere</span>`;
              if (r.reviewed) {
                badge = r.passed
                  ? `<span class="badge reviewed-pass">Superato — ${r.totalScore}/100</span>`
                  : `<span class="badge reviewed-fail">Non superato — ${r.totalScore}/100</span>`;
              }
              return `
              <tr>
                <td>${escapeHtml(r.studentName)}</td>
                <td>${fmtDate(r.submittedAt)}</td>
                <td>${r.autoScore}/${r.maxAutoScore}</td>
                <td>${badge}</td>
                <td><a class="row-link" href="#/${r.id}">Apri &rarr;</a></td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function renderDetail(id) {
  appEl.innerHTML = `<p class="muted">Caricamento...</p>`;
  const res = await fetch(`/api/admin/submissions/${id}`);
  if (!res.ok) {
    appEl.innerHTML = `<div class="card">Consegna non trovata. <a href="#/">Torna alla lista</a></div>`;
    return;
  }
  const { submission, finalProductionPrompts, p7Items, p7PointsPerQ } = await res.json();

  const overrides = { ...(submission.review.overrides || {}) };

  const detailsByPart = {};
  submission.details.forEach((d) => {
    if (!detailsByPart[d.part]) detailsByPart[d.part] = [];
    detailsByPart[d.part].push(d);
  });

  const objectivePartsHtml = Object.entries(detailsByPart)
    .map(
      ([partName, items]) => `
    <div class="card">
      <h2>${partName}</h2>
      ${items
        .map((d) => {
          const currentPoints = overrides[d.key] !== undefined ? overrides[d.key] : d.points;
          const isWrong = currentPoints < d.max;
          return `
          <div class="qrow">
            <div class="qtext">
              <div>${d.label}</div>
              <div class="muted">Risposta data: <span class="${isWrong ? "wrong" : "given"}">${formatGiven(d.given)}</span>
              ${isWrong ? ` — <span class="correct">corretta: ${formatGiven(d.correctAnswer)}</span>` : ""}</div>
            </div>
            <input type="number" class="points override" data-key="${d.key}" data-max="${d.max}" min="0" max="${d.max}" value="${currentPoints}" />
          </div>`;
        })
        .join("")}
    </div>`
    )
    .join("");

  const p7Html = `
    <div class="card">
      <h2>Parte 7 — Continua la frase (correzione manuale, 0-${p7PointsPerQ} punti per frase)</h2>
      ${p7Items
        .map((item, i) => {
          const given = (submission.p7Pending.find((x) => x.key === `p7-${item.id}`) || {}).given || "";
          const savedScore = submission.review.p7Scores ? submission.review.p7Scores[i] : 0;
          return `
          <div class="p7-item">
            <div class="qtext">${i + 1}. ${item.text}</div>
            <div class="row">
              <textarea readonly rows="2">${escapeHtml(given)}</textarea>
              <input type="number" class="points p7score" data-idx="${i}" min="0" max="${p7PointsPerQ}" value="${savedScore || 0}" />
            </div>
          </div>`;
        })
        .join("")}
    </div>
  `;

  const writtenHtml = `
    <div class="card">
      <h2>Produzione scritta</h2>
      ${finalProductionPrompts.written
        .map(
          (w) => `
        <div class="p7-item">
          <div class="qtext">${w.text}</div>
          <textarea readonly rows="3">${escapeHtml(submission.finalWritten[w.id] || "")}</textarea>
        </div>`
        )
        .join("")}
    </div>
  `;

  const oralHtml = `
    <div class="card">
      <h2>Produzione orale</h2>
      ${finalProductionPrompts.oral
        .map((o) => {
          const hasAudio = submission.audioFiles && submission.audioFiles[o.id];
          return `
        <div class="p7-item">
          <div class="qtext">${o.text}</div>
          ${
            hasAudio
              ? `<audio controls preload="metadata" src="/api/admin/audio/${submission.id}/${o.id}"></audio>
                 <div><a class="muted" href="/api/admin/audio/${submission.id}/${o.id}" download="${escapeHtml(submission.studentName || "studente")}_${o.id}.${(submission.audioFiles[o.id].filename || "").split(".").pop() || "webm"}">⬇ Scarica la registrazione</a></div>`
              : `<p class="muted">Nessuna registrazione ricevuta.</p>`
          }
        </div>`;
        })
        .join("")}
      <div style="margin-top:14px">
        <label class="muted">Giudizio produzione orale/scritta (obbligatorio per il certificato)</label>
        <select id="verdictSelect">
          <option value="">— da valutare —</option>
          <option value="sufficiente" ${submission.review.finalProductionVerdict === "sufficiente" ? "selected" : ""}>Sufficiente</option>
          <option value="insufficiente" ${submission.review.finalProductionVerdict === "insufficiente" ? "selected" : ""}>Insufficiente</option>
        </select>
      </div>
    </div>
  `;

  const notesHtml = `
    <div class="card">
      <h2>Note dell'insegnante</h2>
      <textarea id="notesArea" rows="3" placeholder="Note private, visibili solo qui...">${escapeHtml(submission.review.notes || "")}</textarea>
    </div>
  `;

  const totalHtml = `
    <div class="card total-box">
      ${
        submission.review.reviewed
          ? `<div class="num ${submission.passed ? "pass" : "fail"}">${submission.totalScore} / 100</div>
             <p class="${submission.passed ? "pass" : "fail"}">${submission.passed ? "✅ Certificato A1 — requisito punteggio superato" : "❌ Punteggio insufficiente per il certificato"}</p>
             <p class="muted">Ricorda: serve anche il giudizio "sufficiente" sulla produzione orale/scritta per rilasciare il certificato.</p>`
          : `<p class="muted">Salva la correzione per calcolare il punteggio finale.</p>`
      }
      <button class="btn-primary" id="saveBtn">Salva correzione</button>
    </div>
  `;

  appEl.innerHTML = `
    <a href="#/" class="back-link">&larr; Torna alla lista</a>
    <div class="card">
      <h1>${escapeHtml(submission.studentName)}</h1>
      <p class="muted">Inviato il ${fmtDate(submission.submittedAt)} · Punteggio automatico Parti 1-6: ${submission.autoScore}/${submission.maxAutoScore}</p>
    </div>
    ${objectivePartsHtml}
    ${p7Html}
    ${writtenHtml}
    ${oralHtml}
    ${notesHtml}
    ${totalHtml}
  `;

  document.getElementById("saveBtn").addEventListener("click", () => saveReview(submission.id, p7Items.length));
}

async function saveReview(id, p7Count) {
  const overrides = {};
  document.querySelectorAll("input.override").forEach((inp) => {
    overrides[inp.dataset.key] = Number(inp.value);
  });

  const p7Scores = new Array(p7Count).fill(0);
  document.querySelectorAll("input.p7score").forEach((inp) => {
    p7Scores[Number(inp.dataset.idx)] = Number(inp.value);
  });

  const finalProductionVerdict = document.getElementById("verdictSelect").value || null;
  const notes = document.getElementById("notesArea").value;

  const res = await fetch(`/api/admin/submissions/${id}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides, p7Scores, finalProductionVerdict, notes }),
  });
  if (!res.ok) {
    alert("Errore durante il salvataggio.");
    return;
  }
  renderDetail(id);
}

function formatGiven(v) {
  if (v === undefined || v === null || v === "") return "<em>(nessuna risposta)</em>";
  if (v === true) return "Vero";
  if (v === false) return "Falso";
  return escapeHtml(String(v));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

router();
