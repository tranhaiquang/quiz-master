const STORAGE_KEY = 'quizmaster_quizzes';

let state = {
  quizzes: [],
  currentQuiz: null,
  currentIndex: 0,
  answers: [],
  reviewed: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Legacy saves can contain malformed entries that crash rendering — keep only usable quizzes.
    state.quizzes = Array.isArray(parsed)
      ? parsed.filter(q => q && typeof q.name === 'string' && Array.isArray(q.questions))
      : [];
  } catch { state.quizzes = []; }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.quizzes));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === id));
  document.getElementById('navbar').classList.remove('open');
  if (id === 'dashboard') renderDashboard();
}

/* ── Dashboard ─────────────────────────────────── */

/* Hand-drawn-style SVG stickers (one cohesive pastel set) — replaces system emoji,
   which render differently per OS and are missing on older iOS versions. */
const STICKERS = {
  flower: '<svg viewBox="0 0 24 24"><g fill="#FF9DBF"><circle cx="12" cy="5.5" r="3.4"/><circle cx="18.3" cy="10" r="3.4"/><circle cx="15.9" cy="17.4" r="3.4"/><circle cx="8.1" cy="17.4" r="3.4"/><circle cx="5.7" cy="10" r="3.4"/></g><circle cx="12" cy="12" r="3" fill="#FFD466"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="#FFC94D" d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.7L12 16.9 5.9 20.3l1.5-6.7L2.2 9l6.9-.7z"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path fill="#FF7DAE" d="M12 21C6.6 17 3 13.6 3 9.9 3 7.2 5 5 7.6 5c1.8 0 3.4 1 4.4 2.6C13 6 14.6 5 16.4 5 19 5 21 7.2 21 9.9c0 3.7-3.6 7.1-9 11.1z"/></svg>',
  candy: '<svg viewBox="0 0 24 24"><path d="M4.5 9.5 7 11.5 4.5 14.5z" fill="#FF7DAE"/><path d="M19.5 9.5 17 11.5 19.5 14.5z" fill="#FF7DAE"/><circle cx="12" cy="12" r="5.5" fill="#FF9DBF"/><path d="M9.5 7.6c1.6 2.8 1.6 6 0 8.8M14.5 7.6c-1.6 2.8-1.6 6 0 8.8" stroke="#FFF6E9" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
  rainbow: '<svg viewBox="0 0 24 24"><g fill="none" stroke-linecap="round"><path d="M4 17a8 8 0 0 1 16 0" stroke="#FF9DBF" stroke-width="2.6"/><path d="M8 17a4 4 0 0 1 8 0" stroke="#FFD466" stroke-width="2.6"/><path d="M11.2 17h1.6" stroke="#7FD1AE" stroke-width="2.6"/></g></svg>',
  bubble: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#CDE8FB" opacity=".9"/><circle cx="9" cy="9" r="2.4" fill="#fff" opacity=".9"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path fill="#8FA6E8" d="M4 5.5C6.5 4 9.5 4 11.2 5.2v13.3C9.5 17.3 6.5 17.3 4 18.8z"/><path fill="#B8C8F2" d="M12.8 5.2C14.5 4 17.5 4 20 5.5v13.3c-2.5-1.5-5.5-1.5-7.2-.3z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><g transform="rotate(45 12 12)"><rect x="10" y="2" width="4" height="14" rx="1" fill="#FFD466"/><rect x="10" y="2" width="4" height="4" fill="#FF9DBF"/><path d="M10 16h4l-2 4z" fill="#B08968"/></g></svg>',
  bulb: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="6.5" fill="#FFE082"/><rect x="9.5" y="16" width="5" height="3.5" rx="1.2" fill="#B08968"/></svg>',
  bow: '<svg viewBox="0 0 24 24"><path fill="#FF9DBF" d="M11 12C7.5 8.5 4 9 4 11.5S7.5 15.5 11 12z"/><path fill="#FF9DBF" d="M13 12c3.5-3.5 7-3 7-.5S16.5 15.5 13 12z"/><circle cx="12" cy="12" r="2.2" fill="#FF7DAE"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path fill="#C5B3FF" d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path fill="#FF9DBF" d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/></svg>',
  clover: '<svg viewBox="0 0 24 24"><g fill="#7FD1AE"><circle cx="9" cy="9" r="3.6"/><circle cx="15" cy="9" r="3.6"/><circle cx="9" cy="15" r="3.6"/><circle cx="15" cy="15" r="3.6"/></g><path d="M13 16c0 2 .8 3.5 2 4.5" stroke="#5FB894" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
  donut: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#FFB86B"/><circle cx="12" cy="12" r="3" fill="#FFF6E9"/><g fill="#FF7DAE"><rect x="8" y="6.5" width="3" height="1.4" rx=".7" transform="rotate(30 9.5 7.2)"/><rect x="14" y="9" width="3" height="1.4" rx=".7" transform="rotate(-20 15.5 9.7)"/><rect x="7" y="14" width="3" height="1.4" rx=".7" transform="rotate(15 8.5 14.7)"/></g></svg>',
  pin: '<svg viewBox="0 0 24 24"><path fill="#FF7DAE" d="M12 3a5 5 0 0 1 5 5c0 3.5-3 5.5-4 8h-2c-1-2.5-4-4.5-4-8a5 5 0 0 1 5-5z"/><circle cx="12" cy="8" r="1.8" fill="#fff"/><path d="M12 16v4" stroke="#FF7DAE" stroke-width="2" stroke-linecap="round"/></svg>'
};

