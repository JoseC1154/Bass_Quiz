// script.js

const levels = ['easy', 'intermediate', 'hard'];
const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F#', 'Ab', 'Bb', 'Db', 'Eb'];
const scaleStepsMajor = [2, 2, 1, 2, 2, 2, 1];
const scaleStepsMinor = [2, 1, 2, 2, 1, 2, 2];
const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

let quizData = [];
let currentIndex = 0;
let correctAnswers = 0;
let timer;
let countdownInterval;
let isPaused = false;
let quizActive = false;

const levelSelect = document.getElementById('level-select');
const keySelect = document.getElementById('key-select');
const keyContainer = document.getElementById('key-select-container');
const degreeContainer = document.getElementById('degree-select-container');
const chartToggle = document.getElementById('toggle-chart');
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

// --- UI Initialization and Event Binding ---

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
    quizActive = true;
    generateQuiz(levelSelect.value, +document.getElementById('question-count').value);
    if (quizData.length === 0) {
      alert("⚠️ No questions generated. Please check your settings.");
      return;
    }
    settingsCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    showQuestion();
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

// --- Audio Functions ---

function playTone(freq, duration = 0.2) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function playCorrectSound() {
  playTone(880);
}

function playIncorrectSound() {
  const duration1 = 0.2;
  const duration2 = 0.4;
  const baseTone = 880;
  const tone1 = baseTone / Math.pow(2, 13 / 12); // ~493.88 Hz
  const tone2 = tone1 / Math.pow(2, 1 / 12);     // ~466.16 Hz

  const oscillator1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  oscillator1.type = 'sine';
  oscillator1.frequency.setValueAtTime(tone1, audioCtx.currentTime);
  oscillator1.connect(gain1);
  gain1.connect(audioCtx.destination);
  oscillator1.start();
  oscillator1.stop(audioCtx.currentTime + duration1);

  const oscillator2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(tone2, audioCtx.currentTime + duration1);
  oscillator2.connect(gain2);
  gain2.connect(audioCtx.destination);
  oscillator2.start(audioCtx.currentTime + duration1);
  oscillator2.stop(audioCtx.currentTime + duration1 + duration2);
}

// --- UI Update Functions ---

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
  if (!targetElement) return; // Prevent null reference error
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

// --- Utility Functions ---

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// --- Quiz Generation and Logic ---

function generateQuiz(level, count) {
  quizData = [];
  const selectedDegree = +document.getElementById('degree-select')?.value;
  for (let i = 0; i < count; i++) {
    let degree;
    let key;
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
  if (!quizData[currentIndex]) {
    console.warn('No question available at current index.');
    return;
  }
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
    btn.onclick = () => checkAnswer(option);
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
      playIncorrectSound(); // Play wrong answer sound on timeout
      // Highlight the correct answer in green
      const correct = quizData[currentIndex].answer;
      const buttons = [...answerButtons.querySelectorAll('button')];
      buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) {
          btn.classList.add('correct');
        }
      });
      // Move to next question after a short delay
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
    if (btn.textContent === correct) {
      btn.classList.add('correct');
    }
    if (btn.textContent === selected && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });

  setTimeout(() => showFeedback(isCorrect), 1000);
}

function showFeedback(correct) {
  if (correct) {
    correctAnswers++;
    playCorrectSound();
    feedback.textContent = '✅ Correct!';
    setTimeout(nextQuestion, 1500);
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
  } else {
    if (quizActive && currentIndex >= quizData.length) {
      const best = Math.max(correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
      localStorage.setItem('bestScore', best);
      quizCard.classList.add('hidden');
      resultsCard.classList.remove('hidden');
      scoreSummary.textContent = `You scored ${correctAnswers} out of ${quizData.length}. Best: ${best}`;
      playAgainBtn.textContent = "Try Again";
    }
  }
}

function resetQuiz() {
  quizData = [];
  currentIndex = 0;
  correctAnswers = 0;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  feedback.textContent = '';
  countdown.textContent = '';
  quizActive = false;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const helpChartModal = document.getElementById('help-chart-modal');
  const closeHelpChartBtn = document.getElementById('close-help-chart');
  const helpFeedback = document.getElementById('help-feedback');

  initializeUI();
  bindUIEvents();

  // Attach event listener here since the element is now defined
  closeHelpChartBtn.addEventListener('click', () => {
    helpChartModal.classList.add('hidden');
    const helpScaleChart = document.getElementById('help-scale-chart');
    if (helpScaleChart) helpScaleChart.classList.add('hidden');
    isPaused = false;
    showQuestion();
  });

  // Modify the helpBtn event binding to use scoped variables
  helpBtn.addEventListener('click', () => {
    if (isPaused) return;
    isPaused = true;
    clearTimeout(timer);
    clearInterval(countdownInterval);

    // Update chart for the current question's key and degree, not just selected key
    const helpScaleChart = document.getElementById('help-scale-chart');
    const current = quizData[currentIndex];
    const inferredKey = (levelSelect.value === 'hard')
      ? current.answer
      : current.question.match(/key of (\w[#b]?)/)?.[1] || current.answer;
    const tempKeyIndex = keys.indexOf(inferredKey);
    if (tempKeyIndex !== -1) {
      keySelect.value = inferredKey;
    }
    updateChart(helpScaleChart);
    if (helpScaleChart) helpScaleChart.classList.remove('hidden');
    helpFeedback.textContent = `ℹ️ Answer: ${quizData[currentIndex].answer}`;
    helpChartModal.classList.remove('hidden');
  });
});
