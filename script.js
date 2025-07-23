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

// Time Attack mode variables
let timeAttackCountdown = 0;
let timeAttackInterval = null;

// Tick-based timer variables
let totalTicks = 30;
let currentBpm = 130; //Adjusted from40 JC
let levelStartBpm = 130; //Adjusted from 40 JC

// Track streak of correct answers
let correctStreak = 0;

const levelSelect = document.getElementById('level-select');
const difficultySelect = document.getElementById('difficulty-select');
const keySelect = document.getElementById('key-select');
const keyContainer = document.getElementById('key-select-container');
const degreeContainer = document.getElementById('degree-select-container');
const attackTimeContainer = document.getElementById('attack-time-container');
const scaleChart = document.getElementById('scale-chart');
const startBtn = document.getElementById('start-btn');
const quizCard = document.getElementById('quiz-card');
const settingsCard = document.getElementById('settings-card');
const resultsCard = document.getElementById('results-card');
const closeQuizBtn = document.getElementById('close-quiz');
const questionDiv = document.getElementById('quiz-question');
const answerButtons = document.getElementById('answer-buttons');
const scoreSummary = document.getElementById('score-summary');
const playAgainBtn = document.getElementById('play-again');
const helpBtn = document.getElementById('help-btn');
const totalTimer = document.getElementById('total-timer');

