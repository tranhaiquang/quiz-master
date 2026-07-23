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
    state.quizzes = raw ? JSON.parse(raw) : [];
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

loadState();
renderDashboard();

/* ── Dashboard ─────────────────────────────────── */

function renderDashboard() {
  const container = document.getElementById('quiz-list');
  if (!state.quizzes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="font-size:2.5rem;margin-bottom:8px">📝</p>
        <p>No quizzes yet. Import some questions to get started!</p>
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
          <strong>${escapeHtml(state.currentQuiz.name)}</strong>
          <span class="resume-progress">${answered}/${total} answered</span>
        </div>
        <button class="btn primary">Continue</button>
      </div>`;
  }

  container.innerHTML = resumeHtml + state.quizzes.map(q => {
    const isActive = state.currentQuiz && state.currentQuiz.id === q.id && !state.reviewed;
    return `
    <div class="quiz-card">
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

    let extra = '';
    if (state.reviewed || answered) {
      cls += ' disabled';
      if (i === q.correct) { cls += ' correct'; extra = ' ✓'; }
      if (selected === i && selected !== q.correct) { cls += ' wrong'; extra = ' ✗'; }
    }

    return `<div class="${cls}" data-index="${i}" onclick="selectOption(${i})">
      <span class="indicator">${labels[i] || i}</span>
      <span>${escapeHtml(opt)}${extra}</span>
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

function selectOption(index) {
  if (state.reviewed) return;
  if (state.answers[state.currentIndex] !== null) return;
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

  document.getElementById('results-detail').innerHTML = qs.map((q, i) => {
    const userAns = state.answers[i];
    const isCorrect = userAns === q.correct;
    return `
      <div class="review-item">
        <div class="q">${i + 1}. ${escapeHtml(q.question)}</div>
        <div class="a">
          Your answer: <span class="user-answer ${isCorrect ? 'correct' : 'wrong'}">
            ${userAns != null ? escapeHtml(q.options[userAns]) : '(none)'}
          </span>
          ${!isCorrect ? `&nbsp;·&nbsp;Correct: ${escapeHtml(q.options[q.correct])}` : ''}
        </div>
      </div>`;
  }).join('');

  showView('results');
}

function updateLiveScore() {
  const qs = state.currentQuiz.questions;
  const total = qs.length;
  let correct = 0;
  qs.forEach((q, i) => {
    if (state.answers[i] !== null && state.answers[i] === q.correct) correct++;
  });
  const el = document.getElementById('live-score');
  if (el) el.textContent = `Score: ${correct}/${total}`;
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

/* ── Import questions from folder ────────────── */

(function importQuestions() {
  // Naming patterns to try: tries {prefix}1.json, {prefix}2.json, ... until 404
  const patterns = ['tttcm_part', 'triet_hoc_part', 'quiz_', 'data_', 'q'];

  let discovered = [];
  let patternsDone = 0;
  const totalPatterns = patterns.length;

  function tryPattern(pi) {
    if (pi >= patterns.length) { finish(); return; }
    const prefix = patterns[pi];
    const found = [];
    let idx = 1;

    function next() {
      const name = prefix + idx + '.json';
      fetch('questions/' + name)
        .then(r => {
          if (!r.ok) { // 404 or other error — this pattern is exhausted
            discovered = discovered.concat(found);
            patternsDone++;
            if (patternsDone === totalPatterns) finish();
            else tryPattern(pi + 1);
            return null;
          }
          return r.json();
        })
        .then(data => {
          if (data === null) return;
          found.push({ file: name, data: data });
          idx++;
          next();
        })
        .catch(() => {
          // Network error — treat as end of pattern
          discovered = discovered.concat(found);
          patternsDone++;
          if (patternsDone === totalPatterns) finish();
          else tryPattern(pi + 1);
        });
    }

    next();
  }

  function finish() {
    const fileIds = new Set(discovered.map(d => 'q_' + d.file.replace(/\.json$/, '')));

    // Remove file-based quizzes whose file no longer exists, keep manually imported ones
    state.quizzes = state.quizzes.filter(q => !q.id.startsWith('q_') || fileIds.has(q.id));

    // Import files not yet in state
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

  tryPattern(0);
})();
