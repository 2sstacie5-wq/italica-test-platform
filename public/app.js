// App lato studente: nessuna libreria esterna, solo DOM + fetch + MediaRecorder.

const appEl = document.getElementById("app");
const progressFill = document.getElementById("progressFill");
const timerBadge = document.getElementById("timerBadge");

const state = {
  test: null,
  studentName: "",
  step: "start", // start | part:<index> | written | oral | done
  answers: { p1: {}, p2: {}, p3: {}, p4: {}, p5: {}, p6: {}, p7: {} },
  finalWritten: { w1: "", w2: "", w3: "" },
  audioBlobs: {}, // { o1: Blob, o2: Blob, o3: Blob }
  timer: null,
  writtenTimerStarted: false, // timer unico per tutta la parte scritta (Parti 1-7)
  submitting: false,
  result: null,
};

// Ordine dei passi: 7 parti scritte -> produzione scritta -> produzione orale -> invio
function totalSteps() {
  return state.test.parts.length + 2;
}
function stepIndexForPart(i) { return i; }

async function init() {
  try {
    const res = await fetch("/api/test");
    state.test = await res.json();
  } catch (e) {
    appEl.innerHTML = `<div class="error-banner">Impossibile caricare il test. Ricarica la pagina.</div>`;
    return;
  }
  renderStart();
}

function setProgress(fraction) {
  progressFill.style.width = `${Math.min(100, Math.max(0, fraction * 100))}%`;
}

function clearTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  timerBadge.hidden = true;
  timerBadge.classList.remove("warn");
}

