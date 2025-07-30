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
      pianoUI: '#piano-ui',
      
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

const domManager = new DOMManager();