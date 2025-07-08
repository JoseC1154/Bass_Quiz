// script.js

const levels = ['easy', 'intermediate', 'hard'];
const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F#', 'Ab', 'Bb', 'Db', 'Eb'];
const scaleSteps = [2, 2, 1, 2, 2, 2, 1];
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

const countdown = document.createElement('div');
countdown.id = 'countdown';
countdown.style.fontSize = '20px';
countdown.style.marginTop = '10px';
quizCard.appendChild(countdown);

const pauseBtn = document.createElement('button');
pauseBtn.id = 'pause-btn';
pauseBtn.textContent = '⏸ Pause';
pauseBtn.style.marginTop = '12px';
pauseBtn.onclick = togglePause;
quizCard.appendChild(pauseBtn);

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
  playTone(220);
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
  let start = notes.indexOf(key);
  let scale = [key];
  for (let step of scaleSteps) {
    start = (start + step) % 12;
    scale.push(notes[start]);
  }
  return scale.slice(0, 7);
}

function updateChart() {
  const key = keySelect.value;
  const scale = getScale(key);
  scaleChart.innerHTML = '';
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
    if (level === 'easy') {
      const key = keySelect.value;
      const scale = getScale(key);
      quizData.push({
        question: `What is degree ${degree} in the key of ${key}?`,
        answer: scale[degree - 1],
        options: shuffle(scale.slice())
      });
    } else if (level === 'intermediate') {
      const key = randomChoice(keys);
      const scale = getScale(key);
      quizData.push({
        question: `What is degree ${degree} in the key of ${key}?`,
        answer: scale[degree - 1],
        options: shuffle(scale.slice())
      });
    } else if (level === 'hard') {
      const key = randomChoice(keys);
      const scale = getScale(key);
      const note = scale[degree - 1];
      quizData.push({
        question: `${note} is the ${degree} degree of what key?`,
        answer: key,
        options: shuffle(keys.slice())
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
    if (!isPaused) showFeedback(false);
  }, seconds * 1000);
}

function checkAnswer(selected) {
  clearTimeout(timer);
  clearInterval(countdownInterval);
  const correct = quizData[currentIndex].answer;
  const isCorrect = selected === correct;
  showFeedback(isCorrect);
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

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    clearTimeout(timer);
    clearInterval(countdownInterval);
    pauseBtn.textContent = '▶ Resume';
  } else {
    showQuestion();
    pauseBtn.textContent = '⏸ Pause';
  }
}

levelSelect.addEventListener('change', () => {
  keyContainer.style.display = levelSelect.value === 'easy' ? 'block' : 'none';
  scaleChart.classList.add('hidden');
});

keySelect.addEventListener('change', updateChart);
chartToggle.addEventListener('click', () => {
  scaleChart.classList.toggle('hidden');
  updateChart();
});
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

// Init
populateKeys();
updateChart();
keyContainer.style.display = levelSelect.value === 'easy' ? 'block' : 'none';