const CARD_STICKERS = ['book', 'pencil', 'rainbow', 'candy', 'bulb', 'bow', 'spark', 'clover', 'star', 'donut'];

function renderDashboard() {
  const container = document.getElementById('quiz-list');
  if (!state.quizzes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-emoji">${STICKERS.book}</p>
        <p>No quizzes yet — let's make your first one!</p>
        <button class="btn primary" onclick="showView('import')">Import Questions</button>
      </div>`;
    return;
  }

  let resumeHtml = '';
  if (state.currentQuiz && !state.reviewed) {
    const answered = state.answers.filter(a => a !== null).length;
    const total = state.currentQuiz.questions.length;
    resumeHtml = `
      <div class="resume-banner" onclick="resumeQuiz()">
        <div class="resume-info">
          <strong>${STICKERS.pin} ${escapeHtml(state.currentQuiz.name)}</strong>
          <span class="resume-progress">${answered}/${total} answered</span>
        </div>
        <button class="btn primary">Continue</button>
      </div>`;
  }

  container.innerHTML = resumeHtml + state.quizzes.map((q, i) => {
    const isActive = state.currentQuiz && state.currentQuiz.id === q.id && !state.reviewed;
    const sticker = CARD_STICKERS[i % CARD_STICKERS.length];
    return `
    <div class="quiz-card">
      <span class="card-sticker" aria-hidden="true">${STICKERS[sticker]}</span>
      <h3>${escapeHtml(q.name)}</h3>
      <div class="meta">${q.questions.length} questions</div>
      <div class="card-actions">
        <button class="btn primary" onclick="${isActive ? 'resumeQuiz()' : "startQuiz('" + q.id + "')"}">${isActive ? 'Resume' : 'Take Quiz'}</button>
        <button class="btn" onclick="deleteQuiz('${q.id}')">Delete</button>
        <button class="btn" onclick="exportQuiz('${q.id}')">Export</button>
      </div>
    </div>
  `}).join('');
}

function deleteQuiz(id) {
  if (!confirm('Delete this quiz?')) return;
  state.quizzes = state.quizzes.filter(q => q.id !== id);
  saveState();
  renderDashboard();
}

function exportQuiz(id) {
  const quiz = state.quizzes.find(q => q.id === id);
  if (!quiz) return;
  const blob = new Blob([JSON.stringify(quiz.questions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = quiz.name.replace(/\s+/g, '_') + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Import ────────────────────────────────────── */

function importSample() {
  const sample = JSON.stringify([
    { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 },
    { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1 },
    { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
    { question: 'Who wrote "Romeo and Juliet"?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], correct: 1 },
    { question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3 },
  ], null, 2);
  document.getElementById('json-input').value = sample;
  setImportStatus('Sample loaded. Click Import to add it.', 'ok');
}

function parseQuestions(arr) {
  if (!Array.isArray(arr) || !arr.length) throw new Error('Must be a non-empty array.');
  return arr.map(function (item, i) {
    if (!item.question || !Array.isArray(item.options) || item.options.length < 2)
      throw new Error('Question ' + (i + 1) + ': must have "question" and "options" (min 2).');
    if (typeof item.correct !== 'number' || item.correct < 0 || item.correct >= item.options.length)
      throw new Error('Question ' + (i + 1) + ': "correct" must be a valid 0-based index.');
    return { question: String(item.question), options: [].concat(item.options), correct: item.correct };
  });
}

function finishImport(questions) {
  var nameInput = document.getElementById('quiz-name');
  var name = nameInput.value.trim();
  if (!name) name = String(questions[0].question).slice(0, 40) + (questions.length > 1 ? '\u2026' : '');
  var quiz = { id: generateId(), name: name, questions: questions };
  state.quizzes.push(quiz);
  saveState();
  document.getElementById('json-input').value = '';
  nameInput.value = '';
  showView('dashboard');
}

function importFromText() {
  var el = document.getElementById('json-input');
  if (!el) return;
  var raw = el.value.trim();
  if (!raw) { setImportStatus('Paste some JSON first.', 'err'); return; }
  try {
    var data = JSON.parse(raw);
    var questions, name;
    if (data && data.name && Array.isArray(data.questions)) {
      name = data.name;
      questions = parseQuestions(data.questions);
    } else {
      questions = parseQuestions(data);
    }
    if (name) document.getElementById('quiz-name').value = name;
    finishImport(questions);
  } catch (e) {
    setImportStatus('Invalid JSON: ' + e.message, 'err');
  }
}

function importFromFile(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var data = JSON.parse(ev.target.result);
      var questions, name;
      if (data && data.name && Array.isArray(data.questions)) {
        name = data.name;
        questions = parseQuestions(data.questions);
      } else {
        questions = parseQuestions(data);
      }
      if (name) document.getElementById('quiz-name').value = name;
      finishImport(questions);
    } catch (err) {
      setImportStatus('File error: ' + err.message, 'err');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function setImportStatus(msg, type) {
  var el = document.getElementById('import-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + (type || '');
}

/* ── Taking Quiz ───────────────────────────────── */

function startQuiz(id) {
  const quiz = state.quizzes.find(q => q.id === id);
  if (!quiz) return;
  state.currentQuiz = quiz;
  state.currentIndex = 0;
  state.answers = quiz.questions.map(() => null);
  state.reviewed = false;
  showView('quiz');
  document.getElementById('quiz-title').textContent = quiz.name;
  renderQuestion();
}

function renderQuestion() {
  const q = state.currentQuiz.questions[state.currentIndex];
  document.getElementById('question-text').textContent = q.question;

  const total = state.currentQuiz.questions.length;
  document.getElementById('quiz-progress').textContent =
    `Question ${state.currentIndex + 1} of ${total}`;

  const pct = ((state.currentIndex + 1) / total) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';

  const container = document.getElementById('options-container');
  const selected = state.answers[state.currentIndex];
  const answered = selected !== null;
  const labels = 'ABCDEFGH';

  container.innerHTML = q.options.map((opt, i) => {
    let cls = 'option';
    if (selected === i) cls += ' selected';

    if (state.reviewed || answered) {
      cls += ' disabled';
      if (i === q.correct) cls += ' correct';
      if (selected === i && selected !== q.correct) cls += ' wrong';
    }

    return `<div class="${cls}" data-index="${i}" onclick="selectOption(event, ${i})">
      <span class="indicator">${labels[i] || i}</span>
      <span>${escapeHtml(opt)}</span>
    </div>`;
  }).join('');

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');

  prevBtn.style.display = state.currentIndex === 0 ? 'none' : '';
  const isLast = state.currentIndex === total - 1;

  if (state.reviewed) {
    nextBtn.style.display = isLast ? 'none' : '';
    prevBtn.style.display = state.currentIndex === 0 ? 'none' : '';
    submitBtn.style.display = 'none';
    updateLiveScore();
    return;
  }

  if (isLast) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = '';
    submitBtn.disabled = state.answers.some(a => a === null);
  } else {
    nextBtn.style.display = '';
    submitBtn.style.display = 'none';
  }

  updateLiveScore();
}

function selectOption(ev, index) {
  if (state.reviewed) return;
  if (state.answers[state.currentIndex] !== null) return;
  const q = state.currentQuiz.questions[state.currentIndex];

  // celebrate correct picks with a confetti burst before re-render
  if (ev && ev.currentTarget && index === q.correct) {
    const r = ev.currentTarget.getBoundingClientRect();
    burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
  }

  state.answers[state.currentIndex] = index;
  renderQuestion();
  updateLiveScore();
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn.style.display !== 'none') {
    submitBtn.disabled = state.answers.some(a => a === null);
  }
}

function nextQuestion() {
  if (state.currentIndex < state.currentQuiz.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
}

function submitQuiz() {
  if (state.answers.some(a => a === null)) {
    alert('Please answer all questions before submitting.');
    return;
  }
  state.reviewed = true;
  renderQuestion();
  showResults();
}

function resumeQuiz() {
  if (state.currentQuiz) {
    showView('quiz');
    document.getElementById('quiz-title').textContent = state.currentQuiz.name;
    renderQuestion();
  }
}

function retakeQuiz() {
  if (state.currentQuiz) startQuiz(state.currentQuiz.id);
}

/* ── Results ───────────────────────────────────── */

function showResults() {
  const qs = state.currentQuiz.questions;
  let correct = 0;
  qs.forEach((q, i) => { if (state.answers[i] === q.correct) correct++; });

  const total = qs.length;
  const pct = Math.round((correct / total) * 100);

  let badge, badgeClass;
  if (pct === 100) { badge = 'Perfect!'; badgeClass = 'perfect'; }
  else if (pct >= 80) { badge = 'Great!'; badgeClass = 'great'; }
  else if (pct >= 60) { badge = 'Good'; badgeClass = 'good'; }
  else { badge = 'Keep practicing'; badgeClass = 'poor'; }

  document.getElementById('results-summary').innerHTML = `
    <div class="score">${correct}/${total}</div>
    <div class="details">${pct}% correct</div>
    <span class="badge ${badgeClass}">${badge}</span>
  `;

  const correctItems = [];
  const incorrectItems = [];
  qs.forEach((q, i) => {
    const userAns = state.answers[i];
    const isCorrect = userAns === q.correct;
    const item = `
      <div class="review-item">
        <div class="q">${i + 1}. ${escapeHtml(q.question)}</div>
        <div class="a">
          Your answer: <span class="user-answer ${isCorrect ? 'correct' : 'wrong'}">
            ${userAns != null ? escapeHtml(q.options[userAns]) : '(none)'}
          </span>
          ${!isCorrect ? `&nbsp;·&nbsp;Correct: ${escapeHtml(q.options[q.correct])}` : ''}
        </div>
      </div>`;
    if (isCorrect) correctItems.push(item);
    else incorrectItems.push(item);
  });

  let html = '';
  if (incorrectItems.length) {
    html += `<h2 class="review-section-heading incorrect-heading">Incorrect (${incorrectItems.length})</h2>`;
    html += incorrectItems.join('');
  }
  if (correctItems.length) {
    html += `<h2 class="review-section-heading correct-heading">Correct (${correctItems.length})</h2>`;
    html += correctItems.join('');
  }
  document.getElementById('results-detail').innerHTML = html;

  showView('results');

  // confetti rain for a job well done
  if (pct === 100) confettiRain(60);
  else if (pct >= 60) confettiRain(34);
}

function updateLiveScore() {
  const qs = state.currentQuiz.questions;
  const total = qs.length;
  let correct = 0;
  qs.forEach((q, i) => {
    if (state.answers[i] !== null && state.answers[i] === q.correct) correct++;
  });
  const el = document.getElementById('live-score');
  if (el) {
    el.textContent = `Score: ${correct}/${total}`;
    el.classList.remove('bump');
    void el.offsetWidth; // restart the bump animation
    el.classList.add('bump');
  }
}

/* ── Helpers ───────────────────────────────────── */

function toggleNav() {
  document.getElementById('navbar').classList.toggle('open');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Cute confetti ─────────────────────────────── */

const CONFETTI_PIECES = ['star', 'heart', 'flower', 'bubble', 'spark'];

function burstConfetti(x, y, count) {
  const n = count || 22;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.innerHTML = STICKERS[CONFETTI_PIECES[Math.floor(Math.random() * CONFETTI_PIECES.length)]];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    const size = (13 + Math.random() * 16).toFixed(0) + 'px';
    s.style.width = size;
    s.style.height = size;
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 260).toFixed(0) + 'px');
    s.style.setProperty('--dy', (-(Math.random() * 200) - 40).toFixed(0) + 'px');
    s.style.setProperty('--rot', ((Math.random() - 0.5) * 540).toFixed(0) + 'deg');
    s.style.animationDuration = (0.9 + Math.random() * 0.8).toFixed(2) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1900);
  }
}

function confettiRain(count) {
  const n = count || 34;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'confetti fall';
    s.innerHTML = STICKERS[CONFETTI_PIECES[Math.floor(Math.random() * CONFETTI_PIECES.length)]];
    s.style.left = (Math.random() * 100).toFixed(1) + 'vw';
    s.style.top = '-40px';
    const size = (14 + Math.random() * 16).toFixed(0) + 'px';
    s.style.width = size;
    s.style.height = size;
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
    s.style.setProperty('--dy', (window.innerHeight + 80).toFixed(0) + 'px');
    s.style.setProperty('--rot', ((Math.random() - 0.5) * 720).toFixed(0) + 'deg');
    s.style.animationDuration = (1.6 + Math.random() * 1.4).toFixed(2) + 's';
    s.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3600);
  }
}

/* ── Import questions from folder ────────────── */

(function importQuestions() {
  fetch('questions/manifest.json')
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(files => {
      if (!Array.isArray(files)) throw new Error();
      loadFromManifest(files);
    })
    .catch(() => discoverByPatterns());

  function loadFromManifest(files) {
    if (files.length === 0) { applyImports([]); return; }
    let discovered = [];
    let done = 0;
    files.forEach(file => {
      fetch('questions/' + file)
        .then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(data => { discovered.push({ file, data }); })
        .catch(() => {})
        .finally(() => { done++; if (done === files.length) applyImports(discovered); });
    });
  }

  function discoverByPatterns() {
    const patterns = ['tttcm_part', 'triet_hoc_part_', 'quiz_', 'data_', 'q'];
    let discovered = [];
    let patternsDone = 0;
    const totalPatterns = patterns.length;

    function tryPattern(pi) {
      if (pi >= patterns.length) { applyImports(discovered); return; }
      const prefix = patterns[pi];
      const found = [];
      let idx = 1;

      function next() {
        const name = prefix + idx + '.json';
        fetch('questions/' + name)
          .then(r => {
            if (!r.ok) {
              discovered = discovered.concat(found);
              patternsDone++;
              if (patternsDone === totalPatterns) applyImports(discovered);
              else tryPattern(pi + 1);
              return null;
            }
            return r.json();
          })
          .then(data => {
            if (data === null) return;
            found.push({ file: name, data });
            idx++;
            next();
          })
          .catch(() => {
            discovered = discovered.concat(found);
            patternsDone++;
            if (patternsDone === totalPatterns) applyImports(discovered);
            else tryPattern(pi + 1);
          });
      }
      next();
    }
    tryPattern(0);
  }

  function applyImports(discovered) {
    // Empty discovery = fetch/manifest failure, not "user deleted all files" — keep existing quizzes instead of purging.
    if (discovered.length === 0) return;
    const fileIds = new Set(discovered.map(d => 'q_' + d.file.replace(/\.json$/, '')));
    state.quizzes = state.quizzes.filter(q => !q.id.startsWith('q_') || fileIds.has(q.id));
    const existing = new Set(state.quizzes.map(q => q.id));
    const toLoad = discovered.filter(d => !existing.has('q_' + d.file.replace(/\.json$/, '')));
    if (toLoad.length === 0) {
      saveState();
      renderDashboard();
      return;
    }
    let done = 0;
    toLoad.forEach(d => {
      const qs = Array.isArray(d.data) ? d.data : (d.data.questions || []);
      if (qs.length) {
        state.quizzes.push({
          id: 'q_' + d.file.replace(/\.json$/, ''),
          name: d.data.name || d.file.replace(/\.json$/, ''),
          questions: qs
        });
      }
      done++;
      if (done === toLoad.length) { saveState(); renderDashboard(); }
    });
  }
})();

loadState();
renderDashboard();
