// ================================
// Scale Driller - Refactored JavaScript
// ================================

// ================================
// 1. Configuration and Constants
// ================================
const CONFIG = {
  levels: ['easy', 'intermediate', 'hard'],
  keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F#', 'Ab', 'Bb', 'Db', 'Eb'],
  notes: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  scaleSteps: {
    major: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2]
  },
  audio: {
    tickVolume: 0.02,
    correctVolume: 0.05,
    incorrectVolume: 0.05,
    frequencies: {
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
    }
  },
  timer: {
    defaultTicks: 100,
    practiceTicks: 600,
    defaultBpm: 180,
    maxBpm: 240,
    tickPenalty: 10,
    streakThreshold: 3
  },
  ui: {
    autoCloseResults: 10000,
    feedbackDuration: 1000,
    correctFeedbackDuration: 300,
    incorrectFeedbackDuration: 2000
  }
};

// ================================
// 2. State Management
// ================================
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.quiz = {
      data: [],
      currentIndex: 0,
      correctAnswers: 0,
      active: false,
      startTime: null
    };
    
    this.timer = {
      totalTicks: CONFIG.timer.defaultTicks,
      currentBpm: CONFIG.timer.defaultBpm,
      levelStartBpm: CONFIG.timer.defaultBpm,
      correctStreak: 0,
      isPaused: false
    };
    
    this.input = {
      method: 'touch',
      audioActive: false,
      midiActive: false
    };
    
    this.mode = {
      type: 'BPM Challenge',
      timeAttack: {
        countdown: 0,
        interval: null
      }
    };
  }
}

// ================================
// 3. DOM Element Manager
// ================================
class DOMManager {
  constructor() {
    this.elements = this.cacheElements();
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  cacheElements() {
    const selectors = {
      // Cards
      settingsCard: '#settings-card',
      quizCard: '#quiz-card',
      resultsCard: '#results-card',
      
      // Controls
      levelSelect: '#level-select',
      difficultySelect: '#difficulty-select',
      keySelect: '#key-select',
      scaleChart: '#scale-chart',
      
      // Containers
      keyContainer: '#key-select-container',
      degreeContainer: '#degree-select-container',
      attackTimeContainer: '#attack-time-container',
      
      // Quiz UI
      questionDiv: '#quiz-question',
      answerButtons: '#answer-buttons',
      totalTimer: '#total-timer',
      helpBtn: '#help-btn',
      closeQuizBtn: '#close-quiz',
      playAgainBtn: '#play-again',
      
      // Timers
      fullscreenTimer: '#fullscreen-timer',
      timerDisplay: '#timer-display',
      timerLabel: '#timer-label',
      timeAttackX: '#time-attack-x',
      
      // Menu
      menuToggle: '#menu-toggle',
      dropdownMenu: '#dropdown-menu',
      menuClose: '#menu-close',
      timeModeIndicator: '#time-mode-indicator',
      
      // Results
      scoreSummary: '#score-summary'
    };

    const elements = {};
    Object.entries(selectors).forEach(([key, selector]) => {
      elements[key] = document.querySelector(selector);
    });
    
    return elements;
  }

  show(elementKey) {
    const element = this.elements[elementKey];
    if (element) element.classList.remove('hidden');
  }

  hide(elementKey) {
    const element = this.elements[elementKey];
    if (element) element.classList.add('hidden');
  }

  setText(elementKey, text) {
    const element = this.elements[elementKey];
    if (element) element.textContent = text;
  }

  setHTML(elementKey, html) {
    const element = this.elements[elementKey];
    if (element) element.innerHTML = html;
  }
}

// ================================
// 4. Timer System
// ================================
class TimerManager {
  constructor(gameState, domManager) {
    this.state = gameState;
    this.dom = domManager;
    this.intervals = new Map();
    this.timeouts = new Map();
  }

  setInterval(name, callback, delay) {
    this.clearInterval(name);
    const intervalId = setInterval(callback, delay);
    this.intervals.set(name, intervalId);
    return intervalId;
  }

  setTimeout(name, callback, delay) {
    this.clearTimeout(name);
    const timeoutId = setTimeout(callback, delay);
    this.timeouts.set(name, timeoutId);
    return timeoutId;
  }

  clearInterval(name) {
    if (this.intervals.has(name)) {
      clearInterval(this.intervals.get(name));
      this.intervals.delete(name);
    }
  }

  clearTimeout(name) {
    if (this.timeouts.has(name)) {
      clearTimeout(this.timeouts.get(name));
      this.timeouts.delete(name);
    }
  }

  clearAll() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.intervals.clear();
    this.timeouts.clear();
  }

  startMainTimer() {
    this.clearAll();
    
    // Set initial ticks based on mode
    if (this.state.mode.type === 'Practice Mode') {
      this.state.timer.totalTicks = CONFIG.timer.practiceTicks;
    } else {
      this.state.timer.totalTicks = CONFIG.timer.defaultTicks;
    }
    
    this.updateDisplay();
    this.startTickTimer();
    
    if (this.state.mode.type === 'BPM Challenge') {
      this.startMetronome();
    }
  }

  startTickTimer() {
    const tickLoop = () => {
      if (!this.state.quiz.active || this.state.timer.totalTicks <= 0) {
        this.clearInterval('mainTick');
        this.state.quiz.active = false;
        game.endQuiz();
        return;
      }

      this.state.timer.totalTicks--;
      audioManager.playTickSound();
      this.updateDisplay();

      const interval = (60 / this.state.timer.currentBpm) * 1000;
      this.setInterval('mainTick', tickLoop, interval);
    };

    const interval = (60 / this.state.timer.currentBpm) * 1000;
    this.setInterval('mainTick', tickLoop, interval);
  }

