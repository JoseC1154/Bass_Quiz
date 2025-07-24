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

// Pause/Resume state management for help modal
let pausedTimerStates = {
  timeAttackCountdown: 0,
  wasTimeAttackActive: false,
  wasTotalTimerActive: false,
  wasMetronomeActive: false
};

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

// MIDI and Audio input variables
let midiAccess = null;
let audioContext = null;
let analyser = null;
let microphone = null;
let audioInputActive = false;
let midiInputActive = false;

// Note frequency mapping for audio input
const noteFrequencies = {
  'C': [65.41, 130.81, 261.63, 523.25, 1046.50],
  'Db': [69.30, 138.59, 277.18, 554.37, 1108.73],
  'D': [73.42, 146.83, 293.66, 587.33, 1174.66],
  'Eb': [77.78, 155.56, 311.13, 622.25, 1244.51],
  'E': [82.41, 164.81, 329.63, 659.25, 1318.51],
  'F': [87.31, 174.61, 349.23, 698.46, 1396.91],
  'F#': [92.50, 185.00, 369.99, 739.99, 1479.98],
  'G': [98.00, 196.00, 392.00, 783.99, 1567.98],
  'Ab': [103.83, 207.65, 415.30, 830.61, 1661.22],
  'A': [110.00, 220.00, 440.00, 880.00, 1760.00],
  'Bb': [116.54, 233.08, 466.16, 932.33, 1864.66],
  'B': [123.47, 246.94, 493.88, 987.77, 1975.53]
};

// Timer-related elements and constants
// Only the totalTimer (now in header) is used for the active quiz timer.

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ================================
// 2. Permission Request Functions
// ================================
async function requestMIDIPermission() {
  try {
    if (navigator.requestMIDIAccess) {
      if (!midiAccess) {
        midiAccess = await navigator.requestMIDIAccess();
        console.log('MIDI permission granted');
        
        // Update connection status
        updateMIDIStatus();
        
        // Listen for MIDI device changes
        midiAccess.onstatechange = updateMIDIStatus;
        
        // Set up MIDI input listeners
        setupMIDIInputs();
        
        // Show success feedback
        showPermissionFeedback('MIDI', true);
        
        // Update button states
        updateInputMethodButtons();
      }
    } else {
      console.log('MIDI not supported in this browser');
      showPermissionFeedback('MIDI', false, 'Not supported in this browser');
      updateInputMethodButtons();
    }
  } catch (error) {
    console.error('MIDI permission failed:', error);
    showPermissionFeedback('MIDI', false, error.message);
    updateInputMethodButtons();
  }
}

async function requestAudioPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Initialize audio context if not already done
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      microphone.connect(analyser);
    }
    
    audioInputActive = true;
    
    // Update status
    const statusElement = document.getElementById('audio-connection-status');
    const startBtn = document.getElementById('audio-start-btn');
    
    if (statusElement) {
      statusElement.textContent = '🎤 Audio: Connected';
      statusElement.style.color = 'green';
    }
    
    if (startBtn) {
      startBtn.textContent = 'Stop Audio Input';
    }
    
    startPitchDetection();
    showPermissionFeedback('Audio', true);
    
    console.log('Audio permission granted');
    
    // Update button states
    updateInputMethodButtons();
    
  } catch (error) {
    console.error('Audio permission failed:', error);
    showPermissionFeedback('Audio', false, error.message);
    updateInputMethodButtons();
  }
}

