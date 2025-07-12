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
const totalTimer = document.getElementById('total-timer');

// Timer-related elements and constants
// Only the totalTimer (now in header) is used for the active quiz timer.

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

  // Ensure piano keys UI updates responsively on window resize
  window.addEventListener('resize', () => {
    if (!quizCard.classList.contains('hidden')) {
      updateInputUI();
    }
  });

  // Constrain the height of main UI cards
  ['settings-card', 'quiz-card', 'results-card'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.maxHeight = '95vh';
      el.style.overflowY = 'auto';
    }
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
    startTotalTimer();
    quizActive = true;
    // Generate enough questions to last full 3 minutes (no question count limit)
    generateQuiz(levelSelect.value, 200); // Generate enough questions to last full 3 minutes
    if (quizData.length === 0) {
      alert("⚠️ No questions generated. Please check your settings.");
      return;
    }
    settingsCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    quizCard.classList.add('full-width');
    updateInputUI();
    showQuestion();
    startMetronome();
  });
  closeQuizBtn.addEventListener('click', () => {
    clearTimeout(timer);
    clearInterval(countdownInterval);
    clearInterval(metronomeInterval);
    if (totalTimer && totalTimer.intervalId) {
      clearInterval(totalTimer.intervalId);
    }
    quizCard.classList.add('hidden');
    quizCard.classList.remove('full-width');
    quizActive = false;

    // Adjust quizData to include only questions attempted
    const attemptedCount = currentIndex + 1;
    const displayedQuizData = quizData.slice(0, attemptedCount);

    // Manually end quiz with accurate count
    const best = Math.max(correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);
    resultsCard.classList.remove('hidden');
    const elapsedTime = ((performance.now() - quizStartTime) / 1000).toFixed(1);
    scoreSummary.innerHTML = `
      <div style="font-size: 1.2em; margin-bottom: 16px;">🏆 Best Score: <strong>${best}</strong></div>
      <div>✅ Correct: <strong>${correctAnswers}</strong></div>
      <div>❌ Incorrect: <strong>${attemptedCount - correctAnswers}</strong></div>
      <div>⏱️ Time: <strong>${elapsedTime}</strong> seconds</div>
    `;

    // Make sure settings are hidden and results are shown
    settingsCard.classList.add('hidden');
  });
  playAgainBtn.addEventListener('click', () => {
    quizCard.classList.remove('full-width');
    resultsCard.classList.add('hidden');
    settingsCard.classList.remove('hidden');
  });
}