  updateDisplay() {
    const { totalTicks, currentBpm } = this.state.timer;
    const isPracticeMode = this.state.mode.type === 'Practice Mode';
    
    let displayText;
    if (isPracticeMode) {
      displayText = `Ticks: ${totalTicks} remaining | Practice Mode`;
    } else {
      displayText = `Ticks: ${totalTicks} remaining | BPM: ${currentBpm}`;
    }
    
    this.dom.setText('totalTimer', displayText);
    this.dom.elements.totalTimer.style.color = totalTicks <= 5 ? 'red' : 'black';
    
    this.updateFullscreenTimer();
    this.updateQuizBackground();
  }

  updateFullscreenTimer() {
    if (!this.dom.elements.timerDisplay || !this.dom.elements.timerLabel) return;
    
    const isTimeAttack = this.state.mode.type === 'Time Attack';
    const isPracticeMode = this.state.mode.type === 'Practice Mode';
    
    if (!isTimeAttack && !isPracticeMode) {
      this.updateTimerDisplay(this.state.timer.totalTicks, '');
    } else if (isPracticeMode) {
      this.updateTimerDisplay(this.state.timer.totalTicks, 'TICKS');
    }
  }

  updateTimerDisplay(number, label) {
    this.dom.setText('timerDisplay', number);
    this.dom.setText('timerLabel', label);
  }

  updateQuizBackground() {
    const maxTicks = CONFIG.timer.defaultTicks;
    const progress = Math.max(0, Math.min(1, this.state.timer.totalTicks / maxTicks));
    const red = Math.round(255 * (1 - progress));
    const blue = Math.round(255 * progress);
    const bgColor = `rgb(${red}, 0, ${blue})`;
    
    const quizCard = this.dom.elements.quizCard;
    if (quizCard) {
      quizCard.style.transition = 'background-color 0.3s ease';
      quizCard.style.backgroundColor = bgColor;
    }
  }

  addTicksForCorrect() {
    this.state.timer.correctStreak++;
    
    if (this.state.timer.correctStreak % CONFIG.timer.streakThreshold === 0) {
      if (this.state.timer.currentBpm >= CONFIG.timer.maxBpm) {
        this.state.timer.levelStartBpm += 10;
        this.state.timer.currentBpm = this.state.timer.levelStartBpm;
        notificationManager.show(`🔥 Level Up!\n\nNow at BPM: ${this.state.timer.currentBpm}`, 'success');
      } else {
        this.state.timer.currentBpm += 10;
      }
    }

    const difficulty = parseInt(this.dom.elements.difficultySelect?.value || 4);
    const difficultyModifier = Math.floor((6 - difficulty) / 2);
    
    let bonus = 3 + difficultyModifier;
    if (this.state.timer.currentBpm >= 100 && this.state.timer.currentBpm < 160) bonus = 4 + difficultyModifier;
    else if (this.state.timer.currentBpm >= 160 && this.state.timer.currentBpm < 210) bonus = 5 + difficultyModifier;
    else if (this.state.timer.currentBpm >= 210) bonus = 6 + difficultyModifier;
    
    this.state.timer.totalTicks += Math.max(1, bonus);
    this.updateDisplay();
  }

  subtractTicksForWrong() {
    this.state.timer.correctStreak = 0;
    this.state.timer.totalTicks = Math.max(0, this.state.timer.totalTicks - CONFIG.timer.tickPenalty);
    this.updateDisplay();
  }

  startMetronome() {
    let total = this.state.quiz.data.length;
    let baseBpm = 60, maxBpm = 150;
    this.clearInterval('metronome');
    
    const getProgress = () => this.state.quiz.currentIndex / total;
    function tick() {
      if (!this.state.quiz.active || this.state.quiz.currentIndex >= total) {
        this.clearInterval('metronome');
        return;
      }
      const bpm = baseBpm + (maxBpm - baseBpm) * getProgress();
      const interval = (60 / bpm) * 1000;
      this.setInterval('metronome', tick, interval);
    }
    tick();
  }

  pause() {
    this.state.timer.isPaused = true;
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
  }

  resume() {
    if (!this.state.timer.isPaused) return;
    this.state.timer.isPaused = false;
    
    if (this.state.quiz.active && this.state.timer.totalTicks > 0) {
      this.startTickTimer();
    }
    
    if (this.state.mode.type === 'BPM Challenge') {
      this.startMetronome();
    }
  }
}

// ================================
// 5. Audio Manager
// ================================
class AudioManager {
  constructor(domManager) {
    this.dom = domManager;
    this.context = domManager.audioContext;
  }

  playTone(frequency, duration = 0.15, volume = 0.1) {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  playCorrectSound() {
    this.playTone(880, 0.15, CONFIG.audio.correctVolume);
  }

  playIncorrectSound() {
    const duration = 0.2;
    const tone1 = 880;
    const tone2 = tone1 / Math.pow(2, 1 / 12);
    
    this.playTone(tone1, duration, CONFIG.audio.incorrectVolume);
    setTimeout(() => {
      this.playTone(tone2, duration, CONFIG.audio.incorrectVolume);
    }, duration * 1000);
  }

  playTickSound() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, this.context.currentTime);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    gain.gain.setValueAtTime(CONFIG.audio.tickVolume, this.context.currentTime);
    
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.05);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