function showPermissionFeedback(permissionType, granted, errorMessage = '') {
  const notification = document.createElement('div');
  notification.className = 'permission-notification';
  
  if (granted) {
    notification.textContent = `${permissionType} permission granted! ✅`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
  } else {
    notification.textContent = `${permissionType} permission failed: ${errorMessage} ❌`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #dc3545, #e74c3c);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ================================
// 3. Input Method Button Management  
// ================================
function updateInputMethodButtons() {
  const touchBtn = document.getElementById('touch-input-btn');
  const midiBtn = document.getElementById('midi-input-btn');
  const micBtn = document.getElementById('mic-input-btn');
  const cableBtn = document.getElementById('cable-input-btn');
  
  // Touch is always available
  if (touchBtn) {
    touchBtn.disabled = false;
    touchBtn.title = 'Touch/Click Interface';
    touchBtn.style.opacity = '1';
  }
  
  // MIDI availability check
  if (midiBtn) {
    const midiSupported = navigator.requestMIDIAccess !== undefined;
    const midiConnected = midiAccess && Array.from(midiAccess.inputs.values()).length > 0;
    
    if (!midiSupported) {
      midiBtn.disabled = true;
      midiBtn.title = 'MIDI not supported in this browser';
      midiBtn.style.opacity = '0.5';
    } else if (!midiConnected && !midiAccess) {
      midiBtn.disabled = false;
      midiBtn.title = 'Click to request MIDI access';
      midiBtn.style.opacity = '0.7';
    } else if (!midiConnected && midiAccess) {
      midiBtn.disabled = true;
      midiBtn.title = 'No MIDI devices connected';
      midiBtn.style.opacity = '0.5';
    } else {
      midiBtn.disabled = false;
      midiBtn.title = 'MIDI Keyboard/Controller - Ready';
      midiBtn.style.opacity = '1';
    }
  }
  
  // Audio availability check
  const audioSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  
  if (micBtn) {
    if (!audioSupported) {
      micBtn.disabled = true;
      micBtn.title = 'Microphone access not supported in this browser';
      micBtn.style.opacity = '0.5';
    } else if (!audioInputActive) {
      micBtn.disabled = false;
      micBtn.title = 'Click to request microphone access';
      micBtn.style.opacity = '0.7';
    } else {
      micBtn.disabled = false;
      micBtn.title = 'Microphone/Audio Input - Ready';
      micBtn.style.opacity = '1';
    }
  }
  
  if (cableBtn) {
    if (!audioSupported) {
      cableBtn.disabled = true;
      cableBtn.title = 'Audio interface access not supported in this browser';
      cableBtn.style.opacity = '0.5';
    } else if (!audioInputActive) {
      cableBtn.disabled = false;
      cableBtn.title = 'Click to request audio interface access';
      cableBtn.style.opacity = '0.7';
    } else {
      cableBtn.disabled = false;
      cableBtn.title = 'Instrument Cable (Audio Interface) - Ready';
      cableBtn.style.opacity = '1';
    }
  }
}

function checkInputMethodCompatibility() {
  // Check current quiz settings to see which input methods make sense
  const level = levelSelect?.value;
  const selectedIcon = document.querySelector('.input-icon.selected');
  const iconType = selectedIcon?.dataset.type;
  
  // All input methods work with all quiz modes, but some combinations are more logical
  // This function can be extended later for more sophisticated compatibility checking
  
  console.log('Quiz level:', level, 'Icon type:', iconType, 'Input method:', currentInputMethod);
  
  // For now, just update button availability
  updateInputMethodButtons();
}

// ================================
// 4. Initialization
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

  // Time mode selection function
  function setTimeMode(mode) {
    // Remove active class from all time mode buttons
    document.querySelectorAll('.time-mode-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected button
    const selectedBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
    
    // Update the time mode indicator
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    
    if (mode === 'time-attack') {
      // Show attack time container for Time Attack mode
      attackTimeContainer.classList.remove('hidden');
      timeModeIndicator.textContent = 'Time Attack';
      timeModeIndicator.classList.remove('hidden');
      alert('Time Attack activated! Each question must be answered within the selected time limit.');
    } else if (mode === 'bpm-challenge') {
      // Hide attack time container for BPM Challenge (normal mode)
      attackTimeContainer.classList.add('hidden');
      timeModeIndicator.textContent = 'BPM Challenge';
      timeModeIndicator.classList.remove('hidden');
      alert('BPM Challenge activated! Answer speed increases with tempo progression.');
    }
  }

  // Add event listeners for time mode buttons
  document.querySelectorAll('.time-mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      setTimeMode(mode);
    });
  });

  document.getElementById('menu-stats').addEventListener('click', () => {
    alert('Statistics feature coming soon!');
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  // Input Method Selection Handlers
  document.querySelectorAll('.input-method-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      // Check if button is disabled
      if (btn.disabled) {
        return;
      }
      
      // Remove active class from all buttons
      document.querySelectorAll('.input-method-btn').forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      const inputType = btn.dataset.input;
      
      // Request permissions immediately for non-touch modes
      if (inputType === 'midi') {
        await requestMIDIPermission();
      } else if (inputType === 'audio' || inputType === 'instrument') {
        await requestAudioPermission();
      }
      
      setInputMethod(inputType);
      
      // Show feedback
      const inputName = btn.textContent.trim();
      showInputMethodFeedback(inputName);
      
      // Update button states after permission request
      updateInputMethodButtons();
    });
  });

  initializeUI();
  bindUIEvents();
  initializeMIDI();
  initializeAudioInput();
  
  // Set BPM Challenge as default mode
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  if (timeModeIndicator) {
    timeModeIndicator.textContent = 'BPM Challenge';
    timeModeIndicator.classList.remove('hidden');
  }
  
  // Initialize default input method
  setInputMethod('touch');
  
  // Update input method button states
  updateInputMethodButtons();

  document.body.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  closeHelpChartBtn.addEventListener('click', () => {
    helpChartModal.classList.add('hidden');
    const helpScaleChart = document.getElementById('help-scale-chart');
    if (helpScaleChart) helpScaleChart.classList.add('hidden');
    
    // Remove modal classes to restore layout
    document.body.classList.remove('modal-open');
    const quizCard = document.getElementById('quiz-card');
    if (quizCard) quizCard.classList.remove('modal-behind');
    
    isPaused = false;
    resumeAllTimersAfterHelp();
    showQuestion();
  });

  helpBtn.addEventListener('click', () => {
    if (isPaused) return;
    isPaused = true;
    
    // Add modal classes to prevent layout shifts
    document.body.classList.add('modal-open');
    const quizCard = document.getElementById('quiz-card');
    if (quizCard) quizCard.classList.add('modal-behind');
    
    pauseAllTimersForHelp();
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
    
    // Stop MIDI and audio input
    stopAudioInput();
    
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
    // Stop the quiz and clean up all intervals
    quizActive = false;
    clearTimeout(timer);
    clearInterval(countdownInterval);
    clearInterval(metronomeInterval);
    clearInterval(timeAttackInterval);
    if (totalTimer && totalTimer.intervalId) {
      clearInterval(totalTimer.intervalId);
    }
    
    // Hide all cards first
    resultsCard.classList.add('hidden');
    quizCard.classList.add('hidden');
    quizCard.classList.remove('full-width');
    
    // Hide fullscreen timer
    hideFullscreenTimer();
    
    // Stop audio input
    stopAudioInput();

    // Reset all state values
    currentIndex = 0;
    correctAnswers = 0;
    correctStreak = 0;
    quizData = [];
    totalTicks = 100;
    currentBpm = 180;
    levelStartBpm = 180;
    
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
    
    // Show settings card last to ensure it's the only visible card
    setTimeout(() => {
      settingsCard.classList.remove('hidden');
    }, 100);
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
  
  // Use currentInputMethod to determine UI display
  let uiType;
  
  switch(currentInputMethod) {
    case 'touch':
      // For touch mode, use the selected instrument icon
      const selectedIcon = document.querySelector('.input-icon.selected');
      uiType = selectedIcon ? selectedIcon.dataset.type : 'keys';
      break;
    case 'midi':
      // For MIDI mode, show MIDI UI
      uiType = 'midi';
      break;
    case 'audio':
    case 'instrument':
      // For audio/instrument modes, show audio UI
      uiType = 'audio';
      break;
    default:
      uiType = 'keys';
  }
  
  console.log('Input method:', currentInputMethod, 'UI type:', uiType);
  
  if (uiType === 'keys') {
    document.getElementById('keys-ui')?.classList.remove('hidden');
  } else if (uiType === 'midi') {
    document.getElementById('midi-ui')?.classList.remove('hidden');
    // Reset MIDI display
    const midiDisplay = document.getElementById('midi-note-display');
    if (midiDisplay) {
      midiDisplay.textContent = 'Play a note on your MIDI device';
    }
  } else if (uiType === 'audio') {
    document.getElementById('audio-ui')?.classList.remove('hidden');
    // Reset audio display
    const audioDisplay = document.getElementById('audio-note-display');
    const freqDisplay = document.getElementById('audio-frequency-display');
    if (audioDisplay) {
      audioDisplay.textContent = 'Play a note on your instrument';
    }
    if (freqDisplay) {
      freqDisplay.textContent = 'Frequency: --';
    }
    
    // Auto-start audio input if using instrument cable method and not already active
    if (currentInputMethod === 'instrument' && !audioInputActive) {
      setTimeout(() => {
        toggleAudioInput();
      }, 500);
    }
  } else if (uiType === 'piano') {
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
  } else if (uiType === 'bass') {
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
    // Update input method based on icon selection
    const inputType = icon.dataset.type;
    let methodType;
    
    switch(inputType) {
      case 'keys':
      case 'piano':
      case 'bass':
      case 'guitar':
        methodType = 'touch';
        break;
      case 'midi':
        methodType = 'midi';
        break;
      case 'audio':
        methodType = 'audio';
        break;
    }
    
    if (methodType) {
      currentInputMethod = methodType;
      
      // Update menu button states
      document.querySelectorAll('.input-method-btn').forEach(btn => btn.classList.remove('active'));
      const menuBtn = document.querySelector(`.input-method-btn[data-input="${methodType}"]`);
      if (menuBtn) {
        menuBtn.classList.add('active');
      }
    }
    
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
  
  generateQuiz(levelSelect.value, 200);
  if (quizData.length === 0) {
    alert("⚠️ No questions generated. Please check your settings.");
    quizActive = false; // Reset quiz active state if no questions generated
    return;
  }
  
  // Only start timers after confirming quiz data was generated successfully
  startTotalTimer();
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
    playCorrectSound();
    correctAnswers++;
    addTicksForCorrect();
  } else {
    playIncorrectSound();
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
  // Stop all timers and intervals to prevent tick sounds after quiz completion
  quizActive = false;
  clearTimeout(timer);
  clearInterval(countdownInterval);
  clearInterval(metronomeInterval);
  clearInterval(timeAttackInterval); // Clear Time Attack interval
  if (totalTimer && totalTimer.intervalId) {
    clearInterval(totalTimer.intervalId); // Clear BPM Challenge timer
  }
  
  const best = Math.max(correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
  localStorage.setItem('bestScore', best);
  quizCard.classList.add('hidden');
  quizCard.classList.remove('full-width'); // Remove fullscreen layout
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
  
  // Clean up MIDI and audio
  stopAudioInput();
  
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
// 8. MIDI Input Functions
// ================================
async function initializeMIDI() {
  try {
    if (navigator.requestMIDIAccess) {
      console.log('MIDI API available - permissions will be requested when MIDI input is selected');
      // Don't request access automatically - wait for user to select MIDI input method
    } else {
      console.log('MIDI not supported in this browser');
      document.getElementById('midi-connection-status').textContent = '🎹 MIDI: Not Supported';
    }
  } catch (error) {
    console.error('MIDI initialization failed:', error);
    document.getElementById('midi-connection-status').textContent = '🎹 MIDI: Error';
  }
}

function updateMIDIStatus() {
  if (!midiAccess) return;
  
  const inputs = Array.from(midiAccess.inputs.values());
  const statusElement = document.getElementById('midi-connection-status');
  const deviceListElement = document.getElementById('midi-device-list');
  
  if (inputs.length > 0) {
    statusElement.textContent = '🎹 MIDI: Connected';
    statusElement.style.color = 'green';
    
    const deviceNames = inputs.map(input => input.name).join(', ');
    deviceListElement.textContent = `Devices: ${deviceNames}`;
  } else {
    statusElement.textContent = '🎹 MIDI: No Devices';
    statusElement.style.color = 'orange';
    deviceListElement.textContent = 'Connect a MIDI device';
  }
  
  // Update input method button states when MIDI status changes
  updateInputMethodButtons();
}

function setupMIDIInputs() {
  if (!midiAccess) return;
  
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = handleMIDIMessage;
  }
}

function handleMIDIMessage(message) {
  const [command, note, velocity] = message.data;
  
  // Note on message (144 + channel) with velocity > 0
  if ((command & 0xf0) === 0x90 && velocity > 0) {
    const noteName = midiNoteToName(note);
    console.log('MIDI Note:', noteName);
    
    // Update display
    document.getElementById('midi-note-display').textContent = `Note: ${noteName}`;
    
    // Check if we're in quiz mode and MIDI input method is selected
    if (currentInputMethod === 'midi' && !quizCard.classList.contains('hidden')) {
      handleNoteInput(noteName);
    }
  }
}

function midiNoteToName(midiNote) {
  const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const noteName = noteNames[midiNote % 12];
  return noteName;
}

// ================================
// 9. Audio Input Functions
// ================================
async function initializeAudioInput() {
  try {
    // Set up audio input controls
    const audioStartBtn = document.getElementById('audio-start-btn');
    const sensitivitySlider = document.getElementById('audio-sensitivity');
    const sensitivityValue = document.getElementById('sensitivity-value');
    
    if (audioStartBtn) {
      audioStartBtn.addEventListener('click', toggleAudioInput);
    }
    
    if (sensitivitySlider) {
      sensitivitySlider.addEventListener('input', (e) => {
        sensitivityValue.textContent = e.target.value;
      });
    }
    
    console.log('Audio input initialized');
  } catch (error) {
    console.error('Audio input initialization failed:', error);
  }
}

async function toggleAudioInput() {
  const statusElement = document.getElementById('audio-connection-status');
  const startBtn = document.getElementById('audio-start-btn');
  
  if (!audioInputActive) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      microphone.connect(analyser);
      
      audioInputActive = true;
      statusElement.textContent = '🎤 Audio: Connected';
      statusElement.style.color = 'green';
      startBtn.textContent = 'Stop Audio Input';
      
      startPitchDetection();
      
    } catch (error) {
      console.error('Audio input failed:', error);
      statusElement.textContent = '🎤 Audio: Permission Denied';
      statusElement.style.color = 'red';
    }
  } else {
    stopAudioInput();
  }
}

function stopAudioInput() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  audioInputActive = false;
  const statusElement = document.getElementById('audio-connection-status');
  const startBtn = document.getElementById('audio-start-btn');
  
  statusElement.textContent = '🎤 Audio: Disconnected';
  statusElement.style.color = 'black';
  startBtn.textContent = 'Start Audio Input';
  
  document.getElementById('audio-note-display').textContent = 'Play a note on your instrument';
  document.getElementById('audio-frequency-display').textContent = 'Frequency: --';
  
  // Update input method button states when audio stops
  updateInputMethodButtons();
}