function startTimer(minutes, onExpire) {
  clearTimer();
  let secondsLeft = Math.round(minutes * 60);
  timerBadge.hidden = false;
  const tick = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    timerBadge.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`;
    timerBadge.classList.toggle("warn", secondsLeft <= 30);
    if (secondsLeft <= 0) {
      clearTimer();
      onExpire();
      return;
    }
    secondsLeft -= 1;
  };
  tick();
  state.timer = setInterval(tick, 1000);
}

// ---------------------------------------------------------------- START ----
function renderStart() {
  clearTimer();
  setProgress(0);
  appEl.innerHTML = `
    <div class="card">
      <h1>🇮🇹 Test LIVELLO A1</h1>
      <p class="lead">Ciao ciao!</p>
      <p class="lead">Простір <strong>italica</strong> вітає тебе на фінальному тестуванні курсу A1!</p>
      <p class="lead">
        Перш за все — видихни 😌 Це не іспит, який має тебе злякати, а шанс подивитися на себе
        збоку і зрозуміти, скільки всього ти вже вмієш. Згадай свій перший урок: тоді навіть
        "Come ti chiami?" здавалося космічною фізикою, а зараз ти читаєш, слухаєш, говориш і
        будуєш речення італійською. Це реально крутий шлях, і ти вже на фініші!
      </p>
      <p class="lead"><strong>Як проходитиме тест?</strong></p>
      <p class="lead">Він складається з 7 частин і займе приблизно ${state.test.meta.writtenDurationMin} хвилин.</p>
      <p class="lead">
        Далі на тебе чекають ще дві частини: письмова — де треба самостійно написати текст, і
        усна — де треба записати голосову відповідь. Перед початком сайт попросить дозвіл на
        мікрофон, це нормально, нічого страшного 🎙️
      </p>
      <p class="lead">Читай завдання уважно, подумай над відповіддю — і тільки тоді рухайся далі. Поспіх тут не потрібен.</p>
      <p class="lead"><strong>Перед початком:</strong></p>
      <div style="background:#fbe8de; border-radius:10px; padding:14px 16px; color:#b23a17;">
        знайди спокійне місце, де тебе ніхто не смикатиме;<br />
        переконайся, що інтернет не підведе в найважливіший момент;<br />
        видихни ще раз — ти знаєш набагато більше, ніж тобі здається.
      </div>
      <p class="lead">
        ❤️ Ми віримо в тебе! Не переживай через окремі запитання — цей тест не про ідеальність,
        а про твій прогрес. А прогрес у тебе є, і чималий.
      </p>
      <p class="lead"><em>In bocca al lupo!</em> 🇮🇹</p>
      <div class="field">
        <label for="studentName">Ім'я та прізвище</label>
        <input type="text" id="studentName" placeholder="Напр. Ганна Ковальська" />
      </div>
      <div class="actions end">
        <button class="btn-primary" id="startBtn">Почати тест</button>
      </div>
    </div>
  `;
  document.getElementById("startBtn").addEventListener("click", () => {
    const name = document.getElementById("studentName").value.trim();
    if (!name) {
      alert("Будь ласка, напиши своє ім'я та прізвище перед початком.");
      return;
    }
    state.studentName = name;
    renderPart(0);
  });
}

// ---------------------------------------------------------------- PARTS ----
function renderPart(index) {
  state.step = `part:${index}`;
  const part = state.test.parts[index];
  setProgress(index / totalSteps());

  let bodyHtml = "";
  if (part.type === "mc") bodyHtml = renderMC(part);
  else if (part.type === "tf") bodyHtml = renderTF(part);
  else if (part.type === "match") bodyHtml = renderMatch(part);
  else if (part.type === "reorder") bodyHtml = renderReorder(part);
  else if (part.type === "fillblank") bodyHtml = renderFillblank(part);
  else if (part.type === "cloze") bodyHtml = renderCloze(part);
  else if (part.type === "open") bodyHtml = renderOpen(part);

  appEl.innerHTML = `
    <div class="card">
      <h2>${part.title}</h2>
      <p class="hint">Parte ${index + 1} di ${state.test.parts.length} (parte scritta)</p>
      ${bodyHtml}
      <div class="actions">
        <button class="btn-secondary" id="backBtn" ${index === 0 ? "disabled" : ""}>&larr; Indietro</button>
        <button class="btn-primary" id="nextBtn">Avanti &rarr;</button>
      </div>
    </div>
  `;

  attachPartHandlers(part);

  document.getElementById("nextBtn").addEventListener("click", () => goToNextPart(index));
  document.getElementById("backBtn").addEventListener("click", () => {
    if (index > 0) renderPart(index - 1);
  });

  // Un unico timer per tutta la parte scritta (Parti 1-7): parte una sola volta
  // all'inizio e continua a scorrere mentre lo studente passa da una parte
  // all'altra (avanti o indietro), invece di ripartire ogni volta da zero.
  if (!state.writtenTimerStarted) {
    state.writtenTimerStarted = true;
    startTimer(state.test.meta.writtenDurationMin, () => {
      alert("Il tempo per la parte scritta è terminato. Si passa alla produzione scritta.");
      renderWritten();
    });
  }
}

function goToNextPart(index) {
  if (index + 1 < state.test.parts.length) renderPart(index + 1);
  else renderWritten();
}

function renderMC(part) {
  let html = `<div>`;
  let lastGroup = null;
  part.items.forEach((item, i) => {
    if (item.group && item.group !== lastGroup) {
      html += `<div class="qgroup-label">${item.group}</div>`;
      lastGroup = item.group;
    }
    html += `<div class="question" data-qid="${item.id}">
      <div class="qtext"><span class="qnum">${i + 1}.</span>${item.text}</div>
      <div class="options">
        ${Object.entries(item.options)
          .map(
            ([key, text]) => `
          <label class="option">
            <input type="radio" name="mc-${item.id}" value="${key}" />
            <span><strong>${key})</strong> ${text}</span>
          </label>`
          )
          .join("")}
      </div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

function renderTF(part) {
  return part.items
    .map(
      (item, i) => `
    <div class="question" data-qid="${item.id}">
      <div class="qtext"><span class="qnum">${i + 1}.</span>${item.text}</div>
      <div class="tf-row">
        <label class="option"><input type="radio" name="tf-${item.id}" value="true" /> Vero</label>
        <label class="option"><input type="radio" name="tf-${item.id}" value="false" /> Falso</label>
      </div>
    </div>`
    )
    .join("");
}

function renderMatch(part) {
  const optionEntries = Object.entries(part.options);
  return part.prompts
    .map(
      (prompt, i) => `
    <div class="question" data-qid="${prompt.id}">
      <div class="qtext"><span class="qnum">${i + 1}.</span>${prompt.text}</div>
      <select name="match-${prompt.id}">
        <option value="">— scegli la risposta —</option>
        ${optionEntries.map(([key, text]) => `<option value="${key}">${key}) ${text}</option>`).join("")}
      </select>
    </div>`
    )
    .join("");
}