// ================================
// 6. Notification Manager
// ================================
class NotificationManager {
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    const colors = {
      success: { bg: 'linear-gradient(135deg, #28a745, #20c997)', border: '#28a745' },
      warning: { bg: 'linear-gradient(135deg, #ffc107, #fd7e14)', border: '#ffc107' },
      error: { bg: 'linear-gradient(135deg, #dc3545, #e74c3c)', border: '#dc3545' },
      info: { bg: 'linear-gradient(135deg, #007bff, #0056b3)', border: '#007bff' }
    };
    
    const color = colors[type] || colors.info;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      border-left: 4px solid ${color.border};
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      white-space: pre-line;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, duration);
    }
    
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }
}

// ================================
// 7. Quiz Manager
// ================================
class QuizManager {
  constructor(gameState, domManager, timerManager, audioManager) {
    this.state = gameState;
    this.dom = domManager;
    this.timer = timerManager;
    this.audio = audioManager;
  }

  generate(level, count) {
    this.state.quiz.data = [];
    const selectedDegree = +document.getElementById('degree-select')?.value;
    let fixedKey;
    
    if (level === 'easy') {
      fixedKey = this.dom.elements.keySelect.value === 'random' 
        ? this.randomChoice(CONFIG.keys) 
        : this.dom.elements.keySelect.value;
    }
    
    for (let i = 0; i < count; i++) {
      let degree, key;
      
      if (level === 'degree-training') {
        degree = selectedDegree;
        key = this.randomChoice(CONFIG.keys);
      } else {
        degree = Math.floor(Math.random() * 7) + 1;
        key = (level === 'easy') ? fixedKey : this.randomChoice(CONFIG.keys);
      }
      
      const scale = this.getScale(key);
      const isDegreeLevel = ['easy', 'intermediate', 'degree-training'].includes(level);
      
      if (isDegreeLevel) {
        let options = scale.filter(n => n !== scale[degree - 1]);
        options = this.shuffle(options).slice(0, 4);
        options.push(scale[degree - 1]);
        options = this.shuffle(options);
        
        this.state.quiz.data.push({
          question: `What is degree ${degree} in the key of ${key}?`,
          answer: scale[degree - 1],
          options: options
        });
      } else if (level === 'hard') {
        const note = scale[degree - 1];
        let options = CONFIG.keys.filter(k => k !== key);
        options = this.shuffle(options).slice(0, 4);
        options.push(key);
        options = this.shuffle(options);
        
        this.state.quiz.data.push({
          question: `${note} is the ${degree} degree of what key?`,
          answer: key,
          options: options
        });
      }
    }
  }

  getScale(key) {
    const scaleTypeElem = document.getElementById('scale-type');
    if (!scaleTypeElem) return [];
    
    const scaleType = scaleTypeElem.value;
    const steps = CONFIG.scaleSteps[scaleType] || CONFIG.scaleSteps.major;
    let start = CONFIG.notes.indexOf(key);
    
    if (start === -1) return [];
    
    let scale = [key];
    for (let step of steps) {
      start = (start + step) % 12;
      scale.push(CONFIG.notes[start]);
    }
    
    return scale.slice(0, 7);
  }

  showQuestion() {
    const currentQuestion = this.state.quiz.data[this.state.quiz.currentIndex];
    if (!currentQuestion) return;
    
    this.timer.clearTimeout('question');
    this.timer.clearInterval('timeAttack');
    
    // Handle time attack countdown
    const isTimeAttack = this.state.mode.type === 'Time Attack';
    const isPracticeMode = this.state.mode.type === 'Practice Mode';
    
    if (isTimeAttack || (isPracticeMode && document.getElementById('attack-time-select').value)) {
      this.startTimeAttackCountdown();
    }
    
    this.dom.setText('questionDiv', currentQuestion.question);
    this.dom.setHTML('answerButtons', '');
    
    currentQuestion.options.forEach(option => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.onclick = () => {
        btn.blur();
        btn.classList.remove('hover');
        this.checkAnswer(option);
      };
      this.dom.elements.answerButtons.appendChild(btn);
    });
  }

  checkAnswer(selected) {
    this.timer.clearTimeout('question');
    this.timer.clearInterval('timeAttack');
    
    const currentQuestion = this.state.quiz.data[this.state.quiz.currentIndex];
    const correct = currentQuestion.answer;
    const isCorrect = selected === correct;
    
    const buttons = [...this.dom.elements.answerButtons.querySelectorAll('button')];
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correct) btn.classList.add('correct');
      if (btn.textContent === selected && !isCorrect) btn.classList.add('incorrect');
    });
    
    if (isCorrect) {
      this.audio.playCorrectSound();
      this.timer.addTicksForCorrect();
      this.state.quiz.correctAnswers++;
    } else {
      this.audio.playIncorrectSound();
      this.showTimeAttackX();
      this.timer.subtractTicksForWrong();
    }
    
    this.timer.setTimeout('nextQuestion', () => this.nextQuestion(), CONFIG.ui.feedbackDuration);
  }

  nextQuestion() {
    this.state.quiz.currentIndex++;
    const elapsedTime = (performance.now() - this.state.quiz.startTime) / 1000;
    
    if (this.state.quiz.active && elapsedTime >= 180) {
      this.end();
    } else if (this.state.quiz.currentIndex < this.state.quiz.data.length) {
      this.showQuestion();
    } else {
      this.end();
    }
  }

  end() {
    const best = Math.max(this.state.quiz.correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);
    
    this.dom.hide('quizCard');
    this.dom.elements.quizCard.classList.remove('full-width');
    this.timer.clearAll();
    
    this.dom.show('resultsCard');
    this.displayResults(best);
    
    // Auto-close results
    setTimeout(() => {
      this.dom.hide('resultsCard');
      this.dom.show('settingsCard');
    }, CONFIG.ui.autoCloseResults);
  }

  displayResults(best) {
    const elapsedTime = ((performance.now() - this.state.quiz.startTime) / 1000).toFixed(1);
    const attemptedCount = this.state.quiz.currentIndex + 1;
    
    const html = `
      <div style="font-size: 1.2em; margin-bottom: 16px;">🏆 Best Score: <strong>${best}</strong></div>
      <div>✅ Correct: <strong>${this.state.quiz.correctAnswers}</strong></div>
      <div>❌ Incorrect: <strong>${attemptedCount - this.state.quiz.correctAnswers}</strong></div>
      <div>⏱️ Time: <strong>${elapsedTime}</strong> seconds</div>
    `;
    
    this.dom.setHTML('scoreSummary', html);
  }

  showTimeAttackX() {
    const timeAttackX = this.dom.elements.timeAttackX;
    if (timeAttackX) {
      timeAttackX.classList.remove('hidden');
      timeAttackX.classList.add('show');
      
      setTimeout(() => {
        timeAttackX.classList.remove('show');
        timeAttackX.classList.add('hidden');
      }, 1000);
    }
  }

  // Utility methods
  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }
}

