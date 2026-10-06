// Test rapido di livello: una domanda per schermata, timer unico, invio automatico
// allo scadere. Il progresso viene salvato nel browser, così se la pagina si
// ricarica per sbaglio lo studente riprende da dove era (e il timer non riparte).

const appEl = document.getElementById("app");
const progressFill = document.getElementById("progressFill");
const timerBadge = document.getElementById("timerBadge");
const SAVE_KEY = "italica-livello-v1";
const LETTERS = ["A", "B", "C", "D", "E"];

let test = null;
let s = null; // { studentName, contact, startedAt, index, answers: {id: originalIdx}, order: {id: [idx...]} }
let timer = null;
let submitting = false;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (_) {}
}
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (_) { return null; }
}
function clearSaved() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setProgress(f) {
  progressFill.style.width = `${Math.min(100, Math.max(0, f * 100))}%`;
}

function secondsLeft() {
  return Math.max(0, Math.round(test.meta.durationMin * 60 - (Date.now() - s.startedAt) / 1000));
}

function startTimer() {
  clearInterval(timer);
  timerBadge.hidden = false;
  const tick = () => {
    const left = secondsLeft();
    timerBadge.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    timerBadge.classList.toggle("warn", left <= 60);
    if (left <= 0) {
      clearInterval(timer);
      submit(true);
    }
  };
  tick();
  timer = setInterval(tick, 1000);
}

async function init() {
  try {
    const res = await fetch("/api/placement");
    test = await res.json();
  } catch (e) {
    appEl.innerHTML = `<div class="error-banner">Не вдалося завантажити тест. Онови сторінку.</div>`;
    return;
  }
  const saved = loadSaved();
  if (saved && saved.startedAt && Date.now() - saved.startedAt < (test.meta.durationMin * 60 + 600) * 1000) {
    s = saved;
    if (secondsLeft() <= 0) return submit(true);
    startTimer();
    return renderQuestion();
  }
  clearSaved();
  renderStart();
}

function renderStart() {
  setProgress(0);
  appEl.innerHTML = `
    <div class="card">
      <h1 style="color:#d9491f;">🇮🇹 Test di livello</h1>
      <p class="lead">Ciao! Цей короткий тест допоможе зрозуміти, з якого рівня тобі найкраще почати навчання в <strong>italica</strong>.</p>
      <ul class="pl-steps">
        <li><strong>${test.items.length} питань</strong>, у кожному одна правильна відповідь;</li>
        <li>на все — <strong>${test.meta.durationMin} хвилин</strong>, таймер угорі;</li>
        <li>питання поступово стають складнішими — це нормально;</li>
        <li>не знаєш відповіді — тисни <strong>«Не знаю»</strong>, не вгадуй;</li>
        <li>без перекладачів і словників, будь ласка 🙂</li>
      </ul>
      <div class="field">
        <label for="studentName">Ім'я та прізвище</label>
        <input type="text" id="studentName" autocomplete="name" placeholder="Напр. Ганна Ковальська" />
      </div>
      <div class="field">
        <label for="contact">Телефон або Telegram</label>
        <input type="text" id="contact" autocomplete="tel" placeholder="Щоб ми могли зв'язатися з тобою" />
      </div>
      <div class="actions end">
        <button class="btn-primary" id="startBtn">Почати тест</button>
      </div>
    </div>`;
  document.getElementById("startBtn").addEventListener("click", () => {
    const name = document.getElementById("studentName").value.trim();
    if (!name) {
      alert("Будь ласка, напиши своє ім'я та прізвище.");
      return;
    }
    const order = {};
    test.items.forEach((it) => (order[it.id] = shuffle(it.options.map((_, i) => i))));
    s = {
      studentName: name,
      contact: document.getElementById("contact").value.trim(),
      startedAt: Date.now(),
      index: 0,
      answers: {},
      order,
    };
    save();
    startTimer();
    renderQuestion();
  });
}

function questionHtml(text) {
  return escapeHtml(text).replace(/_{2,}/g, '<span class="blank">&nbsp;</span>');
}

