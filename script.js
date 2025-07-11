// ================================
// 1. Constants and Element References
// ================================
const levels = ['easy', 'intermediate', 'hard'];
const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F#', 'Ab', 'Bb', 'Db', 'Eb'];
const scaleStepsMajor = [2, 2, 1, 2, 2, 2, 1];
const scaleStepsMinor = [2, 1, 2, 2, 1, 2, 2];
const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

let quizData = [];
let currentIndex = 0;
let correctAnswers = 0;
let timer, countdownInterval, isPaused = false, quizActive = false, quizStartTime, metronomeInterval;

const levelSelect = document.getElementById('level-select');
const keySelect = document.getElementById('key-select');
const keyContainer = document.getElementById('key-select-container');
const degreeContainer = document.getElementById('degree-select-container');
const scaleChart = document.getElementById('scale-chart');
const startBtn = document.getElementById('start-btn');
const quizCard = document.getElementById('quiz-card');
const settingsCard = document.getElementById('settings-card');
const resultsCard = document.getElementById('results-card');
const closeQuizBtn = document.getElementById('close-quiz');
const questionDiv = document.getElementById('quiz-question');
const answerButtons = document.getElementById('answer-buttons');
const feedback = document.getElementById('feedback');
const scoreSummary = document.getElementById('score-summary');
const playAgainBtn = document.getElementById('play-again');
const helpBtn = document.getElementById('help-btn');

const countdown = document.createElement('div');
countdown.id = 'countdown';
countdown.style.fontSize = '20px';
countdown.style.marginTop = '10px';
quizCard.appendChild(countdown);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ================================
// 2. Initialization
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const helpChartModal = document.getElementById('help-chart-modal');
  const closeHelpChartBtn = document.getElementById('close-help-chart');
  const helpFeedback = document.getElementById('help-feedback');

  initializeUI();
  bindUIEvents();

  document.body.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  closeHelpChartBtn.addEventListener('click', () => {
    helpChartModal.classList.add('hidden');
    const helpScaleChart = document.getElementById('help-scale-chart');
    if (helpScaleChart) helpScaleChart.classList.add('hidden');
    isPaused = false;
    showQuestion();
  });

  helpBtn.addEventListener('click', () => {
    if (isPaused) return;
    isPaused = true;
    clearTimeout(timer);
    clearInterval(countdownInterval);
    const helpScaleChart = document.getElementById('help-scale-chart');
    const current = quizData[currentIndex];
    const inferredKey = (levelSelect.value === 'hard')
      ? current.answer
      : current.question.match(/key of (\w[#b]?)/)?.[1] || current.answer;
    if (keys.indexOf(inferredKey) !== -1) keySelect.value = inferredKey;
    updateChart(helpScaleChart);
    if (helpScaleChart) helpScaleChart.classList.remove('hidden');
    helpFeedback.textContent = `ℹ️ Answer: ${quizData[currentIndex].answer}`;
    helpChartModal.classList.remove('hidden');
  });
});

function initializeUI() {
  populateKeys();
  keySelect.selectedIndex = 0;
  updateChart();
  const level = levelSelect.value;
  if (level === 'easy') {
    keyContainer.classList.remove('hidden');
    degreeContainer.classList.add('hidden');
  } else if (level === 'degree-training') {
    keyContainer.classList.add('hidden');
    degreeContainer.classList.remove('hidden');
  } else {
    keyContainer.classList.add('hidden');
    degreeContainer.classList.add('hidden');
  }
}

function bindUIEvents() {
  levelSelect.addEventListener('change', () => {
    const level = levelSelect.value;
    if (level === 'easy') {
      keyContainer.classList.remove('hidden');
      degreeContainer.classList.add('hidden');
    } else if (level === 'degree-training') {
      keyContainer.classList.add('hidden');
      degreeContainer.classList.remove('hidden');
    } else {
      keyContainer.classList.add('hidden');
      degreeContainer.classList.add('hidden');
    }
    updateChart();
  });
  keySelect.addEventListener('change', updateChart);
  document.getElementById('scale-type').addEventListener('change', updateChart);
  startBtn.addEventListener('click', () => {
    resetQuiz();
    quizStartTime = performance.now();
    quizActive = true;
    generateQuiz(levelSelect.value, +document.getElementById('question-count').value);
    if (quizData.length === 0) {
      alert("⚠️ No questions generated. Please check your settings.");
      return;
    }
    settingsCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    updateInputUI();
    showQuestion();
    startMetronome();
  });
  closeQuizBtn.addEventListener('click', () => {
    clearTimeout(timer);
    clearInterval(countdownInterval);
    resetQuiz();
    quizCard.classList.add('hidden');
    settingsCard.classList.remove('hidden');
  });
  playAgainBtn.addEventListener('click', () => {
    resultsCard.classList.add('hidden');
    settingsCard.classList.remove('hidden');
  });
}

// ================================
// 3. UI Helpers
// ================================
function populateKeys() {
  keySelect.innerHTML = '';
  keys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    keySelect.appendChild(opt);
  });
}