// ================================
// 8. Main Game Controller
// ================================
class Game {
  constructor() {
    this.state = new GameState();
    this.dom = new DOMManager();
    this.timer = new TimerManager(this.state, this.dom);
    this.audio = new AudioManager(this.dom);
    this.quiz = new QuizManager(this.state, this.dom, this.timer, this.audio);
    this.notification = new NotificationManager();
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeUI();
    this.setDefaultMode();
  }

  bindEvents() {
    // Quiz icon clicks
    document.querySelectorAll('.input-icon').forEach(icon => {
      icon.addEventListener('click', () => this.handleInputIconClick(icon));
    });

    // Menu events
    this.dom.elements.menuToggle?.addEventListener('click', (e) => this.toggleMenu(e));
    this.dom.elements.menuClose?.addEventListener('click', () => this.closeMenu());
    
    // Quiz controls
    this.dom.elements.closeQuizBtn?.addEventListener('click', () => this.closeQuiz());
    this.dom.elements.playAgainBtn?.addEventListener('click', () => this.playAgain());
    
    // Help system
    this.dom.elements.helpBtn?.addEventListener('click', () => this.showHelp());
    
    // Mode selections
    document.getElementById('time-attack-option')?.addEventListener('click', () => this.setMode('Time Attack'));
    document.getElementById('practice-mode-option')?.addEventListener('click', () => this.setMode('Practice Mode'));
    document.getElementById('bpm-challenge-option')?.addEventListener('click', () => this.setMode('BPM Challenge'));
  }

  handleInputIconClick(icon) {
    document.querySelectorAll('.input-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    this.startQuiz();
  }

  startQuiz() {
    if (!this.state.mode.type) {
      this.notification.show('⚠️ Please select a training mode first!\n\nUse the menu (☰) to choose a mode.', 'warning');
      return;
    }

    this.state.reset();
    this.state.quiz.startTime = performance.now();
    this.state.quiz.active = true;
    
    if (this.state.mode.type === 'Practice Mode') {
      this.state.timer.totalTicks = CONFIG.timer.practiceTicks;
    }
    
    if (this.audio.context.state === 'suspended') {
      this.audio.context.resume();
    }
    
    this.timer.startMainTimer();
    this.quiz.generate(this.dom.elements.levelSelect.value, 200);
    
    if (this.state.quiz.data.length === 0) {
      this.notification.show("⚠️ No questions generated.\n\nPlease check your settings.", 'warning');
      return;
    }
    
    this.dom.hide('settingsCard');
    this.dom.show('quizCard');
    this.dom.elements.quizCard.classList.add('full-width');
    this.dom.show('fullscreenTimer');
    this.quiz.showQuestion();
  }

  endQuiz() {
    this.quiz.end();
  }

  setMode(mode) {
    this.state.mode.type = mode;
    this.dom.setText('timeModeIndicator', mode);
    this.dom.show('timeModeIndicator');
    
    const messages = {
      'Time Attack': 'Time Attack activated!\n\nEach question must be answered within the selected time limit.',
      'Practice Mode': 'Practice Mode activated!\n\nPractice with 600 ticks. Optionally set time limit per question.',
      'BPM Challenge': 'BPM Challenge activated!\n\nAnswer speed increases with tempo progression.'
    };
    
    this.notification.show(messages[mode], 'success');
    this.closeMenu();
  }

  setDefaultMode() {
    this.setMode('BPM Challenge');
  }

  toggleMenu(e) {
    e.stopPropagation();
    this.dom.elements.dropdownMenu.classList.toggle('hidden');
    this.dom.elements.menuToggle.classList.toggle('active');
  }

  closeMenu() {
    this.dom.elements.dropdownMenu.classList.add('hidden');
    this.dom.elements.menuToggle.classList.remove('active');
  }

  closeQuiz() {
    this.timer.clearAll();
    this.state.quiz.active = false;
    
    this.dom.hide('quizCard');
    this.dom.elements.quizCard.classList.remove('full-width');
    this.dom.hide('fullscreenTimer');
    
    // Show results for current progress
    const best = Math.max(this.state.quiz.correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);
    this.dom.show('resultsCard');
    this.quiz.displayResults(best);
    this.dom.hide('settingsCard');
  }

  playAgain() {
    this.state.reset();
    this.timer.clearAll();
    
    this.dom.hide('resultsCard');
    this.dom.hide('quizCard');
    this.dom.elements.quizCard.classList.remove('full-width');
    this.dom.hide('fullscreenTimer');
    
    // Reset UI state
    document.querySelectorAll('.input-icon').forEach(icon => icon.classList.remove('selected'));
    
    setTimeout(() => {
      this.dom.show('settingsCard');
    }, 100);
  }

  showHelp() {
    if (this.state.timer.isPaused) return;
    this.timer.pause();
    
    // Show help modal logic here
    // ...existing help modal code...
  }

  initializeUI() {
    this.populateKeys();
    // ...existing UI initialization...
  }

  populateKeys() {
    if (!this.dom.elements.keySelect) return;
    
    this.dom.elements.keySelect.innerHTML = '';
    
    const randomOption = document.createElement('option');
    randomOption.value = 'random';
    randomOption.textContent = 'Random';
    randomOption.selected = true;
    this.dom.elements.keySelect.appendChild(randomOption);

    CONFIG.keys.forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      this.dom.elements.keySelect.appendChild(opt);
    });
  }
}