// Fullscreen timer elements
const fullscreenTimer = document.getElementById('fullscreen-timer');
const timerDisplay = document.getElementById('timer-display');
const timerLabel = document.getElementById('timer-label');

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

  // Menu functionality
  const menuToggle = document.getElementById('menu-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');
  const menuClose = document.getElementById('menu-close');

  // Toggle menu on hamburger button click
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('hidden');
    menuToggle.classList.toggle('active');
  });

  // Close menu when clicking the close button
  menuClose.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  // Close menu when clicking outside the menu content
  dropdownMenu.addEventListener('click', (e) => {
    if (e.target === dropdownMenu) {
      dropdownMenu.classList.add('hidden');
      menuToggle.classList.remove('active');
    }
  });

  // Menu item handlers
  document.getElementById('menu-about').addEventListener('click', () => {
    alert('Scale Driller v1.0\nA music theory training app for learning scales and their degrees.');
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  document.getElementById('menu-help').addEventListener('click', () => {
    alert('How to use:\n1. Select your training mode and settings\n2. Choose your instrument input type\n3. Start the quiz and answer questions\n4. Use the ? button during quiz for hints');
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  document.getElementById('menu-time-mode').addEventListener('click', () => {
    // Toggle the submenu
    const submenu = document.getElementById('time-mode-submenu');
    const timeMode = document.getElementById('menu-time-mode');
    
    submenu.classList.toggle('hidden');
    timeMode.classList.toggle('active');
  });

    // Handle Time Attack selection
  document.getElementById('time-attack-option').addEventListener('click', () => {
    // Show attack time container for Time Attack mode
    attackTimeContainer.classList.remove('hidden');
    
    // Update the time mode indicator
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    timeModeIndicator.textContent = 'Time Attack';
    timeModeIndicator.classList.remove('hidden');
    
    // Close the menu
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
    
    alert('Time Attack activated! Each question must be answered within the selected time limit.');
  });

  // Handle BPM Challenge selection
  document.getElementById('bpm-challenge-option').addEventListener('click', () => {
    // Hide attack time container for BPM Challenge (normal mode)
    attackTimeContainer.classList.add('hidden');
    
    // Update the time mode indicator
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    timeModeIndicator.textContent = 'BPM Challenge';
    timeModeIndicator.classList.remove('hidden');
    
    // Close the menu
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
    
    alert('BPM Challenge activated! Answer speed increases with tempo progression.');
  });

  // Handle BPM Challenge selection
  document.getElementById('bpm-challenge-option').addEventListener('click', () => {
    // Show the time mode container but hide attack time container
    keyContainer.classList.add('hidden');
    degreeContainer.classList.add('hidden');
    timeModeContainer.classList.remove('hidden');
    attackTimeContainer.classList.add('hidden');
    
    // Set the time mode select to bpm-challenge
    const timeModeSelect = document.getElementById('time-mode-select');
    timeModeSelect.value = 'bpm-challenge';
    
    // Update the time mode indicator
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    timeModeIndicator.textContent = 'BPM Challenge';
    timeModeIndicator.classList.remove('hidden');
    
    // Close the menu
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
    
    alert('BPM Challenge activated! Answer speed increases with tempo progression.');
  });

  document.getElementById('menu-stats').addEventListener('click', () => {
    alert('Statistics feature coming soon!');
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  initializeUI();
  bindUIEvents();
  
  // Set BPM Challenge as default mode
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  if (timeModeIndicator) {
    timeModeIndicator.textContent = 'BPM Challenge';
    timeModeIndicator.classList.remove('hidden');
  }

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

  // Dynamically adjust .card padding based on .topShade height
  function adjustCardPadding() {
    document.querySelectorAll('.card').forEach(card => {
      const shade = card.querySelector('.topShade');
      if (shade) {
        const height = shade.offsetHeight;
        card.style.paddingTop = `${height}px`;
      }
    });
  }
  window.addEventListener('resize', adjustCardPadding);
  adjustCardPadding();
});

function initializeUI() {
  populateKeys();
  keySelect.selectedIndex = 0;
  updateChart();
  const level = levelSelect.value;
  if (level === 'easy') {
    keyContainer.classList.remove('hidden');
    degreeContainer.classList.add('hidden');
    attackTimeContainer.classList.add('hidden');
  } else if (level === 'degree-training') {
    keyContainer.classList.add('hidden');
    degreeContainer.classList.remove('hidden');
    attackTimeContainer.classList.add('hidden');
  } else {
    keyContainer.classList.add('hidden');
    degreeContainer.classList.add('hidden');
    attackTimeContainer.classList.add('hidden');
  }
}

function bindUIEvents() {
  levelSelect.addEventListener('change', () => {
    const level = levelSelect.value;
    if (level === 'easy') {
      keyContainer.classList.remove('hidden');
      degreeContainer.classList.add('hidden');
      attackTimeContainer.classList.add('hidden');
    } else if (level === 'degree-training') {
      keyContainer.classList.add('hidden');
      degreeContainer.classList.remove('hidden');
      attackTimeContainer.classList.add('hidden');
    } else {
      keyContainer.classList.add('hidden');
      degreeContainer.classList.add('hidden');
      attackTimeContainer.classList.add('hidden');
    }
    updateChart();
  });

  keySelect.addEventListener('change', updateChart);
  document.getElementById('scale-type').addEventListener('change', updateChart);
  closeQuizBtn.addEventListener('click', () => {
    clearTimeout(timer);
    clearInterval(countdownInterval);
    clearInterval(metronomeInterval);
    clearInterval(timeAttackInterval); // Clear Time Attack interval
    if (totalTimer && totalTimer.intervalId) {
      clearInterval(totalTimer.intervalId);
    }
    quizCard.classList.add('hidden');
    quizCard.classList.remove('full-width');
    hideFullscreenTimer(); // Hide the fullscreen timer
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
    // Ensure resultsCard is hidden (safeguard even if user lost)
    resultsCard.classList.add('hidden');  // Ensure it's hidden
    quizCard.classList.add('hidden');     // Hide quiz card in case it's still showing
    quizCard.classList.remove('full-width');
    settingsCard.classList.remove('hidden');

    // Reset all state values
    currentIndex = 0;
    correctAnswers = 0;
    quizData = [];
    totalTicks = 30;
    currentBpm = 40;
    clearTimeout(timer);
    clearInterval(countdownInterval);
    clearInterval(metronomeInterval);
    if (totalTimer && totalTimer.intervalId) {
      clearInterval(totalTimer.intervalId);
    }
    if (totalTimer) {
      totalTimer.textContent = '';
    }

    // Reset background color and transition
    quizCard.style.backgroundColor = '';
    quizCard.style.transition = '';

    // Hide help chart and quiz UI remnants
    const helpScaleChart = document.getElementById('help-scale-chart');
    const helpChartModal = document.getElementById('help-chart-modal');
    if (helpScaleChart) helpScaleChart.classList.add('hidden');
    if (helpChartModal) helpChartModal.classList.add('hidden');

    // Reset input selection and UI
    document.querySelectorAll('.input-icon').forEach(icon => icon.classList.remove('selected'));
    document.getElementById('custom-input-ui').innerHTML = '';
    document.querySelectorAll('.instrument-ui').forEach(el => el.classList.add('hidden'));
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
  const isCorrect = note === correct;
  const selectedKeys = document.querySelectorAll(`[data-note="${note}"]`);
  const correctKeys = document.querySelectorAll(`[data-note="${correct}"]`);

  if (isCorrect) {
    playCorrectSound();
    selectedKeys.forEach(key => key.classList.add('correct'));
    correctAnswers++;
    addTicksForCorrect();
    setTimeout(() => {
      selectedKeys.forEach(key => key.classList.remove('correct'));
      nextQuestion();
    }, 300);
  } else {
    playIncorrectSound();
    selectedKeys.forEach(key => key.classList.add('incorrect'));
    correctKeys.forEach(key => key.classList.add('correct'));
    subtractTicksForWrong();
    setTimeout(() => {
      selectedKeys.forEach(key => key.classList.remove('incorrect'));
      correctKeys.forEach(key => key.classList.remove('correct'));
      nextQuestion();
    }, 1000);
  }
}

document.querySelectorAll('.input-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.input-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    updateInputUI();
    startQuiz();
  });
});

function startQuiz() {
  resetQuiz();
  quizStartTime = performance.now();
  quizActive = true;
  
  // Ensure audio context is resumed
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  startTotalTimer();
  generateQuiz(levelSelect.value, 200);
  if (quizData.length === 0) {
    alert("⚠️ No questions generated. Please check your settings.");
    return;
  }
  settingsCard.classList.add('hidden');
  quizCard.classList.remove('hidden');
  quizCard.classList.add('full-width');
  updateInputUI();
  showFullscreenTimer(); // Show the fullscreen timer
  showQuestion();
  startMetronome();
}

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
  clearInterval(timeAttackInterval);
  
  // Check if we're in Time Attack mode
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
  
  if (isTimeAttack) {
    startTimeAttackCountdown();
  }
  
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
}

function checkAnswer(selected) {
  clearTimeout(timer);
  clearInterval(countdownInterval);
  clearInterval(timeAttackInterval); // Clear Time Attack countdown
  const correct = quizData[currentIndex].answer;
  const isCorrect = selected === correct;
  const buttons = [...answerButtons.querySelectorAll('button')];
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add('correct');
    if (btn.textContent === selected && !isCorrect) btn.classList.add('incorrect');
  });
  if (isCorrect) {
    addTicksForCorrect();
  } else {
    subtractTicksForWrong();
  }
  setTimeout(nextQuestion, 1000);
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
  clearInterval(metronomeInterval);
  hideFullscreenTimer(); // Hide the fullscreen timer
  resultsCard.classList.remove('hidden');
  const elapsedTime = ((performance.now() - quizStartTime) / 1000).toFixed(1);
  const attemptedCount = currentIndex + 1;
  scoreSummary.innerHTML = `
    <div style="font-size: 1.2em; margin-bottom: 16px;">🏆 Best Score: <strong>${best}</strong></div>
    <div>✅ Correct: <strong>${correctAnswers}</strong></div>
    <div>❌ Incorrect: <strong>${attemptedCount - correctAnswers}</strong></div>
    <div>⏱️ Time: <strong>${elapsedTime}</strong> seconds</div>
  `;
  playAgainBtn.textContent = "Try Again";
  // Auto-close the results card after 10 seconds
  setTimeout(() => {
    resultsCard.classList.add('hidden');
    settingsCard.classList.remove('hidden');
  }, 10000);
}