function getScale(key) {
  const scaleTypeElem = document.getElementById('scale-type');
  if (!scaleTypeElem) return [];
  const scaleType = scaleTypeElem.value;
  const steps = scaleType === 'minor' ? scaleStepsMinor : scaleStepsMajor;
  let start = notes.indexOf(key);
  if (start === -1) return [];
  let scale = [key];
  for (let step of steps) {
    start = (start + step) % 12;
    scale.push(notes[start]);
  }
  return scale.slice(0, 7);
}

function updateChart(targetElement = scaleChart) {
  if (!targetElement) return;
  if (!keySelect || !document.getElementById('scale-type')) return;
  const key = keySelect.value;
  const scaleType = document.getElementById('scale-type').value;
  if (!key || !scaleType) return;
  const scale = getScale(key);
  targetElement.innerHTML = `<strong>${key} ${scaleType.charAt(0).toUpperCase() + scaleType.slice(1)} Scale</strong><br>`;
  scale.forEach((note, idx) => {
    targetElement.innerHTML += `<div>${idx + 1}: ${note}</div>`;
  });
}

function updateInputUI() {
  document.querySelectorAll('.instrument-ui').forEach(el => el.classList.add('hidden'));
  document.getElementById('custom-input-ui').innerHTML = '';
  const selectedIcon = document.querySelector('.input-icon.selected');
  const selectedInputType = selectedIcon ? selectedIcon.dataset.type : 'keys';
  if (selectedInputType === 'keys') {
    document.getElementById('keys-ui')?.classList.remove('hidden');
  } else if (selectedInputType === 'piano') {
    document.getElementById('piano-ui')?.classList.remove('hidden');
    const container = document.getElementById('piano-ui');
    container.innerHTML = '';
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotes = ['Db', 'Eb', '', 'F#', 'Ab', 'Bb', ''];
    const piano = document.createElement('div');
    piano.className = 'piano';
    whiteNotes.forEach((note, i) => {
      const white = document.createElement('div');
      white.className = 'white-key';
      white.dataset.note = note;
      white.textContent = note;
      white.onclick = () => handleNoteClick(note);
      piano.appendChild(white);
      const blackNote = blackNotes[i];
      if (blackNote) {
        const black = document.createElement('div');
        black.className = 'black-key';
        black.dataset.note = blackNote;
        black.textContent = blackNote;
        black.style.left = `${30 + i * 40}px`;
        black.onclick = () => handleNoteClick(blackNote);
        piano.appendChild(black);
      }
    });
    container.appendChild(piano);
  }
}

function handleNoteClick(note) {
  const correct = quizData[currentIndex].answer;
  const keys = document.querySelectorAll('.white-key, .black-key');
  keys.forEach(k => k.disabled = true);
  const selectedKey = document.querySelector(`[data-note="${note}"]`);
  const correctKey = document.querySelector(`[data-note="${correct}"]`);
  if (note === correct) {
    playCorrectSound();
    if (selectedKey) selectedKey.classList.add('correct');
    feedback.textContent = '✅ Correct!';
    correctAnswers++;
    setTimeout(() => {
      if (selectedKey) selectedKey.classList.remove('correct');
      nextQuestion();
    }, 300);
  } else {
    playIncorrectSound();
    if (selectedKey) selectedKey.classList.add('incorrect');
    if (correctKey) correctKey.classList.add('correct');
    feedback.textContent = `❌ Incorrect. Answer: ${correct}`;
    setTimeout(() => {
      if (selectedKey) selectedKey.classList.remove('incorrect');
      if (correctKey) correctKey.classList.remove('correct');
      nextQuestion();
    }, 1000);
  }
}

document.querySelectorAll('.input-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.input-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    updateInputUI();
  });
});

// ================================
// 4. Quiz Logic
// ================================
function generateQuiz(level, count) {
  quizData = [];
  const selectedDegree = +document.getElementById('degree-select')?.value;
  for (let i = 0; i < count; i++) {
    let degree, key;
    if (level === 'degree-training') {
      degree = selectedDegree;
      key = randomChoice(keys);
    } else {
      degree = Math.floor(Math.random() * 7) + 1;
      key = level === 'easy' ? keySelect.value : randomChoice(keys);
    }
    const scale = getScale(key);
    const isDegreeLevel = level === 'easy' || level === 'intermediate' || level === 'degree-training';
    if (isDegreeLevel) {
      let options = scale.filter(n => n !== scale[degree - 1]);
      options = shuffle(options).slice(0, 4);
      options.push(scale[degree - 1]);
      options = shuffle(options);
      quizData.push({
        question: `What is degree ${degree} in the key of ${key}?`,
        answer: scale[degree - 1],
        options: options
      });
    } else if (level === 'hard') {
      const note = scale[degree - 1];
      let options = keys.filter(k => k !== key);
      options = shuffle(options).slice(0, 4);
      options.push(key);
      options = shuffle(options);
      quizData.push({
        question: `${note} is the ${degree} degree of what key?`,
        answer: key,
        options: options
      });
    }
  }
}