function renderReorder(part) {
  return part.items
    .map(
      (item, i) => `
    <div class="question" data-qid="${item.id}">
      <div class="qtext"><span class="qnum">${i + 1}.</span> Riordina le parole:</div>
      <div class="words-hint">${item.words}</div>
      <input type="text" name="reorder-${item.id}" placeholder="Scrivi la frase completa..." />
    </div>`
    )
    .join("");
}

function renderFillblank(part) {
  return part.groups
    .map((group) => {
      const itemsHtml = group.items
        .map((item, i) => {
          let blankIdx = 0;
          const text = item.text.replace(/___/g, () => {
            const key = `${group.id}-${item.id}-${blankIdx}`;
            blankIdx += 1;
            return `<input type="text" class="inline-blank" name="fb-${key}" />`;
          });
          return `<div class="question" data-qid="${item.id}"><div class="qtext fillblank-text"><span class="qnum">${i + 1}.</span>${text}</div></div>`;
        })
        .join("");
      return `<div class="qgroup-label">${group.title}</div>${itemsHtml}`;
    })
    .join("");
}

function renderCloze(part) {
  const html = part.template.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    return `<input type="text" class="inline-blank" name="cloze-${n}" style="width:110px" />`;
  });
  return `<div class="cloze-text">${html}</div>`;
}

function renderOpen(part) {
  return `
    <p class="hint">${part.instructions || ""}</p>
    ${part.items
      .map(
        (item, i) => `
      <div class="question" data-qid="${item.id}">
        <div class="qtext"><span class="qnum">${i + 1}.</span>${item.text}</div>
        <textarea name="open-${item.id}" placeholder="Scrivi qui la tua risposta..."></textarea>
      </div>`
      )
      .join("")}
  `;
}

function attachPartHandlers(part) {
  // Ripristina eventuali risposte già date tornando indietro
  if (part.type === "mc") {
    part.items.forEach((item) => {
      const saved = state.answers.p1[item.id];
      if (saved) {
        const input = document.querySelector(`input[name="mc-${item.id}"][value="${saved}"]`);
        if (input) input.checked = true;
      }
      document.querySelectorAll(`input[name="mc-${item.id}"]`).forEach((inp) =>
        inp.addEventListener("change", (e) => {
          state.answers.p1[item.id] = e.target.value;
          refreshSelectedStyles();
        })
      );
    });
  } else if (part.type === "tf") {
    part.items.forEach((item) => {
      const saved = state.answers.p2[item.id];
      if (saved !== undefined) {
        const input = document.querySelector(`input[name="tf-${item.id}"][value="${saved}"]`);
        if (input) input.checked = true;
      }
      document.querySelectorAll(`input[name="tf-${item.id}"]`).forEach((inp) =>
        inp.addEventListener("change", (e) => {
          state.answers.p2[item.id] = e.target.value === "true";
          refreshSelectedStyles();
        })
      );
    });
  } else if (part.type === "match") {
    part.prompts.forEach((prompt) => {
      const el = document.querySelector(`select[name="match-${prompt.id}"]`);
      const saved = state.answers.p3[prompt.id];
      if (saved) el.value = saved;
      el.addEventListener("change", (e) => {
        state.answers.p3[prompt.id] = e.target.value;
      });
    });
  } else if (part.type === "reorder") {
    part.items.forEach((item) => {
      const el = document.querySelector(`input[name="reorder-${item.id}"]`);
      el.value = state.answers.p4[item.id] || "";
      el.addEventListener("input", (e) => {
        state.answers.p4[item.id] = e.target.value;
      });
    });
  } else if (part.type === "fillblank") {
    part.groups.forEach((group) => {
      group.items.forEach((item) => {
        item.blanks.forEach((_, idx) => {
          const key = `${group.id}-${item.id}-${idx}`;
          const el = document.querySelector(`input[name="fb-${key}"]`);
          el.value = state.answers.p5[key] || "";
          el.addEventListener("input", (e) => {
            state.answers.p5[key] = e.target.value;
          });
        });
      });
    });
  } else if (part.type === "cloze") {
    part.blanks.forEach((blank) => {
      const el = document.querySelector(`input[name="cloze-${blank.id}"]`);
      el.value = state.answers.p6[blank.id] || "";
      el.addEventListener("input", (e) => {
        state.answers.p6[blank.id] = e.target.value;
      });
    });
  } else if (part.type === "open") {
    part.items.forEach((item) => {
      const el = document.querySelector(`textarea[name="open-${item.id}"]`);
      el.value = state.answers.p7[item.id] || "";
      el.addEventListener("input", (e) => {
        state.answers.p7[item.id] = e.target.value;
      });
    });
  }
  refreshSelectedStyles();
}

