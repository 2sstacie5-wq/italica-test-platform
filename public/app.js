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
      <h1 style="color:#d9491f;">🇮🇹 Test di LIVELLO A1</h1>
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
      <p class="lead"><strong>Перед початком</strong></p>
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

  document.getElementById("backBtn").addEventListener("click", () => {
    cancelActiveRecording();
    renderWritten();
  });
  document.getElementById("submitBtn").addEventListener("click", submitTest);
}

// Registrazione compatibile con tutti i dispositivi (iPhone, Android, Windows, Mac).
// Registriamo in WAV (PCM 16 bit, mono, 16 kHz) tramite Web Audio API: il WAV si
// riproduce in QUALSIASI browser, quindi l'insegnante può ascoltare le risposte
// sia da Safari sul Mac/iPhone sia da Chrome su Windows/Android (il webm registrato
// da Chrome invece non si apre in Safari). 16 kHz mono = ~2 MB al minuto.
// Se il Web Audio non è disponibile si ripiega su MediaRecorder.
const WAV_SAMPLE_RATE = 16000;
const MAX_RECORDING_SEC = 5 * 60;
let activeRec = null; // { oid, stop(): Promise<Blob>, cancel(), timer }

function micErrorMessage(err) {
  const ua = navigator.userAgent || "";
  const inApp = /Instagram|FBAN|FBAV|Telegram|Viber|WhatsApp|Line\/|; wv\)/i.test(ua);
  if (!window.isSecureContext) {
    return "Il microfono funziona solo su una pagina sicura (https://). Apri il link del test che inizia con https://.";
  }
  if (inApp || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "Questo browser non permette di usare il microfono.\n\nApri il link del test in Safari (iPhone/iPad/Mac) oppure in Chrome (Android/Windows), non dentro Instagram, Telegram, Viber o simili.";
  }
  const name = err && err.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Hai negato il permesso del microfono.\n\n" +
      "• iPhone/iPad: Impostazioni → Safari → Microfono → Consenti, poi ricarica la pagina.\n" +
      "• Android/Chrome: tocca il lucchetto accanto all'indirizzo → Autorizzazioni → Microfono → Consenti.\n" +
      "• Mac: Impostazioni di Sistema → Privacy e sicurezza → Microfono → attiva il browser.\n" +
      "• Windows: Impostazioni → Privacy → Microfono → consenti alle app desktop, e nel browser clicca il lucchetto → Microfono → Consenti.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "Nessun microfono trovato. Collega un microfono o delle cuffie con microfono e riprova.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "Il microfono è usato da un'altra applicazione (Zoom, Teams, Skype...). Chiudila e riprova.";
  }
  return "Non riesco ad accedere al microfono. Controlla i permessi del browser e riprova.";
}