function resetQuiz() {
  quizData = [];
  levelStartBpm = 40;
  currentIndex = 0;
  correctAnswers = 0;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  clearInterval(metronomeInterval);
  clearInterval(timeAttackInterval); // Clear Time Attack interval
  if (totalTimer && totalTimer.intervalId) {
    clearInterval(totalTimer.intervalId);
  }
  if (totalTimer) {
    totalTimer.textContent = '';
  }
  // Removed: feedback.textContent = '';
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
    // Removed oscillator and vibration logic to avoid overlapping tick sounds.
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

// Play a short metronome tick sound
function playTickSound() {
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
// 5.5. Total Timer (Tick-based Metronome)
// ================================
function startTotalTimer() {
  // Reset tick and BPM at quiz start
  totalTicks = 100;
  currentBpm = 180; //adjusted from 100 to 180

  updateDisplay();

  function tickLoop() {
    if (!quizActive || totalTicks <= 0) {
      clearInterval(totalTimer.intervalId);
      quizActive = false;
      endQuiz();
      return;
    }

    totalTicks--;
    playTickSound();  // Play tick sound after decrement
    updateDisplay();

    // Removed BPM increase logic from here; BPM now only increases via addTicksForCorrect()

    const interval = (60 / currentBpm) * 1000;
    clearInterval(totalTimer.intervalId);
    totalTimer.intervalId = setInterval(tickLoop, interval);
  }

  // Only start the interval if the quiz is active and there are ticks left
  if (quizActive && totalTicks > 0) {
    const interval = (60 / currentBpm) * 1000;
    totalTimer.intervalId = setInterval(tickLoop, interval);
  }
}

function addTicksForCorrect() {
  correctStreak++;

  if (correctStreak > 0 && correctStreak % 3 === 0) {
    if (currentBpm >= 240) {
      levelStartBpm += 10;
      currentBpm = levelStartBpm;
      alert(`🔥 Level Up! Now at BPM: ${currentBpm}`);
    } else {
      currentBpm += 10;
    }
  }

  // Adjust bonus ticks based on difficulty (now 1-8 slider)
  const difficulty = parseInt(difficultySelect?.value || 4);
  const difficultyModifier = Math.floor((6 - difficulty) / 2);  // scale bonus: easier = more ticks

  let bonus = 3 + difficultyModifier;
  if (currentBpm >= 100 && currentBpm < 160) bonus = 4 + difficultyModifier;
  else if (currentBpm >= 160 && currentBpm < 210) bonus = 5 + difficultyModifier;
  else if (currentBpm >= 210) bonus = 6 + difficultyModifier;
  totalTicks += Math.max(1, bonus);  // Ensure at least 1 tick is added
  updateDisplay();
}

function subtractTicksForWrong() {
  correctStreak = 0;
  totalTicks = Math.max(0, totalTicks - 10);
  updateDisplay();
}

// ================================
// Global updateDisplay for totalTimer
// ================================
function updateDisplay() {
  if (!totalTimer) return;
  totalTimer.textContent = `🎵 Ticks: ${totalTicks} remaining | BPM: ${currentBpm}`;
  totalTimer.style.color = totalTicks <= 5 ? 'red' : 'black';

  // Update fullscreen timer
  updateFullscreenTimer();

  // Adjust background color of quizCard based on how close totalTicks is to 0 or max, with smooth transition
  const maxTicks = 100;
  const progress = Math.max(0, Math.min(1, totalTicks / maxTicks));

  // Transition from red (255, 0, 0) to blue (0, 0, 255)
  const red = Math.round(255 * (1 - progress));
  const green = 0;
  const blue = Math.round(255 * progress);

  const bgColor = `rgb(${red}, ${green}, ${blue})`;

  // Apply smooth transition
  quizCard.style.transition = 'background-color 0.3s ease';
  quizCard.style.backgroundColor = bgColor;
}

// ================================
// Fullscreen Timer Functions
// ================================
function updateFullscreenTimer() {
  if (!fullscreenTimer || !timerDisplay || !timerLabel) return;
  
  // Check if we're in Time Attack mode or BPM Challenge mode
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
  
  if (!isTimeAttack) {
    // BPM Challenge mode (default/normal mode) - show remaining ticks (number only)
    console.log('Updating ticks display to:', totalTicks); // Debug log
    updateTimerDisplay(totalTicks, '');
  }
  // For Time Attack mode, the timer is updated by startTimeAttackCountdown function
}

function updateTimerDisplay(number, label) {
  if (!timerDisplay || !timerLabel) return;
  
  console.log('Setting timer display:', number, label); // Debug log
  
  // Update content immediately without fade
  timerDisplay.textContent = number;
  timerLabel.textContent = label;
}

function showFullscreenTimer() {
  console.log('Showing fullscreen timer'); // Debug log
  if (fullscreenTimer) {
    fullscreenTimer.classList.remove('hidden');
    updateFullscreenTimer();
    console.log('Fullscreen timer visible:', !fullscreenTimer.classList.contains('hidden')); // Debug log
  }
}

function hideFullscreenTimer() {
  if (fullscreenTimer) {
    fullscreenTimer.classList.add('hidden');
  }
}

// ================================
// Time Attack Mode Functions
// ================================
function startTimeAttackCountdown() {
  const attackTimeSelect = document.getElementById('attack-time-select');
  timeAttackCountdown = parseInt(attackTimeSelect?.value || 5);
  
  // Update initial display
  updateTimerDisplay(timeAttackCountdown, '');
  
  // Start countdown
  timeAttackInterval = setInterval(() => {
    timeAttackCountdown--;
    updateTimerDisplay(timeAttackCountdown, '');
    
    if (timeAttackCountdown <= 0) {
      clearInterval(timeAttackInterval);
      // Auto-fail the question if time runs out
      timeAttackTimeOut();
    }
  }, 1000);
}

function timeAttackTimeOut() {
  // Disable all buttons
  const buttons = [...answerButtons.querySelectorAll('button')];
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === quizData[currentIndex].answer) {
      btn.classList.add('correct');
    }
  });
  
  // Show timeout feedback
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = '⏰ Time\'s up!';
    feedback.style.color = 'red';
  }
  
  // Don't add to correct answers, proceed with penalty
  subtractTicksForWrong();
  setTimeout(nextQuestion, 1500);
}