function startPitchDetection() {
  if (!audioInputActive || !analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function detectPitch() {
    if (!audioInputActive) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    const sensitivity = parseFloat(document.getElementById('audio-sensitivity').value);
    const threshold = 255 * sensitivity;
    
    // Find the frequency with the highest amplitude
    let maxAmplitude = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxAmplitude && dataArray[i] > threshold) {
        maxAmplitude = dataArray[i];
        maxIndex = i;
      }
    }
    
    if (maxAmplitude > threshold) {
      const frequency = (maxIndex * audioContext.sampleRate) / (analyser.fftSize * 2);
      const noteName = frequencyToNote(frequency);
      
      document.getElementById('audio-frequency-display').textContent = `Frequency: ${frequency.toFixed(1)} Hz`;
      
      if (noteName) {
        document.getElementById('audio-note-display').textContent = `Note: ${noteName}`;
        
        // Check if we're in quiz mode and audio/instrument input method is selected
        if ((currentInputMethod === 'audio' || currentInputMethod === 'instrument') && !quizCard.classList.contains('hidden')) {
          handleNoteInput(noteName);
        }
      }
    }
    
    requestAnimationFrame(detectPitch);
  }
  
  detectPitch();
}

function frequencyToNote(frequency) {
  let closestNote = null;
  let minDifference = Infinity;
  
  for (const [noteName, frequencies] of Object.entries(noteFrequencies)) {
    for (const noteFreq of frequencies) {
      const difference = Math.abs(frequency - noteFreq);
      const percentDifference = difference / noteFreq;
      
      // Allow 5% tolerance for note detection
      if (percentDifference < 0.05 && difference < minDifference) {
        minDifference = difference;
        closestNote = noteName;
      }
    }
  }
  
  return closestNote;
}