// ================================
// 9. Initialize Application
// ================================
let game, audioManager, notificationManager;

document.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  audioManager = game.audio;
  notificationManager = game.notification;
  
  // Auto-resume audio context on user interaction
  document.body.addEventListener('click', () => {
    if (audioManager.context.state === 'suspended') {
      audioManager.context.resume();
    }
  }, { once: true });
});

// ================================
// MIDI and Audio Input Functions
// ================================
let midiAccess = null;
let audioContext = null;
let analyser = null;
let microphone = null;
let audioInputActive = false;
let midiInputActive = false;

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
    showCustomNotification('Scale Driller v1.0\n\nA music theory training app for learning scales and their degrees.', 'info', 0);
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  document.getElementById('menu-help').addEventListener('click', () => {
    showCustomNotification('How to use:\n\n1. Select your training mode and settings\n2. Choose your instrument input type\n3. Start the quiz and answer questions\n4. Use the ? button during quiz for hints', 'info', 0);
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  document.getElementById('menu-fullscreen').addEventListener('click', () => {
    toggleFullscreen();
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
  });

  // YouTube-style fullscreen button event listener
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    toggleFullscreen();
  });

  // Fullscreen button tooltip handlers
  setupFullscreenTooltip();

  // Remove any title attributes that could cause tooltips
  removeAllTitleAttributes();

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
    
    // Set a default time limit for Time Attack (5 seconds)
    const attackTimeSelect = document.getElementById('attack-time-select');
    if (!attackTimeSelect.value || attackTimeSelect.value === '') {
      attackTimeSelect.value = '5';
    }
    
    // Update the time mode indicator
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    timeModeIndicator.textContent = 'Time Attack';
    timeModeIndicator.classList.remove('hidden');
    
    // Close the menu
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
    
    showCustomNotification('Time Attack activated!\n\nEach question must be answered within the selected time limit.', 'success');
  });

  // Handle Practice Mode selection
  document.getElementById('practice-mode-option').addEventListener('click', () => {
    // Show attack time container for Practice Mode (optional time pressure)
    attackTimeContainer.classList.remove('hidden');
    
    // Set "No Time Limit" as default for Practice Mode
    const attackTimeSelect = document.getElementById('attack-time-select');
    attackTimeSelect.value = '';
    
    // Update the time mode indicator
    const timeModeIndicator = document.getElementById('time-mode-indicator');
    timeModeIndicator.textContent = 'Practice Mode';
    timeModeIndicator.classList.remove('hidden');
    
    // Close the menu
    dropdownMenu.classList.add('hidden');
    menuToggle.classList.remove('active');
    
    showCustomNotification('Practice Mode activated!\n\nPractice with 600 ticks. Optionally set time limit per question.', 'success');
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
    
    showCustomNotification('BPM Challenge activated!\n\nAnswer speed increases with tempo progression.', 'success');
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
    
    showCustomNotification('BPM Challenge activated!\n\nAnswer speed increases with tempo progression.', 'success');
  });

  document.getElementById('menu-stats').addEventListener('click', () => {
    showCustomNotification('Statistics feature coming soon!', 'info');
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
    isPaused = false;
    
    // Restart all timers and sounds when resuming from help
    resumeTotalTimer();  // Resume tick timer without resetting count
    startMetronome();    // Restart metronome
    showQuestion();      // Restart question timers if needed
  });

  helpBtn.addEventListener('click', () => {
    if (isPaused) return;
    isPaused = true;
    
    // Stop all timers and intervals
    clearTimeout(timer);
    clearInterval(countdownInterval);
    clearInterval(timeAttackInterval);
    clearInterval(metronomeInterval);
    if (totalTimer && totalTimer.intervalId) {
      clearInterval(totalTimer.intervalId);
    }
    
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

// ================================
// Input Method Availability Management
// ================================
function updateInputMethodAvailability() {
  const inputMethods = {
    touch: { available: true, compatible: true },
    midi: { 
      available: navigator.requestMIDIAccess !== undefined,
      connected: midiAccess && Array.from(midiAccess.inputs.values()).length > 0,
      compatible: true 
    },
    audio: { 
      available: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
      connected: audioInputActive,
      compatible: true 
    },
    instrument: { 
      available: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
      connected: audioInputActive,
      compatible: true 
    }
  };

  // Update input method icons in menu
  Object.entries(inputMethods).forEach(([method, status]) => {
    const menuBtn = document.getElementById(`${method === 'instrument' ? 'cable' : method === 'audio' ? 'mic' : method}-input-btn`);
    if (menuBtn) {
      menuBtn.classList.toggle('unavailable', !status.available);
      menuBtn.disabled = !status.available;
      
      if (!status.available) {
        menuBtn.title = `${method} not supported on this device/browser`;
      } else if (method !== 'touch' && !status.connected) {
        menuBtn.title = `Click to connect ${method} device`;
      } else {
        menuBtn.title = `${method} ready`;
      }
    }
  });

  // Update input type icons based on current input method
  updateInputTypeCompatibility(currentInputMethod);
}

function updateInputTypeCompatibility(inputMethod) {
  const compatibilityMatrix = {
    touch: {
      keys: { available: true, compatible: true },
      piano: { available: true, compatible: true },
      bass: { available: true, compatible: true },
      guitar: { available: true, compatible: true }
    },
    midi: {
      keys: { available: false, compatible: false },
      piano: { available: true, compatible: true },
      bass: { available: true, compatible: true },
      guitar: { available: true, compatible: true }
    },
    audio: {
      keys: { available: false, compatible: false },
      piano: { available: true, compatible: true },
      bass: { available: true, compatible: true },
      guitar: { available: true, compatible: true }
    },
    instrument: {
      keys: { available: false, compatible: false },
      piano: { available: true, compatible: true },
      bass: { available: true, compatible: true },
      guitar: { available: true, compatible: true }
    }
  };

  const compatibility = compatibilityMatrix[inputMethod] || compatibilityMatrix.touch;

  document.querySelectorAll('.input-icon').forEach(icon => {
    const type = icon.dataset.type;
    const status = compatibility[type];
    
    icon.classList.toggle('unavailable', !status.available);
    icon.classList.toggle('incompatible', status.available && !status.compatible);
    
    if (!status.available) {
      icon.style.pointerEvents = 'none';
      icon.title = `${type} not available with ${inputMethod} input`;
    } else if (!status.compatible) {
      icon.style.pointerEvents = 'none';
      icon.title = `${type} not compatible with ${inputMethod} input`;
    } else {
      icon.style.pointerEvents = 'auto';
      icon.title = `Use ${type} interface`;
    }
  });
}

function updateQuizUIVisibility(inputType) {
  const container = document.getElementById('quiz-ui-container');
  if (!container) return;

  // Set data attribute for CSS targeting
  container.setAttribute('data-input', inputType);
  
  // Hide all instrument UIs first
  document.querySelectorAll('.instrument-ui').forEach(ui => {
    ui.classList.add('hidden');
  });

  // Show the appropriate UI
  const targetUI = document.getElementById(`${inputType}-ui`);
  if (targetUI) {
    targetUI.classList.remove('hidden');
    
    // Add loading state for external inputs
    if (['midi', 'audio'].includes(currentInputMethod)) {
      targetUI.classList.add('loading');
      setTimeout(() => {
        targetUI.classList.remove('loading');
      }, 1000);
    }
  }

  // Update UI state classes
  updateUIStates();
}

function updateUIStates() {
  const midiUI = document.getElementById('midi-ui');
  const audioUI = document.getElementById('audio-ui');

  if (midiUI) {
    const hasDevices = midiAccess && Array.from(midiAccess.inputs.values()).length > 0;
    midiUI.classList.toggle('connected', hasDevices);
    midiUI.classList.toggle('disconnected', !hasDevices);
  }

  if (audioUI) {
    audioUI.classList.toggle('connected', audioInputActive);
    audioUI.classList.toggle('disconnected', !audioInputActive);
  }
}

// ================================
// Enhanced Input Method Management
// ================================
function setInputMethod(inputType) {
  currentInputMethod = inputType;
  
  // Update availability states
  updateInputMethodAvailability();
  
  // If quiz is active, update the input UI
  if (!quizCard.classList.contains('hidden')) {
    const selectedIcon = document.querySelector('.input-icon.selected');
    const uiType = selectedIcon ? selectedIcon.dataset.type : 'keys';
    updateQuizUIVisibility(uiType);
  }
  
  console.log('Input method set to:', inputType);
}

// ================================
// Enhanced updateInputUI function
// ================================
function updateInputUI() {
  // Determine UI type based on current input method and selected icon
  let uiType;
  
  switch(currentInputMethod) {
    case 'touch':
      const selectedIcon = document.querySelector('.input-icon.selected');
      uiType = selectedIcon ? selectedIcon.dataset.type : 'keys';
      break;
    case 'midi':
      uiType = 'midi';
      break;
    case 'audio':
    case 'instrument':
      uiType = 'audio';
      break;
    default:
      uiType = 'keys';
  }
  
  console.log('Input method:', currentInputMethod, 'UI type:', uiType);
  
  updateQuizUIVisibility(uiType);
  
  // Create UI content for touch-based inputs
  if (currentInputMethod === 'touch') {
    createTouchUI(uiType);
  }
}

function createTouchUI(uiType) {
  if (uiType === 'keys') {
    document.getElementById('keys-ui')?.classList.remove('hidden');
  } else if (uiType === 'piano') {
    createPianoUI();
  } else if (uiType === 'bass') {
    createBassUI();
  }
  // Add guitar UI creation when needed
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
  
  // Check if we're in Time Attack mode or Practice Mode with time pressure
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
  const isPracticeMode = timeModeIndicator && timeModeIndicator.textContent === 'Practice Mode';
  
  // Start countdown for Time Attack or Practice Mode (if time is set)
  if (isTimeAttack || (isPracticeMode && document.getElementById('attack-time-select').value)) {
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
    addTicksForCorrect();
  } else {
    playIncorrectSound(); // Play incorrect sound for wrong answer
    showTimeAttackX(); // Show large X overlay for wrong answer
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
  // Ensure audio context is resumed before playing sound
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
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
  // Ensure audio context is resumed before playing sound
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
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
  // Ensure audio context is resumed before playing sound
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
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
}

// ================================
// 7. Notification System
// ================================
function showCustomNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `custom-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, duration);
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
    showTimeAttackX(); // Show large X overlay for wrong answer
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
  
  // Update availability states
  updateInputMethodAvailability();
  
  // If quiz is active, update the input UI
  if (!quizCard.classList.contains('hidden')) {
    const selectedIcon = document.querySelector('.input-icon.selected');
    const uiType = selectedIcon ? selectedIcon.dataset.type : 'keys';
    updateQuizUIVisibility(uiType);
  }
  
  console.log('Input method set to:', inputType);
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
  // Check if Practice Mode is active and preserve the 600 ticks
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isPracticeMode = timeModeIndicator && timeModeIndicator.textContent === 'Practice Mode';
  
  // Only reset ticks if not in Practice Mode (which sets 600 ticks)
  if (!isPracticeMode) {
    totalTicks = 100;
  }
  
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

// Resume the tick timer without resetting tick count (for help modal resume)
function resumeTotalTimer() {
  if (!quizActive || totalTicks <= 0) return;
  
  // Clear any existing timer first
  if (totalTimer && totalTimer.intervalId) {
    clearInterval(totalTimer.intervalId);
  }
  
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

  // Start the interval
  const interval = (60 / currentBpm) * 1000;
  totalTimer.intervalId = setInterval(tickLoop, interval);
}

function addTicksForCorrect() {
  correctStreak++;

  if (correctStreak > 0 && correctStreak % 3 === 0) {
    if (currentBpm >= 240) {
      levelStartBpm += 10;
      currentBpm = levelStartBpm;
      showCustomNotification(`🔥 Level Up!\n\nNow at BPM: ${currentBpm}`, 'success');
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
  
  // Check for Practice Mode to customize the display
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isPracticeMode = timeModeIndicator && timeModeIndicator.textContent === 'Practice Mode';
  
  if (isPracticeMode) {
    totalTimer.textContent = `� Ticks: ${totalTicks} remaining | Practice Mode`;
  } else {
    totalTimer.textContent = `�🎵 Ticks: ${totalTicks} remaining | BPM: ${currentBpm}`;
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
  
  // Check if we're in Time Attack mode or Practice Mode
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
  const isPracticeMode = timeModeIndicator && timeModeIndicator.textContent === 'Practice Mode';
  
  if (!isTimeAttack && !isPracticeMode) {
    // BPM Challenge mode (default/normal mode) - show remaining ticks (number only)
    console.log('Updating ticks display to:', totalTicks); // Debug log
    updateTimerDisplay(totalTicks, '');
  } else if (isPracticeMode) {
    // Practice Mode - show remaining ticks with TICKS label
    console.log('Updating Practice Mode ticks display to:', totalTicks); // Debug log
    updateTimerDisplay(totalTicks, 'TICKS');
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
  // Show large X overlay for timeout
  showTimeAttackX();
  
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
// Browser Fullscreen Functions
// ================================

function removeAllTitleAttributes() {
  // Remove title attributes from all elements to prevent browser tooltips
  document.querySelectorAll('[title]').forEach(element => {
    element.removeAttribute('title');
  });
  
  // Also remove any title attributes that might be added dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
        mutation.target.removeAttribute('title');
      }
    });
  });
  
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['title']
  });
}

function setupFullscreenTooltip() {
  if (!fullscreenBtn || !fullscreenTooltip) return;

  let tooltipTimeout;

  // Show tooltip on hover
  fullscreenBtn.addEventListener('mouseenter', () => {
    clearTimeout(tooltipTimeout);
    updateTooltipText();
    fullscreenTooltip.classList.remove('hidden');
    setTimeout(() => {
      fullscreenTooltip.classList.add('show');
    }, 10);
  });

  // Hide tooltip on mouse leave
  fullscreenBtn.addEventListener('mouseleave', () => {
    fullscreenTooltip.classList.remove('show');
    tooltipTimeout = setTimeout(() => {
      fullscreenTooltip.classList.add('hidden');
    }, 300);
  });

  // Hide tooltip on click
  fullscreenBtn.addEventListener('click', () => {
    fullscreenTooltip.classList.remove('show');
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      fullscreenTooltip.classList.add('hidden');
    }, 100);
  });

  // Hide tooltip on any user interaction elsewhere
  document.addEventListener('click', (e) => {
    if (!fullscreenBtn.contains(e.target) && !fullscreenTooltip.contains(e.target)) {
      fullscreenTooltip.classList.remove('show');
      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        fullscreenTooltip.classList.add('hidden');
      }, 300);
    }
  });

  // Hide tooltip on touch (mobile)
  document.addEventListener('touchstart', (e) => {
    if (!fullscreenBtn.contains(e.target) && !fullscreenTooltip.contains(e.target)) {
      fullscreenTooltip.classList.remove('show');
      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        fullscreenTooltip.classList.add('hidden');
      }, 300);
    }
  });
}

function updateTooltipText() {
  if (!fullscreenTooltipText) return;
  
  const isFullscreen = !!document.fullscreenElement;
  fullscreenTooltipText.textContent = isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // Enter fullscreen
    document.documentElement.requestFullscreen().then(() => {
      updateFullscreenButton(true);
      updateTooltipText();
    }).catch(err => {

      console.log('Error attempting to enable fullscreen:', err);
      showCustomNotification('Fullscreen not supported on this device/browser', 'warning');
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen().then(() => {
      updateFullscreenButton(false);
      updateTooltipText();
    }).catch(err => {
      console.log('Error attempting to exit fullscreen:', err);
    });
  }
}

function updateFullscreenButton(isFullscreen) {
  // Update menu button
  const fullscreenBtn = document.getElementById('menu-fullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.textContent = isFullscreen ? '🔲 Exit Fullscreen' : '🔳 Fullscreen';
 
  }
  
  // Update YouTube-style button
  const youtubeBtn = document.getElementById('fullscreen-btn');
  if (youtubeBtn) {
    // Don't set title attribute to prevent browser tooltips that interrupt fullscreen
    youtubeBtn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
    
    if (isFullscreen) {
      youtubeBtn.classList.add('exit');
      youtubeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      `;
    } else {
      youtubeBtn.classList.remove('exit');
      youtubeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
      `;
    }
  }
}

// Listen for fullscreen changes (including when user presses ESC)
document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton(!!document.fullscreenElement);
  updateTooltipText();
});
  
  if (isPracticeMode) {
    totalTimer.textContent = `� Ticks: ${totalTicks} remaining | Practice Mode`;
  } else {
    totalTimer.textContent = `�🎵 Ticks: ${totalTicks} remaining | BPM: ${currentBpm}`;
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
  
  // Check if we're in Time Attack mode or Practice Mode
  const timeModeIndicator = document.getElementById('time-mode-indicator');
  const isTimeAttack = timeModeIndicator && timeModeIndicator.textContent === 'Time Attack';
  const isPracticeMode = timeModeIndicator && timeModeIndicator.textContent === 'Practice Mode';
  
  if (!isTimeAttack && !isPracticeMode) {
    // BPM Challenge mode (default/normal mode) - show remaining ticks (number only)
    console.log('Updating ticks display to:', totalTicks); // Debug log
    updateTimerDisplay(totalTicks, '');
  } else if (isPracticeMode) {
    // Practice Mode - show remaining ticks with TICKS label
    console.log('Updating Practice Mode ticks display to:', totalTicks); // Debug log
    updateTimerDisplay(totalTicks, 'TICKS');
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
  // Show large X overlay for timeout
  showTimeAttackX();
  
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
// Browser Fullscreen Functions
// ================================

function removeAllTitleAttributes() {
  // Remove title attributes from all elements to prevent browser tooltips
  document.querySelectorAll('[title]').forEach(element => {
    element.removeAttribute('title');
  });
  
  // Also remove any title attributes that might be added dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
        mutation.target.removeAttribute('title');
      }
    });
  });
  
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['title']
  });
}

function setupFullscreenTooltip() {
  if (!fullscreenBtn || !fullscreenTooltip) return;

  let tooltipTimeout;

  // Show tooltip on hover
  fullscreenBtn.addEventListener('mouseenter', () => {
    clearTimeout(tooltipTimeout);
    updateTooltipText();
    fullscreenTooltip.classList.remove('hidden');
    setTimeout(() => {
      fullscreenTooltip.classList.add('show');
    }, 10);
  });

  // Hide tooltip on mouse leave
  fullscreenBtn.addEventListener('mouseleave', () => {
    fullscreenTooltip.classList.remove('show');
    tooltipTimeout = setTimeout(() => {
      fullscreenTooltip.classList.add('hidden');
    }, 300);
  });

  // Hide tooltip on click
  fullscreenBtn.addEventListener('click', () => {
    fullscreenTooltip.classList.remove('show');
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      fullscreenTooltip.classList.add('hidden');
    }, 100);
  });

  // Hide tooltip on any user interaction elsewhere
  document.addEventListener('click', (e) => {
    if (!fullscreenBtn.contains(e.target) && !fullscreenTooltip.contains(e.target)) {
      fullscreenTooltip.classList.remove('show');
      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        fullscreenTooltip.classList.add('hidden');
      }, 300);
    }
  });

  // Hide tooltip on touch (mobile)
  document.addEventListener('touchstart', (e) => {
    if (!fullscreenBtn.contains(e.target) && !fullscreenTooltip.contains(e.target)) {
      fullscreenTooltip.classList.remove('show');
      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        fullscreenTooltip.classList.add('hidden');
      }, 300);
    }
  });
}

function updateTooltipText() {
  if (!fullscreenTooltipText) return;
  
  const isFullscreen = !!document.fullscreenElement;
  fullscreenTooltipText.textContent = isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // Enter fullscreen
    document.documentElement.requestFullscreen().then(() => {
      updateFullscreenButton(true);
      updateTooltipText();
    }).catch(err => {

      console.log('Error attempting to enable fullscreen:', err);
      showCustomNotification('Fullscreen not supported on this device/browser', 'warning');
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen().then(() => {
      updateFullscreenButton(false);
      updateTooltipText();
    }).catch(err => {
      console.log('Error attempting to exit fullscreen:', err);
    });
  }
}

function updateFullscreenButton(isFullscreen) {
  // Update menu button
  const fullscreenBtn = document.getElementById('menu-fullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.textContent = isFullscreen ? '🔲 Exit Fullscreen' : '🔳 Fullscreen';
 
  }
  
  // Update YouTube-style button
  const youtubeBtn = document.getElementById('fullscreen-btn');
  if (youtubeBtn) {
    // Don't set title attribute to prevent browser tooltips that interrupt fullscreen
    youtubeBtn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
    
    if (isFullscreen) {
      youtubeBtn.classList.add('exit');
      youtubeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      `;
    } else {
      youtubeBtn.classList.remove('exit');
      youtubeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
      `;
    }
  }
}

// Listen for fullscreen changes (including when user presses ESC)
document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton(!!document.fullscreenElement);
  updateTooltipText();
});