function showQuestion() {
  if (!quizData[currentIndex]) return;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  feedback.textContent = '';
  countdown.style.color = 'black';
  const q = quizData[currentIndex];
  questionDiv.textContent = q.question;
  answerButtons.innerHTML = '';
  q.options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.onclick = () => {
      btn.blur();
      btn.classList.remove('hover');
      checkAnswer(option);
    };
    answerButtons.appendChild(btn);
  });
  const seconds = +document.getElementById('time-limit').value;
  let timeLeft = seconds;
  countdown.textContent = `⏳ ${timeLeft} seconds`;
  countdown.style.transition = 'color 0.5s ease';
  countdownInterval = setInterval(() => {
    if (isPaused) return;
    timeLeft--;
    countdown.textContent = `⏳ ${timeLeft} seconds`;
    if (timeLeft <= 3) {
      countdown.style.color = 'red';
      countdown.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.3)' },
        { transform: 'scale(1)' }
      ], { duration: 500, iterations: 1 });
    } else {
      countdown.style.color = 'black';
    }
    if (timeLeft <= 0) clearInterval(countdownInterval);
  }, 1000);
  timer = setTimeout(() => {
    if (!isPaused) {
      playIncorrectSound();
      const correct = quizData[currentIndex].answer;
      const buttons = [...answerButtons.querySelectorAll('button')];
      buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) btn.classList.add('correct');
      });
      setTimeout(nextQuestion, 2000);
    }
  }, seconds * 1000);
}

function checkAnswer(selected) {
  clearTimeout(timer);
  clearInterval(countdownInterval);
  const correct = quizData[currentIndex].answer;
  const isCorrect = selected === correct;
  const buttons = [...answerButtons.querySelectorAll('button')];
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add('correct');
    if (btn.textContent === selected && !isCorrect) btn.classList.add('incorrect');
  });
  setTimeout(() => showFeedback(isCorrect), 1000);
}

function showFeedback(correct) {
  if (correct) {
    correctAnswers++;
    playCorrectSound();
    feedback.textContent = '✅ Correct!';
    setTimeout(nextQuestion, 300);
  } else {
    playIncorrectSound();
    feedback.textContent = `❌ Incorrect. Answer: ${quizData[currentIndex].answer}`;
    setTimeout(nextQuestion, 3000);
  }
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < quizData.length) {
    showQuestion();
  } else if (quizActive && currentIndex >= quizData.length) {
    const best = Math.max(correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);
    quizCard.classList.add('hidden');
    resultsCard.classList.remove('hidden');
    const elapsedTime = ((performance.now() - quizStartTime) / 1000).toFixed(1);
    scoreSummary.innerHTML = `
      <div style="font-size: 1.2em; margin-bottom: 16px;">🏆 Best Score: <strong>${best}</strong></div>
      <div>✅ You scored <strong>${correctAnswers}</strong> out of ${quizData.length}</div>
      <div>⏱️ Time: <strong>${elapsedTime}</strong> seconds</div>
    `;
    playAgainBtn.textContent = "Try Again";
  }
}

function resetQuiz() {
  quizData = [];
  currentIndex = 0;
  correctAnswers = 0;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  clearInterval(metronomeInterval);
  feedback.textContent = '';
  countdown.textContent = '';
  quizActive = false;
}

// ================================
// 5. Metronome Logic
// ================================
function startMetronome() {
  let total = quizData.length;
  let baseBpm = 60, maxBpm = 150;
  if (metronomeInterval) clearInterval(metronomeInterval);
  const getProgress = () => currentIndex / total;
  function tick() {
    if (!quizActive || currentIndex >= total) {
      clearInterval(metronomeInterval);
      return;
    }
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    const bpm = baseBpm + (maxBpm - baseBpm) * getProgress();
    const interval = (60 / bpm) * 1000;
    clearInterval(metronomeInterval);
    metronomeInterval = setInterval(tick, interval);
  }
  tick();
}

// ================================
// 6. Audio Feedback
// ================================
function playTone(freq, duration = 0.15, volume = 0.1) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
function playCorrectSound() {
  playTone(880, 0.15, 0.05);
}
function playIncorrectSound() {
  const duration = 0.2;
  const tone1 = 880;
  const tone2 = tone1 / Math.pow(2, 1 / 12);
  const oscillator1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  oscillator1.type = 'sine';
  oscillator1.frequency.setValueAtTime(tone1, audioCtx.currentTime);
  oscillator1.connect(gain1);
  gain1.connect(audioCtx.destination);
  gain1.gain.setValueAtTime(0.05, audioCtx.currentTime);
  oscillator1.start();
  oscillator1.stop(audioCtx.currentTime + duration);
  const oscillator2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(tone2, audioCtx.currentTime + duration);
  oscillator2.connect(gain2);
  gain2.connect(audioCtx.destination);
  gain2.gain.setValueAtTime(0.05, audioCtx.currentTime);
  oscillator2.start(audioCtx.currentTime + duration);
  oscillator2.stop(audioCtx.currentTime + duration * 2);
}

// ================================
// 7. Utility
// ================================
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}