// ================================
// 10. Universal Note Input Handler
// ================================
function handleNoteInput(noteName) {
  if (!quizData[currentIndex]) return;
  
  console.log('Note input received:', noteName, 'Current input method:', currentInputMethod);
  
  const correct = quizData[currentIndex].answer;
  const isCorrect = noteName === correct;
  
  // Visual feedback
  const noteDisplays = document.querySelectorAll('#midi-note-display, #audio-note-display');
  noteDisplays.forEach(display => {
    display.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    display.style.borderColor = isCorrect ? '#28a745' : '#dc3545';
    display.style.color = isCorrect ? '#155724' : '#721c24';
  });
  
  // Audio feedback
  if (isCorrect) {
    playCorrectSound();
    correctAnswers++;
    addTicksForCorrect();
  } else {
    playIncorrectSound();
    subtractTicksForWrong();
  }
  
  // Show correct answer briefly if wrong
  if (!isCorrect) {
    noteDisplays.forEach(display => {
      const originalText = display.textContent;
      display.textContent = `Correct: ${correct}`;
      setTimeout(() => {
        display.textContent = originalText;
      }, 1500);
    });
  }
  
  setTimeout(() => {
    // Reset visual feedback
    noteDisplays.forEach(display => {
      display.style.backgroundColor = '#e8f4fd';
      display.style.borderColor = '#4a90e2';
      display.style.color = 'black';
    });
    
    nextQuestion();
  }, isCorrect ? 300 : 2000);
}