// ================================
// 3. UI Helpers
// ================================
function populateKeys() {
  keySelect.innerHTML = '';
  
  // Add "Random" as the first and selected option
  const randomOption = document.createElement('option');
  randomOption.value = 'random';
  randomOption.textContent = 'Random';
  randomOption.selected = true;
  keySelect.appendChild(randomOption);

  // Add remaining key options
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
    // Dynamically calculate number of white keys that fit based on quiz card width
    const containerWidth = document.getElementById('quiz-card').clientWidth * 0.9;
    const whiteKeyWidth = 40;
    const maxWhiteKeys = Math.floor(containerWidth / whiteKeyWidth);
    const whiteNotePattern = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotePattern = ['Db', 'Eb', '', 'F#', 'Ab', 'Bb', ''];

    let whiteNotes = [];
    let blackNotes = [];

    // Ensure piano starts and ends with a white key (new logic)
    whiteNotes = [];
    blackNotes = [];

    while (whiteNotes.length < maxWhiteKeys) {
      const index = whiteNotes.length % whiteNotePattern.length;
      whiteNotes.push(whiteNotePattern[index]);
      blackNotes.push(blackNotePattern[index]);
    }

    // Ensure last key is a white key (remove trailing black if needed)
    if (blackNotes[blackNotes.length - 1] !== '') {
      blackNotes[blackNotes.length - 1] = '';
    }

    // Filter quiz options to only include those currently displayed (both white and black notes)
    if (quizData[currentIndex]) {
      const visibleNotes = [...whiteNotes, ...blackNotes.filter(note => note !== '')];
      quizData[currentIndex].options = quizData[currentIndex].options.filter(opt => visibleNotes.includes(opt));
    }

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
  } else if (selectedInputType === 'bass') {
    document.getElementById('bass-ui')?.classList.remove('hidden');
    const container = document.getElementById('bass-ui');
    container.innerHTML = '';

    const tuning = ['G', 'D', 'A', 'E'];
    const frets = 7;

    const fretboard = document.createElement('div');
    fretboard.className = 'bass-fretboard';

    tuning.forEach((openNote, stringIdx) => {
      const stringDiv = document.createElement('div');
      stringDiv.className = 'bass-string';
      const startIndex = notes.indexOf(openNote);

      for (let fret = 0; fret <= frets; fret++) {
        const noteIndex = (startIndex + fret) % notes.length;
        const note = notes[noteIndex];
        const fretDiv = document.createElement('div');
        fretDiv.className = 'bass-fret';
        fretDiv.dataset.note = note;
        fretDiv.textContent = note;
        fretDiv.onclick = () => handleNoteClick(note);
        stringDiv.appendChild(fretDiv);
      }

      fretboard.appendChild(stringDiv);
    });

    // Add nut line as the first child inside fretboard after all strings are added
    const nutLine = document.createElement('div');
    nutLine.className = 'nut-line';
    fretboard.insertBefore(nutLine, fretboard.firstChild);

    // Add fret wire lines after the nut for frets 1 through 7
    for (let i = 1; i <= frets; i++) {
      const wire = document.createElement('div');
      wire.className = 'fret-wire';
      wire.style.left = `calc(${(i / (frets + 1)) * 100}%)`;
      fretboard.appendChild(wire);
    }

    // Add central fret markers for 3rd, 5th, and 7th frets, centered
    const markerFrets = [3, 5, 7];
    markerFrets.forEach(fretNum => {
      const marker = document.createElement('div');
      marker.className = 'fret-marker';
      marker.style.left = `calc(${(fretNum + 0.5) / (frets + 1) * 100}%)`;
      marker.style.top = '50%';
      fretboard.appendChild(marker);
    });

    container.appendChild(fretboard);

    // Add fret label row below the fretboard
    const labelRow = document.createElement('div');
    labelRow.className = 'fret-label-row';
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.marginTop = '4px';

    for (let i = 0; i <= frets; i++) {
      const label = document.createElement('div');
      label.className = 'fret-label';
      label.textContent = i;
      label.style.flex = '1';
      label.style.textAlign = 'center';
      labelRow.appendChild(label);
    }
    container.appendChild(labelRow);
  }
}

