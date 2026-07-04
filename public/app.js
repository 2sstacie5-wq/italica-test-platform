// App лато студента: нессуна библіотека зовнішня, лише DOM + fetch + MediaRecorder.

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
  submitting: false,
  result: null,
};

function totalSteps() {
  return state.test.parts.length + 2;
}

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

function renderStart() {
  clearTimer();
  setProgress(0);
  appEl.innerHTML = `
    <div class="card">
      <h1>${state.test.meta.title}</h1>
      <p class="lead">
        Il test scritto (Parte 1–7) dura circa ${state.test.meta.writtenDurationMin} minuti in totale,
        con un timer per ogni parte. Dopo la parte scritta seguono la produzione scritta e la
        produzione orale (con registrazione vocale) — non sono cronometrate, ma rispondi con calma
        e in modo completo. Per la parte orale ti verrà chiesto il permesso di usare il microfono.
      </p>
      <div class="field">
        <label for="studentName">Nome e cognome</label>
        <input type="text" id="studentName" placeholder="Es. Anna Rossi" />
      </div>
      <div class="actions end">
        <button class="btn-primary" id="startBtn">Inizia il test</button>
      </div>
    </div>
  `;
  document.getElementById("startBtn").addEventListener("click", () => {
    const name = document.getElementById("studentName").value.trim();
    if (!name) {
      alert("Per favore, scrivi il tuo nome e cognome prima di iniziare.");
      return;
    }
    state.studentName = name;
    renderPart(0);
  });
}

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

  startTimer(part.durationMin, () => goToNextPart(index));
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
  } else if (part.type ===