function renderQuestion() {
  const total = test.items.length;
  if (s.index >= total) return renderReview();
  const item = test.items[s.index];
  const order = s.order[item.id] || item.options.map((_, i) => i);
  const chosen = s.answers[item.id];
  setProgress(s.index / total);
  appEl.innerHTML = `
    <div class="card">
      <div class="pl-count">Питання ${s.index + 1} з ${total}</div>
      <p class="pl-question">${questionHtml(item.text)}</p>
      <div class="pl-options">
        ${order
          .map(
            (orig, pos) => `
          <button class="pl-option${chosen === orig ? " selected" : ""}" data-orig="${orig}">
            <span class="pl-letter">${LETTERS[pos]}</span><span>${escapeHtml(item.options[orig])}</span>
          </button>`
          )
          .join("")}
      </div>
      <div class="pl-nav">
        <button class="btn-secondary" id="backBtn" ${s.index === 0 ? "disabled" : ""}>&larr; Назад</button>
        <button class="btn-secondary pl-skip" id="skipBtn">${chosen !== undefined ? "Далі &rarr;" : "Не знаю &rarr;"}</button>
      </div>
    </div>`;

  appEl.querySelectorAll(".pl-option").forEach((btn) =>
    btn.addEventListener("click", () => {
      s.answers[item.id] = Number(btn.dataset.orig);
      appEl.querySelectorAll(".pl-option").forEach((b) => b.classList.toggle("selected", b === btn));
      appEl.querySelectorAll(".pl-option").forEach((b) => (b.disabled = true));
      save();
      setTimeout(() => {
        s.index += 1;
        save();
        renderQuestion();
      }, 220);
    })
  );
  document.getElementById("backBtn").addEventListener("click", () => {
    s.index = Math.max(0, s.index - 1);
    save();
    renderQuestion();
  });
  document.getElementById("skipBtn").addEventListener("click", () => {
    s.index += 1;
    save();
    renderQuestion();
  });
  window.scrollTo(0, 0);
}

function renderReview() {
  setProgress(1);
  const answered = Object.keys(s.answers).length;
  const total = test.items.length;
  appEl.innerHTML = `
    <div class="card">
      <h2>Майже все! 🎉</h2>
      <p class="lead">Ти відповів(-ла) на <strong>${answered} з ${total}</strong> питань.
      ${answered < total ? "Можеш повернутися назад і спробувати ще, поки йде час, або завершити тест зараз." : ""}</p>
      <div class="pl-nav">
        <button class="btn-secondary" id="backBtn">&larr; Повернутися</button>
        <button class="btn-primary" id="finishBtn">Завершити тест</button>
      </div>
    </div>`;
  document.getElementById("backBtn").addEventListener("click", () => {
    const firstEmpty = test.items.findIndex((it) => s.answers[it.id] === undefined);
    s.index = firstEmpty >= 0 ? firstEmpty : total - 1;
    save();
    renderQuestion();
  });
  document.getElementById("finishBtn").addEventListener("click", () => submit(false));
}

async function submit(timedOut) {
  if (submitting) return;
  submitting = true;
  clearInterval(timer);
  timerBadge.hidden = true;
  appEl.innerHTML = `<div class="card"><p class="lead">${timedOut ? "Час вийшов ⏱ " : ""}Надсилаємо відповіді...</p></div>`;
  const payload = {
    studentName: s.studentName,
    contact: s.contact,
    answers: s.answers,
    durationSec: Math.round((Date.now() - s.startedAt) / 1000),
    timedOut,
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("/api/placement/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");
      clearSaved();
      return renderDone(data, timedOut);
    } catch (e) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  submitting = false;
  appEl.innerHTML = `
    <div class="card">
      <div class="error-banner">Не вдалося надіслати відповіді. Перевір інтернет — твої відповіді збережені.</div>
      <div class="actions end"><button class="btn-primary" id="retryBtn">Спробувати ще раз</button></div>
    </div>`;
  document.getElementById("retryBtn").addEventListener("click", () => submit(timedOut));
}

function renderDone(data, timedOut) {
  setProgress(1);
  const name = escapeHtml(s.studentName.split(" ")[0]);
  if (!data.level) {
    appEl.innerHTML = `
      <div class="card">
        <h2>Grazie, ${name}! 🇮🇹</h2>
        <p class="lead">Тест надіслано. Ми скоро зв'яжемося з тобою і розповімо про твій рівень.</p>
      </div>`;
    return;
  }
  appEl.innerHTML = `
    <div class="card">
      <h2>Grazie, ${name}! 🇮🇹</h2>
      ${timedOut ? `<p class="hint">Час вийшов, тому ми надіслали відповіді автоматично.</p>` : ""}
      <p class="lead" style="margin-bottom:0">Твій орієнтовний рівень:</p>
      <div class="pl-level">${data.level}</div>
      <div class="pl-facts">
        <div class="pl-fact"><b>${data.score} / ${data.maxScore}</b>правильних відповідей</div>
      </div>
      ${
        data.borderline
          ? `<div class="pl-note">Твій результат на межі двох рівнів. Радимо коротку розмову з викладачем — так ми точно підберемо групу.</div>`
          : `<div class="pl-note">Цей тест перевіряє граматику й лексику. Остаточний рівень викладач підтвердить після короткої розмови.</div>`
      }
      <p class="lead" style="margin-top:16px">Ми зв'яжемося з тобою найближчим часом. <em>A presto!</em></p>
    </div>`;
}

init();