function encodeWav(chunks, inputRate, outRate) {
  let length = 0;
  chunks.forEach((c) => (length += c.length));
  const input = new Float32Array(length);
  let off = 0;
  chunks.forEach((c) => { input.set(c, off); off += c.length; });
  // ricampionamento con media semplice (anti-aliasing di base)
  const ratio = inputRate / outRate;
  const outLen = Math.floor(input.length / ratio);
  const samples = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s0 = Math.floor(i * ratio);
    const s1 = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0, n = 0;
    for (let j = s0; j < s1; j++) { sum += input[j]; n++; }
    let v = n ? sum / n : input[s0] || 0;
    v = Math.max(-1, Math.min(1, v));
    samples[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o, str) => { for (let i = 0; i < str.length; i++) view.setUint8(o + i, str.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, outRate, true);
  view.setUint32(28, outRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return new Blob([buffer], { type: "audio/wav" });
}

// Registratore WAV con Web Audio. L'AudioContext viene creato SUBITO nel click
// (necessario su iPhone/Safari), prima di chiedere il microfono.
async function createWavRecorder() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error("no-webaudio");
  const ctx = new Ctx();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (e) {
    ctx.close && ctx.close();
    throw e;
  }
  if (ctx.state === "suspended") await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  proc.onaudioprocess = (e) => {
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    // uscita silenziosa: niente eco nelle casse
    const out = e.outputBuffer.getChannelData(0);
    out.fill(0);
  };
  source.connect(proc);
  proc.connect(ctx.destination);
  const release = () => {
    try { proc.disconnect(); source.disconnect(); } catch (_) {}
    stream.getTracks().forEach((t) => t.stop());
    ctx.close && ctx.close();
  };
  return {
    async stop() {
      release();
      if (!chunks.length) throw new Error("empty");
      return encodeWav(chunks, ctx.sampleRate, WAV_SAMPLE_RATE);
    },
    cancel: release,
  };
}

// Ripiego: MediaRecorder (formato scelto dal browser).
function pickMimeType() {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/aac", "audio/ogg;codecs=opus"];
  if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
    for (const type of candidates) if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

async function createMediaRecorder() {
  if (!window.MediaRecorder) throw new Error("no-recorder");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const type = pickMimeType();
  const rec = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
  rec.start(1000);
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    stop() {
      return new Promise((resolve, reject) => {
        rec.onstop = () => {
          release();
          if (!chunks.length) return reject(new Error("empty"));
          resolve(new Blob(chunks, { type: rec.mimeType || type || "audio/webm" }));
        };
        rec.state !== "inactive" ? rec.stop() : rec.onstop();
      });
    },
    cancel() { try { rec.stop(); } catch (_) {} release(); },
  };
}

function setRecordButtons(recordingOid) {
  document.querySelectorAll('button[data-action="record"]').forEach((b) => (b.disabled = !!recordingOid));
  document.querySelectorAll('button[data-action="stop"]').forEach((b) => (b.disabled = b.dataset.oid !== recordingOid));
}

async function startRecording(oid) {
  if (activeRec) return;
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert(micErrorMessage(null));
    return;
  }
  setRecordButtons(oid);
  const statusEl = document.getElementById(`status-${oid}`);
  statusEl.innerHTML = `<p class="hint">Attendo il permesso del microfono...</p>`;
  let rec;
  try {
    try {
      rec = await createWavRecorder();
    } catch (e) {
      if (e && e.name) throw e; // errore di permesso/microfono: non ha senso riprovare
      rec = await createMediaRecorder();
    }
  } catch (e) {
    statusEl.innerHTML = "";
    setRecordButtons(null);
    alert(micErrorMessage(e));
    return;
  }
  const startedAt = Date.now();
  const tick = () => {
    const sec = Math.floor((Date.now() - startedAt) / 1000);
    const mm = String(Math.floor(sec / 60));
    const ss = String(sec % 60).padStart(2, "0");
    const el = document.getElementById(`status-${oid}`);
    if (el) el.innerHTML = `<p class="hint"><span class="rec-dot"></span>Registrazione in corso... ${mm}:${ss}</p>`;
    if (sec >= MAX_RECORDING_SEC) stopRecording(oid);
  };
  activeRec = { oid, rec, timer: setInterval(tick, 500) };
  tick();
}

async function stopRecording(oid) {
  if (!activeRec || activeRec.oid !== oid) return;
  const { rec, timer } = activeRec;
  clearInterval(timer);
  activeRec = null;
  document.getElementById(`status-${oid}`).innerHTML = `<p class="hint">Salvataggio...</p>`;
  try {
    const blob = await rec.stop();
    state.audioBlobs[oid] = blob;
    showPlayer(oid, blob);
    document.getElementById(`status-${oid}`).innerHTML = "";
  } catch (e) {
    document.getElementById(`status-${oid}`).innerHTML =
      `<p class="hint" style="color:#c0392b">La registrazione è vuota. Controlla il microfono e riprova.</p>`;
  }
  setRecordButtons(null);
}

// Se lo studente torna indietro mentre registra, liberiamo il microfono.
function cancelActiveRecording() {
  if (!activeRec) return;
  clearInterval(activeRec.timer);
  activeRec.rec.cancel();
  activeRec = null;
}

function showPlayer(oid, blob) {
  const url = URL.createObjectURL(blob);
  document.getElementById(`player-${oid}`).innerHTML = `
    <audio controls preload="metadata" src="${url}"></audio>
    <p class="hint">Registrazione salvata. Premi di nuovo "Registra" se vuoi rifarla.</p>
  `;
  document.querySelector(`button[data-action="record"][data-oid="${oid}"]`).textContent = "🎙️ Rifai la registrazione";
}

// --------------------------------------------------------------- SUBMIT ----
async function submitTest() {
  if (state.submitting) return;
  if (activeRec) await stopRecording(activeRec.oid);

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
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("aac")) return "aac";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