function handleNoteClick(note) {
  const correct = quizData[currentIndex].answer;
  const keys = document.querySelectorAll('.white-key, .black-key');
  keys.forEach(k => k.disabled = true);
  // Also disable bass frets
  const frets = document.querySelectorAll('.bass-fret');
  frets.forEach(f => f.disabled = true);

  // Select all visible keys/frets with the selected and correct notes
  const selectedKeys = document.querySelectorAll(`[data-note="${note}"]`);
  const correctKeys = document.querySelectorAll(`[data-note="${correct}"]`);

  if (note === correct) {
    playCorrectSound();
    selectedKeys.forEach(key => key.classList.add('correct'));
    document.querySelectorAll(`.bass-fret[data-note="${note}"]`).forEach(f => f.classList.add('correct'));
    feedback.textContent = '✅ Correct!';
    correctAnswers++;
    setTimeout(() => {
      selectedKeys.forEach(key => key.classList.remove('correct'));
      document.querySelectorAll(`.bass-fret[data-note="${note}"]`).forEach(f => f.classList.remove('correct'));
      nextQuestion();
    }, 300);
  } else {
    playIncorrectSound();
    selectedKeys.forEach(key => key.classList.add('incorrect'));
    document.querySelectorAll(`.bass-fret[data-note="${note}"]`).forEach(f => f.classList.add('incorrect'));
    correctKeys.forEach(key => key.classList.add('correct'));
    document.querySelectorAll(`.bass-fret[data-note="${correct}"]`).forEach(f => f.classList.add('correct'));
    feedback.textContent = `❌ Incorrect. Answer: ${correct}`;
    setTimeout(() => {
      selectedKeys.forEach(key => key.classList.remove('incorrect'));
      document.querySelectorAll(`.bass-fret[data-note="${note}"]`).forEach(f => f.classList.remove('incorrect'));
      correctKeys.forEach(key => key.classList.remove('correct'));
      document.querySelectorAll(`.bass-fret[data-note="${correct}"]`).forEach(f => f.classList.remove('correct'));
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
  let fixedKey;
  if (level === 'easy') {
    fixedKey = keySelect.value === 'random' ? randomChoice(keys) : keySelect.value;
  }
  for (let i = 0; i < count; i++) {
    let degree, key;
    if (level === 'degree-training') {
      degree = selectedDegree;
      key = randomChoice(keys);
    } else {
      degree = Math.floor(Math.random() * 7) + 1;
      key = (level === 'easy') ? fixedKey : randomChoice(keys);
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
  // Only the total timer is displayed; per-question countdown is not shown.
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
  // No countdown display or interval
  const seconds = 7;
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
  const elapsedTime = (performance.now() - quizStartTime) / 1000;
  if (quizActive && elapsedTime >= 180) {
    endQuiz();
  } else if (currentIndex < quizData.length) {
    showQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  const best = Math.max(correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
  localStorage.setItem('bestScore', best);
  quizCard.classList.add('hidden');
  resultsCard.classList.remove('hidden');
  const elapsedTime = ((performance.now() - quizStartTime) / 1000).toFixed(1);
  scoreSummary.innerHTML = `
    <div style="font-size: 1.2em; margin-bottom: 16px;">🏆 Best Score: <strong>${best}</strong></div>
    <div>✅ Correct: <strong>${correctAnswers}</strong></div>
    <div>❌ Incorrect: <strong>${quizData.length - correctAnswers}</strong></div>
    <div>⏱️ Time: <strong>${elapsedTime}</strong> seconds</div>
  `;
  playAgainBtn.textContent = "Try Again";
}

function resetQuiz() {
  quizData = [];
  currentIndex = 0;
  correctAnswers = 0;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  clearInterval(metronomeInterval);
  if (totalTimer && totalTimer.intervalId) {
    clearInterval(totalTimer.intervalId);
  }
  if (totalTimer) {
    totalTimer.textContent = '';
  }
  feedback.textContent = '';
  // Removed: countdown.textContent = '';
  quizActive = false;
  // quizStartTime is set when quiz starts, so no need to reset here unless tracking elapsed time between quizzes
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


// ================================
// 5.5. Total Timer
// ================================
function startTotalTimer() {
  const totalDuration = 120;
  function updateTotalTimer() {
    if (!totalTimer) return;

    const elapsed = Math.floor((performance.now() - quizStartTime) / 1000);
    const remaining = totalDuration - elapsed;
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    totalTimer.textContent = `${min}:${sec < 10 ? '0' + sec : sec} remaining`;

    if (remaining <= 15) {
      totalTimer.style.color = 'red';
      totalTimer.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.2)' },
        { transform: 'scale(1)' }
      ], { duration: 500, iterations: 1 });
    } else {
      totalTimer.style.color = 'black';
    }

    if (remaining <= 0 || !quizActive) {
      clearInterval(totalTimer.intervalId);
      totalTimer.textContent = '';
    }
  }
  updateTotalTimer();
  if (totalTimer) {
    totalTimer.intervalId = setInterval(updateTotalTimer, 1000);
  }
}