// ================================
// 11. Input Method Management
// ================================
let currentInputMethod = 'touch'; // Default to touch

function setInputMethod(inputType) {
  currentInputMethod = inputType;
  
  // Preserve the current icon selection - don't automatically reset to keys
  // The user's icon selection should remain as they chose it
  
  // Update input method display in quiz header
  updateInputMethodDisplay();
  
  // If quiz is active, update the input UI
  if (!quizCard.classList.contains('hidden')) {
    updateInputUI();
  }
  
  console.log('Input method set to:', inputType);
}

function updateInputMethodDisplay() {
  const inputMethodDisplay = document.getElementById('input-method-display');
  if (!inputMethodDisplay) return;
  
  // Map input method codes to user-friendly names
  const inputMethodNames = {
    'touch': 'Touch',
    'midi': 'MIDI',
    'audio': 'Audio',
    'instrument': 'Audio'
  };
  
  const displayName = inputMethodNames[currentInputMethod] || 'Touch';
  inputMethodDisplay.textContent = displayName;
}

function showInputMethodFeedback(inputName) {
  // Create a temporary notification
  const notification = document.createElement('div');
  notification.className = 'input-method-notification';
  notification.textContent = `${inputName} input activated`;
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 8px 24px rgba(40, 167, 69, 0.4);
    z-index: 10000;
    animation: fadeInOut 2s ease-in-out;
  `;
  
  // Add animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove notification after animation
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }, 2000);
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
    
    // Only play tick sound in BPM Challenge mode, not in Time Attack mode
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
    
    if (!isTimeAttack) {
      playTickSound();  // Play tick sound only in BPM Challenge mode
    }
    
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
  
  // Check if fullscreen timer is active (not hidden)
  const isFullscreenTimerActive = fullscreenTimer && !fullscreenTimer.classList.contains('hidden');
  
  if (isFullscreenTimerActive) {
    // When fullscreen timer is active, hide the text or show minimal info
    totalTimer.textContent = '';
    totalTimer.style.display = 'none';
  } else {
    // When fullscreen timer is not active, show the full text
    totalTimer.textContent = `🎵 Ticks: ${totalTicks} remaining | BPM: ${currentBpm}`;
    totalTimer.style.display = 'block';
  }
  
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
  
  // Start countdown - tick sound will play once per second during countdown
  timeAttackInterval = setInterval(() => {
    timeAttackCountdown--;
    updateTimerDisplay(timeAttackCountdown, '');
    
    // Play tick sound once per second
    playTickSound();
    
    if (timeAttackCountdown <= 0) {
      clearInterval(timeAttackInterval);
      // Auto-fail the question if time runs out
      timeAttackTimeOut();
    }
  }, 1000);
}

function timeAttackTimeOut() {
  // Play incorrect sound for timeout
  playIncorrectSound();
  
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

// ================================
// Help Modal Pause/Resume Functions
// ================================
function pauseAllTimersForHelp() {
  if (!quizActive) return;
  
  // Store current states
  pausedTimerStates.timeAttackCountdown = timeAttackCountdown;
  pausedTimerStates.wasTimeAttackActive = timeAttackInterval !== null;
  pausedTimerStates.wasTotalTimerActive = totalTimer && totalTimer.intervalId;
  pausedTimerStates.wasMetronomeActive = metronomeInterval !== null;
  
  // Clear all active timers
  clearTimeout(timer);
  clearInterval(countdownInterval);
  clearInterval(timeAttackInterval);
  clearInterval(metronomeInterval);
  if (totalTimer && totalTimer.intervalId) {
    clearInterval(totalTimer.intervalId);
    totalTimer.intervalId = null;
  }
  
  // Reset interval variables
  timeAttackInterval = null;
  metronomeInterval = null;
}

function resumeAllTimersAfterHelp() {
  if (!quizActive) return;
  
  // Resume Time Attack countdown if it was active
  if (pausedTimerStates.wasTimeAttackActive) {
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
    
    if (isTimeAttack && pausedTimerStates.timeAttackCountdown > 0) {
      // Resume with the remaining time, don't reset to initial value
      timeAttackCountdown = pausedTimerStates.timeAttackCountdown;
      updateTimerDisplay(timeAttackCountdown, '');
      
      // Start countdown - tick sound will play once per second during countdown
      timeAttackInterval = setInterval(() => {
        timeAttackCountdown--;
        updateTimerDisplay(timeAttackCountdown, '');
        
        // Play tick sound once per second
        playTickSound();
        
        if (timeAttackCountdown <= 0) {
          clearInterval(timeAttackInterval);
          // Auto-fail the question if time runs out
          timeAttackTimeOut();
        }
      }, 1000);
    }
  }
  
  // Resume BPM Challenge timer if it was active
  if (pausedTimerStates.wasTotalTimerActive) {
    startTotalTimer();
  }
  
  // Resume metronome if it was active
  if (pausedTimerStates.wasMetronomeActive) {
    startMetronome();
  }
}