function refreshSelectedStyles() {
  document.querySelectorAll(".option").forEach((label) => {
    const input = label.querySelector("input");
    if (input) label.classList.toggle("selected", input.checked);
  });
}

// ---------------------------------------------------------- WRITTEN PROD ----
function renderWritten() {
  state.step = "written";
  clearTimer();
  setProgress(state.test.parts.length / totalSteps());
  const prompts = state.test.finalProduction.written;
  const instructions = state.test.finalProduction.writtenInstructions || "";
  appEl.innerHTML = `
    <div class="card">
      <h2>Produzione scritta</h2>
      <p class="hint">Non cronometrata. Scrivi almeno 6-8 frasi per ogni punto.</p>
      ${instructions ? `<p class="hint" style="color:#c0392b; font-weight:600;">${instructions}</p>` : ""}
      ${prompts
        .map(
          (p, i) => `
        <div class="question">
          <div class="qtext"><span class="qnum">${i + 1}.</span>${p.text}</div>
          <textarea name="written-${p.id}" rows="4" placeholder="Scrivi qui..."></textarea>
        </div>`
        )
        .join("")}
      <div class="actions">
        <button class="btn-secondary" id="backBtn">&larr; Indietro</button>
        <button class="btn-primary" id="nextBtn">Avanti &rarr;</button>
      </div>
    </div>
  `;
  prompts.forEach((p) => {
    const el = document.querySelector(`textarea[name="written-${p.id}"]`);
    el.value = state.finalWritten[p.id] || "";
    el.addEventListener("input", (e) => {
      state.finalWritten[p.id] = e.target.value;
    });
  });
  document.getElementById("backBtn").addEventListener("click", () => renderPart(state.test.parts.length - 1));
  document.getElementById("nextBtn").addEventListener("click", () => renderOral());
}

// ----------------------------------------------------------- ORAL PROD -----
let activeStream = null;
let activeRecorder = null;

function renderOral() {
  state.step = "oral";
  clearTimer();
  setProgress((state.test.parts.length + 1) / totalSteps());
  const prompts = state.test.finalProduction.oral;
  appEl.innerHTML = `
    <div class="card">
      <h2>Produzione orale</h2>
      <p class="hint">
        Premi "Registra", parla in italiano (6-8 frasi), poi premi "Ferma". Puoi riascoltare e
        rifare la registrazione quante volte vuoi prima di continuare. Il browser chiederà il
        permesso di usare il microfono.
      </p>
      <p class="hint" style="color:#c0392b; font-weight:600;">Registra tutte e 3 le risposte, una per ogni argomento.</p>
      ${prompts
        .map(
          (p, i) => `
        <div class="question">
          <div class="qtext"><span class="qnum">${i + 1}.</span>${p.text}</div>
          <div class="record-box" id="recbox-${p.id}">
            <div class="record-controls">
              <button class="btn-primary" data-action="record" data-oid="${p.id}">🎙️ Registra</button>
              <button class="btn-danger" data-action="stop" data-oid="${p.id}" disabled>⏹ Ferma</button>
            </div>
            <div id="status-${p.id}"></div>
            <div id="player-${p.id}"></div>
          </div>
        </div>`
        )
        .join("")}
      <div class="actions">
        <button class="btn-secondary" id="backBtn">&larr; Indietro</button>
        <button class="btn-primary" id="submitBtn">Invia il test</button>
      </div>
    </div>
  `;

  prompts.forEach((p) => {
    if (state.audioBlobs[p.id]) showPlayer(p.id, state.audioBlobs[p.id]);
    document
      .querySelector(`button[data-action="record"][data-oid="${p.id}"]`)
      .addEventListener("click", () => startRecording(p.id));
    document
      .querySelector(`button[data-action="stop"][data-oid="${p.id}"]`)
      .addEventListener("click", () => stopRecording(p.id));
  });

  document.getElementById("backBtn").addEventListener("click", () => renderWritten());
  document.getElementById("submitBtn").addEventListener("click", submitTest);
}

