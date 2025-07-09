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

const levelSelect = document.getElementById('level-select');
const keySelect = document.getElementById('key-select');
const keyContainer = document.getElementById('key-select-container');
const chartToggle = document.getElementById('toggle-chart');
const scaleChart = document.getElementById('scale-chart');
const scaleChartModal = document.getElementById('scale-chart-modal'); // modal
const closeScaleChartBtn = document.getElementById('close-scale-chart'); // close btn
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
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(100, audioCtx.currentTime); // deeper tone
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1.0); // longer duration
}

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
  const scaleType = document.getElementById('scale-type').value;
  const steps = scaleType === 'minor' ? scaleStepsMinor : scaleStepsMajor;
  let start = notes.indexOf(key);
  let scale = [key];
  for (let step of steps) {
    start = (start + step) % 12;
    scale.push(notes[start]);
  }
  return scale.slice(0, 7);
}

function updateChart() {
  const key = keySelect.value;
  const scaleType = document.getElementById('scale-type').value;
  const scale = getScale(key);
  scaleChart.innerHTML = `<strong>${key} ${scaleType.charAt(0).toUpperCase() + scaleType.slice(1)} Scale</strong><br>`;
  scale.forEach((note, idx) => {
    scaleChart.innerHTML += `<div>${idx + 1}: ${note}</div>`;
  });
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function generateQuiz(level, count) {
  quizData = [];
  for (let i = 0; i < count; i++) {
    const degree = Math.floor(Math.random() * 7) + 1;
    const key = level === 'easy' ? keySelect.value : randomChoice(keys);
    const scale = getScale(key);

    if (level === 'easy' || level === 'intermediate') {
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
    const best = Math.max(correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);
    quizCard.classList.add('hidden');
    resultsCard.classList.remove('hidden');
    scoreSummary.textContent = `You scored ${correctAnswers} out of ${quizData.length}. Best: ${best}`;
    playAgainBtn.textContent = "Try Again";
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
}

levelSelect.addEventListener('change', () => {
  keyContainer.style.display = levelSelect.value === 'easy' ? 'block' : 'none';
  updateChart();
});

keySelect.addEventListener('change', updateChart);
document.getElementById('scale-type').addEventListener('change', updateChart);

// --- Modal logic for scale chart ---
chartToggle.addEventListener('click', () => {
  updateChart();
  scaleChartModal.classList.remove('hidden');
});
closeScaleChartBtn.addEventListener('click', () => {
  scaleChartModal.classList.add('hidden');
  // Only remove overlay if quiz is not open
  if (quizCard.classList.contains('hidden')) {
  }
});

// --- Quiz logic ---
startBtn.addEventListener('click', () => {
  resetQuiz();
  generateQuiz(levelSelect.value, +document.getElementById('question-count').value);
  settingsCard.classList.add('hidden');
  quizCard.classList.remove('hidden');
  showQuestion();
});
closeQuizBtn.addEventListener('click', () => {
  resetQuiz();
  quizCard.classList.add('hidden');
  settingsCard.classList.remove('hidden');
});
playAgainBtn.addEventListener('click', () => {
  resultsCard.classList.add('hidden');
  settingsCard.classList.remove('hidden');
});

// --- Help Button Logic ---
helpBtn.addEventListener('click', () => {
  if (isPaused) return;
  isPaused = true;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  feedback.textContent = `ℹ️ Answer: ${quizData[currentIndex].answer}`;
  // Disable answer buttons while paused
  [...answerButtons.querySelectorAll('button')].forEach(btn => btn.disabled = true);
  setTimeout(() => {
    isPaused = false;
    showQuestion();
  }, 5000);
});

// --- Init ---
populateKeys();
keySelect.selectedIndex = 0;
updateChart();
keyContainer.style.display = levelSelect.value === 'easy' ? 'block' : 'none';