// Safari registra in un formato diverso da Chrome/Firefox (spesso mp4/aac invece di
// webm/opus). Se etichettiamo il blob con un tipo sbagliato, l'audio non si riproduce
// per niente (anche se i byte sono corretti). Qui rileviamo il formato realmente
// supportato dal browser prima di iniziare la registrazione.
function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
  ];
  if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
  }
  return ""; // lascia scegliere il browser (fallback)
}

async function startRecording(oid) {
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert("Non riesco ad accedere al microfono. Controlla i permessi del browser.");
    return;
  }
  const chunks = [];
  const preferredType = pickMimeType();
  activeRecorder = preferredType ? new MediaRecorder(activeStream, { mimeType: preferredType }) : new MediaRecorder(activeStream);
  const actualMimeType = activeRecorder.mimeType || preferredType || "audio/webm";
  activeRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  activeRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: actualMimeType });
    state.audioBlobs[oid] = blob;
    showPlayer(oid, blob);
    activeStream.getTracks().forEach((t) => t.stop());
  };
  activeRecorder.start();
  document.getElementById(`status-${oid}`).innerHTML = `<p class="hint"><span class="rec-dot"></span>Registrazione in corso...</p>`;
  document.querySelector(`button[data-action="record"][data-oid="${oid}"]`).disabled = true;
  document.querySelector(`button[data-action="stop"][data-oid="${oid}"]`).disabled = false;
}

function stopRecording(oid) {
  if (activeRecorder && activeRecorder.state !== "inactive") activeRecorder.stop();
  document.getElementById(`status-${oid}`).innerHTML = "";
  document.querySelector(`button[data-action="record"][data-oid="${oid}"]`).disabled = false;
  document.querySelector(`button[data-action="stop"][data-oid="${oid}"]`).disabled = true;
}

function showPlayer(oid, blob) {
  const url = URL.createObjectURL(blob);
  document.getElementById(`player-${oid}`).innerHTML = `
    <audio controls src="${url}"></audio>
    <p class="hint">Registrazione salvata. Premi di nuovo "Registra" se vuoi rifarla.</p>
  `;
  document.querySelector(`button[data-action="record"][data-oid="${oid}"]`).textContent = "🎙️ Rifai la registrazione";
}

// --------------------------------------------------------------- SUBMIT ----
async function submitTest() {
  if (state.submitting) return;

  const missingAudio = state.test.finalProduction.oral.filter((p) => !state.audioBlobs[p.id]);
  if (missingAudio.length > 0) {
    const ok = confirm(
      `Mancano ${missingAudio.length} registrazioni orali. Vuoi inviare comunque il test senza queste risposte?`
    );
    if (!ok) return;
  }

  state.submitting = true;
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Invio in corso...";
  }

  const formData = new FormData();
  formData.append("studentName", state.studentName);
  formData.append("answers", JSON.stringify(state.answers));
  formData.append("finalWritten", JSON.stringify(state.finalWritten));
  Object.entries(state.audioBlobs).forEach(([oid, blob]) => {
    const ext = extFromMimeType(blob.type);
    formData.append(`oral_${oid}`, blob, `${oid}.${ext}`);
  });

  try {
    const res = await fetch("/api/submit", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
    state.result = data;
    renderDone();
  } catch (e) {
    alert("Errore durante l'invio del test: " + e.message + "\nRiprova, i tuoi dati non sono andati persi.");
    state.submitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Invia il test";
    }
  }
}

function renderDone() {
  clearTimer();
  setProgress(1);
  const { autoScore, maxAutoScore } = state.result;
  appEl.innerHTML = `
    <div class="card">
      <h2>Grazie, ${escapeHtml(state.studentName)}!</h2>
      <p class="lead">Il test è stato inviato con successo.</p>
      <p class="hint">Punteggio provvisorio (Parti 1–6, oggettive):</p>
      <div class="score-big">${autoScore} / ${maxAutoScore}</div>
      <p class="hint" style="margin-top:14px">
        <span class="badge-pending">In attesa di correzione</span>
        La Parte 7 e la Parte finale (produzione orale e scritta) vengono valutate
        dall'insegnante. Il punteggio finale su 100 e l'esito per il certificato A1
        saranno confermati dopo questa correzione.
      </p>
    </div>
  `;
}

function extFromMimeType(mime) {
  if (!mime) return "webm";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("aac")) return "aac";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
